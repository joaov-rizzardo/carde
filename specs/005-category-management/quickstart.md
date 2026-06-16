# Quickstart: Validação de Gestão de Categorias

## Pré-requisitos

1. Ambiente local rodando: `npm run dev` (Next.js em `http://localhost:3000`)
2. Banco de dados migrado: `npx prisma migrate dev`
3. Conta de usuário criada com restaurante associado (fluxo de onboarding completo)
4. Sessão autenticada no browser

---

## Cenário 1: Estado vazio e criação da primeira categoria

1. Faça login e acesse `/dashboard/categorias`
2. **Esperado**: página exibe skeleton de loading, depois "Nenhuma categoria ainda" + botão "Criar categoria"
3. Clique em "Criar categoria"
4. **Esperado**: modal abre com campo "Nome da categoria" e botão "Salvar"
5. Preencha "Entradas" e clique em "Salvar"
6. **Esperado**: modal fecha, "Entradas" aparece na lista com alça de arrastar, ícones de editar e excluir

---

## Cenário 2: Criar segunda e terceira categoria

1. Clique em "+ Nova categoria" (botão no topo da lista)
2. Crie "Pratos Principais" → aparecem na lista
3. Crie "Bebidas"
4. **Esperado**: lista exibe em ordem: Entradas (0), Pratos Principais (1), Bebidas (2)

---

## Cenário 3: Reordenar por drag-and-drop

1. Com 3+ categorias visíveis, arraste "Bebidas" para o topo
2. **Esperado**: lista reordena em tempo real enquanto arrasta
3. Solte na posição
4. **Esperado**: ordem é salva (nenhum spinner visível por mais de 200ms)
5. Recarregue a página (`F5`)
6. **Esperado**: a nova ordem persiste após refresh

---

## Cenário 4: Editar nome

1. Clique no ícone de editar (✏) ao lado de "Entradas"
2. **Esperado**: modal abre com "Entradas" pré-preenchido no campo nome
3. Apague e escreva "Aperitivos"
4. Clique "Salvar"
5. **Esperado**: modal fecha, lista exibe "Aperitivos" no mesmo lugar

---

## Cenário 5: Excluir categoria vazia

1. Clique no ícone de excluir (🗑) ao lado de uma categoria sem itens
2. **Esperado**: diálogo de confirmação aparece ("Tem certeza?")
3. Clique "Cancelar" → **Esperado**: nada muda
4. Clique em excluir novamente → confirme
5. **Esperado**: categoria desaparece da lista; se era a última, estado vazio retorna

---

## Cenário 6: Bloqueio de exclusão com itens

> *Requer inserção manual no banco para este cenário até que a feature de itens exista*

```sql
-- Insira um item vinculado a uma categoria
INSERT INTO "Item" (id, "categoriaId") VALUES (gen_random_uuid(), '<categoria-id>');
```

1. Clique em excluir a categoria com item vinculado
2. **Esperado**: após confirmação, o sistema exibe "Esta categoria possui itens e não pode ser excluída" — categoria permanece na lista

---

## Cenário 7: Validação de nome vazio

1. Abra o modal de criar ou editar
2. Apague todo o conteúdo do campo nome
3. Clique "Salvar"
4. **Esperado**: campo mostra erro inline, modal não fecha, nenhuma chamada de API é feita

---

## Cenário 8: Teste de autorização via API

```bash
# Sem sessão → 401
curl -X GET http://localhost:3000/api/categorias

# Com ID de categoria de outro restaurante → 403
# (substituir <outro-id> por um ID real de outro restaurante)
curl -X DELETE http://localhost:3000/api/categorias/<outro-id> \
  -H "Cookie: <session-cookie>"
```

---

## Referências

- Contratos de API completos: [contracts/api.md](./contracts/api.md)
- Modelo de dados e migration: [data-model.md](./data-model.md)
- Critérios de aceite detalhados: [spec.md](./spec.md)
