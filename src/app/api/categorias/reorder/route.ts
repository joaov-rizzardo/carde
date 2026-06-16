import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { prisma } from '@/lib/prisma'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { CategoriaDto } from '@/types/categoria'

const reorderSchema = z
  .array(z.object({ id: z.string(), ordem: z.number().int().min(0) }))
  .min(1)

export async function PATCH(
  request: Request,
): Promise<NextResponse<ApiResponse<CategoriaDto[]>>> {
  let restauranteId: string
  try {
    const r = await obterRestauranteDaSessao()
    restauranteId = r.id
  } catch {
    return NextResponse.json(erro('Não autorizado', 'NAO_AUTORIZADO'), { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(erro('Corpo inválido', 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  const ids = parsed.data.map((item) => item.id)
  const existentes = await prisma.categoria.findMany({
    where: { id: { in: ids } },
    select: { id: true, restauranteId: true },
  })

  if (existentes.length !== ids.length) {
    return NextResponse.json(erro('Categoria não encontrada', 'NAO_ENCONTRADO'), { status: 404 })
  }
  const algumForaDoRestaurante = existentes.some((c) => c.restauranteId !== restauranteId)
  if (algumForaDoRestaurante) {
    return NextResponse.json(erro('Acesso negado', 'ACESSO_NEGADO'), { status: 403 })
  }

  try {
    const atualizadas = await prisma.$transaction(
      parsed.data.map(({ id, ordem }) =>
        prisma.categoria.update({
          where: { id },
          data: { ordem },
          select: { id: true, nome: true, ordem: true },
        }),
      ),
    )
    return NextResponse.json(ok(atualizadas))
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
