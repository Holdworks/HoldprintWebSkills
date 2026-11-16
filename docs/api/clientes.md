# Clientes

Consulta, criação e atualização do cadastro de clientes na plataforma Holdprint, com suporte a endereços múltiplos, contatos, limite de crédito e campos fiscais específicos por país.

## GET `/api-key/customers/data`

Consulta dados de clientes cadastrados na plataforma de forma paginada, com suporte a busca por nome, e-mail ou documento. Os dados retornados incluem informações completas de contato, endereço e status do cliente, facilitando integrações com CRM e sistemas de gestão. Se nenhum parâmetro for informado, o endpoint retorna todos os clientes ativos cadastrados.

Autenticação via API Key no header `x-api-key`.

### Parâmetros de Query

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| page | int | opcional | Número da página para paginação (padrão: 1) |
| limit | int | opcional | Quantidade de registros por página (padrão: 50 • máximo: 100) |
| search | string | opcional | Busca por nome, e-mail ou documento do cliente (exemplo: Empresa Exemplo) |
| active | boolean | opcional | Filtrar apenas clientes ativos (true/false) (padrão: true) |
| translate | boolean | opcional | Traduzir nomes de campos (true/false) (padrão: false) |

### Estrutura de Dados

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | number | Identificador único do cliente |
| name | string | Nome ou razão social do cliente |
| email | string | E-mail de contato |
| phone | string | Telefone de contato |
| document | string | CPF ou CNPJ do cliente |
| address | object | Endereço completo do cliente |
| contact\_person | string | Nome da pessoa de contato |
| active | boolean | Indica se o cliente está ativo |
| notes | string \| null | Observações sobre o cliente |
| created\_at | string | Data de cadastro (ISO 8601) |
| updated\_at | string | Data da última atualização (ISO 8601) |

> **Dica**
> 
> Use o parâmetro search para criar funcionalidades de autocomplete ou busca rápida de clientes no seu sistema.

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
> -   Utilize o filtro active=true para exibir apenas clientes ativos
> -   Normalize documentos antes de buscar (remover pontos e traços)

