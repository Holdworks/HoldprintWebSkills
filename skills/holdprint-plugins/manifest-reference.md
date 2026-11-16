# Manifesto `holdprint.plugin.json`

Valide com `holdprint plugin validate [pasta]`.

```json
{
  "schemaVersion": "2026-10-23",
  "slug": "vendas-por-vendedor",
  "name": "Vendas por vendedor",
  "description": "Orçamentos abertos por vendedor com follow-up.",
  "scopes": [
    { "scope": "budgets:read", "purpose": "Mostrar orçamentos abertos por vendedor" },
    { "scope": "tasks:write",  "purpose": "Criar tarefa de follow-up no orçamento" }
  ],
  "contributes": { "page": { "menuTitle": "Vendas por vendedor", "icon": "chart-bar" } },
  "ui": { "dir": "public", "entry": "index.html" }
}
```

| Campo | Regra |
|---|---|
| `schemaVersion` | `"2026-10-23"`. |
| `slug` | 3 a 40 caracteres, minúsculas, números e hifens, sem hifen nas pontas. Identifica o plugin do autor. O `deploy` faz upsert por slug. **Não** é o `pluginId`. |
| `name`, `description` | Pt-BR, curtos (nome até 60, descrição até 280). Aparecem na tela Plugins. |
| `scopes[]` | Cada item com `scope` (do catálogo) e `purpose` (por que precisa, em pt-BR). Só o necessário. |
| `contributes.page` | Uma página só: `menuTitle` (texto do menu, grupo Plugins) e `icon` (kebab-case, ex.: `chart-bar`). **Opcional**. Campos desconhecidos no manifesto são recusados. Para várias páginas ou outro grupo do menu use `pages` (não os dois juntos). |
| `contributes.pages[]` | Opcional, até 5. Páginas no menu, cada uma no grupo escolhido (Produção, Financeiro...). Veja a seção abaixo. |
| `contributes.externalApps[]` | Opcional, até 3. Apps fora do Holdprint (TV, celular) que entram com a conta Holdprint. Veja a seção abaixo. |
| `contributes.actions[]` | Opcional, até 10. Botões em Novo registro e nas telas do Holdprint (orçamento, cliente, ordem de produção, contas e mais), no detalhe ou em lote. Veja a seção abaixo. |
| `contributes.tabs[]` | Opcional, até 3. Abas no orçamento e no cliente. |
| `contributes.cards[]` | Opcional, até 3. Cards na Visão Geral. |
| `ui.dir` / `ui.entry` | Pasta estática (`public`) e página inicial (`index.html`). |
| `functions` | Opcional. `entry` (`functions/index.ts`) e, se quiser, `schedules`, `events.path` e `hooks`. Só crie quando a tela não resolve; veja a seção abaixo e `functions-reference.md`. |
| `secrets[]` | Nomes dos segredos que a função usa (nunca o valor). Veja a seção abaixo. |
| `network.domains[]` | Sites externos que a função pode chamar. Veja a seção abaixo. |
| `listing` | Opcional. Vitrine do Marketplace e do link: `summary`, `category`, `highlights[]`, `support`. Veja a seção abaixo. |

## `events`

```json
"events": { "subscribe": ["budget.won", "budget.step_changed"], "webhook": { "url": "https://meu-servidor.exemplo.com/hook" } }
```

| Campo | Regra |
|---|---|
| `events.subscribe[]` | Tipos do catálogo v1. Tipo desconhecido dá `400 HOLD_PLUGIN_PLATFORM_56`; tipo sem o escopo de leitura correspondente no manifesto é recusado (`budget.*` exige `budgets:read`, `task.*` exige `tasks:read`, `customer.created` exige `customers:read`). |
| `events.webhook.url` | Opcional, só para quem tem backend próprio. `https`, sem IP literal, sem faixa privada, sem domínio da Hold (`400 HOLD_PLUGIN_PLATFORM_55`). Trocar o **host** pede novo consentimento; mudar só os tipos não. |

A tela de aprovação mostra "Recebe avisos: ..." e "Envia avisos para: <host>" (com selo **Novo** quando o host mudou).

## `functions`, `secrets` e `network`

```json
"functions": { "entry": "functions/index.ts",
  "schedules": [{ "id": "follow-up", "every": "1d", "path": "/api/agenda/follow-up", "description": "Follow-up" }],
  "events": { "path": "/api/eventos" },
  "hooks": [{ "name": "cobranca", "path": "/api/hooks/cobranca" }] },
"secrets": [{ "name": "CHAVE_SERVICO", "description": "Chave da API do serviço" }],
"network": { "domains": ["api.servico-externo.com.br"] }
```

