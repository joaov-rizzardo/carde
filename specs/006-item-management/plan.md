# Implementation Plan: Gestão de Itens do Cardápio

**Branch**: `006-item-management` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-item-management/spec.md`

## Summary

Implementar CRUD completo de itens do cardápio (nome, preço, descrição, categoria, disponibilidade, destaque), agrupados por categoria em `/dashboard/cardapio`, com toggle otimista de disponibilidade e exclusão com confirmação. Stack: Next.js 16 API Routes + Prisma 5 (PostgreSQL), reutilizando os padrões já estabelecidos em `005-category-management` (Server Component para fetch inicial, hook de Client Component para mutações otimistas, `ApiResponse<T>` padronizado, ownership verificado inline por rota).

## Technical Context

**Language/Version**: TypeScript 5, React 18, Next.js 16 (Turbopack)

**Primary Dependencies**: Prisma 5, next-auth v4, Zod 3, Tailwind CSS 3, `@radix-ui/react-dialog` (já existente), `@radix-ui/react-select` (a adicionar — combobox de categoria), `@radix-ui/react-switch` (a adicionar — toggle de disponibilidade/destaque)

**Storage**: PostgreSQL via Supabase (Prisma client); `Item.preco` como `Decimal @db.Decimal(10,2)`

**Testing**: Validação manual via quickstart.md (sem test suite automatizada no MVP, mesmo padrão da feature 005)

**Target Platform**: Web (mobile-first, Next.js server)

**Project Type**: Web application SaaS (dashboard admin)

**Performance Goals**: Listagem agrupada carrega em < 2s em conexão 4G (SC-005); toggle de disponibilidade reflete em < 1s (otimista, SC-002)

**Constraints**: Sem cross-restaurant data leakage (FR-008); criação de item bloqueada sem categoria existente (FR-003); preço sempre persistido com 2 casas decimais (FR-011); `ordem` sempre recalculada como "append ao final" na criação/mudança de categoria (FR-004a)

**Scale/Scope**: MVP — dezenas de itens por restaurante, sem paginação, sem upload de foto real (apenas campo `fotoUrl` no modelo)

## Constitution Check

*Avaliado contra `constitution.md` v1.5.0 — todos os gates PASS*

| Princípio | Status | Evidência |
|---|---|---|
| I. Mobile First | ✅ PASS | Página vive no dashboard shell (bottom-nav mobile / sidebar desktop, já implementado). Toggle de disponibilidade e botões de ação com área mínima 44×44px, seguindo o padrão de `categoria-item.tsx`. |
| II. Server Components | ✅ PASS | `page.tsx` é Server Component: busca categorias com itens aninhados via Prisma e passa para `ItensList` (Client Component). Nenhum fetch inicial ocorre em Client Component. |
| III. Segurança em Todas as Camadas | ✅ PASS | Zod valida todo body de API antes de qualquer operação. Ownership de Item é transitivo via `categoria.restauranteId`, verificado inline em cada rota (mesmo padrão usado em `/api/categorias/[id]`), usando `obterRestauranteDaSessao()` para obter o restaurante da sessão. |
| IV. Todos os Estados da UI | ✅ PASS | FR-010 mandata loading (skeleton), erro (retry) e vazio (CTA). Toggle de disponibilidade usa atualização otimista com reversão + toast em falha (FR-006, US3). |
| V. Arquitetura Limpa | ✅ PASS | `hooks/use-itens.ts` centraliza CRUD + toggle; `lib/` permanece livre de React; `components/itens/` é domínio isolado, sem cruzar com `(marketing)`; `components/ui/select.tsx` e `components/ui/switch.tsx` são primitivos sem lógica de negócio. |

| Antipadrão | Status | Evidência |
|---|---|---|
| #1 Client onde Server resolve | ✅ PASS | Fetch inicial (categorias + itens) no Server Component da página. |
| #4 Ownership ad-hoc | ✅ PASS | Mesmo padrão inline já usado em `005` (buscar entidade, comparar `restauranteId`); centralizado por meio de `obterRestauranteDaSessao()`. Sem duplicação de lógica de sessão. |
| #6 Sem optimistic update | ✅ PASS | `use-itens.ts` aplica optimistic update no toggle de disponibilidade e reverte com toast em erro. |
| #8 N+1 Prisma | ✅ PASS | Página e `GET /api/itens` buscam categorias com `include: { itens: { orderBy: { ordem: 'asc' } } }` em uma única query — sem loop de queries por categoria. |
| #9 Layout sem /frontend-design | ⚠️ OBRIGATÓRIO | `/frontend-design` DEVE ser acionado antes de implementar `itens-list.tsx`, `categoria-section.tsx`, `item-row.tsx`, `item-modal.tsx` e `itens-empty-state.tsx`. |

## Project Structure

### Documentation (this feature)

```text
specs/006-item-management/
├── plan.md              ✅ (este arquivo)
├── research.md          ✅ (Phase 0 — decisões técnicas)
├── data-model.md        ✅ (Phase 1 — Item + relação com Categoria)
├── contracts/
│   └── api.md           ✅ (Phase 1 — 4 endpoints documentados)
├── quickstart.md        ✅ (Phase 1 — cenários de validação)
└── tasks.md             ⏳ (Phase 2 — /speckit-tasks)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma          ← estender model Item com nome, preco, descricao, fotoUrl,
                              disponivel, destaque, ordem (default 0)

