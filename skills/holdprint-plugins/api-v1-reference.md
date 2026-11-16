# API /v1

Chamada pelo SDK: `hold.api.get('/budgets?...')` vira `/_hold/v1/budgets` na própria origem e chega na WebApi em
`api/v1/budgets`. O token do quadro vai no Bearer; a WebApi confere assinatura, expiração, instalação ativa e escopo.
O plugin vê o que o usuário logado vê: o token só traz os escopos concedidos que o perfil de quem abriu a tela pode usar
(`budgets:read`, `funnels:read`, `tasks:*` pedem o painel de Negociações; `customers:read`, a tela de Clientes) e as
respostas seguem a mesma regra da tela: sem "ver negociações de outros vendedores", `/budgets` força `sellerId` = o próprio
usuário (outro `sellerId` devolve `data: []`), `/tasks` só traz tarefas desses orçamentos e escrever em orçamento invisível
dá 404 `_30`; `/customers` aplica a carteira de clientes do perfil. Escopo novo só vale depois do consentimento de um
Administrador.
Só existe o que está nesta página: nenhuma rota `api/...` do ERP é acessível a plugin.

## Rotas

| Rota | Escopo | Observação |
|---|---|---|
| `GET /v1/me` | nenhum | Usuário e conta do token. Com token de **instalação** (agenda, evento, hook, "Executar agora") devolve `{ principal: "installation", installationId, pluginId, account }` |
| `GET /v1/budgets` | `budgets:read` | Orçamentos (paginado, com `state`/`sellerId`; `updated_before=<iso>` com `state=Open` traz os sem movimento desde a data) |
| `GET /v1/customers` | `customers:read` | Clientes (paginado) |
| `GET /v1/funnels`, `GET /v1/funnels/{id}` | `funnels:read` | Funis e etapas (sem paginação) |
| `GET /v1/users` | `users:read` | Usuários ativos (paginado) |
| `GET /v1/tasks` | `tasks:read` | Tarefas de orçamento (paginado) |
| `POST /v1/tasks` | `tasks:write` | Cria tarefa (use `Idempotency-Key`) |
| `PUT /v1/tasks/{id}/complete` | `tasks:write` | Conclui a tarefa |
| `GET/PUT/DELETE /v1/storage/...` | implícito | Dados do plugin (use `hold.storage`) |

## Sincronização, mover etapa e cotas

Confira o contrato real em `GET /anonymous-api/plugin-platform/openapi/v1.json` (sem token; cada operação traz `x-hold-scopes`
e, nas escritas, `x-hold-idempotent`).

### Lista em modo cursor (`/budgets`, `/customers`, `/tasks`)

Entra em modo cursor quando a query traz `cursor`, `updated_since` ou `limit` (o modo `page`/`pageSize` acima continua igual).
```
GET /v1/budgets?updated_since=2026-10-23T12:00:00Z&limit=100[&cursor=<opaco>][&state=open&sellerId=...]
{ "data":[{ "...item...", "updatedAt":"...", "deleted":false }], "nextCursor":"...|null", "hasMore":true, "syncToken":"2026-10-23T12:04:55Z" }
```
- `limit` máximo 100. Siga `nextCursor` enquanto `hasMore`; o cursor é opaco e vale só para o mesmo recurso.
- `updated_since` (ISO 8601) traz só o alterado depois dele, **incluindo excluídos com `deleted: true`** (tombstones); a janela de
  90 dias do modo página não vale no modo cursor. Orçamento muda também quando a proposta (custo) muda.
- `syncToken` = início da consulta menos 5 s: guarde e use como próximo `updated_since`; tire duplicados por `id`.
  (`hold.sync.pull` faz tudo isso.) Exclusão física não aparece; escritas fora da WebApi podem não carimbar.
- A visibilidade por perfil vale nos dois modos.

### Mover etapa — `PUT /v1/budgets/{id}/step` (escopo `budgets:move-step`)

Corpo `{ "stepId": "<ObjectId de etapa do funil do orçamento>" }`; header `Idempotency-Key` recomendado (vale por plugin;
repetir chave e corpo dá `200` sem efeito novo). `200` + orçamento com `funnelId`, `stepId`, `stepName`. A etapa muda como na
tela e cria a tarefa "Mudança de etapa" com a autoria "por <usuário> via plugin <nome>".
- `404 _30` orçamento inexistente ou que o usuário não vê; `400 _44` etapa fora do funil; `400 _45` orçamento não está aberto.
- `budgets:move-step` é escopo novo: acrescentá-lo ao manifesto pede novo consentimento de um Administrador (ver SKILL.md).

