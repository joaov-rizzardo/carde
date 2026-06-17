# Feature Specification: Gestão de Itens do Cardápio

**Feature Branch**: `006-item-management`

**Created**: 2026-06-16

**Status**: Draft

---

## Clarifications

### Session 2026-06-16

- Q: Quando um item é criado, ou movido para outra categoria, qual valor de `ordem` ele deve receber por padrão (já que não há UI de arrastar-e-soltar para itens nesta etapa)? → A: Append ao final — o item recebe o maior `ordem` já existente na categoria (de destino) + 1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cadastrar primeiro item (Priority: P1)

O dono já criou ao menos uma categoria e quer começar a popular o cardápio. Ele acessa `/dashboard/cardapio`, vê um estado vazio com CTA, clica em "Adicionar item", preenche nome, preço e categoria (descrição é opcional) e salva. O item aparece imediatamente na listagem, agrupado sob a categoria escolhida.

**Why this priority**: Sem itens cadastrados, o cardápio não tem conteúdo nenhum para o cliente final ver — é o núcleo do produto e o motivo pelo qual o dono paga pelo serviço.

**Independent Test**: Com ao menos uma categoria existente e nenhum item cadastrado, o dono acessa `/dashboard/cardapio`, usa o CTA do estado vazio, preenche o formulário com nome, preço e categoria, e salva — o item aparece na lista sob a categoria correta.

**Acceptance Scenarios**:

1. **Given** o restaurante tem categorias mas nenhum item, **When** o dono acessa `/dashboard/cardapio`, **Then** exibe estado vazio com texto explicativo e botão "Adicionar item".
2. **Given** o estado vazio está visível, **When** o dono clica em "Adicionar item", **Then** um formulário abre com campos nome, preço, descrição (opcional) e categoria (obrigatória, lista as categorias existentes).
3. **Given** o formulário está preenchido com nome, preço e categoria válidos, **When** o dono salva, **Then** o item é criado, o formulário fecha, o item aparece na listagem sob a categoria escolhida e uma confirmação é exibida.
4. **Given** o formulário está aberto, **When** o dono tenta salvar sem nome ou sem preço, **Then** o sistema exibe erro de validação inline nos campos obrigatórios e não salva.
5. **Given** o formulário está aberto, **When** o dono informa um preço negativo ou igual a zero, **Then** o sistema exibe erro de validação e não salva.
6. **Given** o restaurante não possui nenhuma categoria cadastrada, **When** o dono tenta adicionar um item, **Then** o sistema orienta a criar uma categoria primeiro.

---

### User Story 2 — Listar itens agrupados por categoria (Priority: P1)

O dono quer ver de forma organizada tudo que está cadastrado no cardápio. Ele acessa `/dashboard/cardapio` e vê os itens agrupados visualmente por categoria, na mesma ordem em que as categorias aparecem no cardápio público.

**Why this priority**: É a tela central de gestão do conteúdo do cardápio; sem uma listagem clara, o dono não consegue localizar e gerenciar o que já cadastrou.

**Independent Test**: Com itens cadastrados em duas ou mais categorias, acessar `/dashboard/cardapio` e confirmar que os itens aparecem agrupados sob o nome de cada categoria correspondente.

**Acceptance Scenarios**:

1. **Given** existem itens em múltiplas categorias, **When** a página carrega, **Then** os itens são exibidos agrupados por categoria, respeitando a ordem das categorias.
2. **Given** uma categoria não possui itens, **When** a página carrega, **Then** a categoria é exibida com uma indicação de que está vazia (sem quebrar o layout das demais).
3. **Given** a listagem está carregando, **When** os dados ainda não retornaram, **Then** o sistema exibe um skeleton de carregamento.
4. **Given** ocorre um erro ao buscar os itens, **When** a página tenta carregar, **Then** o sistema exibe mensagem de erro com botão de tentar novamente.

---

### User Story 3 — Pausar e reativar disponibilidade (Priority: P1)

Um prato fica temporariamente fora de estoque. O dono encontra o item na listagem e usa um toggle para marcá-lo como pausado, sem precisar excluí-lo. Quando o prato volta a estar disponível, ele reativa com o mesmo toggle.

**Why this priority**: Pausar sem excluir evita perda de cadastro (descrição, preço, histórico) e é o motivo de design citado explicitamente para a entidade Item; é uma ação de altíssima frequência no dia a dia do restaurante.

**Independent Test**: Com um item disponível cadastrado, o dono aciona o toggle — o item passa a exibir o estado "pausado" imediatamente, sem recarregar a página, e a mudança persiste após um refresh.

**Acceptance Scenarios**:

1. **Given** um item está disponível, **When** o dono aciona o toggle de disponibilidade, **Then** o item muda visualmente para "pausado" imediatamente (atualização otimista).
2. **Given** o toggle foi acionado, **When** a requisição ao servidor falha, **Then** a UI reverte para o estado anterior e exibe um toast de erro.
3. **Given** um item está pausado, **When** o dono aciona o toggle novamente, **Then** o item volta a ficar disponível.
4. **Given** a mudança de disponibilidade foi persistida, **When** a página é recarregada, **Then** o estado do toggle reflete o valor salvo no servidor.

---

### User Story 4 — Editar um item existente (Priority: P2)

O dono percebe que precisa ajustar o preço ou a descrição de um prato. Ele clica em editar, o formulário abre pré-preenchido com os dados atuais, ele altera e salva.

**Why this priority**: Preços mudam com frequência (insumos, sazonalidade); editar sem recriar preserva a posição e o histórico do item.

**Independent Test**: Com um item cadastrado, o dono clica em editar, altera o preço e salva — a listagem reflete o novo valor sem duplicar o item.

**Acceptance Scenarios**:

1. **Given** existe um item cadastrado, **When** o dono clica em "Editar", **Then** o formulário abre pré-preenchido com nome, preço, descrição e categoria atuais.
2. **Given** o formulário de edição está aberto, **When** o dono altera os dados e salva, **Then** a listagem exibe os dados atualizados.
3. **Given** o formulário de edição está aberto, **When** o dono apaga o nome ou o preço e tenta salvar, **Then** o sistema exibe erro de validação e não salva.
4. **Given** o formulário de edição está aberto, **When** o dono troca a categoria do item, **Then** o item passa a ser exibido sob a nova categoria após salvar.

---

### User Story 5 — Excluir um item (Priority: P3)

O dono cadastrou um item de teste ou removeu um prato definitivamente do menu (não apenas temporariamente) e quer excluí-lo de fato.

**Why this priority**: Exclusão definitiva é necessária para limpeza de dados, mas é menos frequente que pausar — a maioria dos casos de "remover do cardápio" é resolvida pelo toggle de disponibilidade.

**Independent Test**: Com um item cadastrado, o dono clica em excluir, confirma em um diálogo e o item desaparece da listagem.

**Acceptance Scenarios**:

1. **Given** existe um item cadastrado, **When** o dono clica em "Excluir", **Then** um diálogo de confirmação é exibido antes de qualquer ação destrutiva.
2. **Given** o diálogo de confirmação está visível, **When** o dono confirma, **Then** o item é removido permanentemente e desaparece da listagem.
3. **Given** o diálogo de confirmação está visível, **When** o dono cancela, **Then** nada é alterado.

---

### Edge Cases

- O que acontece se o dono tentar criar dois itens com o mesmo nome na mesma categoria? O sistema permite (nomes não são únicos), pois variações do mesmo prato podem compartilhar nome.
- O que acontece se a categoria de um item for excluída? Não é possível: a exclusão de categoria com itens vinculados já é bloqueada pela feature de Gestão de Categorias.
- O que acontece se o dono tentar acessar ou modificar um item de outro restaurante diretamente pela API? A verificação de ownership bloqueia e retorna 403.
- O que acontece se a sessão do dono expirar durante o preenchimento do formulário? Ao salvar, a API retorna 401 e o sistema redireciona para login sem perder os dados preenchidos no formulário, se possível.
- O que acontece com o preço exibido para valores muito altos ou com muitas casas decimais? O sistema arredonda para 2 casas decimais e formata como moeda (R$) na exibição.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir estado vazio com CTA em `/dashboard/cardapio` quando o restaurante não possui nenhum item cadastrado.
- **FR-002**: O sistema DEVE permitir criar um item fornecendo nome (obrigatório, máximo 80 caracteres), preço (obrigatório, valor monetário positivo), descrição (opcional, máximo 500 caracteres) e categoria (obrigatória, deve pertencer ao restaurante autenticado).
- **FR-003**: O sistema DEVE impedir a criação de um item quando o restaurante não possui nenhuma categoria, orientando o dono a criar uma categoria primeiro.
- **FR-004**: O sistema DEVE exibir todos os itens do restaurante autenticado agrupados visualmente por categoria, respeitando a ordem das categorias e a `ordem` de cada item dentro da categoria.
- **FR-004a**: Ao criar um item, ou ao alterar a categoria de um item existente, o sistema DEVE atribuir automaticamente o valor de `ordem` como o maior `ordem` já existente na categoria de destino + 1 (item sempre entra como o último da categoria).
- **FR-005**: O sistema DEVE permitir editar todos os campos de um item existente (nome, preço, descrição, categoria) via formulário pré-preenchido.
- **FR-006**: O sistema DEVE permitir alternar a disponibilidade de um item (disponível/pausado) sem excluí-lo, com atualização otimista na interface.
- **FR-007**: O sistema DEVE permitir excluir um item permanentemente, mediante confirmação explícita do dono.
- **FR-008**: O sistema DEVE restringir toda operação de criação, leitura, edição, exclusão e alternância de disponibilidade ao restaurante da sessão autenticada — nenhum restaurante acessa ou modifica itens de outro.
- **FR-009**: O sistema DEVE validar no servidor todos os campos obrigatórios e seus formatos antes de qualquer operação no banco, independentemente da validação no cliente.
- **FR-010**: A página de itens DEVE tratar os três estados obrigatórios: carregando (skeleton), erro (mensagem + retry) e vazio (CTA).
- **FR-011**: O sistema DEVE armazenar o preço como valor decimal com precisão de 2 casas para evitar erros de arredondamento.
- **FR-012**: O sistema DEVE preparar o modelo de dados do item para suportar uma foto (campo opcional), ainda que o mecanismo de upload de imagem não seja implementado nesta etapa.
- **FR-013**: O sistema DEVE permitir marcar um item como "destaque", sinalizando que ele deve ser promovido no cardápio público.

