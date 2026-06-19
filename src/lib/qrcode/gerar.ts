import QRCode from 'qrcode'

export async function gerarQrCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 320, margin: 2 })
}
