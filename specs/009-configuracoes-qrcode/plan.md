# Implementation Plan: Configurações e QR Code

**Branch**: `009-configuracoes-qrcode` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-configuracoes-qrcode/spec.md`

## Summary

Implementar `/dashboard/configuracoes` com duas seções independentes: (1) um QR code do cardápio público (`/menu/[slug]`), gerado **server-side** via `qrcode` e embutido como `data:image/png` — sem nenhum JavaScript no cliente, baixável com um `<a download>` HTML puro — e um link de preview que abre o cardápio público em nova aba; (2) um formulário client-side para atualizar `nome`, `descricao`, `corPrimaria` e `logoUrl` do restaurante, reaproveitando os padrões já estabelecidos em `003-restaurant-onboarding` (cor) e `007-image-upload` (compressão + upload de imagem), com um novo endpoint dedicado de logo (bucket e path próprios, sem reaproveitar o endpoint de foto de item) e extensão do endpoint `/api/restaurantes/me` para suportar leitura e escrita dos novos campos. `lib/supabase/storage.ts` é generalizado para aceitar o bucket como parâmetro, eliminando a necessidade de duplicar a lógica de upload/remoção entre fotos de item e logo de restaurante.

## Technical Context

**Language/Version**: TypeScript 5, React 18, Next.js 16 (Turbopack)

**Primary Dependencies**: `qrcode` (a adicionar — geração de QR code server-side, `toDataURL`), Prisma 5, next-auth v4, Zod 3, `browser-image-compression` (já existente, reaproveitado para a logo), `@supabase/supabase-js` (já existente, cliente server-side com service role)

**Storage**: PostgreSQL via Supabase (Prisma) — nenhuma alteração de schema, `Restaurante.nome/descricao/corPrimaria/logoUrl` já existem desde `001`/`003`. Supabase Storage: novo bucket público `restaurante-logos` (paralelo ao já existente `item-fotos`), path `{restauranteId}/logo-{timestamp}.webp`

**Testing**: Validação manual via [`quickstart.md`](./quickstart.md) — mesmo padrão das features 004–008, sem suite automatizada no MVP

**Target Platform**: Web (dashboard admin, mobile-first, Next.js server)

**Project Type**: Web application SaaS — reaproveita a estrutura de projeto único já estabelecida; última etapa do MVP, sem novas áreas de domínio fora de `(dashboard)`

**Performance Goals**: QR code visível e baixável em <10s a partir da abertura da página (SC-001) — atingido trivialmente por ser gerado no servidor antes do primeiro byte, sem round-trip de API; salvar nome/descrição/cor/logo reflete no cardápio público em uma única operação (SC-003)

**Constraints**: QR code decodifica para a URL pública correta em 100% dos casos (SC-002) — usa a mesma base (`NEXTAUTH_URL`, com fallback `http://localhost:3000`) já usada em `(marketing)/cadastro` e `(marketing)/login` para montar links absolutos; slug nunca é regerado a partir do nome após a criação (FR-008, Antipadrão a evitar: nenhuma chamada a `gerarSlugUnico()` nesta feature); upload de logo validado em duas camadas (Antipadrão #5); arquivo de logo anterior sempre removido do storage ao substituir ou remover (FR-006); 100% das tentativas de salvar com nome vazio bloqueadas sem alterar dados salvos (SC-004)

**Scale/Scope**: MVP — um restaurante por dono, uma logo por restaurante (sem galeria), QR code gerado sob demanda (não persistido em storage, ver `spec.md` Assumptions). Última etapa do MVP — não há trabalho subsequente de roadmap dentro deste plano.

## Constitution Check

*Avaliado contra `constitution.md` v1.5.0 — todos os gates PASS*

