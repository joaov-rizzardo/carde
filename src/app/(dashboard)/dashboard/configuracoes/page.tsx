import { redirect } from 'next/navigation'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { gerarQrCodeDataUrl } from '@/lib/qrcode/gerar'
import { prisma } from '@/lib/prisma'
import { QrCodeCard } from '@/components/configuracoes/qrcode-card'
import { RestauranteForm } from '@/components/configuracoes/restaurante-form'

export default async function ConfiguracoesPage() {
  let restauranteId: string
  try {
    const r = await obterRestauranteDaSessao()
    restauranteId = r.id
  } catch {
    redirect('/login')
  }

  const restaurante = await prisma.restaurante.findUnique({
    where: { id: restauranteId },
    select: { id: true, slug: true, nome: true, descricao: true, corPrimaria: true, logoUrl: true },
  })

  if (!restaurante) redirect('/login')

  const menuUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/menu/${restaurante.slug}`
  const qrCodeDataUrl = await gerarQrCodeDataUrl(menuUrl)

  return (
    <div className="min-h-full p-6 md:p-10" style={{ background: '#F7F3EE' }}>
      <div className="mb-8 max-w-xl">
        <h1 className="font-display text-3xl font-semibold mb-2" style={{ color: '#1A1A2E' }}>
          Configurações
        </h1>
        <p style={{ color: '#6B7280' }}>Identidade visual e QR code do seu cardápio</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] max-w-4xl">
        <QrCodeCard dataUrl={qrCodeDataUrl} menuUrl={menuUrl} slug={restaurante.slug} />
        <RestauranteForm
          nomeInicial={restaurante.nome}
          descricaoInicial={restaurante.descricao}
          corPrimariaInicial={restaurante.corPrimaria}
          logoUrlInicial={restaurante.logoUrl}
        />
      </div>
    </div>
  )
}
