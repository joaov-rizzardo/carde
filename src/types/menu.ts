export interface MenuItemDto {
  id: string
  nome: string
  preco: string
  descricao: string | null
  fotoUrl: string | null
}

export interface MenuCategoriaDto {
  id: string
  nome: string
  itens: MenuItemDto[]
}

export interface MenuRestauranteDto {
  nome: string
  descricao: string | null
  corPrimaria: string
  logoUrl: string | null
  categorias: MenuCategoriaDto[]
}
