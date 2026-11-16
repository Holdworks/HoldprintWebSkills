# Consultas por recurso

Cada recurso com consulta tem a rota `POST /v1/{recurso}/query`, com filtros só em campos indexados. Esta página é gerada do catálogo da API (versão de 2026-11-13); a lista atual também vem de `GET /v1/query` e de `holdprint query --list`.

## Como funciona

-   Operadores: `eq`, `in`, `gte`, `lte`. Vários filtros se combinam com E.
-   `limit` padrão 50, máximo 100. Repita com `cursor` enquanto `nextCursor` não for `null`.
-   Filtro em campo sem índice: erro 94, com a lista dos permitidos. Campo fora da lista: erro 95. Recurso sem consulta ligada: erro 93.
-   O usuário vê só o que o perfil dele vê: um vendedor que só enxerga os próprios orçamentos recebe só esses.

## POST `/v1/budgets/query`

**Orçamentos.** Escopo `budgets:read`. Até 100 por página, com cursor. Aceita `updatedSince` para sincronizar só o que mudou.

### Filtros

| Campo | Operadores | Regra |
| --- | --- | --- |
| `state` | `eq` `in` `gte` `lte` |  |
| `wonDate` | `gte` `lte` |  |
| `lostDate` | `gte` `lte` |  |
| `creationTime` | `gte` `lte` |  |
| `responsibleUserId` | `eq` `in` |  |
| `customer` | `eq` `in` |  |

### Ordenação

`wonDate` `lostDate` `creationTime` `updatedAt` (padrão `-creationTime`; prefixo `-` para decrescente).

### Campos

`id` `code` `budgetTitle` `customer` `funnel` `state` `businessValue` `isBusiness` `targetDateApprove` `deliveryNeed` `expirationDate` `creationTime` `wonDate` `lostDate` `lostAnnotation` `note` `responsibleUserId` `winnerProposeId` `lastUpdateTime` `deleted`

```json
{
  "where": {
    "state": {
      "eq": "Open"
    },
    "creationTime": {
      "gte": "2026-11-01T00:00:00Z"
    }
  },
  "fields": [
    "id",
    "code",
    "budgetTitle",
    "customer",
    "businessValue"
  ],
  "sort": "-creationTime",
  "limit": 20,
  "cursor": null
}
```

```bash
holdprint query budgets --where state=Open --where creationTime>=2026-11-01 --fields id,code,budgetTitle,customer,businessValue --sort -creationTime --limit 20
```

```json
{
  "data": [
    {
      "id": "…",
      "code": "…",
      "budgetTitle": "…",
      "customer": "…",
      "businessValue": "…"
    }
  ],
  "nextCursor": "eyJvIjoyMH0"
}
```

## POST `/v1/customers/query`

**Clientes.** Escopo `customers:read`. Até 100 por página, com cursor. Aceita `updatedSince` para sincronizar só o que mudou.

### Filtros

| Campo | Operadores | Regra |
| --- | --- | --- |
| `deleted` | `eq` |  |

### Ordenação

`name` `updatedAt` (padrão `name`; prefixo `-` para decrescente).

### Campos

`id` `fullName` `name` `mainPhoneNumber` `mainEmail` `site` `active` `deleted` `creationTime` `lastUpdateTime`

```json
{
  "where": {
    "deleted": {
      "eq": false
    }
  },
  "fields": [
    "id",
    "name",
    "mainEmail",
    "mainPhoneNumber"
  ],
  "sort": "name",
  "limit": 20,
  "cursor": null
}
```

```bash
holdprint query customers --where deleted=false --fields id,name,mainEmail,mainPhoneNumber --sort name
```

```json
{
  "data": [
    {
      "id": "…",
      "name": "…",
      "mainEmail": "…",
      "mainPhoneNumber": "…"
    }
  ],
  "nextCursor": "eyJvIjoyMH0"
}
```

## POST `/v1/tasks/query`

**Tarefas.** Escopo `tasks:read`. Até 100 por página, com cursor. Aceita `updatedSince` para sincronizar só o que mudou.

### Filtros

| Campo | Operadores | Regra |
| --- | --- | --- |
| `budgetId` | `eq` `in` |  |
| `relatedEntity` | `eq` `in` |  |
| `deleted` | `eq` |  |

### Ordenação

`endTime` `updatedAt` (padrão `-endTime`; prefixo `-` para decrescente). `endTime` só junto com `relatedEntity`.

### Campos

`id` `budgetId` `budgetCode` `title` `description` `taskType` `relatedEntity` `schedulingTime` `endTime` `duration` `entityId` `responsibleUserId` `deleted` `createdViaPluginId` `createdViaPluginName`

```json
{
  "where": {
    "relatedEntity": {
      "eq": "Budget"
    },
    "deleted": {
      "eq": false
    }
  },
  "fields": [
    "id",
    "budgetCode",
    "title",
    "endTime",
    "responsibleUserId"
  ],
  "sort": "-endTime",
  "limit": 20,
  "cursor": null
}
```