```bash
curl -X GET "https://api.holdworks.ai/api-key/customers/data?page=1&limit=50&search=Empresa" \
  -H "x-api-key: sua_api_key_aqui"
```

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 789,
        "name": "Empresa Exemplo LTDA",
        "email": "contato@exemplo.com",
        "phone": "+55 11 98765-4321",
        "document": "12.345.678/0001-99",
        "address": {
          "street": "Rua Exemplo, 123",
          "complement": "Sala 501",
          "neighborhood": "Centro",
          "city": "São Paulo",
          "state": "SP",
          "zip_code": "01234-567",
          "country": "Brasil"
        },
        "contact_person": "João Silva",
        "active": true,
        "notes": "Cliente preferencial com desconto especial",
        "created_at": "2024-01-10T10:00:00Z",
        "updated_at": "2025-01-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 145,
      "pages": 3
    }
  },
  "message": "Success"
}
```

## POST `/api-key/customers`

Cria um novo cliente na plataforma via API Key. Você pode cadastrar informações completas incluindo endereços múltiplos, contatos, limite de crédito e campos específicos por país. O sistema gera automaticamente o ID do cliente e registra as datas de criação. Apenas o campo Name é obrigatório; todos os demais são opcionais.

Autenticação via API Key no header `x-api-key` e `Content-Type: application/json`.

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| Name | string | obrigatório | Nome ou razão social do cliente |
| FullName | string | opcional | Nome completo/razão social completa (padrão: Name) |
| MainEmail | string | opcional | E-mail principal de contato |
| MainPhoneNumber | string | opcional | Telefone principal de contato |
| Site | string | opcional | Website do cliente |
| Addresses | array | opcional | Lista de endereços do cliente |
| Contacts | array | opcional | Lista de contatos do cliente |
| CustomerDetails | object | opcional | Detalhes de crédito do cliente |
| SpecificFields | object | opcional | Campos específicos por país |

### Estrutura de Addresses

O campo Addresses aceita um array de objetos de endereço. Existem dois tipos de endereço. Endereço Genérico:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| Description | string | Descrição do endereço (ex: "Sede", "Filial") |
| Country | string | País |
| AddressLine1 | string | Logradouro e número |
| AddressLine2 | string | Complemento |
| Locality | string | Cidade |
| AdministrativeAreaL1 | string | Estado/Província |
| AdministrativeAreaL2 | string | Bairro/Distrito |
| PostalCode | string | Código postal/CEP |
| Number | string | Número do endereço |
| Type | string | Tipo: "Generic" ou "BR" |

Endereço Brasil (BR): para endereços no Brasil, use `Type: "BR"` e inclua campos adicionais:

| Campo Adicional | Tipo | Descrição |
| --- | --- | --- |
| AddressLine3 | string | Linha adicional de endereço |
| IbgeLocalityCode | int | Código IBGE da cidade |
| IbgeStateCode | int | Código IBGE do estado |
| IbgeCountryCode | int | Código IBGE do país (1058 para Brasil) |

### Estrutura de Contacts

O campo Contacts aceita um array de objetos de contato:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| Name | string | Nome do contato |
| Role | string | Cargo/função do contato |
| Phone | string | Telefone do contato |
| Email | string | E-mail do contato |
| BirthDate | string | Data de nascimento (ISO 8601) |
| ContactType | string | Tipo: "Customer", "Supplier", "Commercial", "Financial", "Other" |

### Estrutura de CustomerDetails

O campo CustomerDetails contém informações sobre limite de crédito:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| SalesCreditLimit | decimal | Limite de crédito para vendas (padrão: 0) |
| SalesCreditLimitExpirationDate | string | Data de expiração do limite (ISO 8601) |

### Campos Específicos por País

O campo SpecificFields contém informações específicas de cada país. Campos disponíveis:

| País | Campos Disponíveis |
| --- | --- |
| Brasil (BR) | CNPJ (string) - CNPJ da empresa; CPF (string) - CPF do cliente; InscricaoEstadual (string) - Inscrição estadual; InscricaoMunicipal (string) - Inscrição municipal; RegimeTributario (string) - Regime tributário |
| Argentina (AR) | CUIT (string) - CUIT da empresa; CUIL (string) - CUIL da pessoa; IngresosBrutos (string) - Ingresos brutos |
| Portugal (PT) | NIF (string) - Número de Identificação Fiscal; NIPC (string) - Número de Identificação de Pessoa Coletiva |
| Chile (CL) | RUT (string) - Rol Único Tributario |
| Colômbia (CO) | NIT (string) - Número de Identificación Tributaria |
| Estados Unidos (US) | EIN (string) - Employer Identification Number; SSN (string) - Social Security Number |
| Paraguai (PY) | RUC (string) - Registro Único de Contribuyentes |
| Reino Unido (GB) | VATNumber (string) - VAT Registration Number; CompanyNumber (string) - Company Registration Number |
| Uruguai (UY) | RUT (string) - Registro Único Tributario |

> **Dica**
> 
> Você precisa especificar o tipo de campo no objeto. Por exemplo, para Brasil use `"SpecificFields": {"BR": {"CNPJ": "12.345.678/0001-99"}}`

Exemplo de Requisição - Básico (apenas campos obrigatórios):

Exemplo de Requisição - Completo (todos os campos opcionais):

Exemplo de Resposta:

> **Dica**
> 
> A resposta inclui campos gerados pelo sistema como Id, EntityType, Active, CreationTime e LastUpdateTime. O campo AvaibleSalesCreditLimit é inicializado com o mesmo valor de SalesCreditLimit.

> **Boas Práticas**
> 
> -   Sempre valide e-mails e telefones antes de enviar
> -   Use o campo FullName para armazenar razão social completa
> -   Para endereços BR, sempre forneça os códigos IBGE quando possível
> -   Inclua múltiplos contatos com tipos específicos (Commercial, Financial, etc.)
> -   Defina limites de crédito com datas de expiração apropriadas
> -   Use os campos específicos do país para compliance fiscal

### Códigos de Status

| Código | Descrição |
| --- | --- |
| 200 | Cliente criado com sucesso |
| 400 | Dados inválidos (campo obrigatório ausente ou formato incorreto) |
| 401 | API Key inválida ou ausente |
| 500 | Erro interno do servidor |

```bash
curl -X POST "https://api.holdworks.ai/api-key/customers" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Empresa Exemplo LTDA"
  }'
