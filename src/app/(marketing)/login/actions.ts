'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
})

type Result = { ok: true } | { ok: false; error: string }

export async function requestMagicLink(input: unknown): Promise<Result> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'E-mail inválido' }
  }

  const email = parsed.data.email.trim().toLowerCase()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { ok: false, error: 'EMAIL_NOT_FOUND' }
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const cookie = (await headers()).get('cookie') ?? ''

  try {
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, { headers: { cookie } })
    if (!csrfRes.ok) throw new Error('csrf fetch failed')
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string }

    const res = await fetch(`${baseUrl}/api/auth/signin/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie,
      },
      body: new URLSearchParams({
        email,
        csrfToken,
        callbackUrl: '/dashboard',
        json: 'true',
      }).toString(),
      redirect: 'manual',
    })

    if (res.status >= 200 && res.status < 400) return { ok: true }
    return { ok: false, error: 'Não foi possível enviar o e-mail. Tente novamente.' }
  } catch {
    return { ok: false, error: 'Não foi possível enviar o e-mail. Tente novamente.' }
  }
}
