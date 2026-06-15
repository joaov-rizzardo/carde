# Tasks: Autenticação do Dono

**Input**: Design documents from `/specs/002-autenticacao/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Sem test suite nesta fase — validação manual via `quickstart.md` (10 cenários).

**Organization**: Tasks agrupadas por User Story para permitir implementação e teste independentes de cada história.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User Story correspondente ([US1], [US2], [US3], [US4])
- Caminhos de arquivo exatos incluídos em todas as descrições

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalar dependências e configurar variáveis de ambiente antes de qualquer implementação.

- [X] T001 [P] Instalar pacotes de autenticação (`next-auth@^4 @next-auth/prisma-adapter resend`) em package.json via `npm install next-auth @next-auth/prisma-adapter resend`
- [X] T002 [P] Adicionar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` ao schema Zod em `src/lib/env.ts`
- [X] T003 [P] Adicionar as 4 novas variáveis de auth com valores de exemplo comentados em `.env.example`

**Checkpoint**: Dependências instaladas e env vars tipadas — pronto para schema e config.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura central que DEVE estar completa antes de qualquer User Story.

**⚠️ CRÍTICO**: Nenhuma User Story pode começar antes desta fase estar completa.

- [X] T004 [P] Adicionar models `User`, `Account`, `VerificationToken`, `PendingSignup` ao `prisma/schema.prisma` conforme schema completo de `data-model.md` (incluindo campos customizados `termosAceitos Boolean @default(false)`, `termosAceitosEm DateTime?`, `criadoEm`, `atualizadoEm` em User)
- [X] T005 Executar `npx prisma migrate dev --name add-auth-models` para criar as tabelas de auth no Supabase PostgreSQL (depende de T004)
- [X] T006 [P] Criar module augmentation TypeScript do NextAuth (`Session.user.id: string`, `JWT.id?: string`) em `src/types/next-auth.d.ts`
- [X] T007 Criar configuração NextAuth em `src/lib/auth/config.ts`: `EmailProvider` com `sendVerificationRequest` customizado via Resend SDK, `GoogleProvider`, `PrismaAdapter(prisma)`, `session: { strategy: 'jwt', maxAge: 604800 }`, `callbacks.jwt` (adiciona `token.id = user.id`), `callbacks.session` (propaga `session.user.id`), `events.createUser` (aplica PendingSignup ao User recém-criado e deleta PendingSignup em transação) (depende de T005, T006)
- [X] T008 Criar handler NextAuth catch-all em `src/app/api/auth/[...nextauth]/route.ts`: importar `authConfig` de `@/lib/auth/config`, exportar `handler as GET, handler as POST` (depende de T007)
- [X] T009 [P] Criar função `verificarOwnership()` usando `session.user.id` do JWT (via `getServerSession`) em `src/lib/auth/ownership.ts`

**Checkpoint**: Schema migrado, NextAuth configurado e servindo `/api/auth/*` — User Stories podem começar.

---

## Phase 3: User Story 1 — Login Sem Senha (Priority: P1) 🎯 MVP

**Goal**: Página `/login` funcional com magic link por e-mail e Google OAuth, incluindo detecção de cookies desabilitados e tratamento de todos os erros do NextAuth.

**Independent Test**: Acessar `/login` → autenticar via magic link ou Google → verificar redirect para `/dashboard` com sessão ativa (Cenários 1, 2, 3, 6 do `quickstart.md`).

### Implementation for User Story 1

- [X] T010 [P] Invocar skill `/frontend-design` para gerar design da página `/login` — fornecer: elementos de UI de `contracts/routes.md` (campo e-mail, botão magic link, separador "ou", botão Google, link "/cadastro"), 6 estados do LoginForm, banner de erro de cookies, paleta Cardê (`#1A1A2E`, `#E85D04`, `#F7F3EE`), mobile-first 320px+, área de toque mínima 44×44px — output será base para T012 e T013
- [X] T011 [P] [US1] Criar Server Action `requestMagicLink` em `src/app/(marketing)/login/actions.ts`: schema Zod (`email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido')`), normalização (`trim().toLowerCase()`), `signIn('email', { email, redirect: false })`, retornar `{ ok: true }` ou `{ ok: false, error: string }`
- [X] T012 [US1] Implementar `LoginForm` `'use client'` em `src/components/auth/login-form.tsx` usando output de T010: 6 estados (idle / submitting / success / error_invalid_email / error_no_cookies / error_generic), detecção de cookies via `document.cookie` no mount, leitura de `searchParams.error` para códigos NextAuth (`Verification` → "Link expirado", `OAuthAccountNotLinked` → "E-mail vinculado a outro método", `EmailSignin` → "Falha no envio", `Default` → genérico), botão Google via `signIn('google')` (depende de T010, T011)
- [X] T013 [US1] Criar shell RSC da página `/login` em `src/app/(marketing)/login/page.tsx` usando output de T010: `getServerSession(authConfig)` → `redirect('/dashboard')` se sessão ativa, caso contrário renderizar `<LoginForm searchParams={searchParams} />` (depende de T010, T012)

