---
name: holdprint-mcp
description: Use when working with a Holdprint ERP through the hosted Holdprint MCP (tools named holdprint_*) — reading orçamentos/budgets, clientes, produção/jobs, financeiro, estoque or NFe/fiscal, or building reports, integrations and automations on Holdprint data. Triggers when the holdprint MCP is connected or the user mentions Holdprint, orçamento, NF-e, ordem de produção.
---

# Holdprint ERP via MCP

## O que é

O MCP da Holdprint expõe **28 tools** (`holdprint_*`), a maioria genérica. Você fala uma linguagem
simples; o servidor traduz para o formato interno da API, converte enums (ex.: `state 'Open' → 1`)
e **injeta `deleted: false` automaticamente** (não traz registros excluídos a menos que você peça).

Você NÃO escreve query Mongo aqui — isso é a skill `holdprint-mongo`. Aqui você usa as tools.

## Regra de ouro: descubra antes de consultar

Sempre siga este fluxo — não adivinhe nomes de entidade ou de campo:

1. `holdprint_discover` — resolve um termo pt-BR para a entidade canônica (ex.: "orçamento" → `Budget`) ou lista todas.
2. `holdprint_describe` — retorna os **nomes exatos dos campos** e enums daquela entidade.
3. `holdprint_query` / `holdprint_count` / `holdprint_aggregate` — leitura com os campos certos.

Para tarefas comuns, antes de montar do zero: `holdprint_examples` (jornadas prontas).

## As 28 tools

**Leitura** (não alteram nada):

| Tool | Quando usar |
|---|---|
| `holdprint_whoami` | Conta, usuário e empresa padrão da sessão |
| `holdprint_discover` | Ponto de entrada de leitura: listar entidades ou resolver termo pt-BR → nome canônico |
| `holdprint_describe` | Ver campos/tipos/enums exatos de uma entidade antes de filtrar |
| `holdprint_query` | Listar registros com filtro simples, ordenação e paginação |
| `holdprint_count` | Contar registros sem trazer a lista ("quantos X") |
| `holdprint_aggregate` | sum/avg/min/max/count de um campo numérico, com `groupBy` opcional |
| `holdprint_get` | Buscar 1 registro por `id` |
| `holdprint_job_slim` | Resumo de uma ordem de produção, sem estourar o contexto |
| `holdprint_report` | Relatórios em R$ que somam sub-documentos (vendas_total, nfe_faturamento…) |
| `holdprint_checkup` | Raio-X gerencial mês a mês (KPIs do dono) |
| `holdprint_breakeven` | Ponto de equilíbrio consolidado mês a mês |
| `holdprint_discover_actions` | Descobrir ações não-CRUD (ganhar orçamento, emitir NFe…), parâmetros e se são `destructive` |
| `holdprint_action_preview` | Prévia de uma ação: mostra o efeito e devolve o `previewId` (não executa) |
| `holdprint_lookup_cnpj`, `holdprint_lookup_cep` | Dados públicos de CNPJ/CEP (fonte externa) |
| `holdprint_examples` | Exemplos prontos de jornadas comuns |

**Escrita** (alteram dados):

| Tool | Quando usar |
|---|---|
| `holdprint_action` | Executar uma ação **não destrutiva**, direto. Ação `destructive` é recusada aqui |
| `holdprint_action_execute` | Executar uma ação destrutiva a partir do `previewId` (só ele) |
| `holdprint_attach_document` | Anexar um HTML (ex.: proposta) a um orçamento |
| `holdprint_import` | Importar clientes/fornecedores em lote (prévia obrigatória) |
| `holdprint_import_financials` | Importar contas a receber/pagar em lote (prévia obrigatória) |
| `holdprint_import_stock` | Importar movimentações de estoque em lote (prévia obrigatória) |
| `holdprint_import_feedstock` | Importar matérias-primas em lote (prévia obrigatória) |
| `holdprint_budget_link` | Gerar o link público de um orçamento |
| `holdprint_add_item` | Adicionar um item com medidas a um orçamento e calcular |
| `holdprint_stock_movement`, `holdprint_stock_transfer`, `holdprint_set_feedstock_price` | Movimentar, transferir estoque e definir preço de matéria-prima |

Toda tool traz anotações MCP (`readOnlyHint`, `destructiveHint`) no `tools/list`; o cliente
(Claude, ChatGPT, Cursor) as usa para decidir quando pedir confirmação ao usuário.

Parâmetros detalhados de cada tool: ver `tools-reference.md`.
Receitas completas (relatórios, custo de orçamento, etc.): ver `journeys.md`.

## Filtros (`where`) — formato

```jsonc
// igualdade
{ "state": "Open" }
// operadores: eq, ne, contains, notContains, lt, lte, gt, gte, in
{ "code": { "gte": 100 }, "validityDate": { "lte": "2026-06-11" } }
```

- Datas em `YYYY-MM-DD`. Enums em **inglês** (`Open`, `Won`, `Lost`, `Approved`…), nunca em pt-BR nem números.
- `fields`: liste os campos que quer de volta (default traz o mínimo).
- `sort`: `'-campo'` (desc) ou `'campo'` (asc).

## Soft-delete e "somente ativos"

- Leitura traz só `deleted: false` por padrão. Para incluir a lixeira: `includeDeleted: true`.
- Coleções com flag `active` (ex.: Product, Entity, FinancialAccount): para "somente ativos",
  adicione `where: { active: true }`. Budget/Process/Equipment **não** têm `active` — use `state`.

## Ações: direto, ou prévia + execução quando destrutiva

- Ação **não destrutiva** (`destructive: false` em `holdprint_discover_actions`): `holdprint_action` executa **direto**.
  `dryRun: true` (atenção: `dryRun`, camelCase) só se você quiser simular.
