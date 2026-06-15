import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

export async function verificarOwnership(): Promise<string> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}
