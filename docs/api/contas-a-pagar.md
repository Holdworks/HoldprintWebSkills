# Contas a Pagar

Consulta, criação, edição e baixa de despesas, com classificação no plano de contas e centros de custo.

## GET `/api-key/expenses/data`

Consulta despesas de forma paginada, com suporte a filtros por data, status, fornecedor e categoria. Os dados incluem informações contábeis, centros de custo e detalhes de pagamento, facilitando relatórios financeiros e controle de custos. Requer autenticação via API Key no header `x-api-key`.

> **Filtro Padrão**
> 
> Se nenhuma data for informada, este endpoint retorna apenas despesas do mês corrente. Para consultar despesas de outros períodos, sempre especifique as datas.

### Parâmetros de Query

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| page | int | opcional | Número da página para paginação (padrão: 1) |
| limit | int | opcional | Quantidade de registros por página (padrão: 50 • máximo: 100) |
| start\_date | string | opcional | Data inicial para filtro (formato: YYYY-MM-DD). Exemplo: 2025-01-01 |
| end\_date | string | opcional | Data final para filtro (formato: YYYY-MM-DD). Exemplo: 2025-12-31 |
| translate | boolean | opcional | Traduzir nomes de campos (true/false). Padrão: false |
| status | string | opcional | Filtrar por status (pending, paid, overdue, cancelled). Exemplo: paid |
| supplier\_id | int | opcional | Filtrar despesas de um fornecedor específico. Exemplo: 55 |
| category | string | opcional | Filtrar por categoria de despesa. Exemplo: equipment\_rental |

### Status das Despesas

| Campo | Tipo | Descrição |
| --- | --- | --- |
| pending | string | Pendente - Despesa aguardando pagamento |
| paid | string | Paga - Despesa quitada |
| overdue | string | Vencida - Despesa não paga após o vencimento |
| cancelled | string | Cancelada - Despesa cancelada |

### Categorias de Despesas

| Campo | Tipo | Descrição |
| --- | --- | --- |
| paper\_supplies | string | Papel e substratos |
| ink\_supplies | string | Tintas e consumíveis de impressão |
| equipment\_rental | string | Aluguel de equipamentos |
| equipment\_maintenance | string | Manutenção de equipamentos |
| utilities | string | Utilidades (luz, água, internet) |
| labor | string | Mão de obra |
| services | string | Serviços terceirizados |
| other | string | Outras despesas |

### Centros de Custo

| Campo | Tipo | Descrição |
| --- | --- | --- |
| production | string | Custos diretos de produção |
| administration | string | Custos administrativos |
| sales | string | Custos comerciais e vendas |
| logistics | string | Custos de logística e entrega |

> **Dica**
> 
> Use os filtros de `category` e `cost_center` para gerar relatórios específicos por tipo de despesa ou área da empresa.

### Estrutura de Dados

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | number | Identificador único da despesa |
| description | string | Descrição da despesa |
| amount | number | Valor da despesa |
| due\_date | string | Data de vencimento (YYYY-MM-DD) |
| payment\_date | string \| null | Data do pagamento (YYYY-MM-DD) |
| status | string | Status da despesa (pending, paid, overdue, cancelled) |
| supplier | object | Informações do fornecedor |
| category | string | Categoria da despesa |
| cost\_center | string | Centro de custo contábil |
| payment\_method | string \| null | Método de pagamento utilizado |
| invoice\_number | string | Número da nota fiscal |

> **Boas Práticas**
> 
> -   Sempre especifique datas para evitar dados incompletos
> -   Use paginação para grandes volumes de dados
> -   Monitore despesas vencidas (status: overdue) regularmente
> -   Filtre por centro de custo para análises departamentais

