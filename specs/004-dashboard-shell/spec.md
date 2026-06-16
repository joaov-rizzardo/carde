# Feature Specification: Dashboard Shell

**Feature Branch**: `004-dashboard-shell`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "Etapa 3 — Dashboard (shell): Layout base do painel administrativo com sidebar fixa no desktop, bottom navigation no mobile, header com nome do restaurante e logout, e página /dashboard com estado vazio."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar pelo painel no desktop (Priority: P1)

O dono do restaurante, já autenticado, acessa o painel administrativo no computador e vê uma sidebar fixa à esquerda com as opções de navegação (Cardápio, Categorias, Configurações), um header com o nome do seu restaurante e um menu de usuário. A área central exibe o conteúdo da seção atual.

**Why this priority**: É o container que todas as features futuras (Etapas 4–8) precisam — sem ele, nenhuma seção do admin pode ser construída.

**Independent Test**: Acessar `/dashboard` após login e verificar que sidebar, header e área de conteúdo estão visíveis e funcionais.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado, **When** acessa `/dashboard`, **Then** vê a sidebar com três itens de navegação (Cardápio, Categorias, Configurações), o header com o nome do restaurante cadastrado e a área de conteúdo central com o estado vazio do dashboard.
2. **Given** o usuário está na sidebar, **When** clica em "Categorias", **Then** é navegado para a seção correspondente sem recarregar a página, e o item "Categorias" fica destacado como ativo na sidebar.
3. **Given** o usuário não está autenticado, **When** tenta acessar `/dashboard`, **Then** é redirecionado para a página de login.

---

### User Story 2 - Navegar pelo painel no mobile (Priority: P2)

O dono do restaurante acessa o painel no celular e vê uma barra de navegação fixa na parte inferior da tela (bottom navigation) com os mesmos itens de navegação disponíveis no desktop. O header exibe o nome do restaurante. A área de conteúdo ocupa toda a largura da tela acima da barra de navegação.

**Why this priority**: A maioria dos donos de pequenos restaurantes gerencia o negócio pelo celular. O painel precisa ser plenamente funcional no mobile desde o primeiro dia.

**Independent Test**: Acessar `/dashboard` em viewport mobile (< 768px) e verificar que a bottom navigation é exibida (sem sidebar), a navegação funciona e não há scroll horizontal.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado e acessa o painel em viewport mobile, **When** a página carrega, **Then** a bottom navigation aparece fixada na base da tela com os três itens (Cardápio, Categorias, Configurações) e nenhuma sidebar lateral é exibida.
2. **Given** o usuário está na bottom navigation, **When** toca em qualquer item de navegação, **Then** a área de conteúdo muda para a seção correspondente e o ícone do item tocado fica destacado como ativo.
3. **Given** o usuário está no painel mobile, **When** rola o conteúdo da página, **Then** a bottom navigation permanece fixada na base e não há scroll horizontal em nenhum momento.

---

### User Story 3 - Fazer logout pelo menu do usuário (Priority: P2)

O dono do restaurante, após encerrar seu trabalho, acessa o menu do usuário no header e faz logout com um clique. É redirecionado para a página de login.

**Why this priority**: Gestão de sessão precisa funcionar antes de haver dados sensíveis no painel.

**Independent Test**: Clicar no menu do usuário no header, selecionar "Sair" e verificar redirecionamento para login com sessão encerrada.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado no painel, **When** clica no menu do usuário no header e seleciona "Sair", **Then** a sessão é encerrada e o usuário é redirecionado para a página de login.
2. **Given** o usuário fez logout, **When** tenta acessar `/dashboard` diretamente pela URL, **Then** é redirecionado para o login sem acessar o conteúdo protegido.

---

### User Story 4 - Visualizar estado de loading durante transições (Priority: P3)

Ao navegar entre seções do painel, o usuário vê um estado de loading que indica que o conteúdo está sendo carregado, evitando a sensação de tela travada.

**Why this priority**: Melhora a percepção de responsividade, especialmente em conexões móveis lentas.

**Independent Test**: Navegar entre seções e verificar que um indicador de loading é exibido antes do conteúdo aparecer.

**Acceptance Scenarios**:

