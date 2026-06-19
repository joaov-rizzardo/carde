# Implementation Plan: Cardápio Público

**Branch**: `008-cardapio-publico` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-cardapio-publico/spec.md`

## Summary

Implementar a página pública do cardápio em `/menu/[slug]`, acessível sem autenticação. `app/menu/[slug]/page.tsx` é um Server Component puro que busca o restaurante pelo `slug` direto via Prisma (mesma query já traz categorias e itens filtrados — apenas categorias com ao menos um item disponível, apenas itens com `disponivel: true`, ambos ordenados por `ordem`), chama `notFound()` quando o slug não existe ou o restaurante está inativo, e renderiza header (logo + nome + cor de marca), navegação por âncoras e as seções de categoria com cards de item — tudo sem nenhum `'use client'`, sem chamada de API e sem estado client-side no carregamento inicial. `generateMetadata()` define `<title>` e `<meta description>` a partir dos dados do restaurante.

## Technical Context

**Language/Version**: TypeScript 5, React 18, Next.js 16 (Turbopack, App Router)

**Primary Dependencies**: Prisma 5 (leitura direta, sem API route nova), `next/image` (otimização de logo e fotos de item), `lucide-react` (ícone de placeholder, mesmo padrão de `item-row.tsx`) — nenhuma dependência nova a instalar

**Storage**: Leitura somente — `prisma.restaurante.findUnique({ where: { slug }, select: { ..., categorias: { where: {...}, select: { ..., itens: { where: {...} } } } } })`, ver `data-model.md`. Nenhuma migration.

**Testing**: Validação manual via [`quickstart.md`](./quickstart.md) — mesmo padrão das features 004–007, sem suite automatizada no MVP

**Target Platform**: Web público — mobile-first, acessado via QR code/link direto, sem sessão, possivelmente em 4G instável

**Project Type**: Web application SaaS — reaproveita a mesma estrutura de projeto único já estabelecida; nova rota fora dos grupos `(dashboard)`/`(marketing)` (página pública não pertence a nenhum dos dois domínios)

**Performance Goals**: Conteúdo do cardápio presente no HTML inicial sem nenhuma execução de JS (SC-005); navegação por âncora chega à seção correspondente com um único toque, sem round-trip de rede (SC-004)

**Constraints**: 100% dos itens `disponivel: false` ausentes do HTML renderizado (SC-002, FR-006); 100% dos slugs inexistentes ou restaurantes inativos resultam em 404, nunca erro técnico ou página em branco (SC-003, FR-003); zero scroll horizontal em qualquer viewport, inclusive com muitas categorias (FR-009); zero estado client-side no carregamento inicial (FR-002) — página inteira é Server Components, navegação por âncora é HTML puro; uma única query Prisma (sem N+1, Antipadrão #8)

**Scale/Scope**: MVP — leitura pública de um restaurante por vez via slug; sem paginação (todas as categorias/itens disponíveis em uma única página); sem carrinho, pedido ou qualquer interação de compra (fora do escopo)

## Constitution Check

*Avaliado contra `constitution.md` v1.5.0 — todos os gates PASS*

| Princípio | Status | Evidência |
|---|---|---|
| I. Mobile First | ✅ PASS | Página inteira mobile-first; navegação por âncoras quebra em múltiplas linhas em vez de scroll horizontal (FR-009); `next/image` com `sizes` adequado ao viewport mobile e fontes já com `display: swap` (herdado do `layout.tsx` raiz); links de navegação com área de toque ≥44×44px; nenhum hover-only feedback (links de âncora funcionam por toque, sem depender de hover). |
| II. Server Components por Padrão | ✅ PASS | Página e todos os componentes filhos (`menu-header`, `menu-nav`, `menu-categoria-section`, `menu-item-card`, `menu-empty-state`) são Server Components — não há estado local, efeito, event handler ou API de browser nesta feature; busca de dados ocorre direto no Server Component da página, sem API route. |
| III. Segurança em Todas as Camadas | ✅ PASS | Página é pública por design (sem autenticação, conforme FR-001) — não há mutação, não há `verificarOwnership()` a chamar. Único cuidado de segurança é não revelar a existência de restaurantes inativos (FR-003), satisfeito ao tratar slug-inexistente e restaurante-inativo com o mesmo `notFound()`. |
| IV. Todos os Estados da UI São Tratados | ✅ PASS | Estado vazio tratado (FR-010, "estado vazio amigável" quando não há categoria com item disponível). Loading/erro client-side não se aplicam — não há fetch assíncrono no cliente; a página é renderizada inteira no servidor antes de chegar ao browser, e o caso de erro (slug inválido/restaurante inativo) é tratado como 404 do framework, não como estado de UI a renderizar. |
| V. Arquitetura Limpa por Domínio | ✅ PASS | `types/menu.ts` define os DTOs públicos (mais magros que os DTOs do admin); a query Prisma e a montagem do DTO ficam na própria `page.tsx` (sem lógica de negócio nova a extrair para `lib/` — é leitura e filtro declarativo via Prisma, não cálculo); componentes em `components/menu/` apenas renderizam, sem chamadas de API. Página pública vive fora dos grupos `(dashboard)`/`(marketing)` — não cruza domínio com nenhum dos dois. |

| Antipadrão | Status | Evidência |
|---|---|---|
| #1 Client Component onde Server resolve | ✅ PASS | Nenhum `'use client'` em toda a feature — navegação por âncora é HTML nativo (`<a href="#...">`), sem scroll-spy nem JS algum (ver `research.md` #5). |
| #2 Lógica de negócio em componentes | ✅ PASS | Filtragem de disponibilidade/categoria vazia ocorre na query Prisma (declarativa, não é "lógica" a testar isoladamente); formatação de preço usa `Intl.NumberFormat` inline no componente de card, mesmo padrão já estabelecido em `item-row.tsx` (precedente aceito no repo). |
| #3 Estados de loading/erro ignorados | ✅ PASS | N/A para fetch client-side (não existe); estado vazio (FR-010) tratado explicitamente. |
| #4 Ownership ad-hoc | ✅ PASS | N/A — página pública, sem mutação, sem sessão. |
| #5 Upload sem validação dupla | ✅ PASS | N/A — feature não envia nem recebe upload. |
| #6 Mutations sem feedback otimista | ✅ PASS | N/A — feature é somente leitura. |
| #7 `any` no TypeScript | ✅ PASS | DTOs explícitos em `types/menu.ts`; `select` do Prisma tipado por inferência, sem cast. |
| #8 Queries N+1 no Prisma | ✅ PASS | Uma única query (`findUnique` com `categorias`/`itens` aninhados e filtrados via `where` relacional) — ver `research.md` #2 e `data-model.md`. |
| #9 Layout sem `/frontend-design` | ⚠️ OBRIGATÓRIO | `/frontend-design` DEVE ser acionado antes de implementar `menu-header.tsx`, `menu-nav.tsx`, `menu-categoria-section.tsx`, `menu-item-card.tsx` e `menu-empty-state.tsx` — primeira página pública do produto, com identidade visual dinâmica por restaurante (`corPrimaria`), sem nenhum layout existente a reaproveitar. |

## Project Structure

### Documentation (this feature)

```text
specs/008-cardapio-publico/
├── plan.md              ✅ (este arquivo)
├── research.md          ✅ (Phase 0 — decisões técnicas)
├── data-model.md         ✅ (Phase 1 — DTOs e query consumidos)
├── quickstart.md        ✅ (Phase 1 — cenários de validação)
└── tasks.md             ⏳ (Phase 2 — /speckit-tasks)
```

Sem `contracts/` nesta etapa: não há API route nova (mesma decisão já tomada na feature 004-dashboard-shell, que também não criou `contracts/`) — a única "interface" exposta é a própria página HTML, cujo contrato comportamental já está integralmente descrito nos Acceptance Scenarios do `spec.md` e na query documentada em `data-model.md`.

### Source Code (repository root)

```text
src/
├── app/
│   └── menu/
│       └── [slug]/
│           └── page.tsx                   ← novo: Server Component, busca via Prisma, generateMetadata(), notFound() para slug/inativo
├── components/
│   └── menu/
│       ├── menu-header.tsx                ← novo: logo (ou só nome) + nome + corPrimaria via style inline (passa por /frontend-design)
│       ├── menu-nav.tsx                   ← novo: links de âncora para cada categoria visível, wrap em múltiplas linhas (passa por /frontend-design)
│       ├── menu-categoria-section.tsx     ← novo: título da categoria (com id de âncora) + grid de itens (passa por /frontend-design)
│       ├── menu-item-card.tsx             ← novo: foto/placeholder, nome, descrição, preço formatado (passa por /frontend-design)
│       └── menu-empty-state.tsx           ← novo: estado vazio quando não há categoria com item disponível (passa por /frontend-design)
└── types/
    └── menu.ts                            ← novo: MenuRestauranteDto, MenuCategoriaDto, MenuItemDto
