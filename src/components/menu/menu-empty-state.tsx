import { UtensilsCrossed } from 'lucide-react'

export function MenuEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-surface border border-brand-border mb-4">
        <UtensilsCrossed className="w-7 h-7 text-brand-muted" aria-hidden="true" />
      </div>
      <p className="font-display text-xl text-brand-primary">Cardápio em preparação</p>
      <p className="text-sm text-brand-muted mt-1 max-w-xs">
        Este restaurante ainda não publicou nenhum item disponível. Volte em breve.
      </p>
    </div>
  )
}
