import { Settings, Tag, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

type Section = {
  href: string
  icon: LucideIcon
  title: string
  description: string
  badge: string
}

const sections: Section[] = [
  {
    href: '/dashboard/cardapio',
    icon: UtensilsCrossed,
    title: 'Cardápio',
    description: 'Adicione, edite e organize seus pratos e bebidas.',
    badge: 'Em breve · Etapa 4',
  },
  {
    href: '/dashboard/categorias',
    icon: Tag,
    title: 'Categorias',
    description: 'Agrupe seus itens em seções que o cliente vai navegar.',
    badge: 'Em breve · Etapa 5',
  },
  {
    href: '/dashboard/configuracoes',
    icon: Settings,
    title: 'Configurações',
    description: 'Personalize a identidade visual do seu restaurante.',
    badge: 'Em breve · Etapa 6',
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-full p-6 md:p-10" style={{ background: '#F7F3EE' }}>
      {/* Hero */}
      <div className="mb-10 max-w-xl">
        <h1
          className="font-display text-3xl md:text-[2.25rem] font-semibold leading-tight mb-3"
          style={{ color: '#1A1A2E' }}
        >
          Bem-vindo ao Cardê
        </h1>
        <p className="text-base leading-relaxed" style={{ color: '#6B7280' }}>
          Seu painel está pronto. Explore as seções abaixo para montar seu cardápio digital.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
        {sections.map(({ href, icon: Icon, title, description, badge }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-5 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(26, 26, 46, 0.08)',
              boxShadow: '0 1px 6px rgba(26, 26, 46, 0.05)',
            }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 group-hover:bg-[#E85D04]/15"
              style={{ background: 'rgba(232, 93, 4, 0.09)' }}
            >
              <Icon className="h-5 w-5" style={{ color: '#E85D04' }} />
            </div>
            <div className="flex-1">
              <h2
                className="font-semibold text-base mb-1.5"
                style={{ color: '#1A1A2E' }}
              >
                {title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                {description}
              </p>
            </div>
            <span
              className="self-start text-[11px] font-medium px-2.5 py-1 rounded-full tracking-wide"
              style={{
                background: 'rgba(26, 26, 46, 0.05)',
                color: '#6B7280',
              }}
            >
              {badge}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
