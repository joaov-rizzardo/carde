# Feature Specification: Autenticação do Dono

**Feature Branch**: `002-autenticacao`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "# Etapa 1 — Autenticação — Sistema de criação de conta e login para o dono do restaurante, porta de entrada para todo o dashboard."

## Clarifications

### Session 2026-06-14

- Q: Qual(is) método(s) de autenticação sem senha devem ser suportados? → A: Ambos — magic link por e-mail E login social via Google OAuth disponíveis na mesma página `/login`.
- Q: O que acontece quando o usuário tenta entrar com Google usando e-mail diferente do cadastrado diretamente? → A: Contas separadas — cada e-mail cria/acessa sua própria conta independente; não há vinculação de contas.
- Q: O que acontece se o usuário desativar cookies no navegador? → A: Exibir mensagem de erro clara em `/login` informando que cookies precisam estar habilitados para usar o sistema.
- Q: O que acontece se o dono acessa `/login` com sessão ativa em outro dispositivo? → A: Múltiplas sessões simultâneas são permitidas — nenhuma sessão anterior é invalidada.
- Q: A coleta de nome e e-mail em `/cadastro` requer consentimento explícito (LGPD)? → A: Sim — checkbox obrigatório "Aceito os Termos de Uso e a Política de Privacidade" com link para os documentos, antes de submeter o formulário.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login Sem Senha (Priority: P1)

Um dono de restaurante acessa a página `/login`, informa seu e-mail ou utiliza autenticação social, e obtém acesso ao dashboard sem precisar criar ou memorizar uma senha.

**Why this priority**: Sem autenticação funcional nenhuma outra feature do dashboard pode ser acessada. É o bloqueio fundamental de todas as demais histórias.

**Independent Test**: Pode ser testado completamente acessando `/login`, autenticando com e-mail ou conta social, e verificando o redirecionamento para `/dashboard` com sessão ativa.

**Acceptance Scenarios**:

1. **Given** o dono está em `/login` sem sessão ativa, **When** informa seu e-mail cadastrado e confirma o acesso, **Then** é redirecionado para `/dashboard` com sessão ativa estabelecida.
2. **Given** o dono está em `/login`, **When** utiliza autenticação social (ex: Google), **Then** é redirecionado para `/dashboard` com sessão ativa após autorizar o acesso.
3. **Given** o dono já possui sessão ativa, **When** acessa `/login`, **Then** é redirecionado diretamente para `/dashboard` sem reautenticação.

---

### User Story 2 - Criação de Conta (Priority: P2)

Um novo dono de restaurante acessa `/cadastro`, informa nome e e-mail, e cria sua conta acessando o dashboard sem definir senha.

**Why this priority**: Sem cadastro, novos donos não conseguem acessar o sistema. O fluxo aproveita o mesmo mecanismo de autenticação do login, sendo complementar à P1.

**Independent Test**: Pode ser testado acessando `/cadastro`, preenchendo nome e e-mail válidos, e verificando criação de conta e redirecionamento para `/dashboard` autenticado.

**Acceptance Scenarios**:

1. **Given** um novo usuário acessa `/cadastro`, **When** preenche nome e e-mail válido, marca o checkbox de consentimento e confirma, **Then** sua conta é criada e ele é redirecionado para `/dashboard` já autenticado.
2. **Given** um usuário tenta cadastrar com e-mail já existente, **When** confirma o formulário, **Then** é informado que a conta já existe e guiado para o login — sem criar conta duplicada.
3. **Given** um usuário preenche campos obrigatórios incompletos ou com formato inválido, **When** tenta confirmar, **Then** recebe mensagem de erro clara por campo sem perder os dados já digitados.

---

### User Story 3 - Proteção de Rotas (Priority: P3)

Um usuário sem sessão ativa tenta acessar qualquer rota protegida do dashboard e é bloqueado e redirecionado automaticamente para `/login`.

**Why this priority**: Garante que nenhum conteúdo de dono de restaurante seja acessível sem identificação. Dependência das P1 e P2, mas essencial para segurança do sistema.

**Independent Test**: Pode ser testado acessando `/dashboard` diretamente sem sessão ativa e verificando redirecionamento para `/login` sem carga de conteúdo protegido.

**Acceptance Scenarios**:

1. **Given** um usuário sem sessão ativa, **When** acessa qualquer rota sob `/dashboard`, **Then** é redirecionado para `/login` imediatamente, sem que o conteúdo protegido seja carregado ou exposto.
2. **Given** um usuário autenticado cuja sessão expirou, **When** tenta navegar para uma rota protegida, **Then** é redirecionado para `/login`.

---

### User Story 4 - Persistência de Sessão (Priority: P4)

Um dono autenticado fecha e reabre o navegador ou recarrega a página e permanece autenticado, sem precisar fazer login novamente.

**Why this priority**: Melhora significativamente a experiência no mobile, onde o sistema pode encerrar o navegador. Depende da P1 e é complementar à P3.

**Independent Test**: Pode ser testado autenticando, fechando e reabrindo o navegador no mesmo dispositivo, e verificando que o acesso ao dashboard é mantido sem redirecionamento para login.

