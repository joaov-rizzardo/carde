# Feature Specification: Configurações e QR Code

**Feature Branch**: `009-configuracoes-qrcode`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Etapa 8 — Configurações e QR code. Painel de configurações do restaurante com geração e download do QR code. Última etapa do MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Gerar e baixar o QR code do cardápio (Priority: P1)

O dono do restaurante acessa o painel de configurações e encontra o QR code do seu cardápio já gerado, pronto para baixar e imprimir para colocar nas mesas, no balcão ou no menu físico.

**Why this priority**: É o ponto de contato físico entre o restaurante e o cliente final — sem o QR code impresso, o cardápio digital nunca chega a ser escaneado. É o entregável que torna o MVP utilizável no mundo real.

**Independent Test**: Com um restaurante já criado, acessar `/dashboard/configuracoes` e confirmar que um QR code é exibido apontando para a URL pública do cardápio (`/menu/[slug]`); clicar em baixar e confirmar que um arquivo PNG válido é salvo.

**Acceptance Scenarios**:

1. **Given** o dono está na página de configurações, **When** a página carrega, **Then** o QR code do cardápio é exibido, codificando a URL pública `/menu/[slug]` do restaurante.
2. **Given** o QR code está visível, **When** o dono clica em "baixar QR code", **Then** um arquivo de imagem PNG do QR code é baixado pelo navegador.
3. **Given** o dono quer verificar como o cardápio aparece para o cliente, **When** ele clica no link de preview do cardápio, **Then** o cardápio público abre em uma nova aba, refletindo os dados atuais do restaurante.
4. **Given** o QR code foi baixado e escaneado por um celular, **When** a câmera reconhece o código, **Then** o celular abre a URL pública do cardápio daquele restaurante.

---

### User Story 2 — Atualizar os dados e a identidade visual do restaurante (Priority: P2)

O dono do restaurante quer refinar as informações que aparecem no cardápio público: ajustar o nome, escrever uma descrição, trocar a cor de destaque ou atualizar a logo — sem precisar passar pelo onboarding de novo.

**Why this priority**: Fecha o ciclo de personalização iniciado no onboarding (que pedia apenas o nome). Tem valor próprio mas depende do restaurante já existir, por isso vem após o QR code, que é o entregável central da etapa.

**Independent Test**: Acessar `/dashboard/configuracoes`, alterar nome, descrição, cor e logo, salvar, e confirmar que os novos valores aparecem no formulário após recarregar a página e refletem no cardápio público.

**Acceptance Scenarios**:

1. **Given** o dono está no formulário de configurações, **When** a página carrega, **Then** os campos são pré-preenchidos com os dados atuais do restaurante (nome, descrição, cor, logo).
2. **Given** o dono altera o nome e a descrição e salva, **When** a operação é concluída, **Then** o sistema exibe confirmação de sucesso e os novos valores passam a ser usados no cardápio público.
3. **Given** o dono escolhe uma nova cor de destaque, **When** salva o formulário, **Then** essa cor passa a ser aplicada no cardápio público (header e elementos de destaque).
4. **Given** o dono envia uma nova logo, **When** o envio e o salvamento são concluídos, **Then** a logo antiga é substituída pela nova tanto no painel quanto no cardápio público.
5. **Given** o dono remove a logo atual sem enviar uma nova, **When** salva o formulário, **Then** o restaurante passa a não ter logo, e o cardápio público exibe apenas o nome no header.
6. **Given** o dono submete o formulário com o nome em branco, **When** o sistema valida, **Then** exibe mensagem de erro e não salva as alterações.

---

### Edge Cases

- O restaurante ainda não tem nenhuma categoria ou item cadastrado: o QR code e o link de preview são exibidos normalmente, apontando para um cardápio que mostrará um estado vazio.
- O dono envia uma imagem de logo em formato ou tamanho inválido: o sistema rejeita o envio com mensagem de erro clara, sem afetar a logo atual.
- O dono altera o nome do restaurante: o slug usado na URL do cardápio e no QR code permanece o mesmo (o slug não é regerado a partir do nome após a criação).
- Falha de rede ou erro do servidor ao salvar: o sistema informa o erro e mantém os valores preenchidos no formulário, sem perder o que o dono já digitou.
- O dono baixa o QR code em uma tela pequena (mobile): o download funciona da mesma forma que em desktop.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE expor a página `/dashboard/configuracoes`, acessível apenas a usuários autenticados com restaurante associado.
- **FR-002**: A página DEVE exibir um formulário pré-preenchido com os dados atuais do restaurante: nome, descrição, cor de destaque e logo.
- **FR-003**: O sistema DEVE permitir que o dono atualize nome, descrição e cor de destaque do restaurante.
- **FR-004**: O sistema DEVE validar que o nome do restaurante não pode ficar vazio ao salvar.
- **FR-005**: O sistema DEVE permitir que o dono envie uma nova logo, substituindo a anterior, ou remova a logo existente sem enviar uma nova.
- **FR-006**: Ao substituir ou remover a logo, o sistema DEVE excluir do armazenamento o arquivo da logo anterior.
- **FR-007**: O sistema DEVE expor um endpoint que persista as alterações de dados do restaurante, restrito ao dono autenticado daquele restaurante.
- **FR-008**: O sistema NÃO DEVE alterar o slug do restaurante quando o nome for atualizado — o slug permanece estável após a criação do restaurante.
- **FR-009**: A página DEVE exibir um QR code gerado a partir da URL pública do cardápio do restaurante (`/menu/[slug]`).
- **FR-010**: O sistema DEVE permitir que o dono baixe o QR code exibido como um arquivo de imagem PNG.
- **FR-011**: A página DEVE exibir um link para o cardápio público do restaurante, que abre a página `/menu/[slug]` atual.
- **FR-012**: O sistema DEVE confirmar visualmente ao dono quando as alterações forem salvas com sucesso, e exibir mensagem de erro clara quando a operação falhar.

### Key Entities

- **Restaurante**: entidade já existente (criada no onboarding) — esta etapa adiciona a capacidade de atualizar `nome`, `descricao`, `corPrimaria` e `logoUrl`, e de derivar visualmente um QR code a partir do seu `slug`. Não introduz novos atributos persistidos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O dono consegue baixar o QR code do cardápio em menos de 10 segundos a partir da abertura da página de configurações.
- **SC-002**: Um QR code baixado, quando escaneado por um celular comum, abre corretamente o cardápio público do restaurante em 100% dos casos.
- **SC-003**: O dono consegue atualizar nome, descrição, cor e logo do restaurante e ver essas mudanças refletidas no cardápio público em uma única operação de salvar.
- **SC-004**: 100% das tentativas de salvar o formulário com nome vazio são bloqueadas com mensagem de erro, sem alterar os dados já salvos.

## Assumptions

- A URL pública do cardápio segue o padrão já definido em etapas anteriores: `/menu/[slug]`, onde `slug` é o identificador único e estável do restaurante.
- O QR code é gerado sob demanda a partir do slug (não é um arquivo persistido em armazenamento) — qualquer alteração futura no domínio da aplicação não exige regeneração manual.
- O upload, validação de tipo/tamanho e otimização da logo seguem o mesmo padrão já estabelecido para fotos de item (etapa de upload de imagens).
- Apenas o dono autenticado do restaurante pode acessar e alterar a página de configurações; não há papel de "funcionário" ou acesso multiusuário neste MVP.
- O preview do cardápio público abre em uma nova aba/janela, sem sair da página de configurações.
