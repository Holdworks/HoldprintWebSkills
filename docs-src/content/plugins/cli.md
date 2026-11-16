# CLI `holdprint`

A CLI `holdprint` cria, testa e publica plugins, e também opera a conta pelo terminal (consultar, cadastrar, rodar relatórios). É a mesma ferramenta que a IA usa por trás.

```bash
npm install -g @holdprint/cli
holdprint --version
holdprint --help
```

Precisa de **Node.js 22 ou mais novo**. Não há chave nem alvo para configurar (nem `--target`): `holdprint plugin deploy` publica pela conta de quem fez `holdprint login`.

Convenções:
- `[pasta]` é a pasta do projeto do plugin; sem ela, vale a pasta atual.
- Depois do primeiro `deploy`, a pasta ganha `.holdprint/deploy.json` (id do plugin e da instalação). Os comandos de gestão usam esse arquivo para saber de qual plugin você fala. Não apague nem versione a pasta `.holdprint/`.
- `[id]` aceita o id da instalação (24 caracteres hexadecimais) ou o id do plugin (`p-` + 10 caracteres).
- Saída em tabela no terminal; em pipe (`| jq`), os comandos de dados saem em JSON.
- Todo erro começa com `erro:` e, quando vem da plataforma, traz o código `HOLD_PLUGIN_PLATFORM_<n>` e uma dica de como corrigir. Tabela completa em [Erros](09-erros.md).

## Sessão

### `holdprint login`

```bash
holdprint login [--no-open] [--scope "<escopos>"]
```

Entra pelo Hold Identity com **código de dispositivo**: a CLI imprime o código e o link, você aprova no navegador já logado no Holdprint. No macOS o navegador abre sozinho (`--no-open` só imprime; `--open` força abrir em outros sistemas). `--scope` pede só parte das permissões.

```text
Código de confirmação: ABCD-1234
Aprove em: {APP_URL}/identity/device?code=ABCD-1234
Aguardando a aprovação no navegador...
Login feito como voce@grafica.com.br (conta 1234). A sessão renova sozinha.
```

- O acesso dura 1 hora e é renovado sozinho por até 30 dias.
- A credencial fica no Keychain do macOS. Sem Keychain, fica em `~/.holdprint/credentials.json` com permissão só do dono (a CLI avisa). Nunca vai para o `config.json`.
- O código vale por alguns minutos: se expirar, `O código expirou antes da aprovação. Rode holdprint login de novo.`

### `holdprint logout`

Revoga o acesso no Hold Identity e apaga a credencial local. Saída: `Logout feito: acesso revogado e credencial apagada.`

### `holdprint whoami`

```text
Usuário: voce@grafica.com.br
Conta: 1234
Perfil: Administrador
Escopos: budgets:read, customers:read, ..., erp:read, actions:run, plugins:publish
Sessão: Hold Identity (renova sozinha), acesso válido até 2026-11-13T15:00:00.000Z
```

Sem login, imprime o caminho: `holdprint login` se você já tem conta, ou criar uma conta de teste grátis em `{APP_URL}/holdai/register`, ou desenhar sem conta com `holdprint dev`.

Os escopos da sessão da CLI são os do catálogo que o seu perfil pode usar, mais:
- `erp:read`: ler dados da conta (`holdprint api`, `holdprint query`);
- `actions:run`: escrever na conta (`holdprint actions run`, escritas do `/v1`);
- `plugins:publish`: publicar e gerir plugins. **Só Administrador** recebe este escopo; sem ele, os comandos `holdprint plugin deploy/release/list/...` são recusados.

### Configuração

| Variável | Para quê |
|---|---|
| `HOLDPRINT_API_BASE` | Endereço da API (`{BASE_URL}`). Também por `holdprint login --api-base <url>`. |
| `HOLDPRINT_APP_BASE` | Endereço do Holdprint no navegador (`{APP_URL}`). Também por `holdprint login --app-base <url>`. |
| `HOLDPRINT_MCP_URL` | Endereço do MCP usado por `holdprint tools` (ou `--mcp-url`). |
| `HOLDPRINT_HOME` | Pasta de configuração (padrão `~/.holdprint`). Útil para ter duas sessões separadas. |

