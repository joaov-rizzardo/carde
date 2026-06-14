# Contract: API Response Shape

**File**: `src/types/api.ts`

---

## Purpose

Standardised response envelope for all Next.js API Routes (Route Handlers). Every endpoint returns `ApiResponse<T>` — no ad-hoc response shapes (Constitution "Respostas de API").

---

## Type Definition

```ts
export type ApiResponse<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: string; codigo?: string }
```

---

## Helper Functions

```ts
// Success response
export const ok = <T>(dados: T): ApiResponse<T> =>
  ({ sucesso: true, dados })

// Error response
export const erro = (erro: string, codigo?: string): ApiResponse<never> =>
  ({ sucesso: false, erro, codigo })
```

---

## Usage in Route Handlers

```ts
// app/api/example/route.ts
import { NextResponse } from 'next/server'
import { ok, erro } from '@/types/api'
import type { ApiResponse } from '@/types/api'

export async function GET(): Promise<NextResponse<ApiResponse<{ ping: string }>>> {
  try {
    return NextResponse.json(ok({ ping: 'pong' }))
  } catch (e) {
    return NextResponse.json(erro('Internal error', 'INTERNAL'), { status: 500 })
  }
}
```

---

## Client-Side Narrowing

```ts
const res: ApiResponse<Item[]> = await fetch('/api/items').then(r => r.json())

if (res.sucesso) {
  // TypeScript knows: res.dados is Item[]
} else {
  // TypeScript knows: res.erro is string, res.codigo is string | undefined
}
```

---

## Error Code Conventions (reference — defined as needed per feature)

| `codigo` | Meaning |
|----------|---------|
| `NOT_FOUND` | Resource does not exist |
| `UNAUTHORIZED` | Unauthenticated request to protected endpoint |
| `FORBIDDEN` | Authenticated but no ownership of resource |
| `VALIDATION` | Zod validation failed on request body |
| `INTERNAL` | Unexpected server error |
