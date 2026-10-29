# Exemplos

Ambos usam só o SDK, sem domínio externo, UI em pt-BR, com os contratos reais da API. Exemplo completo e publicável (KPIs,
grupos, contagem de follow-ups, anotação): `examples/vendas-por-vendedor` no repo holdprint-plugins.

## 1. Orçamentos abertos por vendedor, com follow-up

`holdprint.plugin.json`: escopos `budgets:read` e `tasks:write` (cada um com `purpose`); o nome do vendedor já vem no orçamento (`sellerName`).

`public/index.html`
```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vendas por vendedor</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Orçamentos abertos por vendedor</h1>
  <p id="estado">Carregando...</p>
  <div id="painel"></div>
  <script src="/_hold/sdk/v1.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

`public/app.js`
```js
const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const estado = document.getElementById('estado');
const painel = document.getElementById('painel');

function valor(b) {
  const ps = b.proposes || [];
  const ganha = ps.find((p) => p.isWinner);
  return ganha ? ganha.totalPrice : Math.max(0, ...ps.map((p) => p.totalPrice || 0));
}

function desenhar(hold, orcamentos) {
  const porVendedor = new Map();
  for (const b of orcamentos) {
    const nome = b.sellerName || 'Sem vendedor';
    if (!porVendedor.has(nome)) porVendedor.set(nome, []);
    porVendedor.get(nome).push(b);
  }
  painel.replaceChildren();
  for (const [nome, lista] of porVendedor) {
    const sec = document.createElement('section');
    const h = document.createElement('h2');
    h.textContent = `${nome} (${lista.length})`;
    sec.append(h);
    for (const b of lista) {
      const linha = document.createElement('div');
      linha.className = 'linha';
      const txt = document.createElement('span');
      txt.textContent = `#${b.code} · ${b.customerName} · ${brl(valor(b))}`;
      const btn = document.createElement('button');
      btn.textContent = 'Criar follow-up';
      btn.addEventListener('click', () => followUp(b, btn));
      linha.append(txt, btn);
      sec.append(linha);
    }
    painel.append(sec);
  }
  hold.ui.resize();
}

async function carregar(hold) {
  const todos = [];
  for (let page = 1; page <= 12; page++) {
    const res = await hold.api.get(`/budgets?state=open&pageSize=25&page=${page}`);
    todos.push(...res.data);
    estado.textContent = res.hasNextPage ? `Carregando ${todos.length} de ${res.totalCount}...` : '';
    desenhar(hold, todos);
    if (!res.hasNextPage) break;
  }
  if (!todos.length) estado.textContent = 'Nenhum orçamento aberto nos últimos 90 dias.';
}

async function followUp(b, btn) {
  btn.disabled = true;
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    await hold.api.post(
      '/tasks',
      { budgetId: b.id, title: `Follow-up do orçamento #${b.code}`, taskType: 1, duration: 15 },
      { idempotencyKey: `follow-up-${b.id}-${hoje}` }
    );
    hold.ui.toast('Tarefa de follow-up criada.', 'success');
  } catch (e) {
    hold.ui.toast('Não foi possível criar a tarefa: ' + e.message, 'error');
    btn.disabled = false;
  }
}

let hold;
(async () => {
  try {
    hold = await Holdprint.connect();
    await carregar(hold);
  } catch (e) {
    estado.textContent = 'Não foi possível carregar os orçamentos.';
  }
})();
```
Clicar duas vezes no mesmo dia não duplica a tarefa: a `Idempotency-Key` é a mesma.

## 2. Anotações com `hold.storage`

`holdprint.plugin.json`: `"scopes": []` (storage é implícito).

`public/app.js`
```js
const COLECAO = 'anotacoes';
const lista = document.getElementById('lista');
const texto = document.getElementById('texto');
let hold;

async function render() {
  const itens = await hold.storage.list(COLECAO); // [{ key, value, updatedAt, ... }]
  lista.replaceChildren();
  if (!itens.length) { lista.textContent = 'Nenhuma anotação ainda.'; }
  for (const it of itens) {
    const li = document.createElement('li');
    li.textContent = it.value.texto + ' ';
    const x = document.createElement('button');
    x.textContent = 'Apagar';
    x.addEventListener('click', async () => { await hold.storage.delete(COLECAO, it.key); render(); });
    li.append(x);
    lista.append(li);
  }
  hold.ui.resize();
}

document.getElementById('salvar').addEventListener('click', async () => {
  if (!texto.value.trim()) return;
  const chave = `n-${Date.now()}`;
  await hold.storage.set(COLECAO, chave, { texto: texto.value.trim(), autor: hold.context.user.name });
  texto.value = '';
  render();
});

