import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { BottomNav } from '@/components/dashboard/bottom-nav'
import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const restaurante = await prisma.restaurante.findUnique({
    where: { donoId: session.user.id },
    select: { nome: true },
  })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 md:ml-64">
        <Header
          restaurantName={restaurante?.nome ?? 'Meu Restaurante'}
          userEmail={session.user.email}
          userName={session.user.name}
        />
        <main className="flex-1 overflow-y-auto min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
