# Feature Specification: Onboarding do Restaurante

**Feature Branch**: `003-restaurant-onboarding`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "Etapa 2 — Onboarding do restaurante. Fluxo guiado para criação do restaurante logo após o primeiro login. Cada usuário tem exatamente um restaurante associado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criação do Restaurante no Primeiro Login (Priority: P1)

Logo após o primeiro login bem-sucedido, o dono de restaurante é redirecionado para `/onboarding`, onde preenche um formulário simples com o nome do restaurante. Ao submeter, o restaurante é criado e o usuário é levado ao dashboard.

**Why this priority**: Sem o restaurante criado, o usuário não tem acesso a nenhuma funcionalidade do sistema. É o passo obrigatório que desbloqueia toda a experiência.

**Independent Test**: Pode ser testado de forma isolada fazendo login com um usuário novo (sem restaurante) e verificando que o onboarding cria o restaurante e redireciona para o dashboard.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado sem restaurante, **When** ele acessa qualquer rota do dashboard, **Then** é redirecionado automaticamente para `/onboarding`
2. **Given** o usuário está em `/onboarding` e preenche o nome do restaurante, **When** submete o formulário, **Then** o restaurante é criado, um slug único é gerado e o usuário é redirecionado para o dashboard
3. **Given** o formulário é submetido com nome vazio, **When** o sistema valida, **Then** exibe mensagem de erro e não cria o restaurante

---

### User Story 2 - Bloqueio para Usuários com Restaurante (Priority: P2)

Um usuário que já completou o onboarding e já possui um restaurante não consegue acessar `/onboarding` novamente — é redirecionado automaticamente para o dashboard.

**Why this priority**: Garante o invariante "um usuário, um restaurante" e impede criação acidental de duplicatas.

**Independent Test**: Pode ser testado fazendo login com um usuário que já tem restaurante e tentando acessar `/onboarding` diretamente — o redirecionamento deve ocorrer.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com restaurante já criado, **When** tenta acessar `/onboarding`, **Then** é redirecionado para o dashboard imediatamente
2. **Given** um usuário não autenticado, **When** tenta acessar `/onboarding`, **Then** é redirecionado para a página de login

---

### User Story 3 - Consulta do Restaurante do Usuário Logado (Priority: P3)

Outros módulos do sistema (dashboard, middleware) conseguem consultar os dados do restaurante vinculado ao usuário autenticado para tomar decisões de navegação e exibir contexto correto.

**Why this priority**: Dependência técnica que viabiliza as histórias P1 e P2 e é necessária para as etapas seguintes do produto.

**Independent Test**: Pode ser testado chamando o endpoint de consulta com usuário autenticado e verificando que retorna os dados corretos do restaurante.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com restaurante, **When** o sistema consulta o restaurante do usuário, **Then** retorna nome, slug e dados do restaurante
2. **Given** um usuário autenticado sem restaurante, **When** o sistema consulta o restaurante do usuário, **Then** retorna ausência de restaurante (sem erro)

---

### Edge Cases

- O que acontece se dois usuários tentam criar restaurantes com o mesmo nome ao mesmo tempo? → Colisão de slug deve ser resolvida automaticamente com sufixo numérico.
- O que acontece se o usuário recarregar a página no meio do preenchimento do formulário? → Formulário reseta; dados não são salvos parcialmente.
- O que acontece se o nome tiver apenas caracteres especiais ou acentuados? → Slug ainda deve ser gerado de forma válida após normalização.
- O que acontece com um usuário cuja sessão expira durante o onboarding? → Redirecionado para login ao tentar submeter; restaurante não é criado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE redirecionar para `/onboarding` qualquer usuário autenticado que não possui restaurante ao tentar acessar rotas do dashboard
- **FR-002**: O sistema DEVE bloquear o acesso a `/onboarding` para usuários que já possuem restaurante, redirecionando-os para o dashboard
- **FR-003**: O sistema DEVE bloquear o acesso a `/onboarding` para usuários não autenticados, redirecionando-os para o login
- **FR-004**: O usuário DEVE poder criar seu restaurante informando apenas o nome
- **FR-005**: O sistema DEVE gerar automaticamente um slug único a partir do nome do restaurante, sem intervenção do usuário
- **FR-006**: O slug gerado DEVE ser único no sistema — colisões resolvidas automaticamente com sufixo numérico
- **FR-007**: O formulário de onboarding DEVE validar que o nome não está vazio antes de submeter
- **FR-008**: Após criação bem-sucedida do restaurante, o usuário DEVE ser redirecionado para o dashboard
- **FR-009**: O sistema DEVE expor um endpoint para criação do restaurante vinculado ao usuário autenticado
- **FR-010**: O sistema DEVE expor um endpoint para consulta do restaurante do usuário autenticado
- **FR-011**: Cada usuário DEVE ter no máximo um restaurante associado — tentativa de criar segundo restaurante deve ser rejeitada com erro claro

### Key Entities

- **Restaurante**: Representa o negócio do usuário no sistema. Atributos principais: nome, slug (único no sistema), vínculo com um único usuário proprietário. O slug forma a base da URL pública do cardápio (`carde.app/{slug}`).
- **Usuário**: Dono do restaurante, autenticado via magic link (etapa anterior). Cada usuário tem zero ou um restaurante associado. A presença ou ausência do restaurante determina o fluxo de navegação no sistema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue criar seu restaurante em menos de 2 minutos a partir do primeiro login
- **SC-002**: 100% das tentativas de acesso ao dashboard por usuários sem restaurante resultam em redirecionamento para `/onboarding`
- **SC-003**: 100% das tentativas de acesso a `/onboarding` por usuários com restaurante resultam em redirecionamento para o dashboard
- **SC-004**: O slug gerado automaticamente é sempre único — zero colisões de slug chegam ao banco de dados
- **SC-005**: O formulário fornece feedback claro de erro para submissões inválidas, sem recarregar a página

## Assumptions

- Autenticação via magic link já está implementada (Etapa 1 — 002-autenticacao); este fluxo assume sessão ativa
- O usuário não precisa configurar nada além do nome do restaurante durante o onboarding — outras configurações (logo, cor, tema) pertencem a etapas posteriores
- O slug gerado é permanente e não pode ser alterado pelo usuário no MVP; mudanças de slug exigiriam atualização de QR codes já impressos
- O redirecionamento para onboarding é responsabilidade do middleware de rotas, não de cada página individualmente
- A geração de slug usa a função `gerarSlugUnico()` já definida nos padrões obrigatórios do projeto (`lib/restaurante/slug.ts`)
- Mobile é o viewport primário — o formulário de onboarding deve funcionar bem em telas pequenas antes de ser ajustado para desktop
