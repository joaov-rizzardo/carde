# Etapa 0 — Fundação do projeto

## What

Infraestrutura base do projeto. Não é uma feature de negócio — é o alicerce sem o qual nenhuma outra etapa funciona.

**Entregáveis:**
- Projeto Next.js 14 com App Router e TypeScript inicializado
- Tailwind CSS, shadcn/ui e fontes configurados (Inter + Playfair Display)
- Supabase conectado (banco de dados + storage)
- Prisma configurado com schema inicial vazio
- `lib/env.ts` com validação de variáveis de ambiente
- `middleware.ts` com matcher das rotas protegidas
- Deploy funcional na Vercel com domínio temporário

---

## Why

Sem esta fundação, nenhuma feature pode ser construída. O objetivo é eliminar todos os riscos de infraestrutura antes de escrever qualquer lógica de negócio:

- **Next.js 14 App Router** — modelo mental de layout aninhado, Server Components e Route Handlers que toda a equipe vai usar
- **Supabase** — provedor de banco de dados PostgreSQL e storage de arquivos; precisa estar conectado cedo para validar permissões e variáveis de ambiente
- **Prisma** — ORM type-safe; o schema vazio garante que as migrações subsequentes partem de um estado limpo e rastreável
- **Validação de env na inicialização** — falha rápido em vez de erros silenciosos em produção
- **Deploy na Vercel desde o início** — garante que a pipeline de CI/CD funciona antes de haver código crítico, não na véspera do lançamento

---

## How

### Stack
| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilo | Tailwind CSS + shadcn/ui |
| Banco | Supabase PostgreSQL via Prisma |
| Storage | Supabase Storage |
| Deploy | Vercel |

### Passos de implementação

1. `npx create-next-app@latest --typescript --tailwind --app --src-dir` Obs o projeto deve ser criado no diretório atual, sem subdiretórios
2. Instalar e configurar shadcn/ui (`npx shadcn-ui@latest init`)
3. Adicionar fontes via `next/font`: Inter (corpo) + Playfair Display (títulos)
4. Criar projeto no Supabase e copiar as credenciais
5. Instalar Prisma (`npm install prisma @prisma/client`) e inicializar (`npx prisma init`)
6. Configurar `DATABASE_URL` apontando para o Supabase
7. Criar `lib/env.ts` usando `zod` para validar todas as variáveis de ambiente na inicialização
8. Criar `middleware.ts` com `matcher` cobrindo `/dashboard/:path*` e `/onboarding`
9. Commit inicial + deploy na Vercel via integração GitHub

### Variáveis de ambiente necessárias
```
NEXTAUTH_SECRET
NEXTAUTH_URL
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Critérios de aceite
- [ ] `npm run dev` sobe sem erros
- [ ] Variáveis de ambiente validadas na inicialização (erro claro se faltarem)
- [ ] Conexão com Supabase verificada
