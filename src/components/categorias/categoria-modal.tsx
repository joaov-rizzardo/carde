'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import type { CategoriaDto } from '@/types/categoria'

interface CategoriaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoriaEmEdicao?: CategoriaDto | null
  onSalvar: (nome: string) => Promise<boolean>
}

export function CategoriaModal({
  open,
  onOpenChange,
  categoriaEmEdicao,
  onSalvar,
}: CategoriaModalProps) {
  const [nome, setNome] = useState('')
  const [erroValidacao, setErroValidacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const modoEdicao = !!categoriaEmEdicao

  useEffect(() => {
    if (open) {
      setNome(categoriaEmEdicao?.nome ?? '')
      setErroValidacao('')
      const timer = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(timer)
    }
  }, [open, categoriaEmEdicao])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nomeTrimado = nome.trim()
    if (!nomeTrimado) {
      setErroValidacao('Nome é obrigatório')
      return
    }
    if (nomeTrimado.length > 80) {
      setErroValidacao('Nome deve ter no máximo 80 caracteres')
      return
    }
    setSalvando(true)
    const sucesso = await onSalvar(nomeTrimado)
    setSalvando(false)
    if (sucesso) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {modoEdicao ? 'Editar categoria' : 'Nova categoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5 mb-2">
            <label
              htmlFor="categoria-nome-input"
              className="text-sm font-medium text-brand-primary"
            >
              Nome da categoria
            </label>
            <input
              id="categoria-nome-input"
              ref={inputRef}
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                if (erroValidacao) setErroValidacao('')
              }}
              placeholder="Ex: Entradas, Bebidas..."
              maxLength={80}
              disabled={salvando}
              aria-describedby={erroValidacao ? 'categoria-nome-erro' : undefined}
              aria-invalid={!!erroValidacao}
              className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 focus:border-transparent disabled:opacity-50 transition-shadow min-h-[44px]"
            />
            {erroValidacao && (
              <p
                id="categoria-nome-erro"
                role="alert"
                className="text-xs text-status-danger mt-0.5"
              >
                {erroValidacao}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                disabled={salvando}
                className="flex-1 sm:flex-none rounded-lg border border-brand-border px-4 py-2.5 text-sm font-medium text-brand-muted hover:bg-brand-warm disabled:opacity-50 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 sm:flex-none rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[44px]"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
