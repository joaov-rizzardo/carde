# Implementation Plan: Onboarding do Restaurante

**Branch**: `003-restaurant-onboarding` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-restaurant-onboarding/spec.md`

## Summary

Implementar o fluxo de onboarding guiado para criação do restaurante: modelo `Restaurante` no Prisma com `donoId @unique` (1:1 com User), endpoints `POST /api/restaurantes` e `GET /api/restaurantes/me`, geração de slug única via `lib/restaurante/slug.ts`, middleware customizado com `getToken()` que redireciona com base em `restauranteId` no JWT, e página `/onboarding` Mobile First com preview de slug em tempo real e color picker nativo.

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode, sem `any`, sem `as unknown`

**Primary Dependencies**: Prisma 5.x, NextAuth v4 (`getToken()` para middleware Edge), Zod 3.x, shadcn/ui, React 18 (`useSession().update()` para refresh de JWT após criação)

**Storage**: Supabase PostgreSQL via Prisma — novo modelo `Restaurante` com `donoId @unique`

**Testing**: Validação manual via [`quickstart.md`](./quickstart.md) — sem test suite nesta fase

**Target Platform**: Web — mobile-first, mínimo 320px de viewport

**Project Type**: SaaS web application (Next.js 16 App Router, monorepo)

**Performance Goals**: Preview de slug derivado em cada keystroke sem debounce (função pura, síncrona); criação de restaurante < 2s; `gerarSlugUnico()` resolve colisão em < 100ms (máximo 3 tentativas esperadas no MVP)

**Constraints**: `donoId @unique` no banco garante invariante 1 restaurante/usuário; slug `@unique` + retry numérico sem race condition destrutiva (colisão no `create` → catch + retry); `getToken()` em Edge runtime sem Prisma; `update()` de NextAuth necessário após criação para propagar `restauranteId` no JWT antes do redirect; sem `any` no TypeScript; proteção de rota SOMENTE em `middleware.ts`

**Scale/Scope**: MVP — 1 restaurante por usuário; sem multi-unidade; slug permanente (mudança exigiria reimpressão de QR codes)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile First | ✅ PASS | Formulário de onboarding mobile-first; `input[type=color]` nativo; botão ≥44px de área de toque; sem scroll horizontal |
| II. Server Components por Padrão | ✅ PASS | Shell de página `/onboarding` é RSC (verifica sessão → render form ou redirect); apenas `OnboardingForm` é `'use client'` (estado de formulário, preview de slug, event handlers) |
| III. Segurança em Todas as Camadas | ✅ PASS | Zod valida corpo do POST antes de qualquer operação; `verificarOwnership()` centralizado em ambas as API routes; middleware com `getToken()` lê JWT sem DB; proteção de rota exclusivamente em `middleware.ts` |
| IV. Todos os Estados da UI São Tratados | ✅ PASS | OnboardingForm trata: idle, submitting (spinner no botão, desabilita input), erro de validação (campo vazio inline), erro de API (mensagem inline sem reload), success (update JWT + redirect) |
| V. Arquitetura Limpa por Domínio | ✅ PASS | Lógica de slug em `lib/restaurante/slug.ts`; API routes em `app/api/restaurantes/`; hook em `hooks/use-criar-restaurante.ts`; componente em `components/onboarding/`; sem imports cruzados entre `(dashboard)` e `(marketing)` |

| Antipattern | Status | Notes |
|-------------|--------|-------|
| 1. Client Component onde RSC resolve | ✅ CLEAR | Page shell é RSC; apenas o form interativo é client |
| 2. Lógica de negócio em componentes | ✅ CLEAR | `gerarSlug()` em `lib/restaurante/slug.ts`; chamada de API em hook — componente apenas renderiza |
| 3. Estados de loading/erro ignorados | ✅ CLEAR | 5 estados no OnboardingForm com UI explícita |
| 4. Ownership verificado ad-hoc | ✅ CLEAR | Ambas as API routes chamam `verificarOwnership()` centralizado |
| 5. Upload sem validação dupla | ✅ CLEAR | N/A — cor é hex string, não arquivo |
| 6. Mutações sem feedback otimista | ✅ CLEAR | N/A — criação de restaurante é irreversível e única; spinner + redirect são suficientes |
| 7. `any` no TypeScript | ✅ CLEAR | Tipos explícitos em todas as funções; `Restaurante` tipado via Prisma client gerado |
| 8. Queries N+1 | ✅ CLEAR | Sem queries de lista nesta feature; apenas `findUnique` por `donoId` |

## Project Structure

### Documentation (this feature)

```text
specs/003-restaurant-onboarding/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output (/speckit-plan output)
├── data-model.md        # Phase 1 output (/speckit-plan output)
├── quickstart.md        # Phase 1 output (/speckit-plan output)
├── contracts/
│   ├── api.md           # Phase 1 output — contratos dos 2 endpoints REST
│   └── middleware.md    # Phase 1 output — lógica de roteamento do middleware
└── tasks.md             # Phase 2 output (/speckit-tasks — NÃO criado por /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── onboarding/
│   │   └── page.tsx               # RSC shell: verifica sessão → render OnboardingForm
│   ├── api/
│   │   └── restaurantes/
│   │       ├── route.ts           # POST /api/restaurantes (Zod + verificarOwnership)
│   │       └── me/
│   │           └── route.ts       # GET /api/restaurantes/me (verificarOwnership)
│   └── (dashboard)/
│       └── dashboard/             # (inalterado)
├── components/
│   └── onboarding/
│       └── onboarding-form.tsx    # 'use client' — formulário + slug preview + color picker
├── hooks/
│   └── use-criar-restaurante.ts   # Encapsula POST /api/restaurantes + update() + redirect
├── lib/
│   └── restaurante/
│       └── slug.ts                # gerarSlug() (pura, síncrona) + gerarSlugUnico() (async, DB)
├── types/
│   └── next-auth.d.ts             # Atualizado: restauranteId?: string | null no JWT
└── middleware.ts                  # Atualizado: custom middleware com getToken()
```

**Structure Decision**: Monorepo Next.js com App Router. `/onboarding` fica em `app/onboarding/` (fora de route groups) — tem layout próprio sem sidebar e sem marketing nav. API routes seguem convenção REST do projeto. `lib/restaurante/` cria o domínio de restaurante espelhando `lib/auth/`. `hooks/` é novo diretório, seguindo Princípio V da constitution.
