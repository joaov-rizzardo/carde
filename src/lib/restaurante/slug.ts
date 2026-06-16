import { prisma } from '@/lib/prisma'

/**
 * Gera um slug URL-safe a partir de um nome.
 *
 * Função pura e síncrona — usada tanto no preview em tempo real (cliente)
 * quanto como base de `gerarSlugUnico()` (servidor).
 *
 * - Normaliza acentos (NFD + remoção de diacríticos)
 * - Converte para minúsculas
 * - Substitui qualquer caractere não `[a-z0-9]` por hífen
 * - Colapsa hífens repetidos e remove hífens nas pontas
 */
export function gerarSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Gera um slug único para o restaurante, resolvendo colisões com sufixo numérico.
 *
 * Estratégia: tenta o slug base; se já existir no banco, tenta `base-2`,
 * `base-3`, ... até encontrar um livre. A garantia final de unicidade é o
 * índice `@unique` no banco — esta função apenas reduz a probabilidade de
 * colisão no `create` (que ainda deve tratar `P2002` como fallback).
 */
export async function gerarSlugUnico(nome: string): Promise<string> {
  const base = gerarSlug(nome)
  let candidato = base
  let sufixo = 2

  while (
    (await prisma.restaurante.findUnique({
      where: { slug: candidato },
      select: { id: true },
    })) !== null
  ) {
    candidato = `${base}-${sufixo}`
    sufixo += 1
  }

  return candidato
}
