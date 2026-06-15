# Implementation Plan: Autenticação do Dono

**Branch**: `002-autenticacao` | **Date**: 2026-06-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-autenticacao/spec.md`

## Summary

Implementar autenticação sem senha para o dono do restaurante usando **NextAuth v4** com estratégia JWT: magic link por e-mail via Resend + Google OAuth, `@next-auth/prisma-adapter` para persistência de User/Account/VerificationToken no Supabase PostgreSQL via Prisma, middleware Next.js com `withAuth` protegendo todas as rotas `/dashboard/*`, e páginas `/login` e `/cadastro` Mobile First com a identidade visual do Cardê (geradas via `/frontend-design`).

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode, no `any`, no `as unknown`

**Primary Dependencies**: `next-auth@^4`, `@next-auth/prisma-adapter`, `resend`, Prisma 5.x, Zod 3.x, shadcn/ui

**Storage**: Supabase PostgreSQL via Prisma — modelos `User`, `Account`, `VerificationToken`, `PendingSignup`

**Testing**: Validação manual via [`quickstart.md`](./quickstart.md) — sem test suite nesta fase

**Target Platform**: Web — mobile-first, mínimo 320px de viewport

**Project Type**: SaaS web application (Next.js 14 App Router, monorepo)

**Performance Goals**: Página `/login` carrega em < 2s em 4G (SC-001); redirecionamento de rota protegida ocorre em middleware Edge < 1ms (SC-006)

**Constraints**: JWT httpOnly cookie; proteção de rota SOMENTE em `middleware.ts`; `'use client'` apenas nos formulários (LoginForm, CadastroForm); sem `any` no TypeScript; magic link expira em 24h; sessão dura 7 dias (SC-003)

**Scale/Scope**: MVP — donos únicos por restaurante (sem multi-unidade); sem requisito de revogação de sessão remota

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile First | ✅ PASS | Páginas `/login` e `/cadastro` desenhadas mobile-first via `/frontend-design`; botões com área mínima ≥44px; sem scroll horizontal |
| II. Server Components por Padrão | ✅ PASS | Shells de página são RSC (`getServerSession` → redirect); apenas `LoginForm` e `CadastroForm` são `'use client'` (necessário por event handlers e estado de formulário) |
| III. Segurança em Todas as Camadas | ✅ PASS | JWT em cookie httpOnly; `withAuth` no middleware protege `/dashboard/*` antes de qualquer renderização; `NEXTAUTH_SECRET` validado por Zod em `lib/env.ts`; e-mails normalizados; `verificarOwnership()` em `lib/auth/ownership.ts` usa `session.user.id` do JWT |
| IV. Todos os Estados da UI São Tratados | ✅ PASS | Formulários tratam: idle, submitting (spinner), success (confirmação), e todos os estados de erro por campo sem apagar dados |
| V. Arquitetura Limpa por Domínio | ✅ PASS | Config NextAuth em `lib/auth/config.ts`; Server Actions em `(marketing)/login/actions.ts` e `(marketing)/cadastro/actions.ts`; páginas em `(marketing)/`; tipo de sessão em `types/next-auth.d.ts`; sem cross-domain imports |

| Antipattern | Status | Notes |
|-------------|--------|-------|
| 1. Client Component onde RSC resolve | ✅ CLEAR | Page shells são RSC; apenas formulários interativos são client |
| 2. Lógica de negócio em componentes | ✅ CLEAR | Normalização de e-mail e lógica de PendingSignup em Server Actions (`lib/auth/`); componentes apenas renderizam |
| 3. Estados de loading/erro ignorados | ✅ CLEAR | 5 estados no LoginForm, 6 estados no CadastroForm, todos com UI explícita |
| 4. Ownership verificado ad-hoc | ✅ CLEAR | `ownership.ts` usa `session.user.id` do JWT; verificação centralizada e sem duplicação |
| 5. Upload sem validação dupla | ✅ CLEAR | N/A nesta feature |
| 6. Mutações sem feedback otimista | ✅ CLEAR | N/A (auth não é mutação reversível — spinner + mensagem de confirmação são suficientes) |
| 7. `any` no TypeScript | ✅ CLEAR | Tipos NextAuth estendidos via declaration merging em `types/next-auth.d.ts` |
| 8. Queries N+1 | ✅ CLEAR | Sem queries de lista nesta feature |
| 9. Layout sem frontend-design plugin | ⚠️ OBRIGATÓRIO | Páginas `/login` e `/cadastro` DEVEM ser geradas via `/frontend-design` antes da implementação — ver Nota em quickstart.md |

## Project Structure

### Documentation (this feature)

```text
specs/002-autenticacao/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output — decisões de biblioteca e arquitetura
├── data-model.md        # Phase 1 output — schema Prisma, entidades, fluxos de estado
├── quickstart.md        # Phase 1 output — guia de validação manual (10 cenários)
├── contracts/
│   ├── routes.md        # Page routes, Server Actions, callbacks NextAuth, env vars
│   └── auth-events.md   # Fluxos de magic link e Google OAuth, tratamento de erros
└── tasks.md             # Phase 2 output (/speckit-tasks — NÃO criado por /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (marketing)/
│   │   ├── login/
│   │   │   ├── page.tsx           # RSC shell: getServerSession → redirect ou render LoginForm
│   │   │   └── actions.ts         # Server Action: requestMagicLink (valida, normaliza, signIn)
│   │   └── cadastro/
│   │       ├── page.tsx           # RSC shell: getServerSession → redirect ou render CadastroForm
│   │       └── actions.ts         # Server Action: requestCadastro (valida, PendingSignup, signIn)
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts       # NextAuth catch-all handler (GET + POST)
├── components/
│   └── auth/
│       ├── login-form.tsx         # 'use client' — email + magic link + Google + cookie check
│       └── cadastro-form.tsx      # 'use client' — nome + email + LGPD checkbox + Google
├── lib/
│   └── auth/
│       ├── config.ts              # NextAuth config: providers, adapter, callbacks, events
│       └── ownership.ts           # verificarOwnership() — usa session.user.id do JWT
└── types/
    └── next-auth.d.ts             # Module augmentation: Session.user.id, JWT.id

middleware.ts                      # Substituir stub por withAuth do next-auth/middleware
prisma/
└── schema.prisma                  # Adicionar: User, Account, VerificationToken, PendingSignup
.env.example                       # Adicionar: GOOGLE_CLIENT_ID/SECRET, RESEND_API_KEY, EMAIL_FROM
```

**Structure Decision**: Next.js App Router com route group `(marketing)` para páginas públicas (login/cadastro) e `(dashboard)` para rotas protegidas. Server Actions co-localizados com as páginas que os consomem. Configuração NextAuth centralizada em `lib/auth/config.ts` para ser compartilhada entre `route.ts` e chamadas a `getServerSession`.

## Complexity Tracking

> Sem violações da Constitution — seção intencionalmente em branco.
