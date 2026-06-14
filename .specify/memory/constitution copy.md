# Cardê Constitution

## O que é o Cardê

Cardê é um SaaS de cardápio digital para restaurantes. O restaurante cadastra seus pratos, gera um QR code e coloca na mesa — o cliente escaneia e vê o cardápio direto no celular, sem baixar nenhum aplicativo.

**Proposta de valor:** Cardápio bonito no ar em menos de uma hora, sem precisar de agência, programador ou designer.

**Público primário:** Pequenos restaurantes e lanchonetes com 1 a 3 funcionários na gestão, sem time técnico interno, que sentem dor ao reimprimir cardápios por mudança de preço e querem parecer mais profissionais sem gastar muito.

**O que o Cardê NÃO é:**
- Não é um sistema de PDV (frente de caixa)
- Não é um aplicativo de delivery próprio
- Não substitui sistema de gestão financeira do restaurante
- Não processa pagamentos diretamente (na Fase 2, apenas encaminha o pedido)

---

## Stack Técnica

```
Next.js 14 App Router · Supabase · Prisma · NextAuth · Stripe · Vercel
Perfil: dev solo · MVP · mobile first
```

**Estrutura de pastas obrigatória:**

```
app/
├── (marketing)/          # Landing, preços — sem auth
├── (auth)/               # Login, cadastro
├── (dashboard)/          # Painel do restaurante — requer auth
│   └── layout.tsx        # Sidebar compartilhada
├── menu/[slug]/          # Cardápio público via QR code
└── api/
    ├── auth/[...nextauth]/
    ├── itens/
    ├── upload/
    └── webhooks/stripe/

components/
├── ui/                   # Primitivos shadcn — sem lógica de negócio
├── cardapio/             # Componentes do cardápio público
├── dashboard/            # Componentes do painel admin
└── shared/               # Sem domínio específico

lib/
├── supabase/             # Clientes browser + server + storage
├── stripe/               # Client + definição de planos
├── auth/                 # Config NextAuth
├── image/                # Compressão antes do upload
└── env.ts                # Acesso centralizado às env vars

hooks/                    # Hooks customizados por domínio
types/                    # Tipos globais e de API
prisma/
middleware.ts             # Proteção de rotas — única fonte de verdade
```

**Regras invioláveis da estrutura:**
- Grupos com `()` definem layouts distintos sem afetar a URL.
- `components/ui/` só contém primitivos sem lógica de negócio.
- `lib/` contém integrações e utilitários puros — sem React, sem hooks.
- `hooks/` encapsulam estado e chamadas de API — componentes nunca fazem fetch direto.
- Nunca importar de `(dashboard)` dentro de `(marketing)` ou vice-versa — domínios não se cruzam.

---

## Identidade Visual

### Paleta de Cores

| Token | Hex | Uso |
|---|---|---|
| `brand-primary` | `#1A1A2E` | Header, texto principal do admin |
| `brand-accent` | `#E85D04` | CTAs, badges, destaque de preço |
| `brand-warm` | `#F7F3EE` | Fundo das páginas do cardápio |
| `brand-surface` | `#FFFFFF` | Cards, modais |
| `brand-muted` | `#6B7280` | Descrições, labels secundários |
| `brand-border` | `#E5E7EB` | Divisores, bordas |
| `status-success` | `#16A34A` | Disponível, confirmado |
| `status-warning` | `#D97706` | Pausado |
| `status-danger` | `#DC2626` | Indisponível, erro |

### Tipografia

```
Display: 'Playfair Display', serif   → nomes de pratos, títulos
Body:    'Inter', system-ui          → descrições, UI geral
```

### Tailwind Config

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

## Escopo do MVP

### Features incluídas no MVP

| Feature | Descrição |
|---|---|
| Cardápio visual | Pratos com nome, descrição, preço e foto. Itens organizados por categorias. Página pública otimizada para mobile com identidade visual do restaurante. |
| QR code por mesa | Link público único `carde.app/seu-restaurante`. QR code pronto para imprimir. Sem app no celular do cliente. |
| Painel admin | Interface web: cria e edita itens, organiza categorias, ativa ou pausa pratos, faz upload de fotos, personaliza aparência. |
| Tema personalizado | Restaurante configura logo, cor principal e nome. Cardápio público reflete essa identidade. |
| Multi-idioma | Cardápio exibido em português, inglês e espanhol. |
| Onboarding guiado | Criar conta → nomear restaurante → adicionar primeira categoria → adicionar primeiro prato. Cardápio no ar na primeira sessão. |

### Fora do escopo do MVP (Fase 2+)

Pedidos pelo QR, integração com WhatsApp, disponibilidade por horário, avaliações por prato, analytics, planos/cobrança, multi-unidade, delivery, fidelidade, IA de sugestões, API pública, marketplace de templates.

### Modelo de monetização (referência, não implementar no MVP)

