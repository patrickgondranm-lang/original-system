-- ============================================================
--  ORIGINAL EXTENSION — Supabase Database Setup
--  Execute no SQL Editor do Supabase (supabase.com → SQL Editor)
-- ============================================================

-- ── 1. Tabela de licenças ────────────────────────────────────
CREATE TABLE IF NOT EXISTS licenses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key     TEXT UNIQUE NOT NULL,
  email           TEXT,
  plan            TEXT DEFAULT 'pro' CHECK (plan IN ('trial','pro','lifetime')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','expired','pending')),
  max_activations INT DEFAULT 1,
  activations     INT DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  activated_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  last_seen_at    TIMESTAMPTZ
);

-- ── 2. Tabela de sessões ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS license_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id  UUID REFERENCES licenses(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  device_info TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_used   TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ── 3. Tabela de logs de uso ─────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id  UUID REFERENCES licenses(id) ON DELETE SET NULL,
  email       TEXT,
  action      TEXT NOT NULL,  -- 'validate', 'activate', 'send_message', etc.
  details     JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Tabela de admin users ─────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- bcrypt
  role       TEXT DEFAULT 'admin' CHECK (role IN ('admin','superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ── 5. Tabela de configurações ───────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('extension_version', '"1.0.0"'),
  ('trial_days', '7'),
  ('max_messages_per_day', '999')
ON CONFLICT (key) DO NOTHING;

-- ── 6. RLS (Row Level Security) ──────────────────────────────
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode ler/escrever tudo (backend/admin)
-- anon key só pode chamar as Edge Functions (não acesso direto às tabelas)
CREATE POLICY "service_role_all_licenses" ON licenses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_sessions" ON license_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_logs" ON usage_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_admins" ON admin_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 7. Índices para performance ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_licenses_key     ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_email   ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_status  ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_sessions_token   ON license_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_license ON license_sessions(license_id);
CREATE INDEX IF NOT EXISTS idx_logs_license     ON usage_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_logs_created     ON usage_logs(created_at DESC);

-- ── 8. Função: gerar chave de licença ────────────────────────
CREATE OR REPLACE FUNCTION generate_license_key(prefix TEXT DEFAULT 'ORIG')
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  segment TEXT;
  full_key TEXT := prefix || '-';
  i INT;
  j INT;
BEGIN
  FOR i IN 1..3 LOOP
    segment := '';
    FOR j IN 1..4 LOOP
      segment := segment || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    full_key := full_key || segment;
    IF i < 3 THEN full_key := full_key || '-'; END IF;
  END LOOP;
  RETURN full_key;
END;
$$ LANGUAGE plpgsql;

-- ── 9. Função: criar licença com chave auto-gerada ───────────
CREATE OR REPLACE FUNCTION create_license(
  p_email TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT 'pro',
  p_max_activations INT DEFAULT 1,
  p_expires_days INT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS licenses AS $$
DECLARE
  new_key TEXT;
  new_license licenses;
  attempt INT := 0;
BEGIN
  LOOP
    new_key := generate_license_key();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM licenses WHERE license_key = new_key);
    attempt := attempt + 1;
    IF attempt > 10 THEN RAISE EXCEPTION 'Could not generate unique key'; END IF;
  END LOOP;

  INSERT INTO licenses (license_key, email, plan, max_activations, expires_at, notes)
  VALUES (
    new_key, p_email, p_plan, p_max_activations,
    CASE WHEN p_expires_days IS NOT NULL THEN NOW() + (p_expires_days || ' days')::INTERVAL ELSE NULL END,
    p_notes
  )
  RETURNING * INTO new_license;

  RETURN new_license;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 10. Inserir admin padrão (altere a senha!) ───────────────
-- Senha padrão: Original@2025 (troque após o primeiro login)
-- Para gerar hash bcrypt real, use a Edge Function ou um site bcrypt online
INSERT INTO admin_users (email, password_hash, role)
VALUES ('admin@original.com', '$2a$10$placeholder_change_this_hash', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- ── Verificação final ────────────────────────────────────────
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('licenses','license_sessions','usage_logs','admin_users','app_settings');
