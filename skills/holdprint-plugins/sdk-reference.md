# SDK do plugin (v1)

Carregue com `<script src="/_hold/sdk/v1.js"></script>` (servido pelo porteiro do plugin). Também existe como pacote
npm com o mesmo código, para quem usar bundler (não obrigatório).

```js
const hold = await Holdprint.connect();
```

`connect()` faz o aperto de mão com o Holdprint (mensagem `hello`, recebe `init` com token e contexto por um canal
privado). Rejeita se a página não estiver dentro do Holdprint. O token **nunca** vai na URL e o SDK o renova sozinho
(empurrado aos 8 min, ou pedido após um 401).

## hold.context

```js
hold.context // { user:{id,name}, account:{id,name}, installationId, pluginId, locale }
```
`locale` vale `pt-BR` na maioria das contas. Use para saudar o usuário e formatar datas.

Quando o plugin abre por um botão (`contributes.actions`) ou por deep link, o contexto ganha dois campos:

```js
hold.context.surface // "page" ou "modal"
hold.context.launch  // { actionId, actionTitle, target: "budget"|"new-record", entity: { type, id, code, title } } ou null
```
`launch` é **validado no servidor** (orçamento da conta e visível ao usuário). Use `hold.context.launch.entity.id` e **nunca** leia o id de
`location`/query/hash. Em ação `new-record`, `launch.entity` é `null`. Sem ação (menu lateral), `launch` é `null` (nunca `undefined`) e
`surface` é `"page"`. O deep link `<endereço do Holdprint>/plugins/<instalação>?acao=<id>&id=<orçamento>` (sem `#`) chega com o mesmo `launch` e `surface: "page"`.

## hold.api

`hold.api.get(path, opts)`, `post(path, body, opts)`, `put(path, body, opts)`, `del(path, opts)`.
- `path` é relativo a `/v1` (ex.: `'/budgets?state=open&pageSize=25&page=1'`). Sob o capô vira `/_hold/v1/...` na própria origem.
- Devolve o JSON da resposta (listas paginadas: use `res.data`); em erro HTTP lança `HoldApiError` com `status` e `body`
  (o JSON do erro) e `message` no formato `Holdprint API <status>: ...`. Um `401` é renovado e repetido uma vez.
- `opts.idempotencyKey` vira o header `Idempotency-Key` (use em `POST /tasks`).

```js
const task = await hold.api.post('/tasks', { budgetId, title: 'Follow-up', schedulingTime: `${hoje}T12:00:00.000Z` }, { idempotencyKey: `fu-${budgetId}-${hoje}` });  // corpo idêntico a cada repetição
```

### hold.api.list

`hold.api.list(path, query)` é um iterador assíncrono sobre listas em modo cursor (`/budgets`, `/customers`, `/tasks`): pede
páginas de até 100 e segue o `nextCursor` até acabar. Com `updated_since` traz só o que mudou e inclui os excluídos com `deleted: true`.

```js
for await (const b of hold.api.list('/budgets', { state: 'open' })) { desenhar(b); }
```

### 429 e Retry-After

Em `429` o SDK espera o `Retry-After` e repete **uma única vez**; se persistir, lança `HoldApiError` (`status` 429, `body` com
`HOLD_PLUGIN_PLATFORM_39` diária ou `_40` por minuto). Mostre "Limite de chamadas atingido, tente de novo em instantes" e não faça laço de repetição.

## hold.sync

`await hold.sync.pull(resource)` com `resource` em `'budgets' | 'customers' | 'tasks'` devolve `{ changed, deleted, syncToken }`:
- Primeira chamada: leitura completa (tudo em `changed`).
- Seguintes: só o que mudou desde a anterior (`updated_since` = `syncToken` guardado em `hold.storage`, coleção `hold-sync`, chave `<recurso>:<id do usuário>`,
  por plugin, conta e usuário). O SDK tira duplicados por `id` (o token recua 5 s de propósito).
