'use client'

import { useState } from 'react'
import type { CategoriaDto } from '@/types/categoria'

type ToastFn = (msg: string) => void

export function useCategorias(inicial: CategoriaDto[], onErro: ToastFn) {
  const [categorias, setCategorias] = useState<CategoriaDto[]>(inicial)

  async function criarCategoria(nome: string): Promise<CategoriaDto | null> {
    const res = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    })
    const data = await res.json()
    if (!data.sucesso) {
      onErro(data.erro ?? 'Erro ao criar categoria')
      return null
    }
    const nova: CategoriaDto = data.dados
    setCategorias((prev) => [...prev, nova])
    return nova
  }

  async function renomearCategoria(id: string, nome: string): Promise<boolean> {
    const anterior = categorias
    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, nome } : c)),
    )
    const res = await fetch(`/api/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    })
    const data = await res.json()
    if (!data.sucesso) {
      setCategorias(anterior)
      onErro(data.erro ?? 'Erro ao renomear categoria')
      return false
    }
    return true
  }

  async function excluirCategoria(id: string): Promise<boolean> {
    const anterior = categorias
    setCategorias((prev) => prev.filter((c) => c.id !== id))
    const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!data.sucesso) {
      setCategorias(anterior)
      onErro(data.erro ?? 'Erro ao excluir categoria')
      return false
    }
    return true
  }

  async function reordenarCategorias(novaOrdem: CategoriaDto[]): Promise<void> {
    const anterior = categorias
    setCategorias(novaOrdem)
    const payload = novaOrdem.map((c, i) => ({ id: c.id, ordem: i }))
    const res = await fetch('/api/categorias/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.sucesso) {
      setCategorias(anterior)
      onErro(data.erro ?? 'Erro ao reordenar categorias')
    }
  }

  function resetarCategorias(novas: CategoriaDto[]) {
    setCategorias(novas)
  }

  return { categorias, criarCategoria, renomearCategoria, excluirCategoria, reordenarCategorias, resetarCategorias }
}
