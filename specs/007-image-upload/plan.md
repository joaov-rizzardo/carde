# Implementation Plan: Upload de Imagens dos Itens

**Branch**: `007-image-upload` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-image-upload/spec.md`

## Summary

Adicionar upload de foto a itens do cardápio, reaproveitando o formulário existente (`item-modal.tsx`, feature 006). A imagem é comprimida no browser (`browser-image-compression`, alvo ≤500KB / 1200px / WebP) antes do envio, enviada via `POST /api/upload` (multipart) para o Supabase Storage, e a URL pública resultante é salva no campo `Item.fotoUrl` já existente no schema. Substituir ou remover a foto dispara limpeza automática do arquivo anterior no storage, executada a partir das rotas `PUT`/`DELETE /api/itens/[id]` já existentes. Para itens novos (ainda sem `id` no banco), o client gera um identificador (`crypto.randomUUID()`) antes do upload, reaproveitado depois como `id` explícito na criação do item — garantindo que o path do arquivo já nasça correto, sem etapa de renomeação.

## Technical Context

**Language/Version**: TypeScript 5, React 18, Next.js 16 (Turbopack)

**Primary Dependencies**: `@supabase/supabase-js` (já existente, cliente server-side com service role), `browser-image-compression` (a adicionar — compressão client-side com Web Worker), `@radix-ui/react-progress` (a adicionar — indicador de progresso), Zod 3 (validação do endpoint de upload)

**Storage**: Supabase Storage, bucket público `item-fotos`, path `{restauranteId}/{itemId}-{timestamp}.webp`; URL pública persistida em `Item.fotoUrl` (PostgreSQL via Prisma, campo já existente desde a feature 006)

**Testing**: Validação manual via quickstart.md (mesmo padrão das features 005/006, sem suite automatizada no MVP)

**Target Platform**: Web (mobile-first, Next.js server + Supabase Storage)

**Project Type**: Web application SaaS (dashboard admin) — reaproveita estrutura de projeto único já estabelecida

**Performance Goals**: Adição de foto completa (seleção → preview → envio) em <30s em 4G típico (SC-001); rejeição de arquivo inválido em <2s, client-side, sem round-trip ao servidor (SC-004)

**Constraints**: 100% das fotos persistidas devem estar ≤500KB e ≤1200px de largura, em WebP (SC-002); nenhum arquivo de foto substituída ou removida pode permanecer acessível no storage (SC-003, FR-009, FR-011, FR-012); validação dupla (client + servidor) obrigatória para tipo e tamanho (FR-007, Antipadrão #5); apenas o dono do restaurante proprietário do item pode escrever/ler no path correspondente (FR-013) — garantido por namespacing via `restauranteId` derivado da sessão, nunca do cliente

**Scale/Scope**: MVP — uma foto por item (sem galeria), reaproveita o modal de criação/edição já existente; não inclui a página pública do cardápio (ainda não implementada em nenhuma feature anterior — SC-005 quanto ao cardápio público fica como trabalho futuro quando essa página existir)

## Constitution Check

*Avaliado contra `constitution.md` v1.5.0 — todos os gates PASS*

| Princípio | Status | Evidência |
|---|---|---|
| I. Mobile First | ✅ PASS | `ImageUpload` é área de toque única (clique/arraste) ≥44×44px; botão de remover e barra de progresso seguem os mesmos tokens visuais do `item-modal.tsx`. Sem hover-only feedback (estados visíveis via texto/ícone). |
| II. Server Components | ✅ PASS | Nenhuma busca de dados nova em Server Component é necessária — a foto é só um campo adicional já incluído no `itemSelect` existente (`GET /api/itens` e `page.tsx` de `006`). Toda a lógica de upload é client-side por natureza (arquivo local, browser API), portanto vive em `ImageUpload` (Client Component) por necessidade real, não por conveniência. |
| III. Segurança em Todas as Camadas | ✅ PASS | Upload validado no client (`lib/image/compress.ts` + checagem de tipo/tamanho antes de comprimir) e no servidor (`POST /api/upload` com Zod, ceiling de 5MB e MIME whitelist, independente da validação do cliente). Ownership de `fotoUrl` em `Item` é verificado nas rotas `PUT`/`DELETE /api/itens/[id]` já existentes (`obterRestauranteDaSessao()` + `categoria.restauranteId`); o endpoint de upload em si não confia em `itemId` do cliente para isolamento — o path é sempre prefixado pelo `restauranteId` da sessão, nunca pelo cliente. |
| IV. Todos os Estados da UI | ✅ PASS | `ImageUpload` trata estado vazio (dropzone), progresso (upload em andamento) e erro (mensagem + permite nova tentativa, FR-015) — não há estado de "loading" assíncrono de listagem novo nesta feature. |
| V. Arquitetura Limpa | ✅ PASS | `lib/image/compress.ts` e `lib/supabase/storage.ts` são módulos puros (sem React). Lógica de upload fica em `hooks/use-upload-imagem.ts`; `ImageUpload` apenas renderiza e delega. `components/ui/progress.tsx` é primitivo Radix sem lógica de negócio. |

| Antipadrão | Status | Evidência |
|---|---|---|
| #5 Upload sem validação dupla | ✅ PASS | Validação de tipo/tamanho ocorre em `ImageUpload` (feedback imediato, SC-004) e novamente em `POST /api/upload` via Zod + checagem de MIME/tamanho do buffer recebido (garantia real, independente do cliente). |
| #7 `any` no TypeScript | ✅ PASS | Tipos explícitos para `FormData`/`File` no endpoint; resposta tipada via `ApiResponse<{ url: string }>`. |
| #9 Layout sem `/frontend-design` | ⚠️ OBRIGATÓRIO | `/frontend-design` DEVE ser acionado antes de implementar `image-upload.tsx` (dropzone, preview, progresso, botão remover) — componente visual novo com impacto significativo no formulário de item. |

## Project Structure

### Documentation (this feature)

```text
specs/007-image-upload/
├── plan.md              ✅ (este arquivo)
├── research.md          ✅ (Phase 0 — decisões técnicas)
├── data-model.md         ✅ (Phase 1 — extensão conceitual de Item/Foto)
├── contracts/
│   └── api.md           ✅ (Phase 1 — endpoint de upload + alterações em /api/itens)
├── quickstart.md        ✅ (Phase 1 — cenários de validação + setup do bucket)
└── tasks.md             ⏳ (Phase 2 — /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       ├── upload/
│       │   └── route.ts                   ← novo: POST multipart, valida tipo/tamanho, sobe pro Supabase Storage, retorna URL pública
│       └── itens/
│           └── [id]/
│               └── route.ts               ← estende PUT (aceita fotoUrl, limpa arquivo anterior se mudou) e DELETE (limpa arquivo ao excluir item)
│           └── route.ts                   ← estende POST (aceita id opcional do client e fotoUrl opcional, para o fluxo de criação com foto)
├── components/
│   └── itens/
│       ├── image-upload.tsx               ← novo Client Component: dropzone, preview, progresso, botão remover (passa por /frontend-design)
│       ├── item-modal.tsx                 ← estende: integra ImageUpload, gera id client-side (crypto.randomUUID()) em modo criação
│       └── item-row.tsx                   ← estende: exibe thumbnail da foto (ou placeholder) na listagem
│   └── ui/
│       └── progress.tsx                   ← novo: Radix Progress wrapper
├── hooks/
│   └── use-upload-imagem.ts               ← novo: encapsula compressão + envio (XHR para progresso real) + estados (idle/comprimindo/enviando/erro)
├── lib/
│   ├── image/
│   │   └── compress.ts                    ← novo: comprimirImagem(file) via browser-image-compression (≤0.5MB, 1200px, webp); pula recompressão se já <100KB
│   └── supabase/
│       └── storage.ts                     ← novo: enviarFoto(buffer, path), removerFoto(url), constante BUCKET_FOTOS_ITENS
└── types/
    └── item.ts                            ← sem alteração de forma (fotoUrl já existe em ItemDto)
```

**Structure Decision**: Mesma estrutura de projeto único usada nas features 005/006. Nenhuma alteração de schema Prisma é necessária — `Item.fotoUrl` já existe desde a feature 006. O upload vive como rota isolada (`/api/upload`) por ser uma operação de infraestrutura (storage) genérica, enquanto a associação ao item e a limpeza do arquivo anterior permanecem nas rotas de domínio (`/api/itens`), preservando a regra "ownership verificado nas mutações de domínio" sem duplicar lógica de sessão no endpoint de upload.

## Implementation Sequence

### 0. Dependencies
- `npm install browser-image-compression @radix-ui/react-progress`
- Criar manualmente o bucket público `item-fotos` no painel do Supabase Storage (sem migration — não há IaC de storage neste repo; documentado em `quickstart.md`)

### 1. Lib (sem dependência de UI)
- `lib/image/compress.ts` — `comprimirImagem(file: File): Promise<File>`, pula recompressão se `file.size < 100 * 1024`
- `lib/supabase/storage.ts` — `enviarFoto(buffer, path): Promise<string>` (retorna URL pública), `removerFoto(url: string): Promise<void>` (extrai path da URL pública e remove), `BUCKET_FOTOS_ITENS`

### 2. API Routes
- `POST /api/upload`: `obterRestauranteDaSessao()` → lê `multipart/form-data` (`file`, `itemId`) → valida MIME (`image/jpeg`, `image/png`, `image/webp`) e tamanho (≤5MB) com Zod → `enviarFoto()` no path `{restauranteId}/{itemId}-{Date.now()}.webp` → `ok({ url })`
- Estender `itemSchema` em `POST /api/itens` e `PUT /api/itens/[id]` com `id: z.string().min(1).optional()` (somente no POST) e `fotoUrl: z.string().url().nullable().optional()`
- `PUT /api/itens/[id]`: após `prisma.item.update`, se `fotoUrl` mudou e o valor anterior não era nulo, chamar `removerFoto(fotoAnterior)` (fire-and-forget com log de erro, não bloqueia a resposta)
- `DELETE /api/itens/[id]`: antes/depois do `prisma.item.delete`, se `item.fotoUrl` existir, chamar `removerFoto(item.fotoUrl)`

### 3. UI Primitives
- `components/ui/progress.tsx` (Radix Progress wrapper, mesmo padrão visual de `switch.tsx`)

### 4. Frontend Design Gate
**⛔ STOP — acionar `/frontend-design` antes de escrever `image-upload.tsx`**
Prompt deve incluir: wireframe do spec.md (dropzone vazio → preview com botão remover → barra de progresso), tokens da constitution, e os três estados (vazio/progresso/erro com retry).

### 5. Hook
- `hooks/use-upload-imagem.ts`: recebe `itemId` (real ou gerado client-side), expõe `selecionarArquivo(file)` (valida tipo/tamanho client-side → comprime → envia via `XMLHttpRequest` para reportar progresso real → retorna URL), estado `{ status: 'idle' | 'comprimindo' | 'enviando' | 'erro' | 'concluido', progresso, erro, url }`

### 6. Components
- `image-upload.tsx`: dropzone (clique ou arraste), preview via `URL.createObjectURL`, barra de progresso (`components/ui/progress.tsx`), botão remover (limpa preview/estado local; remoção do arquivo já salvo só acontece ao salvar o item via `fotoUrl: null`)
- `item-modal.tsx`: gera `pendingId` com `crypto.randomUUID()` quando abre em modo criação (reutiliza o mesmo id durante toda a sessão do modal); inclui `ImageUpload` no formulário; inclui `id`/`fotoUrl` no payload de `onSalvar`
- `item-row.tsx`: renderiza `next/image` com `fotoUrl` (ou placeholder de prato) em miniatura quadrada (proporção padrão, FR-016)

## Complexity Tracking

Nenhuma violação de constitution a justificar.
