'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CircleAlert, RotateCcw, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useUploadLogo } from '@/hooks/use-upload-logo'

interface LogoUploadProps {
  logoUrlInicial?: string | null
  onChange: (url: string | null) => void
}

const TIPOS_ACEITOS = 'image/jpeg,image/png,image/webp'

export function LogoUpload({ logoUrlInicial, onChange }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(logoUrlInicial ?? null)
  const ultimoArquivoRef = useRef<File | null>(null)
  const { estado, selecionarArquivo, resetar } = useUploadLogo()
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

  return (
    <div className="flex items-center gap-4">
      {estado.status === 'erro' ? (
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-status-danger bg-red-50 px-3 py-2.5">
          <CircleAlert className="h-5 w-5 flex-shrink-0 text-status-danger" aria-hidden="true" />
          <p className="flex-1 text-sm text-status-danger">{estado.erro}</p>
          <button
            type="button"
            onClick={handleTentarNovamente}
            className="flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-medium text-status-danger hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      ) : preview ? (
        <>
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border border-brand-border bg-brand-warm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Pré-visualização da logo"
              className={`h-full w-full object-cover transition-[filter] ${carregando ? 'brightness-75' : ''}`}
            />

            {carregando && (
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-2 py-1.5 bg-brand-primary/60">
                <Progress value={estado.progresso} className="h-1 bg-white/30" />
              </div>
            )}

            {!carregando && (
              <button
                type="button"
                onClick={handleRemover}
                aria-label="Remover logo"
                className="absolute top-0 right-0 flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm text-brand-primary hover:text-status-danger transition-colors"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-brand-primary">Logo do restaurante</p>
            <p className="text-xs text-brand-muted">
              {carregando
                ? estado.status === 'comprimindo'
                  ? 'Comprimindo…'
                  : `Enviando… ${estado.progresso}%`
                : 'PNG, JPEG ou WebP · até 5MB'}
            </p>
          </div>
        </>
      ) : (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex h-24 w-24 flex-shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-brand-border bg-brand-warm/40 text-center hover:border-brand-accent transition-colors"
        >
          <Camera className="w-5 h-5 text-brand-muted" aria-hidden="true" />
          <input type="file" accept={TIPOS_ACEITOS} onChange={handleInputChange} className="sr-only" />
        </label>
      )}

      {!preview && estado.status !== 'erro' && (
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-brand-primary">Logo do restaurante</p>
          <p className="text-xs text-brand-muted">Clique ou arraste uma imagem · até 5MB</p>
        </div>
      )}
    </div>
  )
}
