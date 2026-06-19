import { MenuItemCard } from './menu-item-card'
import type { MenuCategoriaDto } from '@/types/menu'

interface MenuCategoriaSectionProps {
  categoria: MenuCategoriaDto
}

export function MenuCategoriaSection({ categoria }: MenuCategoriaSectionProps) {
  return (
    <section id={`categoria-${categoria.id}`} className="px-4 py-8">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold text-brand-primary">
          {categoria.nome}
        </h2>
        <div className="w-8 h-[3px] mt-2 rounded-full bg-brand-accent" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoria.itens.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
