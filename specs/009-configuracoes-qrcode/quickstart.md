# Quickstart: Configurações e QR Code

## Pré-requisitos

- Branch com a feature implementada (`page.tsx`, rotas de API, componentes de `components/configuracoes/`).
- `npm install` executado (inclui o novo `qrcode`).
- Bucket público `restaurante-logos` criado manualmente no painel do Supabase Storage (Storage → New bucket → público), mesmo procedimento documentado em `specs/007-image-upload/quickstart.md` para `item-fotos`.
- Usuário logado com restaurante já criado (onboarding `003` concluído) e, idealmente, pelo menos uma categoria/item (`005`/`006`) para que o preview do cardápio público não fique vazio — embora o cardápio vazio também seja um cenário válido (ver Edge Case abaixo).
- `npm run dev` rodando.

## Cenário 1 — QR code exibido ao carregar a página

1. Acessar `/dashboard/configuracoes`.
2. **Esperado**: a página carrega com um QR code visível (sem nenhum spinner/loading — é Server Component, já vem pronto no HTML).
3. Abrir as DevTools → Network → recarregar a página → confirmar que **nenhuma** requisição XHR/fetch foi disparada para gerar ou buscar o QR code (ele é parte do HTML inicial, `data:image/png`).

## Cenário 2 — Download do QR code

1. Na página de configurações, clicar em "Baixar QR code".
2. **Esperado**: o navegador salva um arquivo `qrcode-{slug}.png` válido (abrir o arquivo baixado e confirmar que é uma imagem PNG legível).
3. Repetir em viewport mobile (DevTools → toggle device toolbar) — **Esperado**: mesmo comportamento de download (Edge Case do spec).

## Cenário 3 — Scan real do QR code (SC-002)

1. Baixar o QR code (Cenário 2) e abri-lo na tela de um computador, ou imprimi-lo.
2. Escanear com a câmera de um celular real.
3. **Esperado**: o celular reconhece a URL e oferece abrir `{NEXTAUTH_URL}/menu/{slug}` — abrir e confirmar que é o cardápio público correto do restaurante testado.

> Em ambiente local (`NEXTAUTH_URL=http://localhost:3000`), o celular precisa estar na mesma rede e acessar via IP da máquina (ex: `http://192.168.x.x:3000`) — ajustar `NEXTAUTH_URL` temporariamente para validar o scan real, ou validar este cenário em ambiente de staging/produção.

## Cenário 4 — Link de preview do cardápio

1. Clicar no link/botão de preview do cardápio público.
2. **Esperado**: abre `/menu/{slug}` em uma nova aba, sem navegar para fora de `/dashboard/configuracoes` na aba original.

## Cenário 5 — Formulário pré-preenchido

1. Acessar `/dashboard/configuracoes`.
2. **Esperado**: os campos nome, descrição, cor e logo já mostram os valores atuais do restaurante (os mesmos definidos no onboarding `003` ou em uma edição anterior).

## Cenário 6 — Atualizar nome e descrição

1. Alterar o campo "Nome" e "Descrição".
2. Clicar em "Salvar".
3. **Esperado**: confirmação visual de sucesso (toast); recarregar a página confirma que os novos valores persistiram; abrir `/menu/{slug}` em outra aba confirma que o nome novo aparece no cardápio público.

## Cenário 7 — Atualizar cor de destaque

1. Alterar a cor no color-picker.
2. Salvar.
3. **Esperado**: `/menu/{slug}` reflete a nova cor no header/elementos de destaque (mesmo comportamento já validado em `008-cardapio-publico`, que lê `corPrimaria` dinamicamente).

## Cenário 8 — Enviar nova logo

1. Selecionar um arquivo de imagem válido (JPEG/PNG/WebP, ≤5MB) no upload de logo.
2. Aguardar a barra de progresso concluir.
3. Salvar o formulário.
4. **Esperado**: a logo nova aparece no painel e em `/menu/{slug}`; verificar no painel do Supabase Storage que o arquivo da logo **anterior** (se havia uma) foi removido do bucket `restaurante-logos` (FR-006).

## Cenário 9 — Remover logo sem enviar nova

1. Com uma logo já definida, clicar em "Remover" no upload de logo (sem selecionar um novo arquivo).
2. Salvar.
3. **Esperado**: o restaurante passa a não ter logo — painel e `/menu/{slug}` mostram apenas o nome no header; o arquivo antigo é removido do storage.

## Cenário 10 — Validação de nome vazio

1. Limpar completamente o campo "Nome".
2. Clicar em "Salvar".
3. **Esperado**: mensagem de erro inline, formulário não submete, nenhuma alteração é persistida (confirmar recarregando a página — valores antigos permanecem).

## Cenário 11 — Erro de upload de logo (tipo/tamanho inválido)

1. Tentar enviar um arquivo `.pdf` ou uma imagem >5MB no upload de logo.
2. **Esperado**: mensagem de erro clara no componente de upload, sem afetar a logo atual já salva; botão de "tentar novamente" disponível.

## Cenário 12 — Falha de rede ao salvar

1. Nas DevTools → Network, simular offline (ou interceptar e abortar a requisição `PUT /api/restaurantes/me`).
2. Editar campos e clicar em "Salvar".
3. **Esperado**: toast de erro; os valores digitados permanecem no formulário (nada é perdido).

## Cenário 13 (Edge Case) — Cardápio sem categorias/itens

1. Usar um restaurante de teste sem nenhuma categoria/item.
2. **Esperado**: QR code e link de preview funcionam normalmente, apontando para um cardápio que mostra o estado vazio já implementado em `008-cardapio-publico`.
