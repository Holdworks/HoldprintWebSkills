# Manifesto `holdprint.plugin.json`

Schema oficial: `schemas/holdprint.plugin.schema.json` no repo holdprint-plugins. Valide com `holdprint plugin validate [pasta]`.

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
| `schemaVersion` | `"2026-10-23"` na fatia 1. |
| `slug` | 3 a 40 caracteres, minúsculas, números e hifens, sem hifen nas pontas. Identifica o plugin do autor. O `deploy` faz upsert por slug. **Não** é o `pluginId`. |
| `name`, `description` | Pt-BR, curtos (nome até 60, descrição até 280). Aparecem na tela Plugins. |
| `scopes[]` | Cada item com `scope` (do catálogo) e `purpose` (por que precisa, em pt-BR). Só o necessário. |
| `contributes.page` | `menuTitle` (texto do menu) e `icon` (nome em kebab-case, ex.: `chart-bar`). **Opcional** se houver ao menos uma ação. Campos desconhecidos no manifesto são recusados. |
| `contributes.externalApps[]` | Opcional, até 3. Apps fora do Holdprint (TV, celular) que entram com a conta Holdprint. Veja a seção abaixo. |
| `contributes.actions[]` | Opcional, até 5. Botões no orçamento e em Novo registro. Veja a seção abaixo. |
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
| `schedules[].every` | `1m`, `15m`, `30m`, `1h`, `6h`, `12h`, `1d`; o servidor impõe um mínimo: 15 min em produção, 60 s só na stack local (`400 _60`). `description` aparece na aprovação como "<description>, <frequência>" (ex.: "Follow-up, todo dia"). |
| `path` (agenda, evento, hook) | Começa com `/api/`. |
| `schedules`, `events.path`, `hooks` | Exigem `functions.entry`. `events.path` exige `events.subscribe`. |
| `secrets[].name` | `^[A-Z][A-Z0-9_]{1,63}$`, até 20; só nomes declarados aqui podem ser gravados. O **valor** nunca vai no manifesto nem no chat (veja `functions-reference.md`). |
| `network.domains[]` | Até 10 sites públicos; sem IP, curinga, porta nem sufixo interno (`400 _62`). Domínio fora da lista dá 403 na saída. |

Exemplo completo: `examples/follow-up-automatico` no repositório holdprint-plugins (agenda, evento `budget.won`, hook `cobranca`,
dois segredos e um domínio).

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
- Mudar o `listing` **não** pede novo consentimento. O ícone da vitrine vem de `contributes.page.icon` (não há imagem própria).
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
| `origins[]` | `https://` ou `http://localhost` (só no ambiente local); `esquema://host[:porta]`, sem caminho. |
| `redirectUris[]` | Obrigatório em `web`; endereços exatos. Em `device` é recusado. |
| `scopes[]` | Subconjunto dos `scopes` do manifesto; escopo fora dele dá `400 HOLD_PLUGIN_PLATFORM_80`. |
| Limites | Até 3 apps. Fora das regras: `400 _80` (`ExternalAppInvalid`). |

**Consentimento:** app novo ou origem nova pede novo consentimento ("Acessa de fora do Holdprint: <app> em <origem>"). Remover não pede.
Guia completo: `external-apps-reference.md`.

## `contributes.actions`

```json
"contributes": {
  "actions": [
    { "id": "gerar-proposta", "title": "Gerar proposta", "icon": "file-text", "target": "budget", "open": "modal", "modal": { "size": "lg" } },
    { "id": "proposta-rapida", "title": "Proposta rápida", "icon": "bolt", "target": "new-record", "open": "page" }
  ]
}
```

| Campo | Regra |
|---|---|
| `id` | 2 a 39 caracteres: minúsculas, números e hifens, começando por letra ou número (`^[a-z0-9][a-z0-9-]{1,38}$`, o mesmo das agendas); único no plugin. É o `actionId` que o plugin recebe em `hold.context.launch` e o `acao=` do deep link. |
| `title`, `icon` | Texto do botão (pt-BR, até 60 caracteres; o toast de sucesso é "<title> concluída") e ícone opcional em kebab-case (até 40). |
| `target` | `budget` (menu do ícone de raio do orçamento) ou `new-record` (menu Novo registro). `budget` **exige `budgets:read`** em `scopes`. |
| `open` | `modal` ou `page`. `page` abre a tela do plugin (`ui.entry`) como página inteira, com o mesmo `launch`; não precisa de `contributes.page`. |
| `modal.size` | Só com `open: "modal"` (com `page` dá `66`): `md` (640 px), `lg` (960) ou `xl` (1200); altura 85vh. Omitido = `md`. |
| Limites | Até **5 ações**; o plugin precisa de **página, ação ou funções**. Fora disso o `validate`/`deploy` recusa (`400 HOLD_PLUGIN_PLATFORM_66`). |

- Plugin **só de ação** (sem `contributes.page`) não aparece no menu lateral; fica na tela Plugins e nos botões.
- Mudar ações **não** pede novo consentimento (é lugar na tela, não acesso a dado). Acrescentar escopo continua pedindo.
- O botão só aparece para quem pode usar o plugin, e some quando o plugin é desligado (cache de até 60 s).
- Template da CLI para este caso: `holdprint plugin create <pasta> --template acao` (uma ação de orçamento em modal).
- Exemplo completo: `examples/gerar-proposta` no repositório holdprint-plugins (só de ações: modal no orçamento e página em Novo registro).

## Catálogo de escopos (fatia 1)

`budgets:read`, `customers:read`, `funnels:read`, `users:read`, `tasks:read`, `tasks:write`.
`storage` é implícito e `me` vale sempre: não declare (nem para funções). Escopo fora da lista faz a validação falhar.

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