| Campo | Regra |
|---|---|
| `schedules[].id`, `hooks[].name` | `^[a-z0-9][a-z0-9-]{1,38}$`; até 5 agendas e 5 hooks. |
| `schedules[].every` | `1m`, `15m`, `30m`, `1h`, `6h`, `12h`, `1d`; o servidor impõe um mínimo: 15 min em produção, `1m` não é aceito (`400 _60`). `description` aparece na aprovação como "<description>, <frequência>" (ex.: "Follow-up, todo dia"). |
| `path` (agenda, evento, hook) | Começa com `/api/`. |
| `schedules`, `events.path`, `hooks` | Exigem `functions.entry`. `events.path` exige `events.subscribe`. |
| `secrets[].name` | `^[A-Z][A-Z0-9_]{1,63}$`, até 20; só nomes declarados aqui podem ser gravados. O **valor** nunca vai no manifesto nem no chat (veja `functions-reference.md`). |
| `network.domains[]` | Até 10 sites públicos; sem IP, curinga, porta nem sufixo interno (`400 _62`). Domínio fora da lista dá 403 na saída. |

Exemplo com agenda, evento `budget.won`, hook `cobranca`, dois segredos e um domínio: veja `examples.md`, seção 5.

**Consentimento:** domínio novo, primeira agenda, agenda nova ou hook novo pedem novo consentimento (remover não pede). A tela de
aprovação mostra "Hospedado pela Hold (Cloudflare)", "Roda sozinho: …", "Fala com: …" (selo **Novo**) e "Recebe chamadas de: <URL do hook>".

## `listing`

Opcional. Quando existe, `summary` e `category` são obrigatórios.

```json
"listing": {
  "summary": "Orçamentos abertos por vendedor, atualizados sozinhos",
  "category": "vendas",
  "highlights": ["Atualiza sozinho", "Cria tarefa de follow-up"],
  "support": "suporte@grafica.com.br"
}
```

| Campo | Regra |
|---|---|
| `summary` | Obrigatório. De 1 a 140 caracteres, pt-BR, uma frase do que o plugin faz. |
| `category` | Obrigatória. Uma de `vendas`, `producao`, `financeiro`, `estoque`, `relatorios`, `integracoes`, `automacao`, `outros`. |
| `highlights[]` | Até 5 itens de até 80 caracteres cada. |
| `support` | Opcional. E-mail ou endereço `https://` (até 200 caracteres) para a outra gráfica pedir ajuda. Não invente contato: sem um real, omita. |

- Tudo é **texto puro**: sem HTML, sem markdown, sem promessa ("o melhor", "garantido", números de ganho). Descreva só o que o plugin faz.
- Fora das regras, `validate`/`deploy` recusam (`400 HOLD_PLUGIN_PLATFORM_70`; `validate` falha antes, na CLI).
- Mudar o `listing` **não** pede novo consentimento. O ícone da vitrine vem do ícone da (primeira) página (`contributes.page.icon` ou `contributes.pages[0].icon`) (não há imagem própria).
- Plugin que vai para **outra gráfica** não declara `secrets` (`409 _74` ao instalar por link; `409 _75` no deploy que acrescenta segredo com instalação alheia).

## `contributes.externalApps`

```json
"contributes": {
  "externalApps": [
    { "id": "tv", "name": "Painel da produção", "kind": "device", "origins": ["http://localhost:4791"], "scopes": ["budgets:read"] },
    { "id": "celular", "name": "Produção no celular", "kind": "web", "origins": ["https://painel.exemplo.com.br"],
      "redirectUris": ["https://painel.exemplo.com.br/entrar"], "scopes": ["budgets:read"] }
  ]
}
```

| Campo | Regra |
|---|---|
| `id` | `^[a-z0-9][a-z0-9-]{1,38}$`, único no plugin. É o `appId` do SDK e de `hold.nav.openExternal`. |
| `name` | Pt-BR, curto; aparece na aprovação e em Acessos conectados. |
| `kind` | `device` (TV, sem teclado) ou `web` (navegador normal). |
| `origins[]` | `https://` ou `http://localhost` (só em desenvolvimento); `esquema://host[:porta]`, sem caminho. |
| `redirectUris[]` | Obrigatório em `web`; endereços exatos. Em `device` é recusado. |
| `scopes[]` | Subconjunto dos `scopes` do manifesto; escopo fora dele dá `400 HOLD_PLUGIN_PLATFORM_80`. |
| Limites | Até 3 apps. Fora das regras: `400 _80` (`ExternalAppInvalid`). |

