# Contas a Receber

Consulta, criação, edição e baixa de receitas, com classificação no plano de contas, para integração e controle de fluxo de caixa.

## GET `/api-key/incomes/data`

Consulta receitas de forma paginada, com suporte a filtros por data, status e cliente. Os dados incluem informações contábeis, centros de receita e detalhes de recebimento, facilitando o controle de fluxo de caixa e análises financeiras. A autenticação é feita via API Key no header `x-api-key`.

> **Filtro Padrão**
> 
> Se nenhuma data for informada, este endpoint retorna apenas receitas do mês corrente. Para consultar receitas de outros períodos, sempre especifique as datas.

### Parâmetros de Query

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| page | int | opcional | Número da página para paginação (padrão: 1) |
| limit | int | opcional | Quantidade de registros por página (padrão: 50 • máximo: 100) |
| start\_date | string | opcional | Data inicial para filtro (formato: YYYY-MM-DD). Exemplo: 2025-01-01 |
| end\_date | string | opcional | Data final para filtro (formato: YYYY-MM-DD). Exemplo: 2025-12-31 |
| translate | boolean | opcional | Traduzir nomes de campos (true/false). Padrão: false |
| status | string | opcional | Filtrar por status (pending, received, overdue, cancelled). Exemplo: received |
| customer\_id | int | opcional | Filtrar receitas de um cliente específico. Exemplo: 789 |

### Status das Receitas

| Campo | Tipo | Descrição |
| --- | --- | --- |
| pending | string | Pendente - Receita a receber |
| received | string | Recebida - Receita quitada |
| overdue | string | Vencida - Receita não recebida após a data esperada |
| cancelled | string | Cancelada - Receita cancelada |

### Centros de Receita

| Campo | Tipo | Descrição |
| --- | --- | --- |
| sales | string | Receitas de vendas de produtos e serviços |
| services | string | Receitas de serviços complementares |
| recurring | string | Receitas recorrentes (contratos, assinaturas) |
| other | string | Outras receitas |

> **Dica**
> 
> Monitore receitas com status overdue para identificar clientes com pagamentos atrasados e tomar ações de cobrança apropriadas.

### Estrutura de Dados

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | number | Identificador único da receita |
| description | string | Descrição da receita |
| amount | number | Valor da receita |
| expected\_date | string | Data esperada de recebimento (YYYY-MM-DD) |
| received\_date | string \| null | Data do recebimento (YYYY-MM-DD) |
| status | string | Status da receita (pending, received, overdue, cancelled) |
| customer | object | Informações do cliente |
| revenue\_center | string | Centro de receita contábil |
| payment\_method | string \| null | Método de pagamento utilizado |
| invoice\_number | string | Número da nota fiscal |
| job\_id | number \| null | ID do job relacionado |

> **Boas Práticas**
> 
> -   Sempre especifique datas para evitar dados incompletos
> -   Use paginação para grandes volumes de dados
> -   Compare expected\_date vs received\_date para análise de inadimplência
> -   Filtre por centro de receita para análises de rentabilidade

