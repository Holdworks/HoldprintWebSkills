# HANDOFF — @holdprint/skills + tela "API & IA" (sessão 2026-06-14)

Para o próximo agente que assumir o workspace `HoldprintWeb`. Tudo abaixo foi feito nesta sessão.
**Nada foi commitado** (regra `git-safety` — Rafael commita manualmente). Idioma: pt-BR; código/commits em inglês.

---

## 1. Objetivo da sessão

Rafael (CEO, vibe coding) quer que **clientes do ERP Holdprint** usem LLMs (Claude Code, Codex,
Cursor, Gemini, Copilot) contra o sistema, de 2 jeitos:
1. via o **MCP hospedado** (OAuth);
2. via **connection string read-only do MongoDB** de produção (só alguns clientes recebem).

As LLMs erravam o domínio (budget/custeio = `CostMemento`, field resolver, blocos, campos dinâmicos).
Entregáveis: (A) pacote npm com CLI npx que instala **skills de usuário**; (B) conteúdo das skills;
(C) tela nova em Ajustes do WebApp explicando instalar/usar.

---

## 2. DECISÕES TRAVADAS (não reabrir sem o Rafael)

- **MCP canônico = o de 10 tools genéricas** em `HoldprintWeb/holdprint-mcp` (`holdprint_discover`,
  `holdprint_describe`, `holdprint_query`, `holdprint_count`, `holdprint_aggregate`, `holdprint_get`,
  `holdprint_discover_actions`, `holdprint_action`, `holdprint_report`, `holdprint_examples`).
  **O MCP V3 de 106/200+ tools** (`HoldWebSystemCatalog/.worktrees/AB#54160-Mcp-V2/...`) **VAI SER DESABILITADO — ignore.**
- Distribuição: **pública** (npm público + GitHub público). Instalação: **CLI própria branded** (`npx @holdprint/skills install`).
- **2 skills separadas**: `holdprint-mcp` (via MCP) e `holdprint-mongo` (via Mongo read-only).
- Tela: **React + shadcn**, seção nova "API & IA". **A connection string do Mongo NÃO é exposta na tela** (só explica como usar).
- Harnesses suportados: **todos os principais**.

---

## 3. O QUE FOI FEITO

### A) Pacote `@holdprint/skills` — `HoldprintWeb/HoldprintSkills/` (repo NOVO, ainda sem git)
Node ESM puro (sem build/tsc, igual ao `impeccable`). Arquivos:
- `package.json` (name `@holdprint/skills`, bin `holdprint-skills` → `bin/cli.mjs`, `files` = bin/lib/skills/README/LICENSE)
- `bin/cli.mjs` — comandos `install | update | check | mcp | help`; flags `--harness=` e `--project`.
- `lib/harnesses.mjs` — mapa harness→dir (copiado do impeccable): Claude `.claude/skills`, Codex `.agents/skills`,
  Cursor `.cursor/skills`, Gemini `.gemini/skills`, Copilot `.github/skills`; default `.claude`+`.agents`.
- `lib/installer.mjs` — copia skills + grava marker `.holdprint-skills-version`.
- `lib/mcp.mjs` — instruções de conexão OAuth; **`MCP_URL` centralizado aqui** (placeholder, ver §5).
- `skills/holdprint-mcp/` → `SKILL.md`, `tools-reference.md`, `journeys.md`.
- `skills/holdprint-mongo/` → `SKILL.md`, `schema-reference.md`, `relationships.md`, `dynamic-fields.md`, `query-cookbook.md`.
- `README.md`, `LICENSE` (MIT), `.gitignore`.
- `COSTMEMENTO-E-MEDIDAS.md` — doc avulso (handoff p/ outra LLM) sobre custeio e medidas. **Não vai no npm** (fora do `files`), mas vai no GitHub.

**Validação feita:** `node bin/cli.mjs install` num HOME temporário gravou nas pastas certas; `check` ok;
`npm pack --dry-run` limpo (15 arquivos, sem node_modules). CLI `--version`/`help` ok.

### B) Skills — validadas por teste TDD (baseline-vs-skill)
Rodei 2 sub-agentes na mesma tarefa real ("monte a query do custo do orçamento X + campos dinâmicos do produto"):
- **sem** a skill: errou (pôs `total_price` no Budget, não conhecia `CostMemento`, chutou `customFields` camelCase, não decodificou `hold…`).
- **com** a skill: acertou tudo. Confirma que a skill resolve o gap.

