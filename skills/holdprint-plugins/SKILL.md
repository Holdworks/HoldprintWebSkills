---
name: holdprint-plugins
description: Use quando o usuário pedir para criar, alterar, publicar ou depurar um plugin do Holdprint — "cria um plugin", "plugin do Holdprint", "extensão do Holdprint", "faz uma telinha dentro do Holdprint", "painel customizado no Holdprint", "publica o plugin". Ensina o fluxo da CLI `holdprint plugin create/dev/deploy`, o SDK (`Holdprint.connect()`), o manifesto `holdprint.plugin.json`, o catálogo de escopos, a API /v1, ações no orçamento e em Novo registro com modal (`contributes.actions`) e, para automação sem tela aberta, funções, agendas, segredos e hooks (`holdprint plugin secrets/run/logs`) e, para mostrar o plugin a outras contas, vitrine (`listing`), Marketplace e link (`publish --unlisted`, `plugin links`) e, para todas as gráficas, o pedido de publicação à Hold (`plugin submit`, `plugin submission`).
---

# Plugins do Holdprint

## Começo da conversa

Faça isto **antes de qualquer outra coisa**, sem perguntar nada técnico. O usuário pode não ser programador: fale simples, sem jargão.

1. Rode `holdprint whoami`.
   - **Logado:** siga direto para o pedido.
   - **Sem login:** pergunte **uma vez só**: "Você já tem conta no Holdprint?" e **pare para esperar a resposta**. Não crie
     projeto, não abra simulador e não escreva código antes de ela responder.
     - **Tem:** rode **você mesmo** `holdprint login` (nunca peça para a pessoa digitar comando). Ele abre o navegador e fica
       esperando a aprovação: rode com tempo limite de 10 minutos (ou em segundo plano) e, enquanto espera, diga em uma frase:
       "Abri uma página no seu navegador: confira se o código é XXXX-XXXX e clique em Aprovar." Depois de aprovado, construa
       direto na conta dela (sem passar pelo simulador).
     - **Não tem:** comece já, sem esperar: desenhe e teste o plugin no simulador (`holdprint dev`, com dados de exemplo, sem conta e sem rede).
       Quando ele quiser usar de verdade ou publicar, explique em uma frase: "Para colocar no seu Holdprint ou publicar, você precisa de uma conta de
       teste grátis." e mande abrir **`<endereço do Holdprint>/holdai/register`** (no ambiente local: http://localhost:8003/holdai/register), criar a conta,
       ativar pelo e-mail que chega e voltar avisando. Depois rode você mesmo `holdprint login`, como no caso acima. Não crie a conta por ele, não peça senha e não tente contornar o login.
2. **Quando o plugin estiver pronto** (e só então), ofereça uma vez: "Quer publicar para todas as gráficas?" e siga o passo 7 do Fluxo. Se ele disser que
   não, ou não responder, não insista e não publique.

Quando a CLI recusar por falta de login, ela mesma imprime esse caminho (login ou conta de teste): leia a mensagem ao usuário em palavras simples.

## O que é um plugin

Uma tela extra dentro do Holdprint, feita de **HTML + JS estático** (sem build obrigatório), que roda num iframe e
conversa com os dados da conta pelo SDK. Aparece no menu **Plugins** do Holdprint depois do deploy **e** da aprovação
de um Administrador. Só o **Administrador** instala, aprova, escolhe os perfis e desinstala; quem tem **Plugins: Gerenciar**
também liga e desliga; os perfis liberados na instalação abrem o plugin.

Quando a tela sozinha não basta (rotina que roda de madrugada, integração com serviço externo, segredo que não pode ir ao
navegador), o plugin também pode ter **funções**: código que roda na hospedagem da Hold, com agenda, aviso do Holdprint, hook de
terceiro ou "Executar agora". Veja a seção "Funções, agenda e segredos" e `functions-reference.md`.

## Teste e modo desenvolvedor pela CLI

- **Evento de teste:** `holdprint plugin trigger <tipo> [--entity <id>]` na pasta do plugin (ou `--installation <id>`), ex.:
  `holdprint plugin trigger budget.won --entity <id do orçamento>`. Sai marcado `test:true` e só a instalação deste plugin na
  conta recebe (função e webhook dela; aparece em Registros com gatilho evento). Nada vai ao feed de outra instalação. A CLI
  imprime `Evento de teste budget.won enviado para a instalacao <id> ... eventId: <id>`. Tipo desconhecido = erro 400.
- **Gravar no modo desenvolvedor:** `holdprint plugin dev --account --allow-writes`. Sem a flag, o modo dev só lê (escrita = 403
  51). Com ela, até **100 escritas por sessão** (a 101ª é recusada com 51), gravadas como "via plugin <nome> em desenvolvimento,
  por <usuário>". `--allow-writes` sem `--account` é recusado.
- Operar a conta pelo terminal (consultar, cadastrar, dar baixa) é outra skill: `holdprint-cli`.

## Quando acionar

Pedidos como "cria um plugin que mostra...", "altera o plugin de vendas", "publica o plugin", "o plugin deu erro 403".
Se o pedido é só ler dados do ERP sem criar tela, use `holdprint-mcp` ou `holdprint-mongo`, não esta skill.

## Fluxo

1. **Entrar (uma vez):** `holdprint login` (no macOS abre o navegador; `--no-open` só imprime). A CLI usa o **device code**: imprime
   `Codigo de confirmacao: XXXX-XXXX` e `Aprove em: <Holdprint>/identity/device?code=...`; o usuário abre no navegador já logado no
   Holdprint (o código vem preenchido), confere "Holdprint CLI", a conta e as permissões e clica em **Aprovar**. A CLI responde
   `Login feito como <e-mail> (conta <n>). A sessao renova sozinha.` O acesso é renovado sozinho (1 h, com refresh de 30 dias) e a
   credencial fica no **Keychain** do macOS, nunca em `config.json`. `holdprint logout` revoga a concessão; o usuário também revoga em
   **Plugins > Acessos conectados**. Nunca peça a senha do usuário, nunca leia nem copie o token da CLI e não tente logar por conta própria.
2. **Criar:** `holdprint plugin create <pasta> [--name "Nome"]` gera o projeto (manifesto, `public/`, `CLAUDE.md` do
   template). A pasta precisa estar vazia ou não existir. Depois: `holdprint plugin validate [pasta]`.
   Para automação (agenda, função, segredo): `holdprint plugin create <pasta> --template automacao`.
   **Plugin novo = `slug` novo e único.** O `slug` do manifesto identifica o plugin na conta: repetir o slug de outro
   plugin (inclusive o de um exemplo, como `follow-up-automatico`) publica uma versão **nova dentro do plugin dos outros**.
   Antes do primeiro deploy: rode `holdprint plugin list` e confira os nomes e pluginIds que já existem; sem
   `.holdprint/deploy.json` na pasta, o plugin é novo, então use um slug derivado do nome + sufixo curto aleatório
   (ex.: `follow-up-7-dias-k3x9`) e um `name` que não repita nenhum da lista. Nunca reaproveite slug de outro plugin. Se o
   primeiro deploy de um plugin novo imprimir versão diferente de `v1`, o slug colidiu: pare, troque o slug e avise o usuário.
3. **Editar `public/`:** `index.html`, `app.js`, `style.css`. O SDK vem de `<script src="/_hold/sdk/v1.js"></script>`.
   ```js
   const hold = await Holdprint.connect();
   const res = await hold.api.get('/budgets?state=open&pageSize=25&page=1');
   const orcamentos = res.data; // lista paginada: { data, totalCount, page, pageSize, totalPages, hasNextPage }
   ```
