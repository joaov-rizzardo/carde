# Tasks: Gestão de Itens do Cardápio

**Input**: Design documents from `/specs/006-item-management/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: Sem test suite automatizada no MVP — validação manual via `quickstart.md` (8 cenários), mesmo padrão da feature 005.

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: User story correspondente (US1, US2, US3, US4, US5)
- Toda task inclui o caminho exato do arquivo

---

## Phase 1: Setup (Dependências)

**Purpose**: Instalar pacotes de terceiros necessários antes de qualquer código.

- [X] T001 Instalar dependências npm: `npm install @radix-ui/react-select @radix-ui/react-switch`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Infraestrutura base que DEVE estar completa antes de qualquer user story.

**⚠️ CRÍTICO**: Nenhuma story pode começar até esta fase estar concluída.

- [X] T002 Estender o model `Item` em `prisma/schema.prisma` com `nome` (`String`), `preco` (`Decimal @db.Decimal(10,2)`), `descricao` (`String?`), `fotoUrl` (`String?`), `disponivel` (`Boolean @default(true)`), `destaque` (`Boolean @default(false)`), `ordem` (`Int @default(0)`), mantendo `categoriaId` e `@@index([categoriaId])` existentes
- [X] T003 Executar `npx prisma migrate dev --name extend-item-fields` e regenerar o Prisma client
- [X] T004 [P] Criar `src/types/item.ts` com `ItemDto` (`id`, `nome`, `preco: string`, `descricao`, `fotoUrl`, `disponivel`, `destaque`, `ordem`, `categoriaId`) e `CategoriaComItensDto` (`id`, `nome`, `ordem`, `itens: ItemDto[]`)
- [X] T005 [P] Implementar `GET /api/itens` (lista `categorias` do restaurante com `include: { itens: { orderBy: { ordem: 'asc' } } }`, `orderBy: { ordem: 'asc' }`) e `POST /api/itens` (cria item: valida `categoriaId` pertence ao restaurante — `403`/`404` caso contrário —, calcula `ordem = max(ordem da categoriaId) + 1` via `prisma.item.aggregate`, força `disponivel = true`) em `src/app/api/itens/route.ts` — Zod + `obterRestauranteDaSessao()` + helpers `ok()`/`erro()`
- [X] T006 [P] Implementar `PUT /api/itens/[id]` (edita `nome`, `preco`, `descricao`, `categoriaId`, `destaque`; verifica ownership transitivo via `categoria.restauranteId`; recalcula `ordem` apenas se `categoriaId` mudou) e `DELETE /api/itens/[id]` (exclusão definitiva, mesma verificação de ownership) em `src/app/api/itens/[id]/route.ts`
- [X] T007 [P] Implementar `PATCH /api/itens/[id]/disponibilidade` (Zod: `{ disponivel: boolean }`, mesma verificação de ownership transitivo, não recalcula `ordem`) em `src/app/api/itens/[id]/disponibilidade/route.ts`
- [X] T008 [P] Criar `src/components/ui/select.tsx` — wrapper Radix Select (combobox de categoria), seguindo o padrão visual de `components/ui/input.tsx` e `components/ui/dropdown-menu.tsx`
- [X] T009 [P] Criar `src/components/ui/switch.tsx` — wrapper Radix Switch (toggle de disponibilidade/destaque), touch target ≥ 44×44px
- [X] T010 [P] Criar `src/components/ui/textarea.tsx` — textarea nativo estilizado (descrição), mesmo padrão visual de `components/ui/input.tsx`
- [X] T011 Criar `src/hooks/use-itens.ts` — hook client com estado otimista para criar, editar, excluir e alternar disponibilidade (atualiza estado local imediatamente no toggle, reverte com toast em falha; demais operações aguardam resposta do servidor e atualizam a lista)
- [X] T012 ⛔ GATE OBRIGATÓRIO — Executar `/frontend-design` com: wireframe do spec.md, tokens de cor da constitution (`brand-primary`, `brand-accent`, `brand-warm`, `brand-surface`, `brand-muted`, `brand-border`), agrupamento por categoria, badges de "destaque" e "pausado", e os três estados obrigatórios (loading/erro/vazio). **NÃO ESCREVER nenhum componente em `components/itens/` antes deste gate** (constitution antipadrão #9)

**Checkpoint**: Fundação pronta, design aprovado — implementação de UI pode começar.

---

## Phase 3: User Story 2 — Listar itens agrupados por categoria (Priority: P1) 🎯 MVP (base)

**Goal**: Dono acessa `/dashboard/cardapio` e vê os itens agrupados visualmente por categoria, na mesma ordem das categorias no cardápio público.

**Independent Test**: Com itens cadastrados em duas ou mais categorias, acessar `/dashboard/cardapio` e confirmar que os itens aparecem agrupados sob o nome de cada categoria correspondente (quickstart.md Cenário 3).

> **Nota de sequenciamento**: US2 (listagem) é implementada antes de US1 (criar item) porque toda a estrutura de orquestração de estados (loading/erro/vazio) e o esqueleto de `itens-list.tsx`/`categoria-section.tsx` são pré-requisito visual para o formulário de criação aparecer integrado à lista. US1 reutiliza esses componentes.

- [X] T013 [P] [US2] Criar `src/components/itens/itens-empty-state.tsx` — estado vazio com texto "Nenhum item ainda" e botão "Adicionar item"; quando `categorias.length === 0`, renderiza orientação "Crie uma categoria primeiro" com link para `/dashboard/categorias` em vez do CTA (FR-003, design conforme output do T012)
- [X] T014 [P] [US2] Criar `src/components/itens/item-row.tsx` — linha do item exibindo nome, preço formatado em R$, badges de "destaque" e "pausado" quando aplicável (placeholders para toggle e ações de editar/excluir, conectados nas próximas stories; design conforme output do T012)
- [X] T015 [US2] Criar `src/components/itens/categoria-section.tsx` — cabeçalho de categoria + lista de `ItemRow`, ou indicação de "categoria sem itens" sem quebrar o layout das demais (depende de T014)
- [X] T016 [US2] Criar `src/components/itens/itens-list.tsx` — Client Component: orquestra skeleton de loading, erro + retry, estado vazio (`ItensEmptyState`) ou agrupamento de `categorias` recebidas renderizando um `CategoriaSection` por categoria, na ordem recebida; integra `use-itens` hook (depende de T013, T015)
- [X] T017 [US2] Criar `src/app/(dashboard)/dashboard/cardapio/page.tsx` — Server Component: `obterRestauranteDaSessao()`, busca `categorias` via `prisma.categoria.findMany({ where: { restauranteId }, orderBy: { ordem: 'asc' }, include: { itens: { orderBy: { ordem: 'asc' } } } })`, passa dados iniciais para `<ItensList />` (depende de T016)

**Checkpoint**: User Story 2 completamente funcional — listagem agrupada com os três estados obrigatórios.

---

## Phase 4: User Story 1 — Cadastrar primeiro item (Priority: P1) 🎯 MVP

**Goal**: Dono acessa `/dashboard/cardapio`, vê estado vazio com CTA, preenche nome, preço e categoria (descrição opcional) e salva — item aparece imediatamente na listagem.

**Independent Test**: Com ao menos uma categoria existente e nenhum item cadastrado, usar o CTA do estado vazio, preencher o formulário com nome, preço e categoria, e salvar — o item aparece na lista sob a categoria correta (quickstart.md Cenário 2).

- [X] T018 [US1] Criar `src/components/itens/item-modal.tsx` — Radix Dialog com campos nome (Zod: min 1, max 80), preço (`type="number" step="0.01" min="0.01"`), descrição opcional (Textarea, max 500), categoria (Select com lista de categorias recebida via prop) e destaque (Switch); erro de validação inline; não fecha modal em erro (design conforme output do T012)
- [X] T019 [US1] Conectar botão "Adicionar item" em `src/components/itens/itens-list.tsx` e no CTA de `itens-empty-state.tsx` para abrir `ItemModal` no modo criação, chamando `criarItem()` de `src/hooks/use-itens.ts` no submit; em sucesso, fecha o modal, insere o item na categoria correta e exibe confirmação (toast)
- [X] T020 [US1] Em `src/hooks/use-itens.ts`, implementar `criarItem()` — `POST /api/itens`, atualiza estado local inserindo o item retornado na categoria correspondente

**Checkpoint**: User Stories 1 e 2 funcionando juntas — cadastro e listagem end-to-end (MVP).

---

## Phase 5: User Story 3 — Pausar e reativar disponibilidade (Priority: P1)

**Goal**: Dono usa um toggle em `item-row.tsx` para marcar um item como pausado/disponível, com atualização otimista.

**Independent Test**: Com um item disponível cadastrado, acionar o toggle — o item exibe "pausado" imediatamente, sem recarregar a página, e a mudança persiste após um refresh (quickstart.md Cenário 4).

- [X] T021 [US3] Adicionar `Switch` de disponibilidade a `src/components/itens/item-row.tsx`, conectado ao callback `onToggleDisponibilidade`, refletindo o badge "pausado" imediatamente conforme o estado otimista
- [X] T022 [US3] Em `src/hooks/use-itens.ts`, implementar `alternarDisponibilidade()` — atualiza o estado local do item imediatamente (otimista), chama `PATCH /api/itens/[id]/disponibilidade`, e em caso de falha reverte o estado local e exibe toast de erro

**Checkpoint**: User Stories 1, 2 e 3 funcionando independentemente.

---

## Phase 6: User Story 4 — Editar um item existente (Priority: P2)

**Goal**: Dono clica em "Editar", formulário abre pré-preenchido, altera nome/preço/descrição/categoria e salva.

**Independent Test**: Com um item cadastrado, clicar em editar, alterar o preço e salvar — a listagem reflete o novo valor sem duplicar o item (quickstart.md Cenário 5).

- [X] T023 [US4] Conectar botão de editar em `src/components/itens/item-row.tsx` ao callback `onEdit` para abrir `ItemModal` no modo edição com o item selecionado
- [X] T024 [US4] Adicionar modo edição a `src/components/itens/item-modal.tsx` — quando `item` prop presente: pré-preencher todos os campos com os valores atuais, chamar `editarItem()` do hook no submit, exibir título "Editar item"
- [X] T025 [US4] Em `src/hooks/use-itens.ts`, implementar `editarItem()` — `PUT /api/itens/[id]`, atualiza o item no estado local; se a `categoriaId` retornada mudou, move o item para a nova seção de categoria mantendo a posição de "último item" (ordem = append)

**Checkpoint**: User Stories 1, 2, 3 e 4 funcionando independentemente.

---

## Phase 7: User Story 5 — Excluir um item (Priority: P3)

**Goal**: Dono exclui um item permanentemente após confirmação explícita.

**Independent Test**: Com um item cadastrado, clicar em excluir, confirmar em um diálogo — o item desaparece da listagem; cancelar não altera nada (quickstart.md Cenário 6).

- [X] T026 [US5] Adicionar diálogo de confirmação de exclusão a `src/components/itens/item-row.tsx` — ao clicar no ícone de excluir, exibir confirmação inline (mesmo padrão de `categoria-item.tsx`) antes de qualquer chamada de API
- [X] T027 [US5] Ao confirmar exclusão, chamar `excluirItem()` de `src/hooks/use-itens.ts`; em sucesso, remover o item do estado local e exibir indicação de "categoria vazia" se for o último item da categoria

**Checkpoint**: Todas as 5 user stories funcionando — feature completa para validação final.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verificação de qualidade que afeta múltiplas stories.

- [ ] T028 [P] Confirmar os três estados obrigatórios (FR-010): skeleton de loading, erro com botão de retry e estado vazio com CTA (ou orientação "crie uma categoria primeiro") funcionando em `src/app/(dashboard)/dashboard/cardapio/page.tsx` e `src/components/itens/itens-list.tsx`
- [ ] T029 [P] Verificar isolamento de dados entre restaurantes via testes manuais de API conforme quickstart.md Cenário 7 (sem sessão → 401; item de outro restaurante → 403)
- [ ] T030 [P] Verificar exibição de preço com exatamente 2 casas decimais (FR-011, SC-006) conforme quickstart.md Cenário 8
- [ ] T031 Executar os 8 cenários de validação do `specs/006-item-management/quickstart.md` e confirmar todos passam

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — **BLOQUEIA todas as stories**
- **US2 (Phase 3)**: Depende da conclusão do Foundational (incluindo T012 gate) — implementada primeiro por fornecer o esqueleto visual (lista/seções/estados) que as demais stories reutilizam
- **US1 (Phase 4)**: Depende do US2 (reutiliza `itens-list.tsx` e `itens-empty-state.tsx`)
- **US3 (Phase 5)**: Depende do US2 (reutiliza `item-row.tsx`); independente de US1
- **US4 (Phase 6)**: Depende do US1 (reutiliza `item-modal.tsx` no modo edição) e do US2 (reutiliza `item-row.tsx`)
- **US5 (Phase 7)**: Depende do US2 (reutiliza `item-row.tsx`); independente de US1, US3, US4
- **Polish (Phase 8)**: Depende de todas as stories desejadas estarem completas

### Within Each User Story

- Tipos e rotas de API antes de componentes
- Componentes folha antes de componentes contêiner (`item-row` antes de `categoria-section`/`itens-list`)
- Componentes antes da page
- Story completa antes de avançar para a próxima prioridade

### Parallel Opportunities

- T004, T005, T006, T007: paralelos entre si (arquivos diferentes — types e rotas)
- T008, T009, T010: paralelos entre si (primitivos de UI diferentes)
- T013, T014: paralelos entre si após T012 (componentes diferentes)
- T028, T029, T030: paralelos entre si (verificações independentes)

---

## Parallel Example: Foundational (Phase 2)

```bash
# Após T003 (migration), lançar em paralelo:
Task T004: Create src/types/item.ts
Task T005: Implement GET+POST /api/itens
Task T006: Implement PUT+DELETE /api/itens/[id]
Task T007: Implement PATCH /api/itens/[id]/disponibilidade
Task T008: Create components/ui/select.tsx
Task T009: Create components/ui/switch.tsx
Task T010: Create components/ui/textarea.tsx
```

## Parallel Example: User Story 2

```bash
# Após T012 (gate /frontend-design), lançar em paralelo:
Task T013: Create itens-empty-state.tsx
Task T014: Create item-row.tsx

