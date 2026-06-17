'use client'

import { ItemRow } from './item-row'
import type { CategoriaComItensDto, ItemDto } from '@/types/item'

interface CategoriaSectionProps {
  categoria: CategoriaComItensDto
  onToggleDisponibilidade: (id: string, disponivel: boolean) => void
  onEdit: (item: ItemDto) => void
  onDelete: (id: string) => Promise<boolean>
}

export function CategoriaSection({
  categoria,
  onToggleDisponibilidade,
  onEdit,
  onDelete,
}: CategoriaSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-brand-border">
        <h3 className="text-xs font-medium uppercase tracking-wide text-brand-muted truncate">
          {categoria.nome}
        </h3>
        <span className="text-xs text-brand-muted flex-shrink-0 ml-2">
          {categoria.itens.length === 0
            ? 'Vazia'
            : `${categoria.itens.length} ${categoria.itens.length === 1 ? 'item' : 'itens'}`}
        </span>
      </div>

      {categoria.itens.length === 0 ? (
        <div className="border border-dashed border-brand-border rounded-xl py-6 text-center">
          <p className="text-xs text-brand-muted">Nenhum item nesta categoria ainda</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categoria.itens.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggleDisponibilidade={onToggleDisponibilidade}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
