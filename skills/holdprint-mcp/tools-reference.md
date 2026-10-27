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
- `dryRun?` (bool, **default false**) — true só simula (prévia sem executar). O nome é `dryRun`, não `dry_run`.
- Ação **não destrutiva** executa direto. Ação `destructive` devolve erro e manda usar a prévia + execução.
- Não há mais `confirmed`: enviar `confirmed: true` não executa nada.
- Anotação MCP: `destructiveHint: true` (a marcação por ação vem do catálogo).

## holdprint_action_preview
- `actionName` (string), `args?` (objeto) — os mesmos da execução.
- Não executa nada (`readOnlyHint: true`). Devolve método, rota, corpo, efeitos colaterais, aviso de cascata e `previewId`.
- Obrigatória para ações `destructive`; opcional nas demais.

## holdprint_action_execute
- `previewId` (string) — só ele. Executa exatamente o `actionName` + `args` da prévia.
- O `previewId` é de uso único, vale 10 minutos e só serve para a mesma conta, usuário e ação. Ausente, de outra conta,
  já usado, vencido ou de outra ação: erro, e nada é enviado ao ERP.

## holdprint_attach_document
- `budgetId` (string, 24 caracteres), `html` (string, até 1 MB), `fileName?` (vira `.html`; sem nome usa orçamento + data).
- Recusa, antes de qualquer chamada ao ERP: HTML vazio, > 1 MB, `<script>`, atributo `on...=`, `javascript:`, `iframe`,
  `object`, `embed`, `base`, `meta refresh`. Orçamento inexistente na conta ou importado: erro, sem arquivo novo.
- Devolve `accountFileId`, `fileName`, `budgetId`, `bytes`. O arquivo aparece na aba de anexos do orçamento.

## Importações em lote — `holdprint_import`, `holdprint_import_financials`, `holdprint_import_stock`, `holdprint_import_feedstock`
- `rows` (até 500 linhas, objetos coluna→valor) e `mapping` (coluna→campo); demais opções variam por tool.
- `dry_run?` (bool, **default true**) — true devolve a simulação e um `previewId`.
- `previewId?` — **obrigatório com `dry_run: false`**: o da simulação do mesmo conteúdo (mesmas linhas, mapeamento e
  opções). Uso único, 10 minutos. Sem ele, ou com conteúdo alterado, nada é criado.
- Em `holdprint_import_feedstock` cada lote (`lote`/`total_lotes`) tem a sua simulação e o seu `previewId`.

## Outras tools
- `holdprint_whoami` — sem parâmetros. Conta, usuário e empresa padrão.
- `holdprint_job_slim` — `id` do Job. Resumo da ordem de produção.
- `holdprint_checkup` — `year`, `months?`, `kpis?`. Raio-X gerencial mês a mês.
- `holdprint_breakeven` — `year`, `month?`, `withRanking?`. Ponto de equilíbrio.
- `holdprint_budget_link` — `budgetId`. Link público do orçamento (idempotente).
- `holdprint_add_item` — adiciona um item com medidas a um orçamento e calcula.
- `holdprint_stock_movement`, `holdprint_stock_transfer`, `holdprint_set_feedstock_price` — estoque e preço de matéria-prima.
- `holdprint_lookup_cnpj` (`cnpj`), `holdprint_lookup_cep` (`cep`) — dados públicos (fonte externa).

## Anotações MCP
Todas as tools trazem `readOnlyHint`; as de escrita trazem `destructiveHint` explícito. São de leitura todas as `holdprint_*`
de consulta e `holdprint_action_preview`. Destrutivas: `holdprint_action`, `holdprint_action_execute`,
`holdprint_import_financials`, `holdprint_import_stock`. Escrita não destrutiva: `holdprint_attach_document`,
`holdprint_import`, `holdprint_import_feedstock`, `holdprint_budget_link`, `holdprint_add_item` e as de estoque.

## holdprint_report
- `report` — um de: `vendas_total`, `nfe_faturamento_valor`, `nfe_faturamento_qtd`,
  `jobs_atrasados`, `jobs_finalizados`, `jobs_a_entregar`, `lucro_mensal`,
  `margem_contribuicao`, `custo_fixo`.
- `startDate`, `endDate` (YYYY-MM-DD).
- Use para valores em R$ que somam sub-documentos (o `aggregate` não alcança).

## holdprint_examples
- `query` (string) — intenção/categoria pt-BR. Retorna exemplos com `args` já modelados.