**Acceptance Scenarios**:

1. **Given** um dono autenticado, **When** recarrega qualquer página do dashboard, **Then** permanece autenticado e vê o conteúdo sem redirecionamento para login.
2. **Given** um dono autenticado, **When** fecha e reabre o navegador no mesmo dispositivo dentro do período de validade da sessão, **Then** sua sessão é restaurada automaticamente.

---

### Edge Cases

- O que acontece se o e-mail informado no cadastro contiver espaços ou letras maiúsculas? (deve ser normalizado antes de salvar)
- O que acontece se o usuário tentar se cadastrar usando autenticação social com e-mail diferente do já cadastrado via e-mail direto? → Cada e-mail é uma conta independente; não há vinculação de contas no MVP.
- O que acontece se o usuário desativar cookies no navegador? → Exibir mensagem de erro clara em `/login` orientando o usuário a habilitar cookies; nenhuma tentativa de contornar a limitação.
- O que acontece se o dono acessa `/login` com sessão ativa em outro dispositivo? → Múltiplas sessões simultâneas são permitidas; nenhuma sessão anterior é revogada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer autenticação sem senha via magic link por e-mail E login social via Google OAuth — ambas as opções disponíveis na mesma página `/login`, sem preferência de fluxo forçada ao usuário
- **FR-002**: O sistema DEVE fornecer a página `/login` com formulário de autenticação acessível
- **FR-003**: O sistema DEVE fornecer a página `/cadastro` com formulário de criação de conta contendo campos de nome e e-mail
- **FR-004**: O sistema DEVE redirecionar o usuário autenticado para `/dashboard` após login ou cadastro bem-sucedidos
- **FR-005**: O sistema DEVE bloquear o acesso a todas as rotas protegidas para usuários sem sessão ativa, redirecionando para `/login`
- **FR-006**: A proteção de rotas DEVE operar em nível de middleware, não nas páginas individualmente
- **FR-007**: O sistema DEVE manter a sessão ativa entre recarregamentos de página e fechamento/reabertura do navegador
- **FR-008**: O sistema DEVE redirecionar usuários já autenticados que acessam `/login` ou `/cadastro` diretamente para `/dashboard`
- **FR-009**: O sistema DEVE validar o formato de e-mail antes de prosseguir com qualquer fluxo de autenticação
- **FR-010**: O sistema DEVE normalizar e-mails (minúsculas, sem espaços extras) antes de processar e armazenar
- **FR-011**: O sistema DEVE informar o usuário de forma clara quando o e-mail já estiver cadastrado, com direcionamento para o fluxo de login
- **FR-012**: O sistema DEVE apresentar mensagens de erro específicas por campo, sem apagar dados já preenchidos
- **FR-013**: O sistema DEVE detectar ausência de suporte a cookies e exibir mensagem de erro explicativa em `/login` antes de iniciar qualquer fluxo de autenticação
- **FR-014**: O formulário de `/cadastro` DEVE exigir marcação de checkbox de consentimento LGPD ("Aceito os Termos de Uso e a Política de Privacidade") com links para os respectivos documentos — o envio do formulário é bloqueado enquanto o checkbox não estiver marcado

### Key Entities

- **Usuário (Dono)**: representa o dono do restaurante autenticado; atributos essenciais: e-mail único, nome, data de criação da conta, associação futura com restaurante(s)
- **Sessão**: representa a autenticação ativa de um usuário; possui duração definida, é persistida no navegador e invalida o acesso a rotas protegidas quando ausente ou expirada

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Donos conseguem completar o fluxo de login ou cadastro em menos de 2 minutos a partir da chegada na página
- **SC-002**: 100% das rotas do dashboard exigem sessão ativa — nenhum conteúdo protegido é acessível sem autenticação
- **SC-003**: Sessão permanece ativa por no mínimo 7 dias sem reautenticação em uso normal
- **SC-004**: 95% dos donos conseguem completar o cadastro sem assistência na primeira tentativa
- **SC-005**: Mensagens de erro cobrem 100% dos cenários de falha previsíveis (e-mail inválido, e-mail já existente, sessão expirada)
- **SC-006**: Redirecionamento de rotas protegidas ocorre antes de qualquer carregamento de conteúdo — zero exposição de dados protegidos

## Assumptions

- O público-alvo (donos de pequenos restaurantes, sem time técnico) prefere autenticação sem senha pela menor fricção
- Nome e e-mail são os únicos dados coletados no cadastro — informações do restaurante são obtidas no onboarding posterior ao primeiro acesso
- Um usuário tem apenas um restaurante no MVP (sem multi-unidade, conforme escopo do MVP na Constitution)
- Sessão deve persistir por no mínimo 7 dias para evitar reautenticação frequente em uso diário mobile
- Mobile é o principal dispositivo dos donos tanto para cadastro quanto para uso do dashboard (conforme Princípio I da Constitution)
- Não há fluxo de exclusão de conta no MVP
- Rotas protegidas incluem todo o prefixo `/dashboard` e qualquer subrota — rotas públicas são `/login`, `/cadastro` e as páginas de cardápio público
