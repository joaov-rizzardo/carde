# Tasks: Dashboard Shell

**Input**: Design documents from `specs/004-dashboard-shell/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Tests**: Manual validation via quickstart.md — no test suite this phase (per plan.md).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between them)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every description

---

## Phase 1: Setup (Shared Config)

**Purpose**: Static configuration with no React dependencies — prerequisite for all navigation components.

- [x] T001 Create shared navigation config array in `src/components/dashboard/nav-items.ts` (Cardápio → `/dashboard/cardapio` UtensilsCrossed, Categorias → `/dashboard/categorias` Tag, Configurações → `/dashboard/configuracoes` Settings; export type `NavItem = { href: string; label: string; icon: LucideIcon }`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: All components that `(dashboard)/layout.tsx` imports — must exist before layout can compile or any user story can be tested.

**⚠️ CRITICAL**: No user story is testable until this phase is complete.

- [x] T002 [P] Create `src/components/dashboard/user-menu.tsx` — `'use client'` dropdown with user initials avatar, email display, and "Sair" button calling `signOut({ callbackUrl: '/login' })` from `next-auth/react`; DropdownMenu from shadcn/ui; minimum 44×44px touch target
- [x] T003 [P] Create `src/components/dashboard/sidebar.tsx` — `'use client'`, imports `NavItem` from `nav-items.ts` and `usePathname` from `next/navigation`; renders fixed left sidebar visible only on `md:` (`hidden md:flex`); active item detected via `pathname.startsWith(item.href)`; active style uses `brand-accent` (#E85D04); inactive uses `brand-muted`; background `brand-primary` (#1A1A2E); min 44×44px per nav item
- [x] T004 [P] Create `src/components/dashboard/bottom-nav.tsx` — `'use client'`, same nav-items and active state logic as sidebar; renders fixed bottom bar visible only on mobile (`flex md:hidden`); icons + labels; min 44×44px per item; active color `brand-accent`; background `brand-primary`
- [x] T005 Create `src/components/dashboard/header.tsx` — Server Component; accepts `restaurantName: string` and `userEmail: string | null | undefined` and `userName: string | null | undefined` props from layout; renders top bar with restaurant name and `<UserMenu>` component; background `brand-primary`; no `'use client'`
- [x] T006 Create `src/app/(dashboard)/layout.tsx` — Server Component; calls `getServerSession(authConfig)` (redirect to `/login` if no session); queries `prisma.restaurante.findUnique({ where: { donoId: session.user.id }, select: { nome: true } })`; renders `<div className="flex h-screen overflow-hidden">`; imports `<Sidebar>` (desktop), `<BottomNav>` (mobile), `<Header>`; main content area: `<main className="flex-1 overflow-y-auto min-w-0">`; passes `restaurantName={restaurante?.nome ?? 'Meu Restaurante'}` to Header

**Checkpoint**: Foundation ready — all 4 user stories can now be tested as pages are added.

---

## Phase 3: User Story 1 — Navegar no desktop (Priority: P1) 🎯 MVP

**Goal**: Authenticated desktop user (≥768px) sees sidebar + header + content area and can navigate between sections with active state.

**Independent Test**: Quickstart Cenários 1, 3, 4 — `npm run dev` → login → `/dashboard` → verify sidebar visible with 3 items, header shows restaurant name, click each nav item and confirm active highlight.

- [x] T007 [US1] Update `src/app/(dashboard)/dashboard/page.tsx` — replace current content with empty state: heading "Bem-vindo ao Cardê 👋" (or without emoji per constitution), subtext explaining sections are coming, no async data fetch needed (no Suspense/skeleton required for this static page); keep as Server Component
- [x] T008 [P] [US1] Create `src/app/(dashboard)/dashboard/cardapio/page.tsx` — static Server Component placeholder: section heading "Cardápio", subtext "Em breve — Etapa 4"; no data fetch; enables active state for Cardápio nav item
- [x] T009 [P] [US1] Create `src/app/(dashboard)/dashboard/categorias/page.tsx` — static Server Component placeholder: section heading "Categorias", subtext "Em breve — Etapa 5"; enables active state for Categorias nav item
- [x] T010 [P] [US1] Create `src/app/(dashboard)/dashboard/configuracoes/page.tsx` — static Server Component placeholder: section heading "Configurações", subtext "Em breve — Etapa 6"; enables active state for Configurações nav item

**Checkpoint**: Desktop layout fully functional — US1 independently testable.

---

## Phase 4: User Story 2 — Navegar no mobile (Priority: P2)

**Goal**: Mobile user (<768px) sees bottom navigation (no sidebar), content occupies full width above bottom bar, no horizontal scroll at 320px.

**Independent Test**: Quickstart Cenários 2, 8 — DevTools → 375px viewport → `/dashboard` → verify bottom nav fixed at bottom, sidebar absent; throttle to Slow 4G, check no horizontal scroll at 320px.

- [x] T011 [US2] Update `src/app/(dashboard)/layout.tsx` main content wrapper to include `pb-16 md:pb-0` (clearance for bottom nav on mobile) and verify `overflow-hidden` on root wrapper prevents horizontal scroll; ensure `min-w-0` on flex children to prevent overflow; test layout at 320px viewport in browser DevTools

**Checkpoint**: Mobile layout fully functional — US2 independently testable.

---

## Phase 5: User Story 3 — Logout pelo menu do usuário (Priority: P2)

**Goal**: User opens the user menu in the header, clicks "Sair", session is terminated, redirected to `/login`, and accessing `/dashboard` directly no longer works.

**Independent Test**: Quickstart Cenário 5 — click user avatar in header → dropdown opens → "Sair" → redirected to `/login` → attempt `/dashboard` → redirected again.

- [x] T012 [US3] Verify `src/components/dashboard/user-menu.tsx` renders correctly within `<Header>` — open browser, confirm dropdown shows user initials avatar, email or name, and "Sair" button; confirm `signOut({ callbackUrl: '/login' })` redirects correctly; adjust UI spacing/sizing if needed to meet 44×44px touch target requirement

**Checkpoint**: Logout flow complete — US3 independently testable.

---

## Phase 6: User Story 4 — Loading state durante transições (Priority: P3)

**Goal**: When navigating between sections, a skeleton loading state appears in the content area before the page content renders.

**Independent Test**: Quickstart Cenário 7 — DevTools → Network → Slow 4G → click Cardápio → observe skeleton in content area → content appears without abrupt flash.

- [x] T013 [US4] Create `src/app/(dashboard)/loading.tsx` — skeleton Server Component leveraging Next.js App Router implicit Suspense boundary; renders content area placeholder with animated pulse skeleton cards (e.g., 3 skeleton rect blocks at 20% height); no `'use client'` needed; uses Tailwind `animate-pulse bg-gray-200 rounded`

**Checkpoint**: All 4 user stories complete and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, visual identity check, and edge case confirmation.

- [x] T014 [P] Run quickstart.md Cenários 1–8 in sequence and confirm all acceptance criteria pass — document any visual adjustments needed to match brand tokens (`brand-primary` #1A1A2E sidebar bg, `brand-accent` #E85D04 active item, `brand-warm` #F7F3EE or white content area)
- [x] T015 [P] Verify TypeScript strict mode: run `npx tsc --noEmit` and fix any `any` types, missing return types, or implicit type errors introduced by this feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 for T003/T004 — BLOCKS all user story testing
- **US1 (Phase 3)**: Depends on Phase 2 completion — can start as soon as T006 compiles
- **US2 (Phase 4)**: Depends on Phase 3 (needs placeholder pages for active state to be meaningful)
- **US3 (Phase 5)**: Depends on Phase 2 (user-menu.tsx), no dependency on US1/US2
- **US4 (Phase 6)**: Depends on Phase 2 (layout.tsx must exist); independent of US1–US3
- **Polish (Phase 7)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational (Phase 2) — no story dependencies
- **US2 (P2)**: Depends on US1 (placeholder pages needed for meaningful nav testing)
- **US3 (P2)**: Depends on Foundational (Phase 2) only — independent of US1/US2
- **US4 (P3)**: Depends on Foundational (Phase 2) only — independent of US1/US2/US3

### Within Phase 2 (Foundational)

- T002, T003, T004 are independent of each other — run in parallel
- T005 (header.tsx) depends on T002 (imports UserMenu)
- T006 (layout.tsx) depends on T003, T004, T005

### Parallel Opportunities

- T002, T003, T004 can be implemented simultaneously (different files, no cross-dependencies)
- T008, T009, T010 (placeholder pages) can be implemented simultaneously
- T014, T015 (polish) can be run simultaneously

---

## Parallel Example: Phase 2 Foundational

```bash
# These 3 tasks have no dependencies on each other — implement simultaneously:
Task T002: src/components/dashboard/user-menu.tsx
Task T003: src/components/dashboard/sidebar.tsx
Task T004: src/components/dashboard/bottom-nav.tsx

