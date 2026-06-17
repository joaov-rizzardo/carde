# Phase 0 Research: Gestão de Itens do Cardápio

## 1. Armazenamento e serialização de preço

**Decision**: `preco` como `Decimal @db.Decimal(10,2)` no Prisma. Na API, o valor é serializado para JSON via `toJSON()` do `Decimal` (decimal.js), que retorna string (ex: `"12.5"`). O `ItemDto` expõe `preco: string`. No formulário, o input usa `type="number" step="0.01" min="0.01"`; antes de salvar, o servidor arredonda para 2 casas (`Math.round(preco * 100) / 100`) e o Zod valida apenas positividade (`z.coerce.number().positive()`), evitando falsos negativos de `multipleOf` por imprecisão de float.

**Rationale**: Mesma abordagem de qualquer SaaS de cardápio — precisão de banco garantida pelo tipo `Decimal`, sem expor complexidade de ponto flutuante ao formulário. Arredondamento explícito no servidor cobre FR-011 (2 casas decimais sem erro de arredondamento perceptível) sem adicionar uma lib de dinheiro (ex: dinero.js) que seria over-engineering para o escopo do MVP.

**Alternatives considered**: Armazenar centavos como `Int` (ex: `1250` = R$ 12,50) — mais preciso, mas exige conversão em toda leitura/escrita e quebra o padrão simples já usado no schema atual (`Categoria.ordem` é `Int` puro, sem essa indireção). Rejeitado por complexidade desnecessária no MVP.

## 2. Verificação de ownership transitivo (Item → Categoria → Restaurante)

**Decision**: Seguir o padrão já estabelecido em `005-category-management`: cada rota busca a entidade com a FK necessária (`prisma.item.findUnique({ where: { id }, select: { categoria: { select: { restauranteId: true } } } })`) e compara com `obterRestauranteDaSessao().id` inline, retornando 403 em caso de mismatch e 404 se não encontrado.

**Rationale**: `lib/auth/ownership.ts` hoje contém apenas verificações de sessão (`verificarOwnership`, `obterRestauranteDaSessao`), não uma função genérica de "ownership de entidade arbitrária". As rotas de categoria já implementam o padrão ad-hoc-mas-consistente (mesma sequência de checks em toda rota), e é esse padrão real do código — não uma função `verificarOwnership()` estendida — que será replicado para manter consistência com o que já existe, em vez de introduzir uma abstração nova para um único domínio adicional.

**Alternatives considered**: Criar `verificarOwnershipItem()` centralizado em `ownership.ts` — descartado nesta etapa porque generalizar a partir de um único caso de uso adicional (apenas Item) seria abstração prematura; se um terceiro domínio com ownership transitivo aparecer, a extração faz sentido.

## 3. Listagem agrupada por categoria sem N+1

**Decision**: Uma única query Prisma com `include` na direção Categoria → Item: `prisma.categoria.findMany({ where: { restauranteId }, orderBy: { ordem: 'asc' }, include: { itens: { orderBy: { ordem: 'asc' } } } })`. Tanto a página (Server Component) quanto `GET /api/itens` (usado no retry de erro do client) retornam essa mesma forma (`CategoriaComItensDto[]`).

**Rationale**: Prisma resolve `include` em uma ou duas queries otimizadas internamente, independente do número de categorias — não é um loop de queries por categoria, então não viola o Antipadrão #8. Retornar a forma já agrupada evita lógica de agrupamento duplicada entre Server Component e cliente.

**Alternatives considered**: Buscar `categorias` e `itens` em duas queries top-level separadas e agrupar em JS no client. Funcionalmente equivalente (também O(1) queries), mas exige reimplementar a lógica de agrupamento em mais de um lugar. Rejeitado em favor de manter o agrupamento já feito pelo Prisma.

## 4. Cálculo de `ordem` (append ao final)

**Decision**: Reaproveitar o mesmo padrão de `POST /api/categorias`: `prisma.item.aggregate({ where: { categoriaId }, _max: { ordem: true } })`, e `proximaOrdem = (max._max.ordem ?? -1) + 1`. Aplicado tanto na criação quanto na edição quando `categoriaId` muda (FR-004a).

**Rationale**: Já validado em produção pela feature 005; nenhuma necessidade de nova abordagem.

**Alternatives considered**: Nenhuma — reuso direto do padrão existente.

## 5. Novos primitivos de UI necessários

**Decision**: Adicionar `@radix-ui/react-select` (combobox de categoria, obrigatório no formulário) e `@radix-ui/react-switch` (toggle de disponibilidade na listagem e toggle de destaque no formulário). Criar `components/ui/select.tsx`, `components/ui/switch.tsx` e `components/ui/textarea.tsx` (nativo, sem dependência Radix — mesmo padrão visual de `input.tsx`).

**Rationale**: Nenhum desses primitivos existe ainda no projeto (`components/ui/` só tem `button`, `card`, `dialog`, `dropdown-menu`, `input`). `@radix-ui/react-label` já está instalado mas sem wrapper — não é necessário criar um, já que `categoria-modal.tsx` usa `<label>` nativo diretamente; o mesmo padrão é reaproveitado aqui.

**Alternatives considered**: `<select>` nativo em vez de Radix Select — rejeitado porque a constitution não exige Radix, mas o dropdown de categoria precisa ficar visualmente consistente com o resto do dashboard (mesmo padrão de design system já adotado via Radix Dialog/Dropdown-menu); usar Radix mantém consistência de comportamento de foco/teclado/acessibilidade com os demais componentes interativos do projeto.

## 6. Bloqueio de criação sem categoria (FR-003)

**Decision**: A página `/dashboard/cardapio` recebe a contagem de categorias do restaurante (já disponível na mesma query de `categorias`). Se `categorias.length === 0`, `itens-empty-state.tsx` renderiza uma orientação ("Crie uma categoria primeiro") com link para `/dashboard/categorias`, em vez do CTA "Adicionar item". O botão "Adicionar item" no cabeçalho da listagem (quando há itens em algumas categorias mas o dono tenta criar mais) também fica desabilitado/oculto nesse cenário — mas esse caso é inatingível na prática, pois sem categoria não há onde agrupar itens.

**Rationale**: Atende FR-003 e Acceptance Scenario 6 da US1 sem nova chamada de API — a informação já está disponível na busca inicial da página.

**Alternatives considered**: Validação apenas no servidor (retornar erro ao tentar POST sem categoria) — insuficiente isoladamente porque o requisito pede orientação proativa na UI antes da tentativa; mantido como guarda adicional no servidor (FR-002 exige `categoriaId` obrigatório e válido), mas a UX primária é a empty state condicional.