```

```bash
curl -X POST "https://api.holdworks.ai/api-key/customers" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Empresa Exemplo LTDA",
    "FullName": "Empresa Exemplo Comércio e Serviços LTDA",
    "MainEmail": "contato@exemplo.com",
    "MainPhoneNumber": "+55 11 98765-4321",
    "Site": "https://www.exemplo.com",
    "Addresses": [
      {
        "Type": "BR",
        "Description": "Sede",
        "Country": "Brasil",
        "AddressLine1": "Rua Exemplo",
        "AddressLine2": "Sala 501",
        "AddressLine3": "",
        "Locality": "São Paulo",
        "AdministrativeAreaL1": "SP",
        "AdministrativeAreaL2": "Centro",
        "PostalCode": "01234-567",
        "Number": "123",
        "IbgeLocalityCode": 3550308,
        "IbgeStateCode": 35,
        "IbgeCountryCode": 1058
      }
    ],
    "Contacts": [
      {
        "Name": "João Silva",
        "Role": "Gerente Comercial",
        "Phone": "+55 11 91234-5678",
        "Email": "joao.silva@exemplo.com",
        "BirthDate": "1985-03-15T00:00:00Z",
        "ContactType": "Commercial"
      }
    ],
    "CustomerDetails": {
      "SalesCreditLimit": 50000.00,
      "SalesCreditLimitExpirationDate": "2025-12-31T23:59:59Z"
    },
    "SpecificFields": {
      "BR": {
        "CNPJ": "12.345.678/0001-99",
        "InscricaoEstadual": "123.456.789.012",
        "InscricaoMunicipal": "98765432",
        "RegimeTributario": "Simples Nacional"
      }
    }
  }'
