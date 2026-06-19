---

description: "Task list for 009-configuracoes-qrcode"
---

# Tasks: Configurações e QR Code

**Input**: Design documents from `/specs/009-configuracoes-qrcode/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md (all present)

**Tests**: Não solicitados nesta feature (validação manual via `quickstart.md`, mesmo padrão de `004`–`008`) — nenhuma tarefa de teste automatizado é gerada.

**Organization**: Tarefas agrupadas por user story (US1 = QR code, US2 = formulário de identidade visual) para permitir entrega incremental e teste independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 ou US2 — mapeia para as user stories de `spec.md`
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único Next.js — `src/` na raiz do repositório (mesma estrutura de `004`–`008`).

---

## Phase 1: Setup

**Purpose**: Dependência nova e infraestrutura externa (bucket de storage)

- [X] T001 Instalar dependência `npm install qrcode` (sem `@types/qrcode` — o pacote já publica seus próprios tipos)
- [X] T002 Criar manualmente o bucket público `restaurante-logos` no painel do Supabase Storage (Storage → New bucket → público), mesmo procedimento já documentado em `specs/007-image-upload/quickstart.md` para `item-fotos`; confirmar criação seguindo o pré-requisito descrito em `quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extensões compartilhadas por US1 e US2 — nenhuma user story pode ser implementada antes desta fase

**⚠️ CRITICAL**: Nenhum trabalho de user story pode começar até esta fase estar completa

- [X] T003 [P] Estender `RestauranteDto` em `src/types/restaurante.ts`: adicionar `descricao: string | null` e `logoUrl: string | null` (mesmo padrão de nullability de `ItemDto.descricao`/`ItemDto.fotoUrl`)
- [X] T004 Generalizar `src/lib/supabase/storage.ts`: transformar `enviarFoto(buffer, path)` em `enviarArquivo(bucket: string, buffer: Buffer, path: string)` e `removerFoto(url)` em `removerArquivo(bucket: string, url: string)`; manter `BUCKET_FOTOS_ITENS = 'item-fotos'` e adicionar `BUCKET_LOGOS_RESTAURANTE = 'restaurante-logos'` como constantes exportadas
- [X] T005 [P] Atualizar call site `src/app/api/upload/route.ts` para chamar `enviarArquivo(BUCKET_FOTOS_ITENS, buffer, path)` (depende de T004)
- [X] T006 [P] Atualizar call site `src/app/api/itens/[id]/route.ts` (handlers `PUT` e `DELETE`) para chamar `removerArquivo(BUCKET_FOTOS_ITENS, url)` (depende de T004)
- [X] T007 Estender `GET` em `src/app/api/restaurantes/me/route.ts`: incluir `descricao` e `logoUrl` no `select` do Prisma e no DTO retornado (depende de T003)
- [X] T008 [P] Acionar `/frontend-design` cobrindo as três peças visuais novas da página `/dashboard/configuracoes`: `qrcode-card.tsx` (US1 — QR code, botão baixar, link de preview), `restaurante-form.tsx` e `logo-upload.tsx` (US2 — campos pré-preenchidos, color picker, upload/remoção de logo, validação de nome vazio, toast de sucesso/erro); incluir no prompt os 4 cenários de US1, os 6 cenários de US2 e os Edge Cases do `spec.md` — é a última tela do MVP, sem layout existente a clonar 1:1

**Checkpoint**: Fundação pronta — implementação de US1 e US2 pode começar

---

## Phase 3: User Story 1 — Gerar e baixar o QR code do cardápio (Priority: P1) 🎯 MVP

**Goal**: Exibir na página de configurações um QR code do cardápio público (`/menu/[slug]`), baixável como PNG, com link de preview que abre o cardápio em nova aba.

**Independent Test**: Com um restaurante já criado, acessar `/dashboard/configuracoes` e confirmar que um QR code é exibido apontando para a URL pública do cardápio; clicar em baixar e confirmar que um PNG válido é salvo; clicar no preview e confirmar que abre `/menu/[slug]` em nova aba.

### Implementation for User Story 1