### Cotas

Por instalação: **10.000 chamadas/dia** e **300/minuto** (o administrador pode ter limite menor). Acima, `429` com
`Retry-After` e `{errorCode:"HOLD_PLUGIN_PLATFORM_39"}` (dia) ou `_40` (minuto). A cota limita só o plugin, nunca o ERP.
Uso: Plugins > "Chamadas e cotas" (atualiza a cada minuto).

| HTTP | Código | Significado |
|---|---|---|
| 429 | `_39` / `_40` | Cota diária / por minuto estourada; respeite `Retry-After` |
| 400 | `_41` | `updated_since` inválido |
| 400 | `_42` | `cursor` inválido ou de outro recurso |
| 503 | `_43` | Consulta passou de 5 s; reduza o intervalo ou o `limit` e tente de novo |
| 400 | `_44` | `stepId` não pertence ao funil do orçamento |
| 400 | `_45` | Orçamento não está aberto |

## Paginação

`page` (>= 1, padrão 1) e `pageSize` (padrão 20, **máximo 100**; acima vira 100). Resposta:

```json
{ "data": [ ... ], "totalCount": 33, "page": 1, "pageSize": 25, "totalPages": 2, "hasNextPage": true, "hasPreviousPage": false }
```
Os itens vêm em `data` (não `items`). `funnels` devolve `{ data: [...] }` sem os campos de página.

## GET /v1/budgets

Query: `state` (`open`|`won`|`lost`; outro valor dá 400), `sellerId` (ObjectId; inválido dá 400 `INVALID_SELLER_ID`),
`customerId`, `code` (inteiro), `startDate`, `endDate` (filtram a criação), `page`, `pageSize`.
- **Sem `startDate` nem `endDate` vale os últimos 90 dias**, não o mês corrente.
- `state` e `sellerId` entram na consulta: `totalCount`/`totalPages` já refletem o filtro.
- Vendedor = responsável do orçamento.
- Resposta enxuta: cada proposta traz só os totais (`proposeItems` vem sempre `[]`; a lista de itens não é exposta aqui).
- Cerca de 1 s por chamada no ambiente de teste (banco remoto): use `pageSize=25` e desenhe a tela a cada página recebida.

Item: `{ id, customerId, code, title, customerName, budgetState (1 aberto, 2 perdido, 3 ganho), creationDate,
deliveryNeed|null, wonDate, lostDate ("0001-01-01T00:00:00Z" = vazio), sellerId|null, sellerName|null,
proposes: [{ paymentOption, totalPrice, totalProfitPercentual, productionCost, sellingCost, proposeItems (sempre []), isWinner }] }`.
O valor do orçamento é o `totalPrice` da proposta com `isWinner`, ou o maior `totalPrice` se nenhuma ganhou.

## GET /v1/customers

Query: `searchTerm`, `page`, `pageSize`. Item: `{ id, name, fullName, mainEmail, mainPhoneNumber, document, site,
entityType, active, creationTime, lastUpdateTime, salesCreditLimit, avaibleSalesCreditLimit, salesCreditLimitExpirationDate,
isCreatedFromLead, leadCreationTime, leadConvertionTime, addresses[], contacts[{ name, email, phoneNumber, position }], customFields[] }`.

## GET /v1/funnels

Query `type` (ex.: `budget`). Item: `{ id, name, type, steps: [{ id, name, type, successProbability }] }`. `GET /v1/funnels/{id}` dá 404 se não existe.

## GET /v1/users

Query `searchTerm` (nome ou e-mail), `page`, `pageSize`. Item: `{ id, name, email, profileId }` (só ativos e não bloqueados, por nome).

## Tarefas

`GET /v1/tasks`: query `budgetId`, `responsibleUserId`, `status` (`pending`|`done`; omitido = todas), `page`, `pageSize`.
Item: `{ id, budgetId, title, taskType, taskTypeName, description, schedulingTime, duration (min), responsibleUserId,
entityId, visibleForCustomer, isDone, endTime|null, completedByUserId|null, creationTime }`.
`taskType`: 1 Call, 2 Meeting, 3 Task, 4 Deadline, 5 SendEmail, 6 Lunch, 7 Visit, 8 SubmitProposal, 9 RealizedAnnotation.
Para só contar pendentes: `?budgetId=<id>&status=pending&pageSize=1` e leia `totalCount`.

