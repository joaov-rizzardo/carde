import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { ItensList } from '@/components/itens/itens-list'
import type { CategoriaComItensDto } from '@/types/item'

export default async function CardapioPage() {
  let restauranteId: string
  try {
    const r = await obterRestauranteDaSessao()
    restauranteId = r.id
  } catch {
    redirect('/login')
  }

  const categorias = await prisma.categoria.findMany({
    where: { restauranteId },
    orderBy: { ordem: 'asc' },
    select: {
      id: true,
      nome: true,
      ordem: true,
      itens: {
        orderBy: { ordem: 'asc' },
        select: {
          id: true,
          nome: true,
          preco: true,
          descricao: true,
          fotoUrl: true,
          disponivel: true,
          destaque: true,
          ordem: true,
          categoriaId: true,
        },
      },
    },
  })

  const categoriasComItens: CategoriaComItensDto[] = categorias.map((c) => ({
    id: c.id,
    nome: c.nome,
    ordem: c.ordem,
    itens: c.itens.map((i) => ({ ...i, preco: i.preco.toString() })),
  }))

  return (
    <div className="min-h-full bg-brand-warm p-6 md:p-10">
      <h1 className="font-display text-3xl font-semibold text-brand-primary mb-10">Cardápio</h1>
      <ItensList inicialCategorias={categoriasComItens} />
    </div>
  )
}
