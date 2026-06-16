'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 z-30 border-t"
      style={{
        background: 'rgba(26, 26, 46, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium tracking-wide transition-colors duration-200',
              isActive ? 'text-[#E85D04]' : 'text-white/35'
            )}
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-b-full"
                style={{
                  background: '#E85D04',
                  boxShadow: '0 2px 10px rgba(232,93,4,0.7)',
                }}
              />
            )}
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
