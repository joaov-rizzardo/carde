# Etapa 3 — Dashboard (shell)

## What

Estrutura base do painel administrativo. Não entrega nenhuma feature de negócio — é o container onde todas as seções futuras vão viver.

**Entregáveis:**
- Layout `(dashboard)/layout.tsx` com sidebar fixa e área de conteúdo
- Sidebar com navegação: Cardápio, Categorias, Configurações
- Header com nome do restaurante e menu do usuário (logout)
- Página `/dashboard` com estado vazio (placeholder)
- Sidebar colapsável em mobile
- Estados de loading para transições entre seções

---

## Why

Antes de construir qualquer feature real, o shell precisa estar sólido porque:

- **Todas as seções dependem do mesmo layout** — sidebar, header e área de conteúdo são compartilhados pelas Etapas 4 a 8
- **Navegação e UX são mais fáceis de acertar agora** — corrigir o layout depois de 5 seções prontas é caro
- **Logout e gestão de sessão** precisam funcionar antes de haver dados sensíveis
- **Responsividade mobile** deve ser validada no container, não em cada seção individual

---

## How

### Estrutura de rotas (App Router)
```
app/
  (dashboard)/
    layout.tsx       ← sidebar + header
    page.tsx         ← /dashboard (overview vazio)
    cardapio/
      page.tsx       ← Etapa 5
    categorias/
      page.tsx       ← Etapa 4
    configuracoes/
      page.tsx       ← Etapa 8
```

### Componentes principais
| Componente | Responsabilidade |
|---|---|
| `Sidebar` | Links de navegação com indicador de rota ativa |
| `Header` | Nome do restaurante + dropdown do usuário (logout) |
| `MobileMenu` | Sidebar como sheet/drawer em telas pequenas |

### Dados necessários no layout
O layout server component faz `GET /api/restaurantes/me` para exibir o nome do restaurante no header. Se falhar, redireciona para `/onboarding`.

### Navegação
- Item ativo detectado via `usePathname()` no client component da sidebar
- Links: `/dashboard`, `/dashboard/cardapio`, `/dashboard/categorias`, `/dashboard/configuracoes`

### UI — breakpoints
- **Desktop (≥ 1024px):** sidebar fixa à esquerda (240px), conteúdo ocupa o restante
- **Mobile (< 1024px):** sidebar oculta, botão hambúrguer no header abre como Sheet (shadcn)

### Critérios de aceite
- [ ] Sidebar navega corretamente entre as seções
- [ ] Item ativo na sidebar reflete a rota atual
- [ ] Logout encerra sessão e redireciona para `/login`
- [ ] Layout não quebra em mobile
- [ ] Nome do restaurante aparece no header