4. **Publicar:** `holdprint plugin deploy [pasta] [--open]` (publica e instala na conta) ou `holdprint plugin dev [pasta]`,
   que republica a cada salvamento em `public/`, `functions/` e no manifesto.
   **Terminou de criar o plugin que o usuário pediu: publique sem perguntar.** Não pare com "Publico?": rode
   `holdprint plugin deploy` e, se o plugin tem agenda, `holdprint plugin run <agenda>` (depois do consentimento) e mostre o
   resultado de `holdprint plugin logs`. Publicar só instala na conta do próprio usuário e fica aguardando a aprovação de um
   Administrador; nada chega à equipe sem ela. Só pergunte antes se o usuário pediu explicitamente para não publicar.
5. **Consentimento:** no primeiro deploy o plugin fica **aguardando consentimento** e não aparece para ninguém (nem no
   menu, nem para o Administrador). A CLI termina com
   `==> Aguardando aprovação de um Administrador: <endereço>/plugins/consent/<installationId>`.
   **Mostre esse link ao usuário, com as suas palavras, e peça que um Administrador abra e aprove.** Na tela ele confere
   os escopos com os propósitos, marca quais perfis podem usar (Administrador sempre pode), digita a senha de novo e
   clica em **Aprovar e instalar**. O plugin abre na hora e aparece no menu **Plugins**; os administradores recebem um
   e-mail. Não tente contornar, não ative por API e só diga que está pronto depois que ele confirmar a aprovação.
   **O fluxo para aqui quando o plugin é novo (ou pede permissão nova).** Termine dizendo ao usuário, em uma lista curta, **exatamente o que
   vai aprovar** (cada escopo com o propósito, agenda e frequência, domínios, hooks, perfis a marcar) e **o que você vai rodar depois** da
   aprovação (ex.: `holdprint plugin run follow-up` e `holdprint plugin logs`). Quando ele disser que aprovou, retome a sessão rodando esses
   comandos e mostre o resultado; não rode `plugin run` antes: a instalação ainda está aguardando a aprovação.
6. **Conferir:** depois de aprovado, os próximos deploys sem mudança de escopo imprimem `Abra: <endereço>/plugins/<installationId>`
   (sem `#`). `holdprint plugin list` mostra o estado: `ativo`, `desligado`, `aguardando consentimento` ou
   `pede novas permissões`. Siga o checklist abaixo.
7. **Publicar para todas as gráficas (pedido de publicação).** Isto é **diferente** de instalar na própria conta e do link (`publish --unlisted`):
   aqui a **Hold analisa** e, se aprovar, o plugin aparece no Marketplace de **todas** as contas, na seção **Da comunidade**.
   **Só faça quando o usuário pedir** ("manda para aprovação", "quero publicar para todo mundo", "coloca no Marketplace"). Nunca por conta própria.
   Pré-requisitos (confira antes e corrija o que faltar):
   - bloco `listing` no manifesto (resumo e categoria, em português; veja a seção Vitrine);
   - **nenhum `secrets`** no manifesto (plugin com segredo não vai para outras contas);
   - uma **versão liberada**: `holdprint plugin release` (ou `holdprint plugin deploy --release`);
   - quem pede é **Administrador** da conta (`holdprint whoami` mostra o perfil).
   Comando: `holdprint plugin submit [pasta|id] --note "o que o plugin faz, em uma frase"`. A CLI responde
   `Pedido de publicação enviado (vN). A Hold vai analisar; acompanhe com holdprint plugin submission.`
   O que dizer ao usuário: "Mandei para a Hold analisar. Quando ela aprovar, o plugin aparece para todas as gráficas. Você acompanha comigo pedindo
   'como está o pedido'." Para acompanhar rode `holdprint plugin submission`: `Em análise pela Hold`, `No Marketplace` ou `Recusado: <motivo>`
   (também aparece na coluna `publicacao` de `holdprint plugin list` e como selo na tela Plugins).
   **Recusado:** mostre o motivo com as palavras da Hold, corrija o que ele pede (resumo, segredo, versão), libere a versão nova e peça de novo com `plugin submit`.
   Para tirar do Marketplace: `holdprint plugin submit --withdraw` (quem já instalou continua com o plugin). Não tente contornar bloqueio da Hold.

**Mudou escopo:** um novo `deploy` com escopos diferentes pede **novo consentimento** (só o texto do propósito não pede).
A CLI imprime de novo o link `/plugins/consent/<id>` (mesmo que diga `Sem mudancas` para o código) e a tela Plugins
mostra "Pede novas permissões", com o escopo novo marcado como **Novo** na aprovação. Enquanto um Administrador não
aprovar, o plugin segue funcionando com os escopos antigos e a rota do escopo novo responde
`403 HOLD_PLUGIN_PLATFORM_9` (`fields` traz o escopo). Mostre o link ao usuário e peça a aprovação; depois dela o escopo
novo vale na próxima renovação do token, sem recarregar.

**Quem usa:** o Administrador sempre pode. Os outros perfis só depois que um Administrador os marcar na aprovação (ou no
menu "..." > **Perfis** da tela `/plugins`) e se o perfil tiver **Plugins: Usar** ligado em Ajustes > Perfis.

**O plugin vê o que o usuário logado vê:** o token carrega as permissões e o perfil de quem abriu a tela.
- Escopo sem a permissão de tela equivalente nem entra no token: `budgets:read`, `funnels:read`, `tasks:*` exigem o
  painel de Negociações; `customers:read` exige a tela de Clientes. Quem não tem recebe `403 HOLD_PLUGIN_PLATFORM_9`.
- Um Vendedor sem "ver negociações de outros vendedores" só recebe os orçamentos dele em `/budgets` (um `sellerId` de outro
  devolve `data: []`) e só as tarefas desses orçamentos; `POST /tasks` em orçamento de outro dá `404 HOLD_PLUGIN_PLATFORM_30`.
  `/customers` respeita a carteira de clientes do perfil.
