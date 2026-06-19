# Data Model: Upload de Imagens dos Itens

Nenhuma alteração de schema Prisma é necessária — `Item.fotoUrl` já existe desde a migration `20260617015307_extend_item_fields` (feature 006). Esta feature apenas passa a popular/limpar esse campo de forma consistente.

## Item (existente, sem alteração de schema)

```prisma
model Item {
  id          String    @id @default(cuid())
  nome        String
  preco       Decimal   @db.Decimal(10, 2)
  descricao   String?
  fotoUrl     String?
  disponivel  Boolean   @default(true)
  destaque    Boolean   @default(false)
  ordem       Int       @default(0)
  categoriaId String
  categoria   Categoria @relation(fields: [categoriaId], references: [id])

  @@index([categoriaId])
}
```

- `fotoUrl`: URL pública completa do arquivo no Supabase Storage (ex.: `https://<projeto>.supabase.co/storage/v1/object/public/item-fotos/{restauranteId}/{itemId}-{timestamp}.webp`), ou `null` quando o item não tem foto.
- Não há tabela/entidade separada para "Foto do item" — ela existe apenas como arquivo no Storage e como referência (`fotoUrl`) no registro do item, conforme a seção *Key Entities* do spec.md (1 foto : 1 item, sem histórico).

## Regra de unicidade do arquivo (FR-014)

Cada upload usa um path com timestamp (`{itemId}-{Date.now()}.webp`), garantindo que duas versões da foto de um mesmo item nunca colidam no mesmo nome de arquivo — mesmo que ambas estejam temporariamente presentes no storage durante a janela entre "upload concluído" e "arquivo anterior removido" (FR-009).

## Transições de estado de `fotoUrl`

| De | Para | Disparado por | Efeito colateral no Storage |
|---|---|---|---|
| `null` | URL | Criar item com foto (US1) | Nenhum (primeiro arquivo) |
| URL A | URL B | Editar item, substituir foto (US2) | Remove arquivo de URL A após `update` confirmado |
| URL | `null` | Editar item, remover foto (US3) | Remove arquivo da URL anterior após `update` confirmado |
| URL ou `null` | — (registro excluído) | Excluir item | Remove arquivo associado, se houver (FR-012) |

Nenhuma transição faz upload e exclusão na mesma chamada de storage — a exclusão do arquivo anterior só ocorre depois que a mutação no banco (Prisma) já confirmou sucesso, evitando estado inconsistente onde o banco aponta para um arquivo já removido em caso de falha no meio do caminho.