```bash
holdprint query tasks --where relatedEntity=Budget --where deleted=false --fields id,budgetCode,title,endTime --sort -endTime
```

```json
{
  "data": [
    {
      "id": "…",
      "budgetCode": "…",
      "title": "…",
      "endTime": "…",
      "responsibleUserId": "…"
    }
  ],
  "nextCursor": "eyJvIjoyMH0"
}
```

## POST `/v1/jobs/query`

**Jobs.** Escopo `jobs:read`. Até 100 por página, com cursor. Não aceita `updatedSince`.

### Filtros

| Campo | Operadores | Regra |
| --- | --- | --- |
| `code` | `eq` `in` `gte` `lte` |  |
| `budgetId` | `eq` `in` |  |
| `deleted` | `eq` |  |
| `isFinalized` | `eq` |  |
| `creationTime` | `gte` `lte` |  |
| `deliveryNeeded` | `gte` `lte` |  |

### Ordenação

`creationTime` `deliveryNeeded` `code` (padrão `-creationTime`; prefixo `-` para decrescente).

### Campos

`id` `code` `title` `customerId` `budgetId` `deliveryExpected` `deliveryNeeded` `totalPrice` `isFinalized` `mustGenerateBilling` `creationTime` `commercialResponsibleId` `responsibleId` `versionNumber` `contactId` `companyId` `deleted` `type` `jobChargeStatus` `jobInvoiceStatus`

```json
{
  "where": {
    "deleted": {
      "eq": false
    },
    "isFinalized": {
      "eq": false
    },
    "deliveryNeeded": {
      "lte": "2026-11-20T00:00:00Z"
    }
  },
  "fields": [
    "id",
    "code",
    "title",
    "customerId",
    "deliveryNeeded"
  ],
  "sort": "deliveryNeeded",
  "limit": 20,
  "cursor": null
}
```

```bash
holdprint query jobs --where deleted=false --where isFinalized=false --where deliveryNeeded<=2026-11-20 --sort deliveryNeeded
```

```json
{
  "data": [
    {
      "id": "…",
      "code": "…",
      "title": "…",
      "customerId": "…",
      "deliveryNeeded": "…"
    }
  ],
  "nextCursor": "eyJvIjoyMH0"
}
```

## POST `/v1/expenses/query`

**Despesas.** Escopo `expenses:read`. Até 100 por página, com cursor. Não aceita `updatedSince`.

**Filtros obrigatórios:** `accountStatusId` `active`, sempre juntos (sem eles, erro 94).

### Filtros

| Campo | Operadores | Regra |
| --- | --- | --- |
| `accountStatusId` | `eq` |  |
| `active` | `eq` |  |
| `dueDate` | `gte` `lte` | junto com `accountStatusId` `active` |

### Ordenação

`dueDate` (padrão `dueDate`; prefixo `-` para decrescente). `dueDate` só junto com `accountStatusId` `active`.

### Campos

`id` `description` `originalAmount` `amountPayable` `dueDate` `originalDueDate` `accrualDate` `settlementDate` `date` `active` `deleted` `entityId` `companyId` `accountStatusId` `paymentMethodId` `accountStatusType` `expenseOriginType` `documentName` `creationDate`

```json
{
  "where": {
    "accountStatusId": {
      "eq": "<id do status>"
    },
    "active": {
      "eq": true
    },
    "dueDate": {
      "gte": "2026-11-01T00:00:00Z"
    }
  },
  "fields": [
    "id",
    "description",
    "amountPayable",
    "dueDate"
  ],
  "sort": "dueDate",
  "limit": 20,
  "cursor": null
}
```

```bash
holdprint query expenses --where accountStatusId=<id do status> --where active=true --where dueDate>=2026-11-01 --sort dueDate
```

```json
{
  "data": [
    {
      "id": "…",
      "description": "…",
      "amountPayable": "…",
      "dueDate": "…"
    }
  ],
  "nextCursor": "eyJvIjoyMH0"
}
```

## POST `/v1/incomes/query`

**Receitas.** Escopo `incomes:read`. Até 100 por página, com cursor. Não aceita `updatedSince`.

**Filtros obrigatórios:** `accountStatusId` `active`, sempre juntos (sem eles, erro 94).

### Filtros

| Campo | Operadores | Regra |
| --- | --- | --- |
| `accountStatusId` | `eq` |  |
| `active` | `eq` |  |
| `dueDate` | `gte` `lte` | junto com `accountStatusId` `active` |

### Ordenação

`dueDate` (padrão `dueDate`; prefixo `-` para decrescente). `dueDate` só junto com `accountStatusId` `active`.

### Campos

`id` `description` `originalAmount` `amountReceivable` `amountReceived` `dueDate` `originalDueDate` `accrualDate` `settlementDate` `active` `deleted` `payerId` `companyId` `accountStatusId` `paymentMethodId` `financialAccountId` `accountStatusType` `incomeOriginType` `documentName` `creationDate`

