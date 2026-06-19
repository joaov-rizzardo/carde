'use client'

import { useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useAtualizarRestaurante } from '@/hooks/use-atualizar-restaurante'
import { LogoUpload } from './logo-upload'

interface RestauranteFormProps {
  nomeInicial: string
  descricaoInicial: string | null
  corPrimariaInicial: string
  logoUrlInicial: string | null
}

export function RestauranteForm({
  nomeInicial,
  descricaoInicial,
  corPrimariaInicial,
  logoUrlInicial,
}: RestauranteFormProps) {
  const { salvar, isPending, erro } = useAtualizarRestaurante()
  const [nome, setNome] = useState(nomeInicial)
  const [descricao, setDescricao] = useState(descricaoInicial ?? '')
  const [corPrimaria, setCorPrimaria] = useState(corPrimariaInicial)
  const [logoUrl, setLogoUrl] = useState<string | null>(logoUrlInicial)
  const [nomeError, setNomeError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  function mostrarToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastMsg(msg)
    toastTimer.current = setTimeout(() => setToastMsg(null), 4500)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNomeError(null)

    const nomeTrimado = nome.trim()
    if (!nomeTrimado) {
      setNomeError('Nome é obrigatório')
      return
    }

    const sucesso = await salvar({
      nome: nomeTrimado,
      descricao: descricao.trim() || undefined,
      corPrimaria,
      logoUrl,
    })

    if (sucesso) {
      mostrarToast('Configurações salvas com sucesso')
    } else {
      mostrarToast(erro ?? 'Não foi possível salvar as alterações')
    }
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
      <h2 className="font-display text-xl font-semibold text-brand-primary mb-5">
        Identidade visual
      </h2>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <LogoUpload logoUrlInicial={logoUrlInicial} onChange={setLogoUrl} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="restaurante-nome-input" className="text-sm font-medium text-brand-primary">
            Nome do restaurante
          </label>
          <input
            id="restaurante-nome-input"
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value)
              if (nomeError) setNomeError(null)
            }}
            placeholder="Ex: Sabor da Terra"
            maxLength={100}
            disabled={isPending}
            aria-describedby={nomeError ? 'restaurante-nome-erro' : undefined}
            aria-invalid={!!nomeError}
            className="w-full min-h-[44px] rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 focus:border-transparent disabled:opacity-50 transition-shadow"
          />
          {nomeError && (
            <p id="restaurante-nome-erro" role="alert" className="text-xs text-status-danger mt-0.5">
              {nomeError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="restaurante-descricao-input" className="text-sm font-medium text-brand-primary">
              Descrição <span className="text-brand-muted font-normal">(opcional)</span>
            </label>
            <span className="text-xs text-brand-muted">{descricao.length}/500</span>
          </div>
          <Textarea
            id="restaurante-descricao-input"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Conte um pouco sobre o seu restaurante..."
            maxLength={500}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="restaurante-cor-input" className="text-sm font-medium text-brand-primary">
            Cor de destaque
          </label>
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-brand-border">
              <input
                id="restaurante-cor-input"
                type="color"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                disabled={isPending}
                aria-label="Escolher cor de destaque"
                className="absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              />
            </div>
            <span className="text-sm font-medium uppercase text-brand-muted">{corPrimaria}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-end w-full sm:w-auto min-h-[44px] rounded-lg bg-brand-accent px-6 text-sm font-medium text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-opacity"
        >
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </form>

      {toastMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-brand-primary text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50"
        >
          {toastMsg}
        </div>
      )}
    </div>
  )
}
