# Tasks: Upload de Imagens dos Itens

**Input**: Design documents from `/specs/007-image-upload/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: Sem test suite automatizada no MVP — validação manual via `quickstart.md` (8 cenários), mesmo padrão das features 005/006.

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: User story correspondente (US1, US2, US3)
- Toda task inclui o caminho exato do arquivo

---

## Phase 1: Setup (Dependências)

**Purpose**: Instalar pacotes de terceiros e provisionar o bucket de storage antes de qualquer código.

- [X] T001 Instalar dependências npm: `npm install browser-image-compression @radix-ui/react-progress`
- [X] T002 Criar manualmente o bucket público `item-fotos` no painel do Supabase Storage (Storage → New bucket → Public bucket: on) — passo manual documentado em `quickstart.md`, sem migration/IaC

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Infraestrutura base de upload/compressão/storage que DEVE estar completa antes de qualquer user story, já que as três stories reutilizam o mesmo endpoint de upload, hook e componente `ImageUpload`.

**⚠️ CRÍTICO**: Nenhuma story pode começar até esta fase estar concluída.

- [X] T003 [P] Criar `src/lib/image/compress.ts` — `comprimirImagem(file: File): Promise<File>` via `browser-image-compression` (`useWebWorker: true`, `maxSizeMB: 0.5`, `maxWidthOrHeight: 1200`, `fileType: 'image/webp'`); pula recompressão se `file.size < 100 * 1024`; módulo puro sem React (Princípio V)
- [X] T004 [P] Criar `src/lib/supabase/storage.ts` — constante `BUCKET_FOTOS_ITENS = 'item-fotos'`; `enviarFoto(buffer: Buffer, path: string): Promise<string>` (upload via `createServerClient()` de `lib/supabase/server.ts`, retorna URL pública); `removerFoto(url: string): Promise<void>` (extrai o path a partir da URL pública e remove do bucket; loga erro sem lançar exceção, para não quebrar o fluxo de quem chama)
- [X] T005 [P] Configurar `next.config.js` com `images.remotePatterns` apontando para o domínio do projeto Supabase (`NEXT_PUBLIC_SUPABASE_URL`), necessário para `next/image` renderizar `fotoUrl` em `item-row.tsx`
- [X] T006 [P] Criar `src/components/ui/progress.tsx` — wrapper Radix Progress, mesmo padrão visual de `components/ui/switch.tsx`
- [X] T007 Implementar `POST /api/upload` em `src/app/api/upload/route.ts` — `obterRestauranteDaSessao()` (`401 NAO_AUTORIZADO` sem sessão); lê `multipart/form-data` (`file`, `itemId`); valida com Zod: `itemId` string não vazia, MIME em `image/jpeg`/`image/png`/`image/webp` (`400 TIPO_INVALIDO`), tamanho ≤ 5MB (`413 ARQUIVO_GRANDE`); chama `enviarFoto()` (T004) no path `{restauranteId}/{itemId}-{Date.now()}.webp` (restauranteId sempre da sessão, nunca do cliente); retorna `ApiResponse<{ url: string }>` (depende de T004)
- [X] T008 Criar `src/hooks/use-upload-imagem.ts` — recebe `itemId`; expõe `selecionarArquivo(file: File)` que valida tipo/tamanho client-side (rejeita em <2s sem round-trip, SC-004), comprime via `comprimirImagem()` (T003) e envia via `XMLHttpRequest` para `POST /api/upload` (T007) reportando progresso real; estado `{ status: 'idle' | 'comprimindo' | 'enviando' | 'erro' | 'concluido', progresso, erro, url }` (depende de T003, T007)
- [X] T009 ⛔ GATE OBRIGATÓRIO — Executar `/frontend-design` com: wireframe do spec.md (dropzone vazio → preview com botão remover → barra de progresso), tokens de cor da constitution (`brand-primary`, `brand-accent`, `brand-warm`, `brand-surface`, `brand-muted`, `brand-border`), e os três estados obrigatórios do componente (vazio/progresso/erro com retry, FR-015). **NÃO ESCREVER `image-upload.tsx` antes deste gate** (constitution antipadrão #9)
- [X] T010 Criar `src/components/itens/image-upload.tsx` — Client Component: dropzone (clique ou arraste), preview via `URL.createObjectURL`, barra de progresso (`components/ui/progress.tsx`, T006), botão remover (limpa preview/estado local — remoção do arquivo já salvo só ocorre ao salvar o item com `fotoUrl: null`); aceita prop opcional de URL inicial (foto já existente, modo edição); usa `use-upload-imagem` (T008); design conforme output do T009 (depende de T006, T008, T009)

**Checkpoint**: Fundação pronta, design aprovado — upload de arquivo isolado funciona (sem ainda estar associado a um item).

---

## Phase 3: User Story 1 — Adicionar foto ao cadastrar um item (Priority: P1) 🎯 MVP

**Goal**: Dono abre o formulário de cadastro de item (Etapa 5), seleciona uma foto, vê preview e progresso, salva o item e a foto aparece associada na listagem.

**Independent Test**: Com o formulário de cadastro de item aberto, selecionar uma foto válida, aguardar o preview e o envio, salvar o item e confirmar que a foto aparece associada ao item na listagem (quickstart.md Cenário 1).

- [X] T011 [US1] Estender `src/components/itens/item-modal.tsx` — gera `pendingId` via `crypto.randomUUID()` ao abrir em modo criação (reutilizado durante toda a sessão do modal); estende a interface exportada `ItemFormPayload` com `id?: string` e `fotoUrl?: string | null`; integra `ImageUpload` (T010) passando o `itemId` (pendingId em criação) ao formulário; inclui `id`/`fotoUrl` no payload de `onSalvar` (depende de T010)
- [X] T012 [P] [US1] Estender a interface `ItemPayload` em `src/hooks/use-itens.ts` com `id?: string` e `fotoUrl?: string | null`, para que `criarItem()` encaminhe esses campos no body de `POST /api/itens` sem alteração de lógica (o `fetch` já serializa o payload inteiro)
- [X] T013 [P] [US1] Estender `itemSchema` em `src/app/api/itens/route.ts` com `id: z.string().min(1).optional()` e `fotoUrl: z.string().url().nullable().optional()`; usar `id` explicitamente em `prisma.item.create({ data: { id, ... } })` quando fornecido (Prisma só aplica o `@default(cuid())` quando o valor é omitido)
- [X] T014 [US1] Estender `src/components/itens/item-row.tsx` — renderiza `next/image` com `fotoUrl` em miniatura quadrada (proporção padrão, FR-016) ou placeholder de prato quando `fotoUrl` for `null` (depende de T005)

**Checkpoint**: User Story 1 completamente funcional — cadastro de item com foto, ponta a ponta.

---

## Phase 4: User Story 2 — Substituir a foto de um item existente (Priority: P2)

**Goal**: Dono edita um item que já tem foto, seleciona uma nova, salva — a foto antiga deixa de existir no storage.

**Independent Test**: Editar um item que já possui foto, selecionar uma nova foto, salvar, e confirmar que (a) a nova foto é exibida no lugar da antiga e (b) a foto antiga não está mais acessível/armazenada (quickstart.md Cenário 4).

- [X] T015 [US2] Estender `src/components/itens/item-modal.tsx` — em modo edição, usa o `id` real do item (sem gerar `pendingId`) como `itemId` do `ImageUpload`; passa `itemEmEdicao.fotoUrl` como valor inicial de preview ao `ImageUpload` (T010); mantém o `fotoUrl` atualizado no payload de `onSalvar` quando o dono troca a foto; cancelar a edição sem salvar não altera a foto original (depende de T011, mesmo arquivo)
- [X] T016 [US2] Estender `itemSchema` e o handler `PUT` em `src/app/api/itens/[id]/route.ts` com `fotoUrl: z.string().url().nullable().optional()`; antes do `prisma.item.update`, ler o `fotoUrl` atual do item; após o `update` confirmado, se o `fotoUrl` mudou e o anterior não era nulo, chamar `removerFoto(fotoAnterior)` (T004) de forma fire-and-forget, logando erro sem afetar a resposta

**Checkpoint**: User Stories 1 e 2 funcionando juntas — substituição de foto sem deixar arquivo órfão.

---

## Phase 5: User Story 3 — Remover a foto de um item sem substituí-la (Priority: P3)

**Goal**: Dono remove a foto existente de um item no formulário e salva — o item passa a ser exibido sem foto, sem arquivo remanescente no storage.

**Independent Test**: Editar um item que possui foto, usar o botão de remover imagem, salvar, e confirmar que o item passa a ser exibido sem foto e que o arquivo correspondente não está mais armazenado (quickstart.md Cenário 5).

- [X] T017 [US3] Estender `src/components/itens/item-modal.tsx` — ao acionar o botão de remover no `ImageUpload` (T010), garante que o payload de `onSalvar` envie `fotoUrl: null` quando a foto existente é removida sem substituição (depende de T015, mesmo arquivo; reaproveita a limpeza de arquivo anterior já implementada em T016, já que `null` é só mais um caso de "valor mudou")
- [X] T018 [US3] Estender o handler `DELETE` em `src/app/api/itens/[id]/route.ts` — antes de excluir, ler `item.fotoUrl`; após `prisma.item.delete` confirmado, se `fotoUrl` não era nulo, chamar `removerFoto(fotoUrl)` (T004), logando erro sem afetar a resposta (FR-012, edge case "excluir item com foto")

**Checkpoint**: Todas as 3 user stories funcionando — feature completa para validação final.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificação de qualidade que afeta múltiplas stories.

- [ ] T019 [P] Verificar isolamento entre restaurantes (FR-013) conforme quickstart.md Cenário 7 — upload sempre grava sob o prefixo do restaurante autenticado; `PUT /api/itens/{idDeOutroRestaurante}` retorna `403 ACESSO_NEGADO`
- [ ] T020 [P] Verificar compressão padrão (SC-002) conforme quickstart.md Cenário 3 — arquivo armazenado no bucket tem largura ≤1200px, tamanho ≤500KB e extensão `.webp`
- [ ] T021 [P] Verificar tratamento de falha de envio (FR-015) conforme quickstart.md Cenário 8 — UI indica falha, permite nova tentativa, sem perder os demais dados do formulário
- [ ] T022 Executar os 8 cenários de validação do `specs/007-image-upload/quickstart.md` e confirmar que todos passam

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — **BLOQUEIA todas as stories** (endpoint de upload, hook e `ImageUpload` são compartilhados pelas 3 stories)
- **US1 (Phase 3)**: Depende do Foundational (incluindo o gate T009) — sem dependência de outras stories
- **US2 (Phase 4)**: Depende do US1 (reutiliza a integração de `ImageUpload` em `item-modal.tsx` feita em T011)
- **US3 (Phase 5)**: Depende do US2 (reutiliza a limpeza de arquivo anterior implementada em T016 para o caso `fotoUrl: null`)
- **Polish (Phase 6)**: Depende de todas as stories desejadas estarem completas

### Within Each User Story

- Lib (compressão/storage) antes de rotas de API
- Rotas de API antes de hooks/componentes que as consomem
- `item-modal.tsx` antes de `item-row.tsx` quando há dependência de dados (não há, nesta feature — paralelos)
- Story completa antes de avançar para a próxima prioridade

### Parallel Opportunities

- T003, T004, T005, T006: paralelos entre si (lib/config/UI primitivo, arquivos diferentes)
- T012, T013, T014: paralelos entre si após T011 (arquivos diferentes — hook, rota POST, item-row)
- T019, T020, T021: paralelos entre si (verificações independentes)

---

## Parallel Example: Foundational (Phase 2)

```bash
# Em paralelo, desde o início:
Task T003: Create src/lib/image/compress.ts
Task T004: Create src/lib/supabase/storage.ts
Task T005: Configure next.config.js remotePatterns
Task T006: Create components/ui/progress.tsx

