import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage(): Promise<React.ReactElement> {
  // Proteção de rota é responsabilidade do middleware (src/middleware.ts).
  // Este guard cobre apenas o caso de a sessão expirar entre o middleware e o render.
  const session = await getServerSession(authConfig)
  if (!session) redirect('/login')

  return <OnboardingForm />
}
