import { NextResponse } from 'next/server'
import { z } from 'zod'
import { obterRestauranteDaSessao } from '@/lib/auth/ownership'
import { enviarFoto } from '@/lib/supabase/storage'
import { erro, ok, type ApiResponse } from '@/types/api'

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO = 5 * 1024 * 1024

const uploadSchema = z.object({
  itemId: z.string().min(1, 'itemId é obrigatório'),
})

export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ url: string }>>> {
  let restauranteId: string
  try {
    const r = await obterRestauranteDaSessao()
    restauranteId = r.id
  } catch {
    return NextResponse.json(erro('Não autorizado', 'NAO_AUTORIZADO'), { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(erro('Corpo inválido', 'TIPO_INVALIDO'), { status: 400 })
  }

  const file = formData.get('file')
  const parsed = uploadSchema.safeParse({ itemId: formData.get('itemId') })

  if (!parsed.success) {
    const mensagem = parsed.error.issues[0]?.message ?? 'Dados inválidos'
    return NextResponse.json(erro(mensagem, 'TIPO_INVALIDO'), { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json(erro('Arquivo é obrigatório', 'TIPO_INVALIDO'), { status: 400 })
  }

  if (!TIPOS_ACEITOS.includes(file.type)) {
    return NextResponse.json(erro('Tipo de arquivo não aceito', 'TIPO_INVALIDO'), { status: 400 })
  }

  if (file.size > TAMANHO_MAXIMO) {
    return NextResponse.json(erro('Arquivo excede o tamanho máximo de 5MB', 'ARQUIVO_GRANDE'), {
      status: 413,
    })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const path = `${restauranteId}/${parsed.data.itemId}-${Date.now()}.webp`
    const url = await enviarFoto(buffer, path)
    return NextResponse.json(ok({ url }))
  } catch {
    return NextResponse.json(erro('Erro interno do servidor'), { status: 500 })
  }
}