| Princípio | Status | Evidência |
|---|---|---|
| I. Mobile First | ✅ PASS | Botão "baixar QR code" e link de preview são âncoras nativas com área de toque ≥44×44px, mesmo padrão de botões já usado em `item-modal.tsx`/`onboarding-form.tsx`. Formulário usa os mesmos inputs/textarea/color-picker já validados em `onboarding-form.tsx` e `item-modal.tsx`. Download funciona via `<a download>` nativo — comportamento idêntico em mobile e desktop (Edge Case do spec), sem depender de APIs de browser exclusivas de desktop. |
| II. Server Components por Padrão | ✅ PASS | `page.tsx` é Server Component: busca o restaurante via Prisma, gera o QR code (`qrcode.toDataURL`, função `async` pura) e monta a URL pública — tudo no servidor. `QrCodeCard` é Server Component (sem `'use client'`): apenas recebe `dataUrl`/`menuUrl` e renderiza `<img>` + dois `<a>`. Único Client Component novo é `RestauranteForm` (e seu `LogoUpload` filho) — estado local de formulário e upload de arquivo exigem genuinamente `'use client'`. |
| III. Segurança em Todas as Camadas | ✅ PASS | `PUT /api/restaurantes/me` valida o corpo com Zod (nome obrigatório, cor em formato hex, descrição/logoUrl opcionais) antes de qualquer escrita, e usa `obterRestauranteDaSessao()` para restringir a mutação ao dono autenticado — sem verificação ad-hoc nova. `POST /api/restaurantes/logo` valida tipo/tamanho no cliente (`LogoUpload`, feedback rápido) e no servidor (Zod + checagem de MIME/tamanho do buffer, mesmo padrão de `/api/upload`). Variáveis de ambiente (`NEXTAUTH_URL`) acessadas via o mesmo padrão já usado em `(marketing)/cadastro/actions.ts` — não via `lib/env.ts` porque já existe precedente de uso direto com fallback nesses dois arquivos; não introduzido aqui, apenas reaproveitado. |
| IV. Todos os Estados da UI São Tratados | ✅ PASS | `RestauranteForm` trata erro de validação inline (nome vazio, FR-004/SC-004) e erro de servidor (toast + mantém valores preenchidos, Edge Case de falha de rede) — mesmo padrão de toast local já usado em `itens-list.tsx`/`categoria-list.tsx`. `LogoUpload` reaproveita os três estados já validados em `ImageUpload` (vazio/progresso/erro com retry). Não há estado de "loading" assíncrono adicional na leitura — dados já vêm prontos do Server Component, igual a `categorias/page.tsx` e `cardapio/page.tsx`. |
| V. Arquitetura Limpa por Domínio | ✅ PASS | `lib/qrcode/gerar.ts` é função pura (sem React) que apenas chama `qrcode.toDataURL`. `lib/supabase/storage.ts` generalizado permanece livre de lógica de negócio (apenas bucket + path). `hooks/use-atualizar-restaurante.ts` e `hooks/use-upload-logo.ts` centralizam toda chamada de API — `RestauranteForm`/`LogoUpload` apenas renderizam e delegam. `components/configuracoes/` é um novo domínio isolado, paralelo a `components/itens/`/`components/categorias/`/`components/menu/`, sem cruzar com `(marketing)`. |

| Antipadrão | Status | Evidência |
|---|---|---|
| #1 Client Component onde Server resolve | ✅ PASS | `QrCodeCard` permanece Server Component — geração e exibição do QR code não exigem nenhuma API de browser; download via `<a download>` é HTML declarativo, não exige handler de clique. |
| #2 Lógica de negócio em componentes | ✅ PASS | Montagem da URL pública e geração do QR code ficam em `page.tsx`/`lib/qrcode/gerar.ts`, nunca inline em `QrCodeCard`. |
| #4 Ownership ad-hoc | ✅ PASS | `PUT /api/restaurantes/me` e `POST /api/restaurantes/logo` usam `obterRestauranteDaSessao()` centralizado — mesmo padrão de todas as rotas de mutação já existentes. |
| #5 Upload sem validação dupla | ✅ PASS | `LogoUpload` valida tipo/tamanho no client (idêntico a `ImageUpload`) e `POST /api/restaurantes/logo` revalida no servidor, independente do cliente. |
| #6 Mutations sem feedback otimista | ✅ PASS (N/A parcial) | Salvar configurações é uma operação explícita de formulário (não uma ação simples/reversível como toggle) — feedback é síncrono ao clique em "Salvar" (estado `salvando` + toast de sucesso/erro), consistente com o tratamento já dado a `item-modal.tsx` (que também não usa optimistic update, por ser submissão de formulário, não toggle). |
| #7 `any` no TypeScript | ✅ PASS | `RestauranteDto` estendido com tipos explícitos (`descricao: string \| null`, `logoUrl: string \| null`); sem `any`/`as unknown` em nenhum arquivo novo. |
| #8 Queries N+1 no Prisma | ✅ PASS | Uma única leitura (`prisma.restaurante.findUnique`) e uma única escrita (`prisma.restaurante.update`) por requisição — sem relações aninhadas nesta feature. |
| #9 Layout sem `/frontend-design` | ⚠️ OBRIGATÓRIO | `/frontend-design` DEVE ser acionado antes de implementar `qrcode-card.tsx`, `restaurante-form.tsx` e `logo-upload.tsx` — primeira tela de configurações do produto, sem layout existente a clonar 1:1 (mistura QR code físico + formulário de identidade visual). |