1. **Given** o usuário clica em um item de navegação, **When** o conteúdo da próxima seção ainda está sendo carregado, **Then** um skeleton ou indicador de loading é exibido na área de conteúdo.
2. **Given** o conteúdo foi carregado, **When** o carregamento é concluído, **Then** o skeleton é substituído pelo conteúdo sem flash visual abrupto.

---

### Edge Cases

- O que acontece se o nome do restaurante não estiver disponível ainda (onboarding incompleto)? → Exibir "Meu Restaurante" como placeholder.
- O que acontece se a sessão expirar enquanto o usuário está no painel? → Redirecionar para login na próxima navegação ou ação.
- O que acontece se o usuário tentar acessar uma rota do dashboard que ainda não existe (Etapas 4–8 não implementadas)? → Exibir a página de placeholder da seção correspondente.
- Como o item de navegação ativo é determinado quando a URL é uma sub-rota (ex: `/dashboard/cardapio/novo`)? → O item pai ("Cardápio") deve permanecer destacado como ativo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O layout do painel DEVE exibir uma sidebar fixa à esquerda em viewports desktop (≥ 768px) com os itens de navegação: Cardápio, Categorias e Configurações.
- **FR-002**: O layout do painel DEVE exibir uma bottom navigation fixa na base da tela em viewports mobile (< 768px), substituindo completamente a sidebar lateral.
- **FR-003**: O header DEVE exibir o nome do restaurante do usuário autenticado e um menu de usuário com a opção de logout.
- **FR-004**: O item de navegação correspondente à seção atual DEVE ser visualmente destacado como ativo, incluindo em sub-rotas da seção.
- **FR-005**: A ação de logout DEVE encerrar a sessão do usuário e redirecioná-lo para a página de login.
- **FR-006**: Usuários não autenticados que tentarem acessar qualquer rota sob `/dashboard` DEVEM ser redirecionados para a página de login.
- **FR-007**: A página `/dashboard` DEVE exibir um estado vazio com texto explicativo e placeholder enquanto as seções ainda não estão implementadas.
- **FR-008**: O layout DEVE exibir um estado de loading (skeleton) na área de conteúdo durante transições de navegação entre seções.
- **FR-009**: O layout NÃO DEVE apresentar scroll horizontal em nenhum viewport.
- **FR-010**: Todos os elementos interativos da navegação (sidebar, bottom nav, menu de usuário) DEVEM ter área mínima de toque de 44×44px.

### Key Entities

- **Sessão do Usuário**: Informações do usuário autenticado, incluindo o nome do restaurante vinculado à conta, usadas para personalizar o header.
- **Item de Navegação**: Rota de destino, rótulo exibido, ícone e estado ativo — compartilhado entre sidebar (desktop) e bottom navigation (mobile).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O painel carrega e exibe o layout completo (header + navegação + área de conteúdo) em menos de 2 segundos em conexão 4G simulada.
- **SC-002**: A navegação entre seções não apresenta scroll horizontal em nenhuma das dimensões de viewport testadas: 320px, 375px, 768px, 1280px de largura.
- **SC-003**: O fluxo de logout é concluído em menos de 3 cliques a partir de qualquer seção do painel.
- **SC-004**: 100% das rotas sob `/dashboard` redirecionam usuários não autenticados para o login, sem expor qualquer conteúdo protegido.
- **SC-005**: O estado de loading é exibido em 100% das transições de navegação que demoram mais de 200ms.

## Assumptions

- O sistema de autenticação (Etapa 2) já está implementado e disponível; o layout reutiliza a sessão existente para obter o nome do restaurante.
- As seções Cardápio, Categorias e Configurações são implementadas nas Etapas 4–6; nesta etapa, as rotas correspondentes exibem apenas um estado de placeholder.
- A sidebar no desktop é sempre visível (fixa) — não há opção de recolher ou ocultar a sidebar em desktop.
- O mobile usa exclusivamente bottom navigation (conforme constituição do projeto) — sidebar colapsável não é uma opção de design.
- Ícones das seções de navegação seguem a biblioteca de ícones já usada no projeto (Lucide React).
- A identidade visual segue os tokens de cor definidos na constituição: `brand-primary` (#1A1A2E) para elementos de UI do admin, `brand-accent` (#E85D04) para o item ativo.