```

```json
{
  "Id": "507f1f77bcf86cd799439011",
  "Name": "Empresa Exemplo LTDA",
  "FullName": "Empresa Exemplo Comércio e Serviços LTDA",
  "MainEmail": "contato@exemplo.com",
  "MainPhoneNumber": "+55 11 98765-4321",
  "Site": "https://www.exemplo.com",
  "EntityType": "Customer",
  "Active": true,
  "CreationTime": "2025-01-15T10:30:00Z",
  "LastUpdateTime": "2025-01-15T10:30:00Z",
  "Addresses": [
    {
      "Type": "BR",
      "Description": "Sede",
      "Country": "Brasil",
      "AddressLine1": "Rua Exemplo",
      "AddressLine2": "Sala 501",
      "AddressLine3": "",
      "Locality": "São Paulo",
      "AdministrativeAreaL1": "SP",
      "AdministrativeAreaL2": "Centro",
      "PostalCode": "01234-567",
      "Number": "123",
      "IbgeLocalityCode": 3550308,
      "IbgeStateCode": 35,
      "IbgeCountryCode": 1058
    }
  ],
  "Contacts": [
    {
      "Id": 1,
      "Name": "João Silva",
      "Role": "Gerente Comercial",
      "Phone": "+55 11 91234-5678",
      "Email": "joao.silva@exemplo.com",
      "BirthDate": "1985-03-15T00:00:00Z",
      "ContactType": "Commercial"
    }
  ],
  "CustomerDetails": {
    "SalesCreditLimit": 50000.00,
    "AvaibleSalesCreditLimit": 50000.00,
    "SalesCreditLimitExpirationDate": "2025-12-31T23:59:59Z"
  },
  "SpecificFields": {
    "BR": {
      "CNPJ": "12.345.678/0001-99",
      "InscricaoEstadual": "123.456.789.012",
      "InscricaoMunicipal": "98765432",
      "RegimeTributario": "Simples Nacional"
    }
  }
}
```

## PUT `/api-key/customers/{id}`

Atualiza um cliente existente na plataforma via API Key. Você pode modificar todas as informações do cliente, incluindo endereços, contatos, limite de crédito e status de ativação. O sistema atualiza automaticamente o campo LastUpdateTime. Diferença do POST: este endpoint inclui o campo Active (boolean, obrigatório) que permite ativar ou desativar o cliente — esse campo não está disponível no endpoint de criação.

Autenticação via API Key no header `x-api-key` e `Content-Type: application/json`.

### Parâmetros de URL

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| id | string | obrigatório | ID do cliente a ser atualizado (MongoDB ObjectId). Exemplo: 507f1f77bcf86cd799439011 |

> **Dica**
> 
> O sistema valida se o cliente pertence à conta associada à API Key. Se o ID não existir ou não pertencer à sua conta, será retornado erro 404.

### Request Body

O corpo da requisição é similar ao POST, mas inclui o campo Active:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| Name | string | obrigatório | Nome ou razão social do cliente |
| Active | boolean | obrigatório | NOVO: Status do cliente (true = ativo, false = inativo) |
| FullName | string | opcional | Nome completo/razão social completa (padrão: Name) |
| MainEmail | string | opcional | E-mail principal de contato |
| MainPhoneNumber | string | opcional | Telefone principal de contato |
| Site | string | opcional | Website do cliente |
| Addresses | array | opcional | Lista de endereços do cliente |
| Contacts | array | opcional | Lista de contatos do cliente |
| CustomerDetails | object | opcional | Detalhes de crédito do cliente |
| SpecificFields | object | opcional | Campos específicos por país |

> **Dica**
> 
> Os campos Addresses, Contacts, CustomerDetails e SpecificFields seguem a mesma estrutura documentada na seção de Criação acima. Consulte aquela seção para detalhes completos.

Exemplo de Requisição - Básico (atualizando nome e status):

Exemplo de Requisição - Desativar Cliente:

Exemplo de Requisição - Completo (atualizando todos os dados):

Exemplo de Resposta:

> **Dica**
> 
> Note que o campo LastUpdateTime é atualizado automaticamente pelo sistema para refletir o horário da última modificação.

> **Boas Práticas**
> 
> -   Sempre valide o ID do cliente antes de enviar a requisição
> -   Use Active: false em vez de deletar clientes permanentemente
> -   Atualize o limite de crédito com data de expiração apropriada
> -   Ao atualizar endereços e contatos, envie a lista completa desejada
> -   Mantenha histórico das alterações no seu sistema
> -   Implemente retry logic para falhas temporárias de rede

### Códigos de Status

| Código | Descrição |
| --- | --- |
| 200 | Cliente atualizado com sucesso |
| 400 | Dados inválidos (campo obrigatório ausente ou formato incorreto) |
| 401 | API Key inválida ou ausente |
| 404 | Cliente não encontrado ou não pertence à sua conta |
| 500 | Erro interno do servidor |

```bash
curl -X PUT "https://api.holdworks.ai/api-key/customers/507f1f77bcf86cd799439011" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Empresa Exemplo LTDA - Atualizada",
    "Active": true
  }'
```

```bash
curl -X PUT "https://api.holdworks.ai/api-key/customers/507f1f77bcf86cd799439011" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Empresa Exemplo LTDA",
    "Active": false
  }'
