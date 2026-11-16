# Manifesto `holdprint.plugin.json`

O manifesto fica na raiz da pasta do plugin e diz o que o plugin é, onde aparece e o que pode acessar. A CLI valida o manifesto antes de publicar (`holdprint plugin validate`); campo desconhecido é recusado.

## Exemplo completo (válido)

Uma página no menu Produção e outra no menu Plugins, botão no job (detalhe e lote), ação em Novo registro, aba no cliente, card na Visão Geral, agenda diária, reação ao evento de orçamento ganho e vitrine para o Marketplace.

```json
{
  "schemaVersion": "2026-10-23",
  "slug": "producao-360-k3x9",
  "name": "Produção 360",
  "description": "Jobs a entregar, aviso à produção, histórico do cliente e follow-up automático de orçamentos parados.",
  "scopes": [
    { "scope": "jobs:read", "purpose": "Listar os jobs a entregar e abrir o job escolhido no botão" },
    { "scope": "budgets:read", "purpose": "Mostrar os orçamentos do cliente e achar orçamentos parados" },
    { "scope": "customers:read", "purpose": "Mostrar o histórico na aba do cliente" },
    { "scope": "tasks:write", "purpose": "Criar a tarefa de aviso e de follow-up no orçamento" }
  ],
  "contributes": {
    "pages": [
      { "id": "entregas", "menuTitle": "Jobs a entregar", "icon": "truck", "group": "production" },
      { "id": "painel", "menuTitle": "Produção 360", "icon": "layout-dashboard" }
    ],
    "actions": [
      { "id": "avisar-producao", "title": "Avisar a produção", "icon": "bell", "target": "job", "open": "modal", "modal": { "size": "md" } },
      { "id": "avisar-selecionados", "title": "Avisar selecionados", "target": "job-list", "open": "modal", "modal": { "size": "lg" } },
      { "id": "proposta-rapida", "title": "Proposta rápida", "icon": "bolt", "target": "new-record", "open": "page" }
    ],
    "tabs": [
      { "id": "historico", "title": "Histórico", "target": "customer" }
    ],
    "cards": [
      { "id": "entregas-hoje", "title": "Entregas de hoje", "size": "small" }
    ]
  },
  "ui": { "dir": "public", "entry": "index.html" },
  "events": { "subscribe": ["budget.won"] },
  "functions": {
    "entry": "functions/index.ts",
    "schedules": [
      { "id": "follow-up", "every": "1d", "path": "/api/agenda/follow-up", "description": "Follow-up de orçamentos parados" }
    ],
    "events": { "path": "/api/eventos" }
  },
  "listing": {
    "summary": "Jobs a entregar, aviso à produção e follow-up automático de orçamentos parados",
    "category": "producao",
    "highlights": ["Página no menu Produção", "Botão no job e em lote", "Follow-up diário sem duplicar"]
  }
}
```

Plugin mínimo (uma página no menu Plugins):

```json
{
  "schemaVersion": "2026-10-23",
  "slug": "vendas-por-vendedor-a1b2",
  "name": "Vendas por vendedor",
  "description": "Orçamentos abertos por vendedor com follow-up.",
  "scopes": [ { "scope": "budgets:read", "purpose": "Mostrar orçamentos abertos por vendedor" } ],
  "contributes": { "page": { "menuTitle": "Vendas por vendedor", "icon": "chart-bar" } },
  "ui": { "dir": "public", "entry": "index.html" }
}
```

## Campos de primeiro nível

| Campo | Obrigatório | Regra |
|---|---|---|
| `schemaVersion` | sim | Exatamente `"2026-10-23"`. |
| `slug` | sim | 3 a 40 caracteres: minúsculas, números e hífens, sem hífen nas pontas. Identifica o plugin na sua conta; o `deploy` atualiza o plugin com o mesmo slug. Use um slug novo para cada plugin novo. Não é o id do plugin (`p-...`, gerado pela plataforma). |
| `name` | sim | 1 a 60 caracteres, em português. Aparece na tela Plugins, no consentimento e no menu. |
| `description` | sim | 1 a 280 caracteres. |
| `scopes` | sim | Lista (pode ser vazia) de `{ "scope", "purpose" }`. `scope` do [catálogo](07-escopos.md); `purpose` de 1 a 200 caracteres, em português, dizendo por que o plugin precisa. Sem repetidos. |
| `contributes` | sim | Onde o plugin aparece (abaixo). Pode ser `{}` num plugin só de funções. |
| `ui` | sim | `{ "dir": "public", "entry": "index.html" }`: pasta estática e página de entrada. Um único HTML serve a todos os lugares; o plugin decide o que desenhar por `hold.context` (ver [SDK](05-sdk.md)). |
| `events` | não | Eventos que o plugin recebe (abaixo). |
| `functions` | não | Código que roda na hospedagem da Hold (abaixo). |
| `secrets` | não | Nomes dos segredos usados pelas funções (nunca o valor). |
| `network` | não | Sites externos que as funções podem chamar. |
| `listing` | não | Vitrine do Marketplace e do link (abaixo). |
| `$schema` | não | Aceito, para editores com autocompletar. |

