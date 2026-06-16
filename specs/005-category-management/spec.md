# Feature Specification: Gestão de Categorias do Cardápio

**Feature Branch**: `005-category-management`

**Created**: 2026-06-15

**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Criar primeira categoria (Priority: P1)

O dono do restaurante acabou de concluir o onboarding e quer começar a montar o cardápio. Ele acessa a seção de categorias, vê um estado vazio com uma mensagem explicativa e um botão de ação. Ao clicar no CTA, um modal abre; ele digita o nome da categoria (ex: "Entradas") e confirma. A categoria aparece imediatamente na listagem.

**Why this priority**: Sem ao menos uma categoria criada, o dono não pode criar nenhum item do cardápio. É o desbloqueador de todo o fluxo subsequente.

**Independent Test**: Acessa `/dashboard/categorias` sem nenhuma categoria cadastrada, clica no CTA do estado vazio, preenche o modal e salva — a categoria aparece na lista.

**Acceptance Scenarios**:

1. **Given** o dono está em `/dashboard/categorias` e não há categorias cadastradas, **When** a página carrega, **Then** exibe estado vazio com texto "Nenhuma categoria ainda" e botão "Criar categoria".
2. **Given** o estado vazio está visível, **When** o dono clica em "Criar categoria", **Then** um modal abre com campo de nome e botão de salvar.
3. **Given** o modal está aberto com nome válido preenchido, **When** o dono clica em "Salvar", **Then** o modal fecha, a categoria aparece na lista e uma mensagem de confirmação é exibida.
4. **Given** o modal está aberto, **When** o dono submete o formulário com nome vazio, **Then** o sistema exibe erro de validação inline e não fecha o modal.

---

### User Story 2 — Listar e reordenar categorias (Priority: P2)

O dono quer organizar a apresentação do cardápio. Ele vê todas as suas categorias listadas e pode arrastar para reordená-las. A ordem que ele definir é a mesma que o cliente final verá no cardápio público.

**Why this priority**: A ordem das categorias impacta diretamente a experiência do cliente no cardápio público. É um diferencial de qualidade que o dono precisa controlar.

**Independent Test**: Com duas ou mais categorias cadastradas, o dono pode arrastar e soltar para mudar a ordem — ao recarregar a página, a nova ordem persiste.

**Acceptance Scenarios**:

1. **Given** existem duas ou mais categorias, **When** a página carrega, **Then** as categorias são exibidas na ordem salva, com alças de arrastar visíveis.
2. **Given** a lista está visível, **When** o dono arrasta uma categoria para outra posição, **Then** a lista reordena visualmente em tempo real.
3. **Given** o dono soltou a categoria na nova posição, **When** a operação é confirmada, **Then** a nova ordem é persistida e sobrevive a um refresh da página.
4. **Given** a nova ordem foi salva, **When** um cliente acessa o cardápio público, **Then** as categorias aparecem na mesma ordem definida pelo dono.

---

### User Story 3 — Editar nome de uma categoria (Priority: P2)

O dono percebe que errou o nome de uma categoria e quer corrigir. Ele clica no botão de editar ao lado da categoria, o modal abre preenchido com o nome atual, ele altera e salva.

**Why this priority**: Erros de digitação são comuns; editar sem excluir e recriar preserva os itens já vinculados à categoria.

**Independent Test**: Com ao menos uma categoria criada, o dono clica em editar, muda o nome e salva — a lista exibe o nome atualizado sem perder os itens.

**Acceptance Scenarios**:

1. **Given** existe ao menos uma categoria, **When** o dono clica no botão de editar, **Then** o modal abre com o nome atual pré-preenchido.
2. **Given** o modal de edição está aberto, **When** o dono altera o nome e clica em "Salvar", **Then** o modal fecha e a lista exibe o nome atualizado.
3. **Given** o dono altera o nome para uma string vazia, **When** tenta salvar, **Then** o sistema exibe erro de validação e não fecha o modal.

---

### User Story 4 — Excluir categoria vazia (Priority: P3)

O dono criou uma categoria de teste e quer removê-la. Ele clica no botão de excluir, confirma a ação em um diálogo e a categoria desaparece da lista.

**Why this priority**: Limpeza de dados é necessária, mas a proteção contra exclusão de categorias com itens é o requisito mais crítico neste fluxo.

**Independent Test**: Com uma categoria sem itens, o dono pode excluí-la — após confirmação, ela não aparece mais na lista e o estado vazio retorna se for a última.

**Acceptance Scenarios**:

1. **Given** existe uma categoria sem itens, **When** o dono clica em "Excluir", **Then** um diálogo de confirmação é exibido antes de qualquer ação destrutiva.
2. **Given** o diálogo de confirmação está visível, **When** o dono confirma a exclusão, **Then** a categoria é removida da lista e, se for a última, o estado vazio é exibido.
3. **Given** o diálogo de confirmação está visível, **When** o dono cancela, **Then** nada é alterado.
4. **Given** a categoria tem um ou mais itens vinculados, **When** o dono tenta excluir, **Then** o sistema bloqueia a operação e exibe mensagem "Esta categoria possui itens e não pode ser excluída".

