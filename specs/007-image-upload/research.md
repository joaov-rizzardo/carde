# Research: Upload de Imagens dos Itens

## 1. Biblioteca de compressão client-side

**Decision**: `browser-image-compression` (npm), com `useWebWorker: true`, `maxSizeMB: 0.5`, `maxWidthOrHeight: 1200`, `fileType: 'image/webp'`.

**Rationale**: É a biblioteca já indicada no documento de design original (`.docs/etapa-6-upload-imagens.md`); roda em Web Worker (não bloqueia a UI durante a compressão, importante em devices fracos), e suporta conversão direta para WebP. Encapsulada em `lib/image/compress.ts` como função pura (`comprimirImagem`), mantendo `lib/` livre de React (Princípio V).

**Alternatives considered**:
- Canvas API manual (`canvas.toBlob('image/webp', quality)`): mais controle, zero dependências, mas exige reimplementar redimensionamento proporcional, loop de ajuste de qualidade para atingir o teto de 500KB, e não roda em worker sem esforço extra. Rejeitado por reinventar o que a lib já resolve.
- Compressão no servidor (`sharp`): geraria upload de arquivos não comprimidos (até 5MB) pela rede do cliente antes de qualquer redução — contradiz a motivação documentada ("reduz custo de transferência... usuários enviam fotos direto da câmera >5MB") e o mandato da constitution de compressão client-side.

## 2. Identificador do item antes da criação (path do storage)

**Decision**: O client gera `crypto.randomUUID()` ao abrir o modal em modo "novo item", reutiliza esse valor como `itemId` no upload e como `id` explícito no `POST /api/itens`. Prisma aceita `id` explícito porque o campo é `String @id @default(cuid())` — o default só é aplicado quando o valor é omitido.

**Rationale**: A regra de negócio documentada exige path `{restauranteId}/{itemId}-{timestamp}.webp`, e o fluxo de UX exige preview/upload **antes** de salvar o item (FR-002, FR-003) — ou seja, antes de existir um `id` gerado pelo banco. Gerar o id no client elimina qualquer necessidade de "renomear" o arquivo depois da criação e mantém o path estável do primeiro upload até o salvamento.

**Alternatives considered**:
- Upload para um path temporário (`/tmp/{uuid}`) e mover/renomear após criar o item: exige uma segunda chamada de storage (copy + delete) só para alinhar o nome, sem ganho de segurança real, já que o path final de qualquer forma é namespaced por `restauranteId` da sessão.
- Criar o item "vazio" no banco assim que o modal abre (antes do preenchimento) só para obter um `id`: criaria registros órfãos no banco a cada abertura de modal sem salvar — pior que o risco já aceito nos Assumptions do spec ("arquivo temporário no storage... limitação conhecida").

## 3. Isolamento por restaurante no endpoint de upload

**Decision**: `POST /api/upload` deriva `restauranteId` exclusivamente de `obterRestauranteDaSessao()` (nunca do cliente) e usa esse valor como primeiro segmento do path. Não faz lookup de `itemId` no banco.

**Rationale**: Como o prefixo do path é sempre o `restauranteId` da sessão autenticada, é estruturalmente impossível um dono escrever no diretório de outro restaurante, independentemente do `itemId` enviado (FR-013 satisfeito por construção). Fazer lookup do `itemId` no banco não traria isolamento adicional — apenas adicionaria uma query e quebraria o fluxo de criação (item ainda não existe nesse momento). A associação real entre foto e item (e a verificação de ownership desse vínculo) ocorre na rota de domínio (`PUT`/`POST /api/itens`), que já valida `categoria.restauranteId`.

**Alternatives considered**: Exigir que o item já exista antes de qualquer upload (rejeitado — quebra FR-002/FR-003 no fluxo de criação, que exige preview e progresso antes do salvamento).

## 4. Limpeza do arquivo anterior (substituição/remoção)

**Decision**: A limpeza acontece nas rotas de domínio (`PUT`/`DELETE /api/itens/[id]`), não no endpoint de upload. `PUT` compara o `fotoUrl` anterior (lido do banco antes do update) com o novo valor recebido; se mudou e o anterior não era nulo, chama `removerFoto()` após o update ter sucesso. `DELETE` remove o arquivo associado, se houver, ao excluir o item.

**Rationale**: Mantém o endpoint de upload simples e sem estado (apenas "recebe arquivo, retorna URL"), e centraliza a regra "uma foto por item, sem órfãos" no mesmo lugar que já é responsável por toda a lógica de mutação do item — evita duplicar a leitura do estado anterior do item em dois endpoints diferentes.

**Alternatives considered**: Endpoint de upload recebe `fotoAnteriorUrl` do cliente e já deleta antes/durante o novo upload — rejeitado porque depende do cliente informar corretamente a URL anterior (superfície de erro maior, e o cliente já manda esse dado de qualquer forma no payload de `PUT /api/itens/[id]`, então o servidor já tem acesso direto e mais confiável via leitura do próprio banco).

## 5. Ceiling de validação no servidor

**Decision**: O servidor valida MIME (`image/jpeg`, `image/png`, `image/webp`) e tamanho máximo de 5MB no `POST /api/upload` — o mesmo teto documentado para o arquivo **original** (pré-compressão), não o teto pós-compressão de 500KB.

**Rationale**: A compressão é uma etapa de qualidade de envio que roda no cliente; o teto de 500KB é uma meta de saída, não uma garantia que o servidor deve reforçar byte a byte (FR-004 já é satisfeito pela lib de compressão antes do envio). O servidor existe para impedir abuso (upload de arquivos muito grandes ou de tipo errado, contornando o client) — 5MB já cobre esse caso e é o mesmo valor citado nas regras de negócio do documento original (`Tamanho máximo (antes da compressão): 5 MB`).

**Alternatives considered**: Reforçar exatamente 500KB no servidor — rejeitado porque puniria casos legítimos onde a compressão reduz menos que o ideal (ex.: imagem já predominantemente ruído) sem ganho real de segurança, já que o impacto de armazenamento de alguns KBs extras é desprezível frente ao teto de 5MB já aplicado.

## 6. Bucket do Supabase Storage

**Decision**: Bucket público `item-fotos`, criado manualmente no painel do Supabase (não há sistema de migration para storage neste repo).

**Rationale**: Bucket público é necessário para servir as fotos diretamente via `next/image` no cardápio público sem geração de signed URL por requisição, consistente com `logoUrl`/`fotoUrl` já modelados como `String?` simples (URL direta) em vez de um path privado.

**Alternatives considered**: Bucket privado com signed URLs — adiciona complexidade de expiração/renovação sem benefício de segurança relevante (as fotos de itens de cardápio são, por natureza, conteúdo público).