O plugin precisa ter pelo menos uma página, ação, aba, card, função ou app externo.

`storage` (dados do próprio plugin) e `me` (quem está usando) valem sempre: **não** declare em `scopes`.

## `contributes.page` e `contributes.pages`: páginas no menu

`page` (uma página só, no menu Plugins):

| Campo | Regra |
|---|---|
| `menuTitle` | 1 a 40 caracteres. |
| `icon` | kebab-case (ex.: `chart-bar`). |

`pages` (até **5**, cada uma no grupo escolhido):

| Campo | Obrigatório | Regra |
|---|---|---|
| `id` | sim | `^[a-z][a-z0-9-]{0,39}$`, único no plugin. Chega ao plugin em `hold.context.page`. |
| `menuTitle` | sim | 1 a 40 caracteres. |
| `icon` | sim | kebab-case, até 40 caracteres. |
| `group` | não | Grupo do menu lateral (tabela abaixo). Padrão `plugins`. |

| `group` | Aparece no menu |
|---|---|
| `plugins` (padrão) | Plugins |
| `register` | Cadastros |
| `defrayal` | Custeio |
| `crm` | CRM |
| `production` | Produção |
| `financial` | Financeiro |
| `stock` | Estoque |
| `reports` | Relatórios |

- `page` equivale a `pages: [{ "id": "main", "group": "plugins", ... }]` (o plugin recebe `hold.context.page === "main"`).
- **Não use `page` e `pages` juntos** (erro `108`).
- O ícone da vitrine é o da primeira página.

## `contributes.actions`: botões nas telas

Até **10** ações.

| Campo | Obrigatório | Regra |
|---|---|---|
| `id` | sim | `^[a-z0-9][a-z0-9-]{1,38}$`, único no plugin. Chega em `hold.context.launch.actionId`. |
| `title` | sim | Texto do botão, 1 a 60 caracteres. Ao confirmar o modal, o Holdprint mostra "<title> concluída". |
| `icon` | não | kebab-case, até 40 caracteres. |
| `target` | sim | Tela onde o botão aparece (tabela de alvos). Exige o escopo de leitura da entidade em `scopes`. |
| `open` | sim | `modal` (janela por cima da tela) ou `page` (abre a tela do plugin como página inteira; não precisa de página no menu). |
| `modal.size` | não | Só com `open: "modal"`: `md` (640 px, padrão), `lg` (960 px) ou `xl` (1200 px). Altura de 85% da janela. Com `open: "page"`, é erro. |

### Alvos (`target`)

Cada tela tem dois alvos: o **detalhe** (`<alvo>`, um registro aberto; o plugin recebe `launch.entity`) e o **lote** (`<alvo>-list`, numa lista, sobre os itens **marcados**; o plugin recebe `launch.entities`, até 100).