## Project Structure

### Documentation (this feature)

```text
specs/009-configuracoes-qrcode/
├── plan.md              ✅ (este arquivo)
├── research.md          ✅ (Phase 0 — decisões técnicas)
├── data-model.md        ✅ (Phase 1 — extensão de Restaurante/RestauranteDto + buckets)
├── contracts/
│   └── api.md           ✅ (Phase 1 — GET/PUT /api/restaurantes/me + POST /api/restaurantes/logo)
├── quickstart.md        ✅ (Phase 1 — cenários de validação)
└── tasks.md             ⏳ (Phase 2 — /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── configuracoes/
│   │           └── page.tsx                   ← substitui o placeholder: Server Component, busca restaurante,
│   │                                              gera QR code, monta menuUrl, renderiza QrCodeCard + RestauranteForm
│   └── api/
│       └── restaurantes/
│           ├── me/
│           │   └── route.ts                   ← estende GET (inclui descricao/logoUrl) + adiciona PUT (atualiza dados, remove logo antiga se mudou)
│           └── logo/
│               └── route.ts                   ← novo: POST multipart, valida tipo/tamanho, sobe pro bucket restaurante-logos, retorna URL pública
├── components/
│   └── configuracoes/                         ← novo domínio
│       ├── qrcode-card.tsx                    ← novo: Server Component, <img> + <a download> + <a target="_blank"> (passa por /frontend-design)
│       ├── restaurante-form.tsx                ← novo: Client Component, formulário nome/descricao/cor/logo + toast (passa por /frontend-design)
│       └── logo-upload.tsx                     ← novo: Client Component, dropzone/preview/progresso/remover para a logo (passa por /frontend-design)
├── hooks/
│   ├── use-atualizar-restaurante.ts            ← novo: PUT /api/restaurantes/me, expõe isPending/erro
│   └── use-upload-logo.ts                      ← novo: comprime (reaproveita lib/image/compress.ts) + envia via XHR para /api/restaurantes/logo, progresso real
├── lib/
│   ├── qrcode/
│   │   └── gerar.ts                            ← novo: gerarQrCodeDataUrl(url): Promise<string>, usa pacote `qrcode`
│   └── supabase/
│       └── storage.ts                          ← estende: generaliza enviarFoto/removerFoto em enviarArquivo(bucket,...)/removerArquivo(bucket,...);
│                                                   adiciona BUCKET_LOGOS_RESTAURANTE; mantém BUCKET_FOTOS_ITENS
└── types/
    └── restaurante.ts                          ← estende RestauranteDto com descricao e logoUrl
```

**Structure Decision**: Mesma estrutura de projeto único usada nas features 004–008. Nenhuma migration Prisma. `components/configuracoes/` é um novo domínio paralelo aos já existentes, mantendo a separação por domínio do Princípio V. O endpoint de logo é separado do endpoint de foto de item (`/api/restaurantes/logo` vs `/api/upload`) porque cada um tem bucket, path e regra de ownership própria (restaurante vs item) — generalizar `lib/supabase/storage.ts` por bucket evita duplicar a lógica de upload/extração de path sem forçar os dois domínios a compartilhar uma única rota condicional.

## Implementation Sequence

### 0. Dependencies
- `npm install qrcode` (sem `@types/qrcode` — o pacote já publica seus próprios tipos)