**Consentimento:** app novo ou origem nova pede novo consentimento ("Acessa de fora do Holdprint: <app> em <origem>"). Remover não pede.
Guia completo: `external-apps-reference.md`.

## `contributes.pages` (páginas no menu, por grupo)

```json
"contributes": {
  "pages": [
    { "id": "relatorio", "menuTitle": "Relatório de produção", "icon": "chart-bar", "group": "production" },
    { "id": "painel", "menuTitle": "Painel do plugin", "icon": "layout-dashboard" }
  ]
}
```

| Campo | Regra |
|---|---|
| `id` | `^[a-z][a-z0-9-]{0,39}$`, único no plugin. É o `hold.context.page` que o plugin recebe. |
| `menuTitle` | Texto do item no menu, até 40 caracteres. |
| `icon` | Opcional, kebab-case, até 40. |
| `group` | Opcional (padrão `plugins`). Em qual grupo do menu lateral a página aparece (tabela abaixo). Grupo fora da lista dá `107`. |
| Limite | Até **5 páginas** por plugin. |

| `group` | O usuário vê no menu |
|---|---|
| `plugins` (padrão) | Plugins |
| `register` | Cadastros |
| `defrayal` | Custeio |
| `crm` | CRM |
| `production` | Produção |
| `financial` | Financeiro |
| `stock` | Estoque |
| `reports` | Relatórios |

- Todas as páginas abrem o **mesmo** `ui.entry`; o plugin decide o que desenhar por `hold.context.page` (veja `sdk-reference.md`).
- `page` (uma página só, sem `id` nem `group`) **continua valendo** e equivale a `pages: [{ id: "main", group: "plugins", ... }]`
  (o plugin recebe `context.page === "main"`). **`page` e `pages` juntos dão erro `108`**: escolha um.
- Só-abas, só-cards ou só-ações (sem página) é permitido; o plugin só não aparece no menu.

## `contributes.actions`

```json
"contributes": {
  "actions": [
    { "id": "gerar-proposta", "title": "Gerar proposta", "icon": "file-text", "target": "budget", "open": "modal", "modal": { "size": "lg" } },
    { "id": "proposta-rapida", "title": "Proposta rápida", "icon": "bolt", "target": "new-record", "open": "page" },
    { "id": "avisar-grafica", "title": "Avisar a produção", "target": "job", "open": "modal" },
    { "id": "enviar-lote", "title": "Enviar selecionados", "target": "job-list", "open": "modal" }
  ]
}
```

| Campo | Regra |
|---|---|
| `id` | 2 a 39 caracteres: minúsculas, números e hifens, começando por letra ou número (`^[a-z0-9][a-z0-9-]{1,38}$`, o mesmo das agendas); único no plugin. É o `actionId` que o plugin recebe em `hold.context.launch` e o `acao=` do deep link. |
| `title`, `icon` | Texto do botão (pt-BR, até 60 caracteres; o toast de sucesso é "<title> concluída") e ícone opcional em kebab-case (até 40). |
| `target` | Em que tela o botão aparece (tabela de alvos abaixo). **Exige o escopo de leitura da entidade** em `scopes`. |
| `open` | `modal` ou `page`. `page` abre a tela do plugin (`ui.entry`) como página inteira, com o mesmo `launch`; não precisa de `contributes.pages`. |
| `modal.size` | Só com `open: "modal"` (com `page` dá `66`): `md` (640 px), `lg` (960) ou `xl` (1200); altura 85vh. Omitido = `md`. |
| Limites | Até **10 ações**; o plugin precisa de **página, ação, aba, card, funções ou app externo**. Fora disso o `validate`/`deploy` recusa (`400 HOLD_PLUGIN_PLATFORM_66`, com mensagem em português). |

- Plugin **só de ação** (sem página) não aparece no menu lateral; fica na tela Plugins e nos botões.
- O botão só aparece para quem pode usar o plugin, e some quando o plugin é desligado (cache de até 60 s).
- Template da CLI: `holdprint plugin create <pasta> --template acao` (uma ação de orçamento em modal).

