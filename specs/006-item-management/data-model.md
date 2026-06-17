# Data Model: Gestão de Itens do Cardápio

## Item (extensão do model existente)

Já existe no schema como stub (`id`, `categoriaId`). Esta feature adiciona os campos abaixo.

| Campo | Tipo Prisma | Obrigatório | Default | Validação |
|---|---|---|---|---|
| `id` | `String @id @default(cuid())` | sim | gerado | — |
| `nome` | `String` | sim | — | 1–80 caracteres (Zod: `.min(1).max(80)`) |
| `preco` | `Decimal @db.Decimal(10,2)` | sim | — | positivo (`> 0`), arredondado para 2 casas no servidor |
| `descricao` | `String?` | não | `null` | máx. 500 caracteres quando presente |
| `fotoUrl` | `String?` | não | `null` | sem validação de formato nesta etapa (sem mecanismo de upload) |
| `disponivel` | `Boolean` | sim | `true` | — |
| `destaque` | `Boolean` | sim | `false` | — |
| `ordem` | `Int` | sim | `0` | calculada automaticamente (max da categoria de destino + 1) — nunca enviada pelo cliente |
| `categoriaId` | `String` (FK) | sim | — | deve pertencer ao restaurante autenticado (verificado via `Categoria.restauranteId`) |

**Relacionamentos**: `Item.categoria → Categoria` (`onDelete` não definido explicitamente no stub atual — mantém o comportamento já existente; a exclusão de `Categoria` com itens já é bloqueada pela API de categorias, então o `onDelete` de FK nunca é exercitado em uso normal).

**Índice existente**: `@@index([categoriaId])` — mantido, suficiente para os filtros usados (`findMany` por `categoriaId` ou via `categoria.restauranteId`).

### Schema Prisma resultante

```prisma
model Item {
  id          String    @id @default(cuid())
  nome        String
  preco       Decimal   @db.Decimal(10, 2)
  descricao   String?
  fotoUrl     String?
  disponivel  Boolean   @default(true)
  destaque    Boolean   @default(false)
  ordem       Int       @default(0)
  categoriaId String
  categoria   Categoria @relation(fields: [categoriaId], references: [id])

  @@index([categoriaId])
}
```

## Categoria (sem alteração de schema)

Já modelada em `005-category-management`. Usada aqui apenas como contêiner de agrupamento e fonte da lista de opções no formulário de item (`id`, `nome`, `ordem`).

## Restaurante (sem alteração de schema)

Dono indireto dos itens, via `Categoria.restauranteId`. Identificado pela sessão autenticada através de `obterRestauranteDaSessao()`.

## DTOs (TypeScript)

```typescript
// src/types/item.ts
export interface ItemDto {
  id: string
  nome: string
  preco: string          // serializado como string pelo Decimal.toJSON()
  descricao: string | null
  fotoUrl: string | null
  disponivel: boolean
  destaque: boolean
  ordem: number
  categoriaId: string
}

export interface CategoriaComItensDto {
  id: string
  nome: string
  ordem: number
  itens: ItemDto[]
}
```

## Transições de estado

- **Criação**: `disponivel = true`, `destaque = false` (a menos que marcado no formulário), `ordem = max(ordem na categoriaId) + 1`.
- **Mudança de categoria** (edição com `categoriaId` diferente do atual): `ordem` recalculada como `max(ordem na nova categoriaId) + 1`. A posição na categoria antiga não é reajustada (gaps em `ordem` são aceitáveis — mesma premissa adotada em `005` para `Categoria.ordem`).
- **Toggle de disponibilidade**: `disponivel` alterna entre `true`/`false`; nenhum outro campo é afetado; não recalcula `ordem`.
- **Exclusão**: remoção definitiva da linha; nenhuma soft-delete (a feature já oferece pausar via `disponivel` como alternativa não destrutiva).

## Regras de validação (Zod, espelhando FR-002, FR-009)

```typescript
const itemSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(80, 'Nome deve ter no máximo 80 caracteres'),
  preco: z.coerce.number().positive('Preço deve ser maior que zero'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
  destaque: z.boolean().optional(),
})

const disponibilidadeSchema = z.object({
  disponivel: z.boolean(),
})
```
