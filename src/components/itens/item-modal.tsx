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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from './image-upload'
import type { ItemDto } from '@/types/item'

interface CategoriaOpcao {
  id: string
  nome: string
}

export interface ItemFormPayload {
  id?: string
  nome: string
  preco: number
  descricao?: string
  categoriaId: string
  destaque?: boolean
  fotoUrl?: string | null
}

interface ItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categorias: CategoriaOpcao[]
  itemEmEdicao?: ItemDto | null
  onSalvar: (payload: ItemFormPayload) => Promise<boolean>
}

interface FormState {
  nome: string
  preco: string
  descricao: string
  categoriaId: string
  destaque: boolean
}

const ESTADO_VAZIO: FormState = { nome: '', preco: '', descricao: '', categoriaId: '', destaque: false }

export function ItemModal({ open, onOpenChange, categorias, itemEmEdicao, onSalvar }: ItemModalProps) {
  const [form, setForm] = useState<FormState>(ESTADO_VAZIO)
  const [erros, setErros] = useState<Partial<Record<keyof FormState, string>>>({})
  const [salvando, setSalvando] = useState(false)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState('')
  const nomeInputRef = useRef<HTMLInputElement>(null)
  const modoEdicao = !!itemEmEdicao

  useEffect(() => {
    if (open) {
      setForm(
        itemEmEdicao
          ? {
              nome: itemEmEdicao.nome,
              preco: itemEmEdicao.preco,
              descricao: itemEmEdicao.descricao ?? '',
              categoriaId: itemEmEdicao.categoriaId,
              destaque: itemEmEdicao.destaque,
            }
          : { ...ESTADO_VAZIO, categoriaId: categorias[0]?.id ?? '' },
      )
      setErros({})
      setFotoUrl(itemEmEdicao?.fotoUrl ?? null)
      if (!itemEmEdicao) setPendingId(crypto.randomUUID())
      const timer = setTimeout(() => nomeInputRef.current?.focus(), 80)
      return () => clearTimeout(timer)
    }
  }, [open, itemEmEdicao, categorias])

  const itemId = itemEmEdicao?.id ?? pendingId

  function atualizarCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: undefined }))
  }

  function validar(): boolean {
    const novosErros: Partial<Record<keyof FormState, string>> = {}
    const nomeTrimado = form.nome.trim()
    if (!nomeTrimado) novosErros.nome = 'Nome é obrigatório'
    else if (nomeTrimado.length > 80) novosErros.nome = 'Nome deve ter no máximo 80 caracteres'

    const precoNumero = Number(form.preco)
    if (!form.preco || Number.isNaN(precoNumero) || precoNumero <= 0) {
      novosErros.preco = 'Preço deve ser maior que zero'
    }

    if (form.descricao.trim().length > 500) {
      novosErros.descricao = 'Descrição deve ter no máximo 500 caracteres'
    }

    if (!form.categoriaId) novosErros.categoriaId = 'Categoria é obrigatória'

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setSalvando(true)
    const sucesso = await onSalvar({
      ...(modoEdicao ? {} : { id: pendingId }),
      nome: form.nome.trim(),
      preco: Number(form.preco),
      descricao: form.descricao.trim() || undefined,
      categoriaId: form.categoriaId,
      destaque: form.destaque,
      fotoUrl,
    })
    setSalvando(false)
    if (sucesso) onOpenChange(false)
  }

  const categoriaSelecionada = categorias.find((c) => c.id === form.categoriaId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {modoEdicao ? 'Editar item' : 'Novo item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-primary">
              Foto <span className="text-brand-muted font-normal">(opcional)</span>
            </span>
            <ImageUpload
              itemId={itemId}
              fotoUrlInicial={itemEmEdicao?.fotoUrl ?? null}
              onChange={setFotoUrl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-nome-input" className="text-sm font-medium text-brand-primary">
              Nome do item
            </label>
            <input
              id="item-nome-input"
              ref={nomeInputRef}
              type="text"
              value={form.nome}
              onChange={(e) => atualizarCampo('nome', e.target.value)}
              placeholder="Ex: Bruschetta, Limonada..."
              maxLength={80}
              disabled={salvando}
              aria-describedby={erros.nome ? 'item-nome-erro' : undefined}
              aria-invalid={!!erros.nome}
              className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 focus:border-transparent disabled:opacity-50 transition-shadow min-h-[44px]"
            />
            {erros.nome && (
              <p id="item-nome-erro" role="alert" className="text-xs text-status-danger mt-0.5">
                {erros.nome}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-preco-input" className="text-sm font-medium text-brand-primary">
              Preço
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">
                R$
              </span>
              <input
                id="item-preco-input"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={form.preco}
                onChange={(e) => atualizarCampo('preco', e.target.value)}
                placeholder="0,00"
                disabled={salvando}
                aria-describedby={erros.preco ? 'item-preco-erro' : undefined}
                aria-invalid={!!erros.preco}
                className="w-full rounded-lg border border-brand-border bg-brand-surface pl-9 pr-3 py-2.5 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 focus:border-transparent disabled:opacity-50 transition-shadow min-h-[44px]"
              />
            </div>
            {erros.preco && (
              <p id="item-preco-erro" role="alert" className="text-xs text-status-danger mt-0.5">
                {erros.preco}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-categoria-select" className="text-sm font-medium text-brand-primary">
              Categoria
            </label>
            <Select
              value={form.categoriaId}
              onValueChange={(valor) => atualizarCampo('categoriaId', valor)}
              disabled={salvando}
            >
              <SelectTrigger id="item-categoria-select" aria-invalid={!!erros.categoriaId}>
                <SelectValue placeholder="Selecione uma categoria">
                  {categoriaSelecionada?.nome}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.categoriaId && (
              <p role="alert" className="text-xs text-status-danger mt-0.5">
                {erros.categoriaId}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="item-descricao-input" className="text-sm font-medium text-brand-primary">
                Descrição <span className="text-brand-muted font-normal">(opcional)</span>
              </label>
              <span className="text-xs text-brand-muted">{form.descricao.length}/500</span>
            </div>
            <Textarea
              id="item-descricao-input"
              value={form.descricao}
              onChange={(e) => atualizarCampo('descricao', e.target.value)}
              placeholder="Ingredientes, modo de preparo..."
              maxLength={500}
              disabled={salvando}
              aria-describedby={erros.descricao ? 'item-descricao-erro' : undefined}
            />
            {erros.descricao && (
              <p id="item-descricao-erro" role="alert" className="text-xs text-status-danger mt-0.5">
                {erros.descricao}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-brand-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-brand-primary">Destaque</p>
              <p className="text-xs text-brand-muted">Promove o item no cardápio público</p>
            </div>
            <Switch
              checked={form.destaque}
              onCheckedChange={(checked) => atualizarCampo('destaque', checked)}
              disabled={salvando}
              aria-label="Marcar como destaque"
            />
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