(async () => { hold = await Holdprint.connect(); render(); })();
```
`hold.storage.set` grava o objeto como está e `list` devolve `{ collection, key, value, sizeBytes, updatedAt }` por item.

## 3. Sincronização incremental e avançar etapa

`holdprint.plugin.json`: escopos `budgets:read`, `funnels:read` e `budgets:move-step` (cada um com `purpose`; o último, ex.:
"Avançar o orçamento para a próxima etapa do funil"). Depois do `deploy`, mostre o link de consentimento ao Administrador.

`public/app.js`
```js
const hold = await Holdprint.connect();
const espelho = new Map(); // só em memória: hold.storage é compartilhado entre os usuários da conta

async function atualizar(completa) {
  try {
    const { changed, deleted } = await hold.sync.pull('budgets', completa ? { full: true } : {}); // ao abrir: tudo; depois: só o que mudou
    for (const b of changed) espelho.set(b.id, b);
    for (const b of deleted) espelho.delete(b.id);
    desenhar([...espelho.values()].filter((b) => b.budgetState === 1));
  } catch (e) {
    hold.ui.toast(e.status === 429 ? 'Limite de chamadas atingido, tente de novo em instantes' : 'Não foi possível atualizar', 'error');
  }
}

async function avancarEtapa(budget, proximaEtapaId) {
  const key = `step-${budget.id}-${proximaEtapaId}`; // derivada do fato, nunca aleatória
  const atualizado = await hold.api.put(`/budgets/${budget.id}/step`, { stepId: proximaEtapaId }, { idempotencyKey: key });
  espelho.set(atualizado.id, { ...budget, ...atualizado });
  desenhar([...espelho.values()].filter((b) => b.budgetState === 1));
}
await atualizar(true);
```
Pontos: botão "Atualizar" chama `atualizar()` (não recarrega a lista inteira); a etapa vem de `GET /funnels/{id}` (`steps`);
`400 _44` = etapa de outro funil, `400 _45` = orçamento não aberto, `404 _30` = orçamento que o usuário não vê.
Para listas grandes sob demanda use `for await (const b of hold.api.list('/budgets', { state: 'open' }))`.

## Exemplo: nova versão na nuvem de teste, prévia e release

Pedido: "muda a cor do cabeçalho do plugin de vendas e deixa eu ver antes de liberar pra equipe".

1. Edite só `public/style.css` (nunca arquivo de infraestrutura).
2. `holdprint plugin deploy --target teste` publica a v2 como **prévia** (a v1 segue liberada) e imprime
   `Prévia v2: <endereço>/plugins/<installationId>?versao=v2`.
3. Diga ao usuário, com as suas palavras: "Abra este link logado como Administrador. Você vê a faixa 'Prévia v2'; a equipe
   continua vendo a v1." Espere a confirmação.
4. Aprovada: `holdprint plugin release v2`. Se não gostou: edite de novo e rode `deploy` (vira v3); a v2 não é alterada.
5. Se a v2 liberada der problema: `holdprint plugin rollback v1`.
6. Depois de `release` ou `rollback`, a nuvem pode levar até ~60 s para refletir; reabra o quadro antes de dizer que não funcionou.

Nunca peça credencial da Cloudflare: se o deploy pedir algo de infraestrutura, mostre o erro e pare.

## Exemplo: ver o plugin antes de publicar

Pedido: "quero ver como está ficando o painel de vendas".

1. **Sem login, para desenhar:** `holdprint dev` na pasta do plugin. Abra `http://localhost:4790` no Chrome (a CLI abre sozinha), edite
   `public/` e a tela recarrega a cada salvamento. Os dados são da Gráfica Exemplo (fictícios). `holdprint dev --reset` zera o que o
   plugin gravou no simulador.
2. **Com dados reais, só você, só leitura:** depois de `holdprint login` (como Administrador) e do primeiro `deploy` aprovado, rode
   `holdprint plugin dev --account`. Abra o link `.../plugins/dev/<código>` que a CLI imprime, no Chrome. O quadro mostra a faixa
   "Modo desenvolvedor · servido de http://localhost:<porta> · só leitura · só nesta janela · [Sair]". Para encerrar: **Sair** na faixa
   ou **Ctrl+C** na CLI (o quadro volta para a versão publicada).
3. **Para mostrar a outra pessoa:** `holdprint plugin deploy` (da segunda versão em diante vira prévia) e envie o link
   `.../plugins/<installationId>?versao=vN` a um Administrador; depois `holdprint plugin release vN`. Não use o link do modo
   desenvolvedor (é de uso único e só funciona para você) e não abra túnel.

## 4. Atualizar sozinho quando um orçamento é ganho

Pedido: "faz um ranking de vendedores que atualiza sozinho quando um orçamento é ganho".

`holdprint.plugin.json` (acrescente aos escopos e ao manifesto; novo `deploy` pede novo consentimento):

