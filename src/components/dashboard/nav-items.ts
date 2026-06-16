import { Settings, Tag, UtensilsCrossed, type LucideIcon } from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { href: '/dashboard/cardapio', label: 'Cardápio', icon: UtensilsCrossed },
  { href: '/dashboard/categorias', label: 'Categorias', icon: Tag },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]
