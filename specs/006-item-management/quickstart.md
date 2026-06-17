# Quickstart: Gestão de Itens do Cardápio

## Pré-requisitos

- Branch `006-item-management` com migration `extend-item-fields` aplicada (`npx prisma migrate dev`)
- Servidor dev rodando: `npm run dev`
- Usuário autenticado com restaurante criado (Etapa 2/3) e ao menos uma categoria criada (Etapa 5) para os cenários que exigem categoria existente
- Acesso a `/dashboard/cardapio`

## Setup rápido

```bash
npm install
npx prisma migrate dev --name extend-item-fields
npx prisma generate
npm run dev
```

## Cenários de validação

### 1. Bloqueio sem categoria (FR-003 / US1 cenário 6)
1. Garanta que o restaurante de teste não tem nenhuma categoria.
2. Acesse `/dashboard/cardapio`.
3. **Esperado**: orientação para criar uma categoria primeiro, com link para `/dashboard/categorias`. Nenhum CTA de "Adicionar item" funcional é exibido.

### 2. Cadastrar primeiro item (US1)
1. Crie ao menos uma categoria em `/dashboard/categorias`.
2. Acesse `/dashboard/cardapio` — estado vazio com CTA "Adicionar item".
3. Clique no CTA, preencha nome, preço e categoria (descrição opcional), salve.
4. **Esperado**: item aparece imediatamente na listagem sob a categoria escolhida; confirmação visual exibida.
5. Repita tentando salvar sem nome / sem preço / com preço ≤ 0 — **esperado**: erro inline, nada salvo.

### 3. Listagem agrupada (US2)
1. Crie itens em duas categorias diferentes.
2. Acesse `/dashboard/cardapio`.
3. **Esperado**: itens agrupados visualmente por categoria, na mesma ordem das categorias em `/dashboard/categorias`. Categoria sem itens exibe indicação de vazia sem quebrar o layout.
4. Simule erro de rede (ex: offline) e recarregue — **esperado**: mensagem de erro + botão de retry.

### 4. Pausar/reativar disponibilidade (US3)
1. Com um item disponível, acione o toggle de disponibilidade.
2. **Esperado**: muda visualmente para "pausado" imediatamente (otimista), sem reload.
3. Acione novamente — volta a "disponível".
4. Recarregue a página — **esperado**: estado do toggle reflete o valor persistido.
5. (Opcional, requer simular falha de rede) Acione o toggle com a API indisponível — **esperado**: UI reverte ao estado anterior + toast de erro.

### 5. Editar item (US4)
1. Clique em "Editar" em um item existente.
2. **Esperado**: formulário pré-preenchido com nome, preço, descrição e categoria atuais.
3. Altere o preço e salve — listagem reflete o novo valor sem duplicar o item.
4. Troque a categoria do item e salve — **esperado**: item passa a aparecer sob a nova categoria, como o último item dela (ordem = append).
5. Apague o nome ou o preço e tente salvar — **esperado**: erro de validação, nada salvo.

### 6. Excluir item (US5)
1. Clique em "Excluir" em um item existente.
2. **Esperado**: confirmação inline antes de qualquer ação destrutiva.
3. Confirme — item desaparece da listagem.
4. Repita e cancele a confirmação — **esperado**: nada alterado.

### 7. Ownership entre restaurantes (FR-008, edge case)
1. Com dois restaurantes de teste (A e B), tente acessar/editar via API um item de B autenticado como A (ex: `PUT /api/itens/{idDoItemDeB}` com sessão de A).
2. **Esperado**: `403 ACESSO_NEGADO`.

### 8. Preço com casas decimais (FR-011, edge case)
1. Crie um item com preço `19.999` (se o input permitir) ou `19.9`.
2. **Esperado**: salvo e exibido como `R$ 19,99` ou `R$ 19,90` — sempre 2 casas decimais, sem erro de arredondamento perceptível.
