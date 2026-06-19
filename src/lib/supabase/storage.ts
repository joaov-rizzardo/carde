import { createServerClient } from '@/lib/supabase/server'

export const BUCKET_FOTOS_ITENS = 'item-fotos'
export const BUCKET_LOGOS_RESTAURANTE = 'restaurante-logos'

export async function enviarArquivo(bucket: string, buffer: Buffer, path: string): Promise<string> {
  const supabase = createServerClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: 'image/webp' })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function removerArquivo(bucket: string, url: string): Promise<void> {
  const marcador = `/object/public/${bucket}/`
  const indice = url.indexOf(marcador)
  if (indice === -1) return

  const path = url.slice(indice + marcador.length)
  const supabase = createServerClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) console.error('Falha ao remover arquivo do storage:', error)
}
