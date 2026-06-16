# Middleware Contract: Roteamento por Estado de Restaurante

**Feature**: 003-restaurant-onboarding | **Date**: 2026-06-15

---

## Visão Geral

O `middleware.ts` é substituído por uma função customizada que usa `getToken()` para ler `restauranteId` do JWT em Edge Runtime (sem Prisma). Isso substitui o export direto de `next-auth/middleware` da Etapa 1.

---

## Tabela de Decisão

| Rota | Token presente? | `restauranteId` no token | Ação |
|---|---|---|---|
| `/dashboard/*` | Não | — | Redirect → `/login` |
| `/dashboard/*` | Sim | `null` | Redirect → `/onboarding` |
| `/dashboard/*` | Sim | `string` | `NextResponse.next()` |
| `/onboarding/*` | Não | — | Redirect → `/login` |
| `/onboarding/*` | Sim | `null` | `NextResponse.next()` |
| `/onboarding/*` | Sim | `string` | Redirect → `/dashboard` |

---

## Matcher

```ts
export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}
```

Rotas públicas (`/`, `/login`, `/cadastro`, `/api/*`) não são interceptadas pelo middleware.

---

## Interface do Token Estendido

```ts
// O middleware lê estes campos do JWT via getToken()
type MiddlewareToken = {
  id: string
  restauranteId?: string | null
  // campos padrão NextAuth: name, email, picture, sub, iat, exp, jti
}
```

---

## Atualização do JWT Callback

O campo `restauranteId` é populado em dois momentos no callback `jwt` do NextAuth:

1. **Primeiro login** (`user` presente no callback): busca restaurante do novo usuário (geralmente `null` para usuários novos)
2. **Após criação do restaurante** (`trigger === 'update'`): re-busca e popula `restauranteId`

```ts
async jwt({ token, user, trigger }) {
  if (user) {
    token.id = user.id
  }
  if (user || trigger === 'update') {
    const restaurante = await prisma.restaurante.findUnique({
      where: { donoId: token.id as string },
      select: { id: true },
    })
    token.restauranteId = restaurante?.id ?? null
  }
  return token
}
```

**Trigger da atualização**: após POST bem-sucedido em `/api/restaurantes`, o hook `useCriarRestaurante()` chama `update()` de `useSession()` antes de redirecionar para `/dashboard`.

---

## Fluxo Completo: Primeiro Acesso Pós-Login

```
1. Usuário faz login (magic link ou Google)
2. NextAuth cria sessão JWT com restauranteId: null
3. Usuário é redirecionado para / ou /dashboard (comportamento padrão NextAuth)
4. Middleware intercepta /dashboard → restauranteId: null → redirect /onboarding
5. Usuário preenche formulário e submete
6. POST /api/restaurantes → restaurante criado no DB
7. Cliente chama update() → JWT callback re-busca → restauranteId: "clxxx..."
8. Cliente redireciona para /dashboard
9. Middleware intercepta /dashboard → restauranteId: "clxxx..." → NextResponse.next()
10. Dashboard renderiza normalmente
```

---

## Fluxo: Usuário com Restaurante Tentando Acessar /onboarding

```
1. Usuário acessa /onboarding diretamente
2. Middleware intercepta /onboarding → restauranteId: "clxxx..." → redirect /dashboard
3. Dashboard renderiza normalmente
```

---

## Fluxo: Sessão Expirada Durante Onboarding

```
1. Usuário está no formulário /onboarding
2. Sessão expira (7 dias por padrão)
3. Usuário submete formulário → POST /api/restaurantes → 401 Unauthorized
4. Hook useCriarRestaurante() recebe erro → exibe mensagem "Sessão expirada. Faça login novamente."
5. Usuário clica em "Fazer login" → /login
6. Middleware intercepta /onboarding com token expirado → redirect /login
```
