'use client'

import { Plus } from 'lucide-react'

interface CategoriasEmptyStateProps {
  onCriar: () => void
}

export function CategoriasEmptyState({ onCriar }: CategoriasEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full bg-brand-surface border border-brand-border shadow-sm flex items-center justify-center">
          <CutleryIcon />
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-accent opacity-50" />
        <span className="absolute bottom-1 -left-2 w-2.5 h-2.5 rounded-full bg-brand-primary opacity-15" />
      </div>

      <h2 className="font-display text-xl font-semibold text-brand-primary mb-3 leading-snug">
        Nenhuma categoria ainda
      </h2>
      <p className="text-brand-muted text-sm leading-relaxed max-w-[260px] mb-10">
        Organize seus pratos em categorias para facilitar a navegação do cliente
      </p>

      <button
        onClick={onCriar}
        className="w-full max-w-xs flex items-center justify-center gap-2 bg-brand-accent text-white font-medium text-sm rounded-xl py-3.5 px-6 shadow-sm transition-all hover:opacity-90 active:scale-[0.98] min-h-[44px]"
      >
        <Plus className="w-4 h-4 flex-shrink-0" />
        Criar categoria
      </button>
    </div>
  )
}

function CutleryIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M14 7v9" stroke="#E85D04" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 7v6" stroke="#E85D04" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M16 7v6" stroke="#E85D04" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M12 13c0 1.1.9 2 2 2s2-.9 2-2"
        stroke="#E85D04"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M14 15v22" stroke="#E85D04" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M30 7v30" stroke="#1A1A2E" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M30 7c0 0 6 3.5 6 11h-6"
        stroke="#1A1A2E"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
