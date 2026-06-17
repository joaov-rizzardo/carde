'use client'

import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'

interface ItensEmptyStateProps {
  temCategorias: boolean
  onCriar: () => void
}

export function ItensEmptyState({ temCategorias, onCriar }: ItensEmptyStateProps) {
  if (!temCategorias) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="relative mb-10">
          <div className="w-24 h-24 rounded-full bg-brand-surface border border-brand-border shadow-sm flex items-center justify-center">
            <BookIcon />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-accent opacity-50" />
          <span className="absolute bottom-1 -left-2 w-2.5 h-2.5 rounded-full bg-brand-primary opacity-15" />
        </div>

        <h2 className="font-display text-xl font-semibold text-brand-primary mb-3 leading-snug">
          Crie uma categoria primeiro
        </h2>
        <p className="text-brand-muted text-sm leading-relaxed max-w-[280px] mb-10">
          Os itens do cardápio precisam pertencer a uma categoria. Organize antes de cadastrar os pratos.
        </p>

        <Link
          href="/dashboard/categorias"
          className="w-full max-w-xs flex items-center justify-center gap-2 bg-brand-accent text-white font-medium text-sm rounded-xl py-3.5 px-6 shadow-sm transition-all hover:opacity-90 active:scale-[0.98] min-h-[44px]"
        >
          Ir para categorias
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full bg-brand-surface border border-brand-border shadow-sm flex items-center justify-center">
          <DishIcon />
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-accent opacity-50" />
        <span className="absolute bottom-1 -left-2 w-2.5 h-2.5 rounded-full bg-brand-primary opacity-15" />
      </div>

      <h2 className="font-display text-xl font-semibold text-brand-primary mb-3 leading-snug">
        Nenhum item ainda
      </h2>
      <p className="text-brand-muted text-sm leading-relaxed max-w-[260px] mb-10">
        Cadastre os pratos do seu cardápio para que apareçam organizados por categoria
      </p>

      <button
        onClick={onCriar}
        className="w-full max-w-xs flex items-center justify-center gap-2 bg-brand-accent text-white font-medium text-sm rounded-xl py-3.5 px-6 shadow-sm transition-all hover:opacity-90 active:scale-[0.98] min-h-[44px]"
      >
        <Plus className="w-4 h-4 flex-shrink-0" />
        Adicionar item
      </button>
    </div>
  )
}

function DishIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="22" r="14" stroke="#1A1A2E" strokeWidth="1.75" />
      <path d="M14 22h16" stroke="#E85D04" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M22 14v16" stroke="#E85D04" strokeWidth="1.75" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path
        d="M8 10c4-2 9-2 12 0v24c-3-2-8-2-12 0V10Z"
        stroke="#1A1A2E"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M36 10c-4-2-9-2-12 0v24c3-2 8-2 12 0V10Z"
        stroke="#E85D04"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}
