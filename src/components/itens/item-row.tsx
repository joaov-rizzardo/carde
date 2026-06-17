'use client'

import { useState } from 'react'
import { Star, Pencil, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import type { ItemDto } from '@/types/item'

interface ItemRowProps {
  item: ItemDto
  onToggleDisponibilidade: (id: string, disponivel: boolean) => void
  onEdit: (item: ItemDto) => void
  onDelete: (id: string) => Promise<boolean>
}

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function ItemRow({ item, onToggleDisponibilidade, onEdit, onDelete }: ItemRowProps) {
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const pausado = !item.disponivel

  async function handleConfirmarExclusao() {
    setExcluindo(true)
    await onDelete(item.id)
    setExcluindo(false)
    setConfirmando(false)
  }

  return (
    <div className="flex bg-brand-surface border border-brand-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div
        className={`w-[3px] flex-shrink-0 ${item.destaque ? 'bg-brand-accent' : 'bg-transparent'}`}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center min-h-[76px] py-2.5 pl-3 pr-1.5 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {item.destaque && (
                <Star
                  className="w-3.5 h-3.5 text-brand-accent fill-brand-accent flex-shrink-0"
                  aria-label="Item em destaque"
                />
              )}
              <span
                className={`font-display text-base truncate ${pausado ? 'text-brand-muted' : 'text-brand-primary'}`}
              >
                {item.nome}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className={`text-sm font-semibold tabular-nums ${pausado ? 'text-brand-muted' : 'text-brand-accent'}`}
              >
                {formatador.format(Number(item.preco))}
              </span>
              {pausado && (
                <span className="text-[11px] font-medium uppercase tracking-wide text-status-warning bg-status-warning/10 border border-status-warning/20 rounded-full px-2 py-0.5">
                  Pausado
                </span>
              )}
            </div>

            {item.descricao && (
              <p className="text-xs text-brand-muted mt-1 truncate">{item.descricao}</p>
            )}
          </div>

          {!confirmando && (
            <div className="flex items-center flex-shrink-0 gap-0.5">
              <Switch
                checked={item.disponivel}
                onCheckedChange={(checked) => onToggleDisponibilidade(item.id, checked)}
                aria-label={item.disponivel ? `Pausar ${item.nome}` : `Reativar ${item.nome}`}
              />
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label={`Editar ${item.nome}`}
                className="flex items-center justify-center w-11 h-11 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-brand-warm transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                aria-label={`Excluir ${item.nome}`}
                className="flex items-center justify-center w-11 h-11 rounded-lg text-brand-muted hover:text-status-danger hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {confirmando && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-status-danger">
              Excluir &ldquo;{item.nome}&rdquo; permanentemente?
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
    </div>
  )
}