```bash
curl -X GET "https://api.holdworks.ai/api-key/incomes/data?page=1&limit=50&start_date=2025-01-01&end_date=2025-12-31&status=received" \
  -H "x-api-key: sua_api_key_aqui"
```

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 2001,
        "description": "Pagamento Job #5678 - Cartões de Visita",
        "amount": 12500.00,
        "expected_date": "2025-02-15",
        "received_date": "2025-02-14",
        "status": "received",
        "customer": {
          "id": 789,
          "name": "Empresa Exemplo LTDA",
          "document": "12.345.678/0001-99"
        },
        "revenue_center": "sales",
        "payment_method": "bank_transfer",
        "invoice_number": "NFS-45678",
        "job_id": 5678,
        "notes": "Pagamento antecipado",
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-02-14T16:20:00Z"
      },
      {
        "id": 2002,
        "description": "Pagamento Job #5680 - Impressão de Catálogos",
        "amount": 8750.00,
        "expected_date": "2025-02-20",
        "received_date": null,
        "status": "pending",
        "customer": {
          "id": 790,
          "name": "Editora ABC",
          "document": "98.765.432/0001-10"
        },
        "revenue_center": "sales",
        "payment_method": null,
        "invoice_number": "NFS-45679",
        "job_id": 5680,
        "notes": null,
        "created_at": "2025-01-18T14:00:00Z",
        "updated_at": "2025-01-18T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 95,
      "pages": 2
    }
  },
  "message": "Success"
}
```

## POST `/api-key/incomes`

Cria uma conta a receber, à vista ou parcelada. A conta nasce em aberto; para registrar o pagamento, use `/api-key/incomes/{id}/settle`. A criação aparece no histórico da conta como feita pela integração (API).

Autenticação via API Key no header `x-api-key` e `Content-Type: application/json`.

### Headers

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| Idempotency-Key | string | Recomendado | Identificador único da operação no seu sistema (até 200 caracteres). Reenviar a mesma chave com o mesmo corpo devolve a conta já criada, sem duplicar. A mesma chave com corpo diferente é recusada |

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| description | string | obrigatório | Descrição da conta a receber |
| amount | number | obrigatório | Valor total. Maior que zero |
| dueDate | string | obrigatório | Vencimento (ISO 8601, ex.: 2026-11-10). No parcelamento, é a data base das parcelas |
| chartOfAccounts | array | obrigatório | Classificação no plano de contas: lista de `{ publicId, amount }`. Com um único item, `amount` pode ser omitido (usa o valor total). Com mais de um, cada item precisa de `amount` e a soma deve ser igual a `amount` |
| paymentMethodId | string | obrigatório | Forma de pagamento (`/api-key/payment-methods/data`). Obrigatório quando não houver `paymentOptionId` |
| paymentOptionId | string | obrigatório | Condição de pagamento (`/api-key/payment-options/data`, com uso em venda). Informe para parcelar; as parcelas seguem a condição |
| installments | array | opcional | Parcelas personalizadas: lista de `{ dueDate, amount }`. Exige `paymentOptionId`; a soma deve ser igual a `amount` |
| customerId | string | opcional | Id do cliente (`/api-key/customers/data`) |
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
curl -X POST "https://api.holdworks.ai/api-key/incomes" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: pedido-1234" \
  -d '{
    "description": "Venda pedido 1234",
    "amount": 1500.00,
    "dueDate": "2026-11-10",
    "customerId": "6650f1c2a1b2c3d4e5f60789",
    "paymentMethodId": "6650f1c2a1b2c3d4e5f60111",
    "documentNumber": "NF 1234",
    "chartOfAccounts": [ { "publicId": 12 } ]
  }'
```

```bash
curl -X POST "https://api.holdworks.ai/api-key/incomes" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: pedido-1235" \
  -d '{
    "description": "Venda pedido 1234",
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
        "description": "Venda pedido 1234",
        "documentNumber": "NF 1234",
        "notes": null,
        "companyId": null,
        "customerId": "6650f1c2a1b2c3d4e5f60789",
        "amount": 1500.00,
        "openAmount": 1500.00,
        "amountReceived": 0,
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

## PATCH `/api-key/incomes/{id}`

Altera uma conta a receber em aberto. Envie só os campos que mudam; os demais ficam como estão. A alteração aparece no histórico da conta.

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

Resposta **200**: `{ "success": true, "data": { ...conta a receber atualizada... } }`, no mesmo formato de cada item da criação.

```bash
curl -X PATCH "https://api.holdworks.ai/api-key/incomes/6651a0b1c2d3e4f5a6b7c8d9" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "dueDate": "2026-11-20",
    "amount": 1600.00
  }'
```

## POST `/api-key/incomes/{id}/settle`

Registra o pagamento (recebimento) de uma conta a receber, com o mesmo efeito da baixa feita pela tela: a conta muda de status e a movimentação entra no extrato da conta financeira.

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
| amount | number | obrigatório | Valor efetivamente recebido, já com juros e multa somados e desconto abatido |
| interestAmount | number | opcional | Juros |
| fineAmount | number | opcional | Multa |
| discountAmount | number | opcional | Desconto |
| partial | boolean | opcional | Use `true` para pagamento parcial; o saldo continua em aberto |

> **Conta do valor**
> 
> Para quitar, `amount + discountAmount − interestAmount − fineAmount` deve ser igual ao saldo em aberto (`openAmount`). Exemplo: saldo 1.000,00, juros 20,00 e desconto 10,00 → `amount` = 1.010,00. Valores menores que o saldo só são aceitos com `partial: true`; valores maiores que o saldo são recusados.

Resposta **200** com a conta a receber atualizada (`status` `Paid`, `openAmount` 0 e `settlementDate` preenchida). Conta já paga devolve **400**.

```bash
curl -X POST "https://api.holdworks.ai/api-key/incomes/6651a0b1c2d3e4f5a6b7c8d9/settle" \
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
Fonte: https://docs.holdworks.ai/api/contas-a-receber/
