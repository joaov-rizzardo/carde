import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { LoginForm } from '@/components/auth/login-form'

interface Props {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await getServerSession(authConfig)
  if (session) redirect('/dashboard')

  return <LoginForm searchParams={searchParams} />
}
