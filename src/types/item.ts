export interface ItemDto {
  id: string
  nome: string
  preco: string
  descricao: string | null
  fotoUrl: string | null
  disponivel: boolean
  destaque: boolean
  ordem: number
  categoriaId: string
}

export interface CategoriaComItensDto {
  id: string
  nome: string
  ordem: number
  itens: ItemDto[]
}
