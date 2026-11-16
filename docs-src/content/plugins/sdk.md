# SDK do plugin

O SDK é a única forma de a tela do plugin falar com o Holdprint. Ele cuida do aperto de mão com o sistema, do token (que nunca aparece no seu código) e da renovação.

```html
<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><link rel="stylesheet" href="style.css"></head>
  <body>
    <div id="app">Carregando...</div>
    <script src="/_hold/sdk/v1.js"></script>
    <script src="app.js"></script>
  </body>
</html>
```

```js
const hold = await Holdprint.connect();
```

`connect()` falha se a página não estiver dentro do Holdprint (ou do simulador). O mesmo código funciona no simulador (`holdprint dev`), no modo desenvolvedor e no Holdprint publicado.

Regras da tela:
- Só `hold.*`: nada de `fetch` para o Holdprint, token na mão, `postMessage` manual ou leitura de `window.parent`.
- Sem domínio externo: a política de segurança é `connect-src 'self'`. Coloque bibliotecas, fontes e imagens dentro de `public/`.
- Interface em português do Brasil, datas `dd/mm/aaaa`, moeda `R$ 1.234,56`, com estados de carregando, vazio e erro.

## `hold.context`

```js
hold.context
// {
//   user: { id, name }, account: { id, name }, installationId, pluginId, locale,
//   surface: "page" | "modal" | "tab" | "card",
//   page,    // id da página aberta (só em surface "page"); "main" em plugin com `page` único
//   tab,     // id da aba (só em surface "tab")
//   card,    // id do card (só em surface "card")
//   launch   // null ou { actionId, actionTitle, target, entity, entities }
// }
```

| `surface` | Quando | `launch` |
|---|---|---|
| `page` | Item do menu, ou ação com `open: "page"` | `null` pelo menu; com ação, o `launch` da ação |
| `modal` | Ação com `open: "modal"` | o `launch` da ação |
| `tab` | Aba no orçamento ou no cliente | `entity` do registro aberto, sem `actionId` |
| `card` | Card da Visão Geral | `null` |

Um único HTML serve a todos os lugares. Decida o que desenhar pelo contexto, nunca pela URL:

```js
const hold = await Holdprint.connect();
const { surface, page, tab, card, launch } = hold.context;
if (surface === "card") desenharCard(card);
else if (surface === "tab") desenharAba(tab, launch.entity);
else if (launch?.entities) desenharLote(launch.entities);
else if (launch?.entity) desenharRegistro(launch.entity);
else desenharPagina(page);
```

### `launch.entity` e `launch.entities`

```js
launch.target    // "budget", "job-list", "new-record", ...
launch.entity    // { type, id, code, title, subtype? } no detalhe; null no lote e em Novo registro
launch.entities  // [{ type, id, code, title, subtype? }, ...] no lote (1 a 100); null fora do lote
```