| `target` (detalhe / lote) | Onde o botão aparece | Escopo exigido | `entity.type` |
|---|---|---|---|
| `new-record` | Menu **Novo registro** do topo | nenhum | sem entidade |
| `budget` / `budget-list` | Orçamento (menu do ícone de raio, seção Plugins), proposta, item / painel de Negociações em modo lista | `budgets:read` | `budget` |
| `customer` / `customer-list` | Cliente / lista de Clientes | `customers:read` | `customer` |
| `job` / `job-list` | Ordem de produção (inclui e-commerce) / lista de Jobs | `jobs:read` | `job` |
| `expense` / `expense-list` | Conta a pagar / Contas a pagar e relatório | `expenses:read` | `expense` |
| `income` / `income-list` | Conta a receber / Contas a receber e relatório | `incomes:read` | `income` |
| `feedstock` / `feedstock-list` | Insumo / Insumos | `feedstocks:read` | `feedstock` |
| `purchase-order` / `purchase-order-list` | Pedido de compra / Pedidos de compra | `purchase-orders:read` | `purchase-order` |
| `stock-movement` / `stock-movement-list` | Movimentação de estoque / Movimentações | `stock-movements:read` | `stock-movement` |
| `stock-central` / `stock-central-list` | Central de estoque / Centrais | `stock-centrals:read` | `stock-central` |
| `supplier` / `supplier-list` | Fornecedor / Fornecedores | `suppliers:read` | `supplier` |
| `employee` / `employee-list` | Funcionário / Funcionários | `employees:read` | `employee` |
| `agency` / `agency-list` | Agência / Agências | `agencies:read` | `agency` |
| `cost-center` / `cost-center-list` | Centro de custo (id numérico) / Centros de custo | `cost-centers:read` | `cost-center` |
| `equipment` / `equipment-list` | Equipamento / Equipamentos | `equipments:read` | `equipment` |
| `process` / `process-list` | Processo / Processos | `processes:read` | `process` |
| `product` / `product-list` | Produto / Produtos | `products:read` | `product` |
| `outsourced` / `outsourced-list` | Terceirizado / Terceirizados | `outsourceds:read` | `outsourced` |
| `fixed-expense` / `fixed-expense-list` | Despesa fixa / Despesas fixas | `fixed-expenses:read` | `fixed-expense` |
| `financial-transaction` / `financial-transaction-list` | Movimentação financeira / Central de movimentações e extratos (banco, caixa) | `financial-transactions:read` | `financial-transaction` |
| `company-card` / `company-card-list` | Cartão da empresa (menu de cada cartão) / lista de cartões | `credit-cards:read` | `company-card` |
| `commission` / `commission-list` | Comissão / Controle de comissões | `commissions:read` | `commission` |
| `bank-reconciliation` / `bank-reconciliation-list` | Conciliação bancária / lista de conciliações | `bank-reconciliations:read` | `bank-reconciliation` |
| `invoice` / `invoice-list` | Documento de cada nota / lista de cada tipo de nota | `invoices:read` | `invoice` |
| `contract` / `contract-list` | Contrato (painel lateral) / Contratos | `contracts:read` | `contract` |

**Notas fiscais.** Os alvos `invoice` e `invoice-list` valem para todos os tipos de nota. O tipo chega em `entity.subtype`: `nfe` (NF-e), `nfse` (NFS-e), `nfce` (NFC-e), `mdfe` (MDF-e) ou `commercial-invoice` (nota comercial, contas fora do Brasil). Um único botão serve a todos os tipos; o plugin decide pelo `subtype`.

Regras:
- O botão só aparece para quem pode usar o plugin **e** tem a permissão da tela (quem não vê Contas a pagar não vê o botão de `expense`).
- Plugin só de ações não aparece no menu lateral; aparece na tela Plugins e nos botões.
- Atendimento/Conversas, PDV, Ajustes (usuários, empresas), relatórios só de exportação e telas descontinuadas não recebem botões.
- A lista de ações fica em cache por até 60 s: um botão novo pode levar um minuto para aparecer.

## `contributes.tabs`: abas no orçamento e no cliente

Até **3** abas.

| Campo | Regra |
|---|---|
| `id` | `^[a-z][a-z0-9-]{0,39}$`, único. Chega em `hold.context.tab`. |
| `title` | 1 a 30 caracteres. |
| `target` | `budget` (aba no orçamento) ou `customer` (aba no cliente). Exige `budgets:read` ou `customers:read`. |

A aba só carrega quando o usuário clica nela e recebe o registro aberto em `launch.entity` (sem `actionId`).

## `contributes.cards`: cards na Visão Geral

Até **3** cards. Não exigem escopo.

| Campo | Regra |
|---|---|
| `id` | `^[a-z][a-z0-9-]{0,39}$`, único. Chega em `hold.context.card`. |
| `title` | 1 a 40 caracteres. |
| `size` | `small` (altura até 200 px), `medium` (até 360 px, **padrão**) ou `large` (até 560 px). |

Os cards aparecem na seção **Plugins**, no fim da Visão Geral. O card ocupa a altura que o plugin pede com `hold.ui.resize()`, até o teto do tamanho. Card não recebe registro (`launch` é `null`).

## `contributes.externalApps`: apps fora do Holdprint

Até **3** apps (TV, celular, site) que entram com a conta Holdprint pelo SDK `HoldprintExternal`.

| Campo | Regra |
|---|---|
| `id` | `^[a-z0-9][a-z0-9-]{1,38}$`, único. |
| `name` | 1 a 60 caracteres; aparece na aprovação e em Acessos conectados. |
| `kind` | `device` (TV, sem teclado: código e QR) ou `web` (navegador: redireciona e volta). |
| `origins` | 1 a 5 endereços `https://host[:porta]`, sem caminho. |
| `redirectUris` | Obrigatório em `web` (1 a 5 endereços exatos); proibido em `device`. |
| `scopes` | Subconjunto dos `scopes` do manifesto. |

