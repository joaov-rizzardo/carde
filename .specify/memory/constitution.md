<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 1.2.0
Modified principles: none
Added sections:
  - Padrões Obrigatórios: Frontend Design Plugin (novo padrão de ferramenta de desenvolvimento)
  - Antipadrões Proibidos: #9 — Layout sem o plugin frontend-design
Removed sections: none
Templates requiring updates:
  ✅ plan-template.md — sem alterações necessárias (Constitution Check é derivado do estado atual)
  ✅ spec-template.md — sem alterações necessárias
  ✅ tasks-template.md — sem alterações necessárias
Follow-up TODOs: none
-->

# Cardê Constitution

## O que é o Cardê

Cardê é um SaaS de cardápio digital para restaurantes. O restaurante cadastra seus pratos, gera um QR code e coloca na mesa — o cliente escaneia e vê o cardápio direto no celular, sem baixar nenhum aplicativo. Proposta de valor: cardápio bonito no ar em menos de uma hora, sem precisar de agência, programador ou designer.

**Público primário:** pequenos restaurantes e lanchonetes com 1 a 3 funcionários na gestão, sem time técnico interno, que sentem dor ao reimprimir cardápios por mudança de preço e querem parecer mais profissionais sem gastar muito.

**O que o Cardê não é:** não é PDV, não é aplicativo de delivery próprio, não substitui sistema de gestão financeira e não processa pagamentos diretamente.

---

## Core Principles

### I. Mobile First

Todo componente é desenhado para mobile e expandido para desktop — nunca o contrário. Breakpoints Tailwind seguem a ordem base → sm → md → lg, onde base é o design principal. Todo elemento interativo tem área mínima de toque de 44×44px. Scroll horizontal é proibido em qualquer viewport. Nenhum hover state pode ser a única indicação visual de interatividade. O cardápio público usa `next/image` com `sizes` adequado ao viewport mobile e `font-display: swap` para evitar FOIT em conexões lentas. O dashboard usa bottom navigation no mobile e sidebar fixa no desktop — nunca sidebar colapsável como solução mobile.

### II. Server Components por Padrão

Server Components são o padrão. `'use client'` é adicionado apenas quando estritamente necessário: estado local, efeitos, event handlers, APIs do browser ou hooks do React. Busca de dados, renderização de conteúdo estático ou semi-estático e páginas sem interatividade ficam sempre em Server Components. O padrão de composição obrigatório é Server Component passando dados para Client Component — nunca o inverso, nunca fetch dentro de Client Component quando um Server Component resolve.

### III. Segurança em Todas as Camadas

Toda API route valida o corpo da requisição com Zod antes de qualquer operação — nunca confiar no cliente. Toda mutação (PUT, PATCH, DELETE) chama `verificarOwnership()` centralizado em `lib/auth/ownership.ts` — sem verificações ad-hoc por route e sem duplicação de lógica. Uploads são validados no cliente (feedback rápido de UX) e no servidor (garantia real) — nunca apenas em um lado. Variáveis de ambiente são acessadas exclusivamente via `lib/env.ts`, que lança erro explícito na inicialização se alguma estiver ausente. Proteção de rotas vive exclusivamente em `middleware.ts` — nunca nas páginas.

### IV. Todos os Estados da UI São Tratados

O usuário acessa o cardápio no celular em conexão 4G instável. Todo componente com dados assíncronos trata obrigatoriamente três estados: loading com skeleton, erro com mensagem e botão de retry, e vazio com texto explicativo e CTA. Mutações simples e reversíveis — como pausar ou ativar um item — usam atualização otimista: a UI atualiza imediatamente e reverte com toast de erro em caso de falha. Spinner de 1–2 segundos em ações simples no mobile é experiência inaceitável.

### V. Arquitetura Limpa por Domínio

`lib/` contém integrações e utilitários puros — sem React, sem hooks. `hooks/` encapsulam estado e chamadas de API — componentes nunca fazem fetch direto. `components/ui/` contém apenas primitivos shadcn sem lógica de negócio. Domínios `(dashboard)` e `(marketing)` não se cruzam — imports entre grupos são proibidos. Lógica de negócio fica em `lib/` ou hooks; componentes apenas renderizam. A ordem de imports em todo componente segue: externos → internos → tipos → constantes locais → componente → export.

---

## Identidade Visual

**Paleta de cores:**

| Token | Hex | Uso |
|---|---|---|
| `brand-primary` | `#1A1A2E` | Header, texto principal do admin |
| `brand-accent` | `#E85D04` | CTAs, badges, destaque de preço |
| `brand-warm` | `#F7F3EE` | Fundo das páginas do cardápio |
| `brand-surface` | `#FFFFFF` | Cards, modais |
| `brand-muted` | `#6B7280` | Descrições, labels secundários |
| `brand-border` | `#E5E7EB` | Divisores, bordas |
| `status-success` | `#16A34A` | Disponível, confirmado |
| `status-warning` | `#D97706` | Pausado |
| `status-danger` | `#DC2626` | Indisponível, erro |

