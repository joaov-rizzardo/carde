import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Middleware de roteamento por estado de restaurante.
 *
 * Lê `restauranteId` do JWT via `getToken()` (Edge Runtime, sem Prisma) e
 * decide o redirecionamento conforme a tabela de decisão de contracts/middleware.md:
 *
 * | Rota            | Token | restauranteId | Ação                      |
 * |-----------------|-------|---------------|---------------------------|
 * | /dashboard/*    | não   | —             | redirect /login           |
 * | /dashboard/*    | sim   | null          | redirect /onboarding      |
 * | /dashboard/*    | sim   | string        | next()                    |
 * | /onboarding/*   | não   | —             | redirect /login           |
 * | /onboarding/*   | sim   | null          | next()                    |
 * | /onboarding/*   | sim   | string        | redirect /dashboard       |
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  const isDashboard = pathname.startsWith('/dashboard')
  const isOnboarding = pathname.startsWith('/onboarding')

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const temRestaurante = typeof token.restauranteId === 'string'

  if (isDashboard && !temRestaurante) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (isOnboarding && temRestaurante) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}
