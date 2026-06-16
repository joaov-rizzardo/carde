# Tasks: Gestão de Categorias do Cardápio

**Input**: Design documents from `/specs/005-category-management/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: Sem test suite automatizada no MVP — validação manual via `quickstart.md` (8 cenários).

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: User story correspondente (US1, US2, US3, US4)
- Toda task inclui o caminho exato do arquivo

---

## Phase 1: Setup (Dependências)

**Purpose**: Instalar pacotes de terceiros necessários antes de qualquer código.

- [x] T001 Instalar dependências npm: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @radix-ui/react-dialog`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Infraestrutura base que DEVE estar completa antes de qualquer user story.

**⚠️ CRÍTICO**: Nenhuma story pode começar até esta fase estar concluída.

- [x] T002 Adicionar modelos `Categoria` e `Item` (stub) em `prisma/schema.prisma`, e adicionar `categorias Categoria[]` ao modelo `Restaurante` existente
- [x] T003 Executar `npx prisma migrate dev --name add-categoria-item` e regenerar o Prisma client
- [x] T004 [P] Criar `src/types/categoria.ts` com interface `CategoriaDto` (`id`, `nome`, `ordem`)
- [x] T005 [P] Estender `src/lib/auth/ownership.ts` com helper `obterRestauranteDaSessao(): Promise<{ id: string }>` que lê o restaurante da sessão next-auth e lança 401 se ausente
- [x] T006 Criar `src/components/ui/dialog.tsx` — wrapper Radix Dialog primitive (seguindo padrão dos demais primitivos em `components/ui/`)
- [x] T007 [P] Implementar `GET /api/categorias` (lista ordenada por `ordem` asc) e `POST /api/categorias` (cria com `ordem = max + 1`) em `src/app/api/categorias/route.ts` — Zod + `obterRestauranteDaSessao()` + helpers `ok()`/`erro()`
- [x] T008 [P] Implementar `PUT /api/categorias/[id]` (rename, verifica ownership) e `DELETE /api/categorias/[id]` (guarded: 409 se `_count.itens > 0`) em `src/app/api/categorias/[id]/route.ts`
- [x] T009 [P] Implementar `PATCH /api/categorias/reorder` (bulk update `ordem` em transação Prisma única, verifica ownership de todos os IDs) em `src/app/api/categorias/reorder/route.ts`
- [x] T010 Criar `src/hooks/use-categorias.ts` — hook client com estado otimista para criar, renomear, excluir e reordenar categorias (atualiza estado local imediatamente, reverte com toast em falha)
- [x] T011 ⛔ GATE OBRIGATÓRIO — Executar `/frontend-design` com: wireframe da spec.md, tokens de cor da constitution (`brand-primary`, `brand-accent`, `brand-warm`, `brand-surface`, `brand-muted`, `brand-border`), requisito mobile-first, e os três estados (vazio, lista, modal). **NÃO ESCREVER nenhum componente antes deste gate** (constitution antipadrão #9)

**Checkpoint**: Fundação pronta, design aprovado — implementação de UI pode começar.

---

## Phase 3: User Story 1 — Criar primeira categoria (Priority: P1) 🎯 MVP

**Goal**: Dono acessa `/dashboard/categorias` sem categorias, vê estado vazio com CTA, abre modal, preenche nome, salva — categoria aparece na lista.

**Independent Test**: Acessa `/dashboard/categorias` sem nenhuma categoria, clica no CTA do estado vazio, preenche o modal e salva — a categoria aparece na lista (quickstart.md Cenário 1).

- [x] T012 [P] [US1] Criar `src/components/categorias/categorias-empty-state.tsx` — estado vazio com texto "Nenhuma categoria ainda" e botão "Criar categoria" (design conforme output do T011)
- [x] T013 [P] [US1] Criar `src/components/categorias/categoria-modal.tsx` — Radix Dialog com campo nome (Zod: min 1, max 80), modos criar e editar, erro de validação inline, sem fechar modal em erro (design conforme output do T011)
- [x] T014 [P] [US1] Criar `src/components/categorias/categoria-item.tsx` — linha de categoria com placeholder de drag handle, ícone de editar e ícone de excluir (touch targets ≥ 44×44px; design conforme output do T011)
- [x] T015 [US1] Criar `src/components/categorias/categoria-list.tsx` — Client Component: skeleton loading, erro + retry, estado vazio (`CategoriasEmptyState`) ou lista de `CategoriaItem`; integra `use-categorias` hook; gerencia estado de modal aberto/fechado
- [x] T016 [US1] Criar `src/app/(dashboard)/dashboard/categorias/page.tsx` — Server Component: chama `obterRestauranteDaSessao()`, busca categorias via `prisma.categoria.findMany({ where: { restauranteId }, orderBy: { ordem: 'asc' }, select: { id, nome, ordem } })`, passa dados iniciais para `<CategoriaList />`

**Checkpoint**: User Story 1 completamente funcional — criar primeira categoria end-to-end.

---

## Phase 4: User Story 2 — Listar e reordenar categorias (Priority: P2)

**Goal**: Com duas ou mais categorias, dono arrasta para reordenar — ordem persiste após refresh da página.

**Independent Test**: Com 3 categorias cadastradas, arrasta "Bebidas" para o topo, recarrega a página — nova ordem persiste (quickstart.md Cenário 3).

- [x] T017 [US2] Adicionar DnD sortable a `src/components/categorias/categoria-list.tsx` — envolver lista em `DndContext` + `SortableContext` do `@dnd-kit/sortable`; no `onDragEnd` chamar `reordenarCategorias()` do hook; manter alças visíveis no mobile (touch target ≥ 44px)
- [x] T018 [US2] Adicionar `useSortable` a `src/components/categorias/categoria-item.tsx` — drag handle com ícone `GripVertical`, aplicar `transform` e `transition` do sortable, `setActivatorNodeRef` na alça

**Checkpoint**: User Story 2 completa — reordenação visual + persistência funcionando.

---

## Phase 5: User Story 3 — Editar nome de uma categoria (Priority: P2)

**Goal**: Dono clica em editar, modal abre com nome atual pré-preenchido, altera e salva — lista exibe nome atualizado.

**Independent Test**: Com ao menos uma categoria, clica no ícone de editar, muda o nome para "Aperitivos", salva — lista exibe "Aperitivos" no mesmo lugar (quickstart.md Cenário 4).

- [x] T019 [US3] Conectar botão de editar em `src/components/categorias/categoria-item.tsx` ao callback `onEdit` para abrir `CategoriaModal` no modo edição com a categoria selecionada
- [x] T020 [US3] Adicionar modo edição a `src/components/categorias/categoria-modal.tsx` — quando `categoria` prop presente: pré-preencher campo nome com valor atual, chamar `renomearCategoria()` do hook no submit, exibir título "Editar categoria"

**Checkpoint**: User Stories 1, 2 e 3 funcionando independentemente.

---

## Phase 6: User Story 4 — Excluir categoria vazia (Priority: P3)

**Goal**: Dono exclui categoria sem itens após confirmação; tentativa de excluir categoria com itens é bloqueada com mensagem.

**Independent Test**: Com categoria sem itens, clica excluir, confirma — desaparece da lista. Com categoria com itens (inserido via SQL do quickstart.md Cenário 6), exibe "Esta categoria possui itens e não pode ser excluída" (quickstart.md Cenários 5 e 6).

- [x] T021 [US4] Adicionar diálogo de confirmação de exclusão a `src/components/categorias/categoria-item.tsx` — ao clicar no ícone de excluir, exibir confirmação inline (estado local ou segundo Radix Dialog) antes de qualquer chamada de API
- [x] T022 [US4] Ao confirmar exclusão, chamar `excluirCategoria()` de `src/hooks/use-categorias.ts`; em resposta 409 do servidor exibir toast com mensagem "Esta categoria possui itens e não pode ser excluída"; em sucesso remover da lista e exibir estado vazio se for a última

**Checkpoint**: Todas as 4 user stories funcionando — feature completa para validação final.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificação de qualidade que afeta múltiplas stories.

- [x] T023 [P] Confirmar os três estados obrigatórios (FR-011): skeleton de loading, erro com botão de retry e estado vazio com CTA funcionando em `src/app/(dashboard)/dashboard/categorias/page.tsx` e `src/components/categorias/categoria-list.tsx`
- [x] T024 [P] Verificar isolamento de dados entre restaurantes via testes manuais de API conforme quickstart.md Cenário 8 (sem sessão → 401; ID de outro restaurante → 403)
- [x] T025 Executar os 8 cenários de validação do `specs/005-category-management/quickstart.md` e confirmar todos passam

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — **BLOQUEIA todas as stories**
- **US1 (Phase 3)**: Depende da conclusão do Foundational (incluindo T011 gate) — nenhuma dependência de outras stories
- **US2 (Phase 4)**: Depende da conclusão do US1 (reutiliza `categoria-list.tsx` e `categoria-item.tsx`)
- **US3 (Phase 5)**: Depende do US1 (reutiliza `categoria-modal.tsx` e `categoria-item.tsx`)
- **US4 (Phase 6)**: Depende do US1 (reutiliza `categoria-item.tsx`)
- **Polish (Phase 7)**: Depende de todas as stories desejadas estarem completas

### Within Each User Story

- Modelos e hooks antes de componentes
- Componentes folha antes de componentes contêiner (`categoria-item` antes de `categoria-list`)
- Componentes antes da page
- Story completa antes de avançar para a próxima prioridade

### Parallel Opportunities

- T004, T005: paralelos entre si (arquivos diferentes)
- T007, T008, T009: paralelos entre si (routes diferentes)
- T012, T013, T014: paralelos entre si após T011 (componentes diferentes)
- T023, T024: paralelos entre si (verificações independentes)

---

## Parallel Example: User Story 1

```bash
# Após T011 (gate /frontend-design), lançar em paralelo:
Task T012: Create categorias-empty-state.tsx
Task T013: Create categoria-modal.tsx
Task T014: Create categoria-item.tsx

# Depois (depende de T012–T014):
Task T015: Create categoria-list.tsx

# Depois (depende de T015):
Task T016: Create/update page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Apenas)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational — incluindo T011 gate `/frontend-design`
3. Completar Phase 3: User Story 1
4. **PARAR E VALIDAR**: Testar US1 com quickstart.md Cenário 1
5. Demonstrar MVP funcional

### Incremental Delivery

1. Setup + Foundational → Base pronta
2. US1 → Criar categoria — testar → **MVP funcional**
3. US2 → Reordenar — testar → Deploy/Demo
4. US3 → Editar nome — testar → Deploy/Demo
5. US4 → Excluir — testar → Feature completa

---

## Notes

- **Marcar `[x]` imediatamente ao concluir cada task** — antes de iniciar a próxima (constitution padrão obrigatório)
- **T011 é bloqueante para toda a UI** — constitution antipadrão #9 proíbe qualquer componente visual antes do `/frontend-design`
- Tasks com [P] = arquivos diferentes, sem dependências pendentes entre si
- Sem test suite automatizada — validação é manual via `quickstart.md`
- Reordenação usa optimistic update: UI atualiza imediatamente, reverte com toast em falha de API
