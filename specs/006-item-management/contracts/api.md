# API Contracts: Gestão de Itens do Cardápio

Todas as respostas seguem `ApiResponse<T>` (`types/api.ts`): `{ sucesso: true, dados }` ou `{ sucesso: false, erro, codigo? }`. Todas as rotas exigem sessão autenticada via `obterRestauranteDaSessao()` — sem sessão válida, `401 NAO_AUTORIZADO`.

---

## `GET /api/itens`

Lista todas as categorias do restaurante autenticado com os itens aninhados, ordenados.

**Resposta `200`**: `ApiResponse<CategoriaComItensDto[]>`

```json
{
  "sucesso": true,
  "dados": [
    {
      "id": "cat_1",
      "nome": "Entradas",
      "ordem": 0,
      "itens": [
        { "id": "item_1", "nome": "Bruschetta", "preco": "18.50", "descricao": null, "fotoUrl": null, "disponivel": true, "destaque": false, "ordem": 0, "categoriaId": "cat_1" }
      ]
    }
  ]
}
```

**Erros**: `401 NAO_AUTORIZADO`, `500` (erro interno).

---

## `POST /api/itens`

Cria um item. `ordem` é sempre calculada pelo servidor (append ao final da categoria) — nunca aceita do cliente.

**Body**:

```json
{ "nome": "Bruschetta", "preco": 18.5, "descricao": "Pão italiano com tomate", "categoriaId": "cat_1", "destaque": false }
```

**Validação (Zod)**: `nome` 1–80 chars; `preco` número positivo; `descricao` opcional, máx. 500 chars; `categoriaId` obrigatório; `destaque` opcional (default `false`).

**Regras de negócio**:
1. `categoriaId` deve existir e pertencer ao `restauranteId` da sessão — senão `403 ACESSO_NEGADO` (ou `404 NAO_ENCONTRADO` se a categoria não existe).
2. `ordem = max(ordem dos itens da categoriaId) + 1` (ou `0` se a categoria não tem itens).
3. `disponivel` sempre `true` na criação.

**Resposta `201`**: `ApiResponse<ItemDto>`

**Erros**: `400 VALIDACAO_INVALIDA`, `401 NAO_AUTORIZADO`, `403 ACESSO_NEGADO`, `404 NAO_ENCONTRADO` (categoria inexistente), `500`.

---

## `PUT /api/itens/[id]`

Edita todos os campos editáveis de um item existente.

**Body**: mesmo formato do `POST` (`nome`, `preco`, `descricao?`, `categoriaId`, `destaque?`).

**Regras de negócio**:
1. Item deve existir e sua `categoria.restauranteId` deve ser igual ao `restauranteId` da sessão — senão `404`/`403`.
2. Nova `categoriaId` (se enviada) também deve pertencer ao restaurante autenticado.
3. Se `categoriaId` mudou em relação ao valor atual: recalcula `ordem = max(ordem na nova categoria) + 1` (FR-004a). Se não mudou, `ordem` permanece inalterada.

**Resposta `200`**: `ApiResponse<ItemDto>`

**Erros**: `400 VALIDACAO_INVALIDA`, `401 NAO_AUTORIZADO`, `403 ACESSO_NEGADO`, `404 NAO_ENCONTRADO`, `500`.

---

## `DELETE /api/itens/[id]`

Exclui um item permanentemente.

**Regras de negócio**: mesma verificação de ownership transitivo do `PUT`.

**Resposta `200`**: `ApiResponse<{ id: string }>`

**Erros**: `401 NAO_AUTORIZADO`, `403 ACESSO_NEGADO`, `404 NAO_ENCONTRADO`, `500`.

---

## `PATCH /api/itens/[id]/disponibilidade`

Alterna a disponibilidade de um item. Endpoint dedicado e minimalista para suportar a atualização otimista (FR-006) sem reenviar todos os campos do item.

**Body**:

```json
{ "disponivel": false }
```

**Validação (Zod)**: `disponivel` boolean obrigatório.

**Regras de negócio**: mesma verificação de ownership transitivo das demais rotas de `[id]`.

**Resposta `200`**: `ApiResponse<ItemDto>`

**Erros**: `400 VALIDACAO_INVALIDA`, `401 NAO_AUTORIZADO`, `403 ACESSO_NEGADO`, `404 NAO_ENCONTRADO`, `500`.
