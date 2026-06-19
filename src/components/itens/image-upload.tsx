'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CircleAlert, RotateCcw, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useUploadImagem } from '@/hooks/use-upload-imagem'

interface ImageUploadProps {
  itemId: string
  fotoUrlInicial?: string | null
  onChange: (url: string | null) => void
}

const TIPOS_ACEITOS = 'image/jpeg,image/png,image/webp'

export function ImageUpload({ itemId, fotoUrlInicial, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(fotoUrlInicial ?? null)
  const ultimoArquivoRef = useRef<File | null>(null)
  const { estado, selecionarArquivo, resetar } = useUploadImagem(itemId)
  const carregando = estado.status === 'comprimindo' || estado.status === 'enviando'

  useEffect(() => {
    if (estado.status === 'concluido' && estado.url) onChange(estado.url)
  }, [estado.status, estado.url, onChange])

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function processarArquivo(file: File) {
    ultimoArquivoRef.current = file
    setPreview(URL.createObjectURL(file))
    selecionarArquivo(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processarArquivo(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) processarArquivo(file)
  }

  function handleRemover() {
    setPreview(null)
    ultimoArquivoRef.current = null
    resetar()
    onChange(null)
  }

  function handleTentarNovamente() {
    if (ultimoArquivoRef.current) selecionarArquivo(ultimoArquivoRef.current)
  }

  if (estado.status === 'erro') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed border-status-danger bg-red-50 px-4 text-center">
        <CircleAlert className="w-6 h-6 text-status-danger" aria-hidden="true" />
        <p className="text-sm font-medium text-status-danger">{estado.erro}</p>
        <button
          type="button"
          onClick={handleTentarNovamente}
          className="flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-medium text-status-danger hover:underline"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Tentar novamente
        </button>
      </div>
    )
  }

  if (preview) {
    return (
      <div className="relative h-40 rounded-xl border border-brand-border overflow-hidden bg-brand-warm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Pré-visualização da foto do item"
          className={`w-full h-full object-cover transition-[filter] ${carregando ? 'brightness-75' : ''}`}
        />

        {carregando && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-3 py-2 bg-brand-primary/60">
            <Progress value={estado.progresso} className="bg-white/30" />
            <span className="text-xs font-medium text-white tabular-nums">
              {estado.status === 'comprimindo' ? 'Comprimindo…' : `Enviando… ${estado.progresso}%`}
            </span>
          </div>
        )}

        {!carregando && (
          <button
            type="button"
            onClick={handleRemover}
            aria-label="Remover foto"
            className="absolute top-2 right-2 flex items-center justify-center w-11 h-11 rounded-full bg-white shadow-sm text-brand-primary hover:text-status-danger transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    )
  }

  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-1.5 h-40 rounded-xl border-2 border-dashed border-brand-border bg-brand-warm/40 text-center cursor-pointer hover:border-brand-accent transition-colors"
    >
      <Camera className="w-6 h-6 text-brand-muted" aria-hidden="true" />
      <p className="text-sm font-medium text-brand-primary">Clique ou arraste uma foto</p>
      <p className="text-xs text-brand-muted">JPEG, PNG ou WebP • até 5MB</p>
      <input
        type="file"
        accept={TIPOS_ACEITOS}
        onChange={handleInputChange}
        className="sr-only"
      />
    </label>
  )
}
