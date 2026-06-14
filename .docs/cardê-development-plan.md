# Cardê — Plano de Desenvolvimento MVP

> Metodologia: Spec-driven design · Feature completa de ponta a ponta  
> Cada etapa entrega uma feature funcional e testável antes de avançar

---

## Como usar este documento

Cada etapa segue a mesma estrutura:

1. **Spec** — descreve o comportamento esperado antes de escrever código
2. **Schema** — modelo de dados necessário
3. **API** — contratos dos endpoints
4. **UI** — telas e componentes
5. **Critérios de aceite** — o que precisa funcionar para a etapa estar concluída

Só avance para a próxima etapa quando todos os critérios da atual estiverem satisfeitos.

---

## Etapa 0 — Fundação do projeto

Sem esta etapa nada funciona. Não é uma feature, é a infraestrutura base.

**O que fazer:**
- Criar projeto Next.js 14 com App Router e TypeScript
- Configurar Tailwind, shadcn/ui e fontes (Inter + Playfair Display)
- Conectar Supabase (banco + storage)
- Configurar Prisma com schema inicial vazio
- Criar `lib/env.ts` com todas as variáveis de ambiente necessárias
- Configurar `middleware.ts` com matcher das rotas protegidas
- Deploy inicial na Vercel funcionando

**Critérios de aceite:**
- [ ] `npm run dev` sobe sem erros
- [ ] Variáveis de ambiente validadas na inicialização
- [ ] Deploy na Vercel funcionando com domínio temporário
- [ ] Conexão com Supabase verificada

---

## Etapa 1 — Autenticação

**Spec:** o dono do restaurante precisa criar uma conta e fazer login para acessar o painel. Sem autenticação, nenhuma outra feature do dashboard é acessível.