- Ação **destrutiva** (`destructive: true`: apagar, liquidar, estornar, mover dinheiro, emitir/cancelar NF-e):
  `holdprint_action` **recusa**. O caminho é:
  1. `holdprint_action_preview { actionName, args }` — não executa; devolve o efeito e um `previewId`.
  2. **Mostre o efeito ao usuário e espere a aprovação dele.**
  3. `holdprint_action_execute { previewId }` — executa exatamente o que a prévia mostrou.
- O `previewId` é de **uso único**, vale **10 minutos** e só serve para a mesma conta, o mesmo usuário e o mesmo
  `actionName` + `args`. Venceu ou foi usado: rode a prévia de novo. `confirmed: true` não existe mais e não executa nada.
- **Importações em lote** (`holdprint_import*`): `dry_run` é true por padrão e devolve um `previewId`. Para gravar,
  envie `dry_run: false` **com o `previewId` da simulação do mesmo conteúdo** (mesmas linhas, mapeamento e opções).
  Sem `previewId`, ou com conteúdo alterado, nada é criado.

## Anexar um documento HTML a um orçamento

`holdprint_attach_document { budgetId, html, fileName? }` sobe o HTML que **você** gerou e o anexa ao orçamento (aba de
anexos). Envie HTML estático e completo, até 1 MB. É recusado, antes de qualquer chamada ao ERP: HTML vazio, acima de
1 MB, e qualquer `<script>`, atributo `on...=`, `javascript:`, `iframe`, `object`, `embed`, `base` ou `meta refresh`.
Imagens e links externos são permitidos. Orçamento inexistente na conta ou importado (somente leitura) também é recusado.
Ache o `budgetId` com `holdprint_query` em `Budget`.

## Conexão pelo Hold Identity (sem senha)

Vale quando o servidor MCP roda com `HOLDPRINT_MCP_IDENTITY=hold` (a stack local sobe assim; sem a variável, o servidor continua no
modo `password`). Quando o MCP está no modo **`hold`** (`HOLDPRINT_MCP_IDENTITY=hold`), conectar abre a tela de autorização do **próprio Holdprint**, onde
o usuário já está logado: ele confere o acesso e aprova. **Não há campo de senha** e o MCP não guarda senha nem JWT do ERP (só um
refresh do Hold Identity, cifrado). As tools respondem com os dados e a visibilidade do usuário.
- Para conectar: `claude mcp add --transport http <nome> <url do MCP>/mcp` (local: `claude mcp add --transport http holdprint-local
  http://localhost:3045/mcp`) e autorizar pela tela que abrir (`/mcp` na sessão do Claude Code, ou `claude mcp login <nome>`). A tela é
  "Holdprint MCP" com a conta, o usuário, "Ler dados do Holdprint como você" e "Executar ações permitidas como você", e o botão **Permitir**. **Nunca** peça a senha ao usuário
  nem a coloque em configuração, mesmo que o servidor aceite (modos `password` e `jwt` seguem existindo, mas o padrão do usuário é `hold`).
- Para **revogar**: **Plugins > Acessos conectados** no Holdprint, linha do MCP. A próxima tool pede nova conexão (até 60 s).
- Se uma tool responder que a sessão expirou ou foi revogada, peça ao usuário para reconectar o MCP; não tente contornar.
- A CLI do plugin (`holdprint login`) é outra concessão, também listada em Acessos conectados.
- No modo hold (stack local), toda escrita leva uma `Idempotency-Key` **estável por conteúdo** e a WebApi guarda a resposta por
  **24 horas**: repetir a mesma escrita (mesmos argumentos) dentro dessa janela devolve o resultado da primeira, sem duplicar.
  Para repetir de propósito (ex.: a mesma movimentação de estoque duas vezes), mude algo que identifique a operação (observação,
  descrição). Escrita de alto impacto ou ainda não revisada devolve "Aprovação necessária: <link>": mostre o link, espere o
  usuário aprovar na tela, confira com `holdprint_check_approval` e repita a mesma tool com `approval_id`. Nunca contorne.
- No modo hold, `holdprint_attach_document` (upload multipart) não pode ser aprovado por link (o corpo muda a cada envio): a tool
  avisa e o anexo deve ser feito pela tela até a rota de upload ser revisada. `holdprint_budget_link` (gerar link público) segue o
  mesmo caminho das outras escritas: pode devolver "Aprovação necessária" e depois roda com `approval_id`.
- Limite conhecido do token delegado: rotas do ERP que repassam o token do usuário ao Auth ou ao Merlin falham pelo MCP nesse modo;
  diga isso ao usuário em vez de insistir.

## Erros comuns

| Erro | Correção |
|---|---|
| Inventar nome de entidade/campo | Use `holdprint_discover` + `holdprint_describe` primeiro |
| Enum em pt-BR ou número (`"Ganho"`, `1`) | Use o valor em inglês (`"Won"`) |
| Somar valor em R$ com `aggregate` e vir errado | Valores moram em sub-docs → use `holdprint_report` |
| Tentar executar ação destrutiva por `holdprint_action` (ou mandar `confirmed: true`) | Use `holdprint_action_preview` → aprovação do usuário → `holdprint_action_execute` |
| Gravar um lote com `dry_run: false` sem `previewId` | Rode a simulação primeiro e reenvie o mesmo conteúdo com o `previewId` dela |
| Mandar `dry_run` em `holdprint_action` | O parâmetro dessa tool é `dryRun` (camelCase); os importadores é que usam `dry_run` |
| Achar que "não tem dados" | Pode estar filtrando excluídos; tente `includeDeleted: true` para conferir |