- `deleted` traz os itens excluídos (objetos com `id` e `deleted: true`); remova do espelho local por `item.id`.
- A visibilidade do usuário vale (Vendedor só sincroniza o que a tela dele mostra).
- Limite: só enxerga escritas feitas pela WebApi do Holdprint; mudanças feitas por integrações externas à API podem não aparecer.

- O espelho fica **em memória**, na tela de quem abriu. Nunca grave orçamento, cliente ou tarefa em `hold.storage`: ele é compartilhado entre os usuários
  da conta e furaria a visibilidade de cada perfil.

```js
const espelho = new Map();
async function sincronizar(completa) {
  const { changed, deleted } = await hold.sync.pull('budgets', completa ? { full: true } : {});
  for (const b of changed) espelho.set(b.id, b);
  for (const b of deleted) espelho.delete(b.id);
}
await sincronizar(true);
hold.events.subscribe(['budget.won', 'budget.step_changed'], () => sincronizar(false), { onResync: () => sincronizar(true) });
await hold.api.put(`/budgets/${id}/step`, { stepId }, { idempotencyKey: `step-${id}-${stepId}` });
```

## hold.events

`const stop = hold.events.subscribe(types, handler, { intervalMs: 5000, limit, onResync, onError })` consulta o feed `GET /v1/events` a cada 5 s,
pausa com `document.hidden` e retoma do último cursor. `handler(eventos)` recebe a lista nova, já **sem duplicados por `data.id`**
(LRU de 2 mil). `stop()` cancela. Em `429` espera e repete; se o cursor passar de 30 dias (`HOLD_PLUGIN_PLATFORM_54`, 410), chama `onResync`.
- Entrega **ao menos uma vez e sem ordem**: use o evento como gatilho e reconcilie com `hold.sync.pull(<recurso afetado>)`. Nunca releia tudo.
- Tipos v1: `budget.won`, `budget.step_changed` (`budgets:read`), `task.created`, `task.completed` (`tasks:read`), `customer.created` (`customers:read`).
- O evento traz só identificadores (`budgetId`, `budgetCode`, `taskId`, `customerId`, `actor`), sem dado pessoal.
- O feed não conta na cota diária, mas conta nos 300 por minuto: não crie mais de um `subscribe` por tipo.

```js
const stop = hold.events.subscribe(['budget.won'], async () => { await hold.sync.pull('budgets'); render(); },
  { onResync: () => hold.sync.pull('budgets', { full: true }) });
window.addEventListener('pagehide', stop);
```

## hold.storage

Dados do próprio plugin, por conta: `collection` + `key` + valor JSON. Não precisa de escopo.
- `await hold.storage.get(collection, key)` → **o valor gravado** (sem embrulho) ou `null` se não existe.
- `await hold.storage.set(collection, key, value)` grava o valor como está (objeto, texto, número).
- `await hold.storage.list(collection)` → `[{ collection, key, value, sizeBytes, updatedAt }]`; o SDK segue `nextCursor`
  sozinho e devolve todos (ordenados por `key`).
- `await hold.storage.delete(collection, key)`.

Limites: 256 KiB por registro, 5 mil registros por plugin. `collection`: minúsculas, números, `-`, `_` (até 64);
`key`: letras, números, `. _ : -` (até 128), começando por letra ou número. Compartilhado entre os usuários da conta; não guarde segredo.

## hold.ui

- `hold.ui.resize(height?)`: ajusta a altura do quadro. Sem argumento, mede o documento. Chame após renderizar.
- `hold.ui.toast(message, level)`: **a mensagem vem primeiro**; `level` é `'success' | 'info' | 'warning' | 'error'`
  (padrão `'info'`); mensagem em pt-BR. Ex.: `hold.ui.toast('Salvo', 'success')`.

## hold.nav

`hold.nav.open(target, id)` com `target` em `'budget' | 'task' | 'customer'` abre o registro na tela do Holdprint.

