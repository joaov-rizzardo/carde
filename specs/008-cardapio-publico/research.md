# Research: Cardápio Público

**Feature**: Cardápio Público | **Date**: 2026-06-18

## 1. Busca de dados: Server Component direto via Prisma vs. API route

**Decision**: `app/menu/[slug]/page.tsx` busca o restaurante e seus dados diretamente via Prisma (`prisma.restaurante.findUnique`), sem passar por nenhuma API route.

**Rationale**: Mesmo padrão já estabelecido em `dashboard/cardapio/page.tsx` e `(dashboard)/layout.tsx` (feature 004): "Busca de dados... fica sempre em Server Components" (Princípio II). Como a página é 100% SSR e não há nenhuma interação client-side que precise rebuscar os dados, criar uma API route só adicionaria uma camada de indireção sem necessidade — e violaria o antipadrão #1 (Client Component / fetch onde Server Component resolve).

**Alternatives considered**: `GET /api/menu/[slug]` consumido via `fetch()` no Server Component — rejeitado, é um round-trip HTTP interno desnecessário quando o Prisma já está disponível no mesmo processo; `GET /api/menu/[slug]` consumido por um Client Component — rejeitado, perderia SSR e violaria FR-002/FR-005 (conteúdo deve estar no HTML inicial).

---

## 2. Filtragem de categorias vazias e itens pausados sem N+1

**Decision**: Uma única query Prisma com filtro relacional aninhado:

```ts
prisma.restaurante.findUnique({
  where: { slug },
  select: {
    id: true, nome: true, descricao: true, corPrimaria: true, logoUrl: true, ativo: true,
    categorias: {
      where: { itens: { some: { disponivel: true } } },
      orderBy: { ordem: 'asc' },
      select: {
        id: true, nome: true, ordem: true,
        itens: {
          where: { disponivel: true },
          orderBy: { ordem: 'asc' },
          select: { id: true, nome: true, preco: true, descricao: true, fotoUrl: true, ordem: true },
        },
      },
    },
  },
})
```

**Rationale**: O filtro `categorias: { where: { itens: { some: { disponivel: true } } } }` exclui categorias sem nenhum item disponível diretamente no banco — a página nunca recebe uma categoria vazia para precisar filtrar em memória. Os itens já vêm filtrados por `disponivel: true` na mesma query. Uma única chamada ao Prisma, sem loop, sem query adicional por categoria — evita o antipadrão #8 (N+1).

**Alternatives considered**: Buscar todas as categorias e itens e filtrar em JavaScript depois — rejeitado, funciona mas faz o banco trafegar dados (itens pausados, categorias vazias) que nunca chegam a ser renderizados; o filtro relacional do Prisma resolve isso na fonte. Duas queries separadas (restaurante, depois categorias) — rejeitado, é exatamente o padrão N+1 que a constituição proíbe.

---

## 3. Tratamento de 404 (slug inexistente ou restaurante inativo)

**Decision**: `notFound()` de `next/navigation`, chamado quando `restaurante === null` ou `restaurante.ativo === false`. Sem `not-found.tsx` customizado — usa o 404 padrão do Next.js (App Router já gera uma página 404 genérica sem boundary customizado).

**Rationale**: O spec exige apenas "a página 404 do site", sem desenho específico (não há critério de aceite pedindo identidade visual no 404). Adicionar um `not-found.tsx` com a marca do Cardê seria complexidade não solicitada — YAGNI. Reutilizar exatamente o mesmo branch (`notFound()`) para slug inexistente e para restaurante inativo garante que os dois casos sejam indistinguíveis para o visitante (FR-003: "sem revelar que o restaurante existe, mas está inativo").

**Alternatives considered**: Página 404 customizada com a identidade visual do Cardê (`app/menu/[slug]/not-found.tsx`) — não rejeitada definitivamente, mas fora do escopo desta etapa por não haver critério de aceite que peça isso; pode ser uma melhoria futura. Redirecionar para uma rota de erro genérica — rejeitado, foge do padrão idiomático do App Router e da linguagem do spec ("retorna 404").

---

## 4. Cor de marca dinâmica (`corPrimaria`) em Server Components

**Decision**: `corPrimaria` é aplicada via `style` inline (ex: `style={{ backgroundColor: restaurante.corPrimaria }}`) nos elementos do header e nos destaques de navegação — não via classe Tailwind.

**Rationale**: Tokens Tailwind (`brand-accent`, etc.) são estáticos, definidos em `globals.css` para a UI do produto Cardê em si (dashboard, marketing). A cor de cada restaurante é um valor dinâmico, vindo do banco por requisição — Tailwind não pode gerar uma classe em tempo de build para um valor que só existe em runtime. `style` inline é o mecanismo correto aqui, e já há precedente no repo (`configuracoes/page.tsx` usa `style={{ background: '#F7F3EE' }}`).

**Alternatives considered**: CSS custom property setada via `style` no elemento raiz da página (`style={{ '--cor-restaurante': restaurante.corPrimaria }}`) e consumida por classes utilitárias filhas — válido e mais limpo se múltiplos elementos filhos precisarem da mesma cor; decisão final fica para a fase de design visual (`/frontend-design`), mas tecnicamente equivalente ao inline direto.

---

## 5. Navegação por âncoras sem JavaScript no cliente

**Decision**: Links `<a href="#categoria-{id}">` puros, com `scroll-smooth` (Tailwind, equivalente a `scroll-behavior: smooth` em CSS) na página — sem `'use client'`, sem listener de scroll, sem highlight de "seção ativa" via JS.

**Rationale**: FR-002 exige zero estado client-side no carregamento inicial. Âncoras HTML nativas resolvem 100% do requisito funcional (FR-008: "saltar diretamente para a seção correspondente") sem nenhum JavaScript. Scroll suave é puramente CSS. Não há critério de aceite pedindo highlight de categoria ativa durante o scroll (isso seria scroll-spy, que exigiria JS) — não implementar.

**Alternatives considered**: Scroll-spy com `IntersectionObserver` para destacar a categoria atual durante o scroll — rejeitado, não há critério de aceite que peça isso, e introduziria `'use client'` e estado onde nenhum é necessário (antipadrão #1).

---

## 6. Imagens otimizadas (logo e fotos dos itens)

**Decision**: `next/image` com `sizes` adequado ao card mobile (ex: `sizes="(min-width: 768px) 33vw, 50vw"` para fotos de item; `sizes="120px"` fixo para a logo) — mesmo padrão de `next/image` + `remotePatterns` já configurado em `next.config.js` para o bucket público do Supabase Storage.

**Rationale**: FR-012 exige otimização responsiva; a constituição (Princípio I) já mandata `next/image` com `sizes` adequado no cardápio público especificamente. `remotePatterns` para o hostname do Supabase já existe desde a feature 007 — nenhuma configuração adicional necessária.

**Alternatives considered**: `<img>` simples — rejeitado, perde otimização automática e violaria a constituição diretamente.

---

## 7. Placeholder de foto ausente

**Decision**: Mesmo padrão visual já usado em `item-row.tsx` (ícone `UtensilsCrossed` da `lucide-react` centralizado em um container com fundo `brand-warm`), adaptado ao tamanho do card público.

**Rationale**: Reaproveita um padrão visual já validado e existente no design system do produto — consistência entre o admin e o público sem inventar um novo conceito visual.

**Alternatives considered**: Imagem placeholder estática (arquivo `.svg`/`.png` genérico) — rejeitado, adiciona um asset a manter quando o ícone já resolve com menos complexidade.
