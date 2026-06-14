---

description: "Task list for Project Base Infrastructure"
---

# Tasks: Project Base Infrastructure

**Input**: Design documents from `/specs/001-base-infra-setup/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: No test suite in this phase — acceptance validated by running the application against quickstart.md scenarios (per plan.md).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every description

## Path Conventions

Single Next.js project — all application code under `src/`, config files at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the Next.js 14 App Router project and initialize the design system CLI.

- [ ] T001 Bootstrap Next.js 14 project by running `npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-git` in the repository root (creates `src/`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, and `package.json`)
- [ ] T002 Initialize shadcn/ui by running `npx shadcn@latest init` — select `default` style, CSS variables mode, and `src/components/ui` as the component output path (creates `components.json` and `src/lib/utils.ts`)
- [ ] T003 [P] Create `.env.example` at repository root listing all 7 required variable names with placeholder comments: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented — env validation module, database schema, Prisma singleton, and Supabase clients.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Create `src/lib/env.ts` — Zod schema parsing `process.env` for all 7 required variables (strings with `min(1)`, URL fields with `.url()`); `export const env = schema.parse(process.env)` so import-time failure names the missing variable (satisfies env-contract.md)
- [ ] T005 Write `prisma/schema.prisma` with `generator client { provider = "prisma-client-js" }` and `datasource db { provider = "postgresql"; url = env("DATABASE_URL"); directUrl = env("DIRECT_URL") }` — no models (empty schema by design, data-model.md)
- [ ] T006 [P] Create `src/lib/prisma.ts` — export singleton `PrismaClient` stored on `globalThis` to survive Next.js hot-module reloads in development (research.md §3 pattern)
- [ ] T007 [P] Create `src/lib/supabase/client.ts` — browser-safe `createBrowserClient` factory using `env.NEXT_PUBLIC_SUPABASE_URL` and `env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (research.md §8)
- [ ] T008 [P] Create `src/lib/supabase/server.ts` — server-only `createServerClient` factory using `env.SUPABASE_SERVICE_ROLE_KEY`; file must never be imported from client components (research.md §8)
- [ ] T009 Run `npx prisma migrate dev --name init` using `DIRECT_URL` (port 5432) to create the empty baseline migration under `prisma/migrations/`; commit the generated migration file

**Checkpoint**: Foundation ready — env validation, DB schema, Prisma client, and Supabase clients all in place.

---

## Phase 3: User Story 1 — Developer Starts the Project Locally (Priority: P1) 🎯 MVP

**Goal**: A developer clones the repository, provides the env vars, and runs `npm run dev` — the app starts, env validation fires on missing variables, default pages render with correct brand typography, and the route matcher is wired.

**Independent Test**: Follow quickstart.md scenarios 1–4 — app starts without errors, missing env variable produces named ZodError, browser shows Playfair Display headings and Inter body text, `middleware.ts` matcher covers `/dashboard` and `/onboarding`.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Define brand color CSS custom properties and Tailwind directives in `src/app/globals.css` — add all 9 brand tokens from Constitution (`--brand-primary: #1A1A2E`, `--brand-accent: #E85D04`, `--brand-warm: #F7F3EE`, `--brand-surface: #FFFFFF`, `--brand-muted: #6B7280`, `--brand-border: #E5E7EB`, `--status-success: #16A34A`, `--status-warning: #D97706`, `--status-danger: #DC2626`)
- [ ] T011 [P] [US1] Extend `tailwind.config.ts` — add `colors` extension mapping brand token names to CSS variable references (`brand-primary: 'var(--brand-primary)'`, etc.) and `fontFamily` extension mapping `display: ['var(--font-display)', 'serif']` and `body: ['var(--font-body)', 'sans-serif']` (research.md §9)
- [ ] T012 [US1] Import `Inter` and `Playfair_Display` from `next/font/google` with `variable: '--font-body'` / `variable: '--font-display'` and `display: 'swap'` in `src/app/layout.tsx`; apply both `className` values to the `<html>` element (research.md §5)
- [ ] T013 [P] [US1] Create `src/app/(marketing)/page.tsx` — RSC placeholder with an `<h1>` using `className="font-display"` and a `<p>` using `className="font-body"` to demonstrate brand typography on the public route
- [ ] T014 [P] [US1] Create `src/app/(dashboard)/dashboard/page.tsx` — RSC placeholder page confirming the protected route resolves (no business logic; just a heading and `"use server"` is NOT needed — this is a Server Component by default)
- [ ] T015 [US1] Create `middleware.ts` at repository root with `export function middleware(request: NextRequest) { return NextResponse.next() }` and `export const config = { matcher: ['/dashboard/:path*', '/onboarding'] }` (research.md §7, FR-003)

**Checkpoint**: `npm run dev` starts cleanly; `http://localhost:3000` renders with brand fonts; `/dashboard` is accessible; removing any env var produces a named ZodError before "Ready".

---

## Phase 4: User Story 2 — Developer Deploys the Project to a Live URL (Priority: P2)

**Goal**: Pushing to `main` triggers an automatic Vercel build and deployment to a public URL, with all external service connections working identically to local dev.

**Independent Test**: Push a trivial change to `main` — Vercel dashboard shows build success within 5 minutes, deployment URL loads the app, DB query `SELECT 1+1` returns without connection errors (quickstart.md scenario 7, SC-003, SC-006).

### Implementation for User Story 2

