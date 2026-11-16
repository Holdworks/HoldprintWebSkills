# Cadastros financeiros

Plano de contas, formas e condições de pagamento: os identificadores que as contas a pagar e a receber pedem na criação, edição e baixa.

## GET `/api-key/chart-of-accounts/data`

Lista o plano de contas da conta. Use o `publicId` em `chartOfAccounts` na criação e edição de contas a pagar e a receber. Só aceitam lançamento as contas com `acceptsEntries: true` (analíticas).

| Campo | Tipo | Descrição |
| --- | --- | --- |
| publicId | int | Identificador usado nas contas a pagar e a receber |
| parentPublicId | int | Conta pai (0 no primeiro nível) |
| name | string | Nome da conta |
| accountType | string | `Credit` ou `Debit` |
| type | string | `Analytic` ou `Synthetic` |
| acceptsEntries | boolean | Se a conta pode receber lançamentos |

```bash
curl -X GET "https://api.holdworks.ai/api-key/chart-of-accounts/data" \
  -H "x-api-key: sua_api_key_aqui"
```

## GET `/api-key/payment-methods/data`

Lista as formas de pagamento ativas (dinheiro, PIX, boleto, cartão…). Use o `id` em `paymentMethodId` na criação à vista e na baixa.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | string | Identificador da forma de pagamento |
| name | string | Nome |
| isIncome | boolean | Usada em recebimentos |
| isExpense | boolean | Usada em pagamentos |

```bash
curl -X GET "https://api.holdworks.ai/api-key/payment-methods/data" \
  -H "x-api-key: sua_api_key_aqui"
```

## GET `/api-key/payment-options/data`

Lista as condições de pagamento (forma + prazo, ex.: "Boleto 30/60/90"). Use o `id` em `paymentOptionId` para criar contas parceladas. Contas a receber aceitam condições com `isIncome: true`; contas a pagar, com `isExpense: true`.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | string | Identificador da condição |
| name | string | Nome |
| description | string | Descrição |
| paymentMethodId | string | Forma de pagamento da condição |
| isIncome | boolean | Disponível para vendas (contas a receber) |
| isExpense | boolean | Disponível para compras (contas a pagar) |

```bash
curl -X GET "https://api.holdworks.ai/api-key/payment-options/data" \
  -H "x-api-key: sua_api_key_aqui"
```

---
Fonte: https://docs.holdworks.ai/api/cadastros-financeiros/
