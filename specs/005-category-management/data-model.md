# Data Model: Gestão de Categorias do Cardápio

## Entities

### Categoria

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK, cuid | Auto-generated |
| `nome` | `String` | Required, max 80 chars | Validated by Zod in API |
| `ordem` | `Int` | Default 0 | Auto-set to `max(ordem) + 1` on create |
| `restauranteId` | `String` | FK → Restaurante.id, indexed | Ownership anchor |
| `restaurante` | `Restaurante` | Relation | Cascade delete from Restaurante |
| `itens` | `Item[]` | Relation | Presence blocks Categoria deletion |

**Prisma model**:
```prisma
model Categoria {
  id            String      @id @default(cuid())
  nome          String
  ordem         Int         @default(0)
  restauranteId String
  restaurante   Restaurante @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  itens         Item[]

  @@index([restauranteId])
}
```

**Validation rules**:
- `nome`: non-empty string, maximum 80 characters (Zod: `z.string().min(1).max(80)`)
- `ordem`: non-negative integer, assigned server-side (never accepted from client on create)
- `restauranteId`: always taken from session, never from client body

**State transitions**:
- Created → exists in list → can be renamed or reordered at any time
- Deletion blocked if `_count.itens > 0` (API returns 409)
- Deletion succeeds if `_count.itens === 0`

---

### Item (stub — full implementation in later feature)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK, cuid | Auto-generated |
| `categoriaId` | `String` | FK → Categoria.id | Satisfies Categoria.itens relation |
| `categoria` | `Categoria` | Relation | — |

**Prisma model**:
```prisma
model Item {
  id          String    @id @default(cuid())
  categoriaId String
  categoria   Categoria @relation(fields: [categoriaId], references: [id], onDelete: Restrict)

  @@index([categoriaId])
}
```

> `onDelete: Restrict` intentionally blocks Categoria deletion when items exist at the DB level — a second line of defense behind the API's 409 check.

---

## Restaurante Relation Update

Add `categorias Categoria[]` to the existing `Restaurante` model:

```prisma
model Restaurante {
  // ... existing fields ...
  categorias   Categoria[]  // add this
}
```

---

## DTO Shape (TypeScript)

```typescript
// src/types/categoria.ts
export interface CategoriaDto {
  id: string
  nome: string
  ordem: number
}
```

No `restauranteId` in DTO — ownership is implicit (all responses are scoped to session restaurante).

---

## Migration Notes

- New migration: `prisma migrate dev --name add-categoria-item`
- Adds `Categoria` table with index on `restauranteId`
- Adds `Item` stub table with index on `categoriaId`
- No data migration needed (no existing rows to backfill)
- `ordem` defaults to `0` — fresh installations start with empty tables
