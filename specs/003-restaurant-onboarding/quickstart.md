# Quickstart: Validação do Onboarding do Restaurante

**Feature**: 003-restaurant-onboarding | **Date**: 2026-06-15

---

## Pré-requisitos

- Projeto rodando localmente: `npm run dev` (porta 3000)
- Banco com migration `add-restaurante` aplicada: `npx prisma migrate dev`
- Usuário de teste sem restaurante disponível (ver setup abaixo)
- Usuário de teste com restaurante disponível (ver setup abaixo)

### Setup: criar usuários de teste

```bash
# Usuário sem restaurante — usar magic link ou Google com e-mail novo
# Usuário com restaurante — criar via Prisma Studio ou após rodar Cenário 2

npx prisma studio   # Abrir em localhost:5555 para inspecionar dados
```

---

## Cenário 1: Usuário sem restaurante é redirecionado para `/onboarding`

**Pré-condição**: logado com usuário sem restaurante

1. Acesse `http://localhost:3000/dashboard`
2. **Esperado**: redirect automático para `http://localhost:3000/onboarding`
3. **Esperado**: formulário de onboarding é exibido com campo "Nome do restaurante" e color picker

**Verifica**: FR-001, SC-002, middleware com `restauranteId: null`

---

## Cenário 2: Criar restaurante via formulário

**Pré-condição**: está em `/onboarding` com usuário sem restaurante

1. Campo "Nome do restaurante": digitar `"Sabor da Terra"`
2. **Esperado imediato**: preview do slug exibe `sabor-da-terra` abaixo do campo
3. Alterar nome para `"Café & Cia"` 
4. **Esperado imediato**: preview atualiza para `cafe-cia` (caractere especial removido)
5. Color picker: selecionar cor diferente do padrão (ex: `#2563EB`)
6. Clicar em "Criar meu cardápio"
7. **Esperado**: botão mostra spinner; campo fica desabilitado
8. **Esperado**: após ~1s, redirect para `http://localhost:3000/dashboard`
9. Verificar no Prisma Studio: `Restaurante` criado com `slug: "cafe-cia"`, `corPrimaria: "#2563EB"`, `donoId` correto

**Verifica**: FR-004, FR-005, FR-006, FR-008, SC-001, SC-004

---

## Cenário 3: Validação de nome vazio

**Pré-condição**: está em `/onboarding` com usuário sem restaurante

1. Deixar campo "Nome do restaurante" vazio
2. Clicar em "Criar meu cardápio"
3. **Esperado**: mensagem de erro inline "Nome é obrigatório" (sem reload de página)
4. **Esperado**: nenhum request enviado ao servidor; restaurante não criado

**Verifica**: FR-007, SC-005

---

## Cenário 4: Usuário com restaurante não acessa `/onboarding`

**Pré-condição**: logado com usuário que já tem restaurante (criado no Cenário 2)

1. Acesse `http://localhost:3000/onboarding` diretamente (URL bar)
2. **Esperado**: redirect automático para `http://localhost:3000/dashboard`
3. **Esperado**: formulário de onboarding NÃO é exibido

**Verifica**: FR-002, SC-003

---

## Cenário 5: Endpoint `GET /api/restaurantes/me`

**Pré-condição**: logado com usuário que tem restaurante

1. Abrir DevTools → aba Network
2. Acesse `http://localhost:3000/dashboard` (ou qualquer página que chame o endpoint)
3. Também pode testar diretamente: `curl -H "Cookie: <seu-cookie>" http://localhost:3000/api/restaurantes/me`
4. **Esperado**: resposta 200 com `{ sucesso: true, dados: { id, slug, nome, corPrimaria, ativo, criadoEm } }`

Com usuário sem restaurante:
1. **Esperado**: resposta 200 com `{ sucesso: true, dados: null }`

**Verifica**: FR-010, cenários de User Story 3

---

## Cenário 6: Usuário não autenticado é bloqueado

**Pré-condição**: sem sessão ativa (aba anônima ou após logout)

1. Acesse `http://localhost:3000/onboarding`
2. **Esperado**: redirect para `http://localhost:3000/login`
3. Acesse `http://localhost:3000/dashboard`
4. **Esperado**: redirect para `http://localhost:3000/login`

**Verifica**: FR-003

---

## Cenário 7: Colisão de slug

**Simulação** (via Prisma Studio ou script):

1. Criar manualmente um `Restaurante` com `slug: "pizza-boa"` para outro usuário
2. Logar com um terceiro usuário sem restaurante
3. Preencher "Pizza Boa" no formulário
4. Submeter
5. **Esperado**: restaurante criado com `slug: "pizza-boa-2"` (sem erro para o usuário)

**Verifica**: FR-006, SC-004

---

## Referências

- Contratos dos endpoints: [`contracts/api.md`](./contracts/api.md)
- Lógica de middleware: [`contracts/middleware.md`](./contracts/middleware.md)
- Modelo de dados e migração: [`data-model.md`](./data-model.md)
- Decisões técnicas: [`research.md`](./research.md)
