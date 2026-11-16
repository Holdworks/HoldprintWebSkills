# Fornecedores

Consulta o cadastro de fornecedores de forma paginada, com busca por nome, e-mail ou documento, filtro por categoria e dados completos de contato, endereço e condições de pagamento.

## GET `/api-key/suppliers/data`

Consulta dados de fornecedores cadastrados na plataforma. Este endpoint permite consultar o cadastro de fornecedores de forma paginada, com suporte a busca por nome, e-mail ou documento, e filtro por categoria. Os dados retornados incluem informações completas de contato, endereço, categoria e condições de pagamento, facilitando integrações com sistemas de compras e controle de estoque. Se nenhum parâmetro for informado, o endpoint retorna todos os fornecedores ativos cadastrados.

Autenticação via API Key no header `x-api-key`. Base da API: `https://api.holdworks.ai`.

### Parâmetros de Query

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| page | int | opcional | Número da página para paginação (padrão: 1) |
| limit | int | opcional | Quantidade de registros por página (padrão: 50 • máximo: 100) |
| search | string | opcional | Busca por nome, e-mail ou documento do fornecedor (exemplo: Fornecedor XYZ) |
| category | string | opcional | Filtrar por categoria de fornecedor (exemplo: paper\_supplies) |
| active | boolean | opcional | Filtrar apenas fornecedores ativos (true/false) (padrão: true) |
| translate | boolean | opcional | Traduzir nomes de campos (true/false) (padrão: false) |

### Categorias de Fornecedores

| Campo | Tipo | Descrição |
| --- | --- | --- |
| paper\_supplies | string | Fornecedores de papel e substratos |
| ink\_supplies | string | Fornecedores de tintas e consumíveis |
| equipment | string | Fornecedores de equipamentos e maquinário |
| services | string | Fornecedores de serviços terceirizados |
| other | string | Outros fornecedores |

> **Dica**
> 
> Filtre fornecedores por categoria para encontrar rapidamente parceiros específicos para cada tipo de insumo ou serviço necessário na produção.

### Estrutura de Dados

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | number | Identificador único do fornecedor |
| name | string | Nome ou razão social do fornecedor |
| email | string | E-mail de contato |
| phone | string | Telefone de contato |
| document | string | CNPJ do fornecedor |
| category | string | Categoria do fornecedor |
| address | object | Endereço completo do fornecedor |
| contact\_person | string | Nome da pessoa de contato |
| payment\_terms | string | Condições de pagamento acordadas |
| active | boolean | Indica se o fornecedor está ativo |
| notes | string \| null | Observações sobre o fornecedor |
| created\_at | string | Data de cadastro (ISO 8601) |
| updated\_at | string | Data da última atualização (ISO 8601) |

### Objeto Address

| Campo | Tipo | Descrição |
| --- | --- | --- |
| street | string | Logradouro e número |
| complement | string | Complemento (opcional) |
| neighborhood | string | Bairro |
| city | string | Cidade |
| state | string | Estado (sigla) |
| zip\_code | string | CEP |
| country | string | País |

> **Boas Práticas**
> 
> -   Use paginação para grandes volumes de dados
> -   Implemente cache local para reduzir requisições
> -   Utilize filtros por categoria para encontrar fornecedores específicos
> -   Mantenha as condições de pagamento atualizadas (payment\_terms)

```bash
curl -X GET "https://api.holdworks.ai/api-key/suppliers/data?page=1&limit=50&category=paper_supplies" \
  -H "x-api-key: sua_api_key_aqui"
```

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 55,
        "name": "Fornecedor XYZ",
        "email": "vendas@fornecedor.com",
        "phone": "+55 11 91234-5678",
        "document": "98.765.432/0001-11",
        "category": "paper_supplies",
        "address": {
          "street": "Rua Industrial, 500",
          "complement": "Galpão 3",
          "neighborhood": "Distrito Industrial",
          "city": "São Paulo",
          "state": "SP",
          "zip_code": "03456-789",
          "country": "Brasil"
        },
        "contact_person": "Carlos Almeida",
        "payment_terms": "30/60 dias",
        "active": true,
        "notes": "Fornecedor principal de papel offset",
        "created_at": "2023-08-10T10:00:00Z",
        "updated_at": "2025-01-05T09:30:00Z"
      },
      {
        "id": 56,
        "name": "Tintas Premium LTDA",
        "email": "comercial@tintaspremium.com",
        "phone": "+55 11 98765-4321",
        "document": "12.345.678/0001-22",
        "category": "ink_supplies",
        "address": {
          "street": "Av. das Tintas, 200",
          "complement": null,
          "neighborhood": "Zona Norte",
          "city": "São Paulo",
          "state": "SP",
          "zip_code": "02123-456",
          "country": "Brasil"
        },
        "contact_person": "Ana Paula",
        "payment_terms": "À vista com desconto",
        "active": true,
        "notes": null,
        "created_at": "2024-02-15T14:00:00Z",
        "updated_at": "2024-12-20T10:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 78,
      "pages": 2
    }
  },
  "message": "Success"
}
```

---
Fonte: https://docs.holdworks.ai/api/fornecedores/