`hold.nav.openExternal(appId, { entity })` abre um app externo declarado em `contributes.externalApps` numa janela nova, com um contexto
assinado de 2 minutos (`<primeira origem do app>#hold_ctx=<jws>`). `entity` é **só** `{ type: 'budget', id }` (outro tipo: o SDK
recusa com erro claro); sem `entity`, abre o app sem registro escolhido. O Holdprint confere que o usuário vê o orçamento (senão não há
link, 404 `HOLD_PLUGIN_PLATFORM_68`). `appId` desconhecido dá erro. O app confere o contexto com `app.verifyContext(jws)` do
`HoldprintExternal`.

```js
await hold.nav.openExternal('tv', { entity: { type: 'budget', id: hold.context.launch.entity.id } });
```

`hold.disconnect()` encerra a ponte (raramente necessário).

## hold.modal

Só tem efeito quando `hold.context.surface === "modal"`; em página, `confirm` e `cancel` são **ignorados** sem erro.

- `hold.modal.isModal`: `true` se o plugin está num modal.
- `hold.modal.confirm(result?)`: fecha como **confirmado**. `result` é JSON de até 16 KiB (maior que isso, não vai). O Holdprint recarrega o orçamento e as tarefas e mostra "<ação> concluída".
- `hold.modal.cancel()`: fecha como cancelado, sem recarregar. X e ESC também cancelam; o SDK ouve o ESC dentro do quadro do modal (se o plugin
  usa ESC para outra coisa, `event.preventDefault()` no `keydown` impede o fechamento). Plugin desligado ou acesso perdido fecham como expirado.

```js
const hold = await Holdprint.connect();
const orcamentoId = hold.context.launch?.entity?.id;
async function enviar() {
  await hold.api.post('/tasks', { budgetId: orcamentoId, title: 'Proposta enviada' }, { idempotencyKey: `proposta-enviada-${orcamentoId}` });
  if (hold.modal.isModal) hold.modal.confirm({ enviada: true });
  else hold.ui.toast('Proposta registrada', 'success');
}
```
Confirme **depois** da escrita dar certo. Detalhes e o exemplo completo: `examples.md`, seção 6.

## hold.functions

`await hold.functions.call("integracao/teste", { ping: 1 })` chama a função do próprio plugin (POST em `/api/integracao/teste`, da versão que
está aberta, inclusive em prévia) com o token do usuário. Exige `functions.entry` no manifesto. Devolve o JSON da resposta; erro vira `HoldApiError`.

Dentro da função (não na tela) o SDK é outro: `import { createHold, HoldFunctionApiError, MissingSecretError } from "@holdprint/functions"`
e `const hold = createHold(request, env)` dá:

| Membro | O que é |
|---|---|
| `hold.trigger` | `"screen"`, `"schedule"`, `"event"`, `"hook"` ou `"manual"` |
| `hold.user` | `{ id }` na chamada da tela; `null` nas execuções sem usuário |
| `hold.installationId`, `hold.invocationId` | instalação e id desta execução |
| `hold.api.get(caminho, query?)`, `.post(caminho, corpo?, { idempotencyKey })`, `.put`, `.del` | API `/v1` com o token posto pela hospedagem; erro vira `HoldFunctionApiError` (`status`, `body`) |
| `hold.storage.get/set/put/list/delete(colecao, chave, valor)` | dado do plugin; `get` devolve o **valor** (ou `null`), não o registro `{ value }` que a API devolve; `put` = `set` |
| `hold.requireSecret("NOME")` | valor do segredo; se faltar, lança `MissingSecretError` com a instrução para gravar |
| `hold.verifyHmac(corpo, assinatura, valorDoSegredo, { prefix?, encoding?: "hex" \| "base64", algorithm?: "SHA-256" })` | confere HMAC de um hook em tempo constante; recebe o **valor** (use `hold.requireSecret`) |
| `hold.daysAgo(n)` / `hold.isoWeek()` | data ISO de n dias atrás / semana ISO (`2026-W43`), boa para chave de idempotência |

Veja `functions-reference.md`. Segredo nunca passa pela tela: não existe `hold.secrets` no navegador.

## Boas práticas

- Chame `hold.ui.resize()` depois de cada renderização.
- Trate `try/catch` em toda chamada e mostre erro amigável com `hold.ui.toast('Não foi possível ...', 'error')`.
- Não guarde o token nem reimplemente a renovação.