```

```bash
curl -X PUT "https://api.holdworks.ai/api-key/customers/507f1f77bcf86cd799439011" \
  -H "x-api-key: sua_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Empresa Exemplo LTDA - Atualizada",
    "FullName": "Empresa Exemplo Comércio e Serviços LTDA - Atualizada",
    "Active": true,
    "MainEmail": "novo-contato@exemplo.com",
    "MainPhoneNumber": "+55 11 99999-9999",
    "Site": "https://www.exemplo-novo.com",
    "Addresses": [
      {
        "Type": "BR",
        "Description": "Sede - Novo Endereço",
        "Country": "Brasil",
        "AddressLine1": "Av. Paulista",
        "AddressLine2": "10º andar",
        "AddressLine3": "",
        "Locality": "São Paulo",
        "AdministrativeAreaL1": "SP",
        "AdministrativeAreaL2": "Bela Vista",
        "PostalCode": "01310-100",
        "Number": "1000",
        "IbgeLocalityCode": 3550308,
        "IbgeStateCode": 35,
        "IbgeCountryCode": 1058
      }
    ],
    "Contacts": [
      {
        "Name": "Maria Santos",
        "Role": "Diretora Comercial",
        "Phone": "+55 11 98888-8888",
        "Email": "maria.santos@exemplo.com",
        "BirthDate": "1980-05-20T00:00:00Z",
        "ContactType": "Commercial"
      }
    ],
    "CustomerDetails": {
      "SalesCreditLimit": 100000.00,
      "SalesCreditLimitExpirationDate": "2026-12-31T23:59:59Z"
    },
    "SpecificFields": {
      "BR": {
        "CNPJ": "12.345.678/0001-99",
        "InscricaoEstadual": "999.888.777.666",
        "InscricaoMunicipal": "11223344",
        "RegimeTributario": "Lucro Real"
      }
    }
  }'
```

```json
{
  "Id": "507f1f77bcf86cd799439011",
  "Name": "Empresa Exemplo LTDA - Atualizada",
  "FullName": "Empresa Exemplo Comércio e Serviços LTDA - Atualizada",
  "MainEmail": "novo-contato@exemplo.com",
  "MainPhoneNumber": "+55 11 99999-9999",
  "Site": "https://www.exemplo-novo.com",
  "EntityType": "Customer",
  "Active": true,
  "CreationTime": "2025-01-15T10:30:00Z",
  "LastUpdateTime": "2025-01-28T14:45:00Z",
  "Addresses": [
    {
      "Type": "BR",
      "Description": "Sede - Novo Endereço",
      "Country": "Brasil",
      "AddressLine1": "Av. Paulista",
      "AddressLine2": "10º andar",
      "AddressLine3": "",
      "Locality": "São Paulo",
      "AdministrativeAreaL1": "SP",
      "AdministrativeAreaL2": "Bela Vista",
      "PostalCode": "01310-100",
      "Number": "1000",
      "IbgeLocalityCode": 3550308,
      "IbgeStateCode": 35,
      "IbgeCountryCode": 1058
    }
  ],
  "Contacts": [
    {
      "Id": 1,
      "Name": "Maria Santos",
      "Role": "Diretora Comercial",
      "Phone": "+55 11 98888-8888",
      "Email": "maria.santos@exemplo.com",
      "BirthDate": "1980-05-20T00:00:00Z",
      "ContactType": "Commercial"
    }
  ],
  "CustomerDetails": {
    "SalesCreditLimit": 100000.00,
    "AvaibleSalesCreditLimit": 100000.00,
    "SalesCreditLimitExpirationDate": "2026-12-31T23:59:59Z"
  },
  "SpecificFields": {
    "BR": {
      "CNPJ": "12.345.678/0001-99",
      "InscricaoEstadual": "999.888.777.666",
      "InscricaoMunicipal": "11223344",
      "RegimeTributario": "Lucro Real"
    }
  }
}
```

---
Fonte: https://docs.holdworks.ai/api/clientes/