**Schema:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  nome      String?
  criadoEm DateTime @default(now())
}
```

**API:**
- `POST /api/auth/[...nextauth]` — gerenciado pelo NextAuth (magic link ou Google OAuth)

**UI:**
- `/login` — formulário de entrada
- `/cadastro` — criação de conta
- Redirecionamento para `/dashboard` após autenticação
- Redirecionamento para `/login` ao tentar acessar rota protegida

**Critérios de aceite:**
- [ ] Usuário consegue criar conta com e-mail
- [ ] Usuário consegue fazer login
- [ ] Rota `/dashboard` redireciona para `/login` sem sessão
- [ ] Sessão persiste após recarregar a página

---

## Etapa 2 — Onboarding do restaurante

**Spec:** após o primeiro login, o usuário não tem restaurante associado. O sistema detecta isso e direciona para um fluxo de onboarding onde o restaurante é criado. Cada usuário tem exatamente um restaurante.

**Schema:**
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

**API:**
- `POST /api/restaurantes` — cria restaurante, gera slug único, associa ao usuário logado
- `GET  /api/restaurantes/me` — retorna restaurante do usuário logado

**UI:**
- `/onboarding` — formulário com nome do restaurante e cor principal
- Após criar: redireciona para `/dashboard`
- Middleware detecta usuário sem restaurante e redireciona para `/onboarding`

**Critérios de aceite:**
- [ ] Slug gerado automaticamente e único
- [ ] Usuário sem restaurante é redirecionado para `/onboarding`
- [ ] Usuário com restaurante não acessa `/onboarding` novamente
- [ ] Restaurante retornado corretamente em `GET /api/restaurantes/me`

---

## Etapa 3 — Dashboard (shell)

**Spec:** estrutura base do painel administrativo. Não entrega nenhuma feature de negócio, mas é o container onde tudo vai viver. Precisa estar sólido antes de construir as seções internas.

**UI:**
- `(dashboard)/layout.tsx` — layout com sidebar fixa e área de conteúdo
- Sidebar com navegação: Cardápio, Categorias, Configurações
- Header com nome do restaurante e menu do usuário (logout)
- Página inicial `/dashboard` com resumo vazio (placeholder) — será preenchida em etapas futuras
- Estados de loading para transições entre seções
- Responsivo: sidebar colapsável em mobile

**Critérios de aceite:**
- [ ] Sidebar navega corretamente entre as seções
- [ ] Item ativo na sidebar reflete a rota atual
- [ ] Logout encerra sessão e redireciona para `/login`
- [ ] Layout não quebra em mobile
- [ ] Nome do restaurante aparece no header

---

## Etapa 4 — Gestão de categorias

**Spec:** o cardápio é organizado em categorias (ex: Entradas, Pratos Principais, Bebidas). O restaurante precisa criar categorias antes de adicionar itens. A ordem das categorias é controlada pelo dono.

**Schema:**
```prisma
model Categoria {
  id            String      @id @default(cuid())
  nome          String
  ordem         Int         @default(0)
  restauranteId String
  restaurante   Restaurante @relation(fields: [restauranteId], references: [id], onDelete: Cascade)
  itens         Item[]

  @@index([restauranteId])
}
```

**API:**
- `GET    /api/categorias` — lista categorias do restaurante logado
- `POST   /api/categorias` — cria categoria
- `PUT    /api/categorias/[id]` — renomeia ou reordena
- `DELETE /api/categorias/[id]` — remove (só se não tiver itens)

**UI:**
- `/dashboard/categorias` — lista com opções de editar, reordenar e excluir
- Modal de criação e edição inline
- Estado vazio com CTA quando não há categorias

**Critérios de aceite:**
- [ ] CRUD completo de categorias funcionando
- [ ] Não é possível excluir categoria com itens
- [ ] Ordem das categorias é persistida
- [ ] Operações de outro restaurante retornam 403

---

## Etapa 5 — Gestão de itens

**Spec:** o núcleo do produto. O restaurante cadastra pratos com nome, descrição, preço e foto. Itens pertencem a uma categoria e podem ser pausados sem serem excluídos.

**Schema:**
```prisma
model Item {
  id           String    @id @default(cuid())
  nome         String
  descricao    String?
  preco        Decimal   @db.Decimal(10, 2)
  imagemUrl    String?
  disponivel   Boolean   @default(true)
  destaque     Boolean   @default(false)
  ordem        Int       @default(0)
  categoriaId  String
  categoria    Categoria @relation(fields: [categoriaId], references: [id], onDelete: Cascade)
  criadoEm    DateTime   @default(now())
  atualizadoEm DateTime  @updatedAt

  @@index([categoriaId])
}
```

**API:**
- `GET    /api/itens` — lista itens do restaurante logado (com filtro por categoria)
- `POST   /api/itens` — cria item
- `PUT    /api/itens/[id]` — edita item
- `PATCH  /api/itens/[id]/disponibilidade` — ativa ou pausa
- `DELETE /api/itens/[id]` — remove item

**UI:**
- `/dashboard/cardapio` — lista de itens agrupados por categoria
- Formulário de criação e edição com todos os campos
- Toggle de disponível/pausado por item
- Estado vazio com CTA quando não há itens

**Critérios de aceite:**
- [ ] CRUD completo de itens funcionando
- [ ] Item pausado não aparece no cardápio público
- [ ] Preço aceita centavos (ex: R$ 14,90)
- [ ] Validação de campos obrigatórios no servidor
- [ ] Operações de outro restaurante retornam 403

---

## Etapa 6 — Upload de imagens

**Spec:** ao criar ou editar um item, o dono pode fazer upload de uma foto do prato. A imagem é comprimida no browser antes do envio e armazenada no Supabase Storage. Cada item tem no máximo uma imagem.

**Regras:**
- Tamanho máximo: 5MB (antes da compressão)
- Formatos aceitos: JPEG, PNG, WebP
- Compressão automática para no máximo 500KB e 1200px de largura
- Path no storage: `/{restauranteId}/{itemId}-{timestamp}.webp`
- Ao substituir imagem, a anterior é removida do storage

**API:**
- `POST /api/upload` — recebe FormData, valida, faz upload, retorna URL pública

**UI:**
- Componente `ImageUpload` integrado ao formulário de item (Etapa 5)
- Preview da imagem após seleção
- Indicador de progresso durante upload
- Botão de remover imagem existente

**Critérios de aceite:**
- [ ] Upload funciona e retorna URL pública
- [ ] Compressão reduz arquivos grandes antes do envio
- [ ] Arquivo inválido retorna erro claro
- [ ] Imagem anterior é deletada ao substituir
- [ ] Preview aparece antes de salvar o item

---

## Etapa 7 — Cardápio público

**Spec:** a página mais importante do produto — é o que o cliente do restaurante vê ao escanear o QR code. Deve ser rápida, bonita e funcionar bem em mobile sem precisar de app ou login.

**Regras:**
- Acessível em `/menu/[slug]`
- Exibe apenas itens com `disponivel: true`
- Usa a cor e logo do restaurante
- Renderizado no servidor (SSR) para performance e SEO
- Slug inválido ou restaurante inativo retorna 404

**UI:**
- Header com logo e nome do restaurante
- Navegação por categorias (âncoras na página)
- Card de item com foto, nome, descrição e preço
- Layout responsivo, otimizado para mobile

**Critérios de aceite:**
- [ ] Página carrega sem login
- [ ] Itens pausados não aparecem
- [ ] Slug inválido retorna 404
- [ ] Navegação por categorias funciona no mobile
- [ ] Cor primária do restaurante aplicada na UI

---

## Etapa 8 — Configurações e QR code

**Spec:** o dono acessa o painel, visualiza o QR code do seu restaurante e pode baixá-lo para imprimir. Também atualiza as informações e aparência do restaurante nesta tela.

**API:**
- `PUT /api/restaurantes/me` — atualiza nome, cor, logo e descrição

**UI:**
- `/dashboard/configuracoes` — formulário de dados do restaurante
- Exibição do QR code gerado a partir do slug
- Botão de download do QR code em PNG
- Link para preview do cardápio público

**Critérios de aceite:**
- [ ] QR code aponta corretamente para `/menu/[slug]`
- [ ] Download do QR code em PNG funciona
- [ ] Alterações de nome e cor refletem no cardápio público
- [ ] Upload de logo funciona (reusa componente da Etapa 6)

---

## Ordem de execução

```
Etapa 0 — Fundação
    ↓
Etapa 1 — Autenticação
    ↓
Etapa 2 — Onboarding
    ↓
Etapa 3 — Dashboard (shell)
    ↓
Etapa 4 — Categorias
    ↓
Etapa 5 — Itens
    ↓
Etapa 6 — Upload de imagens
    ↓
Etapa 7 — Cardápio público
    ↓
Etapa 8 — Configurações e QR code
```

Ao concluir a Etapa 8 o MVP está completo e pronto para os primeiros clientes.

---

## Próximo ciclo — Fase 2

- Etapa 9  — Planos e cobrança (Stripe)
- Etapa 10 — Pedidos pelo QR code
- Etapa 11 — Integração com WhatsApp
- Etapa 12 — Analytics básico
- Etapa 13 — Disponibilidade por horário
