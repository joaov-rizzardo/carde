# Etapa 2 — Onboarding do restaurante

## What

Fluxo guiado para criação do restaurante logo após o primeiro login. Cada usuário tem exatamente um restaurante associado.

**Entregáveis:**
- Página `/onboarding` com formulário de criação do restaurante
- Geração automática de slug único a partir do nome
- Redirecionamento para `/onboarding` quando usuário autenticado não tem restaurante
- Bloqueio de `/onboarding` para usuários que já possuem restaurante
- Endpoints de criação e consulta do restaurante do usuário logado

---

## Why

Após o primeiro login, o usuário existe no sistema mas ainda não tem contexto de negócio. Sem o restaurante criado:

- **Não há slug** — o cardápio público não pode existir
- **Não há escopo** — categorias e itens não têm a qual restaurante pertencer
- **Middleware não sabe o que mostrar** — precisa saber se redireciona para onboarding ou dashboard

O fluxo de onboarding resolve isso de forma imediata e obrigatória, garantindo que o invariante "usuário autenticado sempre tem restaurante" seja verdadeiro a partir da Etapa 3 em diante.

---

## How

### Schema
```prisma
model Restaurante {
  id           String   @id @default(cuid())
  slug         String   @unique
  nome         String
  descricao    String?
  corPrimaria  String   @default("#E85D04")
  logoUrl      String?
  ativo        Boolean  @default(true)
  donoId       String   @unique
  dono         User     @relation(fields: [donoId], references: [id])
  criadoEm    DateTime  @default(now())
  atualizadoEm DateTime @updatedAt
}
```

### API
| Método | Rota | Responsabilidade |
|---|---|---|
| POST | `/api/restaurantes` | Cria restaurante, gera slug único, associa ao usuário logado |
| GET | `/api/restaurantes/me` | Retorna restaurante do usuário logado |

### Geração de slug
```
"Sabor da Terra" → "sabor-da-terra"
# Se colidir: "sabor-da-terra-2", "sabor-da-terra-3", ...
```

### Lógica do middleware (atualização da Etapa 1)
```
usuário autenticado + sem restaurante → redirect /onboarding
usuário autenticado + com restaurante + em /onboarding → redirect /dashboard
usuário não autenticado → redirect /login
```

### UI
- `/onboarding` — formulário com:
  - Campo "Nome do restaurante" (obrigatório)
  - Picker de cor primária (padrão: `#E85D04`)
  - Preview do slug gerado em tempo real
  - Botão "Criar meu cardápio"

### Critérios de aceite
- [ ] Slug gerado automaticamente e único
- [ ] Usuário sem restaurante é redirecionado para `/onboarding`
- [ ] Usuário com restaurante não acessa `/onboarding` novamente
- [ ] Restaurante retornado corretamente em `GET /api/restaurantes/me`