`POST /v1/tasks`: corpo `{ budgetId (obrigatório), title (obrigatório), taskType (padrão 3), schedulingTime (ISO, padrão agora),
duration (min, padrão 0), description, responsibleUserId (padrão = usuário do token), visibleForCustomer (padrão false) }`.
- Header `Idempotency-Key` (no SDK: `hold.api.post('/tasks', corpo, { idempotencyKey })`). A chave vale por plugin.
- `201` + tarefa nova; **`200` + a mesma tarefa** se repetir a chave com o mesmo corpo; `400 HOLD_GENERAL_6` se repetir a chave com corpo diferente.
- `404 HOLD_PLUGIN_PLATFORM_30` se o orçamento não existe. O autor da tarefa é o usuário do token (aparece no ERP como criada por ele).
- Derive a chave do fato: `follow-up-<orcamentoId>-<aaaa-mm-dd>`; nunca aleatória.

`PUT /v1/tasks/{id}/complete`: `200` + tarefa com `isDone=true`; `404` se não existe. Repetir é seguro.

## Storage

Escopo implícito, isolado por plugin e por conta. `collection`: `^[a-z0-9][a-z0-9_-]{0,63}$`; `key`: `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`.
- `GET /v1/storage/{collection}?prefix=&cursor=&limit=` (limit 1 a 100) -> `{ items: [{ collection, key, value, sizeBytes, updatedAt }], nextCursor|null }`, ordenado por `key`.
- `GET /v1/storage/{collection}/{key}` -> o **registro** `{ collection, key, value, sizeBytes, updatedAt }` (o valor está em `value`), ou 404.
  Na função use `hold.storage.get` (já devolve só o valor, `null` no 404); na tela, `hold.storage.get` faz o mesmo.
- `PUT /v1/storage/{collection}/{key}`: o **corpo é o próprio valor** (objeto, texto, número...), sem embrulho `{ value }`. Upsert.
- `DELETE /v1/storage/{collection}/{key}` -> 204 (idempotente).
- Limites: 256 KiB por valor, 5000 registros por plugin.

## Eventos

`GET /v1/events?cursor=<opaco|now>&types=budget.won,task.created&limit=100` -> `{ data: [evento], nextCursor, hasMore }`.
Sem `cursor`, começa em "agora". Filtra pelos escopos do token e pela visibilidade do usuário (Vendedor só vê o dele).
Fora da cota diária; conta nos 300 por minuto. Entrega ao menos uma vez, sem ordem; deduplique por `data.id`.

```json
{ "type": "budget.won", "timestamp": "2026-10-30T14:02:11Z",
  "data": { "id": "evt_8f3c...", "accountId": 1234, "budgetId": "6a62...", "budgetCode": 1234,
            "actor": { "type": "user", "id": "...", "name": "Fulano", "viaPluginId": null } } }
```

| Evento | Escopo | Campos extras em `data` |
|---|---|---|
| `budget.won` | `budgets:read` | - |
| `budget.step_changed` | `budgets:read` | `fromStepId`, `toStepId` |
| `task.created`, `task.completed` | `tasks:read` | `taskId`, `budgetId` |
| `customer.created` | `customers:read` | `customerId`, `source` (`screen`, `lead`, `import`, `api`) |

Webhook (opcional): mesmo corpo, assinado no padrão Standard Webhooks (`webhook-id`, `webhook-timestamp`,
`webhook-signature: v1,<HMAC-SHA256 base64>` sobre `id.timestamp.corpo` com o segredo `whsec_...`). Responda 2xx rápido; falhas
são repetidas (5 s, 5 min, 30 min, 2 h, 5 h, 10 h, 14 h, 24 h, cerca de 3 dias) e o Administrador pode reenviar pela tela de uso, com o mesmo `webhook-id`.
O `webhook-id` é o `data.id` do evento (`evt_...`): use-o para deduplicar. Na tela Plugins > ⋯ > Chamadas e cotas > **Avisos enviados**
aparecem as entregas ("Entregue", "Falhou · nova tentativa às HH:MM") com o botão **Reenviar**.

## Chamadas feitas por função (sem usuário)

