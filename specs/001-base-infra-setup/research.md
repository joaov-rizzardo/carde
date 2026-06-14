# Research: Project Base Infrastructure

**Phase 0 output for**: [plan.md](./plan.md)

---

## 1. Next.js 14 App Router + `src-dir` project layout

**Decision**: Use `npx create-next-app@latest` with `--typescript --tailwind --app --src-dir` flags; install into the current directory (`.`) to avoid a nested subdirectory.

**Rationale**: The `--src-dir` flag places all application code under `src/`, keeping config files (tailwind.config, next.config, middleware.ts, prisma/) at the root — cleaner separation between config and source. Next.js 14 App Router is the current stable version with full RSC support.

**Alternatives considered**: Pages Router — rejected; no RSC, no route groups, contradicts Principle II.

---

## 2. Prisma + Supabase PostgreSQL (serverless connection)

**Decision**: Use `DATABASE_URL` with the Supabase **connection pooler** (port 6543) and append `?pgbouncer=true` for Prisma. Keep `DIRECT_URL` (port 5432) for `prisma migrate`.

**Rationale**: Supabase exposes two connection strings: a direct connection (port 5432) and a pooled connection via PgBouncer (port 6543). Serverless environments (Vercel) can exhaust database connections without a pooler. Prisma requires `pgbouncer=true` in the pooler URL to skip prepared statements. The Prisma `datasource` block uses `url = env("DATABASE_URL")` (pooler) and `directUrl = env("DIRECT_URL")` (direct, migrations-only).

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Alternatives considered**: `DATABASE_URL` direct-only — rejected; causes connection pool exhaustion under Vercel serverless cold starts.

---

## 3. Prisma client singleton (avoid hot-reload leak)

**Decision**: Export a single `PrismaClient` instance from `lib/prisma.ts`, stored on `globalThis` in development to survive Next.js hot module reloads.

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Rationale**: Without this pattern, each hot reload instantiates a new `PrismaClient`, eventually exhausting the connection pool in development.

**Alternatives considered**: New client per request — rejected; causes pool exhaustion in development within minutes.

---

## 4. shadcn/ui with App Router (`src` directory)

**Decision**: Run `npx shadcn@latest init` (note: package is now `shadcn`, not `shadcn-ui`) and choose `src/components/ui` as the component path. Use the `default` style with CSS variables.

**Rationale**: `shadcn-ui` is the deprecated package name; `shadcn` is the current one. The CLI generates components into the chosen directory. CSS variable mode is required for theming with Cardê's brand token system.

**Alternatives considered**: `shadcn-ui@latest` — rejected; deprecated, may install an outdated CLI version.

---

## 5. next/font — Inter + Playfair Display

**Decision**: Import both fonts from `next/font/google` in the root `layout.tsx`. Assign Playfair Display to a CSS variable `--font-display` and Inter to `--font-body`; reference these in `tailwind.config.ts`.

```ts
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})
```

**Rationale**: `next/font` self-hosts Google Fonts — no external font requests, no FOIT, no layout shift. `display: swap` satisfies the Principle I requirement for `font-display: swap` on the public menu page. CSS variables allow Tailwind utility classes (`font-display`, `font-body`) to reference the fonts.

**Alternatives considered**: Direct Google Fonts `<link>` — rejected; external request adds latency and fails privacy requirements; no preload guarantee.

---

## 6. Zod environment validation (`lib/env.ts`)

**Decision**: Validate all required env vars with Zod at module load time. Throw a descriptive error on first import if any variable is missing or invalid.

```ts
// lib/env.ts
import { z } from 'zod'

const schema = z.object({
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

export const env = schema.parse(process.env)
```

**Rationale**: Zod parse at import time means the error surfaces before any request is served (FR-001, FR-002, SC-002). The error message names the missing variable exactly. All other modules import from `lib/env.ts` — `process.env` is never accessed directly elsewhere.

**Alternatives considered**: Manual `if (!process.env.X) throw` — rejected; no type inference, no URL format validation, verbose.

---

## 7. Middleware route protection (`middleware.ts`)

**Decision**: Define the `matcher` in `middleware.ts` covering `/dashboard/:path*` and `/onboarding`. Auth check logic is a placeholder for this phase — the matcher wiring is what's required (FR-003, Assumption 4).

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth check implementation deferred to auth feature
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding'],
}
```

**Rationale**: Route protection must live exclusively in `middleware.ts` (Principle III). Configuring the matcher now means adding a new protected route later requires only a string change — not any page-level code (FR-003).

**Alternatives considered**: Per-page auth guards — prohibited by Constitution Principle III and FR-003.

---

## 8. Supabase clients (browser vs. server)

**Decision**: Create two separate Supabase client factories — `lib/supabase/client.ts` (uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`, safe to expose) and `lib/supabase/server.ts` (uses `SUPABASE_SERVICE_ROLE_KEY`, server-only).

**Rationale**: The service-role key bypasses Row Level Security — it must never reach the browser. Separate files make the boundary explicit and prevent accidental client-side import of the server client.

**Alternatives considered**: Single shared client — rejected; service-role key exposure in browser bundle is a critical security vulnerability.

---

## 9. Brand token system (Tailwind + CSS variables)

**Decision**: Define all brand colors as CSS custom properties in `globals.css` and extend `tailwind.config.ts` to reference them, enabling classes like `bg-brand-accent`, `text-brand-primary`.

**Rationale**: CSS variables allow runtime theming (future multi-tenant theme feature) while Tailwind utility classes keep the DX consistent. All tokens from the Constitution's color palette are included from day 0.

**Alternatives considered**: Hardcoded hex values in Tailwind config — rejected; blocks future per-restaurant theme customisation (in-scope for MVP admin panel).

---

## 10. `types/api.ts` — ApiResponse shape

**Decision**: Define `ApiResponse<T>` as a discriminated union and export `ok<T>()` and `erro()` helper functions in `types/api.ts`.

```ts
export type ApiResponse<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: string; codigo?: string }

export const ok = <T>(dados: T): ApiResponse<T> => ({ sucesso: true, dados })
export const erro = (erro: string, codigo?: string): ApiResponse<never> =>
  ({ sucesso: false, erro, codigo })
```

**Rationale**: Standardised response shape (Constitution "Respostas de API") enables consistent client-side error handling from the first API route. Discriminated union gives TypeScript exhaustive type narrowing without `any`.

**Alternatives considered**: Untyped `{ data, error }` — rejected; loses type safety and contradicts FR-008.