- [ ] T016 [US2] Create and link the Vercel project to the GitHub repository — run `npx vercel link` or connect via Vercel dashboard; set framework preset to Next.js and root directory to `.` (repository root)
- [ ] T017 [US2] Add all 7 required environment variables to Vercel project settings (Settings → Environment Variables) using the values from `.env.local`; set `DATABASE_URL` to the Supabase **pooler** URL (port 6543 with `?pgbouncer=true`) and `DIRECT_URL` to the direct URL (port 5432)
- [ ] T018 [US2] Push current branch to `main` and confirm in the Vercel dashboard that the build completes without errors; open the deployment URL and verify the page loads and the DB connection is healthy (`SELECT 1+1` returns from quickstart.md scenario 5)

**Checkpoint**: Public URL is live, deployment automated on push, DB round-trip verified.

---

## Phase 5: User Story 3 — Developer Builds a New Feature with All Tooling Ready (Priority: P3)

**Goal**: Prove the full toolchain is in place — shadcn/ui components importable with brand styles, type-safe DB access catches schema mismatches at compile time, route protection works without page-level code, and TypeScript strict build passes with zero errors.

**Independent Test**: Run `npx tsc --noEmit` — zero errors; import a shadcn `Button` into a page — renders with brand accent; reference a non-existent Prisma field — compile error caught before build (quickstart.md scenario 6, SC-005).

### Implementation for User Story 3

- [ ] T019 [P] [US3] Add core shadcn/ui components by running `npx shadcn@latest add button card input` — generates `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/input.tsx` with brand CSS variable theming
- [ ] T020 [P] [US3] Create `src/types/api.ts` — export `ApiResponse<T>` discriminated union (`{ sucesso: true; dados: T } | { sucesso: false; erro: string; codigo?: string }`) and factory helpers `ok<T>()` / `erro()` per api-response.md contract
- [ ] T021 [P] [US3] Create `src/lib/auth/ownership.ts` — export stub `verificarOwnership` function (throws `new Error('Not implemented')`) as placeholder for the auth feature; establishes the import path required by Constitution Principle III
- [ ] T022 [US3] Run `npx tsc --noEmit` and confirm zero TypeScript errors across all files in `src/` — no `any`, no `as unknown`, all Zod-inferred types propagate correctly (FR-008, SC-005)

**Checkpoint**: Design system components importable, `ApiResponse<T>` standardised, ownership stub in place, TypeScript strict build green.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation of all acceptance scenarios and mobile-first compliance.

- [ ] T023 Run all 7 acceptance scenarios from `specs/001-base-infra-setup/quickstart.md` in sequence and confirm each passes — startup with valid env, named ZodError on missing var, brand typography, route protection, DB connection, TypeScript build, Vercel deployment
- [ ] T024 [P] Verify all placeholder pages (`/` and `/dashboard`) produce no horizontal scroll at 320px viewport using Chrome DevTools mobile emulation (Constitution Principle I, SC-004)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3, P1)**: Depends on Phase 2 completion — MVP deliverable
- **US2 (Phase 4, P2)**: Depends on Phase 3 completion — deployment requires working local build
- **US3 (Phase 5, P3)**: Depends on Phase 2 completion — can start in parallel with US2 if staffed
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — no dependency on other stories
- **US2 (P2)**: Depends on US1 (requires a working local build to push and deploy)
- **US3 (P3)**: Can start after Foundational (Phase 2) — independent of US1/US2 except via Foundational

### Within Each Phase

- T001 → T002 (shadcn init requires project to exist)
- T003 can run parallel with T002
- T004 → T006, T007, T008 (Supabase clients import from `lib/env.ts`)
- T005 → T009 (migration requires schema.prisma)
- T010 and T011 can run in parallel
- T012 depends on T011 (needs font CSS variable names defined in tailwind.config.ts)
- T015 (middleware.ts) is independent of T010–T014
- T019, T020, T021 can all run in parallel
- T022 depends on T019, T020, T021

### Parallel Opportunities

```bash
# Phase 1 — after T001:
T002  # shadcn init
T003  # .env.example

# Phase 2 — after T004 and T005:
T006  T007  T008  # Supabase clients (parallel)
T009          # migration (after T005 only)

# Phase 3 — after Phase 2:
T010  T011  # globals.css + tailwind.config.ts (parallel)
T013  T014  T015  # pages + middleware (parallel, after T012)

# Phase 5 — after Phase 2:
T019  T020  T021  # shadcn components + api.ts + ownership stub (parallel)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T009) — **CRITICAL, blocks everything**
3. Complete Phase 3: US1 (T010–T015)
4. **STOP and VALIDATE**: Run quickstart.md scenarios 1–4 to confirm US1 independently
5. Local dev environment ready — hand off to US2 or US3

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → Working local dev → test independently
3. Phase 4 (US2) → Live deployment → test independently (SC-003, SC-006)
4. Phase 5 (US3) → Full toolchain proven → test independently (SC-005)
5. Phase 6 → All quickstart scenarios green → feature complete

### Parallel Team Strategy

With two developers:
- Developer A: Phase 1 + Phase 2 (sequential setup)
- After Phase 2 complete:
  - Developer A: Phase 3 (US1) + Phase 4 (US2)
  - Developer B: Phase 5 (US3)

---

## Notes

- `[P]` tasks operate on different files with no incomplete dependencies — safe to parallelise
- `[Story]` label maps each task to its user story for independent delivery traceability
- No test tasks generated — plan.md explicitly defers testing to manual quickstart.md validation
- `DATABASE_URL` must use Supabase pooler port 6543 with `?pgbouncer=true`; `DIRECT_URL` uses port 5432 (research.md §2)
- `npx shadcn@latest` (not `shadcn-ui@latest`) — the old package name is deprecated (research.md §4)
- `src/lib/supabase/server.ts` must never be imported from client components — service-role key bypasses RLS
- Commit after each phase checkpoint to preserve a recoverable state