```json
"scopes": [{ "scope": "budgets:read", "purpose": "Calcular o ranking de vendedores" }],
"events": { "subscribe": ["budget.won", "budget.step_changed"] }
```

`public/app.js`:

```js
const hold = await Holdprint.connect();
const espelho = new Map();

function aplicar({ changed, deleted }) {
  for (const b of changed) espelho.set(b.id, b);
  for (const b of deleted) espelho.delete(b.id);
  desenharRanking([...espelho.values()]); // ex.: somar por vendedor os orçamentos com budgetState === 3 (ganho)
}

aplicar(await hold.sync.pull('budgets', { full: true })); // carga inicial
const parar = hold.events.subscribe(['budget.won', 'budget.step_changed'], async () => {
  aplicar(await hold.sync.pull('budgets')); // só o que mudou, nunca a lista inteira
}, {
  onResync: async () => { espelho.clear(); aplicar(await hold.sync.pull('budgets', { full: true })); }, // cursor > 30 dias
});
window.addEventListener('pagehide', parar);
```

Pontos: o evento é só gatilho (entrega ao menos uma vez, sem ordem), a verdade vem do `sync.pull`; sem `webhook`, porque o plugin
não tem servidor. O exemplo completo é o `examples/vendas-por-vendedor` (v4). Para testar: `holdprint plugin listen --types budget.won`
e ganhe um orçamento pela tela; o painel aberto muda sozinho em até ~10 s.

Com backend próprio (opcional), um receptor Node que **confere a assinatura** antes de agir:

```js
import { createHmac, timingSafeEqual } from 'node:crypto';
function confere(req, corpo, segredo) { // segredo "whsec_..." de `holdprint plugin webhook-secret`
  const id = req.headers['webhook-id'], ts = req.headers['webhook-timestamp'];
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const esperado = createHmac('sha256', Buffer.from(segredo.replace('whsec_', ''), 'base64'))
    .update(`${id}.${ts}.${corpo}`).digest('base64');
  return req.headers['webhook-signature'].split(' ').some((s) => {
    const [, sig = ''] = s.split(',');
    return sig.length === esperado.length && timingSafeEqual(Buffer.from(sig), Buffer.from(esperado));
  });
}
// deduplique por `webhook-id` antes de processar; responda 2xx rápido.
```

## 5. Follow-up automático com função, agenda, segredo e hook

Referência completa e testada: `examples/follow-up-automatico` no repositório holdprint-plugins (tela, `functions/index.ts`,
manifesto e `CLAUDE.md`).

Pedido: "cria um plugin que todo dia cria uma tarefa de follow-up nos orçamentos abertos parados há 7 dias e tem um botão para
testar a integração com hp-teste-eco usando uma chave que eu vou guardar".

```
holdprint plugin create follow-up --template automacao
```

`holdprint.plugin.json` (acrescente ao gerado; o `deploy` pede consentimento):

```json
"scopes": [
  { "scope": "budgets:read", "purpose": "Achar os orçamentos abertos parados há 7 dias" },
  { "scope": "tasks:write",  "purpose": "Criar a tarefa de follow-up para o vendedor do orçamento" }
],
"events": { "subscribe": ["budget.won"] },
"functions": { "entry": "functions/index.ts",
  "schedules": [{ "id": "follow-up", "every": "1d", "path": "/api/agenda/follow-up", "description": "Follow-up" }],
  "events": { "path": "/api/eventos" },
  "hooks": [{ "name": "cobranca", "path": "/api/hooks/cobranca" }] },
"secrets": [
  { "name": "CHAVE_SERVICO", "description": "Chave da API do serviço de teste (hp-teste-eco)" },
  { "name": "SEGREDO_COBRANCA", "description": "Segredo que o sistema de cobrança usa para assinar os avisos" }
],
"network": { "domains": ["hp-teste-eco.rafael-7fa.workers.dev"] }
```

`storage` não entra em `scopes` (é implícito).

`functions/index.ts` (trechos do exemplo):