Dentro de uma função use `hold.api` (host virtual da plataforma; a hospedagem põe o token). Chamada da tela usa o token do usuário.
Agenda, evento, hook e "Executar agora" usam um **token de instalação** (5 min, tipo `plugin_installation`, nunca vai ao navegador):
só `/v1`, só os escopos consentidos, e a visibilidade é a **conta inteira** dentro desses escopos. Tarefa criada assim tem como
responsável o vendedor do orçamento e a marca "via plugin X". Quem faz a chamada vira `{type:"plugin"}` nos eventos, e evento causado pelo
próprio plugin não dispara as funções dele. `GET /v1/me` devolve `{ principal: "installation", installationId, pluginId, accountId,
accountName, trigger, scopes }`. Limite de 50 chamadas à API por execução e 35 s (a cota diária continua valendo).

**Orçamentos parados:** `GET /v1/budgets?state=Open&updated_before=<ISO>&limit=20[&cursor=...]` devolve os orçamentos sem movimento
desde a data: primeiro os que nunca foram alterados desde a ativação da sincronização (pela data da última alteração), depois os
carimbados antes dela. Pagine pelo `nextCursor` (guarde no `storage` entre execuções).

**Idempotência de tarefa:** `POST /v1/tasks` com `Idempotency-Key` devolve `201` na criação e `200` com a mesma tarefa quando a chave
(por plugin) já foi usada; `responsibleUserId` e `schedulingTime` são opcionais.

## Erros

Formato: `[{ "type": 53, "errorType": <n>, "errorCode": "HOLD_PLUGIN_PLATFORM_<n>", "fields": [...] }]`. Mostre ao usuário
uma mensagem em pt-BR sua; não despeje o JSON.

| HTTP | Código | Significado |
|---|---|---|
| 401 | sem corpo, ou `_2` a `_7` | Token ausente, malformado, expirado ou inválido (o SDK renova e repete uma vez) |
| 401 | `_10` / `_11` | Instalação inexistente ou inativa (plugin desligado) |
| 401 | `_35` (no porteiro: `{error:"token_rejected", reason:"revoked"}`) | Acesso revogado (usuário inativado, bloqueado, com senha/e-mail trocados, perfil trocado ou editado). O SDK renova; se a renovação cair em `_34`, o usuário perdeu o acesso |
| 403 | `_34` | O usuário não pode usar o plugin (perfil fora da lista da instalação ou sem **Plugins: Usar**) |
| 403 | `_31` | Instalação aguardando consentimento de um Administrador |
| 503 | `_36` | Não deu para conferir a revogação agora (cache fora do ar); tente de novo |
| 403 | `PLUGIN_SCOPE_REQUIRED` / `_9` | Rota exige escopo que o plugin não tem (`fields` traz o escopo) |
| 403 | `_8` / `_12` | Sessão personificada/sandbox; usuário não é Administrador |
| 400 | `_16` / `_17` | `collection` / `key` do storage inválida |
| 400 | `_18` | Valor do storage acima de 256 KiB |
| 400 | `_19` | Cota de 5000 registros do plugin esgotada |
| 404 | `_30` | `POST /tasks` com orçamento inexistente |
| 400 | `_53` | Eventos: cursor inválido (recomece com `cursor=now`) |
| 410 | `_54` | Eventos: cursor com mais de 30 dias (releia por `updated_since`/`sync.pull`) |
| 400 | `_55` / `_56` | Manifesto: URL de webhook inválida / tipo de evento desconhecido (aparecem no `deploy`) |
| 400 | `_57` / `_58` / `_59` | Segredo: nome inválido / não declarado / valor vazio ou acima de 4 KiB (gestão de segredos, só Administrador) |
| 400 | `_60` | Manifesto: agenda inválida (`every` fora do catálogo ou abaixo do mínimo) |
| 404 | `_61` | "Executar agora" com agenda inexistente |
| 400 | `_62` | Manifesto: domínio de rede inválido |
| 404 / 413 / 401 | `_63` / `_64` / `_65` | Hook não declarado (ou instalação desligada) / corpo acima de 256 KiB (o porteiro recusa antes com `body_too_large`) / chave de entrada inválida (só o porteiro chama) |
| 400 | `HOLD_GENERAL_6` | `Idempotency-Key` repetida com corpo diferente |

Códigos `_32`, `_33`, `_37` e `_38` são da tela de aprovação e da gestão de plugins (versão de consentimento mudou,
senha errada, perfil inexistente, sem **Plugins: Gerenciar**): não chegam ao plugin.
Códigos `_20` a `_29` pertencem à CLI/registro (slug, nome, escopo, versão, manifesto, sessão de login) e aparecem como `erro:` no terminal.
