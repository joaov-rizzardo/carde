# Research: Autenticação do Dono

**Phase**: 0 — Research | **Date**: 2026-06-14

---

## 1. NextAuth v4 vs Auth.js v5

**Decision**: NextAuth v4 (`next-auth@^4`)

**Rationale**: v5 (Auth.js) é ainda beta com APIs instáveis, breaking changes frequentes e documentação incompleta para App Router. v4 é production-stable, tem adapter Prisma maduro (`@next-auth/prisma-adapter`) e documenta claramente o padrão com `getServerSession`. Para MVP de um SaaS com time pequeno, estabilidade supera funcionalidade nova.

**Alternatives considered**:
- **Auth.js v5**: Melhor integração com App Router (middleware nativo, session em RSC sem `getServerSession`) mas instável para produção em Jun 2026.
- **Supabase Auth**: Já instalado (`@supabase/ssr`), mas `env.ts` já tem `NEXTAUTH_SECRET`/`NEXTAUTH_URL` pré-wired na infra base — trocar para Supabase Auth exigiria remover o adapter Prisma e usar o sistema de auth do Supabase (tabela `auth.users` separada do schema público). Aumenta acoplamento ao Supabase e quebra a convenção já estabelecida.

---

## 2. Email Provider para Magic Link

**Decision**: Resend (`resend` npm package) com `sendVerificationRequest` customizado no EmailProvider do NextAuth

**Rationale**: API REST simples, sem SMTP para configurar, 3.000 emails/mês no plano free (suficiente para MVP), tem SDK oficial para Node.js, e o template de e-mail pode ser customizado com a identidade visual do Cardê. Alternativas SMTP exigem conta em SendGrid/Mailgun com mais configuração.

**Alternatives considered**:
- **Nodemailer + SMTP**: Funciona com qualquer provedor SMTP (Gmail, SendGrid, SES) mas requer configuração de conta de serviço + credenciais SMTP. Mais frágil para MVP.
- **SendGrid**: Boa API mas setup mais burocrático (verificação de domínio obrigatória). Resend é mais rápido para bootstrap.

**Implementation pattern**:
```typescript
EmailProvider({
  from: env.EMAIL_FROM,
  sendVerificationRequest: async ({ identifier, url }) => {
    const client = new Resend(env.RESEND_API_KEY)
    await client.emails.send({
      from: env.EMAIL_FROM,
      to: identifier,
      subject: 'Seu link de acesso ao Cardê',
      html: magicLinkTemplate(url),
    })
  },
})
```

---

## 3. Estratégia de Sessão: JWT vs Database

**Decision**: JWT (`strategy: 'jwt'`)

**Rationale**: A spec é explícita: "Sessão JWT armazenada em cookie httpOnly". JWT elimina a tabela `Session` no banco (menos leituras de DB por request), é stateless e funciona nativamente no Edge Runtime do middleware. A desvantagem (sessão não pode ser revogada instantaneamente) é aceitável no MVP — não há requisito de logout-de-todos-dispositivos.

**Configuration**:
```typescript
session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 } // SC-003: 7 dias
```

**Alternatives considered**:
- **Database sessions**: Mais controle (revogação instantânea, auditoria) mas requer query ao banco em cada request protegido. Não compatível com Edge middleware sem pooling.

---

## 4. Middleware de Proteção de Rotas

**Decision**: `withAuth` de `next-auth/middleware`

**Rationale**: Wrapper declarativo que lê o JWT do cookie e redireciona para `/login` automaticamente se ausente ou expirado. Opera no Edge Runtime (< 1ms overhead). Compatível com NextAuth v4.

**Pattern**:
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
export default withAuth({ pages: { signIn: '/login' } })
export const config = { matcher: ['/dashboard/:path*'] }
```

**Alternatives considered**:
- **`getToken()` manual**: Mais controle mas requer implementação explícita do redirect e tratamento do token. Desnecessário quando `withAuth` cobre o caso de uso completo.

---

## 5. Captura de Nome e Consentimento LGPD no Cadastro

**Decision**: Tabela `PendingSignup` no banco + evento `events.createUser` no NextAuth

**Rationale**: O fluxo de magic link do NextAuth não permite passar dados extras (nome, LGPD) junto com a solicitação de link. A solução mais confiável para o MVP é:
1. Server Action em `/cadastro` valida o formulário, verifica se e-mail já existe, cria/atualiza `PendingSignup(email, nome, termosAceitos)`, depois chama `signIn('email', { email })`
2. NextAuth `events.createUser` (dispara apenas para usuários novos) busca `PendingSignup` por email, atualiza o `User` recém-criado com nome e `termosAceitos = true`, deleta o `PendingSignup`

**Alternatives considered**:
- **Cookie temporário**: Armazena nome+consentimento em cookie criptografado antes do magic link e lê no callback. Funciona mas menos robusto — cookie pode expirar ou ser bloqueado.
- **Parâmetro na URL do magic link**: NextAuth não expõe parâmetros extras no token de verificação em v4. Não viável sem patch.
- **Dois passos separados**: Criar conta primeiro (sem auth) e depois autenticar. Complica UX desnecessariamente.

---

## 6. Verificação de Cookie Desabilitado

**Decision**: Detecção client-side no componente `LoginForm` via tentativa de escrita de cookie de teste

**Rationale**: `document.cookie` é síncrono, disponível imediatamente no mount do componente. Se cookies estão bloqueados, o cookie de teste não persiste. Exibir banner de erro antes de mostrar os formulários (FR-013).

**Pattern**:
```typescript
function cookiesEnabled(): boolean {
  try {
    document.cookie = '__test=1'
    const enabled = document.cookie.includes('__test=1')
    document.cookie = '__test=; Max-Age=0'
    return enabled
  } catch {
    return false
  }
}
```

---

## 7. Normalização de E-mail (FR-010)

**Decision**: Normalizar no Server Action antes de qualquer operação: `.trim().toLowerCase()`

**Rationale**: NextAuth por padrão não normaliza o e-mail antes de consultar o banco. A normalização deve ser explícita no ponto de entrada (Server Action / API route). O adapter Prisma usa o e-mail como chave única — inconsistência de case geraria duplicatas.

---

## 8. Variáveis de Ambiente Adicionais

Novas variáveis a adicionar em `env.ts` + `.env.example`:

| Variável | Propósito |
|----------|-----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Resend API key para envio de magic links |
| `EMAIL_FROM` | Remetente do magic link (ex: `Cardê <noreply@carde.app>`) |

---

## 9. Redirect para Usuários Já Autenticados (FR-008)

**Decision**: `getServerSession(authConfig)` no início de cada page.tsx de rota pública (RSC)

**Rationale**: Pages de `/login` e `/cadastro` são Server Components. Chamar `getServerSession` no topo e `redirect('/dashboard')` se sessão existir é a forma idiomática com NextAuth v4 em App Router.

---

## Conclusão

Stack de auth definida:
- **Biblioteca**: `next-auth@^4` + `@next-auth/prisma-adapter`
- **Email**: `resend` com `sendVerificationRequest` customizado
- **OAuth**: Google Provider nativo do NextAuth
- **Sessão**: JWT, 7 dias, cookie httpOnly (default do NextAuth)
- **Middleware**: `withAuth` do `next-auth/middleware`
- **Dados extras no cadastro**: `PendingSignup` + `events.createUser`
- **Banco**: Prisma → Supabase PostgreSQL (sem Supabase Auth)
