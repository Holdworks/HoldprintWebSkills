# Referência das tools `holdprint_*`

Parâmetros exatos de cada tool. (Os nomes de campo das *entidades* você obtém via `holdprint_describe`.)

## holdprint_discover
- `term?` (string) — termo livre em pt-BR ou nome técnico. Vazio = lista todas as entidades.
- Use para resolver "orçamento" → `Budget`, "cliente" → `Entity`, etc.

## holdprint_describe
- `collection` (string) — entidade ou termo pt-BR.
- Retorna: campos (`name`, `type`, `enum`, `enumValues`), descrição. Leitura traz só `deleted:false`.

## holdprint_query
- `collection` (string)
- `where?` (objeto) — filtros. Igualdade `{campo: valor}` ou operadores `{campo: {gte: x}}`.
  Operadores: `eq, ne, contains, notContains, lt, lte, gt, gte, in`.
- `fields?` (string[]) — campos a retornar. Vazio = mínimo.
- `sort?` — `'-campo'` (desc), `'campo'` (asc), `['-a','b']` ou `{campo:-1}`.
- `limit?` (1–500, default 50), `skip?` (paginação).
- `search?` (string) — busca textual livre.
- `includeDeleted?` (bool, default false).

## holdprint_count
- `collection`, `where?`, `includeDeleted?`. Conta server-side, não traz a lista.

## holdprint_aggregate
- `collection`
- `op` — `count | sum | avg | min | max`.
- `field?` — campo numérico (obrigatório para sum/avg/min/max).
- `where?`, `groupBy?` (campo para agrupar), `includeDeleted?`.
- Ex.: `{collection:'FinancialAccount', op:'sum', field:'amount', where:{active:true}}`.

## holdprint_get
- `collection`, `id` (string). GET por ID.

## holdprint_discover_actions
- `query` (string) — intenção pt-BR ou nome (ex.: "ganhar orçamento", "win-budget").
- Retorna `actionName`, parâmetros (`pathParams`, `bodyShape`), `destructive`, `sideEffects`.

## holdprint_action
- `actionName` (string) — de `holdprint_discover_actions`.
- `args?` (objeto) — path params + corpo.
- `dryRun?` (bool, **default true**) — false para executar de verdade.
- `confirmed?` (bool) — necessário (true) para ações destrutivas.
- Comportamento: dry-run devolve PRÉVIA. Mostre ao usuário antes de efetivar.

## holdprint_report
- `report` — um de: `vendas_total`, `nfe_faturamento_valor`, `nfe_faturamento_qtd`,
  `jobs_atrasados`, `jobs_finalizados`, `jobs_a_entregar`, `lucro_mensal`,
  `margem_contribuicao`, `custo_fixo`.
- `startDate`, `endDate` (YYYY-MM-DD).
- Use para valores em R$ que somam sub-documentos (o `aggregate` não alcança).

## holdprint_examples
- `query` (string) — intenção/categoria pt-BR. Retorna exemplos com `args` já modelados.
