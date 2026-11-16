# Comece com a sua IA

Este é o caminho recomendado para criar um plugin: você descreve o que quer em português e a IA cria, testa e publica, usando a CLI `holdprint`. Você só precisa clicar em duas coisas no Holdprint: **aprovar o login** da CLI e **aprovar o plugin** (consentimento).

> Para a IA que está lendo esta página: as regras completas estão na skill `holdprint-plugins` (instalada no passo 1). Siga a skill; ela prevalece sobre resumos.

## O que você precisa

| Item | Para quê |
|---|---|
| Um assistente de IA **com terminal**: Claude Code, Codex, Cursor ou Gemini CLI | A IA precisa rodar a CLI `holdprint` na sua máquina. No claude.ai e no ChatGPT (só navegador) a IA escreve o código, mas não consegue testar nem publicar. |
| Node.js 22 ou mais novo | Para rodar `npx` e a CLI. Confira com `node --version`. |
| Um navegador (Chrome, Edge ou Firefox) | Para aprovar o login e o plugin. O modo desenvolvedor não funciona no Safari. |
| Conta no Holdprint como **Administrador** | Só para publicar. Para desenhar e testar no simulador, não precisa de conta. Sem conta: crie uma conta de teste grátis em `{APP_URL}/holdai/register`. |

## Passo a passo

### 1. Instale as skills (ensina a IA a criar plugins)

```bash
npx @holdprint/skills install
```

O instalador detecta os assistentes da sua máquina (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot) e copia as skills para cada um. Para escolher:

```bash
npx @holdprint/skills install --harness=claude,codex
npx @holdprint/skills check      # confere se está tudo instalado
npx @holdprint/skills update     # atualiza para a versão mais nova
```

Skills que importam para plugins: `holdprint-plugins` (criar, testar, publicar) e `holdprint-cli` (operar a conta pelo terminal). Depois de instalar, **reinicie o assistente** (ou abra uma sessão nova).

### 2. Instale a CLI `holdprint`

```bash
npm install -g @holdprint/cli
holdprint --version
holdprint --help
```

Precisa de Node.js 22 ou mais novo. Não há chave nem endereço para configurar: o `holdprint plugin deploy` publica pela **sua conta**, a mesma do login do passo seguinte.

### 3. Entre na sua conta (uma vez)

Você pode pedir para a IA fazer isso. Ela roda `holdprint login`, que:

1. mostra um **código de confirmação** (ex.: `ABCD-1234`) e um link `Aprove em: {APP_URL}/identity/device?code=...`;
2. abre o navegador no Holdprint, já logado;
3. você confere se o código é o mesmo, vê o nome "Holdprint CLI", a conta e as permissões, e clica em **Aprovar**;
4. a CLI responde `Login feito como <seu e-mail> (conta <número>). A sessão renova sozinha.`

A credencial fica no cofre do sistema (Keychain no macOS) e se renova sozinha por até 30 dias. Ninguém digita senha no terminal. Para sair: `holdprint logout`. Para desconectar pelo Holdprint: **Plugins > Acessos conectados**.

### 4. Abra a IA na pasta onde quer guardar os plugins e peça

Use um dos prompts prontos abaixo. A IA vai dizer em que etapa você está e o que precisa clicar.

## Prompts prontos para colar

### Criar um plugin

```prompt
Crie um plugin do Holdprint que mostra os orçamentos abertos de cada vendedor,
com o valor total e quantos dias cada um está parado, e um botão para criar
uma tarefa de follow-up no orçamento. Comece pelo simulador e me mostre a tela.
```

```prompt
Quero um botão na ordem de produção chamado "Avisar a produção" que abre uma
janela onde eu escrevo um recado e ele cria uma tarefa no orçamento do job.
Também quero o mesmo botão na lista de jobs, para vários selecionados.
```

```prompt
Crie uma automação no Holdprint que roda todo dia de manhã, procura orçamentos
abertos sem movimento há 7 dias e cria uma tarefa de follow-up para o vendedor
responsável, sem duplicar se rodar duas vezes.
```

```prompt
Coloque um card "Contas a vencer na semana" na Visão Geral do Holdprint, com o
total e a quantidade de contas a pagar que vencem nos próximos 7 dias.
```

### Testar no modo desenvolvedor (dados reais, sem publicar)

```prompt
Abra o plugin em modo desenvolvedor na minha conta para eu ver com os dados
reais antes de publicar a versão nova.
```

### Publicar para a minha conta

```prompt
Publique o plugin na minha conta e me diga exatamente o que eu vou aprovar.
```

```prompt
A versão nova está boa. Libere para a equipe.
```

### Mandar para outra gráfica por link (não listado)

```prompt
Gere um link para eu mandar este plugin para outra gráfica instalar,
válido por 15 dias e para no máximo 3 contas.
```

### Pedir publicação no Marketplace (todas as gráficas)

```prompt
Quero publicar este plugin para todas as gráficas no Marketplace.
Confira o que falta, prepare a vitrine e mande o pedido para a Hold analisar.
```

```prompt
Como está o pedido de publicação do meu plugin?
```

## O que a IA faz em cada etapa (e o que você clica)

