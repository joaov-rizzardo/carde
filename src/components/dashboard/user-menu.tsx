'use client'

import { signOut } from 'next-auth/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type UserMenuProps = {
  email: string | null | undefined
  name: string | null | undefined
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

export function UserMenu({ email, name }: UserMenuProps) {
  const initials = getInitials(name, email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-white font-semibold text-sm ring-2 ring-white/20 transition-all duration-200 hover:ring-[#E85D04]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04]"
          style={{ background: 'linear-gradient(135deg, #E85D04 0%, #c44d03 100%)' }}
          aria-label="Menu do usuário"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-0"
        style={{
          background: '#1f1f3a',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {name && (
              <p className="text-sm font-medium leading-none text-white">{name}</p>
            )}
            {email && (
              <p className="text-xs leading-none text-white/40">{email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.08)' }} />
        <DropdownMenuItem
          className="cursor-pointer min-h-[44px] text-red-400 focus:text-red-300 focus:bg-white/5"
          onSelect={() => signOut({ callbackUrl: '/login' })}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
