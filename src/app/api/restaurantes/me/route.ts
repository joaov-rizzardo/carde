import { NextResponse } from 'next/server'
import { verificarOwnership } from '@/lib/auth/ownership'
import { prisma } from '@/lib/prisma'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { RestauranteDto } from '@/types/restaurante'

export async function GET(): Promise<
  NextResponse<ApiResponse<RestauranteDto | null>>
> {
  let donoId: string
  try {
    donoId = await verificarOwnership()
  } catch {
    return NextResponse.json(erro('Não autorizado', 'NAO_AUTORIZADO'), {
      status: 401,
    })
  }

  const restaurante = await prisma.restaurante.findUnique({
    where: { donoId },
    select: {
      id: true,
      slug: true,
      nome: true,
      corPrimaria: true,
      ativo: true,
      criadoEm: true,
    },
  })

  const dto: RestauranteDto | null = restaurante
    ? { ...restaurante, criadoEm: restaurante.criadoEm.toISOString() }
    : null

  return NextResponse.json(ok(dto), { status: 200 })
}
