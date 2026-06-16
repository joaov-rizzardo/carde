# Data Model: Dashboard Shell

**Feature**: Dashboard Shell | **Date**: 2026-06-15

## Dados Consumidos

O dashboard shell não cria ou modifica entidades. Consome dados de entidades já existentes.

---

### Restaurante (leitura)

Buscado no `layout.tsx` (Server Component) para exibir o nome no header e sidebar.

| Campo | Tipo | Uso |
|-------|------|-----|
| `nome` | `string` | Exibido no header e no topo da sidebar |
| `donoId` | `string` | Chave de busca (`findUnique({ where: { donoId } })`) |

**Query**:
```
prisma.restaurante.findUnique({
  where: { donoId: session.user.id },
  select: { nome: true }
})
```

**Fallback**: Se `restaurante` retornar `null` (usuário sem restaurante), o middleware já redireciona para `/onboarding` antes do layout ser alcançado. O layout usa `restaurante?.nome ?? 'Meu Restaurante'` apenas como guard defensivo.

---

### Sessão do Usuário (leitura)

Obtida via `getServerSession(authConfig)` no `layout.tsx`.

| Campo | Tipo | Uso |
|-------|------|-----|
| `user.id` | `string` | Chave para buscar o restaurante |
| `user.name` | `string \| null` | Exibido no menu do usuário (avatar/inicial) |
| `user.email` | `string \| null` | Exibido no menu do usuário |

---

## Configuração de Navegação

Não é uma entidade de banco de dados — é configuração estática de UI definida em `src/components/dashboard/nav-items.ts`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `href` | `string` | Rota de destino (ex: `/dashboard/cardapio`) |
| `label` | `string` | Rótulo exibido na sidebar/bottom-nav |
| `icon` | `LucideIcon` | Ícone da seção (lucide-react) |

**Itens de navegação**:

| label | href | Ícone sugerido |
|-------|------|----------------|
| Cardápio | `/dashboard/cardapio` | `UtensilsCrossed` |
| Categorias | `/dashboard/categorias` | `Tag` |
| Configurações | `/dashboard/configuracoes` | `Settings` |

---

## Sem Novas Entidades

Este feature não adiciona tabelas, campos ou migrations ao banco de dados.
