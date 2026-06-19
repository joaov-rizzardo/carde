import imageCompression from 'browser-image-compression'

const LIMITE_SEM_RECOMPRESSAO = 100 * 1024

export async function comprimirImagem(file: File): Promise<File> {
  if (file.size < LIMITE_SEM_RECOMPRESSAO) return file

  return imageCompression(file, {
    useWebWorker: true,
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    fileType: 'image/webp',
  })
}
