# Jobs · Produção

Consulta de jobs (trabalhos/pedidos) com custos em 4 fases (orçado, aprovado, planejado, realizado) e dados completos de produção: progresso, tasks e insumos consumidos.

## GET `/api-key/jobs/data`

Consulta dados detalhados de jobs com paginação, filtros por data e tradução de campos. Retorna custos em diferentes fases e informações de produção (status, progresso, tasks, feedstocks). Autenticação via API Key no header `x-api-key`.

> **Filtro padrão**
> 
> Sem datas, retorna apenas jobs do **mês corrente**. Para jobs históricos, informe `startDate` e `endDate` explicitamente.

### Parâmetros de Consulta

| Campo | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| page | integer | 1 | Número da página (mínimo: 1) |
| pageSize | integer | 20 | Registros por página (mínimo: 1, máximo: 100) |
| startDate | datetime | 1º dia do mês | Data inicial do filtro (ISO 8601) |
| endDate | datetime | último dia do mês | Data final do filtro (ISO 8601) |
| language | string | "pt-BR" | Idioma para tradução de campos |

### Exemplos

### Estrutura da Resposta — JobDataModel

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | string | Identificador único (ObjectId) do job |
| code | integer | Código sequencial do job |
| title | string | Título/descrição do job |
| customerName | string | Nome do cliente associado |
| responsibleName | string | Nome do responsável pelo job |
| commercialResponsibleName | string | Nome do responsável comercial |
| creationTime | datetime | Data e hora de criação |
| deliveryNeeded | datetime? | Data necessária para entrega |
| deliveryExpected | datetime? | Data esperada de entrega |
| totalPrice | decimal | Preço total do job |
| paymentOption | string | Forma de pagamento selecionada |
| jobChargeStatus | string | Status de cobrança (Pending, Partial, Paid, Overdue) |
| jobInvoiceStatus | string | Status de faturamento (NotIssued, Partial, Issued, Cancelled) |
| isFinalized | boolean | Indica se o job foi finalizado |
| costs | object | Detalhes de custos em diferentes fases |
| production | object | Informações de produção (status, progresso, items, tasks) |
| products | array | Lista de produtos do job (do memento de custo) |

### JobCostDataModel — custos em 4 fases

| Fase | Descrição |
| --- | --- |
| budgeted | Valores orçados (TotalPrice, ProductionCost, SellingCost, Profit, ProfitPercentual) |
| approved | Valores aprovados pelo cliente |
| planned | Valores planejados para produção |
| realized | Valores realizados (custos reais) |

### JobProductionDataModel

| Campo | Tipo | Descrição |
| --- | --- | --- |
| status | string | "Started" ou "NotStarted" |
| progressPercentage | decimal? | Percentual de progresso (0-100), por tasks finalizadas |
| startDate | datetime? | Menor data entre as tasks |
| endDate | datetime? | Maior data entre as tasks |
| items | array | Itens de produção com tasks e feedstocks |

> **Cálculos automáticos**
> 
> **progressPercentage**: (tasks finalizadas / total) × 100. **startDate**: menor entre StartedDate/ReleasedDate/ScheduleStartDate. **endDate**: maior entre FinalizedDate/ScheduleEndDate.

### JobProductionTaskDataModel

| Campo | Tipo | Descrição |
| --- | --- | --- |
| publicId | integer | ID público da tarefa |
| name | string | Nome da tarefa |
| processPublicId | integer | ID público do processo associado |
| productionStatus | string | NotStarted, InProgress, Paused, Finalized, Cancelled |
| duration | decimal | Duração estimada/real (minutos) |
| scheduleStartDate | datetime? | Data agendada de início |
| scheduleEndDate | datetime? | Data agendada de término |
| startedDate | datetime? | Data real de início |
| finalizedDate | datetime? | Data real de finalização |

### JobProductionFeedstockDataModel

| Campo | Tipo | Descrição |
| --- | --- | --- |
| feedstockId | string | ID único (ObjectId) do feedstock |
| publicId | integer | ID público do feedstock |
| comercialId | integer | ID comercial do feedstock |
| options | object | Dicionário com opções traduzidas (ex.: "Largura": "210mm") |

> **Boas práticas**
> 
> -   Sempre especifique `startDate`/`endDate` para jobs históricos
> -   Use `pageSize` entre 20 e 50 para otimizar performance
> -   Verifique `hasNextPage` antes da próxima página
> -   Implemente cache local para reduzir chamadas

### Diferenças vs. Orçamentos

| Aspecto | Jobs |
| --- | --- |
| Filtro de data | Padrão = mês corrente (Orçamentos não têm filtro padrão) |
| Custos | 4 fases (budgeted, approved, planned, realized) |
| Produção | Dados completos (items, tasks, feedstocks, progresso) |
| Produtos | Do memento de custo (Orçamentos usam produtos de catálogo) |

```bash · mês atual
curl -X GET "https://api.holdworks.ai/api-key/jobs/data?page=1&pageSize=20" \
  -H "x-api-key: sua_api_key_aqui"
```

```bash · todos (sem filtro de data)
curl -X GET "https://api.holdworks.ai/api-key/jobs/data?page=1&pageSize=100&startDate=2000-01-01&endDate=2099-12-31" \
  -H "x-api-key: sua_api_key_aqui"
```

```bash · período específico
curl -X GET "https://api.holdworks.ai/api-key/jobs/data?page=1&pageSize=10&startDate=2025-10-01&endDate=2025-10-31&language=pt-BR" \
  -H "x-api-key: sua_api_key_aqui"
```

---
Fonte: https://docs.holdworks.ai/api/jobs/
