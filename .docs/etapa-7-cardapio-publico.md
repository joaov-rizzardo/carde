# Etapa 7 — Cardápio público

## What

Página pública do cardápio — o que o cliente final vê ao escanear o QR code. Sem login, sem app, funciona em qualquer celular.

**Entregáveis:**
- Página `/menu/[slug]` acessível publicamente
- Header com logo e nome do restaurante
- Navegação por categorias com âncoras na página
- Cards de item com foto, nome, descrição e preço
- Layout responsivo otimizado para mobile
- 404 para slug inválido ou restaurante inativo
- Deve ser uma página bonita e visualmente agradável

---

## Why

Esta é a página mais importante do produto — é o que os clientes dos restaurantes vão usar. Todas as outras etapas existem para alimentar esta tela. Decisões técnicas críticas:

- **SSR (Server-Side Rendering)** — o cardápio é indexável por mecanismos de busca e carrega rápido mesmo em conexões lentas, sem depender de JavaScript para renderizar o conteúdo
- **Sem autenticação** — qualquer pessoa com o link (ou QR code) deve poder ver o cardápio; exigir login destruiria a experiência
- **Filtra `disponivel: false`** — itens pausados não devem aparecer para o cliente; o dono gerencia isso no dashboard
- **Cor primária aplicada na UI** — cada restaurante tem sua identidade visual; o cardápio deve refletir isso, não ser genérico
- **404 para slug inválido ou restaurante inativo** — protege contra links quebrados e restaurantes que cancelaram o plano

---

## How

### Rota
`/menu/[slug]` — parâmetro dinâmico, renderizado no servidor

### Query do servidor
```ts
// app/menu/[slug]/page.tsx (Server Component)
const restaurante = await prisma.restaurante.findUnique({
  where: { slug, ativo: true },
  include: {
    categorias: {
      orderBy: { ordem: 'asc' },
      include: {
        itens: {
          where: { disponivel: true },
          orderBy: { ordem: 'asc' },
        },
      },
    },
  },
})

if (!restaurante) notFound()
```

### UI — layout da página

```
┌──────────────────────────────────────┐
│  [logo]   Nome do Restaurante        │  ← header com corPrimaria
└──────────────────────────────────────┘

  [ Entradas ] [ Pratos ] [ Bebidas ]   ← nav sticky por categoria

── Entradas ────────────────────────────
┌────────┬─────────────────────────────┐
│ [foto] │ Bruschetta          R$ 18   │
│        │ Pão tostado com tomate      │
└────────┴─────────────────────────────┘

── Pratos Principais ───────────────────
┌────────┬─────────────────────────────┐
│ [foto] │ Frango Grelhado     R$ 42   │
│        │ Acompanha arroz e salada    │
└────────┴─────────────────────────────┘
```

### Âncoras de navegação
```html
<nav>
  <a href="#entradas">Entradas</a>
  <a href="#pratos-principais">Pratos Principais</a>
</nav>

<section id="entradas">...</section>
<section id="pratos-principais">...</section>
```

### Aplicação da cor primária
```css
/* CSS variable injetada no servidor */
:root { --cor-primaria: #E85D04; }

/* Usada em: header background, links ativos, bordas de destaque */
```

### SEO e performance
- `<title>{restaurante.nome} — Cardápio</title>`
- `<meta name="description">` com descrição do restaurante
- Imagens com `next/image` para otimização automática
- Nenhum estado client-side no carregamento inicial

### Critérios de aceite
- [ ] Página carrega sem login
- [ ] Itens pausados não aparecem
- [ ] Slug inválido ou restaurante inativo retorna 404
- [ ] Navegação por categorias (âncoras) funciona no mobile
- [ ] Cor primária do restaurante aplicada na UI
