'use client'

import { useState } from 'react'
import type { ApiResponse } from '@/types/api'
import type { RestauranteDto } from '@/types/restaurante'

export type AtualizarRestauranteInput = {
  nome: string
  descricao?: string
  corPrimaria: string
  logoUrl?: string | null
}

type UseAtualizarRestaurante = {
  salvar: (input: AtualizarRestauranteInput) => Promise<boolean>
  isPending: boolean
  erro: string | null
}

export function useAtualizarRestaurante(): UseAtualizarRestaurante {
  const [isPending, setIsPending] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(input: AtualizarRestauranteInput): Promise<boolean> {
    setIsPending(true)
    setErro(null)

    try {
      const res = await fetch('/api/restaurantes/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const payload = (await res.json()) as ApiResponse<RestauranteDto>

      if (!res.ok || !payload.sucesso) {
        const mensagem =
          payload.sucesso === false
            ? payload.erro
            : 'Não foi possível salvar as alterações. Tente novamente.'
        setErro(mensagem)
        setIsPending(false)
        return false
      }

      setIsPending(false)
      return true
    } catch {
      setErro('Não foi possível salvar as alterações. Tente novamente.')
      setIsPending(false)
      return false
    }
  }

  return { salvar, isPending, erro }
}