---

### Edge Cases

- O que acontece se o dono tentar criar duas categorias com o mesmo nome? O sistema permite (nomes não são únicos dentro de um restaurante), pois categorias com nomes iguais são válidas (ex: dois "Combos").
- O que acontece se a conexão cair durante um reordenamento? A UI mantém a ordem visual e exibe um erro com botão de tentar novamente; a ordem persistida no servidor não muda.
- O que acontece se outro tab aberto pelo mesmo dono criar uma categoria enquanto ele está reordenando em outro tab? A reordenação sobrescreve apenas as posições relativas das categorias que o dono acabou de mover — last-write-wins por simplicidade no MVP.
- O que acontece se o restaurante do dono não for encontrado na sessão? A API retorna 401 e o sistema redireciona para login.
- O que acontece se um restaurante tentar acessar categorias de outro restaurante diretamente pela API? A verificação de ownership bloqueia e retorna 403.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir estado vazio com CTA quando o restaurante não possui categorias cadastradas.
- **FR-002**: O sistema DEVE permitir criar uma categoria fornecendo apenas o nome (campo obrigatório, máximo 80 caracteres).
- **FR-003**: O sistema DEVE exibir todas as categorias do restaurante autenticado em ordem definida pelo dono.
- **FR-004**: O sistema DEVE permitir editar o nome de uma categoria existente via modal pré-preenchido.
- **FR-005**: O sistema DEVE permitir reordenar categorias por arrastar-e-soltar, persistindo a nova ordem.
- **FR-006**: O sistema DEVE permitir excluir uma categoria somente se ela não possuir itens vinculados.
- **FR-007**: O sistema DEVE bloquear a exclusão de categorias com itens e exibir mensagem explicativa ao dono.
- **FR-008**: O sistema DEVE exigir confirmação do dono antes de executar qualquer exclusão.
- **FR-009**: Toda operação de criação, edição, exclusão e reordenamento DEVE ser restrita ao restaurante da sessão autenticada — nenhum restaurante acessa dados de outro.
- **FR-010**: O sistema DEVE validar o corpo de todas as requisições de API antes de qualquer operação no banco.
- **FR-011**: A página de categorias DEVE tratar os três estados obrigatórios: carregando (skeleton), erro (mensagem + retry) e vazio (CTA).

### Key Entities

- **Categoria**: Agrupamento de itens do cardápio. Atributos: `id`, `nome` (string, obrigatório, máx 80 chars), `ordem` (inteiro, define a posição na listagem), `restauranteId` (FK, obrigatório). Relacionamentos: pertence a um Restaurante; possui zero ou mais Itens.
- **Restaurante**: Entidade dona das categorias. Identificado pelo contexto da sessão autenticada.
- **Item**: Entidade que pertence a uma Categoria. A existência de ao menos um Item vinculado bloqueia a exclusão da Categoria.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O dono consegue criar sua primeira categoria em menos de 60 segundos a partir do estado vazio.
- **SC-002**: A nova ordem de categorias após um reordenamento é visível no cardápio público em menos de 5 segundos.
- **SC-003**: 100% das tentativas de excluir categoria com itens são bloqueadas com mensagem explicativa — zero exclusões acidentais de categorias não vazias.
- **SC-004**: Zero vazamentos de dados entre restaurantes — nenhuma operação retorna ou modifica categorias de outro restaurante.
- **SC-005**: A listagem de categorias carrega e exibe os dados em menos de 2 segundos em conexão 4G padrão.

---

## Assumptions

- O modelo `Categoria` já existe (ou será criado) no esquema Prisma com os campos `id`, `nome`, `ordem` e `restauranteId`; a migration faz parte do escopo desta feature.
- A sessão autenticada já fornece `restauranteId` de forma confiável — o sistema de autenticação (next-auth v4) está funcionando conforme implementado na Etapa 2.
- A função `verificarOwnership()` centralizada em `lib/auth/ownership.ts` está disponível e será estendida para cobrir o recurso Categoria.
- Nomes de categorias não precisam ser únicos dentro de um restaurante — o restaurante pode ter duas categorias com o mesmo nome.
- O drag-and-drop de reordenamento usa a biblioteca já adotada no projeto (ou `@dnd-kit/core` como padrão, que é leve e acessível); não será implementada uma solução customizada.
- Upload de imagem para categorias está fora do escopo desta etapa — categorias têm apenas nome e ordem no MVP.
- A página de categorias vive dentro do dashboard shell implementado na Etapa 4 (`/dashboard/categorias`).
