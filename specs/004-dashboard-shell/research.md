# Research: Dashboard Shell

**Feature**: Dashboard Shell | **Date**: 2026-06-15

## 1. Sidebar vs. Bottom Navigation no mobile

**Decision**: Bottom navigation fixa no mobile (< 768px); sidebar fixa no desktop (≥ 768px).

**Rationale**: A constituição do projeto proíbe sidebar colapsável como solução mobile e explicita o padrão bottom nav + sidebar. O spec original mencionou sidebar colapsável, mas a constituição tem precedência — já corrigido na spec.

**Alternatives considered**: Sidebar colapsável (drawer) — rejeitada pela constituição; Navigation rail — fora do padrão estabelecido.

---

## 2. Busca de dados no layout

**Decision**: `(dashboard)/layout.tsx` como Server Component busca `restaurante.nome` diretamente via Prisma, sem passar por API route.

**Rationale**: A constituição diz "Busca de dados, renderização de conteúdo estático ou semi-estático e páginas sem interatividade ficam sempre em Server Components." O layout é renderizado no servidor — não há motivo para usar hook ou fetch de API quando Prisma está disponível diretamente. Reduz latência, elimina waterfall de fetch, e evita `'use client'` desnecessário.

**Alternatives considered**: `useRestaurante()` hook (rejeitado — exigiria `'use client'` no layout); fetch de `GET /api/restaurantes/me` no client (rejeitado — mesmo motivo); React cache para deduplicate (não necessário, layout carrega uma vez por request).

---

## 3. Compartilhamento da config de nav items

**Decision**: `src/components/dashboard/nav-items.ts` — arquivo TS puro com array de itens de navegação exportado, importado por `sidebar.tsx` e `bottom-nav.tsx`.

**Rationale**: Sidebar e bottom-nav renderizam os mesmos itens. Manter em um único arquivo evita duplicação e garante consistência (mesmo label, href, ícone). Não é lógica de negócio — é config de UI — então fica em `components/dashboard/`, não em `lib/`.

**Alternatives considered**: Duplicar nos dois componentes (rejeitado — violaria DRY e criaria dessincronização fácil).

---

## 4. Active state com `usePathname()`

**Decision**: `sidebar.tsx` e `bottom-nav.tsx` são Client Components que usam `usePathname()` do `next/navigation` para determinar o item ativo.

**Rationale**: Active state depende da URL atual, que só está disponível no cliente via hook ou no servidor via `headers()`. `usePathname()` é a solução idiomática do Next.js App Router para este caso e justifica `'use client'`. Verificação de active usa `pathname.startsWith(item.href)` para suportar sub-rotas (ex: `/dashboard/cardapio/novo` ativa "Cardápio").

**Alternatives considered**: Server-side `headers()` com `x-pathname` header customizado (mais complexo, requer configuração de middleware extra, rejeitado); `Link` com `useSelectedLayoutSegment()` (mais verboso para este caso, rejeitado).

---

## 5. Logout

**Decision**: `user-menu.tsx` Client Component chama `signOut({ callbackUrl: '/login' })` do `next-auth/react`.

**Rationale**: `signOut` é uma função client-side do next-auth que invalida o cookie/token JWT e redireciona. Não há equivalente server-action seguro sem implicar em mais complexidade. O `callbackUrl: '/login'` garante o redirecionamento pós-logout conforme FR-005.

**Alternatives considered**: Server Action que chame `auth.signOut()` (next-auth v4 não tem equivalente limpo para server actions; v5 sim, mas não é o que o projeto usa).

---

## 6. Loading state com `loading.tsx`

**Decision**: `(dashboard)/loading.tsx` na raiz do route group, usando Suspense implícito do Next.js App Router.

**Rationale**: Next.js App Router cria automaticamente um `<Suspense>` boundary em torno de cada página quando `loading.tsx` existe no mesmo diretório (ou parent). Isso cobre 100% das navegações entre seções sem precisar adicionar Suspense manualmente em cada página. Satisfaz FR-008 e SC-005.

**Alternatives considered**: Suspense manual em cada página (mais verboso, fácil de esquecer em páginas futuras, rejeitado); NProgress bar (biblioteca extra, overkill para MVP, rejeitado).

---

## 7. Prevenção de scroll horizontal

**Decision**: Container raiz usa `overflow-hidden` no `h-screen` wrapper; área de conteúdo usa `overflow-y-auto`; nenhuma largura fixa em elementos de navegação.

**Rationale**: Scroll horizontal é proibido pela constituição. Usar `overflow-hidden` no wrapper raiz e `min-w-0` no container de conteúdo (para respeitar flex layout corretamente) previne extravasamento horizontal de conteúdo filho.

**Alternatives considered**: `overflow-x-hidden` global no body (já tem no Tailwind base mas não é suficiente se elementos filhos quebrarem o layout).

---

## 8. Placeholder para sub-rotas não implementadas (Etapas 4–8)

**Decision**: Criar páginas placeholder `src/app/(dashboard)/dashboard/cardapio/page.tsx`, `categorias/page.tsx`, `configuracoes/page.tsx` com estado vazio que indica "em breve".

**Rationale**: Os links de navegação precisam apontar para rotas válidas para que o active state funcione. Rotas que retornam 404 quebram a UX e podem causar redirecionamentos inesperados do middleware. Páginas placeholder simples garantem navegação funcional desde o início.

**Alternatives considered**: Links desabilitados na sidebar (UX ruim — não dá feedback de "onde estou", rejeitado); hash links `#cardapio` (não funciona com o active state baseado em `usePathname()`, rejeitado).
