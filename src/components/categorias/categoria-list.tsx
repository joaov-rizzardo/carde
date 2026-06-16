'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, AlertCircle, RefreshCw } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useCategorias } from '@/hooks/use-categorias'
import { CategoriasEmptyState } from './categorias-empty-state'
import { CategoriaItem } from './categoria-item'
import { CategoriaModal } from './categoria-modal'
import type { CategoriaDto } from '@/types/categoria'

interface CategoriaListProps {
  inicialCategorias: CategoriaDto[]
}

function CategoriasSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando categorias">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-16 bg-brand-surface border border-brand-border rounded-xl animate-pulse"
          style={{ opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  )
}

export function CategoriaList({ inicialCategorias }: CategoriaListProps) {
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<CategoriaDto | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const mostrarErro = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastMsg(msg)
    toastTimer.current = setTimeout(() => setToastMsg(null), 4500)
  }

  const {
    categorias,
    criarCategoria,
    renomearCategoria,
    excluirCategoria,
    reordenarCategorias,
    resetarCategorias,
  } = useCategorias(inicialCategorias, mostrarErro)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categorias.findIndex((c) => c.id === active.id)
    const newIndex = categorias.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reordenarCategorias(arrayMove(categorias, oldIndex, newIndex))
  }

  async function refetch() {
    setIsFetching(true)
    setFetchError(false)
    try {
      const res = await fetch('/api/categorias')
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
    setCategoriaEmEdicao(null)
    setModalAberto(true)
  }

  function abrirModalEditar(cat: CategoriaDto) {
    setCategoriaEmEdicao(cat)
    setModalAberto(true)
  }

  async function handleSalvarModal(nome: string): Promise<boolean> {
    if (categoriaEmEdicao) {
      return renomearCategoria(categoriaEmEdicao.id, nome)
    }
    const criada = await criarCategoria(nome)
    return criada !== null
  }

  if (isFetching) return <CategoriasSkeleton />

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-brand-muted" />
        <div>
          <p className="text-sm font-medium text-brand-primary mb-1">Algo deu errado</p>
          <p className="text-xs text-brand-muted">
            Não foi possível carregar as categorias.
          </p>
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
      {categorias.length > 0 && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-brand-muted uppercase tracking-wide font-medium">
            {categorias.length} {categorias.length === 1 ? 'categoria' : 'categorias'}
          </p>
          <button
            type="button"
            onClick={abrirModalCriar}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:opacity-80 active:scale-95 transition-all min-h-[44px] px-2"
          >
            <Plus className="w-4 h-4" />
            Nova categoria
          </button>
        </div>
      )}

      {categorias.length === 0 ? (
        <CategoriasEmptyState onCriar={abrirModalCriar} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categorias.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {categorias.map((cat, index) => (
                <CategoriaItem
                  key={cat.id}
                  categoria={cat}
                  index={index}
                  onEdit={abrirModalEditar}
                  onDelete={excluirCategoria}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CategoriaModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        categoriaEmEdicao={categoriaEmEdicao}
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
