# Cardê — Especificação Técnica

> Stack: Next.js 14 App Router · Supabase · Prisma · NextAuth · Stripe · Vercel  
> Perfil: dev solo · MVP · mobile first

---

## Paleta de cores

| Token | Hex | Uso |
|---|---|---|
| `--brand-primary` | `#1A1A2E` | Header, texto principal do admin |
| `--brand-accent` | `#E85D04` | CTAs, badges, destaque de preço |
| `--brand-warm` | `#F7F3EE` | Fundo das páginas do cardápio |
| `--brand-surface` | `#FFFFFF` | Cards, modais |
| `--brand-muted` | `#6B7280` | Descrições, labels secundários |
| `--brand-border` | `#E5E7EB` | Divisores, bordas |
| `--status-success` | `#16A34A` | Disponível, confirmado |
| `--status-warning` | `#D97706` | Pausado |
| `--status-danger` | `#DC2626` | Indisponível, erro |

**Tipografia**

```
Display: 'Playfair Display', serif   → nomes de pratos, títulos
Body:    'Inter', system-ui          → descrições, UI geral
```

**Tailwind config**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1A1A2E',
          accent:  '#E85D04',
          warm:    '#F7F3EE',
          muted:   '#6B7280',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

---

## Estrutura de pastas

```
cardapio-saas/
├── app/
│   ├── (marketing)/              # Landing, preços — sem auth
│   ├── (auth)/                   # Login, cadastro
│   ├── (dashboard)/              # Painel do restaurante — requer auth
│   │   └── layout.tsx            # Sidebar compartilhada
│   ├── menu/
│   │   └── [slug]/               # Cardápio público via QR code
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── itens/
│       ├── upload/
│       └── webhooks/stripe/
│
├── components/
│   ├── ui/                       # Primitivos shadcn — sem lógica de negócio
│   ├── cardapio/                 # Componentes do cardápio público
│   ├── dashboard/                # Componentes do painel admin
│   └── shared/                   # Sem domínio específico
│
├── lib/
│   ├── supabase/                 # Clientes browser + server + storage
│   ├── stripe/                   # Client + definição de planos
│   ├── auth/                     # Config NextAuth
│   ├── image/                    # Compressão antes do upload
│   └── env.ts                    # Acesso centralizado às env vars
│
├── hooks/                        # Hooks customizados por domínio
├── types/                        # Tipos globais e de API
├── prisma/
├── middleware.ts                  # Proteção de rotas
└── .env.local
```

**Regras da estrutura**

- Grupos com `()` definem layouts distintos sem afetar a URL.
- `components/ui/` só contém primitivos sem lógica de negócio.
- `lib/` contém integrações e utilitários puros — sem React, sem hooks.
- `hooks/` encapsulam estado e chamadas de API — componentes nunca fazem fetch direto.
- Nunca importar de `(dashboard)` dentro de `(marketing)` ou vice-versa — domínios não se cruzam.

---

## Mobile first

O público do Cardê acessa o cardápio pelo celular, na mesa do restaurante. O dono também gerencia o painel majoritariamente pelo celular. Toda decisão de UI parte do mobile e expande para desktop, nunca o contrário.

### Breakpoints

```typescript
// Tailwind padrão — sempre construir do menor para o maior
// base  → mobile  (< 640px)  — design principal
// sm    → 640px+             — ajustes pontuais
// md    → 768px+             — tablet
// lg    → 1024px+            — desktop

// ✅ mobile first: base define o layout, md/lg expandem
<div className="flex flex-col md:flex-row">

// ❌ desktop first: lg define o layout, sobrescreve para mobile
<div className="flex flex-row lg:flex-col">
```

### Alvos de toque

Todo elemento interativo tem área mínima de toque de 44×44px (diretriz Apple/Google). Isso inclui botões, toggles, links de navegação e ícones clicáveis.

```typescript
// ✅ área de toque adequada
<button className="min-h-[44px] min-w-[44px] px-4">Pausar item</button>

// ❌ botão pequeno demais para toque preciso
<button className="h-6 w-6"><Icon /></button>
```

### Cardápio público — otimizações obrigatórias

- Imagens com `next/image` usando `sizes` adequado ao viewport mobile
- Fonte carregada com `font-display: swap` para evitar FOIT em conexões lentas
- Nenhum hover state como única indicação visual de interatividade
- Scroll horizontal proibido em qualquer viewport