**Tipografia:** Display usa Playfair Display (serif) para nomes de pratos e títulos. Body usa Inter (system-ui) para descrições e UI geral.

---

## Escopo do MVP

Features incluídas: cardápio visual com pratos organizados por categorias e página pública otimizada para mobile; QR code por mesa com link único `carde.app/seu-restaurante`; painel admin para criação e edição de itens, categorias, upload de fotos e personalização; tema personalizado com logo, cor e nome do restaurante; multi-idioma em português, inglês e espanhol; onboarding guiado que coloca o cardápio no ar na primeira sessão.

Fora do escopo do MVP: pedidos pelo QR, integração com WhatsApp, disponibilidade por horário, avaliações por prato, analytics, planos e cobrança, multi-unidade, delivery, fidelidade, IA de sugestões, API pública e marketplace de templates.

**Planos (referência para Fase 2):** Gratuito R$0/mês com até 20 itens sem foto; Pro R$79/mês com itens ilimitados, fotos, tema personalizado e analytics; Premium R$149/mês com tudo do Pro mais pedidos, WhatsApp e disponibilidade por horário.

---

## Antipadrões Proibidos

**1. Client Component onde Server Component resolve.** Aumenta o bundle JS e perde otimizações de server rendering. Verificar sempre se um Server Component resolve antes de adicionar `'use client'`.

**2. Lógica de negócio dentro de componentes.** Cálculos de preço, geração de slugs, verificações de disponibilidade e qualquer lógica derivada pertencem a `lib/` ou hooks — nunca inline no componente.

**3. Estados de loading e erro ignorados.** Renderizar dados assíncronos sem tratar loading, erro e vazio gera experiência quebrada em conexões instáveis.

**4. Ownership verificado ad-hoc por route.** Verificações duplicadas ou inconsistentes entre routes. Sempre usar `verificarOwnership()` centralizado.

**5. Upload sem validação dupla.** Validar apenas no cliente permite que requisições diretas à API bypassem a validação. Validar apenas no servidor sacrifica a UX. Os dois lados são obrigatórios.

**6. Mutations sem feedback otimista no mobile.** Aguardar resposta do servidor antes de atualizar a UI em ações simples e reversíveis gera experiência travada no mobile.

**7. `any` no TypeScript.** Desliga o sistema de tipos e move erros de compilação para runtime. Tipos explícitos são obrigatórios em todas as funções, especialmente handlers de webhook do Stripe.

**8. Queries N+1 no Prisma.** Buscar categorias e depois itens de cada categoria em loop separado. Usar sempre `include` para trazer relações em uma única query.

---

## Padrões Obrigatórios

**Respostas de API:** formato padronizado `ApiResponse<T>` com `{ sucesso: true, dados }` ou `{ sucesso: false, erro, codigo? }`. Helpers `ok()` e `erro()` centralizados em `types/api.ts`.

**Imagens:** compressão obrigatória antes de qualquer upload via `lib/image/compress.ts` — máximo 0.5MB, 1200px, convertido para webp. Arquivos já menores que 100KB não são recomprimidos.

**Slugs:** geração exclusivamente via `gerarSlugUnico()` em `lib/restaurante/slug.ts` — normaliza acentos, remove caracteres especiais, trata colisões com sufixo numérico automático.

**TypeScript:** sem `any`, sem `as unknown`. Tipos de resposta de API sempre explícitos.

**Frontend Design Plugin:** Todo desenvolvimento de layout, componente visual ou página MUST usar o skill `/frontend-design` (plugin `frontend-design:frontend-design`) antes de implementar. O plugin gera interfaces distintivas e de qualidade de produção alinhadas à identidade visual do Cardê. A ordem correta é: invocar `/frontend-design` para gerar o design → implementar o código resultante. Nunca implementar layout sem passar pelo plugin primeiro.

---

## Governance

Esta constitution tem precedência sobre todas as outras práticas. Os 5 princípios e os 9 antipadrões são inegociáveis — não apenas orientações. Todo código novo deve satisfazer os princípios I–V antes de ser considerado completo. Qualquer feature além do escopo do MVP exige alinhamento explícito com o roadmap de Fases 2 e 3. Complexidade adicional deve ser justificada — o padrão é a solução mais simples que resolve o problema real.

**Version**: 1.2.0 | **Ratified**: 2026-06-13 | **Last Amended**: 2026-06-14
