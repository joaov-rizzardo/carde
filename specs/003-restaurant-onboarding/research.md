# Research: Onboarding do Restaurante

**Feature**: 003-restaurant-onboarding | **Date**: 2026-06-15

---

## Decisão 1: Geração de Slug

**Decision**: Implementar `gerarSlug(nome)` como função pura + `gerarSlugUnico(nome, prisma)` como wrapper async com retry DB.

**Rationale**: A função pura (sem DB) serve dois propósitos: preview em tempo real no cliente (sem request de rede) e como base da função com DB. A função com DB usa o padrão de retry com sufixo numérico (`-2`, `-3`, ...) consultando `prisma.restaurante.findUnique({ where: { slug } })` antes de tentar o `create`. Isso é seguro para o MVP onde colisões são raras; para escala maior usaria-se um índice único com retry no `catch`.

**Implementation**:
```ts
// lib/restaurante/slug.ts
export function gerarSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')      // remove special chars
    .trim()
    .replace(/\s+/g, '-')              // spaces to hyphens
    .replace(/-+/g, '-')               // collapse multiple hyphens
}

export async function gerarSlugUnico(nome: string, prisma: PrismaClient): Promise<string> {
  const base = gerarSlug(nome)
  let slug = base
  let tentativa = 2
  while (await prisma.restaurante.findUnique({ where: { slug } })) {
    slug = `${base}-${tentativa++}`
  }
  return slug
}
```

**Alternatives considered**:
- `slugify` npm package — rejeitado por adicionar dependência desnecessária quando `normalize('NFD')` + regex resolve o caso de uso (português com acentos)
- Retry no `catch` do `create` (constraint violation) — rejeitado porque race conditions em produção produziriam ruído nos logs; pre-check é mais claro no MVP

---

## Decisão 2: Middleware com JWT em Edge Runtime

**Decision**: Substituir o `export { default } from 'next-auth/middleware'` por um `withAuth` customizado usando `getToken()` para ler `restauranteId` do JWT sem acesso ao banco.

**Rationale**: Prisma Client não funciona em Edge Runtime. `getToken()` de `next-auth/jwt` lê e descriptografa o JWT do cookie usando apenas `NEXTAUTH_SECRET` — zero DB. Isso permite ao middleware tomar decisões de roteamento com base em `token.restauranteId` sem latência de DB.

**Implementation**:
```ts
// middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const temRestaurante = !!token.restauranteId

  if (!temRestaurante && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (temRestaurante && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}
```

**Alternatives considered**:
- `withAuth` callback do NextAuth — rejeitado porque `authorized()` retorna boolean (autorizado/não) sem controle de destino do redirect; impossível redirecionar para `/onboarding` vs `/login` dependendo do estado
- Verificação de restaurante nas páginas via `getServerSession` — rejeitado por violar a constitution ("Proteção de rotas vive exclusivamente em `middleware.ts`")
- Chamada de API interna a partir do middleware — rejeitado por adicionar round-trip em cada request protegido

---

## Decisão 3: Propagação do restauranteId no JWT

**Decision**: Adicionar `restauranteId` ao JWT via callback `jwt` no NextAuth; após criação do restaurante, cliente chama `update()` de `useSession()` para forçar refresh do token.

**Rationale**: O JWT é httpOnly e opaco ao middleware. Para que `getToken()` retorne `restauranteId`, o callback `jwt` deve populá-lo. O callback recebe `trigger: 'update'` quando `useSession().update()` é chamado, momento em que consulta Prisma para buscar o restaurante do usuário. Após `update()` resolver, o cookie JWT está atualizado e o redirect para `/dashboard` passa no middleware.

**Implementation** (adição ao `authConfig`):
```ts
async jwt({ token, user, trigger }) {
  if (user) {
    token.id = user.id
  }
  // Populate restauranteId on first login or after update()
  if (user || trigger === 'update') {
    const restaurante = await prisma.restaurante.findUnique({
      where: { donoId: token.id as string },
      select: { id: true },
    })
    token.restauranteId = restaurante?.id ?? null
  }
  return token
},
```

**Tipo estendido** (`types/next-auth.d.ts`):
```ts
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    restauranteId?: string | null
  }
}
```

**Alternatives considered**:
- Invalidar sessão e forçar novo login após criação — rejeitado por UX horrível
- Armazenar `restauranteId` em cookie separado — rejeitado por violar o princípio de sessão única e segura
- Usar Supabase Realtime para notificar middleware — rejeitado por complexidade desnecessária no MVP

---

## Decisão 4: Color Picker

**Decision**: Native `<input type="color">` com wrapper estilizado em Tailwind. Nenhuma dependência adicional.

**Rationale**: `input[type=color]` é suportado em todos os browsers modernos incluindo Safari mobile (iOS 15+) e Chrome Android. O valor é sempre um hex de 6 dígitos (`#rrggbb`). Suficiente para o MVP; pickers mais sofisticados (opacity, paletas predefinidas) pertencem a iterações futuras.

**Alternatives considered**:
- `react-colorful` — rejeitado por adicionar dependência para algo que o browser já resolve
- shadcn `Popover` com grid de cores fixas — rejeitado por restringir liberdade de escolha do dono do restaurante sem benefício no MVP

---

## Decisão 5: Rota da Página de Onboarding

**Decision**: `app/onboarding/page.tsx` — fora de qualquer route group, sem layout customizado.

**Rationale**: `/onboarding` não compartilha layout com `(marketing)` (sem nav de marketing) nem com `(dashboard)` (sem sidebar). Layout raiz (`app/layout.tsx`) já provê html/body com fontes e providers de sessão. Uma página simples sem layout extra é a solução mais simples.

**Alternatives considered**:
- `app/(onboarding)/onboarding/page.tsx` — rejeitado por adicionar route group desnecessário para uma única página
- Usar layout de `(marketing)` — rejeitado porque `/onboarding` exige autenticação e tem contexto visual diferente do marketing