### 1. Lib (sem dependência de UI)
- `lib/qrcode/gerar.ts` — `gerarQrCodeDataUrl(url: string): Promise<string>` via `QRCode.toDataURL(url, { width: 320, margin: 2 })`
- `lib/supabase/storage.ts` — refatorar `enviarFoto(buffer, path)`/`removerFoto(url)` para `enviarArquivo(bucket, buffer, path)`/`removerArquivo(bucket, url)`; adicionar `BUCKET_LOGOS_RESTAURANTE = 'restaurante-logos'`; atualizar os dois call sites existentes (`/api/upload/route.ts`, `/api/itens/[id]/route.ts`) para passar `BUCKET_FOTOS_ITENS` explicitamente
- Criar manualmente o bucket público `restaurante-logos` no painel do Supabase Storage (sem IaC, documentado em `quickstart.md`, mesmo padrão da feature 007)

### 2. Types
- `types/restaurante.ts`: adicionar `descricao: string | null` e `logoUrl: string | null` a `RestauranteDto`

### 3. API Routes
- `GET /api/restaurantes/me`: incluir `descricao`, `logoUrl` no `select`/DTO
- `PUT /api/restaurantes/me`: `obterRestauranteDaSessao()` → Zod (`nome` obrigatório 2–100, `descricao` opcional ≤500, `corPrimaria` regex hex, `logoUrl` nullable/opcional) → `prisma.restaurante.update` (nunca toca `slug`) → se `logoUrl` mudou e o valor anterior existia, `removerArquivo(BUCKET_LOGOS_RESTAURANTE, anterior)` fire-and-forget
- `POST /api/restaurantes/logo`: mesmo formato de `/api/upload`, sem `itemId`; path `{restauranteId}/logo-${Date.now()}.webp`, bucket `BUCKET_LOGOS_RESTAURANTE`

### 4. Frontend Design Gate
**⛔ STOP — acionar `/frontend-design` antes de escrever `qrcode-card.tsx`, `restaurante-form.tsx` e `logo-upload.tsx`**
Prompt deve incluir: os 4 cenários de US1 (QR code + download + preview + scan), os 6 cenários de US2 (campos pré-preenchidos, salvar com sucesso, mudança de cor, troca/remoção de logo, validação de nome vazio), e os Edge Cases (estado vazio do cardápio, erro de upload, falha de rede mantendo valores) — deixar claro que é a última tela do MVP e que QR code + formulário convivem na mesma página.

### 5. Hooks
- `hooks/use-upload-logo.ts`: mesmo formato de `use-upload-imagem.ts`, sem `itemId`, postando para `/api/restaurantes/logo`
- `hooks/use-atualizar-restaurante.ts`: `salvar(input): Promise<boolean>`, expõe `isPending`/`erro`, chama `PUT /api/restaurantes/me`

### 6. Componentes (após o gate de design)
- `qrcode-card.tsx`: Server Component — `<img src={dataUrl}>`, `<a href={dataUrl} download={`qrcode-${slug}.png`}>`, `<a href={menuUrl} target="_blank" rel="noopener noreferrer">`
- `logo-upload.tsx`: igual a `ImageUpload`, adaptado para preview circular/quadrado de logo e sem `itemId`
- `restaurante-form.tsx`: estado local (`nome`, `descricao`, `corPrimaria`, `logoUrl`), validação de nome vazio antes de submeter (FR-004), toast de sucesso/erro local (mesmo padrão de `itens-list.tsx`), mantém valores preenchidos em caso de erro (Edge Case)

### 7. Página
- `app/(dashboard)/dashboard/configuracoes/page.tsx`: substitui o placeholder — `obterRestauranteDaSessao()` (redirect `/login` em falha), `prisma.restaurante.findUnique` (id, slug, nome, descricao, corPrimaria, logoUrl), monta `menuUrl` a partir de `process.env.NEXTAUTH_URL ?? 'http://localhost:3000'`, `gerarQrCodeDataUrl(menuUrl)`, renderiza `QrCodeCard` + `RestauranteForm`

### 8. Validação manual
- Executar todos os cenários de `quickstart.md`, incluindo escanear o QR code baixado com um celular real (SC-002) e testar o download em viewport mobile (Edge Case)

## Complexity Tracking

Nenhuma violação de constitution a justificar.