```bash
curl -X GET "https://api.holdworks.ai/api-key/expenses/data?page=1&limit=50&start_date=2025-01-01&end_date=2025-12-31&status=paid" \
  -H "x-api-key: sua_api_key_aqui"
```

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1001,
        "description": "Aluguel de Impressora Digital",
        "amount": 3500.00,
        "due_date": "2025-02-05",
        "payment_date": "2025-02-05",
        "status": "paid",
        "supplier": {
          "id": 55,
          "name": "Fornecedor XYZ",
          "document": "98.765.432/0001-11"
        },
        "category": "equipment_rental",
        "cost_center": "production",
        "payment_method": "bank_transfer",
        "invoice_number": "NF-12345",
        "notes": "Referente ao mês de janeiro/2025",
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-02-05T14:30:00Z"
      },
      {
        "id": 1002,
        "description": "Compra de Papel Offset A4",
        "amount": 1250.00,
        "due_date": "2025-02-15",
        "payment_date": null,
        "status": "pending",
        "supplier": {
          "id": 56,
          "name": "Papelaria Central",
          "document": "12.345.678/0001-90"
        },
        "category": "paper_supplies",
        "cost_center": "production",
        "payment_method": null,
        "invoice_number": "NF-67890",
        "notes": null,
        "created_at": "2025-01-20T11:30:00Z",
        "updated_at": "2025-01-20T11:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 120,
      "pages": 3
    }
  },
  "message": "Success"
}
```

## POST `/api-key/expenses`

Cria uma conta a pagar, à vista ou parcelada. A conta nasce em aberto; para registrar o pagamento, use `/api-key/expenses/{id}/settle`. A criação aparece no histórico da conta como feita pela integração (API).

Autenticação via API Key no header `x-api-key` e `Content-Type: application/json`.

### Headers

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| Idempotency-Key | string | Recomendado | Identificador único da operação no seu sistema (até 200 caracteres). Reenviar a mesma chave com o mesmo corpo devolve a conta já criada, sem duplicar. A mesma chave com corpo diferente é recusada |

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| description | string | obrigatório | Descrição da conta a pagar |
| amount | number | obrigatório | Valor total. Maior que zero |
| dueDate | string | obrigatório | Vencimento (ISO 8601, ex.: 2026-11-10). No parcelamento, é a data base das parcelas |
| chartOfAccounts | array | obrigatório | Classificação no plano de contas: lista de `{ publicId, amount }`. Com um único item, `amount` pode ser omitido (usa o valor total). Com mais de um, cada item precisa de `amount` e a soma deve ser igual a `amount` |
| paymentMethodId | string | obrigatório | Forma de pagamento (`/api-key/payment-methods/data`). Obrigatório quando não houver `paymentOptionId` |
| paymentOptionId | string | obrigatório | Condição de pagamento (`/api-key/payment-options/data`, com uso em compra). Informe para parcelar; as parcelas seguem a condição |
| installments | array | opcional | Parcelas personalizadas: lista de `{ dueDate, amount }`. Exige `paymentOptionId`; a soma deve ser igual a `amount` |
| supplierId | string | opcional | Id do fornecedor (`/api-key/suppliers/data`) |
| companyId | string | opcional | Id da empresa emissora, em contas com mais de um CNPJ. Se omitido, usa a empresa padrão da conta |
| documentNumber | string | opcional | Número do documento (nota, boleto, contrato) |
| notes | string | opcional | Observações |

> **À vista ou parcelado**
> 
> Sem `paymentOptionId`, é criada uma única conta com a forma de pagamento informada. Com `paymentOptionId`, é criada uma conta por parcela, conforme a condição de pagamento ou a lista `installments`. A resposta traz todas as parcelas em `items`.

Exemplo de requisição — à vista:

Exemplo de requisição — parcelado em 3x com valores próprios:

Resposta (**201** na criação; **200** quando a `Idempotency-Key` já tinha sido usada):

```bash
curl -X POST "https://api.holdworks.ai/api-key/expenses" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: pedido-1234" \
  -d '{
    "description": "Aluguel de equipamento",
    "amount": 1500.00,
    "dueDate": "2026-11-10",
    "supplierId": "6650f1c2a1b2c3d4e5f60789",
    "paymentMethodId": "6650f1c2a1b2c3d4e5f60111",
    "documentNumber": "NF 1234",
    "chartOfAccounts": [ { "publicId": 12 } ]
  }'
```

```bash
curl -X POST "https://api.holdworks.ai/api-key/expenses" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: pedido-1235" \
  -d '{
    "description": "Aluguel de equipamento",
    "amount": 3000.00,
    "dueDate": "2026-11-10",
    "paymentOptionId": "6650f1c2a1b2c3d4e5f60222",
    "installments": [
      { "dueDate": "2026-11-10", "amount": 1000.00 },
      { "dueDate": "2026-12-10", "amount": 1000.00 },
      { "dueDate": "2027-01-10", "amount": 1000.00 }
    ],
    "chartOfAccounts": [
      { "publicId": 12, "amount": 2000.00 },
      { "publicId": 15, "amount": 1000.00 }
    ]
  }'
