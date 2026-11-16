# Tools do MCP

28 tools — a LLM as compõe para qualquer pergunta. Você não precisa decorá-las; esta referência é para conferência. As de leitura não alteram nada; as de escrita seguem a regra de prévia abaixo.

## Fluxo canônico

Não chute nomes de entidade ou campo. Sempre: `discover` → `describe` → `query` / `count` / `aggregate`. Para valores em R$ que somam sub-documentos, use `report`. Para escrever, `discover_actions` → `action` (dry-run primeiro).

### `holdprint_discover`leitura

Resolve um termo em português para a entidade canônica, ou lista todas.

`term`opcional

termo livre pt-BR ou nome técnico. Vazio = lista tudo.

### `holdprint_describe`leitura

Retorna os campos exatos (nome, tipo, enum e valores) de uma entidade. Use antes de filtrar.

`collection`

entidade ou termo pt-BR.

### `holdprint_query`leitura

Lê registros com filtro, ordenação e paginação. Traz só `deleted:false` por padrão.

`collection`

entidade.

`where`opcional

igualdade `{campo: valor}` ou operadores `{campo: {gte: x}}`: eq, ne, contains, notContains, lt, lte, gt, gte, in.

`fields`opcional

campos a retornar.

`sort`opcional

`'-campo'` (desc), `'campo'` (asc), `['-a','b']` ou `{campo:-1}`.

`limit`opcional

1–500 (default 50).

`skip`opcional

paginação.

`search`opcional

busca textual livre.

```javascript
holdprint_query({
  collection: "Budget",
  where: { state: "Won" },
  sort: "-total_price", limit: 10
})
```

### `holdprint_count`leitura

Conta registros no servidor sem trazer a lista. Exato.

`collection, where`opcional

mesma sintaxe do query.

### `holdprint_aggregate`leitura

sum / avg / min / max / count de um campo numérico, com agrupamento opcional. Some/avg varrem o conjunto inteiro (exato).

`op`

count | sum | avg | min | max.

`field`opcional

campo numérico (obrigatório p/ sum/avg/min/max). Aceita dot-notation: `bankAccount.amount`.

`groupBy`opcional

campo para agrupar (ex.: status, vendedor).

```javascript
holdprint_aggregate({
  collection: "Budget", op: "count",
  where: { state: "Won" }, groupBy: "sellerName"
})
```

### `holdprint_get`leitura

Busca um registro por id.

`collection, id`

—

### `holdprint_report`leitura · R$

Relatórios de dashboard que somam sub-documentos (o que o aggregate genérico não alcança).

`report`

vendas\_total · nfe\_faturamento\_valor · nfe\_faturamento\_qtd · jobs\_atrasados · jobs\_finalizados · jobs\_a\_entregar · lucro\_mensal · margem\_contribuicao · custo\_fixo · saldo\_contas.

`startDate, endDate`

YYYY-MM-DD (saldo\_contas dispensa datas).

### `holdprint_discover_actions`ação

Descobre ações não-CRUD (ganhar orçamento, emitir NFe, liquidar despesa…) e seus parâmetros.

`query`

intenção pt-BR ou nome (ex.: "ganhar orçamento").

### `holdprint_action`escrita

Executa uma ação **não destrutiva**, direto. Ação marcada `destructive` é recusada aqui: use a prévia e a execução abaixo.

`actionName`

de discover\_actions.

`args`opcional

path params + corpo.

`dryRun`opcional

default **false**. true só simula (o nome é `dryRun`, não `dry_run`).

### `holdprint_action_preview`leitura

Simula uma ação sem executar: devolve o efeito (rota, corpo, efeitos colaterais, aviso de cascata) e um `previewId`. Obrigatória nas ações destrutivas.

`actionName`

de discover\_actions.

`args`opcional

os mesmos da execução.

### `holdprint_action_execute`escrita

Executa exatamente o que a prévia mostrou. O `previewId` é de uso único, vale 10 minutos e só serve para a mesma conta, usuário e ação.

`previewId`

devolvido por holdprint\_action\_preview.

### `holdprint_attach_document`escrita

Anexa ao orçamento um HTML gerado pela IA (ex.: a proposta). HTML vazio, acima de 1 MB ou com `<script>`, atributo `on...=`, `javascript:`, iframe, object, embed, base ou meta refresh é recusado antes de qualquer chamada ao ERP. Orçamento inexistente ou importado também é recusado.

`budgetId`

id do orçamento (de holdprint\_query).

`html`

documento HTML completo e estático, até 1 MB.

`fileName`opcional

nome do arquivo (vira .html).

### `holdprint_import`escrita

Importações em lote (clientes/fornecedores, contas a receber e a pagar, movimentações de estoque, matérias-primas). Simulam por padrão e só gravam com o `previewId` da simulação do mesmo conteúdo.

`rows`

até 500 linhas (coluna→valor).

`mapping`

coluna→campo.

`dry_run`opcional

default **true**: simula e devolve o `previewId`.

`previewId`opcional

obrigatório com `dry_run:false`; uso único, 10 minutos, mesmo conteúdo.

### `outras tools`leitura e escrita

`holdprint_whoami`, `holdprint_job_slim`, `holdprint_checkup`, `holdprint_breakeven`, `holdprint_lookup_cnpj` e `holdprint_lookup_cep` (leitura); `holdprint_budget_link`, `holdprint_add_item`, `holdprint_stock_movement`, `holdprint_stock_transfer` e `holdprint_set_feedstock_price` (escrita não destrutiva). Toda tool traz as anotações MCP `readOnlyHint` e `destructiveHint`, que os clientes usam para pedir confirmação.

### `holdprint_examples`leitura

Retorna jornadas comuns com os `args` já modelados — use antes de montar do zero.

> **Ação destrutiva exige prévia**
> 
> Apagar, liquidar, estornar e emitir ou cancelar nota passam por duas etapas: a prévia mostra o efeito e devolve um código de uso único (10 minutos); só ele executa. Importações em lote seguem a mesma regra. Ação não destrutiva executa direto.

---
Fonte: https://docs.holdworks.ai/conectar-ia/tools-do-mcp/
