import Image from 'next/image'

interface MenuHeaderProps {
  nome: string
  logoUrl: string | null
  corPrimaria: string
}

export function MenuHeader({ nome, logoUrl, corPrimaria }: MenuHeaderProps) {
  return (
    <header
      className="bg-brand-surface border-b-4 px-6 py-8 flex flex-col items-center text-center gap-3"
      style={{ borderColor: corPrimaria }}
    >
      {logoUrl && (
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden border-2"
          style={{ borderColor: corPrimaria }}
        >
          <Image src={logoUrl} alt={nome} fill sizes="80px" className="object-cover" />
        </div>
      )}
      <h1 className="font-display text-3xl font-semibold text-brand-primary break-words">
        {nome}
      </h1>
    </header>
  )
}
