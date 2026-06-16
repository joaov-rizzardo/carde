'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { ApiResponse } from '@/types/api'
import type { RestauranteDto } from '@/types/restaurante'

export type CriarRestauranteInput = {
  nome: string
  corPrimaria: string
}

type UseCriarRestaurante = {
  /** Resolve `true` em caso de sucesso (redirect iniciado), `false` se houve erro. */
  criarRestaurante: (input: CriarRestauranteInput) => Promise<boolean>
  isPending: boolean
  erro: string | null
}

/**
 * Encapsula a criação do restaurante:
 * `POST /api/restaurantes` → `useSession().update()` (propaga `restauranteId`
 * no JWT) → `router.push('/dashboard')`.
 *
 * Expõe estado de carregamento (`isPending`) e a última mensagem de erro
 * de API (`erro`) para a UI renderizar.
 */
export function useCriarRestaurante(): UseCriarRestaurante {
  const router = useRouter()
  const { update } = useSession()
  const [isPending, setIsPending] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function criarRestaurante(
    input: CriarRestauranteInput,
  ): Promise<boolean> {
    setIsPending(true)
    setErro(null)

    try {
      const res = await fetch('/api/restaurantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const payload = (await res.json()) as ApiResponse<RestauranteDto>

      if (!res.ok || !payload.sucesso) {
        const mensagem =
          payload.sucesso === false
            ? payload.erro
            : 'Não foi possível criar o restaurante. Tente novamente.'
        setErro(mensagem)
        setIsPending(false)
        return false
      }

      await update()
      router.push('/dashboard')
      return true
    } catch {
      setErro('Não foi possível criar o restaurante. Tente novamente.')
      setIsPending(false)
      return false
    }
  }

  return { criarRestaurante, isPending, erro }
}
