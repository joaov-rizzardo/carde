# Quickstart: Dashboard Shell

**Feature**: Dashboard Shell | **Date**: 2026-06-15

## Pré-requisitos

- Servidor de desenvolvimento rodando: `npm run dev`
- Usuário autenticado com restaurante criado (onboarding completo)
- Usuário autenticado sem restaurante (para testar redirecionamento)
- Browser com DevTools para testar viewports mobile

---

## Cenário 1 — Layout desktop (sidebar)

**Setup**: Usuário autenticado com restaurante. Viewport ≥ 768px.

**Passos**:
1. Acesse `/dashboard`
2. Verifique: sidebar fixa à esquerda com os três itens (Cardápio, Categorias, Configurações)
3. Verifique: header no topo com o nome do restaurante cadastrado
4. Verifique: área de conteúdo central com o estado vazio do dashboard

**Esperado**: Layout completo visível; sem scroll horizontal; nome do restaurante correto no header.

---

## Cenário 2 — Layout mobile (bottom navigation)

**Setup**: Usuário autenticado com restaurante. DevTools → viewport 375px de largura.

**Passos**:
1. Acesse `/dashboard`
2. Verifique: nenhuma sidebar lateral visível
3. Verifique: bottom navigation fixada na base com os três itens
4. Role o conteúdo da página
5. Verifique: bottom navigation permanece fixa ao rolar

**Esperado**: Só bottom nav; sem sidebar; sem scroll horizontal; conteúdo não fica oculto atrás da bottom nav.

---

## Cenário 3 — Active state na navegação

**Setup**: Usuário autenticado com restaurante. Desktop (≥ 768px).

**Passos**:
1. Acesse `/dashboard` — nenhum item de nav deve estar ativo (rota raiz do dashboard)
2. Clique em "Cardápio" na sidebar → observe o item ficar destacado
3. Clique em "Categorias" → "Cardápio" perde destaque, "Categorias" fica ativo
4. Repita o passo 2 em mobile: verifique que a bottom nav reflete o mesmo comportamento

**Esperado**: Exatamente um item ativo por vez; item ativo usa `brand-accent` (#E85D04) como cor de destaque.

---

## Cenário 4 — Active state em sub-rotas

**Setup**: Usuário autenticado com restaurante. Desktop.

**Passos**:
1. Navegue para `/dashboard/cardapio` (placeholder)
2. Verifique: item "Cardápio" está ativo na sidebar

**Esperado**: Active state detecta corretamente a seção mesmo sem ser a rota raiz do item.

---

## Cenário 5 — Logout

**Setup**: Usuário autenticado com restaurante.

**Passos**:
1. Clique no menu do usuário no header (avatar/nome)
2. Selecione "Sair"
3. Verifique: redirecionamento para `/login`
4. Tente acessar `/dashboard` diretamente na URL
5. Verifique: redirecionamento para `/login` (não acessa o painel)

**Esperado**: Sessão encerrada; nenhum conteúdo do painel acessível após logout.

---

## Cenário 6 — Proteção de rota (usuário não autenticado)

**Setup**: Sem sessão ativa (aba anônima ou após logout).

**Passos**:
1. Tente acessar `/dashboard` diretamente
2. Verifique: redirecionamento para `/login`

**Esperado**: Middleware redireciona; comportamento já existente, confirmado como inalterado.

---

## Cenário 7 — Estado de loading em transições

**Setup**: Usuário autenticado. DevTools → Network → Throttling "Slow 4G".

**Passos**:
1. Clique em "Cardápio" na sidebar
2. Observe a área de conteúdo durante o carregamento
3. Verifique: skeleton/loading state aparece antes do conteúdo

**Esperado**: Skeleton visível durante a transição; desaparece quando o conteúdo carrega.

---

## Cenário 8 — Viewport mínimo 320px

**Setup**: DevTools → viewport 320px de largura.

**Passos**:
1. Acesse `/dashboard`
2. Role horizontal e verticalmente

**Esperado**: Sem scroll horizontal em 320px; conteúdo se adapta ao viewport mínimo.

---

## Verificação de Identidade Visual

| Elemento | Token esperado | Hex |
|----------|---------------|-----|
| Fundo da sidebar | `brand-primary` | `#1A1A2E` |
| Item de nav ativo | `brand-accent` | `#E85D04` |
| Fundo da área de conteúdo | `brand-warm` ou `brand-surface` | `#F7F3EE` / `#FFFFFF` |
| Texto secundário (labels) | `brand-muted` | `#6B7280` |
| Bordas | `brand-border` | `#E5E7EB` |