## Criar e testar

### `holdprint plugin create`

```bash
holdprint plugin create <pasta> [--name "Nome do plugin"] [--template painel|acao|automacao]
```

| Template | O que gera |
|---|---|
| `painel` (padrão) | Página no menu Plugins lendo orçamentos. |
| `acao` | Uma ação no orçamento que abre um modal. |
| `automacao` | Tela + `functions/index.ts` com uma agenda de exemplo e `.gitignore` que já ignora segredos locais. |

A pasta precisa estar vazia ou não existir. Saída: `Plugin "Nome" (slug nome) criado em /caminho` e a lista de arquivos (`holdprint.plugin.json`, `public/index.html`, `public/app.js`, `public/style.css`, `CLAUDE.md` com as regras para a IA).

**Slug único.** O `slug` do manifesto identifica o plugin na sua conta. Repetir o slug de outro plugin publica uma versão **dentro do plugin existente**. Antes do primeiro deploy, confira `holdprint plugin list` e use um slug novo (ex.: `follow-up-7-dias-k3x9`). Se o primeiro deploy de um plugin novo sair com versão diferente de `v1`, o slug colidiu.

### `holdprint plugin validate`

```bash
holdprint plugin validate [pasta]
```

Confere o manifesto contra o schema e as regras da plataforma (alvos, escopos exigidos, limites, `listing`). Saída `ok: <slug> (N escopo(s))` ou `manifesto inválido em <pasta>:` com uma linha por problema, em português.

### `holdprint dev` (simulador, sem login)

```bash
holdprint dev [pasta] [--port 4790] [--reset] [--open|--no-open]
```

Abre o plugin numa moldura que imita o Holdprint, com a **Gráfica Exemplo**: dados fictícios (vendedores, cerca de 300 orçamentos, funil de 5 etapas, tarefas, jobs, contas a pagar e a receber). Não precisa de login, não usa rede e não toca em conta nenhuma.

- Menu por grupos com as suas páginas, Visão Geral com os seus cards, telas fictícias de orçamento, cliente (com as abas), ordem de produção, conta a pagar e a receber com os botões das suas ações, listas com caixas de seleção para as ações em lote, e o botão **Novo registro**.
- Modal emulado: `hold.modal.confirm`/`cancel` mostram o toast do resultado.
- Funções rodam localmente; a moldura tem **Executar agenda <id>**. Segredos locais em `.holdprint/dev-secrets.json` (nunca versionar).
- A tela recarrega sozinha ao salvar. Escritas ficam em `.holdprint/sim-state.json`; `--reset` volta ao início.
- `--no-open` é aceito e só imprime o endereço, sem abrir o navegador (é o que a IA usa).
- É um servidor que não termina sozinho: encerre com Ctrl+C.

```text
Simulador do plugin "vendas-por-vendedor" no ar, com dados fictícios da Gráfica Exemplo (sem login e sem rede).
Abra <endereço do simulador na sua máquina>
```

### `holdprint plugin dev --account` (modo desenvolvedor, dados reais)

```bash
holdprint plugin dev --account [pasta] [--port 5199] [--no-open] [--allow-writes]
```

Serve a pasta local **dentro do Holdprint real** da sua conta, sem publicar versão. Exige login de Administrador e o plugin já publicado (`deploy`) e aprovado.

- Só **leitura** e só **na janela que ele abre**: outras abas, outras pessoas e o celular continuam vendo a versão publicada. A janela mostra a faixa "Modo desenvolvedor · ... · só leitura · só nesta janela · [Sair]".
- `--allow-writes` libera escrita (até 100 por sessão), registradas como "via plugin <nome> em desenvolvimento, por <você>". Sem a flag, escrita responde `403 HOLD_PLUGIN_PLATFORM_51`.
- O link é de uso único e só seu (outra pessoa recebe `403 HOLD_PLUGIN_PLATFORM_52`).
- Ctrl+C encerra; a janela volta sozinha para a versão publicada. Os outros administradores recebem um e-mail avisando (no máximo um por dia).
- `--port` só vale junto com `--account`. Use Chrome, Edge ou Firefox (Safari não é suportado). Não use túnel: o modo desenvolvedor só aceita origem `localhost`.

