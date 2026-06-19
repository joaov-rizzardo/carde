# Research: Configurações e QR Code

## 1. Geração do QR code

**Decision**: Gerar o QR code inteiramente no servidor, dentro do Server Component da página, usando o pacote `qrcode` (`QRCode.toDataURL(url, { width: 320, margin: 2 })`), e embutir o resultado direto como `<img src="data:image/png;base64,...">`. O download usa um `<a href={dataUrl} download="qrcode-{slug}.png">` nativo — sem nenhum clique-handler, sem canvas, sem `'use client'`.

**Rationale**: A URL codificada (`{NEXTAUTH_URL}/menu/{slug}`) é estável durante toda a vida da página — não depende de nenhuma interação do usuário, então não há motivo para gerar no cliente. Gerar no servidor resolve a SC-001 (QR visível e baixável em <10s) trivialmente: o QR já está pronto no HTML antes do primeiro paint, sem round-trip de API. `data:` URIs suportam o atributo `download` em todos os browsers relevantes (Chrome, Firefox, Safari, Edge — testado em produção em outros projetos), então o botão "baixar" não precisa de JavaScript algum, mantendo a página 100% Server Component (Princípio II, Antipadrão #1).

**Alternatives considered**:
- `qrcode.react` (ou similar lib client-side com `<canvas>`/`<svg>`): rejeitado — exigiria `'use client'` só para renderizar algo que não muda depois do load, e o download via canvas (`canvas.toBlob` + `URL.createObjectURL`) é mais código para o mesmo resultado visual.
- Gerar e persistir o PNG no Supabase Storage (como as fotos de item/logo): rejeitado pelo próprio spec (`Assumptions`: "QR code é gerado sob demanda... não é um arquivo persistido") — evita invalidação manual se o domínio mudar no futuro.

## 2. Upload da logo do restaurante

**Decision**: Endpoint dedicado `POST /api/restaurantes/logo`, bucket dedicado `restaurante-logos`, path `{restauranteId}/logo-{timestamp}.webp`. Reaproveita `lib/image/compress.ts` (mesma compressão ≤0.5MB/1200px/WebP já usada em fotos de item) e o mesmo padrão de validação dupla client+server de `007-image-upload`.

**Rationale**: Logo de restaurante e foto de item são domínios diferentes (cardinalidade 1:1 com o restaurante vs 1:1 com o item, buckets diferentes, regra de "remover anterior" disparada por uma rota de domínio diferente — `/api/restaurantes/me` em vez de `/api/itens/[id]`). Forçar os dois a compartilhar `/api/upload` exigiria um parâmetro discriminador (`tipo: 'item' | 'logo'`) com lógica condicional de bucket/path dentro de uma única rota — mais complexidade do que duas rotas pequenas e diretas. A duplicação real (validação de tipo/tamanho) já é eliminada na camada de baixo: `comprimirImagem()` e a futura `enviarArquivo(bucket, ...)`/`removerArquivo(bucket, ...)` generalizadas são compartilhadas pelos dois endpoints.

**Alternatives considered**:
- Estender `POST /api/upload` com um campo opcional `tipo`: rejeitado — mistura duas políticas de bucket/path/ownership na mesma rota (Princípio V: arquitetura limpa por domínio).
- Reaproveitar o bucket `item-fotos` para a logo: rejeitado — mistura dois tipos de asset com ciclos de vida diferentes no mesmo namespace de storage, dificultando auditoria/limpeza futura.

## 3. Generalização de `lib/supabase/storage.ts`

**Decision**: Transformar `enviarFoto(buffer, path)` / `removerFoto(url)` (hoje fixos no bucket `item-fotos`) em `enviarArquivo(bucket, buffer, path)` / `removerArquivo(bucket, url)`, parametrizados pelo bucket. `BUCKET_FOTOS_ITENS` e o novo `BUCKET_LOGOS_RESTAURANTE` passam a ser apenas constantes de string usadas pelos call sites.

**Rationale**: A lógica de upload (chamar `.storage.from(bucket).upload(...)` e extrair a URL pública) e de remoção (extrair o path a partir da URL pública e chamar `.remove([path])`) é idêntica para qualquer bucket — só o nome do bucket muda. Generalizar evita duplicar essa lógica para a logo (Princípio V, evita uma segunda cópia quase-idêntica do arquivo).

**Alternatives considered**:
- Criar `lib/supabase/storage-restaurante.ts` paralelo com sua própria cópia da lógica: rejeitado — duplicação direta do código de upload/remoção, sem ganho de clareza.

## 4. URL pública base do cardápio

**Decision**: Reaproveitar o padrão já estabelecido em `src/app/(marketing)/cadastro/actions.ts:40` e `src/app/(marketing)/login/actions.ts:29`: `process.env.NEXTAUTH_URL ?? 'http://localhost:3000'`.

**Rationale**: É a única convenção de "base URL absoluta" já presente no código (usada para montar o link do magic-link de e-mail). Nenhum env var novo é necessário — `NEXTAUTH_URL` já é obrigatório em `lib/env.ts` (validado via Zod no boot da aplicação). Manter o mesmo padrão de acesso direto (`process.env...`, não via `lib/env.ts`) preserva a consistência com os dois call sites existentes; não é uma decisão nova desta feature.

**Alternatives considered**:
- Acessar via `env.NEXTAUTH_URL` (de `lib/env.ts`): consistente também, mas divergiria do padrão já usado nos dois lugares que hoje montam links absolutos — preferimos seguir o precedente existente em vez de criar um terceiro padrão.

## 5. Formulário de configurações — feedback de salvar

**Decision**: Submissão de formulário tradicional (estado `salvando` + toast local de sucesso/erro), sem atualização otimista.

**Rationale**: O Antipadrão #6 ("mutations sem feedback otimista") se aplica a "ações simples e reversíveis" (toggle de disponibilidade, por exemplo) — salvar um formulário com múltiplos campos (nome, descrição, cor, logo) não é uma ação simples de reverter automaticamente em caso de erro parcial. O mesmo raciocínio já foi aplicado em `item-modal.tsx` (`006`/`007`), que também usa estado `salvando` + retorno booleano, não optimistic update. Mantém os valores preenchidos no formulário em caso de erro (Edge Case do spec), o que uma reversão otimista destruiria.

**Alternatives considered**:
- Optimistic update completo (atualizar a UI antes da resposta do servidor): rejeitado — não há "UI antiga" óbvia para restaurar visualmente além dos próprios campos do formulário, que o usuário já está editando; reverter os campos do meio de uma edição seria mais confuso do que útil.