### Key Entities

- **Item**: Prato ou produto do cardápio. Atributos: `id`, `nome` (string, obrigatório, máx. 80 chars), `preco` (decimal, obrigatório, positivo), `descricao` (string, opcional, máx. 500 chars), `fotoUrl` (string, opcional, sem mecanismo de upload nesta etapa), `disponivel` (booleano, default verdadeiro), `destaque` (booleano, default falso), `ordem` (inteiro, posição dentro da categoria), `categoriaId` (FK, obrigatório). Relacionamentos: pertence a uma Categoria.
- **Categoria**: Agrupamento ao qual o item pertence; já existe na feature de Gestão de Categorias.
- **Restaurante**: Entidade dona, via Categoria, dos itens. Identificado pelo contexto da sessão autenticada.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O dono consegue cadastrar seu primeiro item em menos de 90 segundos a partir do estado vazio.
- **SC-002**: O dono consegue pausar ou reativar a disponibilidade de um item em uma única ação, com feedback visual em menos de 1 segundo (otimista).
- **SC-003**: 100% das tentativas de criar ou editar item com nome ou preço ausente são bloqueadas com mensagem explicativa.
- **SC-004**: Zero vazamentos de dados entre restaurantes — nenhuma operação retorna ou modifica itens de outro restaurante.
- **SC-005**: A listagem de itens carrega e exibe os dados agrupados por categoria em menos de 2 segundos em conexão 4G padrão.
- **SC-006**: 100% dos preços salvos são exibidos com exatamente 2 casas decimais, sem erros de arredondamento perceptíveis ao usuário.

---

## Assumptions

- O modelo `Item` já existe no esquema Prisma como stub (`id`, `categoriaId`) e será estendido nesta etapa com os campos `nome`, `preco`, `descricao`, `fotoUrl`, `disponivel`, `destaque` e `ordem`; a migration faz parte do escopo desta feature.
- A sessão autenticada já fornece `restauranteId` de forma confiável (Etapa 2); a verificação de ownership de Item é feita transitivamente via a Categoria do item, estendendo `verificarOwnership()` em `lib/auth/ownership.ts`.
- O upload real de foto está fora do escopo desta etapa — o campo `fotoUrl` existe no modelo de dados, mas não há UI de upload nem armazenamento de arquivo nesta fase.
- Nomes de itens não precisam ser únicos dentro de uma categoria ou restaurante.
- A criação de item exige que ao menos uma categoria já exista; não há fluxo de criação de categoria embutido no formulário de item nesta etapa.
- A página de itens vive dentro do dashboard shell implementado na Etapa 4, em `/dashboard/cardapio`.
- Uma interface de arrastar-e-soltar para reordenar itens dentro de uma categoria não está incluída no escopo desta etapa (pode ser adicionada em iteração futura, seguindo o padrão já usado para categorias); o valor de `ordem` é atribuído automaticamente na criação/mudança de categoria (ver FR-004a).
- Itens marcados como "pausado" (`disponivel = false`) continuam visíveis no cardápio público, exibidos com uma indicação visual de indisponibilidade (ex: esmaecido, badge "Indisponível"), em vez de serem ocultados — mantendo transparência sobre o cardápio completo do restaurante.