### `holdprint plugin dev` (sem `--account`)

Observa `public/`, `functions/` e o manifesto e **publica e libera uma versão nova a cada salvamento**. Num plugin que a equipe já usa, prefira `--account` ou o simulador.

## Publicar e versionar

### `holdprint plugin deploy`

```bash
holdprint plugin deploy [pasta] [--release] [--open]
```

Valida, publica uma versão nova (v1, v2, v3...) e instala na sua conta.

- **Primeira vez (ou permissão nova):** o plugin fica aguardando aprovação de um Administrador.
  ```text
  Publicado v1 (plugin p-abc123defg).
  Publicado e liberado v1

  ==> Aguardando aprovação de um Administrador: {APP_URL}/plugins/consent/<installationId>
  ```
- **Da segunda versão em diante:** sai como **prévia** (só administradores veem; a equipe continua na versão liberada).
  ```text
  Publicado v3 (plugin p-abc123defg).
  Prévia: {APP_URL}/plugins/<installationId>?versao=v3
  Só administradores abrem a prévia. Para liberar à equipe: holdprint plugin release v3
  ```
- `--release` publica e libera na hora. `--open` abre o link no navegador.
- Sem mudança no código: `Sem mudanças: v3 continua no ar (já liberada).`
- Versões são imutáveis: para corrigir, publique outra.

### `holdprint plugin release` e `rollback`

```bash
holdprint plugin release [vN] [pasta]     # sem vN: libera a mais nova
holdprint plugin rollback [vN] [pasta]    # sem vN: volta à liberada anterior
```

Saída: `... Versão atual: v3. Versão anterior: v2.` e `O quadro já aberto só muda ao reabrir o plugin.` A hospedagem pode levar cerca de 60 s para refletir.

### `holdprint plugin list`

Lista as instalações da conta: id da instalação, id do plugin, nome, situação (`ativo`, `desligado`, `aguardando consentimento`, `pede novas permissões`, `bloqueado pela Hold: <motivo>`), escopos concedidos e a coluna `publicação` (Marketplace).

### `holdprint plugin disable`

```bash
holdprint plugin disable [id|pasta]            # desliga
holdprint plugin disable [id|pasta] --enable   # religa
```

Plugin desligado não abre, não mostra botões e não roda agendas.

## Compartilhar e publicar para outras gráficas

### `holdprint plugin publish --unlisted`

```bash
holdprint plugin publish --unlisted [pasta] [--max-accounts 10] [--expires 30d]
```

Gera um link para Administradores de **outras contas** instalarem o plugin. `--max-accounts` de 1 a 10 (padrão 10); `--expires` de `1d` a `90d` (padrão `30d`). O link aparece **uma única vez** e não fica salvo:

```text
Link de instalação criado. Ele aparece só desta vez e não fica salvo em arquivo nenhum:

  {APP_URL}/plugins/install/<pluginId>.<token>

Teto: 10 conta(s). Vale até 13/12/2026.
Quem abre o link e instala precisa ser Administrador da outra conta, e o consentimento é dele.
```

O plugin não pode declarar `secrets`.

### `holdprint plugin links`

```bash
holdprint plugin links [pasta]                    # lista links e contas que instalaram (nunca o endereço)
holdprint plugin links [pasta] --revoke <linkId>  # revoga; quem já instalou continua
```

### `holdprint plugin submit` e `submission`

```bash
holdprint plugin submit [pasta|id] [--note "o que o plugin faz"]   # pede publicação no Marketplace
holdprint plugin submit [pasta|id] --withdraw                       # retira o pedido ou o plugin do Marketplace
holdprint plugin submission [pasta|id]                              # andamento
```

Exige `listing` no manifesto, nenhum `secrets`, uma versão liberada e login de Administrador. `--note` até 500 caracteres.

