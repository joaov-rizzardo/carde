import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { prisma } from '@/lib/prisma'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { ItemDto } from '@/types/item'

const disponibilidadeSchema = z.object({
  disponivel: z.boolean(),
})

const itemSelect = {
  id: true,
  nome: true,
  preco: true,
  descricao: true,
  fotoUrl: true,
  disponivel: true,
  destaque: true,
  ordem: true,
  categoriaId: true,
} as const

type Params = { params: Promise<{ id: string }> }

export async function PATCH(
  request: Request,
  { params }: Params,
): Promise<NextResponse<ApiResponse<ItemDto>>> {
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

  const parsed = disponibilidadeSchema.safeParse(body)
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  const item = await prisma.item.findUnique({
    where: { id },
    select: { categoria: { select: { restauranteId: true } } },
  })

  if (!item) {
    return NextResponse.json(erro('Item não encontrado', 'NAO_ENCONTRADO'), { status: 404 })
  }
  if (item.categoria.restauranteId !== restauranteId) {
    return NextResponse.json(erro('Acesso negado', 'ACESSO_NEGADO'), { status: 403 })
  }

  try {
    const atualizado = await prisma.item.update({
      where: { id },
      data: { disponivel: parsed.data.disponivel },
      select: itemSelect,
    })

    const dados: ItemDto = { ...atualizado, preco: atualizado.preco.toString() }
    return NextResponse.json(ok(dados))
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