## Simulador e modo desenvolvedor

O código do plugin não muda entre o simulador (`holdprint dev`), o modo desenvolvedor (`holdprint plugin dev --account`) e o
Holdprint publicado: `Holdprint.connect()` e `hold.*` se comportam igual.

- **Simulador:** `hold.context` traz a Gráfica Exemplo e um usuário fictício; `hold.api`, `hold.sync` e `hold.storage` falam com uma
  API simulada em memória (mesmos escopos, cursor, `updated_since` e códigos de erro do `/v1`); `hold.nav.open` mostra um aviso na
  moldura em vez de navegar. Com ações de orçamento declaradas, o simulador mostra um orçamento fictício com o botão de cada ação; o modal é emulado, `hold.context.launch` traz esse orçamento e `confirm`/`cancel` mostram o toast do resultado; as ações de Novo registro ficam no botão **Novo registro** da moldura.
- **Modo desenvolvedor:** os dados são os reais da conta, mas só leitura. `hold.api.get`, `hold.api.list` e `hold.sync.pull` funcionam (o marcador do `sync.pull` fica só na memória da janela, então cada janela nova lê tudo de novo);
  `post`, `put`, `delete` e a escrita em `hold.storage` dão `HoldApiError` com `status` 403 (`HOLD_PLUGIN_PLATFORM_51`). O `HoldApiError.message` já vem explicado em português (também para `HOLD_PLUGIN_PLATFORM_9`, escopo não declarado no manifesto, e `_49`, modo desenvolvedor encerrado); `error.body` traz a lista de erros do `/v1`. Trate esse erro
  como esperado ao testar. Se a CLI parar, as chamadas passam a dar 410 (`HOLD_PLUGIN_PLATFORM_49`) e o Holdprint recarrega a versão publicada.
- Nenhum dos dois expõe o token ao código do plugin; continue sem pedir nem guardar token.

## HoldprintExternal (apps fora do Holdprint)

Outro SDK, para a página do **app externo** (TV, celular), não para o plugin dentro do Holdprint: carregue
`<id.domínio técnico>/sdk/external-v1.js` (local: `http://id.plugins.localhost:8787/sdk/external-v1.js`; nuvem de teste:
`https://id.hold.market/sdk/external-v1.js`). `Holdprint.connect()` **não** funciona fora do Holdprint.

- `HoldprintExternal.init({ pluginId, appId, identityBase?, apiBase?, persist? })`: sem `identityBase`, usa o endereço de onde o script veio;
  `persist` é `'session'` (padrão), `'local'` (TV/quiosque que continua logado depois de recarregar) ou `'memory'`.
- `app.signIn({ onCode, signal })`: com `onCode` é o fluxo `device` (`onCode` recebe `{ userCode, verificationUri, qrUrl, qrSvg, expiresIn, interval }`:
  mostre `userCode` e desenhe o QR com `el.innerHTML = info.qrSvg`; **`qrUrl` é o TEXTO dentro do QR, não uma imagem**, nunca `img.src`); sem `onCode` é o fluxo `web` (redireciona; na volta, `app.handleRedirect()` troca `code`/`state`, PKCE feito pelo SDK).
- `app.api.get/post/put/del(path)`: `/v1` pelo `api.<domínio técnico>` (local `http://api.plugins.localhost:8787`, nuvem de teste
  `https://api.hold.market`), com renovação automática. Só ali. Sessão sem volta dá `ExternalAuthError`; erro de dados, `HoldApiError`.
- `HoldprintExternal.qrSvg(texto, { size?, margin?, dark?, light? })`: SVG de QR gerado localmente (sem CDN); `info.qrSvg` já vem pronto.
- `app.isSignedIn()`, `app.signOut()` (revoga) e `app.verifyContext(jws)` (deep link assinado, conferido pelo JWKS; recusa com `ExternalContextError.reason`).
- **Nunca** peça senha, nem guarde token ou refresh fora do que o SDK guarda. Detalhes, exemplo e erros: `external-apps-reference.md`.
