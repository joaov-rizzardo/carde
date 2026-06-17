'use client'

import { useState } from 'react'
import type { CategoriaComItensDto, ItemDto } from '@/types/item'

type ToastFn = (msg: string) => void

interface ItemPayload {
  nome: string
  preco: number
  descricao?: string
  categoriaId: string
  destaque?: boolean
}

export function useItens(inicial: CategoriaComItensDto[], onErro: ToastFn) {
  const [categorias, setCategorias] = useState<CategoriaComItensDto[]>(inicial)

  async function criarItem(payload: ItemPayload): Promise<ItemDto | null> {
    const res = await fetch('/api/itens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.sucesso) {
      onErro(data.erro ?? 'Erro ao criar item')
      return null
    }
    const novo: ItemDto = data.dados
    setCategorias((prev) =>
      prev.map((c) => (c.id === novo.categoriaId ? { ...c, itens: [...c.itens, novo] } : c)),
    )
    return novo
  }

  async function editarItem(id: string, payload: ItemPayload): Promise<boolean> {
    const res = await fetch(`/api/itens/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.sucesso) {
      onErro(data.erro ?? 'Erro ao editar item')
      return false
    }
    const atualizado: ItemDto = data.dados
    setCategorias((prev) =>
      prev.map((c) => {
        const contemItem = c.itens.some((i) => i.id === atualizado.id)
        if (contemItem) {
          return c.id === atualizado.categoriaId
            ? { ...c, itens: c.itens.map((i) => (i.id === atualizado.id ? atualizado : i)) }
            : { ...c, itens: c.itens.filter((i) => i.id !== atualizado.id) }
        }
        return c.id === atualizado.categoriaId ? { ...c, itens: [...c.itens, atualizado] } : c
      }),
    )
    return true
  }

  async function excluirItem(id: string): Promise<boolean> {
    const res = await fetch(`/api/itens/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!data.sucesso) {
      onErro(data.erro ?? 'Erro ao excluir item')
      return false
    }
    setCategorias((prev) => prev.map((c) => ({ ...c, itens: c.itens.filter((i) => i.id !== id) })))
    return true
  }

  async function alternarDisponibilidade(id: string, disponivel: boolean): Promise<void> {
    const anterior = categorias
    setCategorias((prev) =>
      prev.map((c) => ({
        ...c,
        itens: c.itens.map((i) => (i.id === id ? { ...i, disponivel } : i)),
      })),
    )
    const res = await fetch(`/api/itens/${id}/disponibilidade`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponivel }),
    })
    const data = await res.json()
    if (!data.sucesso) {
      setCategorias(anterior)
      onErro(data.erro ?? 'Erro ao atualizar disponibilidade')
    }
  }

  function resetarCategorias(novas: CategoriaComItensDto[]) {
    setCategorias(novas)
  }

  return {
    categorias,
    criarItem,
    editarItem,
    excluirItem,
    alternarDisponibilidade,
    resetarCategorias,
  }
}
