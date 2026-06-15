# Data Model: Autenticação do Dono

**Phase**: 1 — Design | **Date**: 2026-06-14

---

## Entidades

### User

Representa o dono do restaurante autenticado. É o modelo central do sistema — todas as outras entidades (Restaurante, Cardápio) têm `userId` como FK.

| Campo | Tipo | Restrições | Notas |
|-------|------|------------|-------|
| `id` | `String` | PK, `@default(cuid())` | Gerado automaticamente |
| `name` | `String?` | Nullable | Preenchido no cadastro; null para OAuth sem nome explícito |
| `email` | `String` | `@unique` | Normalizado (lowercase, trim) antes de persistir |
| `emailVerified` | `DateTime?` | Nullable | Preenchido pelo NextAuth após verificação de magic link |
| `image` | `String?` | Nullable | URL da foto do Google OAuth (quando aplicável) |
| `termosAceitos` | `Boolean` | `@default(false)` | LGPD: marcado ao criar conta via `/cadastro` |
| `termosAceitosEm` | `DateTime?` | Nullable | Timestamp do aceite dos termos |
| `criadoEm` | `DateTime` | `@default(now())` | Imutável após criação |
| `atualizadoEm` | `DateTime` | `@updatedAt` | Atualizado automaticamente pelo Prisma |

**Relações**:
- `accounts Account[]` — contas OAuth vinculadas (Google)
- `restaurante Restaurante?` — one-to-one (MVP: um dono = um restaurante)

**Regras de validação**:
- E-mail normalizado antes de salvar: `email.trim().toLowerCase()`
- `termosAceitos = true` obrigatório para usuários criados via `/cadastro` antes de completar autenticação
- Usuários criados via Google OAuth têm `termosAceitos = false` por padrão (tratar em onboarding futuro)

**Estado inicial**: Criado pelo NextAuth Prisma Adapter na primeira autenticação bem-sucedida.

---

### Account

Representa um provedor OAuth vinculado ao usuário (Google). Gerenciado inteiramente pelo NextAuth Prisma Adapter — não é manipulado diretamente pela aplicação.

| Campo | Tipo | Restrições | Notas |
|-------|------|------------|-------|
| `id` | `String` | PK, `@default(cuid())` | |
| `userId` | `String` | FK → User.id | Cascade delete |
| `type` | `String` | | Sempre `"oauth"` para Google |
| `provider` | `String` | | `"google"` |
| `providerAccountId` | `String` | `@@unique([provider, providerAccountId])` | ID da conta no provedor |
| `refresh_token` | `String?` | `@db.Text` | Token de refresh do Google |
| `access_token` | `String?` | `@db.Text` | Token de acesso do Google |
| `expires_at` | `Int?` | | Unix timestamp de expiração |
| `token_type` | `String?` | | `"bearer"` |
| `scope` | `String?` | | Escopos autorizados |
| `id_token` | `String?` | `@db.Text` | JWT do OpenID Connect |
| `session_state` | `String?` | | Estado da sessão OAuth |

---

### VerificationToken

Armazena tokens de magic link gerados pelo NextAuth. Expiram após 24h (default do NextAuth). Gerenciado pelo adapter.

| Campo | Tipo | Restrições | Notas |
|-------|------|------------|-------|
| `identifier` | `String` | `@@unique([identifier, token])` | E-mail do usuário |
| `token` | `String` | `@unique` | Token aleatório (hash SHA-256) |
| `expires` | `DateTime` | | Expiração do token (24h após emissão) |

---

### PendingSignup

Armazenamento temporário de nome e consentimento LGPD entre o submit do `/cadastro` e a criação efetiva do User (que acontece no callback do magic link). Deletado após uso em `events.createUser`.

| Campo | Tipo | Restrições | Notas |
|-------|------|------------|-------|
| `id` | `String` | PK, `@default(cuid())` | |
| `email` | `String` | `@unique` | E-mail normalizado (lowercase, trim) |
| `nome` | `String` | | Nome informado em `/cadastro` |
| `termosAceitos` | `Boolean` | | Sempre `true` — Server Action bloqueia submit sem checkbox |
| `criadoEm` | `DateTime` | `@default(now())` | Para limpeza de registros antigos (cron job futuro) |

**Ciclo de vida**:
1. Criado/atualizado pelo Server Action de `/cadastro` antes de enviar magic link
2. Lido e deletado em `nextAuthConfig.events.createUser` quando o usuário confirma o magic link
3. Registros com mais de 48h podem ser limpos por job periódico (pós-MVP)

---

## Prisma Schema (Diferencial)

```prisma
// Adicionar ao prisma/schema.prisma

model User {
  id               String    @id @default(cuid())
  name             String?
  email            String    @unique
  emailVerified    DateTime?
  image            String?
  termosAceitos    Boolean   @default(false)
  termosAceitosEm  DateTime?
  criadoEm         DateTime  @default(now())
  atualizadoEm     DateTime  @updatedAt
  accounts         Account[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model PendingSignup {
  id            String   @id @default(cuid())
  email         String   @unique
  nome          String
  termosAceitos Boolean
  criadoEm      DateTime @default(now())
}
```

---

## Relações e Constraints

```
User 1 ←──── ∞ Account   (um usuário pode ter múltiplas contas OAuth — spec: contas separadas por e-mail)
User 1 ←──── 1 Restaurante  (MVP: one-to-one, adicionado na feature de onboarding)
```

---

## Fluxo de Estado do Usuário

```
[Novo visitante]
    │
    ├─ /cadastro → PendingSignup criado → magic link enviado
    │                                          │
    │                                   [Clica no link]
    │                                          │
    │                                   User criado (NextAuth adapter)
    │                                   + events.createUser aplica PendingSignup
    │                                   + PendingSignup deletado
    │                                          │
    │                               [User.termosAceitos = true]
    │
    └─ /login → magic link enviado OU Google OAuth
                                   │
                               [User já existe]
                               Sessão JWT criada (7 dias)
                                   │
                            [Redirect → /dashboard]
```

---

## Normalização de E-mail

Todos os pontos de entrada que recebem e-mail do usuário normalizam antes de processar:

```typescript
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
```

Aplicado em:
- Server Action de `/login` (antes de chamar `signIn('email', ...)`)
- Server Action de `/cadastro` (antes de verificar existência e criar PendingSignup)
- Não necessário na resposta do Google OAuth (NextAuth normaliza internamente)
