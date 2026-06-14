# Etapa 5 — Gestão de itens

## What

Núcleo do produto. CRUD completo de pratos/itens do cardápio com todos os campos relevantes, incluindo toggle de disponibilidade.

**Entregáveis:**
- Listagem de itens agrupados por categoria em `/dashboard/cardapio`
- Formulário de criação e edição com todos os campos
- Toggle de disponível/pausado por item (sem precisar excluir)
- Estado vazio com CTA quando não há itens
- API REST com autorização por restaurante

---

## Why

Itens são o conteúdo central do cardápio — é o que o cliente final vê e é o motivo pelo qual o dono paga pelo serviço. Algumas decisões de design importantes:

- **`disponivel` em vez de exclusão** — restaurantes pausam pratos sazonalmente (sem estoque, fora de temporada) sem querer perder o cadastro
- **`destaque`** — permite ao dono promover itens especiais no cardápio público
- **`ordem`** — controle fino da sequência dentro de cada categoria
- **Preço como `Decimal(10,2)`** — evita erros de ponto flutuante com valores monetários
- **Validação no servidor** — campos obrigatórios não podem ser contornados pelo cliente

---

## How

### Schema
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

### API
| Método | Rota | Responsabilidade |
|---|---|---|
| GET | `/api/itens` | Lista itens do restaurante; aceita `?categoriaId=` como filtro |
| POST | `/api/itens` | Cria item; valida campos obrigatórios; verifica que categoria pertence ao restaurante |
| PUT | `/api/itens/[id]` | Atualiza qualquer campo do item |
| PATCH | `/api/itens/[id]/disponibilidade` | Alterna `disponivel` (true/false) |
| DELETE | `/api/itens/[id]` | Remove item e sua imagem do storage (se houver) |

**Autorização:** verificar que o item pertence ao restaurante do usuário logado → 403 caso contrário.

### Validação (server-side)
```ts
// Campos obrigatórios
nome: string (não vazio)
preco: number (> 0)
categoriaId: string (UUID válido, pertence ao restaurante)

// Campos opcionais
descricao: string | null
imagemUrl: string | null (URL válida)
disponivel: boolean (default: true)
destaque: boolean (default: false)
ordem: number (default: 0)
```

### UI — `/dashboard/cardapio`
```
[+ Novo item]

── Entradas ────────────────────────────────
┌──────────────────────────────────────────┐
│ [img]  Bruschetta            R$ 18,00    │
│        Pão tostado com tomate   ● Ativo  │
│                            [Editar] [🗑] │
└──────────────────────────────────────────┘

── Pratos Principais ───────────────────────
┌──────────────────────────────────────────┐
│ [img]  Frango Grelhado       R$ 42,00    │
│        Acompanha arroz e salada ○ Pausado│
│                            [Editar] [🗑] │
└──────────────────────────────────────────┘
```

- Toggle disponível/pausado por item (PATCH imediato, sem recarregar página)
- Formulário em modal ou página dedicada com todos os campos
- Preço formatado como R$ com separador decimal

### Critérios de aceite
- [ ] CRUD completo de itens funcionando
- [ ] Item pausado não aparece no cardápio público
- [ ] Preço aceita centavos (ex: R$ 14,90)
- [ ] Validação de campos obrigatórios no servidor
- [ ] Operações de outro restaurante retornam 403
