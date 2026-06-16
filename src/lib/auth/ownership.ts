import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function verificarOwnership(): Promise<string> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function obterRestauranteDaSessao(): Promise<{ id: string }> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  const restaurante = await prisma.restaurante.findUnique({
    where: { donoId: session.user.id },
    select: { id: true },
  })
  if (!restaurante) {
    throw new Error('Unauthorized')
  }
  return restaurante
}
