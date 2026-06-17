import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { CategoriaList } from '@/components/categorias/categoria-list'
import type { CategoriaDto } from '@/types/categoria'

export default async function CategoriasPage() {
  let restauranteId: string
  try {
    const r = await obterRestauranteDaSessao()
    restauranteId = r.id
  } catch {
    redirect('/login')
  }

  const categorias: CategoriaDto[] = await prisma.categoria.findMany({
    where: { restauranteId },
    orderBy: { ordem: 'asc' },
    select: { id: true, nome: true, ordem: true },
  })

  return (
    <div className="min-h-full bg-brand-warm p-6 md:p-10">
      <h1 className="font-display text-3xl font-semibold text-brand-primary mb-10">
        Categorias
      </h1>
      <CategoriaList inicialCategorias={categorias} />
    </div>
  )
}