```json
{
  "where": {
    "accountStatusId": {
      "eq": "<id do status>"
    },
    "active": {
      "eq": true
    },
    "dueDate": {
      "gte": "2026-11-01T00:00:00Z"
    }
  },
  "fields": [
    "id",
    "description",
    "amountReceivable",
    "dueDate"
  ],
  "sort": "dueDate",
  "limit": 20,
  "cursor": null
}
```

```bash
holdprint query incomes --where accountStatusId=<id do status> --where active=true --where dueDate>=2026-11-01 --sort dueDate
```

```json
{
  "data": [
    {
      "id": "…",
      "description": "…",
      "amountReceivable": "…",
      "dueDate": "…"
    }
  ],
  "nextCursor": "eyJvIjoyMH0"
}
```

## POST `/v1/feedstocks/query`

**Insumos.** Escopo `feedstocks:read`. Até 100 por página, com cursor. Não aceita `updatedSince`.

### Filtros

| Campo | Operadores | Regra |
| --- | --- | --- |
| `publicId` | `eq` `in` |  |
| `deleted` | `eq` |  |
| `inactive` | `eq` |  |

### Ordenação

`technicalName` (padrão `technicalName`; prefixo `-` para decrescente).

### Campos

`id` `technicalName` `description` `unitUse` `publicId` `version` `favorite` `inactive` `deleted` `lock` `useComercialNames` `physicalQuantityType`

```json
{
  "where": {
    "deleted": {
      "eq": false
    },
    "inactive": {
      "eq": false
    }
  },
  "fields": [
    "id",
    "technicalName",
    "unitUse",
    "publicId"
  ],
  "sort": "technicalName",
  "limit": 20,
  "cursor": null
}
```

```bash
holdprint query feedstocks --where deleted=false --where inactive=false --sort technicalName
```

```json
{
  "data": [
    {
      "id": "…",
      "technicalName": "…",
      "unitUse": "…",
      "publicId": "…"
    }
  ],
  "nextCursor": "eyJvIjoyMH0"
}
```

## Leitura por id

Todos os 27 recursos abaixo têm leitura de um registro por id. A resposta traz `id`, `title` e `name`, mais os campos de negócio; nunca documento pessoal, salário, dado bancário ou segredo. Registro inexistente ou fora do alcance do usuário: erro 113.

| Rota | Recurso | Escopo |
| --- | --- | --- |
| `GET /v1/budgets/{id}` | Orçamentos | `budgets:read` |
| `GET /v1/customers/{id}` | Clientes | `customers:read` |
| `GET /v1/tasks/{id}` | Tarefas | `tasks:read` |
| `GET /v1/jobs/{id}` | Jobs | `jobs:read` |
| `GET /v1/expenses/{id}` | Despesas | `expenses:read` |
| `GET /v1/incomes/{id}` | Receitas | `incomes:read` |
| `GET /v1/feedstocks/{id}` | Insumos | `feedstocks:read` |
| `GET /v1/funnels/{id}` | Funis | `funnels:read` |
| `GET /v1/users/{id}` | Usuários | `users:read` |
| `GET /v1/stock-movements/{id}` | Movimentações de estoque | `stock-movements:read` |
| `GET /v1/purchase-orders/{id}` | Pedidos de compra | `purchase-orders:read` |
| `GET /v1/stock-centrals/{id}` | Centrais de estoque | `stock-centrals:read` |
| `GET /v1/suppliers/{id}` | Fornecedores | `suppliers:read` |
| `GET /v1/employees/{id}` | Funcionários | `employees:read` |
| `GET /v1/agencies/{id}` | Agências | `agencies:read` |
| `GET /v1/cost-centers/{id}` | Centros de custo | `cost-centers:read` |
| `GET /v1/equipments/{id}` | Equipamentos | `equipments:read` |
| `GET /v1/processes/{id}` | Processos | `processes:read` |
| `GET /v1/outsourceds/{id}` | Terceirizados | `outsourceds:read` |
| `GET /v1/products/{id}` | Produtos | `products:read` |
| `GET /v1/fixed-expenses/{id}` | Despesas fixas | `fixed-expenses:read` |
| `GET /v1/financial-transactions/{id}` | Movimentações financeiras | `financial-transactions:read` |
| `GET /v1/credit-cards/{id}` | Cartões da empresa | `credit-cards:read` |
| `GET /v1/commissions/{id}` | Comissões | `commissions:read` |
| `GET /v1/bank-reconciliations/{id}` | Conciliações bancárias | `bank-reconciliations:read` |
| `GET /v1/invoices/{id}` | Notas fiscais | `invoices:read` |
| `GET /v1/contracts/{id}` | Contratos | `contracts:read` |

---
Fonte: https://docs.holdworks.ai/api/v1/consultas/
