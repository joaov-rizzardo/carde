# Route Contracts: Autenticação do Dono

**Phase**: 1 — Design | **Date**: 2026-06-14

---

## Páginas (Client-facing Routes)

### GET /login

**Tipo**: Página pública (RSC shell + `LoginForm` Client Component)

**Comportamento**:
- Se sessão ativa → redirect 307 para `/dashboard`
- Se sem sessão → renderiza formulário de login
- Se cookies desabilitados (detectado client-side) → exibe banner de erro antes do formulário

**UI Elements**:
- Campo de e-mail (tipo `email`, validado client-side)
- Botão "Enviar link de acesso" (magic link)
- Separador "ou"
- Botão "Entrar com Google"
- Link "Criar conta" → `/cadastro`

**Estados do formulário** (LoginForm):
| Estado | Disparador | UI |
|--------|------------|-----|
| idle | inicial | formulário habilitado |
| submitting | submit | botão desabilitado, spinner |
| success | magic link enviado | mensagem "Verifique seu e-mail" |
| error_invalid_email | e-mail inválido | erro inline no campo |
| error_no_cookies | cookies desabilitados | banner no topo da página |
| error_generic | falha no servidor | toast de erro |

---

### GET /cadastro

**Tipo**: Página pública (RSC shell + `CadastroForm` Client Component)

**Comportamento**:
- Se sessão ativa → redirect 307 para `/dashboard`
- Se sem sessão → renderiza formulário de cadastro

**UI Elements**:
- Campo "Nome" (texto, obrigatório)
- Campo "E-mail" (tipo `email`, obrigatório)
- Checkbox LGPD: "Aceito os Termos de Uso e a Política de Privacidade" (obrigatório)
  - Links para `/termos` e `/privacidade` (abre em nova aba)
- Botão "Criar conta" (desabilitado se checkbox não marcado)
- Separador "ou"
- Botão "Entrar com Google"
- Link "Já tenho conta" → `/login`

**Estados do formulário** (CadastroForm):
| Estado | Disparador | UI |
|--------|------------|-----|
| idle | inicial | formulário habilitado |
| submitting | submit | botão desabilitado, spinner |
| success | magic link enviado | mensagem "Verifique seu e-mail" |
| error_email_exists | e-mail já cadastrado | erro inline + "Ir para login" |
| error_invalid_nome | nome vazio | erro inline no campo |
| error_invalid_email | e-mail inválido | erro inline no campo |
| error_lgpd | checkbox não marcado | erro inline (botão bloqueado na prática) |
| error_generic | falha no servidor | toast de erro |

---

### GET /dashboard (e subrotas)

**Tipo**: Página protegida

**Proteção**: middleware.ts — `withAuth` bloqueia antes de qualquer renderização

**Comportamento sem sessão**: redirect 307 para `/login`

**Comportamento com sessão**: renderiza conteúdo normalmente

---

## API Routes (NextAuth)

### GET/POST /api/auth/[...nextauth]

**Handler**: NextAuth catch-all route

**Endpoints internos gerenciados pelo NextAuth**:

| Método | Path | Descrição |
|--------|------|-----------|
| GET | /api/auth/signin | Página de sign in interna (não usada — customizamos /login) |
| POST | /api/auth/signin/email | Solicita magic link — chamado por `signIn('email', ...)` |
| GET | /api/auth/callback/email | Callback quando usuário clica no link do e-mail |
| GET | /api/auth/callback/google | Callback OAuth do Google |
| GET | /api/auth/session | Retorna sessão atual (JSON) |
| POST | /api/auth/signout | Termina sessão |
| GET | /api/auth/csrf | Token CSRF |
| GET | /api/auth/providers | Lista providers disponíveis |

**Configuração**:
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth/config'
const handler = NextAuth(authConfig)
export { handler as GET, handler as POST }
```

---

## Server Actions

### action: requestMagicLink (usado por LoginForm)

**Localização**: `src/app/(marketing)/login/actions.ts`

**Input**:
```typescript
{ email: string }
```

**Validação**:
- Email não vazio: `"E-mail é obrigatório"`
- Email formato válido: `"Formato de e-mail inválido"`
- Normalização: `.trim().toLowerCase()`

**Fluxo**:
1. Valida com Zod
2. Normaliza e-mail
3. Chama `signIn('email', { email: normalizedEmail, redirect: false })`
4. Retorna `{ ok: true }` ou `{ ok: false, error: string }`

---

### action: requestCadastro (usado por CadastroForm)

**Localização**: `src/app/(marketing)/cadastro/actions.ts`

**Input**:
```typescript
{ nome: string; email: string; termosAceitos: boolean }
```

**Validação**:
- Nome não vazio: `"Nome é obrigatório"`
- Email formato válido: `"Formato de e-mail inválido"`
- termosAceitos = true: `"Você precisa aceitar os Termos de Uso"`
- Normalização de e-mail: `.trim().toLowerCase()`

**Fluxo**:
1. Valida com Zod
2. Normaliza e-mail
3. Verifica se `User` já existe via `prisma.user.findUnique({ where: { email } })`
   - Se existir → retorna `{ ok: false, error: 'EMAIL_EXISTS' }`
4. Upsert `PendingSignup(email, nome, termosAceitos: true)`
5. Chama `signIn('email', { email: normalizedEmail, redirect: false })`
6. Retorna `{ ok: true }` ou `{ ok: false, error: string }`

---

## NextAuth Configuration Callbacks

### callbacks.jwt

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id
  }
  return token
}
```

### callbacks.session

```typescript
async session({ session, token }) {
  if (token?.id) {
    session.user.id = token.id as string
  }
  return session
}
```

### events.createUser

```typescript
async createUser({ user }) {
  const pending = await prisma.pendingSignup.findUnique({
    where: { email: user.email! },
  })
  if (pending) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: pending.nome,
          termosAceitos: pending.termosAceitos,
          termosAceitosEm: new Date(),
        },
      }),
      prisma.pendingSignup.delete({ where: { email: user.email! } }),
    ])
  }
}
```

---

## Session Shape

```typescript
// types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}
```

---

## Cookie de Sessão

| Atributo | Valor |
|----------|-------|
| Nome | `next-auth.session-token` (HTTP) / `__Secure-next-auth.session-token` (HTTPS) |
| HttpOnly | ✅ |
| Secure | ✅ em produção |
| SameSite | `lax` |
| MaxAge | 604800 (7 dias em segundos) |

---

## Variáveis de Ambiente

| Variável | Obrigatória | Exemplo |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | ✅ | string aleatória ≥ 32 chars |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | ✅ | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | `GOCSPX-xxx` |
| `RESEND_API_KEY` | ✅ | `re_xxx` |
| `EMAIL_FROM` | ✅ | `Cardê <noreply@carde.app>` |
| `DATABASE_URL` | ✅ | URL de connection pooling (Supabase) |
| `DIRECT_URL` | ✅ | URL direta (Supabase — para migrations) |