src/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── cardapio/
│   │           └── page.tsx               ← Server Component: fetch categorias+itens, passa para ItensList
│   └── api/
│       └── itens/
│           ├── route.ts                   ← GET (categorias com itens aninhados) + POST (create, ordem append)
│           └── [id]/
│               ├── route.ts               ← PUT (editar todos os campos, recalcula ordem se categoria mudar) + DELETE
│               └── disponibilidade/
│                   └── route.ts           ← PATCH (toggle disponivel, otimista)
├── components/
│   ├── itens/                             ← novo domínio
│   │   ├── itens-list.tsx                 ← Client: orquestra estados (loading/erro/vazio) + seções por categoria
│   │   ├── categoria-section.tsx          ← Client: cabeçalho de categoria + itens (ou indicação de vazia)
│   │   ├── item-row.tsx                   ← Client: linha do item (toggle, destaque, editar, excluir com confirmação inline)
│   │   ├── item-modal.tsx                 ← Client: dialog de criar/editar (nome, preço, descrição, categoria, destaque)
│   │   └── itens-empty-state.tsx          ← Client: CTA vazio (ou orientação "crie uma categoria primeiro")
│   └── ui/
│       ├── select.tsx                     ← novo: Radix Select (combobox de categoria)
│       ├── switch.tsx                     ← novo: Radix Switch (disponibilidade / destaque)
│       └── textarea.tsx                   ← novo: textarea nativo estilizado (descrição)
├── hooks/
│   └── use-itens.ts                       ← Client: CRUD + toggle disponibilidade com optimistic updates
└── types/
    └── item.ts                            ← ItemDto, CategoriaComItensDto
```

**Structure Decision**: Mesma estrutura de projeto único usada em `005-category-management` (Next.js App Router, API routes em `app/api/`). Domínio `itens/` segue o padrão de `categorias/`. Reaproveita `obterRestauranteDaSessao()`, `ApiResponse<T>`/`ok()`/`erro()` e `components/ui/dialog.tsx` já existentes — apenas três primitivos novos (`select`, `switch`, `textarea`) são necessários.

## Implementation Sequence

### 0. Dependencies
- `npm install @radix-ui/react-select @radix-ui/react-switch`

### 1. Schema & Migration
- Estender `Item` com `nome`, `preco` (`Decimal @db.Decimal(10,2)`), `descricao`, `fotoUrl`, `disponivel` (default `true`), `destaque` (default `false`), `ordem` (default `0`)
- `npx prisma migrate dev --name extend-item-fields`
- Regenerar Prisma client

### 2. Types
- Criar `src/types/item.ts` (`ItemDto`, `CategoriaComItensDto`)

### 3. API Routes
Ordem: GET+POST → PUT+DELETE → PATCH disponibilidade

Cada rota: Zod → `obterRestauranteDaSessao()` → ownership inline (item→categoria→restauranteId) → operação Prisma → `ok()` / `erro()`

### 4. UI Primitives
- `src/components/ui/select.tsx` (Radix Select wrapper)
- `src/components/ui/switch.tsx` (Radix Switch wrapper)
- `src/components/ui/textarea.tsx` (textarea estilizado, mesmo padrão visual de `input.tsx`)

### 5. Frontend Design Gate
**⛔ STOP — acionar `/frontend-design` antes de escrever qualquer componente em `components/itens/`**
Prompt deve incluir: wireframe do spec.md, tokens de cor da constitution, agrupamento por categoria, badge de "destaque" e "pausado", e os três estados obrigatórios (loading/erro/vazio).

### 6. Components & Hook
- `use-itens.ts` — optimistic CRUD + toggle de disponibilidade
- `itens-empty-state.tsx` — vazio com CTA, ou orientação a criar categoria primeiro (FR-003)
- `item-modal.tsx` — formulário criar/editar com Radix Dialog + Select + Switch
- `item-row.tsx` — linha com toggle, badges, ações editar/excluir (confirmação inline, mesmo padrão de `categoria-item.tsx`)
- `categoria-section.tsx` — cabeçalho de categoria + lista de `item-row`, ou indicação de categoria vazia
- `itens-list.tsx` — orquestra loading/erro/vazio, agrupa itens recebidos por `categoriaId` e renderiza `categoria-section` por categoria, na ordem recebida

### 7. Page Integration
- Criar `src/app/(dashboard)/dashboard/cardapio/page.tsx`:
  - Server Component: `obterRestauranteDaSessao()`, busca `categorias` com `include: { itens: { orderBy: { ordem: 'asc' } } }`, `orderBy: { ordem: 'asc' }`
  - Passa dados iniciais para `ItensList` Client Component

## Complexity Tracking

Nenhuma violação de constitution a justificar.