- [X] T009 [P] [US1] Criar `src/lib/qrcode/gerar.ts`: `gerarQrCodeDataUrl(url: string): Promise<string>` usando `QRCode.toDataURL(url, { width: 320, margin: 2 })` do pacote `qrcode` — função pura, sem React
- [X] T010 [P] [US1] Criar `src/components/configuracoes/qrcode-card.tsx`: Server Component (sem `'use client'`) recebendo `dataUrl: string`, `menuUrl: string`, `slug: string` como props; renderiza `<img src={dataUrl}>`, `<a href={dataUrl} download={`qrcode-${slug}.png`}>` (baixar) e `<a href={menuUrl} target="_blank" rel="noopener noreferrer">` (preview) — depende do layout produzido em T008
- [X] T011 [US1] Substituir o placeholder em `src/app/(dashboard)/dashboard/configuracoes/page.tsx`: Server Component que chama `obterRestauranteDaSessao()` (redirect para `/login` em falha), busca `prisma.restaurante.findUnique` (campos `id`, `slug`, `nome`, `descricao`, `corPrimaria`, `logoUrl`), monta `menuUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/menu/${restaurante.slug}`` (mesmo padrão de `src/app/(marketing)/cadastro/actions.ts:40`), chama `gerarQrCodeDataUrl(menuUrl)` e renderiza `<QrCodeCard>` (depende de T009, T010)

**Checkpoint**: US1 funcional e testável de forma independente — cenários 1–4 e 13 de `quickstart.md`

---

## Phase 4: User Story 2 — Atualizar os dados e a identidade visual do restaurante (Priority: P2)

**Goal**: Formulário em `/dashboard/configuracoes` para editar nome, descrição, cor de destaque e logo do restaurante, com validação de nome obrigatório e substituição/remoção de logo refletindo no cardápio público.

**Independent Test**: Acessar `/dashboard/configuracoes`, alterar nome, descrição, cor e logo, salvar, e confirmar que os novos valores aparecem no formulário após recarregar a página e refletem em `/menu/[slug]`.

### Implementation for User Story 2

- [X] T012 [P] [US2] Adicionar `PUT` em `src/app/api/restaurantes/me/route.ts`: `obterRestauranteDaSessao()` → Zod (`nome` `min(2)`/`max(100)` obrigatório, `descricao` opcional `max(500)`, `corPrimaria` regex `/^#[0-9a-fA-F]{6}$/`, `logoUrl` `url()` nullable/opcional) → `prisma.restaurante.update` (nunca inclui `slug` no schema nem no `data`) → se `logoUrl` mudou e havia valor anterior, `removerArquivo(BUCKET_LOGOS_RESTAURANTE, anterior)` fire-and-forget (mesmo padrão de `src/app/api/itens/[id]/route.ts`) → retorna `200` com `RestauranteDto` atualizado; erros `401 NAO_AUTORIZADO`/`400 VALIDACAO_INVALIDA`/`500` (depende de T003, T004, T007)
- [X] T013 [P] [US2] Criar `src/app/api/restaurantes/logo/route.ts`: `POST` `multipart/form-data` no mesmo formato de `src/app/api/upload/route.ts` mas sem `itemId`; valida `file` obrigatório, MIME em `image/jpeg`/`image/png`/`image/webp` (`400 TIPO_INVALIDO`), tamanho `≤5MB` (`413 ARQUIVO_GRANDE`); `enviarArquivo(BUCKET_LOGOS_RESTAURANTE, buffer, `${restauranteId}/logo-${Date.now()}.webp`)`; retorna `200` com `{ url }` (depende de T004)
- [X] T014 [P] [US2] Criar `src/hooks/use-upload-logo.ts`: mesmo formato de `src/hooks/use-upload-imagem.ts` (estados `idle`/`comprimindo`/`enviando`/`erro`/`concluido`, valida tipo/tamanho no client, usa `comprimirImagem()` de `src/lib/image/compress.ts`), sem `itemId`, enviando via `XMLHttpRequest` com progresso real para `POST /api/restaurantes/logo` (depende de T013)
- [X] T015 [P] [US2] Criar `src/hooks/use-atualizar-restaurante.ts`: `salvar(input): Promise<boolean>` chamando `PUT /api/restaurantes/me`, expõe `isPending`/`erro` (mesmo formato de `src/hooks/use-criar-restaurante.ts`) (depende de T012)
- [X] T016 [US2] Criar `src/components/configuracoes/logo-upload.tsx`: Client Component equivalente a `src/components/itens/image-upload.tsx` (estados vazio/progresso/erro com "tentar novamente"), adaptado para preview de logo e botão "Remover" (sem `itemId`), usando `useUploadLogo` (depende de T014, T008)
- [X] T017 [US2] Criar `src/components/configuracoes/restaurante-form.tsx`: Client Component com estado local (`nome`, `descricao`, `corPrimaria`, `logoUrl`) pré-preenchido via props; valida nome vazio antes de submeter (FR-004) com mensagem inline; ao salvar usa `useAtualizarRestaurante`, mantém os valores preenchidos em caso de erro e exibe toast de sucesso/erro local (mesmo padrão de `src/components/itens/itens-list.tsx`); inclui `LogoUpload` para a logo (depende de T015, T016, T008)
- [X] T018 [US2] Atualizar `src/app/(dashboard)/dashboard/configuracoes/page.tsx` para renderizar `<RestauranteForm>` ao lado de `<QrCodeCard>`, passando `nome`/`descricao`/`corPrimaria`/`logoUrl` do restaurante já buscado em T011 como valores iniciais (depende de T011, T017)