- Lista vazia ou menor para um Vendedor é correto. Desenhe um estado vazio claro ("Nenhum registro disponível para o seu
  perfil") e não trate lista vazia como falha do plugin.

Outros comandos: `holdprint plugin list` (id da instalação, pluginId, nome, ativo/desligado, escopos) e
`holdprint plugin disable [id|pasta]`; `holdprint plugin disable [id|pasta] --enable` religa. `[id]` é o id da instalação
(24 hex) ou o pluginId (`p-` + 10 caracteres). Instalar/desinstalar/desligar também se faz na tela `/plugins` do Holdprint.

## Sincronização, mover etapa e cotas

> Contrato máquina-legível: `GET /anonymous-api/plugin-platform/openapi/v1.json` (rotas e escopos reais, `x-hold-scopes`).

- **Abrir o plugin não é baixar tudo.** Use `hold.sync.pull("budgets")` (também `"customers"` e `"tasks"`): na primeira vez
  traz tudo; nas seguintes só o que mudou desde a última sincronização (o SDK guarda o `syncToken` em `hold.storage`, coleção
  `hold-sync`, chave `<recurso>:<id do usuário>`: cada usuário tem o seu token). Devolve `{ changed, deleted, syncToken }` já sem duplicados. Mantenha o espelho
  **em memória** (um `Map` na tela): ao abrir, `hold.sync.pull("budgets", { full: true })`; depois, a cada evento, `hold.sync.pull("budgets")` (só o que mudou)
  e aplique `changed` (por `id`) e `deleted` (remover). Não releia a lista inteira a cada evento.
- **Nunca grave dado do ERP (orçamentos, clientes, tarefas, valores) em `hold.storage`.** Ele é **compartilhado entre todos os usuários da conta**: uma cópia
  feita quando o Administrador abriu a tela ficaria legível para um Vendedor que não pode ver aqueles orçamentos. `hold.storage` é para dado do próprio plugin
  (preferências, anotações, progresso de agenda).
- **Lista grande ou sob demanda:** `for await (const b of hold.api.list("/budgets", { state: "open" })) { ... }` segue o
  `nextCursor` sozinho (até 100 por página). Com `updated_since`, os excluídos voltam com `deleted: true`.
- **Mover etapa do orçamento:** `PUT /budgets/{id}/step` com `{ stepId }` e `Idempotency-Key`. Exige o escopo **novo e estreito**
  `budgets:move-step` (declare com `purpose`, ex.: "Avançar o orçamento de etapa no funil"). Acrescentar esse escopo ao manifesto
  e fazer `deploy` **dispara novo consentimento**: mostre o link `/plugins/consent/<id>` ao usuário e espere a aprovação; até lá
  o plugin segue com os escopos antigos e a rota responde `403 PLUGIN_SCOPE_REQUIRED`.
- **Cotas:** 10 mil chamadas por dia e 300 por minuto, por instalação. Acima disso a API responde `429` com `Retry-After`
  (`HOLD_PLUGIN_PLATFORM_39` diária, `_40` por minuto); o SDK repete uma vez respeitando o `Retry-After`. Sincronize de forma
  incremental e não chame a API em laço. O administrador vê o consumo em Plugins > "Chamadas e cotas".
- **OpenAPI:** `/anonymous-api/plugin-platform/openapi/v1.json` (sem token); cada operação traz `x-hold-scopes`.

## Eventos: reagir ao que acontece

- **Regra de ouro: `events.subscribe` + `sync.pull`.** O evento só avisa que algo mudou (traz identificadores, nunca o dado). Ao
  receber, chame `hold.sync.pull("budgets")` (só o recurso afetado) e redesenhe. **Nunca** releia a lista inteira a cada evento.
  ```js
  const stop = hold.events.subscribe(["budget.won", "budget.step_changed"], async () => {
    await hold.sync.pull("budgets"); render();
  }, { onResync: () => hold.sync.pull("budgets", { full: true }) });
  ```
- **Entrega "ao menos uma vez, sem ordem".** O mesmo evento pode chegar duas vezes e fora de sequência: deduplique por `data.id`
  (o SDK já tira duplicados do `subscribe`; no webhook é com você) e trate o evento como gatilho, não como fonte de verdade.
  Se o processo da Hold cair entre gravar e avisar, o evento se perde: por isso a reconciliação é sempre por `sync.pull`.
- **Eventos v1 e o escopo que cada um exige** (sem o escopo no manifesto, o deploy é recusado; sem a permissão de tela do
  usuário, o evento não chega a ele): `budget.won` e `budget.step_changed` pedem `budgets:read`; `task.created` e
  `task.completed` pedem `tasks:read`; `customer.created` pede `customers:read`. Declare em `events.subscribe` do manifesto.
- **Webhook só para quem tem backend próprio.** Plugin de tela usa `events.subscribe`. Só declare `events.webhook.url` se existe um
  servidor seu para receber (https público, sem IP e sem endereço da Hold). **Sempre confira a assinatura** (Standard Webhooks:
  cabeçalhos `webhook-id`, `webhook-timestamp`, `webhook-signature: v1,<HMAC-SHA256>` com o segredo `whsec_...`), recuse
  timestamp velho e deduplique por `webhook-id`. Trocar o **host** do webhook pede novo consentimento; mudar só os tipos não.
- **Testar sem esperar:** `holdprint plugin listen [--types budget.won,...]` mostra os eventos da conta em tempo real;
  `--forward-to http://localhost:9000/hook` entrega assinado ao seu receptor local (a CLI imprime um segredo efêmero no começo).
  `holdprint plugin webhook-secret [--rotate]` mostra o segredo uma vez. No simulador (`holdprint dev`) as escritas também emitem eventos.
  Para conferir assinaturas na sua máquina: `node scripts/webhook-receiver.mjs --secret whsec_...` (do repositório holdprint-plugins);
  `http://localhost` como `webhook.url` só vale na stack local, em produção é `https` público.
- **Custo:** o feed do `subscribe` não gasta a cota diária de 10 mil (conta só no limite de 300 por minuto) e pausa com a aba escondida;
  um `subscribe` por tela basta. O Vendedor só recebe eventos dos orçamentos dele (a mesma visibilidade da tela).
- **Erros:** `53` cursor de eventos inválido (400, recomece com `cursor=now`); `54` cursor mais velho que 30 dias (410, o SDK
  emite `resync`: releia por `sync.pull`); `55` URL de webhook inválida (400); `56` tipo de evento desconhecido (400). Veja
  `api-v1-reference.md`.

## Funções, agenda e segredos

Detalhes, manifesto e exemplos em `functions-reference.md`. O essencial:

- **Quando usar:** só se a tela não resolve. Rotina automática, integração com serviço externo, segredo, receber chamada de fora.
  Plugin que só mostra dados não ganha `functions/`.
- **Criar:** `holdprint plugin create <pasta> --template automacao`; importe `createHold` de `@holdprint/functions` (a CLI resolve, sem `npm install`).
- **API do Holdprint na função: sempre `hold.api`** (`hold.api.get("/budgets", {...})`), nunca `fetch` para o endereço do Holdprint nem token na mão.
  Chamada da tela usa o usuário; agenda, evento, hook e "Executar agora" rodam como a **instalação**, com os escopos consentidos sobre a conta toda.
- **Segredos: o Claude NUNCA pede o valor no chat.** Declare só o **nome** em `secrets` do manifesto e peça ao usuário (Administrador) que grave o
  valor pela tela **Plugins > ⋯ > Segredos** ou rodando ele mesmo `! holdprint plugin secrets set NOME` (a CLI pede sem eco; o valor nunca vai
  como argumento). Se o usuário colar um valor no chat, não o repita, não o grave em arquivo e oriente a usar um dos dois caminhos. Nunca imprima segredo em `console.log`.
- **Declarar domínio, agenda ou hook pede consentimento de novo.** Depois do `deploy`, mostre o link `/plugins/consent/<id>` e espere a aprovação
  de um Administrador (a tela mostra "Hospedado pela Hold (Cloudflare)", "Roda sozinho: …", "Fala com: …", "Recebe chamadas de: …").
  `network.domains` só aceita nome de site público; chamada a domínio não declarado dá 403.
- **Escrita idempotente** com `idempotencyKey` derivada do fato (`follow-up-${orcamento.id}-${hold.isoWeek()}`): a mesma execução pode repetir;
  a chave é por plugin e repetir na mesma semana não duplica.
- **Limite de 50 chamadas à API e 35 s por execução:** no máximo ~20 itens por execução, em lotes paralelos pequenos (5 por vez),
  e o cursor do `/v1/budgets` guardado no `storage` para continuar na próxima.
  `storage` não é escopo: não declare em `scopes`.
- **Storage na função: `hold.storage.get(colecao, chave)` (valor ou `null`) e `hold.storage.set(colecao, chave, valor)`** (`put` é sinônimo).
  Não leia por `hold.api.get("/storage/...")`: a API devolve o **registro** `{ collection, key, value, sizeBytes, updatedAt }`, não o valor;
  tratar o registro como valor passa na 1ª execução (chave ainda não existe = `null`) e **quebra na 2ª** (`execucoes.unshift is not a function`).
  Teste rodando a agenda **duas vezes** (`holdprint plugin run <agenda>` 2×), no simulador e na conta.
- **Chamar a função pela tela:** `await hold.functions.call("integracao/teste", corpo)`; na função, `createHold(request, env)` dá
  `trigger`, `user`, `installationId`, `invocationId`, `api`, `storage`, `requireSecret`, `verifyHmac`, `daysAgo`, `isoWeek`.
- **Testar:** `holdprint plugin run <agenda>` executa agora e `holdprint plugin logs [--follow] [--since 10m] [--trigger schedule]` mostra o que aconteceu
  (os mesmos dados da tela **Registros**, 7 dias). Mostre ao usuário o resultado, não só "rodou".
- **Hook de terceiro:** `POST https://hooks.<domínio>/<installationId>/<nome>` (até 256 KiB); **a função confere a assinatura do terceiro** com
  `hold.verifyHmac(corpo, assinatura, hold.requireSecret("NOME"), { prefix: "sha256=" })` (recebe o **valor** do segredo) e recusa (401) se não bater.
- **Agenda:** `every` só `1m`, `15m`, `30m`, `1h`, `6h`, `12h`, `1d`; em produção o mínimo é 15 min (`1m` só na stack local). O horário é
  espalhado entre instalações; agenda perdida roda uma vez ao voltar; plugin desligado não roda.
- **Respeite a frequência que o usuário pediu.** "Todo dia" é `every: "1d"`, mesmo que haja mais de 20 itens: **não** troque para `1h` para
  caber no limite por execução. Processe até ~20 por execução e guarde o progresso em `hold.storage` (cursor e período, ex.:
  `follow-up/progresso = { semana, cursor }`); quem não coube espera a próxima execução ou é retomado por "Executar agora". Se o volume
  diário não couber nem assim, explique ao usuário e proponha a frequência menor como **opção**, sem trocar sozinho.
- **Limitações:** linhas de console de execuções simultâneas podem se misturar nos Registros; corpo do hook é texto UTF-8 (binário não
  confere HMAC); trocar segredo na stack local reinicia o plugin ~1 s (uma execução pode falhar uma vez e é refeita); na nuvem os
  Registros levam até ~60 s. Detalhes em `functions-reference.md`.

## Ação no orçamento e modal

Além da página no menu, o plugin pode pôr **botões** no Holdprint com `contributes.actions` (campo a campo em `manifest-reference.md`):

- **Onde aparece:** `target: "budget"` põe o botão no menu do ícone de raio do orçamento, na seção **Plugins**; `target: "new-record"` põe no menu **Novo registro** do topo.
- **Como abre:** `open: "modal"` (janela por cima da tela, `modal.size` `md`, `lg` ou `xl`) ou `open: "page"` (a tela do plugin, `ui.entry`, abre como página inteira; **não** precisa de `contributes.page`).
- **Limites:** até **5 ações** por plugin; ação de orçamento (`target: "budget"`) exige `budgets:read` nos `scopes`; `contributes.page` é opcional
  (o plugin precisa de página, ação **ou** funções). Plugin **só de ação não aparece no menu lateral**: só na tela Plugins e nos botões.
  Crie com `holdprint plugin create <pasta> --template acao`.
- **Consentimento:** mudar só as ações **não** pede reconsentimento (é lugar na tela, não acesso a dado). Escopo novo continua pedindo.
- **Quem vê o botão:** só quem pode usar o plugin (perfil liberado + **Plugins: Usar**). Em sessão personificada pelo suporte e na sandbox não há botão.

**Qual orçamento foi aberto: `hold.context.launch`, nunca a URL.** O Holdprint valida no servidor que o orçamento é da conta e que o usuário
pode vê-lo, e entrega o resultado em `hold.context.launch` (`{ actionId, actionTitle, target, entity: { type, id, code, title } }`).
`hold.context.surface` diz se o plugin abriu como `"modal"` ou `"page"`. **Não leia id de `location`, query string ou hash:** a URL do quadro
só carrega identificadores sem validação e pode ser trocada; o id confiável vem do contexto. Aberto pelo menu lateral, `launch` é `null`;
por uma ação de **Novo registro**, `launch` vem com `target: "new-record"` e `entity: null`: mostre um seletor (lista de `/budgets`).

```js
const hold = await Holdprint.connect();
const orcamentoId = hold.context.launch?.entity?.id;
if (!orcamentoId) { /* sem orçamento: peça para escolher (ex.: lista de /budgets) */ }
const orcamento = await hold.api.get(`/budgets/${orcamentoId}`);   // GET /v1/budgets/{id}, exige budgets:read
```

**Resultado do modal:**
- `hold.modal.confirm(result?)` fecha o modal como **confirmado** (`result` é JSON de até 16 KiB); o Holdprint recarrega o orçamento e as tarefas e mostra o toast "<ação> concluída".
- `hold.modal.cancel()` fecha como cancelado, sem recarregar. O **X** e a tecla **ESC** também cancelam, inclusive com o foco dentro do
  plugin (o SDK ouve o ESC no modal). Se o plugin usa ESC para algo próprio (fechar um menu dele), chame `event.preventDefault()` no `keydown`
  e o SDK não fecha. Clicar fora do modal **não** fecha (para não perder o que o usuário digitou).
- Plugin desligado, acesso perdido ou token que não renova com o modal aberto fecham como **expirado**, com aviso (até ~30 s).
- Em `surface: "page"` os dois métodos são ignorados (`hold.modal.isModal` é `false`): teste `isModal` antes e, na página, mostre o seu próprio "Concluído".
- **Só confirme depois que a escrita deu certo.** Falhou: `hold.ui.toast(..., 'error')` e deixe o modal aberto.

**Escrever a partir do botão é sempre idempotente:** derive a chave do fato (`proposta-enviada-${orcamentoId}-${dia}`), nunca aleatória; o
usuário pode clicar duas vezes ou reabrir o modal e **não** deve duplicar a tarefa (a 2ª chamada devolve a mesma tarefa, `200` em vez de `201`).
**O corpo tem de ser idêntico em toda repetição com a mesma chave:** nada de `new Date()` com hora, contador ou texto que mude — a API recusa
a mesma chave com corpo diferente (`400 HOLD_GENERAL_6 [Idempotency-Key]`). Derive datas do mesmo fato da chave (ex.: o dia, ao meio-dia UTC).
```js
const hoje = new Date().toISOString().slice(0, 10);
const tarefa = await hold.api.post('/tasks',
  { budgetId: orcamentoId, title: 'Proposta enviada', responsibleUserId: hold.context.user.id, schedulingTime: `${hoje}T12:00:00.000Z` },
  { idempotencyKey: `proposta-enviada-${orcamentoId}-${hoje}` });
await hold.api.put(`/tasks/${tarefa.id}/complete`);   // registro de algo já feito; concluir de novo não dá erro
if (hold.modal.isModal) hold.modal.confirm({ budgetId: orcamentoId, taskId: tarefa.id });
```

**Deep link:** `<endereço do Holdprint>/plugins/<instalação>?acao=<id>&id=<orçamento>` (sem `#`) abre a ação **como página** (`surface: "page"`), com o mesmo `launch` validado.
Do plugin para o Holdprint, `hold.nav.open('budget', id)` (na página; no modal o orçamento já está aberto atrás).

**Testar no `holdprint dev`:** o simulador mostra um **orçamento fictício com o botão de cada ação de orçamento**; clicar abre o modal emulado, e
`confirm`/`cancel` mostram o toast do resultado (a tarefa criada aparece no simulador). As ações de Novo registro aparecem num botão à parte.
Para ver no Holdprint de verdade: `holdprint plugin deploy`, aprovação do consentimento e abrir um orçamento (ícone de raio > Plugins). O cache
da lista de ações é de até 60 s: se o botão não apareceu, reabra o orçamento depois de um minuto.

Exemplo completo ("Gerar proposta", só de ações): `examples.md`, seção 6, e `examples/gerar-proposta` no repositório holdprint-plugins.

## Apps externos: entrar com a conta Holdprint (TV, celular, site)

Quando o pedido é um painel **fora** do Holdprint (TV da produção, página no celular, site do cliente) que lê dados da conta como o
usuário que entrou, o plugin declara `contributes.externalApps` e o app usa `HoldprintExternal`. Detalhe, exemplo completo e erros:
`external-apps-reference.md`. Resumo que vale sempre:
- `kind: "device"` para TV (código + QR, aprovado no Holdprint; o QR vem pronto em `info.qrSvg` → `el.innerHTML = info.qrSvg`;
  `info.qrUrl` é só o texto do QR, nunca `img.src`, e nada de biblioteca de QR de CDN); `kind: "web"` para celular/site (redireciona e volta, exige `redirectUris`).
- `origins` (`https://`; `http://localhost` só no local) e `scopes` **dentro** dos escopos do manifesto. Até 3 apps. App ou origem
  nova **pede consentimento**: mostre o link `/plugins/consent/<id>` ("Acessa de fora do Holdprint: <app> em <origem>").
- Entrada **só** por `HoldprintExternal.init({ pluginId, appId })` + `app.signIn({ onCode })` (device) ou `app.signIn()` / `app.handleRedirect()`
  (web). **Nunca** peça senha no app. Quem guarda a sessão é o SDK (`persist`); **nunca** copie token, refresh ou código para
  `localStorage`/cookie seu, URL, log ou arquivo do projeto.
- O SDK vem de `<id.domínio técnico>/sdk/external-v1.js` e o app só fala com `api.<domínio técnico>`, a mesma `/v1`; CORS só para a
  origem registrada. Local: `http://id.plugins.localhost:8787` / `http://api.plugins.localhost:8787`; nuvem de teste:
  `https://id.hold.market` / `https://api.hold.market`.
- Do plugin dentro do Holdprint para o app: `hold.nav.openExternal(appId, { entity: { type: 'budget', id } })` (**só orçamento**) e, no
  app, `app.verifyContext(jws)` (confere pelo JWKS; nunca confie em id solto na URL).
- Token da CLI ou do MCP não serve para rotas do ERP que repassam o token do usuário ao Auth ou ao Merlin (limite conhecido).
- Revogar: **Plugins > Acessos conectados** (derruba em até 60 s).

## Vitrine, Marketplace e envio por link

O plugin ganha uma página de apresentação gerada pelo Holdprint a partir do bloco opcional `listing` do manifesto (veja `manifest-reference.md`).
Escreva sempre o `listing` quando o usuário quiser mostrar o plugin a outras pessoas ou mandar para outra gráfica: `summary` em pt-BR de até 140
caracteres, `category` do catálogo, até 5 `highlights` curtos e `support` (e-mail ou `https://`). Texto puro, sem HTML nem markdown, sem promessa
("o melhor", "aumenta suas vendas em 30%", "garantido"): descreva só o que o plugin faz. Mudar o `listing` não pede novo consentimento.

**Marketplace.** No menu Plugins existe o item **Marketplace** (Administrador ou quem tem Plugins: Gerenciar), com quatro seções:
**Da sua conta** (publicados pela conta, instalados ou não), **Da comunidade** (plugins de outras contas que a Hold aprovou; veja o passo 7 do Fluxo), **Recebidos por link** e **Destaques da Hold** (vazia por enquanto).
Instalar pela vitrine leva ao mesmo consentimento de sempre (serve também para reinstalar um plugin desinstalado). A tela Plugins mostra a coluna
**Origem** (Da sua conta, Marketplace ou Link).

**Mandar para outra gráfica (link não listado).**
1. Faça o `deploy` normal e, se o plugin é novo, espere o Administrador da própria conta aprovar.
2. `holdprint plugin publish --unlisted [--max-accounts 10] [--expires 30d]`. A CLI imprime o link **uma única vez** (`<endereço do Holdprint>/plugins/install/<pluginId>.<token>`,
   sem `#`) e o teto de contas. `--expires` aceita de `1d` a `90d` (padrão `30d`); `--max-accounts` de 1 a 10 (padrão 10). A conta dona não conta e desinstalar
   libera a vaga. Quem abre o link vê a página do plugin com a faixa "Publicado por outra conta: <nome>", a validade e quantas contas já instalaram.
3. **O Claude entrega o link ao usuário na conversa e não o grava em arquivo do projeto** (nem `CLAUDE.md`, README, manifesto, script ou log). Quem tem o link
   instala; se o usuário perder, gere outro.
4. `holdprint plugin links` lista os links e as contas que instalaram (nunca reexibe a URL). `holdprint plugin links --revoke <linkId>` revoga: o link passa a dar
   "Link inválido" (404 72) e as instalações já feitas continuam.

**Regras de quem recebe.**
- Quem instala é o **Administrador da outra conta**, e o consentimento é dele: a tela mostra "Publicado por outra conta: <nome>" e o que o plugin acessa. Vendedor e
  outros perfis não instalam; personificação e sandbox também não.
- **Cada conta tem os próprios dados e registros.** `hold.storage`, agendas, hooks e a API `/v1` (`GET /v1/me`) valem por instalação; a gráfica de destino vê os
  orçamentos dela, nunca os da dona, e cada conta só lê os registros (`plugin logs`) das próprias instalações.
- **Plugin para outra gráfica NÃO pode declarar `secrets`** (`409 HOLD_PLUGIN_PLATFORM_74` ao instalar pelo link; `409 _75` no deploy que acrescenta segredo
  com instalação em outra conta). Se o usuário quer enviar o plugin, projete sem segredo (só tela, ações, agendas e eventos) e avise que integração com chave própria
  ainda não é possível entre contas. Versão nova vale para todas as instalações; escopo novo deixa a outra conta nos escopos antigos até o Administrador dela aprovar.
- Link vencido, revogado ou errado dá `404 _72`; teto de contas dá `409 _73`; `listing` inválido dá `400 _70`. Se o recurso estiver desligado na stack
  (`PLUGIN_INSTALL_LINKS_ENABLED`), as rotas de link recusam: avise o usuário em vez de contornar.

## Nuvem de teste, prévia, release e rollback

O alvo `teste` precisa estar configurado uma vez na máquina (`scripts/nuvem-teste.sh setup`, feito por quem mantém a stack);
se `deploy --target teste` disser que o alvo não existe, avise o usuário em vez de tentar configurar por conta própria.

- **Publicar na nuvem de teste:** `holdprint plugin deploy --target teste [pasta]`. O plugin passa a ser servido pela
  hospedagem de teste (`https://<pluginId>.hold.market`) em vez da máquina local. O alvo fica gravado no registro do plugin.
- **A primeira versão é liberada direto.** Da segunda em diante o `deploy` publica como **prévia** e imprime um link
  `.../plugins/<installationId>?versao=vN`. Só **Administradores** abrem a prévia, e o quadro mostra a faixa
  "Prévia vN · só administradores veem · a equipe vê vM". Os outros perfis continuam vendo a versão liberada (vM).
  Mostre o link da prévia ao usuário e peça que um Administrador confira.
- **Liberar:** `holdprint plugin release [vN]` (sem argumento, libera a prévia mais recente). A equipe passa a ver vN
  na próxima abertura. A borda da nuvem pode levar **até ~60 s** para refletir um deploy, release, rollback, desligar ou
  reinstalar: se o quadro ainda mostrar a versão antiga (ou der 404/`wrong_installation`), espere e reabra antes de concluir
  que falhou.
- **Voltar:** `holdprint plugin rollback [vN]` (sem argumento, volta à versão liberada anterior).
- **Liberar já no deploy:** `holdprint plugin deploy --release`. O `holdprint plugin dev` já usa esse modo.
- **Versões são imutáveis.** Uma versão publicada nunca muda: editar o plugin e rodar `deploy` cria a versão seguinte
  (v1, v2, v3...). Não tente "corrigir" uma versão no lugar; publique outra e libere.
- **Prévia de versão inexistente** dá `404 HOLD_PLUGIN_PLATFORM_46`; Vendedor ou outro perfil abrindo `?versao=` de versão
  não liberada dá `403 HOLD_PLUGIN_PLATFORM_47` (esperado, não é defeito).
- **NUNCA** peça ao usuário token, chave ou credencial da Cloudflare, e **nunca** edite arquivos de infraestrutura
  (Workers, KV, DNS, variáveis de ambiente, scripts de setup). A publicação na nuvem passa só pelo `holdprint plugin deploy`
  e pela WebApi; o token da Cloudflare fica guardado no serviço de deploy da plataforma, nunca na máquina de quem publica.
  Se o deploy falhar por infraestrutura, mostre o erro ao usuário e pare.

## Ver o plugin antes de publicar: simulador e modo desenvolvedor

Dois jeitos de ver a tela sem publicar versão. Comece sempre pelo simulador.

- **Para começar, sem login: `holdprint dev [pasta]`.** Abre um simulador local (`http://localhost:4790`) com a
  **Gráfica Exemplo**, dados fictícios (4 vendedores, cerca de 300 orçamentos, funil de 5 etapas, tarefas). Não precisa de login, não
  usa rede, não toca em conta nenhuma. A tela do plugin recarrega sozinha a cada salvamento. Escritas (mover etapa, criar tarefa,
  `hold.storage`) valem só no simulador e ficam em `.holdprint/sim-state.json` na pasta do plugin; `--reset` volta ao início.
  Use para desenhar e depurar a tela, e para a maior parte do trabalho.
- **Para ver com dados reais: `holdprint plugin dev --account [pasta]`.** Exige `holdprint login` como **Administrador**, e que o
  plugin já tenha sido publicado (`deploy`) e aprovado pelo consentimento. A CLI imprime um link
  `.../plugins/dev/<código>` e abre o navegador. O plugin roda **do seu computador** dentro do quadro do Holdprint, com os dados
  da conta, em **modo só leitura** (qualquer escrita dá `403 HOLD_PLUGIN_PLATFORM_51`; leituras e `hold.sync.pull` funcionam) e **só naquela janela**: outra aba,
  outra pessoa ou o celular continuam vendo a versão publicada. O quadro mostra a faixa "Modo desenvolvedor · servido de
  http://localhost:<porta> · só leitura · só nesta janela · [Sair]". A sessão vive enquanto a CLI roda; **Ctrl+C** (ou fechar a CLI)
  encerra, e o quadro volta sozinho para a versão publicada. Os outros administradores recebem um e-mail avisando (no máximo um por dia).
  Use **Chrome** (ou Edge/Firefox); Safari não é suportado.
- **O link do modo desenvolvedor é de uso único e é só seu.** Não mande para ninguém: quem abrir (outro usuário) recebe
  `403 HOLD_PLUGIN_PLATFORM_52`; link usado ou vencido dá `410` e basta rodar o comando de novo.
- **Para mostrar aos outros: use a prévia, não o modo desenvolvedor.** `holdprint plugin deploy` (da segunda versão em diante) gera
  o link de prévia que os administradores abrem de qualquer lugar; `release` libera para a equipe. O modo desenvolvedor só existe
  na máquina de quem rodou a CLI.
- **Nunca use túnel** (ngrok, cloudflared, localtunnel) para expor o servidor local do plugin ou do simulador: o modo
  desenvolvedor só aceita origem `localhost`, `127.0.0.1` ou `[::1]` (`400 HOLD_PLUGIN_PLATFORM_50` caso contrário) e o simulador
  não precisa de rede. `holdprint plugin dev` (sem `--account`) continua publicando uma versão a cada salvamento (a CLI avisa e sugere `holdprint dev` ou `--account`).
- A tela recarrega sozinha em cerca de 2 a 3 s depois de salvar. `--no-open` não abre o navegador; `--port` só vale junto com `--account`.
- Se a escrita for recusada, o erro do SDK já explica em português (ex.: "o modo desenvolvedor é somente leitura; publique o plugin para gravar (HOLD_PLUGIN_PLATFORM_51)"); mostre-o ao usuário em vez de tentar contornar.
- `functions/` rodam no simulador (com "Executar agenda <id>" na moldura) e no modo desenvolvedor (só leitura: escrita dá `403 _51`). Segredos locais ficam em `.holdprint/dev-secrets.json`, que nunca se versiona.

## Pedido composto: painel + botão com modal + automação, num plugin só

Quando o usuário pede de uma vez "um painel no menu, um botão no orçamento que abre um modal e uma automação diária", é **um plugin só**
(um slug, um deploy, um consentimento). Não crie três plugins.

1. **Um manifesto junta tudo:** `contributes.page` (item no menu) + `contributes.actions` (botão, `target: "budget"`, `open: "modal"`) +
   `functions` com `schedules` (`every: "1d"`) + `ui` (`public/index.html`). Ponto de partida: `holdprint plugin create <pasta> --template automacao`
   (já traz função e agenda) e acrescente `contributes.actions`; ou o molde `examples/follow-up-automatico` (página + agenda) com a ação do
   `examples/gerar-proposta`. Escopos: a união do que cada parte usa, cada um com `purpose` (ex.: `budgets:read` para o painel, o botão e a
   automação; `tasks:write` para o modal e a automação). Ação de orçamento exige `budgets:read`.
2. **Uma só entrada de tela:** painel e modal usam o mesmo `ui.entry`. Em `index.html`/`app.js` decida pela origem:
   `hold.context.launch?.actionId === "cobrar-retorno"` (ou `hold.modal.isModal`) mostra o modal; `launch` nulo mostra o painel.
   O id do orçamento vem só de `hold.context.launch.entity.id`.
3. **A automação e o modal compartilham a regra de criar a tarefa, mas não o código:** função em `functions/` (roda como a instalação,
   `hold.api` da função) e tela em `public/`. Use a **mesma convenção de `idempotencyKey`** nos dois (ex.: `follow-up-${orcamentoId}-${hold.isoWeek()}`
   na função e `cobrar-retorno-${orcamentoId}-${dia}` no modal), para nunca duplicar a tarefa.
4. **Ordem de publicar:** (a) `holdprint plugin list` e slug novo e único; (b) `holdprint plugin validate`; (c) testar a tela no simulador
   (`holdprint dev`: painel, botão e modal emulados); (d) **um único** `holdprint plugin deploy`; (e) mostrar o link `/plugins/consent/<id>` e parar.
   Nada de rodar `plugin run` antes da aprovação.
5. **O que dizer ao usuário para aprovar (lista curta, com as suas palavras):** cada escopo com o propósito; "roda sozinho todo dia"
   (a agenda); os domínios, se houver; os segredos que ele grava depois (só o nome, nunca o valor no chat); os perfis a marcar (Administrador
   sempre pode; marque também o de quem vai usar o botão). Avise que o botão e o item de menu só aparecem depois da aprovação (o cache da
   lista de ações leva até 60 s).
6. **Depois que ele disser que aprovou:** `holdprint plugin run <agenda>` **duas vezes**, `holdprint plugin logs` e mostre o resultado; diga onde
   ver: item no menu **Plugins**, botão (orçamento > ícone de raio > Plugins) abrindo o modal, **Executar agora** e **Registros** na tela Plugins,
   e o card no **Marketplace** (preencha `listing`). Se faltou segredo, mande gravar por Plugins > ⋯ > Segredos ou `! holdprint plugin secrets set NOME`.
7. **Mudança depois:** escopo novo pede nova aprovação (mostre o link de novo); mudar só ações, texto ou código não pede.

## Regras (não negociáveis)

1. **Só o SDK.** Fale com o Holdprint apenas por `hold.*` (`/_hold/sdk/v1.js`). Nada de `fetch` direto para a WebApi,
   token na mão, `postMessage` manual ou leitura do `window.parent`.
2. **Escopos só do catálogo, cada um com propósito.** Declare no manifesto o mínimo necessário e escreva, em
   português, para que serve cada um. Catálogo: `budgets:read`, `customers:read`, `funnels:read`,
   `users:read`, `tasks:read`, `tasks:write` e, da Fatia 3, `budgets:move-step`. Ação de orçamento exige `budgets:read`. `storage` (dados do próprio plugin) e `me` são implícitos.
3. **Sem domínio externo na tela.** A CSP é `connect-src 'self'`: nada de CDN, fonte do Google, analytics, imagem ou API de
   terceiros. Coloque bibliotecas e fontes dentro de `public/`. Serviço externo só por **função**, em domínio declarado em `network.domains`.
4. **Dado do plugin em `hold.storage`.** Nunca `localStorage`/`sessionStorage`/IndexedDB para dado de negócio (some
   com o navegador e não é compartilhado entre usuários). `localStorage` só para preferência visual do próprio usuário.
5. **UI em português do Brasil**, datas `dd/mm/aaaa`, moeda `R$ 1.234,56`, com estados de carregando, vazio e erro.
6. **Nunca pedir nem guardar senha ou token.** O token é do SDK e renova sozinho.
7. **Escrita idempotente.** Em `POST /tasks`, mande sempre `{ idempotencyKey }` (3º argumento do `hold.api.post`), derivada
   do fato (`follow-up-<orcamentoId>-<data>`), nunca aleatória, e com o **corpo idêntico** a cada repetição (sem `new Date()` com hora
   no corpo — mesma chave com corpo diferente dá `400 HOLD_GENERAL_6`).
9. **Sincronização incremental.** Dado que o plugin reutiliza entre aberturas (listas de orçamentos, clientes, tarefas) vem de
   `hold.sync.pull`, não de varredura completa a cada abertura (ver seção Sincronização).
10. **Segredo nunca no chat.** O Claude não pede, não recebe e não escreve o valor de um segredo (nem em arquivo, comando, exemplo ou log). Declara o
   nome e manda gravar pela tela Segredos ou por `! holdprint plugin secrets set NOME`.
8. **Consulta paginada e leve.** `page`/`pageSize` (máximo 100; **prefira 25 em `/budgets`**; cada chamada leva cerca de 1 s no
   ambiente de teste). Filtre no servidor (`state`, `sellerId`), desenhe a tela por página
   conforme chegam e não baixe a base inteira.
11. **Plugin para outra gráfica: sem segredo e link só na conversa.** Não declare `secrets` em plugin que vai por link; escreva `listing` em pt-BR (texto puro, sem promessa);
   entregue o link do `publish --unlisted` ao usuário e não o salve em arquivo do projeto.

## Erros comuns

Erro de plataforma vem como `[{ type: 53, errorType: <n>, errorCode: "HOLD_PLUGIN_PLATFORM_<n>", fields: [...] }]`
(ver `api-v1-reference.md` para a tabela completa). No SDK, `HoldApiError` traz `status` e `body`.

| Sintoma | Causa e correção |
|---|---|
| `401` | Token expirado ou ausente. O SDK renova e repete uma vez; se persistir, a página foi aberta fora do Holdprint. Abra pelo menu Plugins. |
| `401 HOLD_PLUGIN_PLATFORM_35` (ou `401 reason=revoked` do porteiro) | Acesso do usuário revogado (bloqueio, troca de perfil ou edição do perfil). O SDK pede token novo e repete sozinho. Se o novo pedido cair em `403 HOLD_PLUGIN_PLATFORM_34`, o usuário perdeu o acesso: mostre "Você não tem acesso a este plugin" e não insista. |
| `403 HOLD_PLUGIN_PLATFORM_34` | O usuário não pode usar este plugin (perfil fora da lista da instalação ou sem **Plugins: Usar**). O quadro do Holdprint já mostra "Você não tem acesso"; não é bug do plugin. |
| `403 HOLD_PLUGIN_PLATFORM_31` | Instalação aguardando consentimento: mande o link `/plugins/consent/<id>` para um Administrador. |
| `400 HOLD_PLUGIN_PLATFORM_32` / `_33` / `_37` | Na aprovação: as permissões mudaram durante a revisão (recarregue) / senha errada / perfil inexistente. Quem resolve é o Administrador na tela. |
| `403 HOLD_PLUGIN_PLATFORM_38` | Usuário sem **Plugins: Gerenciar** tentando listar, desligar ou religar plugins. |
| `503 HOLD_PLUGIN_PLATFORM_36` | O Holdprint não conseguiu validar a revogação agora (cache fora do ar). Tente de novo em instantes. |
| `403 PLUGIN_SCOPE_REQUIRED` / `HOLD_PLUGIN_PLATFORM_9` | Rota exige escopo não concedido (`fields` diz qual). `PLUGIN_SCOPE_REQUIRED` vem na 1ª vez; `HOLD_PLUGIN_PLATFORM_9` quando o plugin já declarou o escopo numa versão anterior e o consentimento novo ainda não foi aprovado. Adicione o escopo (com `purpose`) em `holdprint.plugin.json` e rode `deploy`. |
| `403 HOLD_PLUGIN_PLATFORM_8` / `_12` | Sessão personificada/sandbox, ou ação exclusiva do Administrador (instalar, aprovar, escolher perfis, desinstalar). |
| `404 HOLD_PLUGIN_PLATFORM_30` | `POST /tasks` com `budgetId` inexistente ou de orçamento que o usuário não vê. |
| `429 HOLD_PLUGIN_PLATFORM_39` / `_40` | Cota diária (10 mil) ou por minuto (300) estourada. Respeite `Retry-After`; troque varredura por `hold.sync.pull`. |
| `400 HOLD_PLUGIN_PLATFORM_41` / `_42` / `503 _43` | `updated_since` inválido / cursor inválido ou de outro recurso (recomece a leitura) / consulta passou de 5 s (use intervalo menor). |
| `400 HOLD_PLUGIN_PLATFORM_44` / `_45` | Mover etapa: `stepId` de outro funil / orçamento que não está aberto. |
| `400 HOLD_PLUGIN_PLATFORM_53` / `_55` / `_56` / `410 _54` | Eventos: cursor inválido / URL de webhook inválida / tipo desconhecido / cursor com mais de 30 dias (releia por `hold.sync.pull`). |
| `400 HOLD_PLUGIN_PLATFORM_66` (no deploy) | `contributes.actions` inválido: `target`/`open`/`modal.size` fora do catálogo, mais de 5 ações, id repetido ou fora do padrão, ação de orçamento sem `budgets:read`, `modal` com `open: "page"`, ou plugin sem página, ação e funções. Corrija o manifesto (`holdprint plugin validate` já aponta). |
| `404 HOLD_PLUGIN_PLATFORM_67` / `_68` | Ao abrir pelo botão ou deep link: ação inexistente / orçamento fora da conta ou que o usuário não pode ver (não distingue os dois). Não é defeito do plugin. |
| `400 HOLD_PLUGIN_PLATFORM_69` | Abertura com alvo errado: ação de orçamento sem id de entidade, ou "Novo registro" com id. |
| `400 HOLD_PLUGIN_PLATFORM_57` / `_58` / `_59` | Segredo: nome inválido / não declarado no manifesto (declare em `secrets`) / valor vazio ou acima de 4 KiB. |
| `400 HOLD_PLUGIN_PLATFORM_60` / `404 _61` / `400 _62` | Agenda inválida (`every` fora do catálogo ou abaixo do mínimo) / agenda inexistente em "Executar agora" / domínio de rede inválido (IP, curinga, porta). |
| `404 HOLD_PLUGIN_PLATFORM_63` / `413 _64` / `401 _65` | Hook não declarado / corpo acima de 256 KiB / chave de entrada da plataforma inválida (só o porteiro chama). |
| Função falha com "segredo faltando" | Faltou gravar o valor: Plugins > ⋯ > Segredos ou `! holdprint plugin secrets set NOME`. Nunca peça o valor no chat. |
| Função recusada com 401 `platform_signature` | Relógio do computador fora de hora (janela de 60 s). |
| `400` em `/budgets` | `state` fora de `open`/`won`/`lost` ou `sellerId` inválido. |
| `410 HOLD_PLUGIN_PLATFORM_49` no modo desenvolvedor | A CLI do `plugin dev --account` parou ou a sessão venceu (sem heartbeat por 90 s). O quadro volta à versão publicada; rode o comando de novo. |
| `403 HOLD_PLUGIN_PLATFORM_51` no modo desenvolvedor | Escrita no modo só leitura. Teste escritas no simulador (`holdprint dev`) ou na versão publicada. |
| `410` ao abrir `/_hold/...` | Plugin desligado. Religar em `/plugins` (menu "...") ou `holdprint plugin disable --enable`. |
| Tela em branco / `Holdprint is not defined` | Faltou `<script src="/_hold/sdk/v1.js">` antes do `app.js`. |
| `Refused to connect` / CSP | Chamada a domínio externo ou `fetch` fora do SDK. Remova. |
| Deploy recusado | Manifesto inválido: rode `holdprint plugin validate`; veja `manifest-reference.md`. |
| Lista de orçamentos demora | ~1 s por página no teste (banco remoto). Use `pageSize=25` e desenhe progressivo. |
| `400 HOLD_PLUGIN_PLATFORM_70` no deploy | `listing` inválido: `summary` acima de 140, `category` fora do catálogo, mais de 5 `highlights` (80 caracteres cada) ou `support` que não é e-mail nem `https://`. |
| `409 HOLD_PLUGIN_PLATFORM_74` / `_75` | Plugin com `secrets` não instala em outra conta (74) e o deploy não pode acrescentar segredo com instalação alheia (75). Tire o segredo do plugin. |
| `404 _72` / `409 _73` no link | Link inválido, revogado ou vencido (72) ou teto de contas atingido (73). Gere outro com `publish --unlisted` ou aumente `--max-accounts` (até 10). |
| `403 HOLD_PLUGIN_PLATFORM_76` / `_77` | A Hold bloqueou este plugin (76) ou os plugins desta conta (77). Não tente contornar: nada de republicar com outro slug nem reinstalar. Mostre o motivo (`holdprint plugin list`) e oriente o usuário a falar com a Hold. |
| `400 _78` / `_79` | Interno da Hold: bloqueio sem motivo (78) e destaque de plugin que não é de conta publicadora da Hold (79). Não aparecem no fluxo normal de quem cria plugin. |
| `403 HOLD_PLUGIN_PLATFORM_97` | Pedido de publicação por quem não é Administrador. Peça a um Administrador da conta (ou o login de um) e rode `holdprint plugin submit` de novo. |
| `409 HOLD_PLUGIN_PLATFORM_98` | A Hold bloqueou o plugin: mostre o motivo e oriente a falar com a Hold; não tente contornar. |
| `409 HOLD_PLUGIN_PLATFORM_99` | Plugin com segredo não pode ir para outras contas: tire `secrets` do manifesto, `deploy`, `release` e peça de novo. |
| `400 HOLD_PLUGIN_PLATFORM_100` | Faltou `listing` (resumo e categoria): preencha, `validate`, `deploy --release` e peça de novo. |
| `409 HOLD_PLUGIN_PLATFORM_101` | Sem versão liberada: rode `holdprint plugin release` e peça de novo. |
| Pedido `Recusado: <motivo>` | A Hold recusou. Mostre o motivo, corrija, libere versão nova e rode `holdprint plugin submit` de novo. |
| Mudou o código e a tela não mudou | Rode `deploy` e recarregue o Holdprint (F5). |
| `Voce ainda nao fez login` (a mensagem traz o caminho: `holdprint login` se já tem conta, ou criar conta de teste grátis em `<Holdprint>/holdai/register`) / `Sua sessao da CLI expirou` / `401` na CLI | Rode `holdprint login` de novo (o acesso renova sozinho; se o refresh venceu ou foi revogado em Acessos conectados, é preciso novo login). |
| App externo: `400 _80`/`_81`, CORS, `401 _82`/`_83`, `403 _87` | Veja a tabela de erros em `external-apps-reference.md`. |

## Checklist pós-deploy

- [ ] `holdprint plugin deploy` terminou sem erro e imprimiu o endereço do plugin.
- [ ] O Administrador aprovou o consentimento pelo link `/plugins/consent/<id>` (e marcou os perfis que vão usar).
- [ ] Abrir o Holdprint (Chrome), entrar como Administrador e achar o item no menu **Plugins**.
- [ ] A tela abre sem erro no console e mostra dados reais (não só o estado vazio).
- [ ] Cada escopo declarado é usado de fato; nenhum sobrando.
- [ ] Textos em pt-BR, sem domínio externo, sem `localStorage` para dado de negócio.
- [ ] Ações de escrita testadas uma vez e repetidas (idempotência) sem duplicar.
- [ ] Plugin com agenda: `holdprint plugin run <agenda>` rodado **duas vezes** sem erro (a 2ª lê o que a 1ª gravou no `hold.storage`) e o resultado mostrado por `holdprint plugin logs`.
- [ ] Plugin com ações: o botão aparece (orçamento > raio > Plugins, ou Novo registro), o id vem de `hold.context.launch`, `modal.confirm` só depois da escrita, e repetir a ação não duplica.
- [ ] Plugin que vai para outra gráfica: `listing` preenchido, nenhum `secrets`, link do `publish --unlisted` entregue ao usuário (e não gravado em arquivo), explicado que o Administrador da outra conta instala e aprova, e `holdprint plugin links` conferido.
- [ ] Plugin com app externo: `externalApps` com a origem real, `signIn` (sem senha nem token guardado), chamadas só em `api.<domínio técnico>`, consentimento mostrado ao usuário e o acesso conferido em Plugins > Acessos conectados.
- [ ] Pedido de publicação (só se o usuário pediu): `listing` ok, sem `secrets`, versão liberada, `holdprint plugin submit` rodado e `holdprint plugin submission` conferido; o usuário sabe que a Hold analisa e como acompanhar (ou o motivo da recusa foi mostrado e corrigido).
- [ ] Reportar ao usuário o que foi publicado e como abrir.

## Referências

- `sdk-reference.md`: `Holdprint.connect()`, `hold.api`, `hold.storage`, `hold.ui`, `hold.nav`, `hold.modal`, `hold.context.launch`.
- `api-v1-reference.md`: rotas `/v1`, escopos, paginação, idempotência, erros.
- `manifest-reference.md`: `holdprint.plugin.json` campo a campo (inclui `events` e `contributes.externalApps`).
- `external-apps-reference.md`: apps externos (TV/celular), `HoldprintExternal.signIn`, `api.<domínio técnico>`, deep link assinado, `holdprint login/logout`, Acessos conectados e o exemplo do painel de TV.
- `manifest-reference.md` também traz o bloco `listing` (vitrine) e as regras de validação.
- `functions-reference.md`: funções, agendas, segredos, hooks, registros e `holdprint plugin run/logs/secrets`.
- `examples.md` (seção 6: ação "Gerar proposta" com modal): painel de orçamentos por vendedor com follow-up; anotações com `hold.storage`; sincronização incremental e avançar etapa; eventos com `subscribe` e `sync.pull`; ciclo simulador, modo desenvolvedor e prévia; follow-up automático com função, agenda, segredo e hook.
