# Feature Specification: Cardápio Público

**Feature Branch**: `008-cardapio-publico`

**Created**: 2026-06-18

**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visualizar o cardápio escaneando o QR code (Priority: P1)

Um cliente está sentado à mesa de um restaurante, escaneia o QR code (ou recebe o link) e cai direto na página do cardápio, sem precisar fazer login ou instalar nada. Ele vê o nome e a logo do restaurante, as categorias de pratos e, dentro de cada categoria, os itens disponíveis com foto, nome, descrição e preço.

**Why this priority**: É o produto em si — a tela que justifica a existência de todas as outras etapas. Sem ela, não há valor entregue ao cliente final nem ao restaurante.

**Independent Test**: Com um restaurante ativo, com categorias e itens disponíveis cadastrados, acessar `/menu/[slug]` em um navegador sem sessão autenticada e confirmar que o cardápio completo é exibido.

**Acceptance Scenarios**:

1. **Given** um restaurante ativo com categorias e itens disponíveis, **When** um visitante (sem login) acessa `/menu/[slug]`, **Then** a página exibe header com logo e nome do restaurante, seguido pelas categorias e seus itens.
2. **Given** um item tem `disponivel: false`, **When** a página carrega, **Then** esse item não aparece em nenhuma parte da página.
3. **Given** uma categoria não possui nenhum item disponível, **When** a página carrega, **Then** essa categoria não é exibida (nem no conteúdo, nem na navegação).
4. **Given** um item possui foto cadastrada, **When** o card do item é exibido, **Then** a foto é mostrada otimizada para o viewport do celular.
5. **Given** um item não possui foto cadastrada, **When** o card do item é exibido, **Then** um placeholder visual ocupa o espaço da foto, sem quebrar o layout do card.
6. **Given** o restaurante não possui logo cadastrada, **When** o header é exibido, **Then** apenas o nome do restaurante aparece, sem ícone de imagem quebrada.

---

### User Story 2 — Acessar link inválido ou restaurante inativo (Priority: P1)

Um link de cardápio quebrado é compartilhado, ou um restaurante cancela o plano e seu cardápio deixa de estar no ar. O visitante que acessa esse link precisa ver uma página de "não encontrado" clara, em vez de um erro técnico ou uma página em branco.

**Why this priority**: Protege a experiência do cliente final e evita expor dados de restaurantes inativos; é tratamento de erro essencial para uma página pública sem autenticação.

**Independent Test**: Acessar `/menu/slug-que-nao-existe` e `/menu/[slug-de-restaurante-inativo]` e confirmar que ambos retornam a página 404 do site.

**Acceptance Scenarios**:

1. **Given** o slug informado não corresponde a nenhum restaurante cadastrado, **When** o visitante acessa `/menu/[slug]`, **Then** o sistema exibe a página 404.
2. **Given** o slug corresponde a um restaurante com `ativo: false`, **When** o visitante acessa `/menu/[slug]`, **Then** o sistema exibe a página 404 (sem revelar que o restaurante existe, mas está inativo).

---

### User Story 3 — Navegar entre categorias pelo menu de âncoras (Priority: P2)

O cardápio tem várias categorias (entradas, pratos principais, bebidas, etc.) e o cliente quer ir direto para a seção que interessa, sem precisar rolar a página inteira.

**Why this priority**: Melhora a usabilidade em cardápios extensos, mas o cardápio já entrega valor (US1) mesmo que o cliente role manualmente até a seção desejada.

**Independent Test**: Com um restaurante que tem três ou mais categorias visíveis, acessar `/menu/[slug]`, tocar em um item do menu de navegação e confirmar que a página rola até a seção correspondente.

**Acceptance Scenarios**:

1. **Given** o cardápio tem duas ou mais categorias visíveis, **When** a página carrega, **Then** um menu de navegação lista um link de âncora para cada categoria visível, na mesma ordem em que aparecem no conteúdo.
2. **Given** o menu de navegação está visível, **When** o cliente toca em um link de categoria, **Then** a página rola até a seção correspondente.
3. **Given** o cardápio tem muitas categorias e a tela é estreita (mobile), **When** o menu de navegação é exibido, **Then** os links quebram em múltiplas linhas em vez de gerar rolagem horizontal.

---

### User Story 4 — Reconhecer a identidade visual do restaurante (Priority: P3)

Cada restaurante tem sua própria cor de marca cadastrada no painel. Ao abrir o cardápio, o cliente deve sentir que está na "casa" daquele restaurante, não em um template genérico.

**Why this priority**: Reforça a percepção de qualidade e identidade de marca, mas o cardápio funciona plenamente (informar pratos e preços) mesmo com uma cor padrão.

**Independent Test**: Cadastrar uma `corPrimaria` customizada em um restaurante, acessar `/menu/[slug]` e confirmar visualmente que a cor aparece no header e em elementos de destaque.

**Acceptance Scenarios**:

1. **Given** o restaurante tem uma `corPrimaria` cadastrada, **When** a página carrega, **Then** essa cor é aplicada no header e em elementos de destaque (ex: links ativos da navegação, bordas de destaque).
2. **Given** o restaurante não alterou a cor padrão, **When** a página carrega, **Then** a cor padrão definida no cadastro do restaurante é aplicada normalmente (sem necessidade de tratamento especial).

---

### Edge Cases