# Then sequentially:
Task T005: src/components/dashboard/header.tsx  (needs T002 done)
Task T006: src/app/(dashboard)/layout.tsx       (needs T003, T004, T005 done)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T006) — CRITICAL, blocks everything
3. Complete Phase 3: User Story 1 (T007–T010)
4. **STOP and VALIDATE**: Run quickstart.md Cenários 1, 3, 4 on desktop
5. Desktop dashboard shell is shippable at this point

### Incremental Delivery

1. Setup + Foundational → layout shell compiles
2. US1 (T007–T010) → desktop experience testable → **MVP demo point**
3. US2 (T011) → mobile experience testable
4. US3 (T012) → logout verified
5. US4 (T013) → loading states verified
6. Polish (T014–T015) → ship

---

## Notes

- **Mark each task `[x]` immediately upon completion** — before starting the next task (per constitution §Padrões Obrigatórios)
- `'use client'` only in: `sidebar.tsx`, `bottom-nav.tsx`, `user-menu.tsx` — all use `usePathname()` or `signOut()`
- `layout.tsx`, `header.tsx`, `dashboard/page.tsx`, and all placeholder pages are Server Components — no `'use client'`
- Prisma query in `layout.tsx`: `restaurante?.nome ?? 'Meu Restaurante'` fallback covers edge case where middleware redirect hasn't yet fired (defensive guard only)
- Active state detection: `pathname.startsWith(item.href)` — handles sub-routes like `/dashboard/cardapio/novo` keeping "Cardápio" active
- No new database migrations — this feature reads existing `Restaurante` table only