### C) Tela "API & IA" no WebApp — `HoldprintWeb/HoldprintWebApp/`
Arquivos NOVOS:
- `webapp/src/react/components/ApiAiOnboarding/ApiAiOnboarding.jsx` (React+shadcn; Tabs: Instalar skills / Conectar MCP / Banco read-only / FAQ; code-blocks copiáveis; pt-BR literal).
- `webapp/src/view/partials/settings/api-ai/api-ai.html` (wrapper com `<api-ai-onboarding>`).
- `webapp/src/js/controllers/settings/api-ai-onboarding-controller.js` (gate de admin).

Arquivos EDITADOS (3):
- `webapp/src/react/react-wrapper.js` — import + `.component('apiAiOnboarding', react2angular(ApiAiOnboarding, []))`.
- `webapp/src/js/startup/config.js` — state `app.settings.api_ai` (url `settings/api-ai`), logo após `app.settings.api`.
- `webapp/src/js/controllers/settings/SettingsController.js` — item de menu `{ text: 'API & IA', route: 'app.settings.api_ai', url: 'api-ai' }` (no bloco `if (isAdministrator)`).

**Validação:** JSX parseia com o babel do projeto; exports/imports shadcn conferem; controller e config passam `node --check`. **Build NÃO foi rodado** (regra do repo: auto-compile; proibido `npm run less/bundle/uglify`). Verificação visual ao vivo ainda não feita.
> Obs.: `M .gitignore` e `?? .ports.json` no WebApp são do hook de onboarding, **não** desta tarefa.

---

## 4. FATOS TÉCNICOS QUE O PRÓXIMO AGENTE PRECISA SABER (verificados no código .NET)

- **Custeio:** o preço/custo do orçamento está em **`CostMemento`**, não no `Budget`.
  Join: `Budget.code (int) == CostMemento.public_identification (int)` (NÃO ObjectId); ou
  `Budget.winner_propose_id → Propose.calc_id → CostMemento._id`. `CostMemento` é **versionado** (maior `version`).
- **Quantidade:** `CostMementoItem.quantity` (e `production_quantity`/`billing_quantity`; no produto `BudgetProduct.quantity`/`sale_quantity`).
- **Medidas (largura/altura/…):** campos dinâmicos no bloco **`WorkMeasures` (block_type=2)** + `BudgetProduct.block_fields_values`;
  chaves `"hold"+ObjectId` → resolver via collection **`Fields`** (tira "hold", casa `_id`, lê `name_key`: WIDTH/LARGURA, HEIGHT/ALTURA, LENGTH/COMPRIMENTO, THICKNESS/ESPESSURA). Unidade via `MeasurementUnits`.
- **Valor polimórfico:** discriminador é **`class_name`** (nome completo da classe .NET), **não `_t`**; valor em `number`/`content`/`date`.
- **"Bloco simples/composto"** = `BlockContent.block_content_type` enum `SimpleField=1 / ComposedFields=2 / Filter=3`. (`Block.block_type` é outra coisa: Custom=1…WorkMeasures=2…GeneticAccuracyOptions=8.)
- **No Mongo cru, enums são INTEIROS** (`Budget.state`: 1=Open, 2=Lost, 3=Won) — diferente do MCP que aceita string.
- **Feedstock:** `fields_values` é **ARRAY** de dicts; Product/Process/Equipment é dict único.
- **Soft delete** em tudo (`deleted: false`); Product/Entity têm `active`, Budget/Process/Equipment não.
- (Tudo isto está detalhado em `HoldprintSkills/skills/holdprint-mongo/*` e em `HoldprintSkills/COSTMEMENTO-E-MEDIDAS.md`.)

---

## 5. PENDÊNCIAS (o que falta)

**Depende do Rafael:**
1. **URL de produção estável do MCP.** Hoje o MCP roda no **ngrok pessoal dele** (`https://rafa-holdprint-mcp.ngrok.app/mcp`), que **NÃO pode** ir no pacote público (regra de isolamento ngrok — ngrok é só do Rafael, repos compartilhados não podem ter URL ngrok). Por isso usei placeholder **`https://mcp.holdprint.net/mcp`** ("a confirmar"). Quando ele tiver a URL estável, trocar em **2 lugares**: `HoldprintSkills/lib/mcp.mjs` (`MCP_URL`) e `HoldprintWebApp/.../ApiAiOnboarding.jsx` (const `MCP_URL`).
2. **`npm publish --access public`** (org `@holdprint`, auth do Rafael) e **criar o repo GitHub público** do `@holdprint/skills`.
3. **Commit/PR** de tudo (nada foi commitado).

