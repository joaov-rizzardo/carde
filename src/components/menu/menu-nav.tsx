interface MenuNavProps {
  categorias: { id: string; nome: string }[]
  corPrimaria: string
}

export function MenuNav({ categorias, corPrimaria }: MenuNavProps) {
  return (
    <nav className="bg-brand-warm border-b border-brand-border px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {categorias.map((categoria) => (
          <a
            key={categoria.id}
            href={`#categoria-${categoria.id}`}
            className="text-sm font-medium px-3 min-h-[44px] flex items-center rounded-full border bg-brand-surface"
            style={{ borderColor: corPrimaria, color: corPrimaria }}
          >
            {categoria.nome}
          </a>
        ))}
      </div>
    </nav>
  )
}