| Plano | Preço | Limites |
|---|---|---|
| Gratuito | R$ 0/mês | Até 20 itens, sem foto, sem tema personalizado |
| Pro | R$ 79/mês | Itens ilimitados, fotos, tema personalizado, analytics |
| Premium | R$ 149/mês | Tudo do Pro + pedidos, WhatsApp, disponibilidade por horário |

---

## Core Principles

### I. Mobile First (NÃO NEGOCIÁVEL)

O público do Cardê acessa o cardápio pelo celular, na mesa do restaurante. O dono também gerencia o painel majoritariamente pelo celular. **Toda decisão de UI parte do mobile e expande para desktop, nunca o contrário.**

**Breakpoints — sempre construir do menor para o maior:**
```typescript
// ✅ mobile first: base define o layout, md/lg expandem
<div className="flex flex-col md:flex-row">

// ❌ desktop first: proibido
<div className="flex flex-row lg:flex-col">
```

**Touch targets — mínimo 44×44px em todo elemento interativo:**
```typescript
// ✅ correto
<button className="min-h-[44px] min-w-[44px] px-4">Pausar item</button>

// ❌ proibido
<button className="h-6 w-6"><Icon /></button>
```

**Navegação — bottom nav no mobile, sidebar no desktop:**
```
Mobile  → bottom nav fixo com 4 ícones + labels
Desktop → sidebar fixa na esquerda
```
Nunca usar sidebar colapsável como solução mobile — é padrão de desktop forçado em tela pequena.

**Cardápio público — obrigatório:**
- Imagens com `next/image` e `sizes` adequado ao viewport mobile
- `font-display: swap` para evitar FOIT em conexões lentas
- Nenhum hover state como única indicação visual de interatividade
- Scroll horizontal proibido em qualquer viewport

```typescript
// ✅ imagem responsiva correta
<Image
  src={item.imagemUrl}
  alt={item.nome}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="w-full object-cover"
/>
```

---

### II. Server Components por Padrão

O App Router do Next.js 14 usa Server Components por padrão. Adicionar `'use client'` apenas quando estritamente necessário.

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

**Padrão obrigatório — Server wraps Client:**
```typescript
// ✅ Server Component passa dados para Client Component
export default async function Page() {
  const categorias = await buscarCategorias()  // Prisma no servidor
  return <FormularioItem categorias={categorias} />  // Client Component
}

// ❌ buscar dados dentro de Client Component quando Server resolve
'use client'
export function FormularioItem() {
  const [categorias, setCategorias] = useState([])
  useEffect(() => { fetch('/api/categorias').then(...) }, [])  // desnecessário
}
```

---

### III. Segurança em Todas as Camadas

**Validação com Zod em todas as API routes:**
```typescript
const criarItemSchema = z.object({
  nome:        z.string().min(2).max(100),
  preco:       z.number().positive(),
  categoriaId: z.string().cuid(),
  descricao:   z.string().max(500).optional(),
})

export async function POST(req: Request) {
  const parsed = criarItemSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.flatten() }, { status: 400 })
  }
}
```

**Ownership centralizado — obrigatório em toda mutação:**
```typescript
// lib/auth/ownership.ts
export async function verificarOwnership(itemId: string, userId: string): Promise<Item> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { categoria: { include: { restaurante: true } } },
  })
  if (!item || item.categoria.restaurante.donoId !== userId) {
    throw new UnauthorizedError()
  }
  return item
}

// uso em toda route de mutação — sem exceções:
const item = await verificarOwnership(params.id, session.user.id)
```

**Env vars com falha explícita:**
```typescript
// lib/env.ts — único lugar que acessa process.env
function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variável de ambiente ausente: ${key}`)
  return value
}

