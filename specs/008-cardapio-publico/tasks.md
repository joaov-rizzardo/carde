---

description: "Task list for Cardápio Público (008-cardapio-publico)"
---

# Tasks: Cardápio Público

**Input**: Design documents from `/specs/008-cardapio-publico/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (no `contracts/` — não há API route nova, ver plan.md)

**Tests**: Não solicitados nesta etapa — validação é manual via `quickstart.md` (mesmo padrão das features 004–007, ver plan.md "Testing").

**Organization**: Tasks agrupadas por user story (spec.md) para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência entre si)
- **[Story]**: US1, US2, US3, US4 — mapeiam para as user stories do spec.md
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único (Next.js App Router) — código em `src/`, conforme `plan.md` § Project Structure.

---

## Phase 1: Setup

**Purpose**: Contratos de dados compartilhados por toda a feature, sem dependência de UI.

- [X] T001 Criar `src/types/menu.ts` com `MenuItemDto`, `MenuCategoriaDto`, `MenuRestauranteDto` (campos e tipos exatos conforme `data-model.md` § DTOs) — sem dependências, base para a query (T003) e para todos os componentes.

**Checkpoint**: Tipos disponíveis para importação em qualquer task seguinte.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Gate de design obrigatório antes de qualquer componente visual (Constitution Antipadrão #9).

**⚠️ CRITICAL**: Nenhuma task de componente (T004, T006, T007, T010) pode começar antes de T002 concluída.

- [X] T002 Acionar `/frontend-design` para todos os componentes de `src/components/menu/` (menu-header, menu-nav, menu-categoria-section, menu-item-card, menu-empty-state) em uma única sessão de design. O prompt DEVE cobrir: header com/sem logo (US1), card de item com/sem foto e com texto longo (US1), navegação por âncoras com wrap em mobile sem scroll horizontal (US3), estado vazio amigável (Edge Case/FR-010), e aplicação dinâmica de `corPrimaria` no header e em elementos de destaque (US4) — deixar explícito que é a primeira página pública do produto, sem layout de admin a reaproveitar (ver `plan.md` § Implementation Sequence #2).

**Checkpoint**: Direção visual definida para todos os 5 componentes — implementação de UI liberada.

---

## Phase 3: User Story 1 - Visualizar o cardápio escaneando o QR code (Priority: P1) 🎯 MVP

**Goal**: Visitante sem login acessa `/menu/[slug]` e vê o cardápio completo (header, categorias, itens) renderizado no servidor.

**Independent Test**: Com um restaurante ativo com categorias e itens disponíveis cadastrados, acessar `/menu/[slug]` em um navegador sem sessão autenticada e confirmar que o cardápio completo é exibido (quickstart Cenários 1, 2, 3, 8, 9).

### Implementation for User Story 1

- [X] T003 [US1] Implementar a busca de dados em `src/app/menu/[slug]/page.tsx`: `prisma.restaurante.findUnique({ where: { slug } })` com `categorias`/`itens` aninhados, filtrados (`itens: { some: { disponivel: true } }` nas categorias; `disponivel: true` nos itens) e ordenados por `ordem`, exatamente conforme a query documentada em `data-model.md` § Query Única. Apenas a busca — sem guarda de 404 ainda (T009) e sem renderização (T008). (depende de T001)
- [X] T004 [P] [US1] Criar `src/components/menu/menu-item-card.tsx`: `next/image` com `fill`/`sizes` quando `fotoUrl` presente, placeholder com ícone `UtensilsCrossed` (mesmo padrão de `src/components/itens/item-row.tsx`) quando ausente; nome e descrição com `break-words` (Edge Case de texto longo); preço formatado via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. (depende de T002)
- [X] T005 [US1] Criar `src/components/menu/menu-categoria-section.tsx`: `<section id={`categoria-${categoria.id}`}>` com título da categoria e grid renderizando um `MenuItemCard` por item. (depende de T002, T004)
- [X] T006 [P] [US1] Criar `src/components/menu/menu-header.tsx`: `next/image` para `logoUrl` quando presente (sem ícone de imagem quebrada quando ausente — apenas o nome), nome do restaurante, container estilizado com `backgroundColor`/cor de texto vindos de `corPrimaria` via `style` inline (FR-004). (depende de T002)
- [X] T007 [P] [US1] Criar `src/components/menu/menu-empty-state.tsx`: texto explicativo amigável para quando o restaurante não tem nenhuma categoria com item disponível (FR-010). (depende de T002)
- [X] T008 [US1] Em `src/app/menu/[slug]/page.tsx`: mapear o resultado da query (T003) para `MenuRestauranteDto`/`MenuCategoriaDto`/`MenuItemDto` (incluindo conversão de `preco` de `Decimal` para `string`), e renderizar `MenuHeader` seguido pela lista de `MenuCategoriaSection` quando `categorias.length > 0`, ou `MenuEmptyState` quando vazio. (depende de T003, T005, T006, T007)

**Checkpoint**: US1 completa e testável de forma independente (com restaurante ativo) — cobre quickstart Cenários 1 (cardápio completo), 2 (itens pausados ausentes — já garantido pelo filtro da query em T003), 3 (categoria vazia oculta — idem), 8 (estado vazio) e 9 (SSR sem JS).

---

## Phase 4: User Story 2 - Acessar link inválido ou restaurante inativo (Priority: P1)

**Goal**: Slug inexistente ou restaurante inativo resultam na página 404 padrão do site, sem revelar que o restaurante existe mas está inativo.

**Independent Test**: Acessar `/menu/slug-que-nao-existe` e `/menu/[slug-de-restaurante-inativo]` e confirmar que ambos retornam a página 404 do site (quickstart Cenários 4 e 5).

### Implementation for User Story 2

- [X] T009 [US2] Em `src/app/menu/[slug]/page.tsx`: adicionar a guarda `if (!restaurante || !restaurante.ativo) notFound()` (de `next/navigation`), posicionada imediatamente após a busca (T003) e antes do mapeamento/renderização (T008) — mesmo branch para slug inexistente e restaurante inativo, garantindo que ambos os casos sejam indistinguíveis para o visitante (FR-003). (depende de T008)

**Checkpoint**: US1 + US2 completas — cobre quickstart Cenários 4 (slug inexistente) e 5 (restaurante inativo).

---

## Phase 5: User Story 3 - Navegar entre categorias pelo menu de âncoras (Priority: P2)

**Goal**: Menu de navegação lista um link de âncora por categoria visível, permitindo saltar direto para a seção, sem scroll horizontal em mobile.

**Independent Test**: Com um restaurante com três ou mais categorias visíveis, acessar `/menu/[slug]`, tocar em um item do menu de navegação e confirmar que a página rola até a seção correspondente (quickstart Cenário 6).

### Implementation for User Story 3

- [X] T010 [US3] Criar `src/components/menu/menu-nav.tsx`: `<nav>` com um `<a href={`#categoria-${id}`}>` por categoria visível, na mesma ordem do conteúdo, usando `flex flex-wrap` para quebrar em múltiplas linhas em telas estreitas sem scroll horizontal (FR-009); cor de destaque dos links via `style` inline com `corPrimaria`. (depende de T002)
- [X] T011 [US3] Em `src/app/menu/[slug]/page.tsx` (ou no `layout.tsx` raiz, conforme `plan.md` § Implementation Sequence #4): adicionar a classe Tailwind `scroll-smooth` para rolagem suave por âncora, e renderizar `MenuNav` entre `MenuHeader` e a lista de seções quando `categorias.length > 0`. (depende de T008, T009, T010)

**Checkpoint**: US1 + US2 + US3 completas — cobre quickstart Cenário 6 (navegação por âncoras no mobile, sem scroll horizontal).

---

## Phase 6: User Story 4 - Reconhecer a identidade visual do restaurante (Priority: P3)

**Goal**: A `corPrimaria` cadastrada pelo restaurante aparece visivelmente no header e em elementos de destaque, sem tratamento especial para a cor padrão.

**Independent Test**: Cadastrar uma `corPrimaria` customizada em um restaurante, acessar `/menu/[slug]` e confirmar visualmente que a cor aparece no header e em elementos de destaque (quickstart Cenário 7).

### Implementation for User Story 4

- [X] T012 [US4] Validar visualmente em `menu-header.tsx` (T006) e `menu-nav.tsx` (T010) que o mesmo caminho de código aplica tanto a `corPrimaria` customizada quanto a cor padrão do restaurante (`#E85D04`) sem branching condicional adicional — confirmar com dois restaurantes (um com cor customizada, um sem) conforme quickstart Cenário 7. Caso a cor não esteja sendo aplicada em algum elemento de destaque esperado pelo Acceptance Scenario 1 (ex: borda dos links de navegação), ajustar o `style` inline correspondente em `menu-header.tsx`/`menu-nav.tsx`. (depende de T006, T010)

