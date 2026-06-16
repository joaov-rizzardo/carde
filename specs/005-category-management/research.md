# Research: Gestão de Categorias do Cardápio

## Decision 1: Drag-and-Drop Library

**Decision**: Add `@dnd-kit/core` + `@dnd-kit/sortable` (not yet installed).

**Rationale**: The spec assumption explicitly names `@dnd-kit/core` as the preferred library. It is lightweight (~10 kB gzipped), accessible (ARIA-compliant), and has first-class support for sortable lists via `@dnd-kit/sortable`. It works well with React 18 and Next.js without SSR issues since DnD is client-only.

**Alternatives considered**: `react-beautiful-dnd` is unmaintained since 2023. Custom pointer-events solution adds complexity without benefit. ↑/↓ buttons (mentioned in spec as MVP alternative) are acceptable fallback if DnD adds disproportionate complexity, but `@dnd-kit` is simple enough to implement directly.

**Install**: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

---

## Decision 2: Modal Implementation

**Decision**: Add `@radix-ui/react-dialog` and create `src/components/ui/dialog.tsx` primitive following the existing pattern in `components/ui/`.

**Rationale**: The project already uses Radix UI packages (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-slot`). Adding `@radix-ui/react-dialog` is consistent with the established pattern. Creating a `dialog.tsx` UI primitive in `components/ui/` follows architecture principle V and keeps the modal reusable for future features (items, config).

**Alternatives considered**: Native `<dialog>` HTML element — lacks the overlay management and focus-trap needed for good UX. Custom Portal implementation — reinventing what Radix already provides with accessibility guarantees.

**Install**: `npm install @radix-ui/react-dialog`

---

## Decision 3: Ownership Verification Pattern for Categoria

**Decision**: Extend `lib/auth/ownership.ts` with `obterRestauranteDaSessao(): Promise<{ id: string }>` — a helper that returns the authenticated user's restaurant ID. All categoria routes use this helper, then verify `categoria.restauranteId === restaurante.id`.

**Rationale**: The current `verificarOwnership()` returns only `userId`. For categories, all routes need the `restauranteId`. Centralizing this in `ownership.ts` avoids ad-hoc DB queries per route (antipadrão #4) and keeps all auth logic in one place. Routes follow the pattern: (1) call `obterRestauranteDaSessao()` → get `restauranteId`, (2) fetch categoria and compare `restauranteId`.

**Alternatives considered**: Add `restauranteId` to session JWT — possible but requires session callback changes and session inflation. Per-route Prisma queries to get restaurant — duplicates logic across routes (antipadrão #4).

---

## Decision 4: Reorder Endpoint Strategy

**Decision**: Add a dedicated `PATCH /api/categorias/reorder` endpoint that accepts `[{ id, ordem }]` array and updates all items in a single Prisma transaction.

**Rationale**: Sending N individual PUT requests for each reorder operation is wasteful and creates a race condition window where partially-saved order can be observed. A single transactional batch update is atomic and makes the client code simpler (one fetch call after DnD drop).

**Alternatives considered**: N individual `PUT /api/categorias/[id]` requests — creates N round trips, partial updates visible between requests, harder to roll back on error.

---

## Decision 5: Item Model Stub

**Decision**: Add a minimal `Item` model stub to the Prisma schema to satisfy the `Categoria.itens Item[]` relation. The `Item` model includes only `id`, `categoriaId`, and `restauranteId` (for future isolation) — full item fields are out of scope.

**Rationale**: Prisma requires both sides of a relation to exist in the schema. Without `Item`, the migration fails. The stub is minimal and does not commit to an item implementation design that would be done in a later feature.

**Alternatives considered**: `@@ignore` directive on the relation — works but hides the schema intent and blocks future migration of the real Item model cleanly.

---

## Decision 6: Optimistic UI for Mutations

**Decision**: All mutations (create, rename, delete, reorder) use optimistic updates via local state in the `use-categorias.ts` hook — the UI updates immediately and reverts with an error toast on API failure.

**Rationale**: Constitution antipadrão #6 mandates optimistic updates for simple reversible mutations in mobile UX. Reordering especially must feel instant — waiting for a server round-trip on every drag operation would make the list feel laggy.

**Implementation**: `use-categorias.ts` hook manages `categorias` state locally. Mutations: (1) compute new state, (2) update local state, (3) call API, (4) on error revert state + show toast.
