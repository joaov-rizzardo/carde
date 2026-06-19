import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { prisma } from '@/lib/prisma'
import { removerFoto } from '@/lib/supabase/storage'
import { erro, ok, type ApiResponse } from '@/types/api'
import type { ItemDto } from '@/types/item'

const itemSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(80, 'Nome deve ter no máximo 80 caracteres'),
  preco: z.coerce.number().positive('Preço deve ser maior que zero'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
  destaque: z.boolean().optional(),
  fotoUrl: z.string().url().nullable().optional(),
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

type Params = { params: Promise<{ id: string }> }

export async function PUT(
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

  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'VALIDACAO_INVALIDA'), { status: 400 })
  }

  const item = await prisma.item.findUnique({
    where: { id },
    select: { categoriaId: true, fotoUrl: true, categoria: { select: { restauranteId: true } } },
  })

  if (!item) {
    return NextResponse.json(erro('Item não encontrado', 'NAO_ENCONTRADO'), { status: 404 })
  }
  if (item.categoria.restauranteId !== restauranteId) {
    return NextResponse.json(erro('Acesso negado', 'ACESSO_NEGADO'), { status: 403 })
  }

  const categoriaMudou = parsed.data.categoriaId !== item.categoriaId
  let ordem: number | undefined

  if (categoriaMudou) {
    const novaCategoria = await prisma.categoria.findUnique({
      where: { id: parsed.data.categoriaId },
      select: { restauranteId: true },
    })
    if (!novaCategoria) {
      return NextResponse.json(erro('Categoria não encontrada', 'NAO_ENCONTRADO'), { status: 404 })
    }
    if (novaCategoria.restauranteId !== restauranteId) {
      return NextResponse.json(erro('Acesso negado', 'ACESSO_NEGADO'), { status: 403 })
    }

    const max = await prisma.item.aggregate({
      where: { categoriaId: parsed.data.categoriaId },
      _max: { ordem: true },
    })
    ordem = (max._max.ordem ?? -1) + 1
  }

  try {
    const atualizado = await prisma.item.update({
      where: { id },
      data: {
        nome: parsed.data.nome,
        preco: arredondarPreco(parsed.data.preco),
        descricao: parsed.data.descricao ?? null,
        categoriaId: parsed.data.categoriaId,
        destaque: parsed.data.destaque ?? false,
        ...(ordem !== undefined ? { ordem } : {}),
        ...(parsed.data.fotoUrl !== undefined ? { fotoUrl: parsed.data.fotoUrl } : {}),
      },
      select: itemSelect,
    })

    if (
      parsed.data.fotoUrl !== undefined &&
      item.fotoUrl &&
      parsed.data.fotoUrl !== item.fotoUrl
    ) {
      removerFoto(item.fotoUrl).catch((e) => console.error('Falha ao remover foto anterior:', e))
    }

    const dados: ItemDto = { ...atualizado, preco: atualizado.preco.toString() }
    return NextResponse.json(ok(dados))
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

  const item = await prisma.item.findUnique({
    where: { id },
    select: { fotoUrl: true, categoria: { select: { restauranteId: true } } },
  })

  if (!item) {
    return NextResponse.json(erro('Item não encontrado', 'NAO_ENCONTRADO'), { status: 404 })
  }
  if (item.categoria.restauranteId !== restauranteId) {
    return NextResponse.json(erro('Acesso negado', 'ACESSO_NEGADO'), { status: 403 })
  }

  try {
    await prisma.item.delete({ where: { id } })
    if (item.fotoUrl) {
      removerFoto(item.fotoUrl).catch((e) => console.error('Falha ao remover foto do item excluído:', e))
    }
    return NextResponse.json(ok({ id }))
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
