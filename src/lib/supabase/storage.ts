import { createServerClient } from '@/lib/supabase/server'

export const BUCKET_FOTOS_ITENS = 'item-fotos'

export async function enviarFoto(buffer: Buffer, path: string): Promise<string> {
  const supabase = createServerClient()
  const { error } = await supabase.storage
    .from(BUCKET_FOTOS_ITENS)
    .upload(path, buffer, { contentType: 'image/webp' })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET_FOTOS_ITENS).getPublicUrl(path)
  return data.publicUrl
}

export async function removerFoto(url: string): Promise<void> {
  const marcador = `/object/public/${BUCKET_FOTOS_ITENS}/`
  const indice = url.indexOf(marcador)
  if (indice === -1) return

  const path = url.slice(indice + marcador.length)
  const supabase = createServerClient()
  const { error } = await supabase.storage.from(BUCKET_FOTOS_ITENS).remove([path])
  if (error) console.error('Falha ao remover foto do storage:', error)
}
