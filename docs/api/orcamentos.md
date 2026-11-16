# Orçamentos

Consulta paginada de orçamentos com propostas, itens, produtos e checklists — ideal para integração, análises e relatórios.

## GET `/api-key/budgets/data`

Consulta dados detalhados de orçamentos de forma paginada, incluindo informações sobre propostas, itens, produtos e checklists. Suporta paginação, filtros por data e tradução de campos, retornando dados em formato estruturado para integração com sistemas externos.

Este endpoint requer autenticação via API Key no header `x-api-key`:

### Parâmetros de Consulta

Todos os parâmetros são opcionais e enviados via query string na URL.

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| page | integer | opcional | Número da página a ser retornada, mínimo: 1 (padrão: 1) |
| pageSize | integer | opcional | Quantidade de registros por página, mínimo: 1, máximo: 100 (padrão: 20) |
| startDate | datetime | opcional | Data inicial para filtrar orçamentos, formato ISO 8601 (padrão: null) |
| endDate | datetime | opcional | Data final para filtrar orçamentos, formato ISO 8601 (padrão: null) |
| language | string | opcional | Código do idioma para tradução de campos (padrão: "pt-BR") |

> **Filtro de Datas**
> 
> Se nenhuma data for informada, retorna todos os orçamentos. O filtro é aplicado sobre o campo `CreationDate` dos orçamentos.

### Estrutura da Resposta — PagedResult<BudgetDataModel>

### Estrutura de Dados — BudgetDataModel

Cada item no array `data` representa um orçamento:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| code | integer | Código único do orçamento |
| title | string | Título/descrição do orçamento |
| customerName | string | Nome do cliente associado ao orçamento |
| budgetState | integer | Estado atual do orçamento (1=Open, 2=Lost, 3=Won) |
| creationDate | datetime | Data e hora de criação do orçamento |
| deliveryNeed | datetime? | Data necessária para entrega (pode ser null) |
| wonDate | datetime? | Data em que o orçamento foi ganho (pode ser null) |
| lostDate | datetime? | Data em que o orçamento foi perdido (pode ser null) |
| proposes | array | Lista de propostas deste orçamento |

### Estrutura de Dados — ProposeDataModel

| Campo | Tipo | Descrição |
| --- | --- | --- |
| paymentOption | string | Forma de pagamento desta proposta |
| totalPrice | decimal | Preço total da proposta |
| totalProfitPercentual | decimal | Percentual de lucro total sobre a proposta |
| productionCost | decimal | Custo total de produção |
| sellingCost | decimal | Custo total de venda |
| proposeItems | array | Lista de itens desta proposta |

### Estrutura de Dados — ProposeItemDataModel

| Campo | Tipo | Descrição |
| --- | --- | --- |
| itemName | string | Nome do item |
| quantity | double | Quantidade do item |
| unitSymbol | string | Símbolo da unidade de medida |
| unitPrice | double | Preço unitário |
| totalPrice | decimal | Preço total do item |
| totalProfit | decimal | Lucro total do item |
| profitPercentual | decimal | Percentual de lucro sobre o item |
| productionCost | decimal | Custo de produção do item |
| sellingCost | decimal | Custo de venda do item |
| products | array | Lista de produtos que compõem este item |

### Estrutura de Dados — BudgetProductDataModel

Cada produto é um objeto dinâmico (dicionário) com propriedades fixas e campos customizáveis:

> **Estrutura Dinâmica**
> 
> Além das propriedades fixas documentadas, o produto pode conter campos customizáveis adicionais (ex: "Material", "Acabamento", "Cores") que variam conforme a configuração da sua conta.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| Name | string | Nome do produto |
| Description | string | Descrição do produto |
| Quantity | decimal | Quantidade de produção |
| SaleQuantity | decimal | Quantidade de venda |
| UnitPrice | decimal | Preço unitário |
| TotalValue | decimal | Valor total |
| ProductionCost | decimal | Custo de produção |
| SellingCost | decimal | Custo de venda |
| Checklists | array | Lista de checklists respondidos |

### Exemplos de Uso

Exemplo 1: Requisição básica.

Exemplo 2: Com filtro de data.

### Exemplo de Resposta

### Códigos de Status

| Campo | Tipo | Descrição |
| --- | --- | --- |
| 200 OK | — | Requisição bem-sucedida, retorna os dados |
| 401 Unauthorized | — | API Key inválida ou ausente |
| 400 Bad Request | — | Parâmetros inválidos (ex: formato de data incorreto) |
| 500 Internal Server Error | — | Erro interno no servidor |

> **Boas Práticas**
> 
> -   Sempre verifique `hasNextPage` antes de solicitar a próxima página
> -   Use `totalPages` para implementar navegação direta por número de página
> -   Limite o `pageSize` conforme necessário para otimizar performance
> -   Cache os resultados quando apropriado para reduzir chamadas à API
> -   Use filtros de data para reduzir o conjunto de dados retornado

> **Dica de Performance**
> 
> Para grandes volumes de dados, recomenda-se usar `pageSize` entre 20 e 50 e sempre aplicar filtros de data quando possível.

```http
GET /api-key/budgets/data HTTP/1.1
Host: api.holdworks.ai
x-api-key: sua_api_key_aqui
```

```json
{
  "data": [ /* Array de BudgetDataModel */ ],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

```bash
curl -X GET "https://holdprintwebapi-prod.azurewebsites.net/api-key/budgets/data?page=1&pageSize=20" \
  -H "x-api-key: sua_api_key_aqui"
```

```bash
curl -X GET "https://holdprintwebapi-prod.azurewebsites.net/api-key/budgets/data?page=1&pageSize=10&startDate=2025-10-01&endDate=2025-10-31&language=pt-BR" \
  -H "x-api-key: sua_api_key_aqui"
```

```json
{
  "data": [
    {
      "code": 12345,
      "title": "Impressão de Folhetos Promocionais",
      "customerName": "Empresa XYZ Ltda",
      "budgetState": 1,
      "creationDate": "2025-10-15T14:30:00Z",
      "deliveryNeed": "2025-10-25T10:00:00Z",
      "wonDate": null,
      "lostDate": null,
      "proposes": [
        {
          "paymentOption": "À Vista",
          "totalPrice": 1500.00,
          "totalProfitPercentual": 35.50,
          "productionCost": 967.50,
          "sellingCost": 532.50,
          "proposeItems": [
            {
              "itemName": "Folheto A4 - 4x4 cores",
              "quantity": 5000.0,
              "unitSymbol": "un",
              "unitPrice": 0.30,
              "totalPrice": 1500.00,
              "totalProfit": 532.50,
              "profitPercentual": 35.50,
              "productionCost": 967.50,
              "sellingCost": 532.50,
              "products": [
                {
                  "Name": "Impressão Digital",
                  "Description": "Impressão em papel couché 170g",
                  "Quantity": 5000,
                  "SaleQuantity": 5000,
                  "UnitPrice": 0.15,
                  "TotalValue": 750.00,
                  "ProductionCost": 500.00,
                  "SellingCost": 250.00,
                  "Checklists": [
                    {
                      "question": "Qual tipo de papel?",
                      "answer": "Papel Couché 170g"
                    }
                  ],
                  "Material": [
                    {
                      "fieldName": "Material",
                      "value": "Papel Couché 170g"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

---
Fonte: https://docs.holdworks.ai/api/orcamentos/