```ts
import { createHold, MissingSecretError, type HoldFunctionContext } from "@holdprint/functions";

const TAREFAS_POR_EXECUCAO = 20;   // limite de 50 chamadas por execução: o resto fica para a próxima
const TAREFAS_EM_PARALELO = 5;     // a execução tem 35 s: crie em lotes paralelos pequenos

function proximaSegundaAsNoveDeBrasilia(): string {   // igual em toda a semana: o corpo não muda entre repetições
  const hoje = new Date();
  const dias = ((8 - hoje.getUTCDay()) % 7) || 7;
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + dias, 12)).toISOString();
}

async function followUp(hold: HoldFunctionContext): Promise<Response> {
  const semana = hold.isoWeek();
  const progresso = await hold.storage.get<{ semana: string; cursor: string | null }>("follow-up", "progresso");   // valor ou null
  const cursor = progresso && progresso.semana === semana ? progresso.cursor : null;
  const pagina = await hold.api.get<{ data?: { id: string; code: number; sellerId?: string }[]; nextCursor?: string; hasMore?: boolean }>(
    "/budgets", { state: "Open", updated_before: hold.daysAgo(7), limit: TAREFAS_POR_EXECUCAO, cursor: cursor ?? undefined });
  const parados = pagina.data ?? [];
  for (let i = 0; i < parados.length; i += TAREFAS_EM_PARALELO) {
    await Promise.all(parados.slice(i, i + TAREFAS_EM_PARALELO).map((o) =>
      hold.api.post("/tasks",
        { budgetId: o.id, title: "Follow-up: 7 dias sem resposta", responsibleUserId: o.sellerId, schedulingTime: proximaSegundaAsNoveDeBrasilia() },
        { idempotencyKey: `follow-up-${o.id}-${semana}` })));   // chave da semana + corpo igual na semana inteira = não duplica e não dá 400
  }
  await hold.storage.set("follow-up", "progresso", { semana, cursor: pagina.hasMore ? pagina.nextCursor : null });
  console.log(`follow-up (${hold.trigger}): ${parados.length} orçamento(s)`);   // sem segredo e sem dado pessoal
  return Response.json({ ok: true, parados: parados.length });
}

async function testarIntegracao(hold: HoldFunctionContext): Promise<Response> {
  let chave: string;
  try { chave = hold.requireSecret("CHAVE_SERVICO"); }
  catch (e) { if (e instanceof MissingSecretError) return Response.json({ ok: false, mensagem: "Segredo CHAVE_SERVICO não definido" }); throw e; }
  const r = await fetch("https://hp-teste-eco.rafael-7fa.workers.dev/exige-chave", { headers: { "x-api-key": chave } });
  return Response.json({ ok: r.status === 200, mensagem: r.status === 200 ? "Chave aceita" : `Chave recusada (${r.status})` });
}

async function receberCobranca(hold: HoldFunctionContext, request: Request): Promise<Response> {
  const corpo = await request.text();
  const ok = await hold.verifyHmac(corpo, request.headers.get("x-signature") ?? "", hold.requireSecret("SEGREDO_COBRANCA"), { prefix: "sha256=" });
  if (!ok) return Response.json({ erro: "assinatura_invalida" }, { status: 401 });   // confira SEMPRE a assinatura do terceiro
  const aviso = JSON.parse(corpo) as { id: string; budgetId: string };
  await hold.api.post("/tasks", { budgetId: aviso.budgetId, title: "Cobrança: aviso do sistema de cobrança" }, { idempotencyKey: `cobranca-${aviso.id}` });
  return Response.json({ ok: true });
}
```

Na tela, o botão chama `await hold.functions.call("integracao/teste", {})` e mostra `resposta.mensagem`; "Últimas execuções" lê
`await hold.storage.get("follow-up", "execucoes")` (a função lê e grava com `hold.storage.get/set("follow-up", "execucoes", lista)`; a lista
lida vem pura, sem o registro `{ value }`, então `Array.isArray(salvas) ? salvas : []` antes do `unshift`).

Fluxo com o usuário (o Claude **não pede o valor do segredo no chat**):

