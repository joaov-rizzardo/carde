import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { CadastroForm } from '@/components/auth/cadastro-form'

export default async function CadastroPage() {
  const session = await getServerSession(authConfig)
  if (session) redirect('/dashboard')

  return <CadastroForm />
}
