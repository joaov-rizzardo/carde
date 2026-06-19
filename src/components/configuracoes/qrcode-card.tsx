import { ExternalLink } from 'lucide-react'

interface QrCodeCardProps {
  dataUrl: string
  menuUrl: string
  slug: string
}

export function QrCodeCard({ dataUrl, menuUrl, slug }: QrCodeCardProps) {
  return (
    <div className="lg:sticky lg:top-6">
      <div className="relative rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface p-6">
        <div
          aria-hidden="true"
          className="absolute -top-3 left-6 h-6 w-6 rounded-full bg-brand-warm"
        />
        <div
          aria-hidden="true"
          className="absolute -top-3 right-6 h-6 w-6 rounded-full bg-brand-warm"
        />

        <h2 className="font-display text-xl font-semibold text-brand-primary mb-4">
          QR code do cardápio
        </h2>

        <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={`QR code do cardápio público de ${slug}`}
            width={320}
            height={320}
            className="h-auto w-full max-w-[240px]"
          />
          <p className="text-xs uppercase tracking-wide text-brand-muted text-center">
            Imprima e cole na mesa
          </p>
        </div>

        <div className="border-t border-dashed border-brand-border my-4" />

        <div className="flex flex-col gap-3">
          <a
            href={dataUrl}
            download={`qrcode-${slug}.png`}
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-accent px-4 text-sm font-medium text-white hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Baixar QR code
          </a>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium text-brand-primary hover:opacity-70 transition-opacity"
          >
            Ver cardápio
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}