1. `holdprint plugin deploy` e mostrar o link `/plugins/consent/<id>`: o Administrador aprova (a tela mostra "Hospedado pela Hold
   (Cloudflare)", "Roda sozinho: Follow-up, todo dia", "Fala com: hp-teste-eco.rafael-7fa.workers.dev" e "Recebe chamadas de: <URL do hook>").
2. Pedir ao usuário que grave os segredos: pela tela **Plugins > ⋯ > Segredos** ou, no terminal dele,
   `! holdprint plugin secrets set CHAVE_SERVICO`. Conferir sem ver o valor: `holdprint plugin secrets list` (mostra "definido em … por …").
3. Abrir o plugin e clicar **Testar integração**: "Chave aceita". Chave errada mostra "Chave recusada (401)" sem novo deploy.
4. Testar sem esperar o dia seguinte: `holdprint plugin run follow-up` (ou Plugins > ⋯ > Chamadas e cotas > Automações > **Executar agora**),
   depois `holdprint plugin logs --trigger manual` (ou a tela **Registros**). As tarefas aparecem nos orçamentos "via plugin <nome>",
   com o vendedor como responsável. Rodar de novo na mesma semana não duplica.
5. Hook: passar a URL do hook ao serviço de cobrança; para testar, `node scripts/hook-sender.mjs <installationId> cobranca --budget <id>`
   no repositório holdprint-plugins (assina com o segredo; sem assinatura válida a função responde 401).

## 6. Ação "Gerar proposta": modal no orçamento e "Proposta rápida" em Novo registro

Pedido: "cria um botão Gerar proposta no orçamento que abre um modal com a proposta na minha marca e, ao confirmar, registra uma tarefa
Proposta enviada". O código completo está em `examples/gerar-proposta` no repositório holdprint-plugins; abaixo, o essencial.
O `GET /v1/budgets/{id}` traz cada proposta com `paymentOption`, `totalPrice` e `isWinner`; `proposeItems` vem vazio (a lista de itens
não é exposta no `/v1`), então o documento mostra as **opções com pagamento e total**; se um dia vierem itens, o exemplo já desenha a tabela.
Fluxo: `holdprint plugin create <pasta> --template acao`, editar, `holdprint plugin validate`, testar em `holdprint dev`,
`holdprint plugin deploy` e mostrar o link de consentimento.

`holdprint.plugin.json`: plugin **só de ações** (sem `contributes.page`, então não entra no menu lateral; a "Proposta rápida" é a entrada
de página). `budgets:read` é obrigatório por causa da ação de orçamento; `tasks:write` registra o envio.
```json
{
  "schemaVersion": "2026-10-23",
  "slug": "gerar-proposta",
  "name": "Gerar proposta",
  "description": "Mostra a proposta do orçamento na marca da gráfica, baixa em HTML e, ao confirmar o envio, registra a tarefa \"Proposta enviada\" no orçamento.",
  "scopes": [
    {
      "scope": "budgets:read",
      "purpose": "Ler o orçamento (código, cliente, vendedor e valores das propostas) para montar a proposta"
    },
    {
      "scope": "tasks:write",
      "purpose": "Registrar a tarefa \"Proposta enviada\" no orçamento quando o envio é confirmado"
    }
  ],
  "contributes": {
    "actions": [
      {
        "id": "gerar-proposta",
        "title": "Gerar proposta",
        "icon": "file-text",
        "target": "budget",
        "open": "modal",
        "modal": {
          "size": "lg"
        }
      },
      {
        "id": "proposta-rapida",
        "title": "Proposta rápida",
        "icon": "bolt",
        "target": "new-record",
        "open": "page"
      }
    ]
  },
  "ui": {
    "dir": "public",
    "entry": "index.html"
  }
}
```

`public/index.html`: uma tela só para as duas ações; o `app.js` decide pelo contexto.
```html
<main>
  <p id="estado" class="muted" role="status">Conectando ao Holdprint...</p>
  <section id="escolher" hidden>            <!-- Proposta rápida: lista de orçamentos e busca por código -->
    <form id="busca"><input id="codigo" type="search" inputmode="numeric" placeholder="Código do orçamento"><button type="submit">Buscar</button></form>
    <ul id="lista" class="lista"></ul>
  </section>
  <section id="proposta" hidden>
    <button id="voltar" type="button" hidden>Voltar à lista</button>
    <button id="abrir-orcamento" type="button" hidden>Abrir orçamento no Holdprint</button>
    <article id="documento" class="documento"></article>
    <footer>
      <span id="enviada" hidden>Envio registrado</span>
      <button id="cancelar" type="button" hidden>Cancelar</button>
      <button id="baixar" type="button">Baixar proposta (HTML)</button>
      <button id="confirmar" type="button">Confirmar envio</button>
    </footer>
  </section>
</main>
<script src="/_hold/sdk/v1.js"></script>
<script src="app.js"></script>
```

`public/app.js` (resumido; a montagem completa do documento e o CSS da marca estão no exemplo)
```js
const TITULO_TAREFA = "Proposta enviada";
let hold, atual = null;

async function iniciar() {
  hold = await Holdprint.connect();
  // 1. Qual orçamento: SEMPRE do contexto validado no servidor, nunca da URL.
  const launch = hold.context.launch;
  if (launch && launch.target === "budget" && launch.entity && launch.entity.id) return abrirProposta(launch.entity.id);
  mostrarLista();   // "Proposta rápida" (Novo registro): launch.entity é null, o usuário escolhe
}

async function abrirProposta(budgetId) {
  try {
    atual = await hold.api.get("/budgets/" + encodeURIComponent(budgetId));   // GET /v1/budgets/{id}
  } catch (erro) {
    return mostrarEstado(erro.status === 404 ? "Orçamento não encontrado ou fora do seu acesso." : "Não foi possível carregar: " + erro.message, true);
  }
  $("documento").innerHTML = montarProposta(atual);   // marca = hold.context.account.name + cor; opções com pagamento e total (nunca custo/margem)
  $("cancelar").hidden = !hold.modal.isModal;          // no modal: Cancelar; na página: "Abrir orçamento no Holdprint"
  $("abrir-orcamento").hidden = hold.modal.isModal;
  $("proposta").hidden = false;
  hold.ui.resize();
}

async function carregarLista(codigo) {
  const pagina = await hold.api.get("/budgets" + (codigo ? "?code=" + encodeURIComponent(codigo) : "?state=Open&pageSize=20"));
  // desenha cada orçamento com o botão "Ver proposta" -> abrirProposta(orcamento.id)
}

function baixar() {   // download funciona no quadro (allow-downloads); não use window.open nem alert/confirm
  const url = URL.createObjectURL(new Blob([arquivoHtml(atual)], { type: "text/html;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: "proposta-" + atual.code + ".html" });
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function confirmarEnvio() {
  $("confirmar").disabled = true;
  try {
    // 2. Escrita idempotente: a chave vem do fato (orçamento + dia); duplo clique ou reabrir o modal não duplica.
    const tarefa = await hold.api.post("/tasks", {
      budgetId: atual.id, title: TITULO_TAREFA, responsibleUserId: hold.context.user.id, schedulingTime: new Date().toISOString().slice(0, 10) + "T12:00:00.000Z",
      description: "Proposta nº " + atual.code + " enviada para " + (atual.customerName || "o cliente") + " pelo plugin Gerar proposta."
    }, { idempotencyKey: "proposta-enviada-" + atual.id + "-" + new Date().toISOString().slice(0, 10) });
    if (tarefa && tarefa.id && !tarefa.isDone) await hold.api.put("/tasks/" + encodeURIComponent(tarefa.id) + "/complete");
    // 3. Só depois que gravou: fecha como confirmado (o Holdprint recarrega o orçamento e mostra "Gerar proposta concluída").
    if (hold.modal.isModal) return hold.modal.confirm({ budgetId: atual.id, code: atual.code, taskId: tarefa ? tarefa.id : null });
    $("enviada").hidden = false;   // na página não há modal para fechar
    hold.ui.toast("Envio da proposta nº " + atual.code + " registrado.", "success");
  } catch (erro) {
    mostrarEstado("Não foi possível registrar o envio: " + erro.message, true);   // o modal continua aberto
    $("confirmar").disabled = false;
  }
}

// botões: baixar, confirmarEnvio, cancelar -> hold.modal.cancel(), abrir-orcamento -> hold.nav.open("budget", atual.id)
iniciar();
```

Pontos a conferir com o usuário (e a mostrar no relatório):
1. `holdprint plugin validate` passa; `holdprint dev` abre a Gráfica Exemplo com um **orçamento fictício e o botão "Gerar proposta"**.
   Clicar abre o modal emulado; "Baixar proposta (HTML)" baixa o arquivo; "Confirmar envio" fecha com o toast do resultado e a tarefa
   "Proposta enviada" aparece no orçamento do simulador; repetir não cria segunda tarefa. "Novo registro" abre a Proposta rápida.
2. `holdprint plugin deploy` e o link `/plugins/consent/<id>` para um Administrador aprovar (escopos `budgets:read` e `tasks:write`;
   marcar os perfis de vendedor que vão usar o botão).
3. No Holdprint: orçamento > ícone de raio > **Plugins > Gerar proposta** abre o modal com a proposta daquele orçamento; "Confirmar envio"
   fecha, o orçamento recarrega com a tarefa e aparece "Gerar proposta concluída"; X, ESC e Cancelar fecham sem gravar.
   **Novo registro > Plugins > Proposta rápida** abre como página. O plugin não aparece no menu lateral (só de ações), só na tela Plugins.
4. A "marca" é a identidade da **gráfica** (nome da conta em `hold.context.account.name`, monograma e `COR_DA_MARCA` no `app.js`);
   imagens e fontes ficam dentro de `public/` (sem CDN, a CSP é `connect-src 'self'`).

## 7. Mandar o plugin para outra gráfica por link

Pedido: "cria um plugin que mostra os orçamentos ganhos do mês por vendedor e deixa pronto para eu mandar por link para outra gráfica".

1. Crie o plugin como no exemplo 1, **sem `secrets`** (só `budgets:read`, `users:read` com propósito) e acrescente ao manifesto:
```json
"listing": {
  "summary": "Orçamentos ganhos do mês por vendedor, atualizados sozinhos",
  "category": "relatorios",
  "highlights": ["Total ganho por vendedor", "Filtro por mês", "Dados só da sua gráfica"]
}
```
   (`support` é opcional: só acrescente um e-mail ou `https://` que o usuário informar.)
2. `holdprint plugin validate`, depois `holdprint plugin deploy`. Peça ao Administrador da conta dona que aprove em `/plugins/consent/<id>`; ele já vê o plugin em
   **Marketplace > Da sua conta**.
3. `holdprint plugin publish --unlisted --max-accounts 3 --expires 30d`. A CLI imprime o link uma única vez
   (`<endereço do Holdprint>/plugins/install/<pluginId>.<token>`, sem `#`; `--expires` até `90d`, `--max-accounts` até 10). Diga ao usuário, com as suas palavras:
   "Aqui está o link (ele só aparece agora; guarde com você). Quem abrir precisa ser **Administrador** da outra gráfica; ele confere o que o plugin acessa e aprova.
   Na gráfica dele o plugin mostra os orçamentos **dele**, com dados e registros separados dos seus. Ele vê "Publicado por outra conta" com o
   nome da sua conta, e o plugin aparece no Marketplace dele em Recebidos por link." **Não grave o link em arquivo do projeto.**
4. Depois que a outra gráfica instalar: `holdprint plugin links` mostra o nome da conta e a data. Para cortar novos convites: `holdprint plugin links --revoke <linkId>`
   (as instalações já feitas continuam).
5. Se o usuário pedir uma chave de serviço externo nesse plugin, explique que plugin enviado a outra conta não pode declarar `secrets` (`409 _74`) e ofereça a
   versão sem segredo.

## 8. Duas pessoas, duas conversas (conta existente e conta nova)

**Administrador de uma conta (já tem login).** Frase: "Cria um plugin que mostra os orçamentos ganhos do mês e manda para aprovação da Hold."
1. `holdprint whoami` mostra usuário, conta e perfil Administrador: segue sem perguntar nada.
2. Cria, valida e faz `deploy` como no exemplo 1 (sem `secrets`, com `listing`); depois de aprovado o consentimento, `holdprint plugin release`.
3. Como ele pediu aprovação da Hold: `holdprint plugin submit --note "Orçamentos ganhos do mês por vendedor"`.
4. Diz: "Mandei para a Hold analisar. Quando aprovar, aparece para todas as gráficas. Peça 'como está o pedido' quando quiser." Acompanha com
   `holdprint plugin submission` (`Em análise pela Hold`, `No Marketplace` ou `Recusado: <motivo>`; recusado: corrige e pede de novo).

**Pessoa sem conta (vibe coder).** Frase: "Quero um plugin de painel de vendas e publicar para outras gráficas. Ainda não tenho conta."
1. `holdprint whoami` diz que não há login. Pergunta uma vez: "Você já tem conta no Holdprint?" Resposta: "Não."
2. Começa mesmo assim no simulador: `holdprint plugin create`, `holdprint dev` com a Gráfica Exemplo, e mostra a tela a ele.
3. Quando ele quer publicar: "Para publicar você precisa de uma conta de teste grátis. Abra `<endereço do Holdprint>/holdai/register`, crie a conta, ative pelo
   e-mail e me avise." Ele avisa; `holdprint login` (código e link no navegador), `holdprint plugin deploy`, link de consentimento para o Administrador (ele mesmo).
4. Só depois do pedido dele ("publica para todo mundo"): `holdprint plugin release`, `holdprint plugin submit --note "..."` e o acompanhamento do exemplo acima.

## 9. Um plugin em vários lugares: página em Produção, botão na ordem, lote nos selecionados, aba no cliente e card na Visão Geral

Pedido: "Quero um painel de conferência da produção: uma tela no menu Produção, um botão **Conferida** na ordem de produção, o mesmo botão para as ordens que eu marcar na lista,
uma aba **Conferências** no cliente e um card na tela inicial com o que foi conferido hoje."
Antes de escrever, diga ao usuário onde cada coisa vai aparecer (uma frase por lugar) e que o plugin vai **ler** jobs e clientes (escopos `jobs:read` e `customers:read`),
sem escrever no ERP: a marca "conferida" fica só no próprio plugin (`hold.storage`).

`holdprint.plugin.json` (um escopo por tela usada; `storage` é implícito):
```json
{
  "schemaVersion": "2026-10-23",
  "slug": "conferencia-producao-k3x9",
  "name": "Conferência da produção",
  "description": "Marca ordens de produção como conferidas, uma a uma ou em lote, e mostra o que foi conferido no cliente e na Visão Geral.",
  "scopes": [
    { "scope": "jobs:read", "purpose": "Ler a ordem de produção que está sendo conferida" },
    { "scope": "customers:read", "purpose": "Mostrar o nome do cliente na aba Conferências" }
  ],
  "contributes": {
    "pages": [
      { "id": "painel", "menuTitle": "Conferência", "icon": "clipboard-check", "group": "production" }
    ],
    "actions": [
      { "id": "conferir", "title": "Conferida", "icon": "check", "target": "job", "open": "modal", "modal": { "size": "md" } },
      { "id": "conferir-lote", "title": "Conferir selecionadas", "icon": "check", "target": "job-list", "open": "modal", "modal": { "size": "lg" } }
    ],
    "tabs": [ { "id": "conferencias", "title": "Conferências", "target": "customer" } ],
    "cards": [ { "id": "hoje", "title": "Conferidas hoje", "size": "small" } ]
  },
  "ui": { "dir": "public", "entry": "index.html" }
}
```
(`group: "production"` coloca a página no menu **Produção**; `target: "job"` é o detalhe da ordem e `job-list` a lista, sobre as ordens marcadas.)

`public/index.html`: só o contêiner, o SDK e o `app.js` (a CSP não aceita script no meio do HTML).
```html
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link rel="stylesheet" href="style.css"></head>
<body><div id="app">Carregando...</div>
<script src="/_hold/sdk/v1.js"></script><script src="app.js"></script></body></html>
```

`public/app.js`: **um HTML, várias telas**: quem decide é o `hold.context`.
```js
const app = document.getElementById('app');
const hoje = () => new Date().toISOString().slice(0, 10);

async function marcar(entidade) {
  await hold.storage.set('conferidas', entidade.id, { id: entidade.id, codigo: entidade.code, titulo: entidade.title, dia: hoje() });
}
async function conferidas() { return (await hold.storage.list('conferidas')).map((r) => r.value); }
function linha(c) { return `<li>#${c.codigo ?? c.id} ${c.titulo ?? ''} em ${c.dia.split('-').reverse().join('/')}</li>`; }

function desenhar(html) { app.innerHTML = html; hold.ui.resize(); }

async function modalUm(job) {          // botão na ordem de produção: launch.entity
  const dados = await hold.api.get(`/jobs/${job.id}`);   // exige jobs:read
  desenhar(`<h3>Conferir ordem ${job.code ?? ''}</h3><p>${dados.title ?? job.title ?? ''} (${dados.totalPrice != null ? 'R$ ' + dados.totalPrice : 'sem valor'})</p><button id="ok">Marcar como conferida</button>`);
  document.getElementById('ok').onclick = async () => {
    try { await marcar(job); hold.modal.confirm({ jobId: job.id }); }   // confirma DEPOIS de gravar
    catch (e) { hold.ui.toast('Não foi possível marcar a ordem', 'error'); }
  };
}

async function modalLote(itens) {      // botão em lote: launch.entities (até 100)
  desenhar(`<h3>Conferir ${itens.length} ordens</h3><ul>${itens.map(linha2).join('')}</ul><button id="ok">Marcar todas</button>`);
  document.getElementById('ok').onclick = async () => {
    try { for (const j of itens) await marcar(j); hold.modal.confirm({ total: itens.length }); }
    catch (e) { hold.ui.toast('Não foi possível marcar todas', 'error'); }
  };
}
const linha2 = (j) => `<li>#${j.code ?? j.id} ${j.title ?? ''}</li>`;

async function abaCliente(cliente) {   // aba: launch.entity é o cliente aberto (sem actionId)
  const dados = await hold.api.get(`/customers/${cliente.id}`);   // exige customers:read
  const todas = await conferidas();
  desenhar(`<h3>${dados.fullName ?? dados.name ?? cliente.title}</h3><p>Conferências feitas no plugin:</p><ul>${todas.map(linha).join('') || '<li>Nenhuma ainda</li>'}</ul>`);
}

async function card() {                // card: sem launch; a altura vem do hold.ui.resize (teto do size)
  const feitas = (await conferidas()).filter((c) => c.dia === hoje());
  desenhar(`<strong>${feitas.length}</strong> conferidas hoje`);
}

async function pagina(id) {            // menu: hold.context.page é o id declarado em pages
  const todas = (await conferidas()).sort((a, b) => b.dia.localeCompare(a.dia));
  desenhar(`<h2>Conferência da produção</h2><ul>${todas.map(linha).join('') || '<li>Nenhuma ordem conferida</li>'}</ul>`);
}

let hold;
(async () => {
  hold = await Holdprint.connect();
  const { surface, page, launch } = hold.context;
  try {
    if (surface === 'card') await card();
    else if (surface === 'tab') await abaCliente(launch.entity);
    else if (launch?.entities) await modalLote(launch.entities);
    else if (launch?.entity) await modalUm(launch.entity);
    else await pagina(page);
  } catch (e) { desenhar('<p>Não foi possível carregar. Tente de novo.</p>'); }
})();
```

Passo a passo para o usuário: `holdprint plugin validate` (a CLI explica em português qualquer erro de grupo, alvo ou escopo), `holdprint dev` para ver no simulador (menu Produção,
lista de ordens com caixas de seleção e o botão de lote, cliente com a aba, Visão Geral com o card) e `holdprint plugin deploy`. Como `jobs:read` e `customers:read` são escopos **novos**
no plugin, o Administrador precisa aprovar em `/plugins/consent/<id>`; a tela mostra "Onde o plugin aparece" com a página em Produção, as duas ações, a aba e o card.
Depois: ordem de produção > botão **Plugins** > Conferida (no Atendimento por tipo, o ícone de quebra-cabeça no canto do card da ordem); lista de Jobs > marcar > Conferir selecionadas; cliente > aba Conferências; Visão Geral > seção Plugins.
