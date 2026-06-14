# Etapa 4 — Gestão de categorias

## What

CRUD completo de categorias do cardápio, com controle de ordem. Categorias são pré-requisito para a criação de itens.

**Entregáveis:**
- Listagem de categorias com opções de editar, reordenar e excluir
- Modal de criação e edição inline
- Estado vazio com CTA quando não há categorias
- Proteção: não é possível excluir categoria com itens
- API REST com autorização por restaurante

---

## Why

O cardápio é organizado em categorias (ex: Entradas, Pratos Principais, Bebidas). Categorias precisam existir antes dos itens porque:

- **Itens têm `categoriaId` obrigatório** — sem categoria, não dá para criar item
- **A ordem importa para a UX do cliente final** — o cardápio público exibe categorias na ordem definida pelo dono
- **Isolamento de restaurante** — cada restaurante só vê e gerencia suas próprias categorias; qualquer vazamento de dados entre restaurantes é uma falha grave

---

## How

### Schema
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

### API
| Método | Rota | Responsabilidade |
|---|---|---|
| GET | `/api/categorias` | Lista categorias do restaurante logado, ordenadas por `ordem` |
| POST | `/api/categorias` | Cria categoria; `ordem` = max atual + 1 |
| PUT | `/api/categorias/[id]` | Atualiza `nome` e/ou `ordem` |
| DELETE | `/api/categorias/[id]` | Remove — falha com 409 se tiver itens |

**Autorização em todos os endpoints:**
1. Recuperar restaurante do usuário da sessão
2. Verificar que a categoria pertence a esse restaurante → 403 caso contrário

### Reordenação
- Drag-and-drop na lista → envia array de `{id, ordem}` para `PUT /api/categorias/[id]` (um request por item alterado, ou endpoint bulk)
- Alternativamente: botões ↑ ↓ para simplificar a implementação no MVP

### UI — `/dashboard/categorias`
```
[+ Nova categoria]

┌─────────────────────────────────┐
│ ☰  Entradas              ✏ 🗑  │
│ ☰  Pratos Principais     ✏ 🗑  │
│ ☰  Bebidas               ✏ 🗑  │
└─────────────────────────────────┘
```
- Estado vazio: "Você ainda não tem categorias. Crie a primeira para começar."
- Modal de criação/edição: campo `nome` + botão salvar

### Critérios de aceite
- [ ] CRUD completo de categorias funcionando
- [ ] Não é possível excluir categoria com itens (erro 409 + mensagem clara)
- [ ] Ordem das categorias é persistida
- [ ] Operações de outro restaurante retornam 403
