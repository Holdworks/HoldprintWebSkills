# Jornadas comuns (via MCP)

Receitas testadas. Sempre confirme nomes de campo com `holdprint_describe` antes de filtrar.

## Quanto faturei no período?
Valores em R$ moram em sub-documentos → use o relatório, não o aggregate.
```
holdprint_report { report: "vendas_total", startDate: "2026-01-01", endDate: "2026-06-30" }
```

## Orçamentos abertos / ganhos / perdidos
```
holdprint_count { collection: "Budget", where: { state: "Open" } }
holdprint_count { collection: "Budget", where: { state: "Won" } }
```
Enum `state` em inglês. Para a lista:
```
holdprint_query { collection: "Budget", where: { state: "Open" },
                  fields: ["code","budget_title","customer","state"], sort: "-creation_time", limit: 50 }
```

## Ganhos por vendedor
```
holdprint_aggregate { collection: "Budget", op: "count", where: { state: "Won" }, groupBy: "sellerName" }
```
(Confirme o nome real do campo de vendedor com `holdprint_describe`.)

## Clientes ativos
```
holdprint_query { collection: "Entity", where: { active: true }, fields: ["name","document"], limit: 100 }
```

## Saldo total das contas
```
holdprint_aggregate { collection: "FinancialAccount", op: "sum", field: "amount", where: { active: true } }
```

## NF-e do mês
```
holdprint_report { report: "nfe_faturamento_valor", startDate: "2026-06-01", endDate: "2026-06-30" }
```

## Jobs atrasados
```
holdprint_report { report: "jobs_atrasados", startDate: "2026-06-01", endDate: "2026-06-30" }
```

## Executar uma ação não destrutiva (ex.: ganhar orçamento)
1. Descobrir (confira `destructive` no resultado):
```
holdprint_discover_actions { query: "ganhar orçamento" }
```
2. Executar direto:
```
holdprint_action { actionName: "win-budget", args: { budgetId: "..." } }
```
`dryRun: true` só se quiser simular. Se a ação vier com `destructive: true`, siga a jornada abaixo.

## Executar uma ação destrutiva (apagar, liquidar, estornar…)
1. Prévia (não executa; devolve o efeito e o `previewId`):
```
holdprint_action_preview { actionName: "delete-customer", args: { id: "..." } }
```
2. Mostrar o efeito ao usuário e esperar a confirmação dele.
3. Executar só com o `previewId` (uso único, 10 minutos, mesma conta e usuário):
```
holdprint_action_execute { previewId: "..." }
```
`holdprint_action` recusa ação destrutiva e `confirmed: true` não existe mais.

## Importar uma planilha em lote
1. Simular (padrão `dry_run: true`), mostrar o resumo ao usuário e guardar o `previewId`:
```
holdprint_import { rows: [...], mapping: [{ coluna: "Razão Social", campo: "nome" }] }
```
2. Gravar com **o mesmo conteúdo** e o `previewId` da simulação:
```
holdprint_import { rows: [...], mapping: [...], dry_run: false, previewId: "..." }
```
Sem `previewId`, ou com linhas/mapeamento diferentes, nada é criado. Vale também para `holdprint_import_financials`,
`holdprint_import_stock` e `holdprint_import_feedstock`.

## Anexar uma proposta em HTML a um orçamento
1. Achar o orçamento: `holdprint_query { collection: "Budget", where: { state: "Open" }, fields: ["code","budget_title"] }`.
2. Gerar o HTML estático da proposta (sem `<script>`, eventos `on...=`, `javascript:`, `iframe`, `object`, `embed`, `base`
   nem `meta refresh`; até 1 MB) e anexar:
```
holdprint_attach_document { budgetId: "...", html: "<!doctype html>...", fileName: "proposta-cliente" }
```
O arquivo aparece na aba de anexos do orçamento. Orçamento importado (somente leitura) não aceita anexo.
