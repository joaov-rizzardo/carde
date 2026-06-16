# Tasks: Onboarding do Restaurante

**Input**: Design documents from `/specs/003-restaurant-onboarding/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓, contracts/middleware.md ✓, quickstart.md ✓

**Tests**: Validação manual via quickstart.md — sem test suite nesta fase (conforme plan.md).

**Organization**: Tasks organizadas por User Story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User Story a que pertence (US1, US2, US3)
- Inclui caminhos de arquivo exatos nas descrições

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Adicionar modelo Prisma e aplicar migration — pré-requisito para todas as demais fases.

- [X] T001 Adicionar model `Restaurante` e relação `restaurante Restaurante?` no model `User` em `prisma/schema.prisma`
- [X] T002 Aplicar migration no banco e regenerar Prisma Client: `npx prisma migrate dev --name add-restaurante && npx prisma generate`

**Checkpoint**: Migration aplicada e `prisma.restaurante` disponível no client — fases seguintes podem começar.

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: JWT tipado, utilitários de slug e middleware de roteamento — DEVEM ser concluídos antes de qualquer User Story.

**⚠️ CRÍTICO**: Nenhuma User Story pode começar sem esta fase completa.

- [X] T003 [P] Adicionar `restauranteId?: string | null` à interface `JWT` em `src/types/next-auth.d.ts`
- [X] T004 [P] Implementar `gerarSlug()` (pura, síncrona) e `gerarSlugUnico()` (async, retry com DB) em `src/lib/restaurante/slug.ts`
- [X] T005 Atualizar callback `jwt` em `src/lib/auth/config.ts` para popular `token.restauranteId` no primeiro login (`user` presente) e após `trigger === 'update'` (busca `prisma.restaurante.findUnique({ where: { donoId: token.id } })`)
- [X] T006 Criar `src/middleware.ts` com função customizada usando `getToken()` — implementa tabela de decisão completa: `/dashboard/*` sem token → `/login`; `/dashboard/*` com `restauranteId: null` → `/onboarding`; `/onboarding/*` sem token → `/login`; `/onboarding/*` com `restauranteId: string` → `/dashboard`; matcher `['/dashboard/:path*', '/onboarding/:path*']`

**Checkpoint**: Middleware ativo e slug util disponível — User Stories podem ser implementadas.

---

## Phase 3: User Story 1 — Criação do Restaurante no Primeiro Login (P1) 🎯 MVP

**Goal**: Usuário sem restaurante é redirecionado para `/onboarding`, preenche o nome, vê preview do slug em tempo real, submete e é levado ao dashboard com JWT atualizado.

**Independent Test**: Login com usuário novo (sem restaurante) → acessa `/dashboard` → redirect para `/onboarding` → preenche nome → submete → redirect para `/dashboard` → Prisma Studio confirma `Restaurante` criado. (quickstart.md Cenários 1, 2 e 3)

### Implementation

- [X] T007 [P] [US1] Implementar `POST /api/restaurantes` em `src/app/api/restaurantes/route.ts`: `verificarOwnership()` → Zod (`criarRestauranteSchema`) → `gerarSlugUnico()` → `prisma.restaurante.create()` → captura `P2002` (409) → retorna `ApiResponse<RestauranteDto>` 201
- [X] T008 [P] [US1] Criar hook `useCriarRestaurante` em `src/hooks/use-criar-restaurante.ts`: encapsula `POST /api/restaurantes` + `useSession().update()` + `router.push('/dashboard')`; expõe `{ criarRestaurante, isPending, erro }`
- [X] T009 [US1] Criar `OnboardingForm` em `src/components/onboarding/onboarding-form.tsx`: `'use client'`; campo nome + preview de slug derivado via `gerarSlug()` a cada keystroke (sem debounce); `<input type="color">` com wrapper Tailwind; 5 estados: idle, submitting (spinner + input desabilitado), erro de validação inline, erro de API inline, success; usa `useCriarRestaurante`
- [X] T010 [US1] Criar RSC shell `/onboarding` em `src/app/onboarding/page.tsx`: verifica sessão com `getServerSession()` → renderiza `<OnboardingForm />`; proteção de rota exclusivamente no middleware (T006)

**Checkpoint**: US1 totalmente funcional e testável de forma independente — usuário consegue criar restaurante end-to-end.

---

## Phase 4: User Story 2 — Bloqueio para Usuários com Restaurante (P2)

**Goal**: Usuário que já tem restaurante não acessa `/onboarding` — redirect automático para `/dashboard`.

**Independent Test**: Login com usuário que já tem restaurante → acessa `/onboarding` diretamente → redirect imediato para `/dashboard` sem renderizar formulário. (quickstart.md Cenário 4 e Cenário 6)

> **Nota**: Toda a lógica de roteamento do US2 está implementada em `src/middleware.ts` (T006, Phase 2). Nenhuma implementação adicional é necessária — esta fase valida que o middleware está correto para os cenários do US2.

- [X] T011 [US2] Verificar em `src/middleware.ts` que o matcher cobre `/onboarding/:path*` e que a tabela de decisão para `restauranteId: string` redireciona para `/dashboard` — validar manualmente via quickstart.md Cenários 4 e 6

**Checkpoint**: Invariante "1 usuário = 1 restaurante" garantida pelo middleware sem lógica extra nas páginas.

---

## Phase 5: User Story 3 — Consulta do Restaurante do Usuário Logado (P3)

**Goal**: Endpoint `GET /api/restaurantes/me` retorna dados do restaurante do usuário autenticado (ou `null` se não existir) — viabiliza módulos futuros (dashboard, middleware, SSR).

**Independent Test**: Usuário autenticado com restaurante → `GET /api/restaurantes/me` → 200 com `{ sucesso: true, dados: { id, slug, nome, corPrimaria, ativo, criadoEm } }`. Usuário sem restaurante → `{ sucesso: true, dados: null }`. (quickstart.md Cenário 5)

- [X] T012 [P] [US3] Implementar `GET /api/restaurantes/me` em `src/app/api/restaurantes/me/route.ts`: `verificarOwnership()` → `prisma.restaurante.findUnique({ where: { donoId }, select: { id, slug, nome, corPrimaria, ativo, criadoEm } })` → retorna `ApiResponse<RestauranteDto | null>` 200

**Checkpoint**: Todas as User Stories implementadas e individualmente testáveis.

---

## Phase 6: Polish & Validação Final

**Purpose**: Validação de ponta a ponta de todos os cenários definidos no quickstart.md.

- [ ] T013 Rodar validação completa dos 7 cenários em `specs/003-restaurant-onboarding/quickstart.md` (Cenários 1–7, incluindo edge case de colisão de slug)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — começa imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 (T002 deve ter gerado o client Prisma) — BLOQUEIA todas as User Stories
- **US1 (Phase 3)**: Depende de Phase 2 completa — sem dependência de US2 ou US3
- **US2 (Phase 4)**: Implementada por T006 (Phase 2) — fase de verificação, pode rodar após Phase 2
- **US3 (Phase 5)**: Depende apenas de Phase 2 — pode ser implementada em paralelo com US1
- **Polish (Phase 6)**: Depende de todas as User Stories completas

### User Story Dependencies

- **US1 (P1)**: Depende de Foundational (Phase 2) — sem dependência de US2 ou US3
- **US2 (P2)**: Implementada em T006 (Phase 2) — verificação independente após Phase 2
- **US3 (P3)**: Depende de Foundational (Phase 2) — independente de US1 e US2

### Within Each User Story

- T007 e T008: paralelos (arquivos diferentes)
- T009: após T007 (hook e API devem estar definidos para o componente chamar)
- T010: após T009 (page shell importa `OnboardingForm`)
- T012: independente (apenas chama Prisma, não depende de US1)

---

## Parallel Example: User Story 1

```bash
# Etapa 1 — rodar em paralelo:
Task T007: "Implementar POST /api/restaurantes em src/app/api/restaurantes/route.ts"
Task T008: "Criar hook useCriarRestaurante em src/hooks/use-criar-restaurante.ts"

# Etapa 2 — após T007 e T008:
Task T009: "Criar OnboardingForm em src/components/onboarding/onboarding-form.tsx"

# Etapa 3 — após T009:
Task T010: "Criar RSC shell /onboarding em src/app/onboarding/page.tsx"
```

## Parallel Example: Foundational Phase

```bash
# Rodar em paralelo após T002:
Task T003: "Adicionar restauranteId ao JWT em src/types/next-auth.d.ts"
Task T004: "Implementar slug utils em src/lib/restaurante/slug.ts"

# Após T003:
Task T005: "Atualizar jwt callback em src/lib/auth/config.ts"
Task T006: "Criar src/middleware.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Phase 1: Setup — migration do Prisma
2. Phase 2: Foundational — JWT types, slug utils, auth config, middleware
3. Phase 3: US1 — POST API, hook, form, page
4. **PARAR e VALIDAR**: quickstart.md Cenários 1, 2 e 3
5. Deploy/demo se pronto

### Incremental Delivery

1. Phase 1 + Phase 2 → Base técnica pronta
2. Phase 3 (US1) → Criação de restaurante funcional → Deploy MVP
3. Phase 4 (US2) → Verificar bloqueio (já implementado em Phase 2)
4. Phase 5 (US3) → Endpoint de consulta disponível para módulos futuros
5. Phase 6 → Validação completa → Ship

---

## Notes

- **[P]** = arquivos diferentes, sem dependências incompletas
- **[Story]** mapeia a task à User Story para rastreabilidade
- `verificarOwnership()` já existe em `src/lib/auth/ownership.ts` — não precisa ser criado
- `src/types/next-auth.d.ts` e `src/middleware.ts` já existem ou precisam ser criados/atualizados conforme indicado
- Sem test suite nesta fase — validação exclusivamente via quickstart.md
- **Marcar como `[x]` imediatamente ao concluir cada task, antes de iniciar a próxima**
- Commit após cada task ou grupo lógico
- Parar nos checkpoints para validar a User Story de forma independente
- Sem `any` no TypeScript — tipos explícitos obrigatórios em todos os arquivos novos
