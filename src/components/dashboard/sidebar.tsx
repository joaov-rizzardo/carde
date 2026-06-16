'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 z-30"
      style={{ background: 'linear-gradient(170deg, #1A1A2E 0%, #131326 100%)' }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[1.75rem] leading-none text-white tracking-tight">
            Cardê
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: '#E85D04', boxShadow: '0 0 6px #E85D04' }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-white/30 tracking-[0.15em] uppercase font-medium">
          Painel Admin
        </p>
      </div>

      <div className="mx-6 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-4 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/75 hover:bg-white/[0.04]'
              )}
            >
              {isActive && (
                <>
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(232, 93, 4, 0.11)' }}
                  />
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{
                      background: '#E85D04',
                      boxShadow: '0 0 12px #E85D04, 0 0 24px rgba(232,93,4,0.35)',
                    }}
                  />
                </>
              )}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 relative z-10 transition-colors duration-200',
                  isActive ? 'text-[#E85D04]' : ''
                )}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mx-6 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="px-6 py-4">
        <p className="text-[11px] text-white/20 tracking-wide">Cardê · v0.4</p>
      </div>
    </aside>
  )
}