**Checkpoint**: `/login` funcional — magic link envia e-mail, Google OAuth autentica, redirect para `/dashboard` após auth. Testar Cenários 1–3 e 6 do `quickstart.md`.

---

## Phase 4: User Story 2 — Criação de Conta (Priority: P2)

**Goal**: Página `/cadastro` funcional com campos nome + e-mail + checkbox LGPD, criando conta via PendingSignup + magic link, detectando e-mail já existente.

**Independent Test**: Acessar `/cadastro` → preencher nome, e-mail válido, marcar checkbox → verificar criação de User com `termosAceitos = true` e PendingSignup deletado no banco (Cenário 1 do `quickstart.md`).

### Implementation for User Story 2

- [X] T014 [P] Invocar skill `/frontend-design` para gerar design da página `/cadastro` — fornecer: elementos de UI de `contracts/routes.md` (campo Nome, campo E-mail, checkbox LGPD com links `/termos` e `/privacidade` em nova aba, botão "Criar conta" desabilitado sem checkbox, separador "ou", botão Google, link "/login"), 7 estados do CadastroForm, paleta Cardê, mobile-first — output será base para T016 e T017
- [X] T015 [P] [US2] Criar Server Action `requestCadastro` em `src/app/(marketing)/cadastro/actions.ts`: schema Zod (`nome: z.string().min(1, 'Nome é obrigatório')`, email format, `termosAceitos: z.literal(true)`), normalização de e-mail, `prisma.user.findUnique({ where: { email } })` → retornar `{ ok: false, error: 'EMAIL_EXISTS' }` se encontrado, `prisma.pendingSignup.upsert({ where: { email }, ... })`, `signIn('email', { email, redirect: false })`
- [X] T016 [US2] Implementar `CadastroForm` `'use client'` em `src/components/auth/cadastro-form.tsx` usando output de T014: 7 estados (idle / submitting / success / error_email_exists / error_invalid_nome / error_invalid_email / error_generic), botão "Criar conta" desabilitado enquanto `termosAceitos = false`, exibir "Esta conta já existe. Fazer login →" com link para `/login` no estado `error_email_exists`, campos preservam valores em todos os estados de erro (depende de T014, T015)
- [X] T017 [US2] Criar shell RSC da página `/cadastro` em `src/app/(marketing)/cadastro/page.tsx` usando output de T014: `getServerSession(authConfig)` → `redirect('/dashboard')` se sessão ativa, caso contrário renderizar `<CadastroForm />` (depende de T014, T016)

**Checkpoint**: `/cadastro` funcional — novo usuário cria conta, banco tem `termosAceitos = true` e PendingSignup deletado, e-mail existente mostra erro inline. Testar Cenários 1 e 7 do `quickstart.md`.

---

## Phase 5: User Story 3 — Proteção de Rotas (Priority: P3)

**Goal**: Middleware Edge bloqueando toda rota `/dashboard/*` para usuários sem sessão ativa, redirecionando para `/login` antes de qualquer renderização de conteúdo.

**Independent Test**: Acessar `/dashboard` em aba anônima → verificar redirect imediato para `/login` sem flash de conteúdo (Cenário 4 do `quickstart.md`).

### Implementation for User Story 3

- [X] T018 [US3] Substituir stub de `middleware.ts` por `withAuth` do `next-auth/middleware`: `export default withAuth({ pages: { signIn: '/login' } })` e `export const config = { matcher: ['/dashboard/:path*'] }` em `middleware.ts`
- [X] T019 [P] [US3] Verificar se existe página stub em `src/app/(dashboard)/dashboard/page.tsx` — se não existir, criar placeholder mínimo com texto "Dashboard" para permitir teste manual de proteção de rota

**Checkpoint**: Acesso a `/dashboard/*` sem sessão redireciona para `/login` em < 1ms no Edge Runtime. Testar Cenário 4 do `quickstart.md`.

---

## Phase 6: User Story 4 — Persistência de Sessão (Priority: P4)

**Goal**: Garantir que a sessão JWT persiste 7 dias via cookie httpOnly, sobrevivendo a fechamentos e reabertura de navegador.

**Independent Test**: Autenticar → fechar e reabrir navegador → acessar `/dashboard` → verificar que não há redirect para `/login` (Cenário 5 do `quickstart.md`).

### Implementation for User Story 4

- [X] T020 [US4] Confirmar que `src/lib/auth/config.ts` (T007) contém `session: { strategy: 'jwt', maxAge: 604800 }` (7 dias em segundos conforme SC-003) — cookie httpOnly e SameSite=lax são automáticos do NextAuth; sem implementação adicional necessária

**Checkpoint**: Sessão persiste 7 dias. Testar Cenários 5 e 6 do `quickstart.md`.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação end-to-end e conformidade com Constitution.