```

**Structure Decision**: Mesma estrutura de projeto único usada nas features 004–007. Nenhuma alteração de schema Prisma. Nova rota `app/menu/[slug]` fica fora dos grupos de rota `(dashboard)` e `(marketing)`, pois não compartilha layout com nenhum dos dois (sem sidebar/bottom-nav do admin, sem o layout do site institucional) — usa apenas o `layout.tsx` raiz (fontes + `SessionProvider`, que aqui simplesmente não é exercitado por não haver sessão). Componentes visuais ficam isolados em `components/menu/`, paralelo a `components/itens/` e `components/categorias/`, preservando a separação por domínio do Princípio V.

## Implementation Sequence

### 1. Types (sem dependência de UI)
- `types/menu.ts`: `MenuItemDto`, `MenuCategoriaDto`, `MenuRestauranteDto` (ver `data-model.md`)

### 2. Frontend Design Gate
**⛔ STOP — acionar `/frontend-design` antes de escrever qualquer componente em `components/menu/`**
Prompt deve incluir: os 4 estados de US1 (header com/sem logo, item com/sem foto), o wireframe de navegação por âncoras com wrap mobile (US3), o estado vazio (Edge Case), e a aplicação dinâmica de `corPrimaria` por restaurante (US4) — deixar claro que é a primeira tela pública do produto, sem layout de admin a reaproveitar.

### 3. Componentes (Server Components, após o gate de design)
- `menu-empty-state.tsx`: texto explicativo, sem categorias para iterar
- `menu-item-card.tsx`: `next/image` com `fill`/`sizes` quando `fotoUrl`, senão placeholder (`UtensilsCrossed`, mesmo padrão de `item-row.tsx`); preço via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`; nome/descrição com `break-words` (Edge Case de texto longo)
- `menu-categoria-section.tsx`: `<section id={`categoria-${categoria.id}`}>`, título + grid de `menu-item-card`
- `menu-nav.tsx`: `<nav>` com um `<a href={`#categoria-${id}`}>` por categoria, `flex flex-wrap` (FR-009), cor ativa/destaque via `style` inline com `corPrimaria`
- `menu-header.tsx`: `next/image` para `logoUrl` (quando presente) + `nome`; container com `backgroundColor`/cor de texto vindos de `corPrimaria` via `style` inline

### 4. Página
- `app/menu/[slug]/page.tsx`:
  - `generateMetadata({ params })`: busca `nome`/`descricao` (query leve, só os campos de metadata) e retorna `{ title: `${nome} — Cardápio`, description: descricao ?? undefined }`
  - Componente da página: query completa (ver `data-model.md`), `if (!restaurante || !restaurante.ativo) notFound()`, monta `MenuRestauranteDto`, renderiza `menu-header` + `menu-nav` (só se `categorias.length > 0`) + lista de `menu-categoria-section` OU `menu-empty-state` (quando `categorias.length === 0`)
  - `<html>`/`<body>` com `scroll-smooth` (Tailwind) para a navegação por âncora rolar suavemente

### 5. Validação manual
- Executar todos os cenários de `quickstart.md`, incluindo o Cenário 9 (JavaScript desabilitado) — é o teste mais direto de FR-002/SC-005

## Complexity Tracking

Nenhuma violação de constitution a justificar.
