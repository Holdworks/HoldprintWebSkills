# API Key (legada)

Integração direta via HTTP, autenticada por API Key. Para conectar uma LLM, prefira o MCP (acima). A API REST é para integrações de sistema.

## `https://api.holdworks.ai`URL base

Todas as requisições usam a URL base acima e exigem o header `x-api-key`. Respostas em JSON, padrão REST.

```http
x-api-key: sua_api_key_aqui
```

### Onde pegar seu token

1.  **Acesse Ajustes**
    
    No menu lateral do app Holdprint, clique em **Ajustes**.
    
2.  **Abra API/MCP**
    
    Dentro de Ajustes, clique em **API/MCP**.
    
3.  **Copie o token**
    
    Na aba **Chave de API**, clique em **Copiar** (ou **Gerar novo token** para criar um novo).
    

_Tela de exemplo (app.holdprint.net/holdprint/settings/api-ai):_ holdprint · API/MCP · Chave de API · Instalar skills · Conectar MCP · Seu token pessoal de API · •••••••••••••••••••••••• · Copiar · Gerar novo token

> **Mantenha sua API Key segura**
> 
> Nunca exponha a chave em código cliente ou repositórios públicos. Use variáveis de ambiente. Para LLMs, prefira o MCP (login OAuth, sem colar token).

## Formato de resposta

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": { "page": 1, "limit": 50, "total": 100, "pages": 2 }
  },
  "message": "Success"
}
```

## Erros na escrita (contas a pagar e a receber)

Os endpoints de criação, edição e baixa de contas devolvem erros neste formato. O `code` identifica a regra; `fields` aponta o campo.

```json
{
  "success": false,
  "error": {
    "code": "HOLD_CHART_OF_ACCOUNTS_2",
    "message": "Mensagem do erro no idioma da conta",
    "fields": [],
    "parameters": []
  }
}
```

## Códigos de status

| Código | Significado |
| --- | --- |
| 200 | OK — requisição bem-sucedida |
| 201 | Created — registro criado |
| 400 | Bad Request — parâmetros inválidos ou regra de negócio não atendida |
| 401 | Unauthorized — API Key inválida ou ausente |
| 403 | Forbidden — recurso fora do plano da conta ou chave sem permissão para a operação |
| 404 | Not Found — recurso não encontrado |
| 409 | Conflict — a mesma `Idempotency-Key` está sendo processada em outra requisição |
| 500 | Internal Server Error |

> **Rate limiting**
> 
> 100 requisições por minuto por API Key. Header de resposta `X-RateLimit-Remaining`; reset a cada minuto. Implemente retry com backoff exponencial.

---
Fonte: https://docs.holdworks.ai/api/chave/
