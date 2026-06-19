'use client'

import { useState } from 'react'
import { comprimirImagem } from '@/lib/image/compress'

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO = 5 * 1024 * 1024

type Status = 'idle' | 'comprimindo' | 'enviando' | 'erro' | 'concluido'

interface EstadoUpload {
  status: Status
  progresso: number
  erro: string | null
  url: string | null
}

const ESTADO_INICIAL: EstadoUpload = { status: 'idle', progresso: 0, erro: null, url: null }

function enviarArquivo(file: File, onProgresso: (percentual: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgresso(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (data.sucesso) resolve(data.dados.url)
        else reject(new Error(data.erro ?? 'Erro ao enviar logo'))
      } catch {
        reject(new Error('Erro ao enviar logo'))
      }
    }
    xhr.onerror = () => reject(new Error('Falha de conexão ao enviar logo'))
    xhr.open('POST', '/api/restaurantes/logo')
    xhr.send(formData)
  })
}

export function useUploadLogo() {
  const [estado, setEstado] = useState<EstadoUpload>(ESTADO_INICIAL)

  function validar(file: File): string | null {
    if (!TIPOS_ACEITOS.includes(file.type)) return 'Formato não aceito. Use JPEG, PNG ou WebP.'
    if (file.size > TAMANHO_MAXIMO) return 'Arquivo maior que 5MB.'
    return null
  }

  async function selecionarArquivo(file: File) {
    const mensagemErro = validar(file)
    if (mensagemErro) {
      setEstado({ status: 'erro', progresso: 0, erro: mensagemErro, url: null })
      return
    }

    setEstado({ status: 'comprimindo', progresso: 0, erro: null, url: null })
    try {
      const arquivoComprimido = await comprimirImagem(file)
      setEstado({ status: 'enviando', progresso: 0, erro: null, url: null })
      const url = await enviarArquivo(arquivoComprimido, (progresso) =>
        setEstado((prev) => ({ ...prev, progresso })),
      )
      setEstado({ status: 'concluido', progresso: 100, erro: null, url })
    } catch (e) {
      setEstado({
        status: 'erro',
        progresso: 0,
        erro: e instanceof Error ? e.message : 'Erro ao enviar logo',
        url: null,
      })
    }
  }

  function resetar() {
    setEstado(ESTADO_INICIAL)
  }

  return { estado, selecionarArquivo, resetar }
}
