-- ============================================
-- ORIGINAL SYSTEM - SETUP DO BANCO DE DADOS
-- ============================================
-- Este script apaga todas as tabelas existentes e cria a estrutura necessária

-- APAGAR TODAS AS TABELAS EXISTENTES (cuidado!)
DROP TABLE IF EXISTS license_usage CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- ============================================
-- TABELA DE ADMINISTRADORES
-- ============================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    is_super_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TABELA DE USUÁRIOS (CLIENTES)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    document VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admins(id),
    notes TEXT
);

-- ============================================
-- TABELA DE LICENÇAS/CHAVES
-- ============================================
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    license_type VARCHAR(50) NOT NULL, -- 'trial', 'monthly', 'yearly', 'lifetime'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'suspended', 'revoked'
    max_devices INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admins(id),
    notes TEXT
);

-- ============================================
-- TABELA DE USO DE LICENÇAS (DISPOSITIVOS)
-- ============================================
CREATE TABLE license_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(100),
    ip_address VARCHAR(50),
    first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(license_id, device_id)
);

-- ============================================
-- TABELA DE LOGS DE AUDITORIA
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admins(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_license_usage_license_id ON license_usage(license_id);
CREATE INDEX idx_license_usage_device_id ON license_usage(device_id);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERIR ADMIN PADRÃO
-- ============================================
-- Senha padrão: Admin@123 (TROCAR IMEDIATAMENTE!)
-- Hash gerado com bcrypt
INSERT INTO admins (username, password_hash, email, full_name, is_super_admin, is_active)
VALUES (
    'admin',
    '$2a$10$rYvK9T5OzYKoHRQJGKF3sOp.MH7iYxGP/iZJYf7aLzWPjVxXQf0Qq',
    'admin@original.com',
    'Administrador Principal',
    true,
    true
);

-- ============================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTAR SE NÃO QUISER)
-- ============================================

-- Usuário exemplo
INSERT INTO users (email, full_name, phone, document)
VALUES ('cliente@example.com', 'Cliente Exemplo', '11999999999', '123.456.789-00');

-- Licença exemplo
INSERT INTO licenses (license_key, user_id, license_type, status, max_devices, expires_at)
SELECT 
    'ORIG-' || substring(md5(random()::text) from 1 for 8) || '-' || substring(md5(random()::text) from 1 for 8),
    id,
    'monthly',
    'active',
    2,
    NOW() + INTERVAL '30 days'
FROM users WHERE email = 'cliente@example.com';

-- ============================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ============================================
-- Descomente se quiser usar RLS

-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE license_usage ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de licenças com informações do usuário
CREATE OR REPLACE VIEW v_licenses_full AS
SELECT 
    l.id,
    l.license_key,
    l.license_type,
    l.status,
    l.max_devices,
    l.is_active,
    l.created_at,
    l.activated_at,
    l.expires_at,
    l.last_used_at,
    u.email as user_email,
    u.full_name as user_name,
    u.phone as user_phone,
    (SELECT COUNT(*) FROM license_usage WHERE license_id = l.id AND is_active = true) as active_devices,
    CASE 
        WHEN l.expires_at IS NOT NULL AND l.expires_at < NOW() THEN true
        ELSE false
    END as is_expired
FROM licenses l
LEFT JOIN users u ON l.user_id = u.id;

-- View de estatísticas
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM licenses WHERE is_active = true) as total_licenses,
    (SELECT COUNT(*) FROM licenses WHERE is_active = true AND status = 'active') as active_licenses,
    (SELECT COUNT(*) FROM licenses WHERE expires_at IS NOT NULL AND expires_at < NOW()) as expired_licenses,
    (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
    (SELECT COUNT(DISTINCT device_id) FROM license_usage WHERE is_active = true) as total_devices,
    (SELECT COUNT(*) FROM licenses WHERE created_at > NOW() - INTERVAL '7 days') as licenses_last_7_days,
    (SELECT COUNT(*) FROM licenses WHERE created_at > NOW() - INTERVAL '30 days') as licenses_last_30_days;

-- ============================================
-- FUNÇÃO PARA GERAR CHAVE DE LICENÇA
-- ============================================
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS VARCHAR(255) AS $$
DECLARE
    new_key VARCHAR(255);
    key_exists BOOLEAN;
BEGIN
    LOOP
        new_key := 'ORIG-' || 
                   upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
                   upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
                   upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
                   upper(substring(md5(random()::text) from 1 for 4));
        
        SELECT EXISTS(SELECT 1 FROM licenses WHERE license_key = new_key) INTO key_exists;
        
        EXIT WHEN NOT key_exists;
    END LOOP;
    
    RETURN new_key;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO PARA VALIDAR LICENÇA
-- ============================================
CREATE OR REPLACE FUNCTION validate_license(p_license_key VARCHAR(255))
RETURNS TABLE(
    is_valid BOOLEAN,
    license_id UUID,
    user_email VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_devices INTEGER,
    active_devices BIGINT,
    message TEXT
) AS $$
DECLARE
    v_license RECORD;
    v_device_count BIGINT;
BEGIN
    SELECT l.*, u.email as user_email
    INTO v_license
    FROM licenses l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.license_key = p_license_key;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::TIMESTAMP WITH TIME ZONE, 
                            NULL::INTEGER, NULL::BIGINT, 'Licença não encontrada'::TEXT;
        RETURN;
    END IF;
    
    IF NOT v_license.is_active THEN
        RETURN QUERY SELECT false, v_license.id, v_license.user_email, v_license.expires_at,
                            v_license.max_devices, NULL::BIGINT, 'Licença inativa'::TEXT;
        RETURN;
    END IF;
    
    IF v_license.status != 'active' THEN
        RETURN QUERY SELECT false, v_license.id, v_license.user_email, v_license.expires_at,
                            v_license.max_devices, NULL::BIGINT, 'Status da licença: ' || v_license.status;
        RETURN;
    END IF;
    
    IF v_license.expires_at IS NOT NULL AND v_license.expires_at < NOW() THEN
        RETURN QUERY SELECT false, v_license.id, v_license.user_email, v_license.expires_at,
                            v_license.max_devices, NULL::BIGINT, 'Licença expirada'::TEXT;
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO v_device_count
    FROM license_usage
    WHERE license_id = v_license.id AND is_active = true;
    
    RETURN QUERY SELECT true, v_license.id, v_license.user_email, v_license.expires_at,
                        v_license.max_devices, v_device_count, 'Licença válida'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CONFIGURAÇÃO COMPLETA!
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Credenciais do admin padrão:
-- Username: admin
-- Password: Admin@123
-- Email: admin@original.com
-- 
-- ⚠️ IMPORTANTE: Troque a senha imediatamente após o primeiro login!