```text
Pedido de publicação enviado (v3). A Hold vai analisar; acompanhe com holdprint plugin submission.
Status: Em análise pela Hold | No Marketplace | Recusado: <motivo> | Sem pedido
```

Detalhes em [Publicação](08-publicacao.md).

## Funções, agendas, segredos e eventos

### `holdprint plugin secrets`

```bash
holdprint plugin secrets set NOME [--from-env VARIAVEL | --stdin]
holdprint plugin secrets list
holdprint plugin secrets delete NOME
```

`set` pede o valor **sem eco** no terminal; o valor nunca vai como argumento. Só nomes declarados em `secrets` do manifesto. `list` mostra nomes e situação (nunca valores). Também pela tela **Plugins > ⋯ > Segredos**.

### `holdprint plugin run`

```bash
holdprint plugin run <agenda>
```

Executa a agenda agora ("Executar agora"). Saída: `Agenda <id> enviada para execução. deliveryId: <id>` e `Acompanhe com: holdprint plugin logs --follow`. Só Administrador.

### `holdprint plugin logs`

```bash
holdprint plugin logs [--follow] [--since 10m] [--trigger schedule]
```

Registros das funções dos últimos 7 dias (`console.log` da função e uma linha de resumo por chamada). `--since` aceita `30s`, `10m`, `2h`, `7d`. `--trigger` filtra (`schedule`, `event`, `hook`, `manual`, `screen`). Na hospedagem, os registros podem levar até ~60 s para aparecer.

`run`, `logs` e `secrets` aceitam `--installation <id>` ou `--dir <pasta>`.

### `holdprint plugin trigger`

```bash
holdprint plugin trigger <tipo> [--entity <id>] [--installation <id> | --dir <pasta>]
```

Gera um evento de **teste** (`test: true`) só para a instalação deste plugin: a função e o webhook dela recebem; nada vai ao feed de outras instalações. Ex.: `holdprint plugin trigger budget.won --entity <id do orçamento>`.

### `holdprint plugin listen`

```bash
holdprint plugin listen [id|pasta] [--types budget.won,task.created] [--forward-to <url>]
```

Mostra os eventos da conta ao vivo (só Administrador). Com `--forward-to`, entrega cada evento assinado (Standard Webhooks) ao seu receptor, com um segredo efêmero impresso no início. Ctrl+C encerra.

### `holdprint plugin webhook-secret`

```bash
holdprint plugin webhook-secret [id|pasta] [--rotate]
```

Mostra o segredo do webhook **uma única vez**; `--rotate` gera outro (o anterior deixa de valer).

## Operar a conta pelo terminal

Estes comandos rodam **como o seu usuário**: o que o seu perfil não vê no Holdprint, a CLI também não vê. O Administrador pode desligar o acesso por CLI e MCP da conta inteira (aí todos respondem 403).

### `holdprint api`

```bash
holdprint api <GET|HEAD|POST|PUT|DELETE> </v1/...> [--data @arquivo.json|-] [--fields a,b] [--paginate] [--max-pages N] [--idempotency-key CHAVE]
holdprint api --list
```

- Chama a API [/v1](06-api-v1.md). `GET`/`HEAD` também leem rotas `/api/...` do Holdprint (exceto internas e de chave de API); escrita fora do `/v1` só por `holdprint actions run`.
- Escrita leva `Idempotency-Key` estável, calculada do conteúdo (ou a de `--idempotency-key`): repetir não duplica.
- `--fields` corta a resposta; `--paginate` segue as páginas (combine com `--max-pages`).
- `--list` lista as rotas `/v1` (OpenAPI).
- `storage` e `events` do `/v1` exigem uma instalação de plugin e não funcionam pela CLI.

```bash
holdprint api GET /v1/budgets --fields id,code,customerName
holdprint api POST /v1/tasks --data @tarefa.json --idempotency-key tarefa-visita-acme-2026-11-13
```

### `holdprint query`

```bash
holdprint query <recurso> [--where campo=valor ...] [--fields a,b] [--sort -campo] [--limit N] [--paginate] [--max-pages N] [--updated-since <data ISO>]
holdprint query --list
```