**Checkpoint**: Todas as user stories completas e independentemente testáveis.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: SEO e validação manual completa da feature.

- [X] T013 Implementar `generateMetadata({ params })` em `src/app/menu/[slug]/page.tsx`: query leve (apenas `nome`/`descricao`) retornando `{ title: \`${nome} — Cardápio\`, description: descricao ?? undefined }` — sem meta descrição quando `descricao` for `null` (FR-011, Edge Case). (depende de T001)
- [X] T014 Executar todos os 10 cenários de `quickstart.md` (incluindo Cenário 9 — JavaScript desabilitado — e Cenário 10 — SEO) como validação manual final da feature. (depende de todas as tasks anteriores)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente.
- **Foundational (Phase 2)**: Sem dependência de dados (independe de T001), mas BLOQUEIA toda implementação de componentes visuais (T004, T006, T007, T010).
- **User Story 1 (Phase 3)**: Depende de T001 (tipos) e T002 (design gate).
- **User Story 2 (Phase 4)**: Depende de US1 completa (T008) — adiciona a guarda de 404 ao mesmo arquivo.
- **User Story 3 (Phase 5)**: Depende de T002 (design gate) para T010; depende de US1+US2 completas (T008, T009) para a integração em T011.
- **User Story 4 (Phase 6)**: Depende de T006 (US1) e T010 (US3) já existirem — é validação/ajuste fino, não introduz componentes novos.
- **Polish (Phase 7)**: Depende de todas as user stories completas.

