import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obterRestauranteDaSessao, verificarOwnership } from '@/lib/auth/ownership'
import { prisma } from '@/lib/prisma'
import { BUCKET_LOGOS_RESTAURANTE, removerArquivo } from '@/lib/supabase/storage'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { RestauranteDto } from '@/types/restaurante'

const restauranteSelect = {
  id: true,
  slug: true,
  nome: true,
  descricao: true,
  corPrimaria: true,
  logoUrl: true,
  ativo: true,
  criadoEm: true,
} as const

const atualizarRestauranteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  corPrimaria: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  logoUrl: z.string().url().nullable().optional(),
})

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
    select: restauranteSelect,
  })

  const dto: RestauranteDto | null = restaurante
    ? { ...restaurante, criadoEm: restaurante.criadoEm.toISOString() }
    : null

  return NextResponse.json(ok(dto), { status: 200 })
}

export async function PUT(
  request: Request,
): Promise<NextResponse<ApiResponse<RestauranteDto>>> {
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

  const parsed = atualizarRestauranteSchema.safeParse(body)
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  const { nome, descricao, corPrimaria, logoUrl } = parsed.data

  const anterior = await prisma.restaurante.findUnique({
    where: { id: restauranteId },
    select: { logoUrl: true },
  })

  try {
    const atualizado = await prisma.restaurante.update({
      where: { id: restauranteId },
      data: {
        nome,
        descricao: descricao ?? null,
        corPrimaria,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
      },
      select: restauranteSelect,
    })

    if (
      logoUrl !== undefined &&
      anterior?.logoUrl &&
      logoUrl !== anterior.logoUrl
    ) {
      removerArquivo(BUCKET_LOGOS_RESTAURANTE, anterior.logoUrl).catch((e) =>
        console.error('Falha ao remover logo anterior:', e),
      )
    }

    const dto: RestauranteDto = { ...atualizado, criadoEm: atualizado.criadoEm.toISOString() }
    return NextResponse.json(ok(dto), { status: 200 })
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