**Pode ser feito por agente:**
4. **i18n do menu:** o rótulo "API & IA" está como literal pt-BR (seguindo a regra do WebApp de deixar i18n para o translation-expert). Rodar `translation-expert`/`translation-workflow` para localizar nos 6 idiomas (`webapp/translations/translation-*.json`), se quiser localizar.
5. **Verificação visual** da tela: subir o WebApp (porta 8000) + backend, logar como admin, ir em Ajustes → "API & IA", conferir as 4 abas, copiar comandos, e confirmar que a string do Mongo não aparece. (Não rode `npm run` de build — é auto-compile.)
6. (Opcional) Incorporar `COSTMEMENTO-E-MEDIDAS.md` como reference file dentro da skill `holdprint-mongo` para ir junto no `npx install`.
7. (Opcional) Calibrar `name_key` reais do cadastro do Rafael rodando contra um tenant de teste read-only (largura/altura podem ter name_keys específicos).

---

## 6b. SESSÃO 2026-06-14 (continuação) — unificação + docs site

Assumido o handoff acima e avançado:

- **Tela unificada (tudo num lugar só):** `ApiAiOnboarding.jsx` agora tem **5 abas** — nova **"Chave de API"** (token pessoal via bridge `AngularService.resolveDependency('HoldprintAccount')` → `loadApiKeyConfiguration`/`generateNewApiKey`) + Instalar skills, Conectar MCP, Banco read-only, FAQ. O item de menu antigo **"API"** foi REMOVIDO do `SettingsController.js` (a rota `app.settings.api` e os arquivos antigos `settings/api/*` continuam existindo, só não há mais link). Agora há **um único** item de menu.
- **Bug `&amp;` corrigido:** o menu usava `'API & IA'` e o `$translateProvider.useSanitizeValueStrategy('escape')` escapava o `&`. Rótulo do menu agora é **"API e IA"** (sem `&` cru). O H1 da tela (React) segue "API & IA — conecte LLMs ao Holdprint" (renderiza certo). Validado logado no WebApp local: token real carrega, 5 abas ok, breadcrumb "Ajustes / API e IA" limpo.
- **Docs site público** estilo impeccable.style/docs em **`HoldprintSkills/docs/`** (`index.html` + `styles.css` + `app.js` + `assets/oauth-login.png`): tema claro refinado, acento azul Holdprint, sidebar com scroll-spy, code-blocks escuros com copiar, tabs claude.ai/ChatGPT, mock do diálogo "Adicionar conector personalizado", **screenshot REAL da tela de login OAuth** embutido. Seções: Visão geral, Início rápido, Claude Code, claude.ai & ChatGPT, Instalar skills, Como usar, Tools do MCP, Banco read-only, FAQ. Servir: `python3 -m http.server 8010 --directory docs`. Pronto p/ GitHub Pages.
- **Rodar local (validado):** WebApp em 8000 (auth `HoldprintNetAuth.Api` na 44300 com env `HOLDPRINT_WEB_API_URL=http://localhost:44370/` → API na 44370, banco TEST; login `rafaelahmann@gmail.com` funciona); docs em 8010.

Pendências novas: trocar placeholder `mcp.holdprint.net` (lib/mcp.mjs, ApiAiOnboarding.jsx, docs/*) pela URL prod real; criar repo `github.com/holdprint/skills` (linkado nos docs); i18n do rótulo de menu (hoje literal "API e IA").

## 6. REGRAS DO WORKSPACE (não violar)

- **NUNCA** commit/push/merge/rebase/reset sem pedido explícito (vale para os 18 subrepos).
- **NUNCA** rodar build manual no WebApp (`npm run less/bundle-js/uglify`) — auto-compila.
- **NUNCA** colocar URL ngrok / porta trocada em arquivo versionado de repo compartilhado.
- Antes de criar service/endpoint/campo/collection novos: consultar o catálogo MCP (regra `catalog-usage`).
- Memórias relevantes: `project_holdprint_skills_package`, `project_new_mcp_holdprint`, `project_holdprint_soft_delete` (em `~/.claude/projects/.../memory/`).