```

```json
{
  "success": true,
  "data": {
    "reusedExisting": false,
    "items": [
      {
        "id": "6651a0b1c2d3e4f5a6b7c8d9",
        "description": "Aluguel de equipamento",
        "documentNumber": "NF 1234",
        "notes": null,
        "companyId": null,
        "supplierId": "6650f1c2a1b2c3d4e5f60789",
        "amount": 1500.00,
        "openAmount": 1500.00,
        "amountPaid": 0,
        "dueDate": "2026-11-10T00:00:00Z",
        "settlementDate": null,
        "status": "Pending",
        "paymentMethodId": "6650f1c2a1b2c3d4e5f60111",
        "chartOfAccounts": [ { "publicId": 12, "amount": 1500.00 } ]
      }
    ]
  }
}
```

## PATCH `/api-key/expenses/{id}`

Altera uma conta a pagar em aberto. Envie só os campos que mudam; os demais ficam como estão. A alteração aparece no histórico da conta.

Só é aceita para conta sem pagamento registrado. Conta paga ou com pagamento parcial devolve **400**; id inexistente ou de outra conta devolve **404**.

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| description | string | opcional | Nova descrição |
| amount | number | opcional | Novo valor. Se a conta tiver mais de uma classificação no plano de contas, envie também `chartOfAccounts` |
| dueDate | string | opcional | Novo vencimento (ISO 8601) |
| documentNumber | string | opcional | Número do documento |
| notes | string | opcional | Observações |
| chartOfAccounts | array | opcional | Nova classificação: lista de `{ publicId, amount }`, com as mesmas regras da criação |

Resposta **200**: `{ "success": true, "data": { ...conta a pagar atualizada... } }`, no mesmo formato de cada item da criação.

```bash
curl -X PATCH "https://api.holdworks.ai/api-key/expenses/6651a0b1c2d3e4f5a6b7c8d9" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "dueDate": "2026-11-20",
    "amount": 1600.00
  }'
```

## POST `/api-key/expenses/{id}/settle`

Registra o pagamento (pagamento) de uma conta a pagar, com o mesmo efeito da baixa feita pela tela: a conta muda de status e a movimentação entra no extrato da conta financeira.

### Headers

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| Idempotency-Key | string | Recomendado | Identificador único do pagamento no seu sistema. Se a resposta se perder e você reenviar a mesma baixa com a mesma chave, o pagamento não é lançado de novo |

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| financialAccountId | string | obrigatório | Conta financeira (banco ou caixa) da movimentação. Consulte em `/api-key/financial-accounts/data` |
| paymentMethodId | string | obrigatório | Forma de pagamento (`/api-key/payment-methods/data`) |
| date | string | obrigatório | Data do pagamento (ISO 8601) |
| amount | number | obrigatório | Valor efetivamente pago, já com juros e multa somados e desconto abatido |
| interestAmount | number | opcional | Juros |
| fineAmount | number | opcional | Multa |
| discountAmount | number | opcional | Desconto |
| partial | boolean | opcional | Use `true` para pagamento parcial; o saldo continua em aberto |

> **Conta do valor**
> 
> Para quitar, `amount + discountAmount − interestAmount − fineAmount` deve ser igual ao saldo em aberto (`openAmount`). Exemplo: saldo 1.000,00, juros 20,00 e desconto 10,00 → `amount` = 1.010,00. Valores menores que o saldo só são aceitos com `partial: true`; valores maiores que o saldo são recusados.

Resposta **200** com a conta a pagar atualizada (`status` `Paid`, `openAmount` 0 e `settlementDate` preenchida). Conta já paga devolve **400**.

```bash
curl -X POST "https://api.holdworks.ai/api-key/expenses/6651a0b1c2d3e4f5a6b7c8d9/settle" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: pagamento-9876" \
  -d '{
    "financialAccountId": "6650f1c2a1b2c3d4e5f60333",
    "paymentMethodId": "6650f1c2a1b2c3d4e5f60111",
    "date": "2026-11-12",
    "amount": 1010.00,
    "interestAmount": 20.00,
    "discountAmount": 10.00
  }'
```

---
Fonte: https://docs.holdworks.ai/api/contas-a-pagar/
