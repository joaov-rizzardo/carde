import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { prisma } from '@/lib/prisma'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { CategoriaDto } from '@/types/categoria'

const renomearSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(80, 'Nome deve ter no máximo 80 caracteres'),
})

type Params = { params: Promise<{ id: string }> }

export async function PUT(
  request: Request,
  { params }: Params,
): Promise<NextResponse<ApiResponse<CategoriaDto>>> {
  let restauranteId: string
  try {
    const r = await obterRestauranteDaSessao()
    restauranteId = r.id
  } catch {
    return NextResponse.json(erro('Não autorizado', 'NAO_AUTORIZADO'), { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(erro('Corpo inválido', 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  const parsed = renomearSchema.safeParse(body)
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  const categoria = await prisma.categoria.findUnique({
    where: { id },
    select: { restauranteId: true },
  })

  if (!categoria) {
    return NextResponse.json(erro('Categoria não encontrada', 'NAO_ENCONTRADO'), { status: 404 })
  }
  if (categoria.restauranteId !== restauranteId) {
    return NextResponse.json(erro('Acesso negado', 'ACESSO_NEGADO'), { status: 403 })
  }

  try {
    const atualizada = await prisma.categoria.update({
      where: { id },
      data: { nome: parsed.data.nome },
      select: { id: true, nome: true, ordem: true },
    })
    return NextResponse.json(ok(atualizada))
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: Params,
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  let restauranteId: string
  try {
    const r = await obterRestauranteDaSessao()
    restauranteId = r.id
  } catch {
    return NextResponse.json(erro('Não autorizado', 'NAO_AUTORIZADO'), { status: 401 })
  }

  const { id } = await params

  const categoria = await prisma.categoria.findUnique({
    where: { id },
    select: { restauranteId: true, _count: { select: { itens: true } } },
  })

  if (!categoria) {
    return NextResponse.json(erro('Categoria não encontrada', 'NAO_ENCONTRADO'), { status: 404 })
  }
  if (categoria.restauranteId !== restauranteId) {
    return NextResponse.json(erro('Acesso negado', 'ACESSO_NEGADO'), { status: 403 })
  }
  if (categoria._count.itens > 0) {
    return NextResponse.json(
      erro('Esta categoria possui itens e não pode ser excluída', 'CATEGORIA_COM_ITENS'),
      { status: 409 },
    )
  }

  try {
    await prisma.categoria.delete({ where: { id } })
    return NextResponse.json(ok({ id }))
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
