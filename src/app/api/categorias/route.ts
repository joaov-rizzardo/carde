import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { prisma } from '@/lib/prisma'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { CategoriaDto } from '@/types/categoria'

const criarCategoriaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(80, 'Nome deve ter no máximo 80 caracteres'),
})

export async function GET(): Promise<NextResponse<ApiResponse<CategoriaDto[]>>> {
  let restauranteId: string
  try {
    const r = await obterRestauranteDaSessao()
    restauranteId = r.id
  } catch {
    return NextResponse.json(erro('Não autorizado', 'NAO_AUTORIZADO'), { status: 401 })
  }

  try {
    const categorias = await prisma.categoria.findMany({
      where: { restauranteId },
      orderBy: { ordem: 'asc' },
      select: { id: true, nome: true, ordem: true },
    })
    return NextResponse.json(ok(categorias))
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<CategoriaDto>>> {
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

  const parsed = criarCategoriaSchema.safeParse(body)
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  try {
    const max = await prisma.categoria.aggregate({
      where: { restauranteId },
      _max: { ordem: true },
    })
    const proximaOrdem = (max._max.ordem ?? -1) + 1

    const categoria = await prisma.categoria.create({
      data: { nome: parsed.data.nome, restauranteId, ordem: proximaOrdem },
      select: { id: true, nome: true, ordem: true },
    })
    return NextResponse.json(ok(categoria), { status: 201 })
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
