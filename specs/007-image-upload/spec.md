# Feature Specification: Upload de Imagens dos Itens

**Feature Branch**: `007-image-upload`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "Etapa 6 — Upload de imagens. Funcionalidade de upload de foto para cada item do cardápio. Imagem comprimida no browser, armazenada no Supabase Storage. Entregáveis: componente ImageUpload integrado ao formulário de item, preview antes de salvar, indicador de progresso, botão de remover imagem existente, endpoint de upload com validação de tipo e tamanho, remoção automática da imagem anterior ao substituir, upload no cadastro/edição do produto, escala padrão da imagem."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Adicionar foto ao cadastrar um item (Priority: P1)

O dono está cadastrando um novo item no cardápio e quer que ele apareça com uma foto atrativa para o cliente final. No formulário de cadastro (Etapa 5), ele seleciona uma foto do prato a partir do celular ou computador, vê uma pré-visualização imediata, acompanha o progresso do envio e salva o item já com a imagem associada.

**Why this priority**: Fotos são o maior fator de conversão em um cardápio digital — sem essa capacidade, o cardápio fica apenas com texto, reduzindo o apelo visual que justifica o produto.

**Independent Test**: Com o formulário de cadastro de item aberto, selecionar uma foto válida, aguardar o preview e o envio, salvar o item e confirmar que a foto aparece associada ao item na listagem.

**Acceptance Scenarios**:

1. **Given** o formulário de cadastro de item está aberto, **When** o dono seleciona uma foto válida (JPEG, PNG ou WebP) do dispositivo, **Then** uma pré-visualização da imagem aparece imediatamente na tela, antes de qualquer envio ao servidor.
2. **Given** uma foto foi selecionada, **When** o envio para o armazenamento está em andamento, **Then** o sistema exibe um indicador de progresso visível até a conclusão.
3. **Given** o envio da foto foi concluído com sucesso, **When** o dono salva o item, **Then** o item é criado com a foto associada e ela aparece corretamente na listagem do cardápio.
4. **Given** o dono selecionou um arquivo maior que o limite permitido ou de um formato não aceito, **When** ele tenta usá-lo, **Then** o sistema exibe uma mensagem de erro clara e não permite o envio, mantendo o restante do formulário intacto.
5. **Given** a foto selecionada excede o tamanho ou a resolução padrão definidos para exibição, **When** o envio ocorre, **Then** o sistema reduz a foto para um tamanho de arquivo e dimensões adequados antes de armazená-la, sem perda perceptível de qualidade para o uso em cardápio.

---

### User Story 2 — Substituir a foto de um item existente (Priority: P2)

O dono quer atualizar a foto de um item que já está no cardápio — por exemplo, porque tirou uma foto melhor do prato. Ele abre o item para edição, seleciona a nova foto e salva; a foto antiga deixa de ser exibida e não permanece ocupando espaço de armazenamento sem uso.

**Why this priority**: Cardápios mudam com o tempo — pratos são refeitos, fotos melhoram — e a substituição precisa ser simples e não deixar lixo acumulado no armazenamento, que gera custo sem benefício.

**Independent Test**: Editar um item que já possui foto, selecionar uma nova foto, salvar, e confirmar que (a) a nova foto é exibida no lugar da antiga e (b) a foto antiga não está mais acessível/armazenada.

**Acceptance Scenarios**:

1. **Given** um item já possui uma foto, **When** o dono abre o item para edição e seleciona uma nova foto, **Then** a pré-visualização mostra a nova foto no lugar da antiga.
2. **Given** a nova foto foi enviada e o item salvo, **When** a operação é concluída, **Then** a foto antiga é removida do armazenamento automaticamente, sem necessidade de ação manual do dono.
3. **Given** o dono está editando o item e seleciona uma nova foto, **When** ele cancela a edição sem salvar, **Then** a foto original do item permanece inalterada.

---

### User Story 3 — Remover a foto de um item sem substituí-la (Priority: P3)

O dono decide que um item deve voltar a ser exibido sem foto — por exemplo, porque a foto ficou desatualizada e ele ainda não tem uma nova para colocar. Ele abre o item, remove a foto existente e salva, e o item passa a ser exibido apenas com texto.

**Why this priority**: É uma ação menos frequente que adicionar ou substituir, mas necessária para manter o controle total do dono sobre o conteúdo exibido ao cliente final.

**Independent Test**: Editar um item que possui foto, usar o botão de remover imagem, salvar, e confirmar que o item passa a ser exibido sem foto e que o arquivo correspondente não está mais armazenado.

**Acceptance Scenarios**:

1. **Given** um item possui uma foto, **When** o dono clica no botão de remover imagem no formulário, **Then** a pré-visualização da foto desaparece e o formulário volta ao estado de "sem imagem".
2. **Given** o dono removeu a foto e salvou o item, **When** a operação é concluída, **Then** o item passa a ser listado sem foto e o arquivo correspondente é removido do armazenamento.

---

### Edge Cases

