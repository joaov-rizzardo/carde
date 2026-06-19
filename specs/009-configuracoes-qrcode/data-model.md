# Data Model: Configurações e QR Code

Nenhuma migration Prisma nesta feature. `Restaurante` já tem todos os campos necessários desde `001-base-infra-setup`/`003-restaurant-onboarding`.

## Entidade: Restaurante (reaproveitada)

```prisma
model Restaurante {
  id           String      @id @default(cuid())
  slug         String      @unique   // FR-008: NUNCA alterado por esta feature
  nome         String                // FR-003/FR-004: editável, obrigatório
  descricao    String?               // FR-003: editável, opcional
  corPrimaria  String      @default("#E85D04")  // FR-003: editável
  logoUrl      String?               // FR-005: editável (substituir/remover)
  ativo        Boolean     @default(true)
  donoId       String      @unique
  criadoEm     DateTime    @default(now())
  atualizadoEm DateTime    @updatedAt
}
```

Campos tocados por `PUT /api/restaurantes/me`: `nome`, `descricao`, `corPrimaria`, `logoUrl`. Nenhum outro campo é aceito no body (em particular, `slug` nunca é parte do schema Zod desta rota — FR-008).

## DTO: RestauranteDto (estendido)

Antes (`005`–`008`):

```ts
export type RestauranteDto = {
  id: string
  slug: string
  nome: string
  corPrimaria: string
  ativo: boolean
  criadoEm: string // ISO 8601
}
```

Depois (`009`):

```ts
export type RestauranteDto = {
  id: string
  slug: string
  nome: string
  descricao: string | null
  corPrimaria: string
  logoUrl: string | null
  ativo: boolean
  criadoEm: string // ISO 8601
}
```

`descricao`/`logoUrl` seguem o mesmo padrão de nullability já usado em `ItemDto.descricao`/`ItemDto.fotoUrl` (`string | null`, nunca `undefined` na resposta — `undefined` só é usado nos schemas Zod de *entrada* para campos opcionais).

## Storage: buckets do Supabase

| Bucket | Path | Usado por | Desde |
|---|---|---|---|
| `item-fotos` | `{restauranteId}/{itemId}-{timestamp}.webp` | `POST /api/upload`, `PUT/DELETE /api/itens/[id]` | `007` |
| `restaurante-logos` | `{restauranteId}/logo-{timestamp}.webp` | `POST /api/restaurantes/logo`, `PUT /api/restaurantes/me` | `009` (novo) |

Ambos são buckets públicos (mesma configuração de `item-fotos`, documentada em `specs/007-image-upload/quickstart.md`), lidos via `enviarArquivo(bucket, buffer, path)` / `removerArquivo(bucket, url)` generalizados (ver `research.md` #3).

## Valor derivado: URL pública do cardápio (não persistido)

```ts
const menuUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/menu/${restaurante.slug}`
```

Usado tanto para o `<a href={menuUrl} target="_blank">` (preview) quanto como entrada de `gerarQrCodeDataUrl(menuUrl)`. Não é um campo de banco — é recalculado a cada carregamento da página a partir do `slug` já persistido.

## QR code (não persistido)

`gerarQrCodeDataUrl(url: string): Promise<string>` retorna uma string `data:image/png;base64,...` — vive apenas na resposta HTML da requisição corrente, nunca é salvo em disco/storage/banco (ver `spec.md` → Assumptions).