| Campo | O que é |
|---|---|
| `type` | `budget`, `customer`, `job`, `expense`, `income`, `invoice`... (ver alvos no [Manifesto](04-manifesto.md#alvos-target)) |
| `id` | Id do registro, para ler com `hold.api.get` |
| `code` | Código legível quando existe (orçamento, job); `null` nos demais |
| `title` | Texto legível: título do orçamento, nome do cliente, descrição da conta... |
| `subtype` | Só em nota fiscal: `nfe`, `nfse`, `nfce`, `mdfe` ou `commercial-invoice` |

O `launch` é **validado pelo Holdprint**: o registro é da conta e o usuário pode vê-lo. Use sempre `hold.context.launch.entity.id`; nunca leia id da URL (`location`, query ou hash), que pode ser trocada.

Ler o registro aberto:

```js
const id = hold.context.launch?.entity?.id;
if (!id) { /* aberto pelo menu ou por Novo registro: mostre um seletor */ }
const job = await hold.api.get(`/jobs/${id}`);   // exige jobs:read
```

Em lote, leia item a item com poucas chamadas por vez (a cota é de 300 por minuto):

```js
for (const e of hold.context.launch.entities) {
  const job = await hold.api.get(`/jobs/${e.id}`);
  // ...
}
```

**Deep link.** `{APP_URL}/plugins/<installationId>?acao=<actionId>&id=<id do registro>` abre a ação como página (`surface: "page"`), com o mesmo `launch` validado.

## `hold.api`

```js
hold.api.get(path, opts)
hold.api.post(path, body, opts)
hold.api.put(path, body, opts)
hold.api.del(path, opts)
hold.api.list(path, query)   // iterador que segue o cursor
```

- `path` é relativo à [API /v1](06-api-v1.md): `'/budgets?state=open&pageSize=25&page=1'`.
- Devolve o JSON da resposta. Listas paginadas vêm em `res.data`.
- `opts.idempotencyKey` vira o cabeçalho `Idempotency-Key` (use em toda escrita).
- Erro HTTP lança `HoldApiError` com `status`, `body` (a lista de erros da plataforma) e `message` (`Holdprint API <status>: ...`, já com explicação em português nos casos comuns).
- `401`: o SDK renova o token e repete uma vez.
- `429`: o SDK espera o `Retry-After` e repete uma vez; se persistir, lança o erro (`HOLD_PLUGIN_PLATFORM_39` cota diária ou `_40` por minuto). Mostre "Limite de chamadas atingido, tente de novo em instantes" e não faça laço.

```js
const res = await hold.api.get("/budgets?state=open&pageSize=25&page=1");
desenhar(res.data);   // { data, totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage }
```

```js
for await (const b of hold.api.list("/budgets", { state: "open" })) desenhar(b);   // páginas de até 100
```

```js
const res = await hold.api.post("/jobs/query", {
  where: { deleted: { eq: false }, isFinalized: { eq: false }, deliveryNeeded: { lte: new Date().toISOString() } },
  fields: ["id", "code", "title", "customerId", "deliveryNeeded", "totalPrice"],
  sort: "deliveryNeeded",
  limit: 100
}); // { data, nextCursor }; próxima página: mesmo corpo com cursor: res.nextCursor
```

### Escrita idempotente

Toda escrita leva uma chave derivada do **fato** (nunca aleatória) e o **corpo idêntico** em toda repetição. Assim, clicar duas vezes ou reabrir o modal não duplica.

```js
const hoje = new Date().toISOString().slice(0, 10);
const tarefa = await hold.api.post("/tasks",
  { budgetId, title: "Proposta enviada", schedulingTime: `${hoje}T12:00:00.000Z` },
  { idempotencyKey: `proposta-enviada-${budgetId}-${hoje}` });
```

A mesma chave com corpo diferente é recusada (`400 HOLD_GENERAL_6`): não ponha `new Date()` com hora, contador ou texto variável no corpo.

## `hold.sync`: sincronização incremental

Para listas que o plugin reaproveita (`budgets`, `customers`, `tasks`), não releia tudo a cada abertura:

```js
const { changed, deleted, syncToken } = await hold.sync.pull("budgets");          // incremental
const tudo = await hold.sync.pull("budgets", { full: true });                      // leitura completa
```

- Na primeira chamada traz tudo; nas seguintes, só o que mudou desde a anterior. O SDK guarda o marcador por usuário e tira duplicados.
- `deleted` traz os excluídos (`{ id, deleted: true }`): remova do seu espelho.
- O usuário só sincroniza o que a tela dele mostra (um vendedor só os próprios orçamentos).
- Mantenha o espelho **em memória**, na tela.

```js
const espelho = new Map();
async function sincronizar(completa) {
  const { changed, deleted } = await hold.sync.pull("budgets", completa ? { full: true } : {});
  for (const b of changed) espelho.set(b.id, b);
  for (const b of deleted) espelho.delete(b.id);
}
await sincronizar(true);
```

## `hold.events`: reagir ao que acontece

```js
const parar = hold.events.subscribe(["budget.won", "budget.step_changed"], async (eventos) => {
  await hold.sync.pull("budgets");
  desenhar();
}, { onResync: () => hold.sync.pull("budgets", { full: true }) });
window.addEventListener("pagehide", parar);
```

- Consulta o feed a cada 5 s (`intervalMs`), pausa com a aba escondida e retoma de onde parou.
- O evento só **avisa** (traz identificadores, nunca o dado): reconcilie com `hold.sync.pull` do recurso afetado.
- Entrega "ao menos uma vez, sem ordem": o SDK já tira duplicados por `data.id`.
- Se o marcador passar de 30 dias, chama `onResync`. Opções: `intervalMs`, `limit`, `onResync`, `onError`.
- Tipos: `budget.won`, `budget.step_changed` (`budgets:read`), `task.created`, `task.completed` (`tasks:read`), `customer.created` (`customers:read`). Declare em `events.subscribe` do manifesto.
- O feed não gasta a cota diária (conta só no limite por minuto). Um `subscribe` por tela basta.

## `hold.storage`: dados do próprio plugin

```js
await hold.storage.set("anotacoes", `orcamento-${id}`, { texto: "Cliente pediu amostra" });
const nota = await hold.storage.get("anotacoes", `orcamento-${id}`);   // o valor, ou null
const todas = await hold.storage.list("anotacoes");                     // [{ collection, key, value, sizeBytes, updatedAt }]
await hold.storage.delete("anotacoes", `orcamento-${id}`);
```

> **Atenção: `hold.storage` é compartilhado por todos os usuários da conta.** Qualquer pessoa que abre o plugin lê o que outra gravou. **Nunca guarde dado do ERP** (orçamentos, clientes, valores, tarefas): uma cópia feita pelo Administrador ficaria visível para um vendedor que não tem acesso àqueles registros. Use o storage para dado do próprio plugin: preferências, anotações, progresso de uma agenda. Também não guarde senha nem segredo.

- Não precisa de escopo.
- Limites: 256 KiB por registro e 5 mil registros por plugin. `collection`: minúsculas, números, `-` e `_` (até 64). `key`: letras, números e `. _ : -` (até 128), começando por letra ou número.
- `localStorage` do navegador só para preferência visual do próprio usuário; nunca para dado de negócio.

## `hold.ui`

```js
hold.ui.resize();                        // ajusta a altura do quadro ao conteúdo (chame após desenhar)
hold.ui.resize(320);                     // altura fixa em px
hold.ui.toast("Salvo", "success");      // "success" | "info" | "warning" | "error" (padrão "info")
```

Em aba e card, `resize` é o que define a altura: o card cresce até o teto do tamanho (`small` 200 px, `medium` 360 px, `large` 560 px) e o resto rola dentro dele.

## `hold.nav`

```js
hold.nav.open("budget", id);    // "budget" | "task" | "customer": abre o registro no Holdprint
await hold.nav.openExternal("tv", { entity: { type: "budget", id } });  // abre um app externo declarado
```

`openExternal` aceita só orçamento como registro e passa ao app um contexto assinado de 2 minutos.

## `hold.modal`

Só tem efeito quando `surface === "modal"`.

```js
if (hold.modal.isModal) hold.modal.confirm({ taskId: tarefa.id });   // fecha como confirmado; resultado até 16 KiB
hold.modal.cancel();                                                 // fecha como cancelado
```

- `confirm` faz o Holdprint recarregar o registro e mostrar "<título da ação> concluída". **Confirme só depois que a escrita deu certo**; se falhar, `hold.ui.toast(..., "error")` e deixe o modal aberto.
- O X e a tecla Esc cancelam (se o plugin usa Esc para outra coisa, `event.preventDefault()` no `keydown`). Clicar fora não fecha.
- Plugin desligado ou acesso perdido com o modal aberto fecham como expirado.
- Em página, aba e card, `confirm` e `cancel` são ignorados.

## `hold.functions.call`

```js
const r = await hold.functions.call("integracao/teste", { ping: 1 });   // POST /api/integracao/teste da função do plugin
```

Chama a função do próprio plugin com o usuário da tela. Exige `functions.entry` no manifesto. Numa prévia, chama as funções da própria versão.

`hold.disconnect()` encerra a ponte (raramente necessário).

## Exemplo: botão no orçamento com modal

```js
const hold = await Holdprint.connect();
const orcamentoId = hold.context.launch?.entity?.id;

document.querySelector("#enviar").onclick = async () => {
  const hoje = new Date().toISOString().slice(0, 10);
  try {
    const tarefa = await hold.api.post("/tasks",
      { budgetId: orcamentoId, title: "Proposta enviada", responsibleUserId: hold.context.user.id, schedulingTime: `${hoje}T12:00:00.000Z` },
      { idempotencyKey: `proposta-enviada-${orcamentoId}-${hoje}` });
    await hold.api.put(`/tasks/${tarefa.id}/complete`);
    if (hold.modal.isModal) hold.modal.confirm({ taskId: tarefa.id });
    else hold.ui.toast("Proposta registrada", "success");
  } catch (e) {
    hold.ui.toast("Não foi possível registrar a proposta.", "error");
  }
};
```

## Funções

Funções são o código do plugin que roda na hospedagem da Hold, sem navegador aberto: numa agenda, ao receber um evento, quando um serviço externo chama (hook), por "Executar agora" ou a pedido da tela. Use só quando a tela não resolve.

```ts
import { createHold } from "@holdprint/functions";   // a CLI resolve, sem npm install

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    const hold = createHold(request, env);
    const caminho = new URL(request.url).pathname;
    if (caminho === "/api/agenda/follow-up") return followUp(hold);
    return Response.json({ error: "not_found" }, { status: 404 });
  }
};

async function followUp(hold) {
  const progresso = (await hold.storage.get("follow-up", "progresso")) ?? {};
  const pagina = await hold.api.get("/budgets", { state: "Open", updated_before: hold.daysAgo(7), limit: 20, cursor: progresso.cursor });
  for (const b of pagina.data) {
    await hold.api.post("/tasks", { budgetId: b.id, title: "Follow-up" },
      { idempotencyKey: `follow-up-${b.id}-${hold.isoWeek()}` });
  }
  await hold.storage.set("follow-up", "progresso", { cursor: pagina.nextCursor });
  return Response.json({ criadas: pagina.data.length });
}
```

| Membro de `hold` (na função) | O que é |
|---|---|
| `trigger` | `"screen"`, `"schedule"`, `"event"`, `"hook"` ou `"manual"` |
| `user` | `{ id }` quando chamada pela tela; `null` nas demais |
| `installationId`, `invocationId` | Instalação e id desta execução |
| `api.get(caminho, query?)`, `.post(caminho, corpo?, { idempotencyKey })`, `.put`, `.del` | A mesma API /v1; erro vira `HoldFunctionApiError` (`status`, `body`) |
| `storage.get/set/put/list/delete` | O mesmo storage do plugin; `get` devolve o valor (ou `null`) |
| `requireSecret("NOME")` | Valor do segredo; se faltar, lança `MissingSecretError` explicando como gravar |
| `verifyHmac(corpo, assinatura, valorDoSegredo, { prefix?, encoding?, algorithm? })` | Confere a assinatura de um hook, em tempo constante |
| `daysAgo(n)`, `isoWeek()` | Data ISO de n dias atrás e semana ISO (ex.: `2026-W46`), boas para chaves de idempotência |

Regras:
- **Quem chama.** Pela tela, a função usa o usuário (vê o que ele vê). Agenda, evento, hook e "Executar agora" rodam como a **instalação**: só os escopos aprovados, sobre a conta toda. Tarefa criada assim sai "via plugin <nome>".
- **Limites por execução:** 50 chamadas à API e 35 s. Processe até ~20 itens por vez e guarde o progresso no storage.
- **Agenda:** `15m`, `30m`, `1h`, `6h`, `12h` ou `1d`. O horário é espalhado entre as contas; agenda perdida roda uma vez ao voltar; plugin desligado não roda.
- **Serviço externo:** `fetch` só para os domínios de `network.domains`; outro domínio é bloqueado.
- **Hook:** confira sempre a assinatura do terceiro com um segredo; sem isso, qualquer pessoa com a URL dispara a função.
  ```ts
  const corpo = await request.text();
  const ok = await hold.verifyHmac(corpo, request.headers.get("x-signature") ?? "", hold.requireSecret("SEGREDO_COBRANCA"), { prefix: "sha256=" });
  if (!ok) return Response.json({ erro: "assinatura_invalida" }, { status: 401 });
  ```
- **Registros:** `console.log` vira registro (até 50 linhas de 2 KiB por execução, guardados 7 dias), visto em **Plugins > ⋯ > Registros** ou `holdprint plugin logs`. Nunca registre segredo nem dado pessoal.
- **Laço:** evento causado pelo próprio plugin não dispara as funções dele.
- Teste a agenda **duas vezes** (`holdprint plugin run <agenda>` 2×): a segunda lê o que a primeira gravou.

## Apps externos: `HoldprintExternal`

Para uma página **fora** do Holdprint (TV da produção, celular) que lê dados da conta como o usuário que entrou. Declare o app em `contributes.externalApps` e carregue o SDK externo:

```html
<script src="https://id.{DOMINIO_TECNICO}/sdk/external-v1.js"></script>
```

```js
const app = HoldprintExternal.init({ pluginId: "p-abc123defg", appId: "tv", persist: "local" });
await app.signIn({ onCode: (info) => {
  document.querySelector("#codigo").textContent = info.userCode;
  document.querySelector("#qr").innerHTML = info.qrSvg;          // QR pronto, sem biblioteca externa
}});
const jobs = await app.api.post("/jobs/query", { where: { deleted: { eq: false }, isFinalized: { eq: false } }, limit: 50 });
```

- `kind: "device"` (TV): mostra código e QR; a pessoa aprova no Holdprint pelo celular ou computador. `kind: "web"`: `app.signIn()` redireciona e `app.handleRedirect()` conclui na volta.
- `persist`: `"session"` (padrão), `"local"` (TV que continua logada) ou `"memory"`.
- `app.api.get/post/put/del` falam com `https://api.{DOMINIO_TECNICO}/v1`, só a partir da origem registrada.
- `app.isSignedIn()`, `app.signOut()` (revoga) e `app.verifyContext(jws)` (confere o contexto assinado enviado por `hold.nav.openExternal`).
- Nunca peça senha e nunca guarde token fora do que o SDK guarda. A pessoa revoga em **Plugins > Acessos conectados**.

## Boas práticas

- `try/catch` em toda chamada, com mensagem amigável em `hold.ui.toast`.
- `hold.ui.resize()` depois de desenhar.
- Lista vazia para um vendedor pode ser só permissão: desenhe "Nenhum registro disponível para o seu perfil".
- Pagine (`pageSize` 25 em `/budgets`) e desenhe conforme as páginas chegam.
