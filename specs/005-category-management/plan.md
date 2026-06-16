# Implementation Plan: Gestão de Categorias do Cardápio

**Branch**: `005-category-management` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-category-management/spec.md`

## Summary

Implementar CRUD completo de categorias do cardápio com drag-and-drop de reordenação, scoped ao restaurante da sessão autenticada. Stack: Next.js 16 API Routes + Prisma 5 (PostgreSQL) + `@dnd-kit/sortable` + Radix UI Dialog. A página `/dashboard/categorias` usa Server Component para fetch inicial e Client Components para interatividade.

## Technical Context

**Language/Version**: TypeScript 5, React 18, Next.js 16 (Turbopack)

**Primary Dependencies**: Prisma 5, next-auth v4, Zod 3, Tailwind CSS 3, `@dnd-kit/core` + `@dnd-kit/sortable` (a adicionar), `@radix-ui/react-dialog` (a adicionar)

**Storage**: PostgreSQL via Supabase (Prisma client)

**Testing**: Validação manual via quickstart.md (sem test suite automatizada no MVP)

**Target Platform**: Web (mobile-first, Next.js server)

**Project Type**: Web application SaaS (dashboard admin)

**Performance Goals**: Listagem carrega em < 2s em conexão 4G; reordenação persiste em < 1s após drop

**Constraints**: Sem cross-restaurant data leakage; categoria com itens não pode ser deletada; `ordem` sempre persistida no banco

**Scale/Scope**: MVP — dezenas de categorias por restaurante, sem paginação

## Constitution Check

*Avaliado contra `constitution.md` v1.5.0 — todos os gates PASS*

| Princípio | Status | Evidência |
|---|---|---|
| I. Mobile First | ✅ PASS | Página usa layout do dashboard shell (bottom-nav mobile, sidebar desktop). Touch targets ≥ 44×44px nos drag handles e ícones de ação. |
| II. Server Components | ✅ PASS | `page.tsx` é Server Component que busca categorias e passa para Client Component. Fetch não ocorre em Client Component. |
| III. Segurança em Todas as Camadas | ✅ PASS | Zod em todos os endpoints. `obterRestauranteDaSessao()` centralizado em `ownership.ts`. Ownership verificado antes de qualquer mutação. |
| IV. Todos os Estados da UI | ✅ PASS | FR-011 mandates loading (skeleton), erro (retry), vazio (CTA). Reordenação usa optimistic update. |
| V. Arquitetura Limpa | ✅ PASS | hooks/ para mutações de API, lib/ para auth/ownership, components/ui/ para primitivos, sem cross-domain imports. |

| Antipadrão | Status | Evidência |
|---|---|---|
| #1 Client onde Server resolve | ✅ PASS | Fetch inicial no Server Component |
| #4 Ownership ad-hoc | ✅ PASS | `obterRestauranteDaSessao()` centralizado, usado em todos os routes |
| #6 Sem optimistic update | ✅ PASS | `use-categorias.ts` implementa optimistic state para todas as mutações |
| #8 N+1 Prisma | ✅ PASS | `findMany` com `_count: { select: { itens: true } }` em query única |
| #9 Layout sem /frontend-design | ⚠️ OBRIGATÓRIO | `/frontend-design` DEVE ser acionado antes de implementar `categoria-list.tsx`, `categoria-item.tsx`, `categoria-modal.tsx` e o empty state |

## Project Structure

### Documentation (this feature)

```text
specs/005-category-management/
├── plan.md              ✅ (este arquivo)
├── research.md          ✅ (Phase 0 — decisões técnicas)
├── data-model.md        ✅ (Phase 1 — Categoria + Item stub)
├── contracts/
│   └── api.md           ✅ (Phase 1 — 5 endpoints documentados)
├── quickstart.md        ✅ (Phase 1 — 8 cenários de validação)
└── tasks.md             ⏳ (Phase 2 — /speckit-tasks)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma          ← add Categoria + Item models; add categorias[] to Restaurante

src/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── categorias/
│   │           └── page.tsx           ← Server Component: fetch + pass to CategoriaList
│   └── api/
│       └── categorias/
│           ├── route.ts               ← GET (list) + POST (create)
│           ├── [id]/
│           │   └── route.ts           ← PUT (rename) + DELETE (guarded)
│           └── reorder/
│               └── route.ts           ← PATCH (bulk reorder, transactional)
├── components/
│   ├── categorias/                    ← new domain folder
│   │   ├── categoria-list.tsx         ← Client: DnD sortable container
│   │   ├── categoria-item.tsx         ← Client: single row (drag handle + actions)
│   │   ├── categoria-modal.tsx        ← Client: create/edit dialog
│   │   └── categorias-empty-state.tsx ← Server-compatible: empty state CTA
│   └── ui/
│       └── dialog.tsx                 ← new: Radix Dialog primitive
├── hooks/
│   └── use-categorias.ts              ← Client: CRUD + reorder with optimistic updates
├── lib/
│   └── auth/
│       └── ownership.ts               ← extend: add obterRestauranteDaSessao()
└── types/
    └── categoria.ts                   ← CategoriaDto interface
```

**Structure Decision**: Single Next.js project (Option 1 adapted for Next.js app router). API routes live in `app/api/`. UI split between Server Component page and Client Component subtree. Domain components go in `components/categorias/` following the same pattern as `components/auth/`, `components/dashboard/`, `components/onboarding/`.

## Implementation Sequence

### 0. Dependencies
- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @radix-ui/react-dialog`

### 1. Schema & Migration
- Add `Categoria` model, `Item` stub, `categorias` relation to `Restaurante`
- Run `npx prisma migrate dev --name add-categoria-item`
- Regenerate Prisma client

### 2. Types & Auth Extension
- Create `src/types/categoria.ts` (`CategoriaDto`)
- Extend `src/lib/auth/ownership.ts` with `obterRestauranteDaSessao()`

### 3. API Routes
Order: GET+POST → PUT+DELETE → PATCH reorder

Each route: Zod validation → ownership check → Prisma op → `ok()` / `erro()`

### 4. UI Primitive
- Create `src/components/ui/dialog.tsx` (Radix Dialog wrapper)

### 5. Frontend Design Gate
**⛔ STOP — run `/frontend-design` before writing any component code**
Prompt should include: the wireframe from spec.md, the constitution color tokens, mobile-first requirement, and the three states (empty, list, modal).

### 6. Components & Hook
- `use-categorias.ts` — optimistic CRUD + reorder state
- `categorias-empty-state.tsx` — empty state with CTA
- `categoria-modal.tsx` — create/edit form with Radix Dialog
- `categoria-item.tsx` — row with `@dnd-kit/sortable` SortableItem
- `categoria-list.tsx` — DnD context + sortable list + modal integration

### 7. Page Integration
- Update `src/app/(dashboard)/dashboard/categorias/page.tsx`:
  - Server Component: call `obterRestauranteDaSessao()`, fetch categories via Prisma
  - Pass initial data to `CategoriaList` Client Component

## Complexity Tracking

No constitution violations requiring justification.