Consulta genérica sobre `POST /v1/<recurso>/query`. `--where campo=valor` (igual), `campo=a,b` (um de), `campo>=valor` e `campo<=valor`; repetir combina com E. Só filtra campo indexado (erro 94 lista os permitidos). `--limit` é o tamanho da página (até 100); `--paginate` segue o cursor até `--max-pages` (padrão 10). Saída paginada com `nextCursor` diferente de `null` = lista cortada. Recursos, campos e filtros em [API /v1](06-api-v1.md#consulta-generica).

```bash
holdprint query budgets --where state=Open --where creationTime>=2026-11-01 --fields id,code,customer,businessValue --sort -creationTime --limit 20
holdprint query jobs --where deleted=false --where isFinalized=false --where deliveryNeeded<=2026-11-20 --sort deliveryNeeded
```

### `holdprint actions`

```bash
holdprint actions list [--search texto] [--risk low|medium|high]
holdprint actions describe <ação>
holdprint actions run <ação> [--param nome=valor] [--data @corpo.json|-] [--dry-run] [--no-wait] [--interval 3] [--timeout 1800]
```

Escritas na conta (cadastrar cliente, ganhar orçamento, lançar e baixar conta, movimentar estoque...). Veja [API /v1 > Ações de escrita](06-api-v1.md#acoes-de-escrita).

- `list` mostra chave, verbo, rota, risco, se tem prévia, idempotência e permissão.
- `describe` traz o schema do corpo. Monte o corpo a partir dele.
- `--dry-run` imprime método, caminho final, corpo, risco, impacto e a `Idempotency-Key` **sem enviar**. Use antes de escrita de dinheiro, nota fiscal ou mensagem externa.
- `run` executa direto. Só uma rota marcada para aprovação imprime `Link de aprovação: {APP_URL}/aprovacoes/<id>` e espera um Administrador aprovar (consulta a cada `--interval` s, até `--timeout` s). `--no-wait` imprime o link e sai com código 2.

### `holdprint tools`

```bash
holdprint tools list [--json]
holdprint tools describe <nome> [--json]
holdprint tools run <nome> [--json '{...}' | --data @arquivo.json|- | --campo valor ...] [--out arquivo]
```

Roda as ferramentas do MCP do Holdprint (relatórios prontos, checkup, ponto de equilíbrio, importadores, adicionar item calculado ao orçamento, catálogo de entidades) com o mesmo login. `--out` grava a saída para ler com `jq`. Campos aninhados: `--filtro.estado Open`.

### `holdprint files upload`

```bash
holdprint files upload <arquivo> [--content-type tipo/subtipo]
```

Envia um arquivo para a conta e imprime `{"id": "..."}`. Reenviar o mesmo arquivo não duplica. Use o id numa ação (ex.: anexar ao orçamento).

## Erros comuns da CLI

| Mensagem | O que fazer |
|---|---|
| `Você ainda não fez login...` | `holdprint login` (ou criar conta de teste em `{APP_URL}/holdai/register`). |
| `Sua sessão da CLI expirou. Rode holdprint login.` / `401` | `holdprint login` de novo. Acontece se a sessão passou de 30 dias ou foi desconectada em Acessos conectados. |
| `O acesso foi negado no navegador...` | Alguém clicou em Negar. Rode `holdprint login` de novo. |
| `manifesto inválido em <pasta>` | Corrija os itens listados; `holdprint plugin validate` repete a checagem. |
| `Não achei .holdprint/deploy.json...` | Rode o comando dentro da pasta do plugin já publicado, ou passe o id. |
| `--allow-writes só vale com --account` / `--port só vale com --account` | Use junto com `holdprint plugin dev --account`. |
| `A porta 4790 já está em uso` | `--port <outra>` (1024 a 65535). |
| `403` com `plugins:publish` faltando | Só Administrador publica. Entre com o login de um Administrador. |
| `403` em todos os comandos de dados | O Administrador desligou o acesso por CLI e MCP na tela Plugins. |
| `erro: ... HOLD_PLUGIN_PLATFORM_<n>` | Veja o código em [Erros](09-erros.md). A CLI já imprime a dica. |
