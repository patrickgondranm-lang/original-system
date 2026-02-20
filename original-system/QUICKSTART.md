# 🚀 GUIA DE INÍCIO RÁPIDO - ORIGINAL SYSTEM

## ⚡ 5 Passos para Começar

### 1️⃣ CONFIGURAR O SUPABASE (2 minutos)

1. Acesse: https://supabase.com/dashboard/project/vqrwjassqebxjtnzppku
2. No menu lateral, clique em **"SQL Editor"**
3. Clique em **"New query"**
4. Abra o arquivo `supabase_setup.sql` e copie TODO o conteúdo
5. Cole no editor SQL e clique em **"Run"** (botão verde)
6. Aguarde aparecer "Success" ✅

### 2️⃣ ADICIONAR O LOGO (1 minuto)

1. Copie sua logo (formato PNG de preferência)
2. Renomeie para `logo.png`
3. Coloque na pasta `assets/`

### 3️⃣ FAZER UPLOAD DOS ARQUIVOS (3 minutos)

**Opção A - Testar Local:**
```bash
cd original-system
python -m http.server 8000
```
Acesse: http://localhost:8000

**Opção B - Servidor Web:**
- Faça upload de todos os arquivos via FTP
- Mantenha a estrutura de pastas

### 4️⃣ FAZER LOGIN (30 segundos)

1. Abra o sistema no navegador
2. Use as credenciais:
   - **Usuário:** `admin`
   - **Senha:** `Admin@123`
3. Clique em "Entrar"

### 5️⃣ GERAR SUA PRIMEIRA LICENÇA (1 minuto)

1. No menu lateral, clique em **"Gerar Chaves"**
2. Selecione:
   - Tipo: **Mensal** (ou qualquer outro)
   - Max Dispositivos: **1**
   - Quantidade: **1**
3. Clique em **"Gerar Licenças"**
4. Copie a chave gerada! 🎉

---

## ✅ PRONTO! Seu sistema está funcionando!

Agora você pode:
- ✅ Gerar quantas licenças quiser
- ✅ Vincular licenças a usuários
- ✅ Visualizar estatísticas no dashboard
- ✅ Validar licenças via API

---

## 🔧 PRÓXIMOS PASSOS (OPCIONAL)

### Trocar a Senha do Admin
1. No Supabase, vá em **SQL Editor**
2. Execute:
```sql
UPDATE admins 
SET password_hash = 'SEU_NOVO_HASH_AQUI'
WHERE username = 'admin';
```

### Testar a Validação de Licença
1. Abra `api-test.html` no navegador
2. Cole uma chave que você gerou
3. Clique em "Validar Licença"

### Personalizar as Cores
Edite as variáveis CSS em `index.html` e `dashboard.html`:
```css
:root {
    --primary: #e74c3c;        /* Sua cor primária */
    --secondary: #2c3e50;      /* Sua cor secundária */
}
```

---

## ❓ PROBLEMAS COMUNS

### "Erro ao conectar com Supabase"
- ✅ Executou o SQL de configuração?
- ✅ As credenciais estão corretas em `config/supabase.config.js`?

### "Usuário ou senha incorretos"
- ✅ Use `admin` / `Admin@123`
- ✅ Verifique se a tabela `admins` foi criada

### Logo não aparece
- ✅ O arquivo se chama `logo.png`?
- ✅ Está na pasta `assets/`?

---

## 📞 SUPORTE

Se precisar de ajuda:
1. Leia o `README.md` completo
2. Verifique o console do navegador (F12)
3. Confira os logs do Supabase

---

## 🎉 BOA SORTE!

Seu sistema de licenças está pronto para usar!

**Original System** - Gerenciamento de Licenças Simplificado