### Within Each User Story

- US1: tipos → query → componentes (paralelos) → composição/render
- US2: guarda de 404 inserida após US1 estar renderizando
- US3: componente de nav (paralelo a outras tasks) → integração na página após US1+US2
- US4: sem implementação nova — validação sobre o que já foi construído em US1/US3

### Parallel Opportunities

- T004, T006, T007 podem rodar em paralelo entre si (arquivos diferentes, todos dependem apenas de T002).
- T010 (US3) pode rodar em paralelo com T004/T006/T007 (US1) — ambos dependem apenas de T002, sem dependência cruzada entre si.

---

## Parallel Example: User Story 1

```bash
# Após T002 (design gate) concluída, lançar em paralelo:
Task: "Criar src/components/menu/menu-item-card.tsx"
Task: "Criar src/components/menu/menu-header.tsx"
Task: "Criar src/components/menu/menu-empty-state.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Phase 1: Setup (T001)
2. Completar Phase 2: Foundational — `/frontend-design` (T002, CRÍTICO, bloqueia tudo abaixo)
3. Completar Phase 3: User Story 1 (T003–T008)
4. Completar Phase 4: User Story 2 (T009) — em produto público, 404 correto não é opcional
5. **PARAR e VALIDAR**: testar US1+US2 com quickstart Cenários 1–5, 8, 9
6. Deploy/demo se pronto — já entrega o produto completo de leitura do cardápio com tratamento de erro

### Incremental Delivery

1. Setup + Foundational → fundação pronta
2. US1 + US2 → MVP funcional e seguro (cardápio público + 404 correto) → Deploy/Demo
3. US3 → navegação por âncoras → Deploy/Demo
4. US4 → validação de identidade visual (sem código novo) → Deploy/Demo
5. Polish → SEO + validação manual completa

---

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si
- [Story] label mapeia a task para a user story correspondente, para rastreabilidade
- **Marcar task como `[x]` neste arquivo imediatamente após concluí-la — antes de iniciar a próxima**
- Fazer commit após cada task ou grupo lógico
- Parar em cada checkpoint para validar a story de forma independente
- Sem tasks de teste automatizado nesta etapa — validação manual via `quickstart.md` (T014)