**Checkpoint**: US1 e US2 funcionais de forma independente — cenários 5–12 de `quickstart.md`

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo as duas user stories juntas

- [X] T019 Executar todos os cenários de `specs/009-configuracoes-qrcode/quickstart.md` (1–13), incluindo o scan real do QR code baixado com um celular (SC-002) e o teste de download em viewport mobile (Edge Case); confirmar `npm run lint` e `npm run build` sem erros nos arquivos tocados

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende de Setup (T001 para T009; T002 para T013) — BLOQUEIA as duas user stories
- **User Story 1 (Phase 3)**: Depende de Foundational completo (T008 para T010; nenhuma dependência de US2)
- **User Story 2 (Phase 4)**: Depende de Foundational completo; T018 depende também de T011 (US1) por tocarem o mesmo arquivo `page.tsx`
- **Polish (Phase 5)**: Depende de US1 e US2 completos

### User Story Dependencies

- **US1 (P1)**: Pode começar após Foundational — sem dependência de US2
- **US2 (P2)**: Pode começar após Foundational em paralelo com US1 (T012–T017 não tocam `page.tsx`); apenas a integração final em `page.tsx` (T018) precisa que T011 já exista

### Parallel Opportunities

- Setup: T001 e T002 são independentes entre si
- Foundational: T003 e T004 em paralelo; T005/T006/T008 em paralelo entre si após T004 (T008 não depende de T004, pode rodar desde o início da fase); T007 depende apenas de T003
- US1: T009 e T010 em paralelo (arquivos diferentes); T011 depende de ambos
- US2: T012, T013, T014, T015 podem rodar em paralelo entre si (arquivos diferentes; T014 depende apenas de T013, T015 apenas de T012); T016 depende de T014; T017 depende de T015 e T016
- Times diferentes poderiam tocar US1 e US2 em paralelo após o Foundational, integrando ambos em `page.tsx` apenas no final (T011 → T018)

---

## Parallel Example: Foundational

```bash
Task: "Estender RestauranteDto em src/types/restaurante.ts"
Task: "Generalizar src/lib/supabase/storage.ts (enviarArquivo/removerArquivo)"
Task: "Acionar /frontend-design para qrcode-card.tsx, restaurante-form.tsx, logo-upload.tsx"
```

## Parallel Example: User Story 1

```bash
Task: "Criar src/lib/qrcode/gerar.ts (gerarQrCodeDataUrl)"
Task: "Criar src/components/configuracoes/qrcode-card.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "Adicionar PUT em src/app/api/restaurantes/me/route.ts"
Task: "Criar src/app/api/restaurantes/logo/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia as duas stories)
3. Completar Phase 3: User Story 1 (QR code + download + preview)
4. **PARAR e VALIDAR**: testar US1 de forma independente (cenários 1–4 e 13 de `quickstart.md`)
5. Esta já é a entrega central do MVP (spec.md: "entregável que torna o MVP utilizável no mundo real")

### Incremental Delivery

1. Setup + Foundational → fundação pronta
2. US1 → testar independentemente → QR code do cardápio pronto para impressão
3. US2 → testar independentemente → identidade visual editável sem novo onboarding
4. Cada story adiciona valor sem quebrar a anterior; última etapa do MVP — sem trabalho subsequente de roadmap

---

## Notes

- [P] tasks = arquivos diferentes, sem dependência pendente
- [Story] label mapeia a tarefa para a user story correspondente
- **Marcar a tarefa como `[x]` neste arquivo imediatamente ao concluir — antes de iniciar a próxima**
- Fazer commit após cada tarefa ou grupo lógico
- Parar em cada checkpoint para validar a story de forma independente
- Nenhuma migration Prisma nesta feature (`data-model.md`: todos os campos já existem desde `001`/`003`)
