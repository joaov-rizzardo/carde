'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { useItens } from '@/hooks/use-itens'
import { ItensEmptyState } from './itens-empty-state'
import { CategoriaSection } from './categoria-section'
import { ItemModal, type ItemFormPayload } from './item-modal'
import type { CategoriaComItensDto, ItemDto } from '@/types/item'

interface ItensListProps {
  inicialCategorias: CategoriaComItensDto[]
}

function ItensSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando itens">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-3">
          <div
            className="h-4 w-32 bg-brand-surface border border-brand-border rounded-lg animate-pulse"
            style={{ opacity: 1 - i * 0.2 }}
          />
          {[0, 1].map((j) => (
            <div
              key={j}
              className="h-20 bg-brand-surface border border-brand-border rounded-xl animate-pulse"
              style={{ opacity: 1 - (i + j) * 0.15 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ItensList({ inicialCategorias }: ItensListProps) {
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemDto | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const mostrarErro = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastMsg(msg)
    toastTimer.current = setTimeout(() => setToastMsg(null), 4500)
  }

  const { categorias, criarItem, editarItem, excluirItem, alternarDisponibilidade, resetarCategorias } =
    useItens(inicialCategorias, mostrarErro)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  async function refetch() {
    setIsFetching(true)
    setFetchError(false)
    try {
      const res = await fetch('/api/itens')
      const data = await res.json()
      if (data.sucesso) {
        resetarCategorias(data.dados)
      } else {
        setFetchError(true)
      }
    } catch {
      setFetchError(true)
    } finally {
      setIsFetching(false)
    }
  }

  function abrirModalCriar() {
    setItemEmEdicao(null)
    setModalAberto(true)
  }

  function abrirModalEditar(item: ItemDto) {
    setItemEmEdicao(item)
    setModalAberto(true)
  }

  async function handleSalvarModal(payload: ItemFormPayload): Promise<boolean> {
    if (itemEmEdicao) {
      return editarItem(itemEmEdicao.id, payload)
    }
    const criado = await criarItem(payload)
    return criado !== null
  }

  const totalItens = categorias.reduce((acc, c) => acc + c.itens.length, 0)
  const temCategorias = categorias.length > 0
  const opcoesCategorias = categorias.map((c) => ({ id: c.id, nome: c.nome }))

  if (isFetching) return <ItensSkeleton />

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-brand-muted" />
        <div>
          <p className="text-sm font-medium text-brand-primary mb-1">Algo deu errado</p>
          <p className="text-xs text-brand-muted">Não foi possível carregar os itens do cardápio.</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="flex items-center gap-2 text-sm font-medium text-brand-accent hover:opacity-80 transition-opacity min-h-[44px] px-4"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <>
      {totalItens > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-brand-muted uppercase tracking-wide font-medium">
            {totalItens} {totalItens === 1 ? 'item' : 'itens'} em {categorias.length}{' '}
            {categorias.length === 1 ? 'categoria' : 'categorias'}
          </p>
          <button
            type="button"
            onClick={abrirModalCriar}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:opacity-80 active:scale-95 transition-all min-h-[44px] px-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar item
          </button>
        </div>
      )}

      {totalItens === 0 ? (
        <ItensEmptyState temCategorias={temCategorias} onCriar={abrirModalCriar} />
      ) : (
        <div className="flex flex-col gap-8">
          {categorias.map((categoria) => (
            <CategoriaSection
              key={categoria.id}
              categoria={categoria}
              onToggleDisponibilidade={alternarDisponibilidade}
              onEdit={abrirModalEditar}
              onDelete={excluirItem}
            />
          ))}
        </div>
      )}

      <ItemModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        categorias={opcoesCategorias}
        itemEmEdicao={itemEmEdicao}
        onSalvar={handleSalvarModal}
      />

      {toastMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-brand-primary text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50"
        >
          {toastMsg}
        </div>
      )}
    </>
  )
}
