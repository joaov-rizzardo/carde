# Data Model: Cardápio Público

**Feature**: Cardápio Público | **Date**: 2026-06-18

## Sem Novas Entidades

Esta etapa não adiciona tabelas, campos ou migrations. Consome `Restaurante`, `Categoria` e `Item`, já existentes no schema (`prisma/schema.prisma`), em modo somente leitura.

---

## Dados Consumidos

### Restaurante (leitura)

Buscado em `app/menu/[slug]/page.tsx` pelo `slug` da URL.

| Campo | Tipo | Uso |
|---|---|---|
| `id` | `string` | Chave de busca para a query de categorias/itens (já vem aninhada na mesma query) |
| `slug` | `string` | Chave de busca (`findUnique({ where: { slug } })`) |
| `nome` | `string` | Header, `<title>` |
| `descricao` | `string \| null` | `<meta name="description">` (omitida quando `null`, ver Edge Case) |
| `corPrimaria` | `string` | Aplicada via `style` inline no header e em elementos de destaque (ver `research.md` #4) |
| `logoUrl` | `string \| null` | Header — placeholder textual quando `null` (sem ícone de imagem quebrada, FR-006 do spec) |
| `ativo` | `boolean` | Se `false`, `notFound()` — nunca chega a ser usado para renderização |

### Categoria (leitura, filtrada)

Aninhada na mesma query do restaurante. Apenas categorias com ao menos um item disponível são retornadas (filtro relacional, ver `research.md` #2) — nenhuma categoria vazia chega ao componente.

| Campo | Tipo | Uso |
|---|---|---|
| `id` | `string` | `id` da âncora (`#categoria-{id}`) e `href` do link de navegação |
| `nome` | `string` | Título da seção e label do link de navegação |
| `ordem` | `number` | Ordenação (`orderBy: { ordem: 'asc' }`) |
| `itens` | `Item[]` | Sempre não-vazio nesta etapa (garantido pelo filtro relacional) |

### Item (leitura, filtrado)

Aninhado em cada categoria. Apenas itens com `disponivel: true` são retornados.

| Campo | Tipo | Uso |
|---|---|---|
| `id` | `string` | `key` de lista |
| `nome` | `string` | Nome no card |
| `preco` | `Decimal` (serializado como `string` no DTO) | Formatado como moeda BRL (`Intl.NumberFormat`) |
| `descricao` | `string \| null` | Exibida quando presente; omitida quando `null` |
| `fotoUrl` | `string \| null` | `next/image` quando presente; placeholder com ícone quando `null` |
| `ordem` | `number` | Ordenação (`orderBy: { ordem: 'asc' }`) |
| `disponivel` | — | Não exposta ao DTO público — todo item retornado já é, por definição da query, disponível |

---

## DTOs (novos, em `types/menu.ts`)

DTOs próprios da página pública — deliberadamente mais magros que `ItemDto`/`CategoriaComItensDto` (usados no admin), que expõem campos irrelevantes aqui (`disponivel`, `destaque`, `categoriaId`).

```ts
export interface MenuItemDto {
  id: string
  nome: string
  preco: string
  descricao: string | null
  fotoUrl: string | null
}

export interface MenuCategoriaDto {
  id: string
  nome: string
  itens: MenuItemDto[]
}

export interface MenuRestauranteDto {
  nome: string
  descricao: string | null
  corPrimaria: string
  logoUrl: string | null
  categorias: MenuCategoriaDto[]
}
```

**Nota**: `preco` é convertido de `Decimal` (Prisma) para `string` no Server Component antes de passar aos componentes filhos, mesmo padrão já usado em `CategoriaComItensDto`/`ItemDto`.

---

## Query Única (Server Component)

```ts
const restaurante = await prisma.restaurante.findUnique({
  where: { slug },
  select: {
    nome: true,
    descricao: true,
    corPrimaria: true,
    logoUrl: true,
    ativo: true,
    categorias: {
      where: { itens: { some: { disponivel: true } } },
      orderBy: { ordem: 'asc' },
      select: {
        id: true,
        nome: true,
        itens: {
          where: { disponivel: true },
          orderBy: { ordem: 'asc' },
          select: { id: true, nome: true, preco: true, descricao: true, fotoUrl: true },
        },
      },
    },
  },
})

if (!restaurante || !restaurante.ativo) notFound()
```

Sem `id` do restaurante no `select` — não é necessário fora da própria query (categorias já vêm aninhadas), evitando expor um campo sem uso no DTO público.
