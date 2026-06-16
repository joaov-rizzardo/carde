# API Contracts: Categorias

Base path: `/api/categorias`

All responses follow `ApiResponse<T>` from `types/api.ts`:
- Success: `{ sucesso: true, dados: T }`
- Error: `{ sucesso: false, erro: string, codigo?: string }`

All endpoints require an authenticated session (next-auth). The session's user must have an associated `Restaurante`. All data is scoped to that `Restaurante` — no cross-restaurant access is possible.

---

## GET /api/categorias

Lists all categories for the authenticated restaurant, ordered by `ordem` ascending.

**Auth**: Session required (401 if missing)

**Response 200**:
```json
{
  "sucesso": true,
  "dados": [
    { "id": "clxxx1", "nome": "Entradas", "ordem": 0 },
    { "id": "clxxx2", "nome": "Pratos Principais", "ordem": 1 },
    { "id": "clxxx3", "nome": "Bebidas", "ordem": 2 }
  ]
}
```

**Response 401** (no session):
```json
{ "sucesso": false, "erro": "Não autorizado", "codigo": "NAO_AUTORIZADO" }
```

**Response 500** (DB error):
```json
{ "sucesso": false, "erro": "Erro interno do servidor" }
```

---

## POST /api/categorias

Creates a new category. `ordem` is auto-assigned as `max(ordem) + 1` for the restaurant.

**Auth**: Session required

**Request body**:
```json
{ "nome": "Sobremesas" }
```

**Validation (Zod)**:
- `nome`: `string`, min 1 char, max 80 chars

**Response 201**:
```json
{
  "sucesso": true,
  "dados": { "id": "clxxx4", "nome": "Sobremesas", "ordem": 3 }
}
```

**Response 400** (validation fail):
```json
{ "sucesso": false, "erro": "Nome deve ter no máximo 80 caracteres", "codigo": "VALIDACAO_INVALIDA" }
```

**Response 401**: same as GET

---

## PUT /api/categorias/[id]

Updates a category's `nome`. Used for rename operations.

**Auth**: Session required. Ownership verified: category must belong to session's restaurant.

**Request body**:
```json
{ "nome": "Novo Nome" }
```

**Validation (Zod)**:
- `nome`: `string`, min 1 char, max 80 chars

**Response 200**:
```json
{
  "sucesso": true,
  "dados": { "id": "clxxx1", "nome": "Novo Nome", "ordem": 0 }
}
```

**Response 400**: validation error (same shape as POST)

**Response 401**: not authenticated

**Response 403** (category belongs to another restaurant):
```json
{ "sucesso": false, "erro": "Acesso negado", "codigo": "ACESSO_NEGADO" }
```

**Response 404** (category not found):
```json
{ "sucesso": false, "erro": "Categoria não encontrada", "codigo": "NAO_ENCONTRADO" }
```

---

## DELETE /api/categorias/[id]

Deletes a category. Fails with 409 if the category has any linked items.

**Auth**: Session required. Ownership verified.

**Response 200**:
```json
{
  "sucesso": true,
  "dados": { "id": "clxxx1" }
}
```

**Response 403**: same as PUT

**Response 404**: same as PUT

**Response 409** (category has items):
```json
{ "sucesso": false, "erro": "Esta categoria possui itens e não pode ser excluída", "codigo": "CATEGORIA_COM_ITENS" }
```

---

## PATCH /api/categorias/reorder

Bulk-updates the `ordem` field for multiple categories in a single transaction. Called after the user completes a drag-and-drop reorder.

**Auth**: Session required. Every category ID in the payload must belong to the session's restaurant — any mismatch returns 403 for the entire request.

**Request body**:
```json
[
  { "id": "clxxx2", "ordem": 0 },
  { "id": "clxxx1", "ordem": 1 },
  { "id": "clxxx3", "ordem": 2 }
]
```

**Validation (Zod)**:
- Array of `{ id: string, ordem: number (int, min 0) }`
- Array must not be empty

**Response 200**:
```json
{
  "sucesso": true,
  "dados": [
    { "id": "clxxx2", "nome": "Pratos Principais", "ordem": 0 },
    { "id": "clxxx1", "nome": "Entradas", "ordem": 1 },
    { "id": "clxxx3", "nome": "Bebidas", "ordem": 2 }
  ]
}
```

**Response 400**: invalid payload shape

**Response 403**: any category not owned by session's restaurant

---

## Error Codes Reference

| Codigo | HTTP | Meaning |
|---|---|---|
| `NAO_AUTORIZADO` | 401 | No valid session |
| `ACESSO_NEGADO` | 403 | Category belongs to another restaurant |
| `NAO_ENCONTRADO` | 404 | Category ID not found |
| `CATEGORIA_COM_ITENS` | 409 | Delete blocked by linked items |
| `VALIDACAO_INVALIDA` | 400 | Zod schema failure |