### Alvos (`target`): onde o botão aparece

Cada tela tem dois alvos: o **detalhe** (`<alvo>`, um registro aberto: o plugin recebe `launch.entity`) e o **lote** (`<alvo>-list`,
na lista, sobre os itens **marcados**: o plugin recebe `launch.entities`). Regra para escolher: pediu "na ordem de produção" ou "no cliente"
= `<alvo>`; pediu "nos selecionados" ou "em vários" = `<alvo>-list`. O lote vale só onde a tabela diz que há lista.

| `target` | Tela (o que o usuário vê) | Escopo exigido | `entity.type` |
|---|---|---|---|
| `new-record` | Menu **Novo registro** do topo | nenhum | sem entidade (`entity: null`) |
| `budget` / `budget-list` | Orçamento (ícone de raio), proposta, item / painel de Negociações em modo lista | `budgets:read` | `budget` |
| `customer` / `customer-list` | Cliente / lista de Clientes | `customers:read` | `customer` |
| `job` / `job-list` | Ordem de produção (inclui e-commerce e o ícone de quebra-cabeça de cada card do Atendimento por tipo) / lista de Jobs | `jobs:read` | `job` |
| `expense` / `expense-list` | Conta a pagar (janela de edição) / Contas a pagar e relatório | `expenses:read` | `expense` |
| `income` / `income-list` | Conta a receber / Contas a receber e relatório | `incomes:read` | `income` |
| `feedstock` / `feedstock-list` | Insumo / Insumos | `feedstocks:read` | `feedstock` |
| `purchase-order` / `purchase-order-list` | Pedido de compra / Pedidos de compra | `purchase-orders:read` | `purchase-order` |
| `stock-movement` / `stock-movement-list` | Movimentação de estoque / Movimentações de estoque | `stock-movements:read` | `stock-movement` |
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
| `financial-transaction` / `financial-transaction-list` | Movimentação financeira / Extratos (banco, caixa) | `financial-transactions:read` | `financial-transaction` |
| `company-card` / `company-card-list` | Cartão da empresa (menu de cada cartão) / lista de cartões | `credit-cards:read` | `company-card` |
| `commission` / `commission-list` | Comissão / Controle de comissões | `commissions:read` | `commission` |
| `bank-reconciliation` / `bank-reconciliation-list` | Conciliação (detalhe) / lista de conciliações | `bank-reconciliations:read` | `bank-reconciliation` |
| `invoice` / `invoice-list` | Documento de cada nota / lista de cada aba de notas | `invoices:read` | `invoice` (+ `entity.subtype`: `nfe`, `nfse`, `nfce`, `mdfe`, `commercial-invoice`) |
| `contract` / `contract-list` | Contrato (painel lateral) / Contratos | `contracts:read` | `contract` |

- Alvo que não está na tabela (ex.: `order`) dá erro `66` listando os válidos; `holdprint plugin validate` mostra a lista completa da sua versão da CLI.
- **O botão só aparece para quem tem a permissão da tela** (ex.: quem não vê Contas a pagar não vê o botão de `expense`), mesmo com o escopo concedido.
- Ficam de fora, de propósito: Atendimento/Conversas, PDV, Ajustes (usuários, empresas), relatórios só de exportação e telas descontinuadas.

## `contributes.tabs` (abas dentro de uma tela)

```json
"tabs": [ { "id": "historico", "title": "Histórico", "target": "customer" } ]
```

| Campo | Regra |
|---|---|
| `id` | `^[a-z][a-z0-9-]{0,39}$`, único no plugin. É o `hold.context.tab`. |
| `title` | Nome da aba, até 30 caracteres. |
| `target` | `budget` (aba no orçamento) ou `customer` (aba no cliente). Outro valor dá `109`. |
| Limite | Até **3 abas**. A aba exige o mesmo escopo do alvo (`budgets:read` / `customers:read`); sem ele, `109`. |

A aba só carrega quando o usuário clica nela e recebe `launch.entity` (o orçamento ou cliente aberto), sem `actionId`.

## `contributes.cards` (cards na Visão Geral)

```json
"cards": [ { "id": "meta", "title": "Meta do mês", "size": "small" } ]
```

| Campo | Regra |
|---|---|
| `id` | `^[a-z][a-z0-9-]{0,39}$`, único no plugin. É o `hold.context.card`. |
| `title` | Até 40 caracteres. |
| `size` | `small` (altura até 200 px), `medium` (até 360 px, **padrão**) ou `large` (até 560 px). O card ocupa a altura que o plugin pede com `hold.ui.resize`, até esse teto. |
| Limite | Até **3 cards**. Não exige escopo. |

