# Cardê — Documento de Produto

> Versão 1.0 · MVP

---

## O que é

Cardê é um SaaS de cardápio digital para restaurantes. O restaurante cadastra seus pratos, gera um QR code e coloca na mesa — o cliente escaneia e vê o cardápio direto no celular, sem baixar nenhum aplicativo.

---

## Para que serve

Substituir o cardápio físico por uma experiência digital acessível, bonita e fácil de atualizar. O dono do restaurante edita preços, pausa itens e adiciona fotos em minutos, sem depender de gráfica ou impressão.

---

## Para quem

**Público primário:** pequenos restaurantes e lanchonetes que ainda usam cardápio impresso ou não têm presença digital.

**Perfil do cliente:**
- 1 a 3 funcionários na gestão
- Sem time técnico interno
- Sente dor toda vez que precisa reimprimir o cardápio por mudança de preço
- Quer parecer mais profissional para o cliente sem gastar muito

**Público secundário (fase 2+):** restaurantes médios que querem integrar pedidos e analytics ao cardápio.

---

## Proposta de valor

Cardápio bonito no ar em menos de uma hora, sem precisar de agência, programador ou designer.

---

## Features — MVP

### Cardápio visual
O restaurante cadastra pratos com nome, descrição, preço e foto. Os itens são organizados por categorias. O cardápio é exibido em uma página pública otimizada para mobile, com identidade visual do restaurante (logo e cor principal).

### QR code por mesa
Cada restaurante recebe um link público único (`carde.app/seu-restaurante`). A partir desse link é gerado um QR code pronto para imprimir e colocar na mesa. Não exige app no celular do cliente.

### Painel admin
Interface web onde o dono gerencia tudo: cria e edita itens, organiza categorias, ativa ou pausa pratos, faz upload de fotos e personaliza a aparência do cardápio.

### Tema personalizado
O restaurante configura logo, cor principal e nome. O cardápio público reflete essa identidade, diferenciando a experiência de um formulário genérico.

### Multi-idioma
O cardápio pode ser exibido em português, inglês e espanhol. Útil para restaurantes em regiões turísticas ou com clientela internacional.

### Onboarding em minutos
Fluxo de cadastro guiado: criar conta, nomear o restaurante, adicionar primeira categoria e primeiro prato. O restaurante sai com o cardápio no ar na primeira sessão.

---

## Features — Fase 2 (Crescimento)

### Pedidos pelo QR code
O cliente monta o pedido direto no cardápio e envia para o restaurante, sem precisar chamar o garçom.

### Integração com WhatsApp
O pedido montado pelo cliente chega como mensagem no WhatsApp do restaurante. Zero configuração de sistema — funciona com o número que o restaurante já usa.

### Disponibilidade por horário
O restaurante define em quais horários cada item ou categoria fica visível. Café da manhã some do cardápio às 11h automaticamente.

### Avaliações por prato
O cliente pode avaliar pratos com estrelas após consumir. O restaurante vê quais itens têm melhor e pior recepção.

### Analytics básico
Painel com os itens mais visualizados, horários de pico de acesso e quantidade de scans do QR code por dia.

### Planos e cobrança
Modelo freemium com plano gratuito limitado e planos pagos desbloqueando features avançadas. Cobrança recorrente via cartão de crédito.

---

## Features — Fase 3 (Escala)

### Multi-unidade
Redes e franquias gerenciam múltiplas unidades em uma única conta, com cardápios independentes ou compartilhados.

### Integração com delivery
Sincronização do cardápio com plataformas como iFood e Rappi. Atualizar o preço no Cardê reflete automaticamente nas plataformas conectadas.

### Fidelidade
Sistema de pontos ou cashback vinculado ao cardápio. O cliente acumula ao pedir e resgata na próxima visita.

### IA de sugestões
O cardápio sugere itens complementares automaticamente durante a navegação do cliente, aumentando o ticket médio sem esforço do restaurante.

### API pública
Endpoints documentados para restaurantes que queiram integrar o Cardê com seu próprio PDV, ERP ou sistema de gestão.

### Marketplace de templates
Loja de temas visuais premium para o cardápio. Restaurantes compram um template e aplicam com um clique.

---

## Modelo de monetização

| Plano | Preço | Limites |
|---|---|---|
| Gratuito | R$ 0/mês | Até 20 itens, sem foto, sem tema personalizado |
| Pro | R$ 79/mês | Itens ilimitados, fotos, tema personalizado, analytics |
| Premium | R$ 149/mês | Tudo do Pro + pedidos, WhatsApp, disponibilidade por horário |

> Valores iniciais sujeitos a ajuste após validação com primeiros clientes.

---

## O que o Cardê não é

- Não é um sistema de PDV (frente de caixa)
- Não é um aplicativo de delivery próprio
- Não substitui o sistema de gestão financeira do restaurante
- Não processa pagamentos diretamente (na Fase 2, apenas encaminha o pedido)
