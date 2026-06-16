---
name: holdprint-mongo
description: Use when querying a Holdprint ERP directly through a read-only MongoDB connection string (database named holdprint-db-<id>) — reading Budget, CostMemento, Product, Process, Equipment or Feedstock, custeio/orçamento, custom dynamic fields, or blocks. Triggers when MongoDB results contain keys like "hold..." or polymorphic objects with a class_name field that need decoding, or when joining a budget to its cost.
---

# Holdprint ERP via MongoDB (read-only)

## Contexto

A connection string aponta para o banco do tenant: **`holdprint-db-<clientId>`**. É **somente
leitura** — nunca escreva. As collections usam **CamelCase** (`Budget`, `CostMemento`, `Product`…),
e os campos internos usam **snake_case** (`budget_title`, `total_price`, `public_identification`).

Esta skill existe porque 4 coisas quebram LLMs no banco da Holdprint. Leia o arquivo certo:

| Tema | Arquivo |
|---|---|
| Collections, campos e enums (Budget, CostMemento, Block…) | `schema-reference.md` |
| Como ligar orçamento → custo (joins não-óbvios) | `relationships.md` |
| Campos dinâmicos (`fields_values`, chaves `hold…`, FieldResolver) | `dynamic-fields.md` |
| Queries/aggregations prontas | `query-cookbook.md` |

## 5 regras de ouro (decoram quase tudo)

1. **Soft-delete sempre.** A Holdprint nunca apaga de verdade. Toda query de usuário final
   precisa de `{ deleted: false }` (ou `{ deleted: { $ne: true } }`). Sem isso, você traz a lixeira.

2. **"Ativos" tem 2 dimensões.** Coleções com flag `active` (Product, Entity, FinancialAccount, etc.):
   `{ deleted: false, active: true }`. Budget/Process/Equipment **não têm `active`** — filtre por `state`/`status`.

3. **Coleções versionadas.** `CostMemento` e `CostCenterGroup` guardam histórico em `version`.
   Para a versão vigente, ordene `sort({ version: -1 })` e pegue a primeira.

4. **Custo (orçamento) não está no Budget.** O valor calculado vive em **`CostMemento`**.
   Ligue por `Budget.code == CostMemento.public_identification` (ambos **inteiros**). Ver `relationships.md`.

5. **Campos dinâmicos vêm como `hold<ObjectId>`.** Em `fields_values`, as chaves são `"hold"+_id`
   de um campo da collection `Fields`, e o valor é um objeto polimórfico com `class_name`.
   Você precisa do "FieldResolver" para traduzir. Ver `dynamic-fields.md`.

> **Enums são inteiros no banco cru.** Diferente do MCP (que aceita string), aqui `state`, `block_type`,
> `block_content_type` etc. são números. Ex.: orçamento ganho = `{ state: 3 }`, não `"Won"`. Tabelas em `schema-reference.md`.

> **"Bloco simples" vs "bloco composto"** = o campo `block_content_type` de um `BlockContent`:
> `SimpleField` (1) é um campo simples, `ComposedFields` (2) é o grupo de campos compostos, `Filter` (3) é filtro.
> O `Block` em si é classificado por `block_type` (outra coisa). Ver `schema-reference.md`.

## Dot-notation (MongoDB)

- Aninhado: `address.city`. Item de array por índice: `items.0.name` (**não** `items[0].name`).
- Para desmontar objetos dinâmicos use `$objectToArray`; para arrays use `$unwind` (ver cookbook).

## Erros clássicos a evitar

- Esquecer `deleted: false` → resultados com lixo/excluídos.
- Procurar `total_price` dentro de `Budget` → não existe; está em `CostMemento`.
- Tentar casar `Budget._id` com `CostMemento` → o vínculo é `code` ↔ `public_identification` (int).
- Ler `fields_values` e reportar a chave crua `hold5db1…` → resolva o nome via `Fields`.
- Confundir os níveis de bloco → `Block.block_type` classifica o bloco; "simples vs composto" é
  `BlockContent.block_content_type` (`SimpleField`/`ComposedFields`). Ver `schema-reference.md`.
- Filtrar `state` com string (`"Won"`) → no banco cru `state` é inteiro (`3`). Ver tabela de enums.
- Pegar uma versão antiga de `CostMemento` → ordene por `version` desc.
