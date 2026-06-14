# Contract: Environment Configuration Module

**File**: `src/lib/env.ts`

---

## Purpose

Single source of truth for all environment variables. Every module that needs a config value imports from this module — `process.env` is never accessed directly anywhere else in the codebase (FR-002, Constitution Principle III).

---

## Interface

```ts
import { env } from '@/lib/env'

// env is a fully-typed, validated object:
env.NEXTAUTH_SECRET       // string
env.NEXTAUTH_URL          // string (validated URL)
env.DATABASE_URL          // string (validated URL)
env.DIRECT_URL            // string (validated URL)
env.NEXT_PUBLIC_SUPABASE_URL    // string (validated URL)
env.NEXT_PUBLIC_SUPABASE_ANON_KEY // string
env.SUPABASE_SERVICE_ROLE_KEY    // string
```

---

## Validation Behaviour

| Scenario | Outcome |
|----------|---------|
| All variables present and valid | `env` object exported normally; application starts |
| Any variable missing | `ZodError` thrown at import time — application crashes before serving any request |
| Variable present but invalid format (e.g. malformed URL) | `ZodError` thrown with field name and reason — e.g. `"NEXTAUTH_URL: Invalid url"` |

---

## Error Format (example)

```
ZodError: [
  {
    "code": "invalid_string",
    "validation": "url",
    "message": "Invalid url",
    "path": ["NEXTAUTH_URL"]
  }
]
```

The path field names the exact variable — satisfying SC-002.

---

## Constraints

- This module is **server-only**. Variables without `NEXT_PUBLIC_` prefix must never be bundled into client JS.
- `NEXT_PUBLIC_*` variables are the only ones safe to access on the client side (via the Supabase browser client factory).
- The `DIRECT_URL` variable is consumed only by Prisma CLI (`prisma migrate`) — never by application code at runtime.
