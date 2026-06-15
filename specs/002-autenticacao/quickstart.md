# Quickstart: Autenticação do Dono

**Phase**: 1 — Design | **Date**: 2026-06-14

Guia de validação end-to-end para a feature de autenticação. Não inclui código de implementação — esse é gerado pelo `/speckit-tasks`.

---

## Pré-requisitos

1. **Banco de dados**: Supabase PostgreSQL acessível com `DATABASE_URL` e `DIRECT_URL` configurados
2. **Google Cloud Console**: Projeto criado com OAuth 2.0 configurado:
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
3. **Resend**: Conta criada, API key disponível (plano free: 3.000 emails/mês)
4. **Variáveis de ambiente** configuradas em `.env.local`:
   ```bash
   NEXTAUTH_SECRET=<string aleatória ≥ 32 chars>
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=<xxx.apps.googleusercontent.com>
   GOOGLE_CLIENT_SECRET=<GOCSPX-xxx>
   RESEND_API_KEY=<re_xxx>
   EMAIL_FROM=Cardê <onboarding@resend.dev>   # plano free Resend: usar @resend.dev
   DATABASE_URL=<connection pooler URL do Supabase>
   DIRECT_URL=<direct connection URL do Supabase>
   ```
5. **Dependências instaladas**:
   ```bash
   npm install next-auth @next-auth/prisma-adapter resend
   ```
6. **Migration executada**:
   ```bash
   npx prisma migrate dev --name add-auth-models
   ```
7. **Servidor rodando**: `npm run dev`

---

## Cenários de Validação

### Cenário 1 — Magic Link: Novo usuário via /cadastro (P1 + P2)

1. Acesse `http://localhost:3000/cadastro`
2. Preencha: Nome = "João Restaurante", E-mail = `<seu e-mail real>`
3. Marque o checkbox de termos
4. Clique "Criar conta"
5. **Esperado**: Mensagem "Verifique seu e-mail" é exibida
6. Abra o e-mail → clique no link de acesso
7. **Esperado**: Redirecionado para `http://localhost:3000/dashboard` com sessão ativa
8. **Verifique no banco** (Prisma Studio ou Supabase Dashboard):
   ```sql
   SELECT id, name, email, "termosAceitos", "termosAceitosEm" FROM "User" WHERE email = '<seu e-mail>';
   -- Esperado: termosAceitos = true, termosAceitosEm NOT NULL, name = 'João Restaurante'
   SELECT * FROM "PendingSignup" WHERE email = '<seu e-mail>';
   -- Esperado: 0 rows (registro deletado após uso)
   ```

---

### Cenário 2 — Magic Link: Login de usuário existente via /login (P1)

1. Com usuário do Cenário 1 criado, acesse `http://localhost:3000/login`
2. Informe o mesmo e-mail do Cenário 1
3. Clique "Enviar link de acesso"
4. **Esperado**: Mensagem "Verifique seu e-mail"
5. Abra o e-mail → clique no link
6. **Esperado**: Redirecionado para `/dashboard`
7. **Verifique**: Nenhum User duplicado criado no banco

---

### Cenário 3 — Google OAuth (P1)

1. Acesse `http://localhost:3000/login`
2. Clique "Entrar com Google"
3. **Esperado**: Redirect para `accounts.google.com`
4. Autorize o acesso com sua conta Google
5. **Esperado**: Redirecionado para `/dashboard` com sessão ativa
6. **Verifique no banco**:
   ```sql
   SELECT * FROM "Account" WHERE provider = 'google';
   -- Esperado: 1 row com providerAccountId correto
   ```

---

### Cenário 4 — Proteção de rotas: acesso sem sessão (P3)

1. Abra uma aba anônima (sem cookies do app)
2. Acesse diretamente `http://localhost:3000/dashboard`
3. **Esperado**: Redirect imediato para `/login` — sem flash de conteúdo do dashboard
4. Acesse `http://localhost:3000/dashboard/qualquer-subrota`
5. **Esperado**: Mesmo redirect para `/login`

---

### Cenário 5 — Persistência de sessão (P4)

1. Faça login normalmente (Cenário 1 ou 2)
2. Feche o navegador completamente
3. Reabra e acesse `http://localhost:3000/dashboard`
4. **Esperado**: Dashboard carrega sem pedir reautenticação (sessão dura 7 dias)
5. Recarregue a página diversas vezes
6. **Esperado**: Sessão mantida em todas as recargas

---

### Cenário 6 — Redirect de usuário autenticado (FR-008)

1. Com sessão ativa, acesse `http://localhost:3000/login`
2. **Esperado**: Redirect imediato para `/dashboard`
3. Acesse `http://localhost:3000/cadastro`
4. **Esperado**: Redirect imediato para `/dashboard`

---

### Cenário 7 — E-mail já cadastrado em /cadastro (P2, Cenário 2)

1. Acesse `/cadastro` com um e-mail já existente no banco
2. Preencha nome + e-mail existente + checkbox
3. Clique "Criar conta"
4. **Esperado**: Erro inline "Esta conta já existe. Fazer login →" com link para `/login`
5. **Verifique**: Nenhum `PendingSignup` criado; nenhum User duplicado

---

### Cenário 8 — Validação de formulário (FR-009, FR-012)

**Em /login**:
- Submit com e-mail vazio → "E-mail é obrigatório" (inline, campo mantido)
- Submit com e-mail inválido (`teste@`) → "Formato de e-mail inválido" (inline)

**Em /cadastro**:
- Submit sem nome → "Nome é obrigatório"
- Submit sem e-mail → "E-mail é obrigatório"
- Submit sem checkbox marcado → botão desabilitado (não há erro — botão simplesmente não habilita)

---

### Cenário 9 — Cookies desabilitados (FR-013)

1. Desabilite cookies no navegador (DevTools → Application → Cookies → bloquear)
2. Acesse `/login`
3. **Esperado**: Banner de aviso "Cookies precisam estar habilitados para usar o Cardê" exibido antes do formulário

---

### Cenário 10 — Link de magic link expirado (edge case)

1. Solicite um magic link
2. Aguarde mais de 24h (ou manipule o campo `expires` no banco para uma data passada)
3. Clique no link
4. **Esperado**: Redirect para `/login?error=Verification` com mensagem "Link expirado ou inválido. Solicite um novo link de acesso."

---

## Referências

- Data model: [`data-model.md`](./data-model.md)
- Contracts (rotas + callbacks): [`contracts/routes.md`](./contracts/routes.md), [`contracts/auth-events.md`](./contracts/auth-events.md)
- Spec completa: [`spec.md`](./spec.md)

---

## Nota sobre /frontend-design (Constitution Antipattern #9)

As páginas `/login` e `/cadastro` DEVEM ser geradas pelo skill `/frontend-design` antes da implementação. O fluxo correto durante a implementação:

1. Invocar `/frontend-design` passando o layout de cada página
2. Implementar o código gerado pelo plugin
3. Integrar com os Server Actions e NextAuth

Implementar o layout diretamente sem passar pelo plugin viola o Antipattern #9 da Constitution.
