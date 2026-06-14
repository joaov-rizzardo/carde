# Data Model: Project Base Infrastructure

**Phase 1 output for**: [plan.md](./plan.md)

---

## Schema Philosophy

The database schema starts **empty by design** for this infrastructure phase (Assumption from spec). The initial Prisma schema establishes only the datasource and generator blocks — no tables, no seed data. All entity definitions are deferred to their respective feature specs and added as versioned migrations.

---

## Initial `prisma/schema.prisma`

```prisma
// This file is the authoritative schema definition for the Cardê database.
// Run `npx prisma migrate dev` to create or apply migrations.
// Run `npx prisma generate` to regenerate the Prisma Client.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Notes**:
- `DATABASE_URL` = Supabase connection pooler (port 6543) with `?pgbouncer=true`
- `DIRECT_URL` = Supabase direct connection (port 5432) — used by `prisma migrate` only
- No models defined yet; the first migration (`0001_init`) creates an empty schema baseline

---

## Environment Configuration Entity

The environment configuration is not a database entity — it is a runtime configuration record validated once at startup. Its shape is defined and enforced by `lib/env.ts`.

| Variable | Type | Validation | Used By |
|----------|------|------------|---------|
| `NEXTAUTH_SECRET` | `string` | `min(1)` | NextAuth (future auth feature) |
| `NEXTAUTH_URL` | `string` | `url()` | NextAuth (future auth feature) |
| `DATABASE_URL` | `string` | `url()` | Prisma (connection pooler) |
| `DIRECT_URL` | `string` | `url()` | Prisma (migrations only) |
| `NEXT_PUBLIC_SUPABASE_URL` | `string` | `url()` | Supabase browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `string` | `min(1)` | Supabase browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | `min(1)` | Supabase server client |

---

## Protected Route Matcher

The protected route set is maintained in `middleware.ts` as a `config.matcher` array. It is not stored in the database. Current protected patterns:

| Pattern | Reason |
|---------|--------|
| `/dashboard/:path*` | All admin dashboard routes require authentication |
| `/onboarding` | Onboarding flow requires authenticated user context |

**State transition**: unauthenticated request → middleware intercepts → redirect (destination TBD by auth feature).

---

## Future Entities (out of scope this phase)

The following entities are expected in subsequent feature specs. They are listed here for schema planning only — **no migrations created in this phase**.

| Entity | Feature | Key Fields (anticipated) |
|--------|---------|--------------------------|
| `Restaurante` | Restaurant onboarding | `id`, `slug`, `nome`, `plano`, `tema` |
| `Categoria` | Menu management | `id`, `restauranteId`, `nome`, `ordem` |
| `Item` | Menu management | `id`, `categoriaId`, `nome`, `preco`, `fotoUrl`, `disponivel` |
| `Mesa` | QR code generation | `id`, `restauranteId`, `numero`, `qrCodeUrl` |
| `User` | Auth | `id`, `email`, `restauranteId` |
