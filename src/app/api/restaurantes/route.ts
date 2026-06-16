import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { verificarOwnership } from '@/lib/auth/ownership'
import { gerarSlugUnico } from '@/lib/restaurante/slug'
import { prisma } from '@/lib/prisma'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { RestauranteDto } from '@/types/restaurante'

const criarRestauranteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  corPrimaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida')
    .default('#E85D04'),
})

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<RestauranteDto>>> {
  let donoId: string
  try {
    donoId = await verificarOwnership()
  } catch {
    return NextResponse.json(erro('Não autorizado', 'NAO_AUTORIZADO'), {
      status: 401,
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(erro('Corpo inválido', 'VALIDACAO_INVALIDA'), {
      status: 400,
    })
  }

  const parsed = criarRestauranteSchema.safeParse(body)
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'VALIDACAO_INVALIDA'), {
      status: 400,
    })
  }

  const { nome, corPrimaria } = parsed.data

  try {
    const slug = await gerarSlugUnico(nome)
    const restaurante = await prisma.restaurante.create({
      data: { nome, slug, corPrimaria, donoId },
      select: {
        id: true,
        slug: true,
        nome: true,
        corPrimaria: true,
        ativo: true,
        criadoEm: true,
      },
    })

    const dto: RestauranteDto = {
      ...restaurante,
      criadoEm: restaurante.criadoEm.toISOString(),
    }
    return NextResponse.json(ok(dto), { status: 201 })
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return NextResponse.json(
        erro('Restaurante já existe para este usuário', 'RESTAURANTE_JA_EXISTE'),
        { status: 409 },
      )
    }
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
