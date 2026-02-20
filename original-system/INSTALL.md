# 🔥 ORIGINAL — Guia de Instalação Completo

## O que você tem neste pacote

```
original-system/
├── 01_setup_database.sql          ← Execute no Supabase SQL Editor
├── edge-functions/
│   ├── validate-license/          ← Edge Function de validação
│   ├── activate-license/          ← Edge Function de ativação
│   └── admin-api/                 ← Backend do painel admin
├── admin-panel.html               ← Painel admin (abra no navegador)
└── INSTALL.md                     ← Este guia
```

---

## PASSO 1 — Configurar o Banco de Dados

1. Acesse [supabase.com](https://supabase.com) → seu projeto
2. Clique em **SQL Editor** no menu lateral
3. Clique em **+ New Query**
4. Cole todo o conteúdo do arquivo `01_setup_database.sql`
5. Clique em **Run** (ou Ctrl+Enter)
6. Aguarde — você verá "Tabelas criadas com sucesso!"

---

## PASSO 2 — Deploy das Edge Functions

### Opção A: Via Supabase Dashboard (mais fácil)
1. No menu lateral, vá em **Edge Functions**
2. Clique em **Deploy new function**
3. Para cada função (validate-license, activate-license, admin-api):
   - Dê o nome correspondente
   - Cole o conteúdo do arquivo `index.ts`
   - Clique em Deploy

### Opção B: Via CLI (recomendado)
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref vqrwjassqebxjtnzppku

# Deploy das funções
supabase functions deploy validate-license
supabase functions deploy activate-license
supabase functions deploy admin-api
```

---

## PASSO 3 — Configurar Senha do Admin

1. No Supabase, vá em **Edge Functions → admin-api**
2. Clique em **Secrets** (ou Environment Variables)
3. Adicione:
   ```
   ADMIN_SECRET = sua-senha-forte-aqui-2025
   ```
4. Salve e faça redeploy da função admin-api

> ⚠️ IMPORTANTE: A senha padrão no código é `original-admin-2025`.
> Troque para uma senha forte antes de usar em produção!

---

## PASSO 4 — Usar o Painel Admin

1. Abra o arquivo `admin-panel.html` no seu navegador
   - Pode abrir direto como arquivo local (file://)
   - Ou hospedar em qualquer servidor estático (Netlify, Vercel, GitHub Pages)
2. Digite a senha master que você definiu no Passo 3
3. Pronto! Você tem acesso completo ao painel

### O que você pode fazer no painel:
- 📊 **Dashboard** — Ver estatísticas em tempo real
- 🔑 **Licenças** — Listar, editar, suspender, excluir licenças
- ✨ **Gerar** — Criar novas chaves de licença (individual ou em lote)
- 📋 **Logs** — Ver histórico de ativações e validações
- ⬇️ **Exportar** — Baixar todas as licenças em CSV

---

## PASSO 5 — Instalar a Extensão

1. Extraia o arquivo `Original_v1.0.0.zip` (baixe separadamente)
2. Abra o Chrome → `chrome://extensions`
3. Ative o **Modo do desenvolvedor** (toggle no canto superior direito)
4. Clique em **"Carregar sem compactação"**
5. Selecione a pasta `Original/`

---

## Como gerar e vender licenças

### Criando uma licença:
1. Abra o Painel Admin
2. Vá em **Gerar Licenças**
3. Escolha: Plano, Quantidade, Expiração
4. Clique em **Gerar**
5. Copie a chave e envie ao cliente

### O cliente ativa assim:
1. Instala a extensão
2. Abre o painel lateral
3. Digita a chave + email
4. Clica em Ativar

---

## Segurança

### ⚠️ ROTACIONE SUAS CHAVES AGORA
As chaves do seu Supabase foram expostas nesta conversa.
Vá em **Supabase → Settings → API → Rotate keys** e gere novas chaves.
Depois atualize nos arquivos da extensão e do painel.

### Boas práticas:
- Use uma senha forte no `ADMIN_SECRET`
- Hospede o painel admin em URL com senha (ou acesso privado)
- Nunca compartilhe a `service_role` key publicamente
- Monitore os logs regularmente

---

## Suporte

Para dúvidas sobre instalação, entre em contato com o suporte Original.
