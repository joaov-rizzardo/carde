# API Contracts: Restaurantes

**Feature**: 003-restaurant-onboarding | **Date**: 2026-06-15

---

## POST `/api/restaurantes`

Cria o restaurante do usuário autenticado. Falha se o usuário já possui restaurante.

### Request

**Headers**:
```
Content-Type: application/json
Cookie: next-auth.session-token=<jwt>   (obrigatório)
```

**Body**:
```json
{
  "nome": "Sabor da Terra",
  "corPrimaria": "#E85D04"
}
```

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `nome` | string | Sim | 2–100 caracteres |
| `corPrimaria` | string | Não | Hex `#rrggbb`; padrão `#E85D04` se ausente |

### Responses

**201 Created** — restaurante criado com sucesso:
```json
{
  "sucesso": true,
  "dados": {
    "id": "clxxx...",
    "slug": "sabor-da-terra",
    "nome": "Sabor da Terra",
    "corPrimaria": "#E85D04",
    "criadoEm": "2026-06-15T12:00:00.000Z"
  }
}
```

**400 Bad Request** — validação Zod falhou:
```json
{
  "sucesso": false,
  "erro": "Nome deve ter pelo menos 2 caracteres",
  "codigo": "VALIDACAO_INVALIDA"
}
```

**401 Unauthorized** — sem sessão válida:
```json
{
  "sucesso": false,
  "erro": "Não autorizado",
  "codigo": "NAO_AUTORIZADO"
}
```

**409 Conflict** — usuário já possui restaurante:
```json
{
  "sucesso": false,
  "erro": "Restaurante já existe para este usuário",
  "codigo": "RESTAURANTE_JA_EXISTE"
}
```

**500 Internal Server Error** — erro inesperado:
```json
{
  "sucesso": false,
  "erro": "Erro interno do servidor"
}
```

### Lógica

1. `verificarOwnership()` → obtém `userId` do JWT; lança 401 se sem sessão
2. Valida body com `criarRestauranteSchema` (Zod) → 400 se inválido
3. `gerarSlugUnico(nome, prisma)` → gera slug único
4. `prisma.restaurante.create({ data: { nome, slug, corPrimaria, donoId: userId } })`
5. Captura `P2002` (donoId único violado) → 409
6. Retorna 201 com dados do restaurante criado

---

## GET `/api/restaurantes/me`

Retorna o restaurante do usuário autenticado.

### Request

**Headers**:
```
Cookie: next-auth.session-token=<jwt>   (obrigatório)
```

Sem body.

### Responses

**200 OK** — restaurante encontrado:
```json
{
  "sucesso": true,
  "dados": {
    "id": "clxxx...",
    "slug": "sabor-da-terra",
    "nome": "Sabor da Terra",
    "corPrimaria": "#E85D04",
    "ativo": true,
    "criadoEm": "2026-06-15T12:00:00.000Z"
  }
}
```

**200 OK** — usuário sem restaurante:
```json
{
  "sucesso": true,
  "dados": null
}
```

**401 Unauthorized** — sem sessão válida:
```json
{
  "sucesso": false,
  "erro": "Não autorizado",
  "codigo": "NAO_AUTORIZADO"
}
```

### Lógica

1. `verificarOwnership()` → obtém `userId`; lança 401 se sem sessão
2. `prisma.restaurante.findUnique({ where: { donoId: userId }, select: { id, slug, nome, corPrimaria, ativo, criadoEm } })`
3. Retorna 200 com `dados: restaurante` (pode ser `null` se não existir)

---

## Tipos TypeScript

```ts
// Resposta de POST /api/restaurantes e GET /api/restaurantes/me
type RestauranteDto = {
  id: string
  slug: string
  nome: string
  corPrimaria: string
  ativo: boolean
  criadoEm: string   // ISO 8601
}
```

Ambas as routes usam `ApiResponse<RestauranteDto>` e `ApiResponse<RestauranteDto | null>` conforme definido em `types/api.ts`.