# Depois (depende de T004):
Task T007: Implement POST /api/upload

# Depois (depende de T003, T007):
Task T008: Create hooks/use-upload-imagem.ts

# Depois (gate obrigatório):
Task T009: Executar /frontend-design

# Depois (depende de T006, T008, T009):
Task T010: Create components/itens/image-upload.tsx
```

## Parallel Example: User Story 1

```bash
# Depende de T010 (Foundational):
Task T011: Estender item-modal.tsx (pendingId + integração ImageUpload)

# Em paralelo após T011:
Task T012: Estender ItemPayload em use-itens.ts
Task T013: Estender itemSchema em POST /api/itens
Task T014: Estender item-row.tsx (thumbnail/placeholder)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational — incluindo T009 gate `/frontend-design`
3. Completar Phase 3: User Story 1
4. **PARAR E VALIDAR**: Testar US1 com quickstart.md Cenários 1–3
5. Demonstrar MVP funcional

### Incremental Delivery

1. Setup + Foundational → upload/compressão/storage prontos
2. US1 → Adicionar foto ao cadastrar → testar → **MVP funcional**
3. US2 → Substituir foto sem deixar órfão → testar → Deploy/Demo
4. US3 → Remover foto → testar → Feature completa

---

## Notes

- **Marcar `[x]` imediatamente ao concluir cada task** — antes de iniciar a próxima (constitution padrão obrigatório)
- **T009 é bloqueante para `image-upload.tsx`** — constitution antipadrão #9 proíbe qualquer componente visual novo em `components/itens/` antes do `/frontend-design`
- Tasks com [P] = arquivos diferentes, sem dependências pendentes entre si
- Sem test suite automatizada — validação é manual via `quickstart.md`
- Nenhuma migration Prisma é necessária — `Item.fotoUrl` já existe desde a feature 006
