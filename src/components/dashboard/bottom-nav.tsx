'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-primary border-t border-white/10 z-30">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] text-xs font-medium transition-colors',
              isActive ? 'text-brand-accent' : 'text-brand-muted'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