App ou origem nova pede novo consentimento.

## `events`: avisos do Holdprint

```json
"events": { "subscribe": ["budget.won", "budget.step_changed"], "webhook": { "url": "https://meu-servidor.exemplo.com.br/hook" } }
```

| Campo | Regra |
|---|---|
| `subscribe` | 1 ou mais tipos, sem repetidos: `budget.won` e `budget.step_changed` (exigem `budgets:read`), `task.created` e `task.completed` (exigem `tasks:read`), `customer.created` (exige `customers:read`). |
| `webhook.url` | Opcional, só se você tem um servidor próprio. `https`, sem IP, sem rede privada, sem domínio da Hold. Até 500 caracteres. Trocar o host pede novo consentimento. |

A tela usa `hold.events.subscribe` (ver [SDK](05-sdk.md)); a função recebe por `functions.events.path`.

## `functions`, `secrets` e `network`: automação

```json
"functions": {
  "entry": "functions/index.ts",
  "schedules": [{ "id": "follow-up", "every": "1d", "path": "/api/agenda/follow-up", "description": "Follow-up" }],
  "events": { "path": "/api/eventos" },
  "hooks": [{ "name": "cobranca", "path": "/api/hooks/cobranca" }]
},
"secrets": [{ "name": "CHAVE_SERVICO", "description": "Chave da API do serviço de cobrança" }],
"network": { "domains": ["api.servico-externo.com.br"] }
```

| Campo | Regra |
|---|---|
| `functions.entry` | Obrigatório para ter agenda, eventos ou hooks. Arquivo TypeScript/JavaScript que exporta `fetch(request, env)`. |
| `functions.schedules[]` | Até 5. `id` `^[a-z0-9][a-z0-9-]{1,38}$`; `every` um de `15m`, `30m`, `1h`, `6h`, `12h`, `1d` (o mínimo é 15 minutos); `path` começa com `/api/`; `description` até 200 caracteres (aparece na aprovação como "<description>, todo dia"). |
| `functions.events.path` | Começa com `/api/`. Exige `events.subscribe`. A função recebe um POST por evento. |
| `functions.hooks[]` | Até 5. `name` `^[a-z0-9][a-z0-9-]{1,38}$`, `path` `/api/...`. Um serviço externo chama `POST https://hooks.{DOMINIO_TECNICO}/<installationId>/<name>` (até 256 KiB). A URL exata aparece na tela de aprovação. |
| `secrets[]` | Até 20. `name` `^[A-Z][A-Z0-9_]{1,63}$`; `description` até 200. O valor é gravado por um Administrador (tela Segredos ou `holdprint plugin secrets set`), nunca no manifesto. |
| `network.domains[]` | Até 10 nomes de site públicos (sem IP, curinga, porta nem sufixo interno). A função só alcança esses domínios. |

Detalhes de agenda, hooks, limites por execução e idempotência em [SDK > Funções](05-sdk.md#funcoes).

## `listing`: vitrine

Opcional. Quando existe, `summary` e `category` são obrigatórios. Obrigatório para pedir publicação no Marketplace.

| Campo | Regra |
|---|---|
| `summary` | 1 a 140 caracteres: uma frase do que o plugin faz. |
| `category` | `vendas`, `producao`, `financeiro`, `estoque`, `relatorios`, `integracoes`, `automacao` ou `outros`. |
| `highlights` | Até 5 itens de até 80 caracteres. |
| `support` | E-mail ou endereço `https://` (até 200 caracteres) para pedir ajuda. Sem contato real, omita. |

Texto puro, sem HTML nem markdown, sem promessas ("o melhor", "garantido", números de ganho). Mudar o `listing` não pede novo consentimento.

## O que pede novo consentimento

| Mudança | Pede aprovação de novo? |
|---|---|
| Escopo novo (inclusive o exigido por um alvo novo) | **Sim** |
| Primeira agenda, agenda nova, hook novo, domínio novo em `network` | **Sim** |
| Host novo do webhook; app externo ou origem nova | **Sim** |
| Páginas, ações, abas, cards (lugar na tela) | Não |
| Texto do `purpose`, `listing`, nome, descrição, código | Não |
| Remover escopo, agenda, hook ou domínio | Não |

Enquanto a aprovação nova não sai, o plugin continua funcionando com as permissões antigas, e a rota do escopo novo responde `403 HOLD_PLUGIN_PLATFORM_9`. A tela de aprovação mostra o que é **Novo**.
