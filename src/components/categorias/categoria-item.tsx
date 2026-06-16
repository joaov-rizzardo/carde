'use client'

import { useState } from 'react'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CategoriaDto } from '@/types/categoria'

interface CategoriaItemProps {
  categoria: CategoriaDto
  index: number
  onEdit: (categoria: CategoriaDto) => void
  onDelete: (id: string) => Promise<boolean>
}

export function CategoriaItem({ categoria, index, onEdit, onDelete }: CategoriaItemProps) {
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoria.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  async function handleConfirmarExclusao() {
    setExcluindo(true)
    await onDelete(categoria.id)
    setExcluindo(false)
    setConfirmando(false)
  }

  const numStr = String(index + 1).padStart(2, '0')

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-brand-surface border border-brand-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex items-center min-h-[64px]">
        {/* Drag handle — always visible, touch-friendly */}
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          type="button"
          aria-label="Arrastar para reordenar"
          className="flex items-center justify-center w-11 h-11 flex-shrink-0 ml-1 text-brand-border hover:text-brand-muted cursor-grab active:cursor-grabbing touch-none transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Index + Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0 py-3 pr-2">
          <span className="font-display text-xs font-medium text-brand-muted select-none tabular-nums flex-shrink-0 w-5 text-right">
            {numStr}
          </span>
          <span className="text-sm font-medium text-brand-primary truncate">
            {categoria.nome}
          </span>
        </div>

        {/* Action buttons — hidden during delete confirmation */}
        {!confirmando && (
          <div className="flex items-center flex-shrink-0 pr-1.5 gap-0.5">
            <button
              type="button"
              onClick={() => onEdit(categoria)}
              aria-label={`Editar ${categoria.nome}`}
              className="flex items-center justify-center w-11 h-11 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-brand-warm transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              aria-label={`Excluir ${categoria.nome}`}
              className="flex items-center justify-center w-11 h-11 rounded-lg text-brand-muted hover:text-status-danger hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Inline delete confirmation — expands below the row */}
      {confirmando && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-status-danger">
            Tem certeza que deseja excluir?
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={excluindo}
              className="text-xs text-brand-muted hover:text-brand-primary disabled:opacity-50 py-1.5 min-h-[36px] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarExclusao}
              disabled={excluindo}
              className="text-xs font-semibold bg-status-danger text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[36px]"
            >
              {excluindo ? 'Excluindo…' : 'Excluir'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
