# Quickstart: Cardápio Público

**Feature**: Cardápio Público | **Date**: 2026-06-18

## Pré-requisitos

- Servidor de desenvolvimento rodando: `npm run dev`
- Pelo menos um restaurante `ativo: true` com categorias e itens cadastrados (algumas com itens pausados e sem foto, para cobrir os edge cases)
- Um restaurante com `ativo: false` (editar diretamente no banco/Prisma Studio, já que não há toggle de ativação no admin ainda)
- Browser com DevTools para emular viewport mobile (375px) e visualizar o HTML inicial (View Source / "Disable JavaScript")

---

## Cenário 1 — Cardápio completo sem login

**Setup**: Restaurante ativo, com 2+ categorias visíveis, cada uma com itens disponíveis (alguns com foto, alguns sem; alguns com descrição, alguns sem).

**Passos**:
1. Em uma aba anônima (sem sessão), acesse `/menu/[slug-do-restaurante]`
2. Verifique: header com logo (ou só nome, se não houver logo) e nome do restaurante
3. Verifique: cada categoria aparece como uma seção, com seus itens dentro
4. Verifique: cada item mostra foto (ou placeholder), nome, descrição (quando houver) e preço em R$ com 2 casas decimais

**Esperado**: Cardápio completo visível, nenhuma etapa de login solicitada.

---

## Cenário 2 — Itens pausados nunca aparecem

**Setup**: Restaurante ativo com ao menos um item `disponivel: false`.

**Passos**:
1. Acesse `/menu/[slug]`
2. Use "View Page Source" (Ctrl+U) e busque pelo nome do item pausado no HTML

**Esperado**: O nome do item pausado não aparece em nenhum lugar do HTML retornado.

---

## Cenário 3 — Categoria sem itens disponíveis é ocultada

**Setup**: Restaurante com uma categoria cujos itens estão todos pausados (ou sem nenhum item cadastrado).

**Passos**:
1. Acesse `/menu/[slug]`
2. Verifique: essa categoria não aparece no conteúdo da página
3. Verifique: essa categoria também não aparece no menu de navegação por âncoras

**Esperado**: Categoria totalmente ausente, tanto na navegação quanto no conteúdo.

---

## Cenário 4 — Slug inexistente

**Passos**:
1. Acesse `/menu/slug-que-definitivamente-nao-existe`

**Esperado**: Página 404 do site (não erro técnico, não página em branco).

---

## Cenário 5 — Restaurante inativo

**Setup**: Restaurante com `ativo: false` no banco.

**Passos**:
1. Acesse `/menu/[slug-do-restaurante-inativo]`

**Esperado**: Mesma página 404 do Cenário 4 — nenhuma indicação de que o restaurante existe, só está inativo.

---

## Cenário 6 — Navegação por âncoras no mobile

**Setup**: Restaurante com 3+ categorias visíveis. DevTools → viewport 375px.

**Passos**:
1. Acesse `/menu/[slug]`
2. Verifique: menu de navegação lista um link por categoria visível, na mesma ordem do conteúdo
3. Verifique: os links quebram em múltiplas linhas (sem scroll horizontal)
4. Toque em um link de categoria que esteja fora da tela

**Esperado**: A página rola suavemente até a seção correspondente; nenhum scroll horizontal em nenhum momento.

---

## Cenário 7 — Identidade visual (cor de marca)

**Setup**: Restaurante com `corPrimaria` customizada (diferente do padrão `#E85D04`).

**Passos**:
1. Acesse `/menu/[slug]`
2. Verifique visualmente: a cor aparece no header e em elementos de destaque (ex: link ativo da navegação, bordas)

**Esperado**: Cor do restaurante visivelmente aplicada — não a cor padrão do produto Cardê.

---

## Cenário 8 — Estado vazio

**Setup**: Restaurante ativo sem nenhuma categoria, ou com todas as categorias sem itens disponíveis.

**Passos**:
1. Acesse `/menu/[slug]`

**Esperado**: Estado vazio amigável (texto explicativo) em vez de uma área em branco.

---

## Cenário 9 — Renderização sem JavaScript (SSR real)

**Setup**: Restaurante ativo com cardápio populado.

**Passos**:
1. DevTools → desabilitar JavaScript (Command Menu → "Disable JavaScript", ou extensão equivalente)
2. Acesse `/menu/[slug]`

**Esperado**: Cardápio completo (nomes, descrições, preços, navegação por âncoras funcional) visível e navegável mesmo sem JS.

---

## Cenário 10 — SEO

**Passos**:
1. Acesse `/menu/[slug]`, abra "View Page Source"
2. Verifique: `<title>` contém o nome do restaurante
3. Verifique: `<meta name="description">` presente quando o restaurante tem `descricao` cadastrada
4. Repita com um restaurante sem `descricao` cadastrada — verifique que a meta tag de descrição não aparece vazia (é omitida)

**Esperado**: Tags de SEO corretas e condicionais à presença de dados.

---

## Verificação de Identidade Visual (Cardê — fora da cor dinâmica do restaurante)

| Elemento | Token esperado | Hex |
|---|---|---|
| Fundo da página | `brand-warm` | `#F7F3EE` |
| Cards de item | `brand-surface` | `#FFFFFF` |
| Texto de descrição | `brand-muted` | `#6B7280` |
| Bordas/divisores | `brand-border` | `#E5E7EB` |
| Preço em destaque | `brand-accent` (fallback quando não há `corPrimaria` customizada) | `#E85D04` |