```typescript
// ✅ imagem responsiva com tamanhos corretos
<Image
  src={item.imagemUrl}
  alt={item.nome}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="w-full object-cover"
/>
```

### Dashboard — navegação mobile

O dashboard usa bottom navigation no mobile (padrão nativo) e sidebar no desktop. Não usar sidebar colapsável como solução mobile — é um padrão de desktop forçado em tela pequena.

```
Mobile  → bottom nav fixo com 4 ícones + labels
Desktop → sidebar fixa na esquerda
```

---

## Arquitetura de componentes

### Server Components vs Client Components

O App Router do Next.js 14 diferencia Server Components (padrão) de Client Components (`'use client'`). A regra é simples: use Server Components por padrão, adicione `'use client'` apenas quando necessário.

**Use Server Components para:**
- Busca de dados (fetch, Prisma)
- Renderização de conteúdo estático ou semi-estático
- Páginas completas que não precisam de interatividade

**Use Client Components apenas para:**
- Estado local (`useState`, `useReducer`)
- Efeitos (`useEffect`)
- Event handlers (`onClick`, `onChange`)
- Acesso a APIs do browser (localStorage, geolocation)
- Hooks do React

```typescript
// ✅ Server Component — busca dados no servidor, sem overhead de JS no client
// app/(dashboard)/cardapio/page.tsx
export default async function CardapioPage() {
  const itens = await prisma.item.findMany({ where: { restauranteId: ... } })
  return <ListaItens itens={itens} />
}

// ✅ Client Component — só onde há interatividade
// components/dashboard/ToggleDisponivel.tsx
'use client'
export function ToggleDisponivel({ itemId, disponivel }: Props) {
  const [ativo, setAtivo] = useState(disponivel)
  // ...
}
```

### Composição: Server wraps Client

Um Server Component pode renderizar um Client Component, mas não o contrário para dados do servidor. Use esse padrão para manter o máximo de lógica no servidor.

```typescript
// ✅ Server Component passa dados para Client Component
// app/(dashboard)/cardapio/page.tsx (Server)
export default async function Page() {
  const categorias = await buscarCategorias()
  return <FormularioItem categorias={categorias} /> // Client Component
}

// ❌ não buscar dados dentro de Client Component quando pode ser Server
'use client'
export function FormularioItem() {
  const [categorias, setCategorias] = useState([])
  useEffect(() => { fetch('/api/categorias').then(...) }, []) // desnecessário
}
```

### Estrutura de um componente

```typescript
// Ordem consistente em todos os componentes:
// 1. Imports externos
// 2. Imports internos
// 3. Tipos
// 4. Constantes locais (se houver)
// 5. Componente
// 6. Export

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatarMoeda } from '@/lib/utils'
import type { Item } from '@/types'

interface ItemCardProps {
  item: Item
  onEditar: (id: string) => void
  onToggle: (id: string, disponivel: boolean) => void
}

export function ItemCard({ item, onEditar, onToggle }: ItemCardProps) {
  // ...
}
```

---

## Padrões recomendados

### Validação com Zod em todas as API routes

Nunca confie no corpo da requisição. Valide sempre no servidor, independente de qualquer validação no cliente.

```typescript
import { z } from 'zod'
import { NextResponse } from 'next/server'

const criarItemSchema = z.object({
  nome:        z.string().min(2).max(100),
  preco:       z.number().positive(),
  categoriaId: z.string().cuid(),
  descricao:   z.string().max(500).optional(),
})

export async function POST(req: Request) {
  const parsed = criarItemSchema.safeParse(await req.json())

  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.flatten() },
      { status: 400 }
    )
  }
  // parsed.data tem tipos garantidos a partir daqui
}
```

### Verificação de ownership em toda mutação

Toda operação que modifica dados precisa verificar que o recurso pertence ao usuário logado. Isso vale para PUT, PATCH e DELETE de qualquer entidade.

```typescript
// lib/auth/ownership.ts
export async function verificarOwnership(
  itemId: string,
  userId: string
): Promise<Item> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { categoria: { include: { restaurante: true } } },
  })

  if (!item || item.categoria.restaurante.donoId !== userId) {
    throw new UnauthorizedError()
  }

  return item
}

// uso em qualquer route de mutação:
const item = await verificarOwnership(params.id, session.user.id)
```

