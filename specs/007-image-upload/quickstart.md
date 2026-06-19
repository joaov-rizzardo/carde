# Quickstart: Upload de Imagens dos Itens

## Pré-requisitos

- Branch `007-image-upload`, sem migration nova (`Item.fotoUrl` já existe desde `006-item-management`)
- Bucket público `item-fotos` criado no painel do Supabase Storage do projeto (Storage → New bucket → marcar "Public bucket") — **passo manual, não há migration/IaC para isso neste repo**
- `.env` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já configurados (reaproveitados de `lib/supabase/server.ts` e `lib/env.ts`)
- Servidor dev rodando: `npm run dev`
- Usuário autenticado com restaurante, categoria e ao menos um item criados (Etapas 2/3/5/6 anteriores)
- Acesso a `/dashboard/cardapio`

## Setup rápido

```bash
npm install
npm install browser-image-compression @radix-ui/react-progress
npm run dev
```

Criar o bucket (uma vez, manual): painel do Supabase → Storage → "New bucket" → nome `item-fotos` → Public bucket: **on**.

## Cenários de validação

### 1. Adicionar foto ao cadastrar um item (US1)
1. Abra "Adicionar item" em `/dashboard/cardapio`.
2. Selecione uma foto válida (JPEG, PNG ou WebP) do dispositivo.
3. **Esperado**: preview aparece imediatamente, antes de qualquer requisição ao servidor (FR-002).
4. **Esperado**: barra de progresso visível durante o envio (FR-003).
5. Preencha os demais campos e salve.
6. **Esperado**: item aparece na listagem com a foto associada (miniatura em `item-row.tsx`).

### 2. Arquivo inválido (US1 cenário 4, edge case)
1. Tente selecionar um arquivo > 5MB ou de tipo não aceito (ex.: PDF, GIF).
2. **Esperado**: erro claro exibido em até 2s, sem iniciar envio ao servidor (SC-004), restante do formulário intacto.
3. Repita enviando diretamente via `POST /api/upload` (ex.: `curl`) com um arquivo de 6MB ou `Content-Type: application/pdf`.
4. **Esperado**: `413 ARQUIVO_GRANDE` ou `400 TIPO_INVALIDO`, validação server-side independente do client (FR-007).

### 3. Compressão padrão (US1 cenário 5)
1. Selecione uma foto > 1200px de largura e > 500KB.
2. Salve o item.
3. **Esperado**: arquivo armazenado no bucket `item-fotos` tem largura ≤1200px, tamanho ≤500KB e extensão `.webp` (SC-002) — confira no painel do Supabase Storage.

### 4. Substituir foto de item existente (US2)
1. Edite um item que já tem foto.
2. Selecione uma nova foto e salve.
3. **Esperado**: nova foto exibida na listagem; no painel do Supabase Storage, o arquivo antigo não existe mais (FR-009, SC-003).
4. Edite novamente, selecione outra foto, mas **cancele** sem salvar.
5. **Esperado**: foto original do item permanece inalterada (US2 cenário 3).

### 5. Remover foto sem substituir (US3)
1. Edite um item com foto.
2. Use o botão de remover imagem no formulário, salve.
3. **Esperado**: item passa a ser listado sem foto; arquivo correspondente não existe mais no bucket (FR-010, FR-011).

### 6. Excluir item com foto (edge case)
1. Exclua um item que tem foto associada.
2. **Esperado**: item removido da listagem e arquivo de foto removido do bucket (FR-012).

### 7. Isolamento entre restaurantes (FR-013, edge case)
1. Com dois restaurantes de teste (A e B), autenticado como A, tente `POST /api/upload` ou `PUT /api/itens/{idDoItemDeB}` referenciando um item de B.
2. **Esperado**: o upload sempre grava sob o prefixo do restaurante de A no storage (nunca no de B); a tentativa de associar a foto a um item de B via `PUT /api/itens/{idDoItemDeB}` retorna `403 ACESSO_NEGADO` (mesma checagem já existente da feature 006).

### 8. Falha de envio (FR-015, edge case)
1. Inicie o upload de uma foto e simule perda de conexão (ex.: desligar a rede a meio do envio).
2. **Esperado**: UI indica falha no envio, permite tentar novamente, sem perder os demais dados já preenchidos no formulário.
