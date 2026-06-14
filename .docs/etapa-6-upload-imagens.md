# Etapa 6 — Upload de imagens

## What

Funcionalidade de upload de foto para cada item do cardápio. Imagem comprimida no browser, armazenada no Supabase Storage.

**Entregáveis:**
- Componente `ImageUpload` integrado ao formulário de item (Etapa 5)
- Preview da imagem antes de salvar
- Indicador de progresso durante upload
- Botão de remover imagem existente
- Endpoint de upload com validação de tipo e tamanho
- Remoção automática da imagem anterior ao substituir

---

## Why

Fotos são o maior fator de conversão em um cardápio digital — clientes compram com os olhos. As restrições técnicas existem por razões práticas:

- **Compressão no browser** — reduz custo de transferência e storage sem precisar de processamento server-side; usuários costumam enviar fotos direto da câmera (> 5MB)
- **Máximo 500KB / 1200px** — equilibrio entre qualidade visual e velocidade de carregamento no 4G do cliente final
- **Conversão para WebP** — melhor compressão que JPEG/PNG para imagens de comida
- **Remoção da imagem anterior** — evita acúmulo de arquivos órfãos no storage que geram custo sem utilidade
- **Path com timestamp** — evita colisão de nomes e problemas de cache de CDN ao substituir imagem

---

## How

### Regras de negócio
| Regra | Valor |
|---|---|
| Tamanho máximo (antes da compressão) | 5 MB |
| Formatos aceitos | JPEG, PNG, WebP |
| Tamanho após compressão | ≤ 500 KB |
| Largura máxima | 1200 px |
| Formato de saída | WebP |
| Path no storage | `/{restauranteId}/{itemId}-{timestamp}.webp` |

### API
| Método | Rota | Responsabilidade |
|---|---|---|
| POST | `/api/upload` | Recebe `FormData`, valida tipo/tamanho, faz upload no Supabase Storage, retorna URL pública |

**Request:** `multipart/form-data` com campo `file` + `itemId` (para construir o path)

**Response:**
```json
{ "url": "https://supabase.co/storage/v1/object/public/..." }
```

**Erros:**
- 400: tipo inválido, arquivo ausente
- 413: arquivo maior que 5MB
- 500: falha no upload para o storage

### Compressão no browser
Usar biblioteca `browser-image-compression` (ou Canvas API):
```ts
const compressed = await imageCompression(file, {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  fileType: 'image/webp',
  useWebWorker: true,
})
```

### Fluxo completo de upload
```
1. Usuário seleciona arquivo
2. Preview local imediato (URL.createObjectURL)
3. Compressão no browser (web worker, não bloqueia UI)
4. POST /api/upload → retorna URL pública
5. URL salva no campo imagemUrl do item
6. Se item já tinha imagemUrl → servidor deleta arquivo anterior do storage
```

### Componente ImageUpload
```
┌─────────────────────────────────┐
│                                 │
│      [ clique ou arraste ]      │  ← estado vazio
│      JPEG, PNG, WebP • 5MB max  │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  [preview da imagem]            │
│                      [Remover]  │  ← com imagem
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  ████████░░░░░░  68%            │  ← durante upload
└─────────────────────────────────┘
```

### Critérios de aceite
- [ ] Upload funciona e retorna URL pública
- [ ] Compressão reduz arquivos grandes antes do envio
- [ ] Arquivo inválido (tipo ou tamanho) retorna erro claro
- [ ] Imagem anterior é deletada do storage ao substituir
- [ ] Preview aparece antes de salvar o item