### Variáveis de ambiente com falha explícita na inicialização

```typescript
// lib/env.ts
function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variável de ambiente ausente: ${key}`)
  return value
}

export const env = {
  supabaseUrl:          getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:      getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey:   getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  stripeSecretKey:      getEnv('STRIPE_SECRET_KEY'),
  stripeWebhookSecret:  getEnv('STRIPE_WEBHOOK_SECRET'),
}
```

### Proteção de rotas no middleware, não nas páginas

```typescript
// middleware.ts — única fonte de verdade para proteção de rotas
export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl
      if (pathname.startsWith('/dashboard')) return !!token
      if (pathname.startsWith('/api/itens')) return !!token
      return true
    },
  },
  pages: { signIn: '/login' },
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/itens/:path*', '/api/restaurantes/:path*'],
}
```

### Tipos de resposta de API consistentes

```typescript
// types/api.ts
export type ApiResponse<T> =
  | { sucesso: true;  dados: T }
  | { sucesso: false; erro: string; codigo?: string }

// helper para não repetir o padrão:
export function ok<T>(dados: T): Response {
  return NextResponse.json<ApiResponse<T>>({ sucesso: true, dados })
}

export function erro(mensagem: string, status = 400): Response {
  return NextResponse.json<ApiResponse<never>>(
    { sucesso: false, erro: mensagem },
    { status }
  )
}
```

### Compressão de imagem obrigatória antes do upload

```typescript
// lib/image/compress.ts
import imageCompression from 'browser-image-compression'

const OPCOES = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/webp',  // converte tudo para webp
}

export async function comprimirImagem(file: File): Promise<File> {
  if (file.size < 100 * 1024) return file  // já pequeno, não comprime
  return imageCompression(file, OPCOES)
}
```

### Slugs únicos com fallback automático

```typescript
// lib/restaurante/slug.ts
export async function gerarSlugUnico(nome: string): Promise<string> {
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  let slug = base
  let tentativa = 1

  while (await prisma.restaurante.findUnique({ where: { slug } })) {
    slug = `${base}-${tentativa++}`
  }

  return slug
}
```

---

## Antipadrões a evitar

### 1. Usar Client Component onde Server Component resolve

O erro mais comum no App Router. Client Components aumentam o bundle JS enviado ao browser e perdem as otimizações de server rendering.

```typescript
// ❌ Client Component desnecessário para dados que não mudam em tempo real
'use client'
export function CardapioPage() {
  const [itens, setItens] = useState([])
  useEffect(() => { fetch('/api/itens').then(r => r.json()).then(setItens) }, [])
  return <Lista itens={itens} />
}

// ✅ Server Component — zero JS no cliente para esta página
export default async function CardapioPage() {
  const itens = await prisma.item.findMany(...)
  return <Lista itens={itens} />
}
```

### 2. Misturar lógica de negócio em componentes

```typescript
// ❌ componente acumulando responsabilidades
export function ItemCard({ item }) {
  const preco = item.plano === 'pro' ? item.preco * 0.9 : item.preco
  const slug = item.nome.toLowerCase().replace(/\s+/g, '-')
  const disponivel = item.estoque > 0 && item.ativo
  // mais 20 linhas de lógica...
}

// ✅ lógica isolada, componente só renderiza
import { calcularPreco, gerarSlug, verificarDisponibilidade } from '@/lib/utils'

export function ItemCard({ item }) {
  const preco = calcularPreco(item)
  const disponivel = verificarDisponibilidade(item)
  // componente limpo, testável, previsível
}
```

### 3. Não tratar estados de loading e erro na UI

O usuário do Cardê está no celular, muitas vezes em conexão 4G instável. Ignorar estados intermediários gera uma experiência quebrada.

```typescript
// ❌ sem feedback para o usuário
export function ListaItens() {
  const { itens } = useItens()
  return itens.map(item => <ItemCard key={item.id} item={item} />)
}