export const env = {
  supabaseUrl:         getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:     getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey:  getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  stripeSecretKey:     getEnv('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
}
```

**Proteção de rotas no middleware — única fonte de verdade:**
```typescript
// middleware.ts
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
```

**Double validation obrigatória em uploads:**
```typescript
// client: feedback imediato para UX
if (file.size > MAX_TAMANHO || !TIPOS_PERMITIDOS.includes(file.type)) {
  setErro('Arquivo inválido')
  return
}

// server: nunca confiar no client — valida de novo
export async function POST(req: Request) {
  const file = (await req.formData()).get('imagem') as File
  if (file.size > MAX_TAMANHO || !TIPOS_PERMITIDOS.includes(file.type)) {
    return erro('Arquivo inválido')
  }
}
```

---

### IV. Todos os Estados da UI são Tratados

O usuário do Cardê está no celular em conexão 4G instável. Ignorar estados intermediários gera experiência quebrada.

**Obrigatório em todo componente com dados assíncronos:**
```typescript
// ✅ todos os estados tratados
export function ListaItens() {
  const { itens, isLoading, erro } = useItens()

  if (isLoading) return <SkeletonLista />
  if (erro)      return <ErroEstado mensagem={erro} onRetry={refetch} />
  if (!itens.length) return <EstadoVazio texto="Nenhum item ainda" cta="Adicionar item" />

  return itens.map(item => <ItemCard key={item.id} item={item} />)
}
```

**Atualização otimista em mutações simples e reversíveis:**
```typescript
// ✅ UI atualiza imediatamente, reverte se falhar
async function toggleDisponivel(id: string, disponivel: boolean) {
  setItens(prev => prev.map(i =>
    i.id === id ? { ...i, disponivel: !disponivel } : i
  ))
  try {
    await fetch(`/api/itens/${id}/disponibilidade`, { method: 'PATCH' })
  } catch {
    setItens(prev => prev.map(i =>
      i.id === id ? { ...i, disponivel } : i  // reverte
    ))
    toast.error('Não foi possível atualizar. Tente novamente.')
  }
}
```

---

### V. Arquitetura Limpa — Sem Lógica nos Componentes

```typescript
// ✅ lógica isolada em lib/, componente só renderiza
import { calcularPreco, verificarDisponibilidade } from '@/lib/utils'

export function ItemCard({ item }) {
  const preco = calcularPreco(item)
  const disponivel = verificarDisponibilidade(item)
  // componente limpo, testável, previsível
}

// ❌ componente acumulando lógica de negócio
export function ItemCard({ item }) {
  const preco = item.plano === 'pro' ? item.preco * 0.9 : item.preco
  const slug = item.nome.toLowerCase().replace(/\s+/g, '-')
  const disponivel = item.estoque > 0 && item.ativo
  // mais 20 linhas de lógica...
}
```

**Estrutura de componente — ordem consistente obrigatória:**
```typescript
// 1. Imports externos
// 2. Imports internos
// 3. Tipos/interfaces
// 4. Constantes locais (se houver)
// 5. Componente
// 6. Export
```

---

## Antipadrões Proibidos

### 1. Client Component onde Server Component resolve

Client Components aumentam o bundle JS e perdem otimizações de server rendering. Antes de adicionar `'use client'`, verificar se um Server Component resolve.

```typescript
// ❌ proibido
'use client'
export function CardapioPage() {
  const [itens, setItens] = useState([])
  useEffect(() => { fetch('/api/itens').then(r => r.json()).then(setItens) }, [])
  return <Lista itens={itens} />
}

// ✅ obrigatório quando não há interatividade
export default async function CardapioPage() {
  const itens = await prisma.item.findMany(...)
  return <Lista itens={itens} />
}
```

### 2. Lógica de negócio dentro de componentes

Componentes só renderizam. Lógica vai para `lib/` ou `hooks/`.

### 3. Estados de loading e erro ignorados

Em toda UI com dados assíncronos: tratar loading (skeleton), erro (com retry) e vazio (com CTA). Nunca renderizar diretamente sem verificar o estado.

### 4. Ownership verificado ad-hoc por route

```typescript
// ❌ verificação duplicada e inconsistente entre routes
const item = await prisma.item.findUnique({ where: { id: params.id } })
if (item?.restauranteId !== session.restauranteId) ...

// ✅ sempre usar a função centralizada
const item = await verificarOwnership(params.id, session.user.id)
```

### 5. Upload sem validação dupla

Validar no cliente E no servidor. Client sem server: qualquer requisição direta à API bypassa. Server sem client: UX ruim em conexões lentas.

### 6. Mutations sem feedback otimista no mobile

Spinner de 1-2 segundos em ações simples como pausar um item é experiência inaceitável em mobile. Usar atualização otimista com rollback.

### 7. `any` no TypeScript

```typescript
// ❌ any desliga o sistema de tipos — erros só aparecem em runtime
async function processarWebhook(evento: any) { ... }

// ✅ tipos explícitos
import type Stripe from 'stripe'
async function processarWebhook(evento: Stripe.CustomerSubscriptionUpdatedEvent) { ... }
```

### 8. Queries N+1 no Prisma

```typescript
// ❌ N+1: 1 query para categorias + N queries para itens
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

## Padrões Obrigatórios

### Tipos de resposta de API consistentes

```typescript
// types/api.ts
export type ApiResponse<T> =
  | { sucesso: true;  dados: T }
  | { sucesso: false; erro: string; codigo?: string }

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
    .replace(/[̀-ͯ]/g, '')  // remove acentos
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

## Governance

Esta constitution tem precedência sobre todas as outras práticas. Código novo deve satisfazer todos os princípios I–V. Os 8 antipadrões são proibidos — não apenas desencorajados. Complexidade além do MVP exige justificativa explícita alinhada ao roadmap de Fases 2 e 3.

**Version**: 1.1.0 | **Ratified**: 2026-06-13 | **Last Amended**: 2026-06-13
