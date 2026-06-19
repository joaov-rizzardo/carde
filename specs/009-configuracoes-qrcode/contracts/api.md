# API Contracts: Configurações e QR Code

Todas as respostas seguem o formato padronizado `ApiResponse<T>` (`types/api.ts`):
`{ sucesso: true, dados }` ou `{ sucesso: false, erro, codigo? }`.

Todas as rotas abaixo exigem sessão autenticada com restaurante associado
(`obterRestauranteDaSessao()`). Sem sessão/restaurante → `401 NAO_AUTORIZADO`.

---

## `GET /api/restaurantes/me` (estendido)

Já existe desde `005`; estende o `select`/DTO para incluir `descricao` e `logoUrl`.

**Resposta `200`**:

```json
{
  "sucesso": true,
  "dados": {
    "id": "clx...",
    "slug": "sabor-da-terra",
    "nome": "Sabor da Terra",
    "descricao": "Comida caseira desde 1998",
    "corPrimaria": "#E85D04",
    "logoUrl": "https://.../restaurante-logos/clx.../logo-1718000000000.webp",
    "ativo": true,
    "criadoEm": "2026-06-13T12:00:00.000Z"
  }
}
```

`dados: null` quando o usuário autenticado ainda não tem restaurante (mesmo comportamento já existente).

---

## `PUT /api/restaurantes/me` (novo)

Atualiza nome, descrição, cor e logo do restaurante do dono autenticado. **Nunca** aceita/altera `slug`.

**Body**:

```ts
{
  nome: string          // min 2, max 100 — obrigatório (FR-004)
  descricao?: string    // max 500, opcional
  corPrimaria: string   // regex /^#[0-9a-fA-F]{6}$/
  logoUrl?: string | null  // url válida, ou null para remover (FR-005)
}
```

**Validação** (Zod, mesma severidade de `criarRestauranteSchema`):

| Campo | Regra | Erro |
|---|---|---|
| `nome` | `min(2)`, `max(100)`, trim não vazio | `VALIDACAO_INVALIDA` |
| `descricao` | `max(500)` | `VALIDACAO_INVALIDA` |
| `corPrimaria` | hex de 6 dígitos | `VALIDACAO_INVALIDA` |
| `logoUrl` | `url()` quando string; `null` aceito; `undefined` mantém valor atual | `VALIDACAO_INVALIDA` |

**Comportamento**:
1. `obterRestauranteDaSessao()` → 401 se falhar.
2. Body inválido → `400 VALIDACAO_INVALIDA` (mensagem do primeiro erro Zod).
3. `prisma.restaurante.update({ where: { id: restauranteId }, data: { nome, descricao: descricao ?? null, corPrimaria, ...(logoUrl !== undefined ? { logoUrl } : {}) } })`.
4. Se `logoUrl` mudou (valor anterior existia e é diferente do novo, incluindo o caso de remoção para `null`), chama `removerArquivo(BUCKET_LOGOS_RESTAURANTE, logoAnterior)` fire-and-forget (log de erro, não bloqueia a resposta) — mesmo padrão de `PUT /api/itens/[id]`.
5. Retorna `200` com o `RestauranteDto` atualizado.

**Resposta `200`**: mesmo formato do `GET` acima, com os novos valores.

**Erros**:
- `401 NAO_AUTORIZADO` — sem sessão/restaurante.
- `400 VALIDACAO_INVALIDA` — corpo inválido ou nome vazio (SC-004).
- `500` — erro interno (mensagem genérica, sem detalhe de implementação).

---

## `POST /api/restaurantes/logo` (novo)

Upload da logo do restaurante autenticado. `multipart/form-data`, mesmo formato de `POST /api/upload` (`007`), sem o campo `itemId`.

**Form fields**:

| Campo | Tipo | Regra |
|---|---|---|
| `file` | `File` | obrigatório, MIME em `image/jpeg`, `image/png`, `image/webp`, ≤5MB |

**Comportamento**:
1. `obterRestauranteDaSessao()` → 401 se falhar.
2. Sem `file` ou tipo fora da whitelist → `400 TIPO_INVALIDO`.
3. `file.size > 5MB` → `413 ARQUIVO_GRANDE`.
4. `enviarArquivo(BUCKET_LOGOS_RESTAURANTE, buffer, `${restauranteId}/logo-${Date.now()}.webp`)`.
5. Retorna `200` com `{ url }` — a UI então inclui essa `url` como `logoUrl` no próximo `PUT /api/restaurantes/me` (mesmo fluxo de dois passos já usado para fotos de item: upload primeiro, associação ao registro depois).

**Resposta `200`**:

```json
{ "sucesso": true, "dados": { "url": "https://.../restaurante-logos/clx.../logo-1718000000000.webp" } }
```

**Erros**: `401 NAO_AUTORIZADO`, `400 TIPO_INVALIDO`, `413 ARQUIVO_GRANDE`, `500`.

**Nota sobre limpeza**: este endpoint *não* remove a logo anterior — a remoção do arquivo antigo é responsabilidade de `PUT /api/restaurantes/me` (passo 4 acima), no momento em que o novo `logoUrl` é efetivamente salvo. Isso espelha o mesmo design de `PUT /api/itens/[id]` em relação a `POST /api/upload`: o endpoint de upload é uma operação de infraestrutura "burra"; a regra de domínio (substituir = apagar a antiga) vive na rota que persiste a associação.
