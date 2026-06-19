import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MenuHeader } from '@/components/menu/menu-header'
import { MenuNav } from '@/components/menu/menu-nav'
import { MenuCategoriaSection } from '@/components/menu/menu-categoria-section'
import { MenuEmptyState } from '@/components/menu/menu-empty-state'
import type { MenuRestauranteDto } from '@/types/menu'

interface MenuPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const { slug } = await params
  const restaurante = await prisma.restaurante.findUnique({
    where: { slug },
    select: { nome: true, descricao: true },
  })

  if (!restaurante) return {}

  return {
    title: `${restaurante.nome} — Cardápio`,
    description: restaurante.descricao ?? undefined,
  }
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params

  const restaurante = await prisma.restaurante.findUnique({
    where: { slug },
    select: {
      nome: true,
      descricao: true,
      corPrimaria: true,
      logoUrl: true,
      ativo: true,
      categorias: {
        where: { itens: { some: { disponivel: true } } },
        orderBy: { ordem: 'asc' },
        select: {
          id: true,
          nome: true,
          itens: {
            where: { disponivel: true },
            orderBy: { ordem: 'asc' },
            select: { id: true, nome: true, preco: true, descricao: true, fotoUrl: true },
          },
        },
      },
    },
  })

  if (!restaurante || !restaurante.ativo) notFound()

  const menu: MenuRestauranteDto = {
    nome: restaurante.nome,
    descricao: restaurante.descricao,
    corPrimaria: restaurante.corPrimaria,
    logoUrl: restaurante.logoUrl,
    categorias: restaurante.categorias.map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      itens: categoria.itens.map((item) => ({ ...item, preco: item.preco.toString() })),
    })),
  }

  return (
    <div className="min-h-full bg-brand-warm">
      <MenuHeader nome={menu.nome} logoUrl={menu.logoUrl} corPrimaria={menu.corPrimaria} />
      {menu.categorias.length > 0 ? (
        <>
          <MenuNav categorias={menu.categorias} corPrimaria={menu.corPrimaria} />
          {menu.categorias.map((categoria) => (
            <MenuCategoriaSection key={categoria.id} categoria={categoria} />
          ))}
        </>
      ) : (
        <MenuEmptyState />
      )}
    </div>
  )
}
