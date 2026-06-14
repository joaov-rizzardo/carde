# Etapa 8 — Configurações e QR code

## What

Painel de configurações do restaurante com geração e download do QR code. Última etapa do MVP.

**Entregáveis:**
- Página `/dashboard/configuracoes` com formulário de dados do restaurante
- Exibição do QR code gerado a partir do slug
- Download do QR code em PNG
- Link para preview do cardápio público
- Endpoint de atualização do restaurante

---

## Why

O QR code é o ponto de contato físico entre o restaurante e o cliente — é o que vai impresso no menu, na mesa, no balcão. Sem ele, o cardápio digital não chega ao cliente.

As configurações de aparência (nome, cor, logo) fecham o ciclo: o dono configurou o restaurante no onboarding com o mínimo necessário, agora pode refinar com logo e descrição para personalizar a experiência do cardápio público.

Esta etapa conclui o MVP: o restaurante tem cardápio criado, organizado, com fotos, e um QR code para colocar nas mesas.

---

## How

### API
| Método | Rota | Responsabilidade |
|---|---|---|
| PUT | `/api/restaurantes/me` | Atualiza nome, cor, logo e descrição do restaurante do usuário logado |

**Payload:**
```json
{
  "nome": "Sabor da Terra",
  "descricao": "Comida caseira com ingredientes frescos",
  "corPrimaria": "#E85D04",
  "logoUrl": "https://..."
}
```

### Geração do QR code
- Biblioteca: `qrcode` (npm) ou `react-qr-code`
- URL codificada: `https://carde.app/menu/{slug}`
- Renderizado em `<canvas>` ou `<svg>` no cliente
- Download: converter canvas para PNG via `canvas.toDataURL('image/png')`

```ts
// Geração
const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/menu/${restaurante.slug}`

// Download
const link = document.createElement('a')
link.download = `qrcode-${restaurante.slug}.png`
link.href = canvas.toDataURL('image/png')
link.click()
```

### UI — `/dashboard/configuracoes`
```
┌─────────────────────────────────────────────────────┐
│  Configurações do restaurante                       │
│                                                     │
│  Nome  [Sabor da Terra              ]               │
│  Desc. [Comida caseira...           ]               │
│  Cor   [■ #E85D04] picker           │               │
│  Logo  [ImageUpload]                │               │
│                                     │               │
│  [Salvar alterações]                │               │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│  Seu QR code                                        │
│                                                     │
│        ████ ██ ██ ████                              │
│        ██ ████ █ ████   ← QR code                  │
│        ████ ██ ██ ████                              │
│                                                     │
│  [Baixar PNG]    [Ver cardápio público ↗]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Reutilização
- Componente `ImageUpload` da Etapa 6 reutilizado para o campo de logo
- A URL do logo vai para `restaurante.logoUrl` e aparece no header do cardápio público (Etapa 7)

### Critérios de aceite
- [ ] QR code aponta corretamente para `/menu/[slug]`
- [ ] Download do QR code em PNG funciona
- [ ] Alterações de nome e cor refletem no cardápio público
- [ ] Upload de logo funciona (reutiliza componente da Etapa 6)

---

## MVP concluído

Ao completar esta etapa, o produto está pronto para os primeiros clientes:

1. Restaurante cria conta e passa pelo onboarding ✓
2. Cria categorias e cadastra os itens com fotos ✓
3. Acessa configurações, baixa o QR code e coloca nas mesas ✓
4. Cliente escaneia, vê o cardápio bonito no celular, sem app ✓
