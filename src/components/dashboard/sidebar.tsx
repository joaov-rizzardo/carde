'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-brand-primary z-30">
      <div className="flex items-center h-16 px-6 border-b border-white/10">
        <span className="text-white font-display text-xl font-semibold">Cardê</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-accent/20 text-brand-accent'
                  : 'text-brand-muted hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
