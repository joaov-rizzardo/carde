import Image from 'next/image'
import { UtensilsCrossed } from 'lucide-react'
import type { MenuItemDto } from '@/types/menu'

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface MenuItemCardProps {
  item: MenuItemDto
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <div className="flex items-center bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
      <div className="relative w-24 h-24 flex-shrink-0 bg-brand-warm">
        {item.fotoUrl ? (
          <Image
            src={item.fotoUrl}
            alt={item.nome}
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <UtensilsCrossed className="w-6 h-6 text-brand-muted" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 p-3">
        <h3 className="font-semibold text-brand-primary break-words">{item.nome}</h3>
        {item.descricao && (
          <p className="text-sm text-brand-muted mt-1 break-words">{item.descricao}</p>
        )}
        <p className="text-sm font-bold tabular-nums mt-2 text-brand-accent">
          {formatador.format(Number(item.preco))}
        </p>
      </div>
    </div>
  )
}
