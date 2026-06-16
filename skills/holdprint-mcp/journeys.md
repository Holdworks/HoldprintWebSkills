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

## Executar uma ação (ex.: ganhar orçamento)
1. Descobrir:
```
holdprint_discover_actions { query: "ganhar orçamento" }
```
2. Prévia (dry-run, default):
```
holdprint_action { actionName: "win-budget", args: { budgetId: "..." } }
```
3. Mostrar a prévia ao usuário. Só então efetivar:
```
holdprint_action { actionName: "win-budget", args: { budgetId: "..." }, dryRun: false }
```
Ações destrutivas exigem também `confirmed: true`.