Aparecem numa seção **Plugins** no fim da Visão Geral (gestão e operacional). Card não recebe entidade (`launch` é `null`).

## Erros novos de manifesto e de abertura

Todos com mensagem em português no campo `message` (a CLI mostra no `validate`).

| Código | Quando |
|---|---|
| `107` (400) | `pages` inválido: mais de 5, id repetido ou fora do padrão, título/ícone grandes, grupo que não existe (a mensagem lista os válidos). |
| `108` (400) | `page` e `pages` no mesmo manifesto. |
| `109` (400) | `tabs` inválido: mais de 3, alvo que não aceita aba, título grande, ou aba sem o escopo do alvo. |
| `110` (400) | `cards` inválido: mais de 3, `size` fora de small/medium/large, título grande. |
| `111` (400) | Ao abrir: `surface` desconhecida (use `page`, `modal`, `tab` ou `card`). |
| `112` (404) | Ao abrir: página, aba ou card que a versão do plugin não declara. |
| `66` (400) | `actions` inválido (agora também em português): alvo inexistente, escopo faltando, mais de 10, id repetido. |
| `68` (404) | Entidade que não existe ou que o usuário não pode ver (em lote, qualquer uma delas derruba a abertura). |

## Reconsentimento

- **Não pede** novo consentimento: mudar `page`/`pages`, `actions`, `tabs` ou `cards` (é lugar na tela, não acesso a dado).
- **Pede**: escopo novo (inclusive o escopo exigido por um alvo novo), como sempre. Declare o escopo no mesmo deploy da ação ou aba.
- A tela de aprovação mostra "Onde o plugin aparece": páginas com o grupo, ações com a tela, abas e cards.

## Catálogo de escopos

Básicos: `budgets:read`, `customers:read`, `funnels:read`, `users:read`, `tasks:read`, `tasks:write`.
Leitura por tela (cada um exige a permissão de tela equivalente do usuário): `jobs:read`, `expenses:read`, `incomes:read` e, para os alvos
adicionais da tabela acima, `feedstocks:read`, `purchase-orders:read`, `stock-movements:read`, `stock-centrals:read`, `suppliers:read`, `employees:read`,
`agencies:read`, `cost-centers:read`, `equipments:read`, `processes:read`, `products:read`, `outsourceds:read`, `fixed-expenses:read`,
`financial-transactions:read`, `credit-cards:read`, `commissions:read`, `bank-reconciliations:read`, `invoices:read`, `contracts:read`.
`storage` é implícito e `me` vale sempre: não declare (nem para funções). Escopo fora da lista faz a validação falhar.

Leitura do registro: `hold.api.get('/<recurso>/<id>')` (ex.: `/jobs/<id>`, `/expenses/<id>`), só com `_id`, sem dado pessoal, salário, bancário ou segredo.
`POST /<recurso>/query` existe só onde a API tem índice (hoje `jobs` e `expenses`; `incomes` ainda **não**: a consulta responde `93`, mas o
botão e o `GET /incomes/<id>` funcionam). Detalhes em `sdk-reference.md` e `api-v1-reference.md`.

> Se `holdprint plugin validate` recusar um alvo da tabela com erro `66`, a sua CLI está desatualizada: rode `npm install -g @holdprint/cli` e use só os alvos que ela lista.

## O que a CLI faz com o manifesto

- Valida contra o schema antes do deploy.
- O `pluginId` (`p-` + 10 caracteres) é **gerado pelo registro**; nunca escolha nem edite.
- Traduz para o manifesto interno (origem permitida = WebApp; `network.domains` viram os domínios declarados; sem `functions` não há rotas de API).

## Mudou escopo?

Depois de alterar `scopes`, rode `holdprint plugin deploy` de novo; a CLI garante a instalação na conta.

Mudar o conjunto de escopos pede **novo consentimento** (mudar só o `purpose` não pede): o plugin segue com os escopos
antigos e o escopo novo responde `403 HOLD_PLUGIN_PLATFORM_9` até um Administrador aprovar pelo link
`/plugins/consent/<id>` que a CLI imprime. Mostre o link ao usuário e peça a aprovação. Depois dela o escopo novo vale
na próxima renovação do token (até 10 min, ou ao reabrir o plugin).
