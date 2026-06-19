# API Contracts: Upload de Imagens dos Itens

Todas as respostas seguem `ApiResponse<T>` (`types/api.ts`): `{ sucesso: true, dados }` ou `{ sucesso: false, erro, codigo? }`. Todas as rotas exigem sessão autenticada via `obterRestauranteDaSessao()` — sem sessão válida, `401 NAO_AUTORIZADO`.

---

## `POST /api/upload`

Recebe um arquivo de imagem já comprimido pelo client, sobe para o Supabase Storage (bucket `item-fotos`) e retorna a URL pública. Não associa a foto a nenhum item no banco — quem faz essa associação é `POST`/`PUT /api/itens` (ver abaixo).

**Body**: `multipart/form-data`
- `file`: arquivo de imagem (`image/jpeg`, `image/png` ou `image/webp`)
- `itemId`: string — id real do item (edição) ou id gerado no client via `crypto.randomUUID()` (criação)

**Validação (Zod + checagem de buffer)**:
1. `itemId` obrigatório, string não vazia.
2. `file` obrigatório.
3. MIME type deve ser um de `image/jpeg`, `image/png`, `image/webp` — senão `400 TIPO_INVALIDO`.
4. Tamanho do arquivo ≤ 5MB — senão `413 ARQUIVO_GRANDE`.

**Regras de negócio**:
1. `restauranteId` vem exclusivamente da sessão (`obterRestauranteDaSessao()`) — nunca do cliente.
2. Path final: `{restauranteId}/{itemId}-{Date.now()}.webp`.
3. Não há verificação de que `itemId` corresponde a um item existente no banco — o isolamento entre restaurantes é garantido pelo prefixo `restauranteId` do path, não por essa checagem (ver `research.md` §3).

**Resposta `200`**: `ApiResponse<{ url: string }>`

```json
{ "sucesso": true, "dados": { "url": "https://<projeto>.supabase.co/storage/v1/object/public/item-fotos/rest_1/item_1-1750000000000.webp" } }
```

**Erros**: `400 TIPO_INVALIDO` (tipo não aceito ou campos ausentes), `401 NAO_AUTORIZADO`, `413 ARQUIVO_GRANDE`, `500` (falha ao subir para o storage).

---

## `POST /api/itens` (estendido)

Mesmo contrato da feature 006, com dois campos novos opcionais para suportar o fluxo "criar item já com foto" (US1):

**Body**:

```json
{ "id": "a1b2c3d4-...", "nome": "Bruschetta", "preco": 18.5, "descricao": "Pão italiano com tomate", "categoriaId": "cat_1", "destaque": false, "fotoUrl": "https://.../item-fotos/rest_1/a1b2c3d4-....webp" }
```

**Validação (Zod) — campos novos**:
- `id`: string não vazia, opcional. Se ausente, Prisma gera via `@default(cuid())` (comportamento da feature 006, preservado).
- `fotoUrl`: URL válida ou `null`, opcional.

**Regras de negócio (sem alteração das já existentes)**: `id`, quando fornecido, é usado diretamente em `prisma.item.create({ data: { id, ... } })` — deve ser o mesmo valor já usado como `itemId` no upload prévio, para o path do storage coincidir com o item real.

**Erros**: mesmos da feature 006. Colisão de `id` (extremamente improvável com UUID) cai no `500` genérico já existente.

---

## `PUT /api/itens/[id]` (estendido)

Mesmo contrato da feature 006, com `fotoUrl` aceito no body para suportar substituição (US2) e remoção (US3) de foto.

**Body**:

```json
{ "nome": "Bruschetta", "preco": 18.5, "descricao": "Pão italiano com tomate", "categoriaId": "cat_1", "destaque": false, "fotoUrl": "https://.../novo.webp" }
```

Para remover a foto sem substituir, enviar `"fotoUrl": null`.

**Validação (Zod) — campo novo**: `fotoUrl`: URL válida ou `null`, opcional. Quando ausente do body, o `fotoUrl` atual do item é preservado (não é apagado por omissão).

**Regras de negócio — limpeza do arquivo anterior (FR-009, FR-011)**:
1. Antes do `update`, ler o `fotoUrl` atual do item no banco.
2. Executar `prisma.item.update(...)`.
3. Se o `update` teve sucesso **e** o `fotoUrl` anterior não era nulo **e** o novo valor é diferente do anterior (substituição ou remoção): chamar `removerFoto(fotoAnterior)` (`lib/supabase/storage.ts`). Falha nessa remoção é logada, mas não falha a resposta da requisição (o item já foi atualizado corretamente; o arquivo órfão pode ser tratado depois sem afetar a UX do dono).

**Erros**: mesmos da feature 006.

---

## `DELETE /api/itens/[id]` (estendido)

Mesmo contrato da feature 006. Regra de negócio nova:

1. Antes de excluir, ler `item.fotoUrl`.
2. Excluir o item (`prisma.item.delete`).
3. Se `fotoUrl` não era nulo, chamar `removerFoto(fotoUrl)` após a exclusão confirmada (FR-012). Falha na remoção do storage é logada, sem afetar a resposta — o item já foi excluído do banco corretamente.

**Erros**: mesmos da feature 006.
