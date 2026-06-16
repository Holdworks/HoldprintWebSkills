---
name: holdprint-mcp
description: Use when working with a Holdprint ERP through the hosted Holdprint MCP (tools named holdprint_*) — reading orçamentos/budgets, clientes, produção/jobs, financeiro, estoque or NFe/fiscal, or building reports, integrations and automations on Holdprint data. Triggers when the holdprint MCP is connected or the user mentions Holdprint, orçamento, NF-e, ordem de produção.
---

# Holdprint ERP via MCP

## O que é

O MCP da Holdprint expõe **10 tools genéricas** (`holdprint_*`). Você fala uma linguagem
simples; o servidor traduz para o formato interno da API, converte enums (ex.: `state 'Open' → 1`)
e **injeta `deleted: false` automaticamente** (não traz registros excluídos a menos que você peça).

Você NÃO escreve query Mongo aqui — isso é a skill `holdprint-mongo`. Aqui você usa as tools.

## Regra de ouro: descubra antes de consultar

Sempre siga este fluxo — não adivinhe nomes de entidade ou de campo:

1. `holdprint_discover` — resolve um termo pt-BR para a entidade canônica (ex.: "orçamento" → `Budget`) ou lista todas.
2. `holdprint_describe` — retorna os **nomes exatos dos campos** e enums daquela entidade.
3. `holdprint_query` / `holdprint_count` / `holdprint_aggregate` — leitura com os campos certos.

Para tarefas comuns, antes de montar do zero: `holdprint_examples` (jornadas prontas).

## As 10 tools

| Tool | Quando usar |
|---|---|
| `holdprint_discover` | Ponto de entrada de leitura: listar entidades ou resolver termo pt-BR → nome canônico |
| `holdprint_describe` | Ver campos/tipos/enums exatos de uma entidade antes de filtrar |
| `holdprint_query` | Listar registros com filtro simples, ordenação e paginação |
| `holdprint_count` | Contar registros sem trazer a lista ("quantos X") |
| `holdprint_aggregate` | sum/avg/min/max/count de um campo numérico, com `groupBy` opcional |
| `holdprint_get` | Buscar 1 registro por `id` |
| `holdprint_discover_actions` | Descobrir ações não-CRUD (ganhar orçamento, emitir NFe…) e seus parâmetros |
| `holdprint_action` | Executar uma ação. **`dryRun` é true por padrão** — veja abaixo |
| `holdprint_report` | Relatórios em R$ que somam sub-documentos (vendas_total, nfe_faturamento…) |
| `holdprint_examples` | Exemplos prontos de jornadas comuns |

Parâmetros detalhados de cada tool: ver `tools-reference.md`.
Receitas completas (relatórios, custo de orçamento, etc.): ver `journeys.md`.

## Filtros (`where`) — formato

```jsonc
// igualdade
{ "state": "Open" }
// operadores: eq, ne, contains, notContains, lt, lte, gt, gte, in
{ "code": { "gte": 100 }, "validityDate": { "lte": "2026-06-11" } }
```

- Datas em `YYYY-MM-DD`. Enums em **inglês** (`Open`, `Won`, `Lost`, `Approved`…), nunca em pt-BR nem números.
- `fields`: liste os campos que quer de volta (default traz o mínimo).
- `sort`: `'-campo'` (desc) ou `'campo'` (asc).

## Soft-delete e "somente ativos"

- Leitura traz só `deleted: false` por padrão. Para incluir a lixeira: `includeDeleted: true`.
- Coleções com flag `active` (ex.: Product, Entity, FinancialAccount): para "somente ativos",
  adicione `where: { active: true }`. Budget/Process/Equipment **não** têm `active` — use `state`.

## Ações são dry-run por padrão (segurança)

`holdprint_action` roda em **`dryRun: true`** e devolve uma PRÉVIA sem executar.
SEMPRE mostre a prévia ao usuário e só então execute com `dryRun: false`
(e `confirmed: true` se a ação for destrutiva). Nunca execute uma ação destrutiva sem confirmação explícita.

## Erros comuns

| Erro | Correção |
|---|---|
| Inventar nome de entidade/campo | Use `holdprint_discover` + `holdprint_describe` primeiro |
| Enum em pt-BR ou número (`"Ganho"`, `1`) | Use o valor em inglês (`"Won"`) |
| Somar valor em R$ com `aggregate` e vir errado | Valores moram em sub-docs → use `holdprint_report` |
| Executar ação sem mostrar a prévia | `holdprint_action` é dry-run; mostre antes de efetivar |
| Achar que "não tem dados" | Pode estar filtrando excluídos; tente `includeDeleted: true` para conferir |
