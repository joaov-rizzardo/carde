# Etapa 1 — Autenticação

## What

Sistema de criação de conta e login para o dono do restaurante. É a porta de entrada para todo o dashboard.

**Entregáveis:**
- Página `/login` com formulário de entrada
- Página `/cadastro` com criação de conta
- Redirecionamento para `/dashboard` após autenticação bem-sucedida
- Redirecionamento para `/login` ao tentar acessar rota protegida sem sessão
- Sessão persistida entre recarregamentos

---

## Why

Nenhuma outra feature do dashboard pode ser acessada sem identificação do usuário. A autenticação define:

- **Quem é o dono** — toda entidade (restaurante, categoria, item) é escopo pelo usuário autenticado
- **Segurança por padrão** — o middleware bloqueia rotas protegidas antes de qualquer lógica de negócio
- **Magic link ou OAuth** — remove a necessidade de gerenciar senhas, reduzindo fricção no cadastro e risco de segurança

---

## How

### Schema
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  nome      String?
  criadoEm DateTime @default(now())
}
```

### API
| Método | Rota | Responsabilidade |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | Gerenciado pelo NextAuth (magic link ou Google OAuth) |

### Fluxo de autenticação
1. Usuário acessa `/login`
2. Informa e-mail → NextAuth envia magic link **ou** clica em "Entrar com Google"
3. Após callback bem-sucedido, NextAuth cria/recupera o `User` no banco via adapter Prisma
4. Sessão JWT armazenada em cookie httpOnly
5. Middleware verifica sessão em cada request para rotas protegidas

### UI
- `/login` — campo de e-mail + botão magic link + botão Google OAuth
- `/cadastro` — pode redirecionar para `/login` (o cadastro acontece implicitamente no primeiro login)
- Layout simples, centrado, com logo do Cardê

### Critérios de aceite
- [ ] Usuário consegue criar conta com e-mail (magic link)
- [ ] Usuário consegue fazer login
- [ ] Rota `/dashboard` redireciona para `/login` sem sessão
- [ ] Sessão persiste após recarregar a página
