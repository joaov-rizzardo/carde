import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {},
      from: process.env.EMAIL_FROM ?? 'Cardê <onboarding@resend.dev>',
      async sendVerificationRequest({ identifier, url, provider }) {
        await resend.emails.send({
          from: provider.from,
          to: identifier,
          subject: 'Seu link de acesso ao Cardê',
          html: `<p>Clique no link abaixo para acessar o Cardê:</p><p><a href="${url}">Acessar o Cardê</a></p><p>Este link expira em 24 horas.</p>`,
        })
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 604800,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }): Promise<import('next-auth/jwt').JWT> {
      if (user) {
        token.id = user.id
      }
      if ((user || trigger === 'update') && token.id) {
        const restaurante = await prisma.restaurante.findUnique({
          where: { donoId: token.id },
          select: { id: true },
        })
        token.restauranteId = restaurante?.id ?? null
      }
      return token
    },
    async session({ session, token }): Promise<import('next-auth').Session> {
      if (token?.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return
      const pending = await prisma.pendingSignup.findUnique({
        where: { email: user.email },
      })
      if (pending) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: {
              name: pending.nome,
              termosAceitos: pending.termosAceitos,
              termosAceitosEm: new Date(),
            },
          }),
          prisma.pendingSignup.delete({ where: { email: user.email } }),
        ])
      }
    },
  },
}
