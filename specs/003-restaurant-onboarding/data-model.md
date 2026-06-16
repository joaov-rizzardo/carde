# Data Model: Onboarding do Restaurante

**Feature**: 003-restaurant-onboarding | **Date**: 2026-06-15

---

## Entidades

### Restaurante

Representa o negócio cadastrado no Cardê. Cada `User` tem no máximo um `Restaurante` (enforced por `donoId @unique`).

```prisma
model Restaurante {
  id           String   @id @default(cuid())
  slug         String   @unique
  nome         String
  descricao    String?
  corPrimaria  String   @default("#E85D04")
  logoUrl      String?
  ativo        Boolean  @default(true)
  donoId       String   @unique
  dono         User     @relation(fields: [donoId], references: [id])
  criadoEm    DateTime  @default(now())
  atualizadoEm DateTime @updatedAt
}
```

**Adição no model User**:
```prisma
model User {
  // ... campos existentes ...
  restaurante  Restaurante?
}
```

### Campos

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `String` (cuid) | Gerado automaticamente; imutável |
| `slug` | `String @unique` | Gerado de `nome` via `gerarSlugUnico()`; imutável no MVP; URL-safe (`[a-z0-9-]+`) |
| `nome` | `String` | Obrigatório; mínimo 2 caracteres; máximo 100 caracteres |
| `descricao` | `String?` | Opcional; não exposto no onboarding (etapa futura) |
| `corPrimaria` | `String` | Hex de 6 dígitos (`#rrggbb`); padrão `#E85D04`; validado por Zod com `.regex(/^#[0-9a-fA-F]{6}$/)` |
| `logoUrl` | `String?` | Opcional; não exposto no onboarding (etapa futura) |
| `ativo` | `Boolean` | Padrão `true`; não exposto no onboarding |
| `donoId` | `String @unique` | FK para `User.id`; `@unique` garante 1 restaurante/usuário no banco |
| `criadoEm` | `DateTime` | Gerado automaticamente |
| `atualizadoEm` | `DateTime` | Atualizado automaticamente via `@updatedAt` |

---

## Validação (Zod — servidor)

```ts
// Esquema de criação (POST /api/restaurantes)
const criarRestauranteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  corPrimaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida')
    .default('#E85D04'),
})
```

---

## Extensão do JWT

O campo `restauranteId` é adicionado ao token JWT para que o middleware Edge possa tomar decisões de roteamento sem acesso ao banco.

```ts
// types/next-auth.d.ts (adição)
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    restauranteId?: string | null   // null = usuário sem restaurante
  }
}
```

**Ciclo de vida do campo**:
- Preenchido no callback `jwt` quando `user` (primeiro login) ou `trigger === 'update'` (após criação do restaurante)
- `null` = usuário autenticado sem restaurante → middleware redireciona para `/onboarding`
- `string` (id) = usuário com restaurante → middleware permite acesso ao dashboard

---

## Relacionamentos

```
User 1 ──── 0..1 Restaurante
       donoId @unique
```

- Um `User` pode ter zero ou um `Restaurante`
- Um `Restaurante` pertence a exatamente um `User`
- Tentativa de criar segundo restaurante para o mesmo usuário falha com `P2002` do Prisma (unique constraint `donoId`) → API retorna `{ sucesso: false, erro: "Restaurante já existe", codigo: "RESTAURANTE_JA_EXISTE" }`

---

## Estado de Navegação

O estado do restaurante determina o fluxo de navegação:

```
Token JWT { restauranteId: null }
  → Qualquer rota /dashboard/* → redirect /onboarding
  → Acesso a /onboarding → permitido

Token JWT { restauranteId: "clxxx..." }
  → Acesso a /onboarding → redirect /dashboard
  → Qualquer rota /dashboard/* → permitido

Sem token
  → Qualquer rota protegida → redirect /login
```

---

## Estratégia de Migração

1. Adicionar `Restaurante` ao `schema.prisma` com os campos definidos acima
2. Adicionar `restaurante Restaurante?` ao model `User`
3. Gerar migration: `npx prisma migrate dev --name add-restaurante`
4. Gerar client: `npx prisma generate`
5. Fazer deploy da migration no Supabase via `npx prisma migrate deploy`
