import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { prisma } from '@/lib/prisma'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { CategoriaComItensDto, ItemDto } from '@/types/item'

const itemSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(80, 'Nome deve ter no máximo 80 caracteres'),
  preco: z.coerce.number().positive('Preço deve ser maior que zero'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
  destaque: z.boolean().optional(),
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

function arredondarPreco(preco: number): number {
  return Math.round(preco * 100) / 100
}

export async function GET(): Promise<NextResponse<ApiResponse<CategoriaComItensDto[]>>> {
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
      select: {
        id: true,
        nome: true,
        ordem: true,
        itens: { orderBy: { ordem: 'asc' }, select: itemSelect },
      },
    })

    const dados: CategoriaComItensDto[] = categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      ordem: c.ordem,
      itens: c.itens.map((i) => ({ ...i, preco: i.preco.toString() })),
    }))

    return NextResponse.json(ok(dados))
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<ItemDto>>> {
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

  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  const categoria = await prisma.categoria.findUnique({
    where: { id: parsed.data.categoriaId },
    select: { restauranteId: true },
  })
  if (!categoria) {
    return NextResponse.json(erro('Categoria não encontrada', 'NAO_ENCONTRADO'), { status: 404 })
  }
  if (categoria.restauranteId !== restauranteId) {
    return NextResponse.json(erro('Acesso negado', 'ACESSO_NEGADO'), { status: 403 })
  }

  try {
    const max = await prisma.item.aggregate({
      where: { categoriaId: parsed.data.categoriaId },
      _max: { ordem: true },
    })
    const proximaOrdem = (max._max.ordem ?? -1) + 1

    const item = await prisma.item.create({
      data: {
        nome: parsed.data.nome,
        preco: arredondarPreco(parsed.data.preco),
        descricao: parsed.data.descricao ?? null,
        categoriaId: parsed.data.categoriaId,
        destaque: parsed.data.destaque ?? false,
        disponivel: true,
        ordem: proximaOrdem,
      },
      select: itemSelect,
    })

    const dados: ItemDto = { ...item, preco: item.preco.toString() }
    return NextResponse.json(ok(dados), { status: 201 })
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
