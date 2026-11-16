# Construa sobre o Holdprint

Conecte a sua IA ao ERP, use a API ou crie plugins que rodam dentro do Holdprint. Cada página foi escrita para a sua IA executar e para você aprovar.

```
Leia https://docs.holdworks.ai/llms.txt e me ajude a conectar o Holdprint à minha IA.
Depois me diga o que dá para fazer com a minha conta.
```

## [Conectar a sua IA](https://docs.holdworks.ai/conectar-ia.md)

Pergunte ao Holdprint em português pelo Claude, ChatGPT, Cursor ou Codex. O login é pelo navegador e a IA recebe 28 ferramentas para ler e operar a conta, com prévia antes de gravar.

-   [Claude Code](https://docs.holdworks.ai/conectar-ia/claude-code.md)
-   [claude.ai e ChatGPT](https://docs.holdworks.ai/conectar-ia/claude-ai-e-chatgpt.md)
-   [Tools do MCP](https://docs.holdworks.ai/conectar-ia/tools-do-mcp.md)

```bash
claude mcp add --transport http holdprint https://mcp.holdprint.net/mcp
```

## [Usar a API](https://docs.holdworks.ai/api.md)

Consulte e opere a conta pela API /v1, a mesma da CLI e do MCP: consultas com filtros, leitura por id e as ações do sistema, sempre como o usuário logado. Para integração entre sistemas, a API Key continua disponível.

-   [Consultas por recurso](https://docs.holdworks.ai/api/v1/consultas.md)
-   [Ações pela CLI e MCP](https://docs.holdworks.ai/api/acoes.md)
-   [API Key (legada)](https://docs.holdworks.ai/api/chave.md)

```bash
holdprint login
holdprint query budgets --where state=Open --limit 5
holdprint actions list --search cliente
```

## [Criar plugins](https://docs.holdworks.ai/plugins.md)

Telas no menu, botões nas telas, abas, cards na Visão Geral e automações que rodam dentro do Holdprint. A sua IA cria e testa; você aprova o que o plugin pode ler e fazer.

-   [Comece com a sua IA](https://docs.holdworks.ai/plugins/comece-com-sua-ia.md)
-   [Manifesto](https://docs.holdworks.ai/plugins/manifesto.md)
-   [Publicação](https://docs.holdworks.ai/plugins/publicacao.md)

```
Crie um plugin do Holdprint que mostra os orçamentos abertos de cada vendedor,
com um botão para criar a tarefa de follow-up. Comece pelo simulador.
```

## Para a sua IA

Esta documentação é escrita para uma IA executar. Cada página tem uma versão em Markdown no mesmo endereço terminado em `.md`, o arquivo [`llms.txt`](https://docs.holdworks.ai/llms.txt.md) lista todas elas e o [`llms-full.txt`](https://docs.holdworks.ai/llms-full.txt.md) junta tudo num arquivo só. Em qualquer página, o botão **Copiar para a IA** copia o conteúdo em Markdown, pronto para colar.

## Endereços e comandos

| O quê | Endereço ou comando |
| --- | --- |
| [MCP hospedado](https://docs.holdworks.ai/conectar-ia.md) | `https://mcp.holdprint.net/mcp` |
| [API /v1](https://docs.holdworks.ai/api/v1.md) | `{BASE_URL}/v1` |
| [API Key (legada)](https://docs.holdworks.ai/api/chave.md) | `https://api.holdworks.ai` |
| [Skills oficiais](https://docs.holdworks.ai/conectar-ia/skills.md) | `npx @holdprint/skills install` |
| [CLI de plugins](https://docs.holdworks.ai/plugins/cli.md) | `npm install -g @holdprint/cli` |
| [Índice para IAs](https://docs.holdworks.ai/llms.txt.md) | `https://docs.holdworks.ai/llms.txt` |

## Precisa de ajuda

Comece pelas [perguntas frequentes](https://docs.holdworks.ai/comecar/perguntas-frequentes.md). Para liberar o banco somente leitura ou tirar dúvidas da sua conta, fale com o suporte do Holdprint pelo próprio sistema.

---
Fonte: https://docs.holdworks.ai/