- O que acontece quando o arquivo selecionado excede o tamanho máximo aceito antes da compressão? O sistema rejeita o arquivo com mensagem de erro clara, sem iniciar o envio.
- O que acontece quando o arquivo selecionado não é uma imagem em formato aceito (ex.: PDF, GIF, vídeo)? O sistema rejeita com mensagem de erro clara, sem iniciar o envio.
- O que acontece se a conexão cair durante o envio da foto? O sistema indica falha no envio e permite que o dono tente novamente sem perder os demais dados já preenchidos no formulário.
- O que acontece se o dono navegar para fora da tela enquanto o envio está em andamento? O envio em andamento é descartado e nenhuma foto incompleta é associada ao item.
- O que acontece se um item com foto for excluído do cardápio? O arquivo de foto associado também é removido do armazenamento, evitando acúmulo de arquivos órfãos.
- O que acontece se o dono tentar enviar uma foto para um item de outro restaurante (ex.: manipulando a requisição)? O sistema rejeita a operação, pois apenas o dono do item pode alterar sua foto.
- O que acontece se duas fotos forem enviadas em sequência rápida para o mesmo item (ex.: dono troca de ideia rapidamente)? Apenas a foto do envio mais recente e concluído é associada ao item; envios anteriores não concluídos não geram arquivos órfãos visíveis na listagem.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o dono selecione e anexe uma foto a um item ao cadastrá-lo ou editá-lo.
- **FR-002**: O sistema DEVE exibir uma pré-visualização da foto selecionada imediatamente após a seleção, antes da conclusão do envio.
- **FR-003**: O sistema DEVE exibir um indicador de progresso visível durante o envio da foto.
- **FR-004**: O sistema DEVE reduzir o tamanho do arquivo e as dimensões da foto para um padrão adequado à exibição em cardápio digital antes de armazená-la definitivamente, preservando qualidade visual aceitável.
- **FR-005**: O sistema DEVE rejeitar arquivos que excedam o tamanho máximo permitido para envio, exibindo mensagem de erro clara.
- **FR-006**: O sistema DEVE rejeitar arquivos que não estejam em um formato de imagem aceito, exibindo mensagem de erro clara.
- **FR-007**: O sistema DEVE validar tipo e tamanho do arquivo tanto no momento da seleção (feedback imediato) quanto no servidor (garantia real), independentemente da validação do cliente.
- **FR-008**: O sistema DEVE permitir que o dono substitua a foto existente de um item por uma nova.
- **FR-009**: Ao substituir a foto de um item, o sistema DEVE remover automaticamente o arquivo da foto anterior do armazenamento.
- **FR-010**: O sistema DEVE permitir que o dono remova a foto de um item sem precisar enviar uma nova, voltando o item ao estado "sem foto".
- **FR-011**: Ao remover a foto de um item, o sistema DEVE excluir o arquivo correspondente do armazenamento.
- **FR-012**: Ao excluir um item que possui foto, o sistema DEVE excluir o arquivo de foto associado do armazenamento.
- **FR-013**: O sistema DEVE permitir que apenas o dono do restaurante ao qual o item pertence envie, substitua ou remova a foto desse item.
- **FR-014**: O sistema DEVE armazenar cada foto enviada com um identificador único, de forma que substituir uma foto não reutilize o mesmo identificador de arquivo.
- **FR-015**: O sistema DEVE informar visualmente o dono quando um envio de foto falhar, permitindo nova tentativa sem perder os demais dados do formulário.
- **FR-016**: O sistema DEVE aplicar uma escala/proporção padrão consistente a todas as fotos de itens, garantindo alinhamento visual uniforme na listagem do cardápio.

### Key Entities

- **Item do cardápio**: entidade já existente que passa a ter um atributo de foto associada (presente ou ausente). No máximo uma foto por item nesta etapa.
- **Foto do item**: arquivo de imagem armazenado de forma persistente, vinculado a um único item e ao restaurante proprietário; existe de forma independente do registro do item até ser explicitamente removida ou substituída.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O dono consegue adicionar uma foto a um item em menos de 30 segundos em uma conexão móvel típica, do momento da seleção até a confirmação de envio concluído.
- **SC-002**: 100% das fotos enviadas são reduzidas para o tamanho de arquivo e dimensões padrão definidos, independentemente do tamanho do arquivo original.
- **SC-003**: Após substituir ou remover a foto de um item, nenhum arquivo da foto anterior permanece acessível ou ocupando espaço de armazenamento.
- **SC-004**: Arquivos inválidos (tipo ou tamanho incorretos) são rejeitados com mensagem de erro em até 2 segundos após a seleção, sem depender de uma resposta do servidor.
- **SC-005**: Fotos de itens carregam corretamente na primeira renderização da página, tanto no painel do dono quanto no cardápio público, sem deslocamento de layout perceptível.

## Assumptions

- Cada item do cardápio possui no máximo uma foto nesta etapa; galeria com múltiplas fotos por item está fora de escopo.
- "Escala padrão da imagem" significa aplicar uma proporção fixa (ex.: enquadramento quadrado) a todas as fotos exibidas na listagem e no cardápio público, para consistência visual — não inclui recorte manual personalizável pelo dono nesta etapa.
- O dono só pode enviar fotos a partir de um arquivo local do dispositivo (câmera ou galeria); não há suporte para colar uma URL de imagem externa nesta etapa.
- A funcionalidade reutiliza o mesmo formulário de cadastro/edição de item já existente (Etapa 5), apenas estendendo-o com o campo de imagem.
- Apenas o dono autenticado do restaurante proprietário do item pode gerenciar a foto, seguindo o mesmo modelo de permissão já aplicado às demais operações de item.
- Um envio de foto iniciado mas não concluído (ex.: o dono fecha o formulário antes de salvar) pode gerar um arquivo temporário no armazenamento; a limpeza desse cenário específico é aceitável como limitação conhecida desta etapa e não bloqueia a entrega.
