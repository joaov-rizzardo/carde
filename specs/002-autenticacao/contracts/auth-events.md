# Auth Events & Callbacks: Autenticação do Dono

**Phase**: 1 — Design | **Date**: 2026-06-14

---

## Fluxo Magic Link (Email Provider)

```
[Usuário em /login ou /cadastro]
         │
         ├─ Preenche e-mail → submit
         │
[Server Action: requestMagicLink / requestCadastro]
         │
         ├─ /cadastro: verifica existência → upsert PendingSignup
         │
         ├─ signIn('email', { email, redirect: false })
         │
[POST /api/auth/signin/email]
         │
         ├─ NextAuth gera token aleatório
         ├─ Salva VerificationToken no banco (via Prisma adapter)
         ├─ Chama sendVerificationRequest → Resend API → e-mail enviado
         │
[UI: "Verifique seu e-mail"]
         │
[Usuário clica no link no e-mail]
         │
[GET /api/auth/callback/email?token=...&email=...]
         │
         ├─ NextAuth verifica token contra VerificationToken no banco
         ├─ Token expirado/inválido → redirect /login?error=Verification
         ├─ Token válido:
         │    ├─ User.findUnique(email)
         │    │    ├─ Existe → recupera User
         │    │    └─ Não existe → cria User (adapter) → dispara events.createUser
         │    │                        └─ events.createUser: aplica PendingSignup → deleta PendingSignup
         │    ├─ Deleta VerificationToken usado
         │    ├─ Executa callbacks.jwt({ token, user })
         │    ├─ Assina JWT com NEXTAUTH_SECRET
         │    └─ Seta cookie next-auth.session-token (httpOnly, 7 dias)
         │
[Redirect → /dashboard]
```

---

## Fluxo Google OAuth

```
[Usuário em /login ou /cadastro]
         │
         ├─ Clica "Entrar com Google"
         │
[signIn('google') — redirect automático]
         │
[GET /api/auth/signin/google → redirect para accounts.google.com]
         │
[Usuário autoriza no Google]
         │
[GET /api/auth/callback/google?code=...&state=...]
         │
         ├─ NextAuth troca code por tokens (access_token, id_token)
         ├─ Decodifica id_token → email, name, image
         ├─ User.findUnique(email)
         │    ├─ Existe → recupera User → vincula Account se não vinculada
         │    └─ Não existe → cria User(email, name, image) → cria Account(google)
         │          └─ events.createUser dispara (termosAceitos = false — tratar no onboarding)
         ├─ callbacks.jwt({ token, user })
         ├─ Assina JWT
         └─ Seta cookie
         │
[Redirect → /dashboard]
```

---

## Tratamento de Erros de Auth (NextAuth Error Pages)

NextAuth redireciona para `/login?error=<código>` em caso de erro. O componente `LoginForm` deve ler o search param `error` e exibir mensagem correspondente:

| Código `error` | Causa | Mensagem para o usuário |
|----------------|-------|-------------------------|
| `Verification` | Token de magic link inválido ou expirado | "Link expirado ou inválido. Solicite um novo link de acesso." |
| `OAuthAccountNotLinked` | E-mail já cadastrado com outro provedor | "Este e-mail já está vinculado a outro método de login." |
| `EmailSignin` | Falha no envio do e-mail | "Não conseguimos enviar o e-mail. Tente novamente." |
| `Default` | Erro genérico | "Ocorreu um erro inesperado. Tente novamente." |

---

## Comportamento de Sessão

| Situação | Comportamento |
|----------|---------------|
| Sem cookie | `getServerSession()` retorna `null`; middleware redireciona para `/login` |
| Cookie corrompido | NextAuth ignora e trata como sem sessão |
| Cookie expirado (> 7 dias) | `getServerSession()` retorna `null`; middleware redireciona para `/login` |
| Sessão ativa, acessa `/login` | Page RSC detecta sessão → redirect 307 `/dashboard` |
| Sessão ativa, acessa `/dashboard` | Middleware permite; page renderiza |
| Múltiplas abas/dispositivos | Todas as sessões independentes permanecem ativas (JWT stateless) |
