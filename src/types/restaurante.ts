/**
 * DTO de restaurante retornado pelas API routes
 * (`POST /api/restaurantes` e `GET /api/restaurantes/me`).
 */
export type RestauranteDto = {
  id: string
  slug: string
  nome: string
  corPrimaria: string
  ativo: boolean
  criadoEm: string // ISO 8601
}