# Depois (depende de T014):
Task T015: Create categoria-section.tsx

# Depois (depende de T013, T015):
Task T016: Create itens-list.tsx

# Depois (depende de T016):
Task T017: Create/update page.tsx
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational — incluindo T012 gate `/frontend-design`
3. Completar Phase 3: User Story 2 (esqueleto de listagem)
4. Completar Phase 4: User Story 1 (cadastro de item)
5. **PARAR E VALIDAR**: Testar US1+US2 com quickstart.md Cenários 1–3
6. Demonstrar MVP funcional

### Incremental Delivery

1. Setup + Foundational → Base pronta
2. US2 → Listagem agrupada → testar
3. US1 → Cadastrar item → testar → **MVP funcional**
4. US3 → Pausar/reativar → testar → Deploy/Demo
5. US4 → Editar → testar → Deploy/Demo
6. US5 → Excluir → testar → Feature completa

---

## Notes

- **Marcar `[x]` imediatamente ao concluir cada task** — antes de iniciar a próxima (constitution padrão obrigatório)
- **T012 é bloqueante para toda a UI** — constitution antipadrão #9 proíbe qualquer componente visual em `components/itens/` antes do `/frontend-design`
- Tasks com [P] = arquivos diferentes, sem dependências pendentes entre si
- Sem test suite automatizada — validação é manual via `quickstart.md`
- Apenas o toggle de disponibilidade usa optimistic update (FR-006); criar/editar/excluir aguardam resposta do servidor antes de atualizar a lista
