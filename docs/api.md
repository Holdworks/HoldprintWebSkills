# API do Holdprint

Duas formas de integrar por HTTP: a API `/v1`, nova, que serve à CLI, ao MCP, aos plugins e a apps externos, e a API Key, mais antiga, para integração entre sistemas com uma chave fixa.

## Qual usar

|  | API /v1 (recomendada) | API Key (legada) |
| --- | --- | --- |
| **Como entra** | Login de um usuário pelo navegador (CLI, MCP, plugin ou app externo). A chamada vê só o que esse usuário vê no Holdprint. | Chave fixa gerada em Ajustes > API/MCP, no cabeçalho `x-api-key`. |
| **O que cobre** | Consulta com filtros de 7 recursos, leitura por id de 27 cadastros, tarefas, etapa do funil, eventos e as 1.474 ações do sistema pela CLI e pelo MCP. | Clientes, fornecedores, orçamentos, jobs, contas a pagar e a receber e cadastros financeiros. |
| **Endereço** | `{BASE_URL}/v1` | `https://api.holdworks.ai` |
| **Para quem** | A IA da gráfica, plugins e automações que agem em nome de um usuário. | Integração servidor a servidor com outro ERP, BI ou loja. |

## Comece pela CLI

A CLI `holdprint` faz o login, guarda a sessão e chama a API `/v1` por você. É o caminho mais curto para a sua IA consultar e operar a conta.

```bash
npm install -g @holdprint/cli
holdprint login
holdprint whoami
holdprint query budgets --where state=Open --fields id,code,customer,businessValue --limit 5
holdprint actions list --search cliente
```

```
Use a CLI holdprint para listar os 10 orçamentos abertos de maior valor.
Antes de mudar qualquer coisa na conta, me mostre a prévia (--dry-run) e espere eu confirmar.
```

## Nesta seção

-   [API /v1](https://docs.holdworks.ai/api/v1.md): endereço, autenticação, rotas, paginação, eventos, cotas e formato de erro.
-   [Consultas por recurso](https://docs.holdworks.ai/api/v1/consultas.md): campos, filtros e ordenações de cada recurso, com o comando da CLI.
-   [Ações pela CLI e MCP](https://docs.holdworks.ai/api/acoes.md): como a IA descobre, confere e executa as 1.474 ações do sistema.
-   [API Key (legada)](https://docs.holdworks.ai/api/chave.md): as rotas com chave fixa, mantidas para integrações existentes.

---
Fonte: https://docs.holdworks.ai/api/