- O restaurante está ativo mas não tem nenhuma categoria cadastrada, ou todas as categorias estão sem itens disponíveis: a página exibe um estado vazio amigável em vez de uma área em branco.
- Um item tem nome ou descrição muito longos: o layout do card acomoda o texto sem quebrar o alinhamento com os demais cards (quebra de linha, sem corte abrupto).
- O slug contém caracteres que não correspondem ao formato gerado por `gerarSlugUnico()`: tratado como slug inexistente, retorna 404.
- O restaurante não tem `descricao` cadastrada: a página não exibe a seção/meta de descrição vazia, apenas omite o campo.
- O preço de um item tem casas decimais: é exibido formatado como moeda (R$) com exatamente 2 casas decimais.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE expor a página do cardápio em `/menu/[slug]`, acessível sem autenticação.
- **FR-002**: A página DEVE ser renderizada no servidor (SSR), com todo o conteúdo do cardápio presente no HTML inicial, sem depender de JavaScript no cliente para exibir o conteúdo.
- **FR-003**: O sistema DEVE buscar o restaurante pelo slug e retornar a página 404 quando o slug não corresponder a nenhum restaurante cadastrado ou quando o restaurante encontrado tiver `ativo: false`.
- **FR-004**: O sistema DEVE exibir um header com a logo do restaurante (quando cadastrada) e o nome do restaurante, estilizado com a `corPrimaria` cadastrada.
- **FR-005**: O sistema DEVE exibir as categorias do restaurante ordenadas por `ordem`, ocultando completamente qualquer categoria que não tenha nenhum item disponível.
- **FR-006**: O sistema DEVE exibir, dentro de cada categoria visível, somente os itens com `disponivel: true`, ordenados por `ordem` — itens pausados NUNCA aparecem na página pública.
- **FR-007**: Cada item exibido DEVE mostrar foto (ou um placeholder quando não houver `fotoUrl`), nome, descrição (quando houver) e preço formatado como moeda.
- **FR-008**: O sistema DEVE fornecer uma navegação por âncoras que lista um link para cada categoria visível, permitindo ao visitante saltar diretamente para a seção correspondente.
- **FR-009**: A navegação por categorias DEVE permanecer utilizável em telas estreitas sem recorrer a rolagem horizontal, quebrando os links em múltiplas linhas quando necessário.
- **FR-010**: O sistema DEVE exibir um estado vazio amigável quando o restaurante não tiver nenhuma categoria com itens disponíveis para mostrar.
- **FR-011**: A página DEVE definir título e meta descrição com base nos dados do restaurante, para fins de indexação em mecanismos de busca.
- **FR-012**: As imagens de logo e dos itens DEVEM ser otimizadas para carregamento rápido em conexões móveis (tamanhos responsivos ao viewport).
- **FR-013**: O layout da página DEVE ser mobile-first e totalmente responsivo, com áreas de toque adequadas para os links de navegação.

### Key Entities

- **Restaurante**: Entidade já existente (`slug`, `nome`, `descricao`, `corPrimaria`, `logoUrl`, `ativo`). Esta etapa apenas consome os dados, sem alterar o modelo.
- **Categoria**: Entidade já existente (`nome`, `ordem`), agrupa os itens exibidos. Esta etapa apenas consome os dados.
- **Item**: Entidade já existente (`nome`, `preco`, `descricao`, `fotoUrl`, `disponivel`, `ordem`). Esta etapa filtra por `disponivel: true` e apenas consome os dados, sem alterá-los.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um visitante sem login consegue visualizar o cardápio completo de um restaurante ativo a partir do link, sem nenhuma etapa de autenticação.
- **SC-002**: 100% dos itens com `disponivel: false` ficam ausentes do HTML renderizado da página pública.
- **SC-003**: 100% dos acessos a slugs inexistentes ou restaurantes inativos resultam na página 404, nunca em erro técnico ou página em branco.
- **SC-004**: O cliente consegue chegar à seção de qualquer categoria visível com um único toque, a partir do menu de navegação.
- **SC-005**: O conteúdo do cardápio (nomes, descrições, preços) está presente no HTML retornado pelo servidor antes de qualquer execução de JavaScript no cliente.
- **SC-006**: A cor de marca cadastrada pelo restaurante é visivelmente aplicada no header e em elementos de destaque em 100% dos cardápios visualizados.

---

## Assumptions

- Esta etapa filtra integralmente os itens com `disponivel: false` do cardápio público — substitui a hipótese registrada na Etapa 6 (item-management), que previa exibir itens pausados de forma esmaecida; aqui a instrução explícita do produto é ocultá-los por completo.
- Categorias que ficam sem nenhum item disponível (por terem todos os itens pausados, ou por não terem itens cadastrados) são ocultadas inteiramente — tanto da navegação por âncoras quanto do conteúdo da página.
- O cardápio público é somente leitura: não há carrinho, pedido ou qualquer interação de compra nesta etapa (fora do escopo do MVP).
- A correspondência de slug é exata (case-sensitive, conforme já normalizado por `gerarSlugUnico()` na criação do restaurante); não há fallback de busca aproximada.
- Não há paginação: todas as categorias e itens disponíveis do restaurante são renderizados em uma única página, navegável por âncoras.
- Restaurantes sem `descricao` simplesmente omitem essa informação na página e nos metadados, sem texto de preenchimento.
