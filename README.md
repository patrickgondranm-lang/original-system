# 🔥 ORIGINAL SYSTEM - Sistema de Gerenciamento de Licenças

Sistema completo de gerenciamento de licenças/chaves com painel administrativo moderno e intuitivo.

## 📋 Índice

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração do Supabase](#configuração-do-supabase)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Credenciais Padrão](#credenciais-padrão)
- [API](#api)
- [Segurança](#segurança)

## ✨ Características

- 🔐 **Sistema de Autenticação** - Login seguro para administradores
- 📊 **Dashboard Completo** - Estatísticas em tempo real
- 🔑 **Gerador de Licenças** - Crie múltiplas chaves com um clique
- 👥 **Gerenciamento de Usuários** - Controle total dos clientes
- 📝 **Logs de Auditoria** - Rastreie todas as ações do sistema
- 🎨 **Interface Moderna** - Design responsivo e intuitivo
- ⚡ **Performance** - Otimizado com Supabase

## 📦 Requisitos

- Conta no Supabase (gratuita)
- Servidor web (Apache, Nginx, ou similar)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🚀 Instalação

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Seu projeto já está configurado: `vqrwjassqebxjtnzppku`
3. Acesse o **SQL Editor** no painel do Supabase
4. Copie todo o conteúdo do arquivo `supabase_setup.sql`
5. Cole no SQL Editor e execute (clique em "Run")
6. Aguarde a conclusão (você verá a mensagem de sucesso)

### 2. Verificar Credenciais

As credenciais já estão configuradas no arquivo `config/supabase.config.js`:

```javascript
url: 'https://vqrwjassqebxjtnzppku.supabase.co'
anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 3. Adicionar o Logo

1. Coloque sua logo na pasta `assets/`
2. Renomeie para `logo.png`
3. O logo aparecerá automaticamente no sistema

### 4. Fazer Upload dos Arquivos

#### Opção A: Servidor Web Local
```bash
# Copie todos os arquivos para o diretório do servidor
cp -r original-system/* /var/www/html/original/
```

#### Opção B: Servidor de Hospedagem
1. Faça upload via FTP de todos os arquivos
2. Certifique-se de manter a estrutura de pastas

#### Opção C: Servidor Local para Testes
```bash
# Usando Python
cd original-system
python -m http.server 8000

# Ou usando Node.js (http-server)
npx http-server -p 8000
```

Acesse: `http://localhost:8000`

## 🔧 Configuração do Supabase

### O que o SQL faz:

1. **Apaga todas as tabelas existentes** (cuidado!)
2. **Cria a estrutura completa**:
   - `admins` - Administradores do sistema
   - `users` - Usuários/Clientes
   - `licenses` - Licenças/Chaves
   - `license_usage` - Dispositivos usando as licenças
   - `audit_logs` - Logs de auditoria

3. **Cria views e funções úteis**:
   - `v_licenses_full` - Licenças com informações completas
   - `v_dashboard_stats` - Estatísticas do dashboard
   - `generate_license_key()` - Gera chave única
   - `validate_license()` - Valida uma licença

4. **Insere admin padrão**:
   - Username: `admin`
   - Password: `Admin@123`
   - Email: `admin@original.com`

### Tabelas Criadas:

| Tabela | Descrição |
|--------|-----------|
| **admins** | Administradores com acesso ao painel |
| **users** | Clientes/usuários finais |
| **licenses** | Chaves de licença |
| **license_usage** | Dispositivos usando cada licença |
| **audit_logs** | Histórico de ações |

## 💻 Como Usar

### 1. Primeiro Acesso

1. Acesse o sistema no navegador
2. Faça login com:
   - **Usuário:** `admin`
   - **Senha:** `Admin@123`
3. ⚠️ **IMPORTANTE:** Troque a senha imediatamente!

### 2. Gerar Licenças

1. No menu lateral, clique em **"Gerar Chaves"**
2. Preencha o formulário:
   - **Tipo de Licença:** Trial, Mensal, Anual ou Vitalícia
   - **Max Dispositivos:** Quantos dispositivos podem usar
   - **Email/Nome:** (opcional) Vincular a um usuário
   - **Quantidade:** Quantas chaves gerar
3. Clique em **"Gerar Licenças"**
4. Copie as chaves geradas

### 3. Tipos de Licença

| Tipo | Duração | Descrição |
|------|---------|-----------|
| **Trial** | 7 dias | Para testes |
| **Mensal** | 30 dias | Assinatura mensal |
| **Anual** | 365 dias | Assinatura anual |
| **Vitalícia** | Sem expiração | Permanente |

### 4. Dashboard

O dashboard mostra:
- 📊 Total de licenças
- ✅ Licenças ativas
- ⏰ Licenças expiradas
- 👥 Total de usuários
- 📋 Licenças recentes

## 📁 Estrutura do Projeto

```
original-system/
├── index.html              # Página de login
├── dashboard.html          # Painel administrativo
├── supabase_setup.sql      # Script de configuração do banco
├── assets/
│   └── logo.png           # Logo do sistema
├── config/
│   └── supabase.config.js # Configurações do Supabase
├── js/
│   └── dashboard.js       # Lógica do dashboard
├── api/
│   └── (futura API REST)
└── docs/
    └── README.md          # Esta documentação
```

## 🔐 Credenciais Padrão

### Administrador Padrão:
```
Usuário: admin
Senha: Admin@123
Email: admin@original.com
```

### Supabase:
```
URL: https://vqrwjassqebxjtnzppku.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔌 API

### Validar Licença (SQL Function)

```sql
SELECT * FROM validate_license('ORIG-XXXX-XXXX-XXXX-XXXX');
```

Retorna:
- `is_valid` - Se a licença é válida
- `license_id` - ID da licença
- `expires_at` - Data de expiração
- `max_devices` - Máximo de dispositivos
- `active_devices` - Dispositivos ativos
- `message` - Mensagem descritiva

### Criar API REST (Futuro)

Você pode criar endpoints REST usando Supabase Edge Functions ou criar seu próprio backend.

## 🛡️ Segurança

### Recomendações:

1. **Trocar a senha do admin imediatamente**
2. **Não compartilhar o Service Role Key** (use apenas no backend)
3. **Habilitar RLS (Row Level Security)** no Supabase se necessário
4. **Usar HTTPS** em produção
5. **Implementar rate limiting** para a API
6. **Fazer backup regular** do banco de dados

### Melhorias de Segurança:

Para produção, considere:
- Implementar hash de senha com bcrypt real (não SHA-256)
- Adicionar autenticação em 2 fatores (2FA)
- Usar JWT tokens para autenticação
- Implementar CAPTCHA no login
- Adicionar rate limiting
- Configurar CORS adequadamente

## 📊 Funcionalidades do Sistema

### ✅ Implementado

- [x] Login administrativo
- [x] Dashboard com estatísticas
- [x] Gerador de licenças
- [x] Tipos de licença (Trial, Mensal, Anual, Vitalícia)
- [x] Vinculação de usuários
- [x] Controle de dispositivos
- [x] Logs de auditoria
- [x] Design responsivo

### 🚧 Em Desenvolvimento

- [ ] Listagem completa de licenças
- [ ] Edição de licenças
- [ ] Gerenciamento de usuários
- [ ] Visualização de logs
- [ ] Configurações do sistema
- [ ] Exportação de relatórios
- [ ] API REST pública
- [ ] Webhook notifications
- [ ] Sistema de tickets/suporte

## 🎨 Personalização

### Cores do Sistema

Edite as variáveis CSS em `index.html` e `dashboard.html`:

```css
:root {
    --primary: #e74c3c;        /* Vermelho principal */
    --primary-dark: #c0392b;   /* Vermelho escuro */
    --secondary: #2c3e50;      /* Azul escuro */
    --success: #27ae60;        /* Verde */
    --warning: #f39c12;        /* Laranja */
    --danger: #e74c3c;         /* Vermelho */
}
```

### Logo

Substitua `assets/logo.png` pelo seu logo (formato PNG recomendado, fundo transparente).

## 🐛 Problemas Comuns

### 1. "Erro ao conectar com Supabase"
- Verifique se as credenciais estão corretas
- Confirme que executou o SQL de configuração
- Verifique se o projeto Supabase está ativo

### 2. "Usuário ou senha incorretos"
- Use as credenciais padrão: `admin` / `Admin@123`
- Verifique se o script SQL foi executado com sucesso

### 3. Logo não aparece
- Certifique-se que o arquivo `logo.png` está em `assets/`
- Limpe o cache do navegador (Ctrl+Shift+R)

### 4. Estatísticas não carregam
- Verifique o console do navegador (F12)
- Confirme que as views foram criadas no SQL

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique a documentação acima
2. Consulte os logs do navegador (F12)
3. Verifique os logs do Supabase

## 📝 Changelog

### Versão 1.0.0 (2024)
- Sistema inicial lançado
- Login administrativo
- Gerador de licenças
- Dashboard com estatísticas
- Integração completa com Supabase

## 📄 Licença

Este sistema é proprietário. Todos os direitos reservados.

---

**Original System** - Sistema de Gerenciamento de Licenças
Desenvolvido com ❤️ para simplificar o gerenciamento de licenças