// ✅ todos os estados tratados
export function ListaItens() {
  const { itens, isLoading, erro } = useItens()

  if (isLoading) return <SkeletonLista />
  if (erro)      return <ErroEstado mensagem={erro} onRetry={refetch} />
  if (!itens.length) return <EstadoVazio texto="Nenhum item ainda" cta="Adicionar item" />

  return itens.map(item => <ItemCard key={item.id} item={item} />)
}
```

### 4. Ownership sem verificação centralizada

```typescript
// ❌ verificação ad-hoc em cada route — fácil esquecer
export async function DELETE(req, { params }) {
  // sem nenhuma verificação de ownership
  await prisma.item.delete({ where: { id: params.id } })
}

// ❌ verificação duplicada e inconsistente entre routes
const item = await prisma.item.findUnique({ where: { id: params.id } })
if (item?.restauranteId !== session.restauranteId) ...  // lógica diferente em cada lugar

// ✅ função centralizada, reutilizada em todas as routes de mutação
const item = await verificarOwnership(params.id, session.user.id)
await prisma.item.delete({ where: { id: item.id } })
```

### 5. Upload sem validação dupla (client + server)

```typescript
// ❌ só validar no client — qualquer requisição direta à API bypassa
const handleUpload = (file: File) => {
  if (file.size > MAX) return setErro('Arquivo grande demais')
  await fetch('/api/upload', { body: file })  // API aceita qualquer coisa
}

// ✅ validar nos dois lados — client para UX rápida, server como garantia
// client: feedback imediato
if (file.size > MAX_TAMANHO || !TIPOS_PERMITIDOS.includes(file.type)) {
  setErro('Arquivo inválido')
  return
}

// server: nunca confiar no client
export async function POST(req: Request) {
  const file = (await req.formData()).get('imagem') as File
  if (file.size > MAX_TAMANHO || !TIPOS_PERMITIDOS.includes(file.type)) {
    return erro('Arquivo inválido')
  }
}
```

### 6. Mutations sem feedback otimista em mobile

Em mobile com conexão instável, esperar a resposta do servidor antes de atualizar a UI gera uma experiência travada. Para ações simples e reversíveis como pausar/ativar um item, use atualização otimista.

```typescript
// ❌ usuário fica olhando para um spinner por 1-2 segundos
async function toggleDisponivel(id: string) {
  setLoading(true)
  await fetch(`/api/itens/${id}/disponibilidade`, { method: 'PATCH' })
  await refetch()
  setLoading(false)
}

// ✅ UI atualiza imediatamente, reverte se falhar
async function toggleDisponivel(id: string, disponivel: boolean) {
  setItens(prev => prev.map(i =>
    i.id === id ? { ...i, disponivel: !disponivel } : i
  ))

  try {
    await fetch(`/api/itens/${id}/disponibilidade`, { method: 'PATCH' })
  } catch {
    // reverte em caso de erro
    setItens(prev => prev.map(i =>
      i.id === id ? { ...i, disponivel } : i
    ))
    toast.error('Não foi possível atualizar. Tente novamente.')
  }
}
```

### 7. `any` no TypeScript

```typescript
// ❌ any desliga o sistema de tipos — erros só aparecem em runtime
async function processarWebhook(evento: any) {
  await atualizarPlano(evento.data.object.customer)
}

// ✅ tipos explícitos — erros aparecem em tempo de compilação
import type Stripe from 'stripe'

async function processarWebhook(evento: Stripe.CustomerSubscriptionUpdatedEvent) {
  await atualizarPlano(evento.data.object.customer as string)
}
```

### 8. Queries N+1 no Prisma

```typescript
// ❌ N+1: 1 query para categorias + N queries para os itens de cada categoria
const categorias = await prisma.categoria.findMany({ where: { restauranteId } })
for (const cat of categorias) {
  cat.itens = await prisma.item.findMany({ where: { categoriaId: cat.id } })
}

// ✅ uma única query com include
const categorias = await prisma.categoria.findMany({
  where: { restauranteId },
  include: { itens: { where: { disponivel: true }, orderBy: { ordem: 'asc' } } },
  orderBy: { ordem: 'asc' },
})
```

---

## Variáveis de ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # nunca expor no client

# Banco
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=                  # openssl rand -base64 32
NEXTAUTH_URL=                     # https://seudominio.com.br em produção

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRO_MENSAL=
STRIPE_PRICE_PREMIUM_MENSAL=
```

> `.env.local` nunca entra no git. Configure as vars diretamente no painel do Vercel em produção.
