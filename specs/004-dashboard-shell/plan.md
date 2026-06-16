# Implementation Plan: Dashboard Shell

**Branch**: `004-dashboard-shell` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-dashboard-shell/spec.md`

## Summary

Implementar o shell do painel administrativo: `(dashboard)/layout.tsx` Server Component que busca o nome do restaurante diretamente via Prisma, renderiza sidebar fixa no desktop (≥ 768px) e bottom navigation fixa no mobile (< 768px), header com nome do restaurante e menu de usuário com logout, `loading.tsx` para skeleton de transições, e atualização da `dashboard/page.tsx` com estado vazio + placeholder. Toda a proteção de rota já existe em `middleware.ts`.

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode, sem `any`, sem `as unknown`

**Primary Dependencies**: Next.js 16 App Router, React 18, next-auth v4 (`getServerSession()`), Prisma 5.x, Tailwind CSS 3, lucide-react (ícones), shadcn/ui (primitivos UI)

**Storage**: Leitura somente — `prisma.restaurante.findUnique({ where: { donoId }, select: { nome: true } })` no Server Component do layout

**Testing**: Validação manual via [`quickstart.md`](./quickstart.md) — sem test suite nesta fase

**Target Platform**: Web — mobile-first, mínimo 320px de viewport; breakpoints md (768px) para sidebar/bottom-nav toggle

**Project Type**: SaaS web application (Next.js 16 App Router, monorepo)

**Performance Goals**: Layout completo renderizado (SSR) < 2s em 4G simulada; transição entre seções com skeleton visível < 200ms

**Constraints**:
- Sidebar somente no desktop (md+); bottom navigation somente no mobile — sem sidebar colapsável (proibido pela constituição)
- `'use client'` apenas em componentes que usam `usePathname()` (sidebar, bottom-nav) ou `signOut()` (user-menu)
- Layout Server Component faz fetch direto via Prisma, não via API route
- Proteção de rota permanece exclusivamente em `middleware.ts` (já implementado)
- Área mínima de toque de 44×44px em todos os itens de navegação
- Sem scroll horizontal em qualquer viewport (320px a 1280px+)

**Scale/Scope**: MVP — layout base para Etapas 4–8; as rotas `/dashboard/cardapio`, `/dashboard/categorias`, `/dashboard/configuracoes` existem como placeholders até as etapas correspondentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| I. Mobile First | ✅ | Bottom nav no mobile, sidebar fixa no desktop; sem sidebar colapsável; 44×44px mínimo de toque; sem scroll horizontal |
| II. Server Components | ✅ | `layout.tsx` é Server Component; `'use client'` apenas em `sidebar.tsx`, `bottom-nav.tsx`, `user-menu.tsx` — todos precisam de `usePathname()` ou `signOut()` |
| III. Segurança | ✅ | Proteção de rota já em `middleware.ts`; sem duplicação em páginas; `verificarOwnership()` já cobre as API routes |
| IV. Todos os estados de UI | ✅ | `loading.tsx` cobre transições; `dashboard/page.tsx` tem estado vazio com CTA; nenhum dado assíncrono sem skeleton |
| V. Arquitetura Limpa | ✅ | Componentes em `components/dashboard/`; sem imports cruzados com `(marketing)`; lógica em lib/; componentes apenas renderizam |

**Antipadrões verificados:**
- ❌ Client Component onde Server Component resolve → layout busca dados via Prisma, não via hook
- ❌ Sidebar colapsável no mobile → bottom navigation conforme constituição
- ❌ Estados de loading ignorados → `loading.tsx` + skeleton na dashboard page

## Project Structure

### Documentation (this feature)

```text
specs/004-dashboard-shell/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code

```text
src/
├── app/
│   └── (dashboard)/
│       ├── layout.tsx              # NOVO — Server Component, busca nome do restaurante
│       ├── loading.tsx             # NOVO — skeleton para transições de rota
│       └── dashboard/
│           └── page.tsx            # ATUALIZAR — estado vazio com placeholder
└── components/
    └── dashboard/
        ├── nav-items.ts            # NOVO — array de itens de navegação (config compartilhada)
        ├── sidebar.tsx             # NOVO — 'use client', sidebar desktop com active state
        ├── bottom-nav.tsx          # NOVO — 'use client', bottom nav mobile com active state
        ├── header.tsx              # NOVO — Server Component, header com nome + UserMenu
        └── user-menu.tsx           # NOVO — 'use client', dropdown + signOut
```

**Arquivos não modificados**: `middleware.ts` (proteção de rota já implementada), `src/app/layout.tsx` (root layout mantido), `src/types/`, `src/lib/`

## Complexity Tracking

Sem violações à constituição — nenhuma justificativa necessária.
