'use client'

import { useEffect, useState } from 'react'
import { gerarSlug } from '@/lib/restaurante/slug'
import { useCriarRestaurante } from '@/hooks/use-criar-restaurante'

const COR_PADRAO = '#E85D04'

export function OnboardingForm(): React.ReactElement {
  const { criarRestaurante, isPending, erro } = useCriarRestaurante()
  const [nome, setNome] = useState('')
  const [corPrimaria, setCorPrimaria] = useState(COR_PADRAO)
  const [nomeError, setNomeError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Preview do slug derivado a cada keystroke — função pura, sem debounce.
  const slugPreview = gerarSlug(nome)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setNomeError(null)

    const trimmedNome = nome.trim()
    if (trimmedNome.length < 2) {
      setNomeError('Nome deve ter pelo menos 2 caracteres')
      return
    }

    const ok = await criarRestaurante({ nome: trimmedNome, corPrimaria })
    if (ok) setSuccess(true)
  }

  return (
    <div className="min-h-screen bg-brand-warm flex items-center justify-center px-4 py-12">
      <div
        className={`w-full max-w-[440px] transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="bg-brand-surface rounded-2xl shadow-[0_4px_32px_rgba(26,26,46,0.08)] px-8 py-10">
          {/* Brand */}
          <div className="text-center mb-7">
            <h1 className="font-display text-[2.25rem] leading-none tracking-tight text-brand-primary mb-2">
              Vamos criar seu restaurante
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-2 mb-3">
              <div className="h-px w-8 bg-brand-border" />
              <div className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <div className="h-px w-8 bg-brand-border" />
            </div>
            <p className="text-sm text-brand-muted leading-snug px-2">
              Dê um nome ao seu negócio. Você poderá ajustar os detalhes depois.
            </p>
          </div>

          {success ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-lg font-semibold text-brand-primary mb-2">
                Restaurante criado!
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed">
                Estamos te levando ao seu painel…
              </p>
            </div>
          ) : (
            <>
              {erro && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Nome */}
                <div className="mb-4">
                  <label
                    htmlFor="nome"
                    className="block text-sm font-medium text-brand-primary mb-1.5"
                  >
                    Nome do restaurante
                  </label>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value)
                      if (nomeError) setNomeError(null)
                    }}
                    placeholder="Ex: Sabor da Terra"
                    disabled={isPending}
                    autoComplete="organization"
                    autoFocus
                    aria-invalid={nomeError !== null}
                    aria-describedby={nomeError ? 'nome-error' : 'slug-preview'}
                    className={`w-full h-11 rounded-lg border px-3.5 text-sm text-brand-primary placeholder:text-brand-muted/60 outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                      nomeError
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-brand-border bg-white focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15'
                    }`}
                  />
                  {nomeError ? (
                    <p id="nome-error" className="mt-1.5 text-xs text-red-600">
                      {nomeError}
                    </p>
                  ) : (
                    <p
                      id="slug-preview"
                      className="mt-1.5 text-xs text-brand-muted"
                    >
                      Seu link:{' '}
                      <span className="font-medium text-brand-primary">
                        carde.app/{slugPreview || 'seu-restaurante'}
                      </span>
                    </p>
                  )}
                </div>

                {/* Cor primária */}
                <div className="mb-6">
                  <label
                    htmlFor="corPrimaria"
                    className="block text-sm font-medium text-brand-primary mb-1.5"
                  >
                    Cor da marca
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-brand-border">
                      <input
                        id="corPrimaria"
                        type="color"
                        value={corPrimaria}
                        onChange={(e) => setCorPrimaria(e.target.value)}
                        disabled={isPending}
                        aria-label="Escolher cor da marca"
                        className="absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed"
                      />
                    </div>
                    <span className="text-sm font-medium uppercase text-brand-muted">
                      {corPrimaria}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 rounded-lg bg-brand-accent text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                >
                  {isPending ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Criando…
                    </>
                  ) : (
                    'Criar restaurante'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