- [ ] T021 Executar os 10 cenários de validação de `quickstart.md` em sequência e documentar resultados: Cenários 1–10 (magic link novo usuário, login existente, Google OAuth, proteção de rota, persistência, redirect autenticado, e-mail existente, validação de formulário, cookies desabilitados, link expirado)
- [X] T022 [P] Auditar todos os arquivos TypeScript criados nesta feature para conformidade strict: sem `any`, sem `as unknown`, tipos de retorno explícitos em Server Actions e callbacks NextAuth (`src/lib/auth/config.ts`, `src/app/(marketing)/login/actions.ts`, `src/app/(marketing)/cadastro/actions.ts`, `src/types/next-auth.d.ts`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 completa — BLOQUEIA todas as User Stories
- **US1 (Phase 3)**: Depende de Phase 2 completa — primeira story a implementar (MVP)
- **US2 (Phase 4)**: Depende de Phase 2 completa — pode ser paralela com US1 se houver equipe
- **US3 (Phase 5)**: Depende de Phase 2 completa (T007 para authConfig no middleware)
- **US4 (Phase 6)**: Depende de T007 (config.ts) estar completo — apenas verificação
- **Polish (Phase 7)**: Depende de todas as stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: Pode iniciar após Phase 2 — nenhuma dependência de outras stories
- **US2 (P2)**: Pode iniciar após Phase 2 — independente de US1; PendingSignup e events.createUser já estão em T007
- **US3 (P3)**: Pode iniciar após T007 (middleware importa `withAuth`, não usa authConfig diretamente)
- **US4 (P4)**: Apenas verificação de T007 — sem implementação nova

### Within Each User Story

- T010/T014 (`/frontend-design`) DEVEM ser concluídos antes das implementações de componente e página
- Server Actions (T011, T015) podem ser escritas em paralelo com o design (T010, T014)
- Componentes (T012, T016) dependem do design E da assinatura da Server Action
- Page shells (T013, T017) dependem do componente implementado

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 todos paralelos
- **Phase 2**: T004, T006, T009 paralelos; T005 após T004; T007 após T005+T006; T008 após T007
- **Phase 3**: T010 e T011 paralelos; T012 após T010+T011; T013 após T012
- **Phase 4**: T014 e T015 paralelos; T016 após T014+T015; T017 após T016
- **Phase 5**: T018 e T019 paralelos
- **Phase 7**: T022 paralelo com T021

---

## Parallel Example: User Story 1

```bash
# Fase 3 — iniciar em paralelo:
Task T010: "Invocar /frontend-design para design de /login"
Task T011: "Server Action requestMagicLink em src/app/(marketing)/login/actions.ts"

# Após T010 + T011 completos:
Task T012: "LoginForm em src/components/auth/login-form.tsx"

# Após T012:
Task T013: "Page shell /login em src/app/(marketing)/login/page.tsx"
```

## Parallel Example: Phase 2 (Foundational)

```bash
# Iniciar em paralelo:
Task T004: "Adicionar models ao prisma/schema.prisma"
Task T006: "TypeScript augmentation em src/types/next-auth.d.ts"
Task T009: "verificarOwnership() em src/lib/auth/ownership.ts"

# Após T004:
Task T005: "npx prisma migrate dev --name add-auth-models"

# Após T005 + T006:
Task T007: "NextAuth config em src/lib/auth/config.ts"

# Após T007:
Task T008: "NextAuth route handler em src/app/api/auth/[...nextauth]/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001–T003)
2. Completar Phase 2: Foundational — **CRÍTICO** (T004–T009)
3. Completar Phase 3: US1 Login (T010–T013)
4. **PARAR E VALIDAR**: Cenários 1, 2, 3, 6 do `quickstart.md`
5. Demo/deploy com login funcional

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 (Login) → testar → **MVP funcional** 🎯
3. US2 (Cadastro) → testar → novos usuários conseguem criar conta
4. US3 (Proteção) → testar → rotas seguras
5. US4 (Sessão) → verificar → persistência confirmada
6. Polish → validação completa dos 10 cenários

### Atenção: Constitution Antipattern #9

Tasks T010 e T014 são **OBRIGATÓRIAS** antes de T012/T013 e T016/T017. Implementar `login-form.tsx`, `cadastro-form.tsx`, `login/page.tsx` ou `cadastro/page.tsx` sem invocar `/frontend-design` primeiro viola o Antipattern #9 da Constitution.

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências entre si
- [Story] mapeia cada task para sua User Story para rastreabilidade
- T007 (`lib/auth/config.ts`) é o arquivo mais crítico — concentra providers, adapter, callbacks e events
- T010 e T014 (`/frontend-design`) são pré-requisitos de design, não de infraestrutura — podem iniciar após Phase 1
- Normalização de e-mail (`trim().toLowerCase()`) é obrigatória em T011 e T015 (FR-010)
- Commit após cada task ou grupo lógico concluído
- Parar em qualquer checkpoint para validar a story independentemente