| Etapa | O que a IA faz | O que você faz |
|---|---|---|
| Começo | Roda `holdprint whoami`. Sem login, pergunta **uma vez** se você já tem conta. | Responde sim ou não. |
| Login | Roda `holdprint login` e mostra o código. | Confere o código no navegador e clica em **Aprovar**. |
| Criar | `holdprint plugin create <pasta>` (ou `--template acao` / `--template automacao`), edita `public/` e o manifesto, roda `holdprint plugin validate`. Usa um identificador (`slug`) novo e único. | Nada. |
| Testar | Abre o simulador `holdprint dev --no-open` (dados fictícios da "Gráfica Exemplo", sem conta e sem rede; `--no-open` só imprime o link) e manda o link. | Abre o link e diz o que mudar. |
| Publicar na conta | `holdprint plugin deploy`. Na primeira vez, o plugin fica **aguardando aprovação** e a IA mostra o link `{APP_URL}/plugins/consent/<id>` com a lista do que você vai aprovar. | Abre o link como Administrador, confere permissões e perfis, digita a senha e clica em **Aprovar e instalar**. Avisa a IA. |
| Depois de aprovado | Roda o que dependia da aprovação (ex.: `holdprint plugin run <agenda>` duas vezes e `holdprint plugin logs`) e mostra o resultado. | Abre o plugin no menu **Plugins** (ou no botão, aba ou card). |
| Ajustes | Oferece o modo desenvolvedor (`holdprint plugin dev --account`), só leitura, só na sua janela. Publica a versão nova como **prévia** (só administradores veem). | Confere a prévia. Diz "pode liberar". |
| Liberar | `holdprint plugin release`. | Nada. A equipe vê a versão nova ao reabrir. |
| Permissão nova | Novo `deploy` pede **novo consentimento**; a IA mostra o link de novo. | Aprova de novo. |
| Segredo (chave de serviço externo) | Declara só o **nome** no manifesto e pede que você grave o valor. A IA **nunca** pede o valor no chat. | Grava em **Plugins > ⋯ > Segredos** ou no seu terminal: `holdprint plugin secrets set NOME`. |
| Link para outra gráfica | `holdprint plugin publish --unlisted` e entrega o link na conversa (o link aparece uma única vez). | Manda o link ao Administrador da outra gráfica, que instala e aprova. |
| Marketplace | Confere vitrine (`listing`), ausência de segredos e versão liberada; roda `holdprint plugin submit --note "..."`. | Espera a análise da Hold. Pergunta "como está o pedido" quando quiser. |

## Por assistente

### Claude Code

```bash
npx @holdprint/skills install --harness=claude
npm install -g @holdprint/cli
claude
```

As skills ficam em `~/.claude/skills`. Comandos que não terminam sozinhos (`holdprint login`, `holdprint dev`, `holdprint plugin dev --account`, `holdprint plugin listen`) a skill manda rodar em segundo plano, para a conversa não travar. Para você mesmo digitar um segredo sem que ele passe pela IA, use `!` no Claude Code: `! holdprint plugin secrets set NOME`.

Para também consultar e operar os dados da conta pelo MCP, veja a seção MCP desta documentação (`claude mcp add --transport http holdprint https://mcp.holdprint.net/mcp`).

### Codex

```bash
npx @holdprint/skills install --harness=codex
npm install -g @holdprint/cli
codex
```

As skills ficam em `~/.agents/skills`. Se o Codex não conseguir deixar o simulador rodando em segundo plano, rode `holdprint dev` você mesmo em outro terminal e diga à IA o endereço que apareceu.

### Cursor

```bash
npx @holdprint/skills install --harness=cursor
npm install -g @holdprint/cli
```

Abra a pasta do projeto no Cursor e use o agente com terminal habilitado. As skills ficam em `.cursor/skills`.

### Gemini CLI e GitHub Copilot

`npx @holdprint/skills install --harness=gemini` (ou `copilot`). O fluxo é o mesmo: a IA precisa de terminal para rodar a CLI.

### claude.ai e ChatGPT (só navegador)

Sem terminal, a IA não roda a CLI: ela consegue escrever o `holdprint.plugin.json` e os arquivos de `public/`, mas **você** precisa rodar `holdprint plugin validate`, `holdprint dev` e `holdprint plugin deploy` na sua máquina. Para criar plugins, prefira um assistente com terminal. Para consultar e operar os dados da conta pelo chat, use o conector MCP (seção MCP desta documentação).

## Regras que a IA segue (e você pode cobrar)

- Fala com o Holdprint **só pelo SDK** dentro da tela e por `hold.api` nas funções; nunca pede nem guarda senha ou token.
- Declara o **mínimo** de permissões, cada uma com o motivo em português.
- Não chama sites externos na tela; serviço externo só por função, com o domínio declarado.
- Não guarda dado do ERP (orçamentos, clientes, valores) no armazenamento do plugin, que é compartilhado pela conta.
- Escritas sempre com chave de idempotência derivada do fato: repetir não duplica.
- Nunca pede o valor de um segredo no chat.
- Só pede publicação no Marketplace quando você pedir.

---
Fonte: https://docs.holdworks.ai/plugins/comece-com-sua-ia/
