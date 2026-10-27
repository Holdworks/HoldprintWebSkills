---
name: holdprint-cli
description: Use quando o usuário pedir para consultar ou operar a conta do Holdprint (ERP) pelo terminal ou pelo Claude Code — "lista os orçamentos abertos", "quantos clientes novos esse mês", "cadastra um cliente", "ganha o orçamento 1064", "dá baixa na conta a pagar", "o que eu posso fazer pela CLI", "holdprint whoami", "holdprint query", "holdprint actions", "holdprint tools". Ensina `holdprint whoami`, `holdprint api`, `holdprint query` (consulta genérica), `holdprint actions list/describe/run` (escritas, com `--dry-run`), `holdprint tools` (as ferramentas do MCP: relatórios, checkup, breakeven, importadores, add_item, catálogo), `holdprint files upload`, paginação, Idempotency-Key e os erros 85 e 88–96 com "como corrigir". Para criar plugin use `holdprint-plugins`; para o MCP hospedado, `holdprint-mcp`.
---

# Operar a conta do Holdprint pela CLI

## O que é

A CLI `holdprint` (a mesma dos plugins) também lê e opera a **conta do próprio usuário**, sem abrir plugin nem tela. Tudo roda
**como o usuário que fez login**: os escopos do token são o catálogo ∩ as permissões do perfil dele, e a visibilidade dos
dados é a do perfil. O que o usuário não vê no Holdprint, a CLI também não vê.

Quatro caminhos:

| Preciso de | Use | Detalhe |
|---|---|---|
| Ler pela API estável (`/v1`) ou ler **qualquer** rota `/api/...` por GET (registro por id, dashboards, cadastros) | `holdprint api` | abaixo |
| Consultar os recursos liberados, com filtro, campos e ordenação | `holdprint query` | `query-reference.md` |
| Escrever (cadastrar, criar/ganhar orçamento, estoque, financeiro, nota) | `holdprint actions` | `actions-reference.md` |
| Relatórios, checkup, breakeven, importadores, adicionar item calculado, catálogo/descoberta de entidades (tudo que o MCP faz) | `holdprint tools` | abaixo e `actions-reference.md` |
| Enviar um arquivo (PDF, imagem, HTML) para a conta | `holdprint files upload` | abaixo |

## Entrar e conferir quem sou

1. `holdprint login` (device code: a CLI imprime um código e um endereço; o usuário abre no navegador já logado, confere e clica
   em **Aprovar**). Nunca peça a senha, nunca leia nem copie o token da CLI.
2. `holdprint whoami` mostra usuário, conta, perfil e escopos. Rode antes de qualquer coisa: se faltar `erp:read` ou
   `actions:run`, refaça o login.

## `holdprint api` (a API /v1)

```bash
holdprint api GET /v1/budgets --fields id,code,customer
holdprint api GET /v1/customers --paginate --max-pages 5
holdprint api POST /v1/tasks --data @tarefa.json --idempotency-key tarefa-visita-acme-2026-10-30
holdprint api --list            # lê o OpenAPI e lista as rotas disponíveis
holdprint api GET /api/jobs/<id> --fields id,code,customer   # GET/HEAD em qualquer rota /api/... (registro por id, whoami completo)
holdprint api GET /api/company/standard                      # empresa padrão da conta
```

- Verbos `GET`, `HEAD`, `POST`, `PUT`, `DELETE`. Fora do `/v1`, o `api` **só lê** (GET/HEAD; rotas `api/internal` e de chave de API
  ficam de fora). Escrita fora do `/v1` é por `actions run`. Corpo com `--data @arquivo.json` ou `--data -` (stdin).
- `--fields a,b,c` corta a resposta nos campos pedidos (poupa contexto).
- `--paginate` segue as páginas até acabar; **sempre combine com `--max-pages`** em listas grandes.
- Storage e events do `/v1` exigem uma instalação de plugin: pela CLI dão erro com "como corrigir". Use `/v1` só para o resto.
- Saída: tabela no terminal; **JSON quando vai para um pipe** (`holdprint api GET /v1/budgets | jq ...`).

## `holdprint query` e `holdprint actions`

Resumo; os detalhes estão nas referências.

```bash
holdprint query --list                                   # recursos ligados, campos, filtros e ordenações permitidos
holdprint query budgets --where state=Open --fields id,code,customer,businessValue --sort -creationTime --limit 50
holdprint actions list --search cliente --risk medium    # o que dá para escrever
holdprint actions describe <acao>                        # schema do corpo, risco, se pede aprovação
holdprint actions run <acao> --data @corpo.json --dry-run   # mostra método, rota final, corpo, risco e impacto SEM enviar
holdprint actions run <acao> --data @corpo.json          # executa direto
holdprint api --help | holdprint query --help | holdprint actions --help   # uso exato de cada comando
```

Fluxo certo, sempre: **`query --list` / `actions list` antes de adivinhar nome de recurso, campo ou rota.**

## `holdprint tools`: o que o MCP faz, pela CLI

A CLI chama o MCP hospedado do Holdprint com o mesmo login (`holdprint login`); não há outra senha. Quando as rotas cruas não
bastam (relatório pronto, checkup, ponto de equilíbrio, importador em lote, item de orçamento já calculado, catálogo de campos),
use as ferramentas.

```bash
holdprint tools list [--json]                       # nome + descrição curta
holdprint tools describe holdprint_report           # parâmetros legíveis (obrigatório/opcional, valores aceitos)
holdprint tools run holdprint_report --name vendas_reais --de 2026-10-01 --ate 2026-10-31
holdprint tools run holdprint_report --json '{"name":"saldo_estoque"}' --out /tmp/estoque.txt   # grava a saída; leia com jq/cat
holdprint tools run holdprint_import --data @clientes.json
```

- URL do MCP: `--mcp-url`, `HOLDPRINT_MCP_URL` ou `mcpBase` no config; no ambiente local é `http://localhost:3045/mcp`.
- Argumentos: `--json '{...}'`, `--data @arquivo.json` ou `--campo valor` (aninhado com ponto: `--filtro.estado Open`; números, `true`,
  `[...]` e `{...}` são entendidos como JSON). Os flags valem por cima de `--json/--data`.
- O texto devolvido pela ferramenta sai como texto. Em resposta grande use `--out arquivo` e fatie com `jq`/`head`.
- 401: rode `holdprint login` de novo. Ferramenta inexistente: a CLI lista as parecidas.
- Mapa intenção -> comando:

| Quero | Comando |
|---|---|
| Relatório pronto (vendas, ticket médio, jobs atrasados, estoque, contas a pagar/receber, fluxo de caixa, rentabilidade, conversão, forecast) | `tools run holdprint_report --name <relatório>` (`tools describe holdprint_report` lista os nomes) |
| Checkup gerencial / ponto de equilíbrio | `tools run holdprint_checkup`, `tools run holdprint_breakeven` |
| Importar clientes, fornecedores, financeiro, estoque, matéria-prima em lote (com dry-run) | `tools run holdprint_import`, `holdprint_import_financials`, `holdprint_import_stock`, `holdprint_import_feedstock` |
| Adicionar item ao orçamento já calculado | `tools run holdprint_add_item` |
| Descobrir/descrever entidades e campos; consultar, contar e somar qualquer entidade | `tools run holdprint_discover`, `holdprint_describe`, `holdprint_query`, `holdprint_count`, `holdprint_aggregate` |
| Link público do orçamento, transferência e preço de insumo | `tools run holdprint_budget_link`, `holdprint_stock_transfer`, `holdprint_set_feedstock_price` |
| Anexar documento HTML a um orçamento | `tools run holdprint_attach_document` (ou `files upload` + ação `add-files`) |

## Enviar arquivo: `holdprint files upload`

```bash
holdprint files upload orcamento.pdf        # multipart em api/account-files; imprime {"id": "..."}
```

Tem `Idempotency-Key` pelo hash do arquivo (reenviar o mesmo arquivo não duplica). Use o `id` na ação que anexa
(ex.: `BudgetsController.AddFile:PUT:api/budgets/{budgetid}/add-files --data '["<id>"]'`).

## Escrita: execute direto, mostre antes quando pesar

As ações executam **direto**: a comunicação é entre a pessoa e o Claude dela, sem fila de aprovação. Isso muda a responsabilidade
para você:

- Antes de escrita de **dinheiro** (baixa, lançamento, estoque valorizado), **nota fiscal** ou **mensagem externa** (e-mail,
  WhatsApp, link público), rode com `--dry-run`, mostre ao usuário método, rota, corpo, risco e impacto, e só execute depois do OK.
- Para o resto (cadastro, mover etapa, tarefa), execute e relate o que gravou; releia o registro para provar.
- Nunca escreva o que o usuário não pediu; nunca reenvie com outra Idempotency-Key para "furar" a proteção contra duplicar.
- **Caso raro: aprovação.** Só uma rota que a plataforma marcou para aprovação responde 428 (erro 89). Aí a CLI imprime
  `Link de aprovacao: <Holdprint>/aprovacoes/<id>` e **espera**; mostre o link ao usuário (só um Administrador aprova, na tela;
  vale uma execução, 30 minutos, para exatamente aquele corpo). Recusada ou expirada: diga ao usuário e pare. Não contorne com
  outra rota nem divida a ação.

## Idempotency-Key

Toda escrita pela CLI exige uma `Idempotency-Key` (sem ela, erro 90). `api` e `actions run` geram a chave **a partir do
conteúdo** (método + rota + corpo); em `api`, `--idempotency-key` fixa outra. A mesma intenção (mesmo corpo) usa sempre a mesma
chave, assim repetir por timeout ou erro de rede **não duplica** o cadastro, o lançamento ou a baixa: a WebApi devolve a
resposta guardada com o cabeçalho `Idempotent-Replayed: true`.

**Janela de idempotência: 24 horas.** Dentro dela, duas escritas idênticas viram UMA só (a segunda é replay). Se o usuário quer
repetir de propósito a mesma escrita (ex.: duas tarefas iguais, a mesma movimentação duas vezes), **mude algo que identifique a
operação** (título, observação, data) ou passe uma `--idempotency-key` nova e descritiva (`api`). Mesma chave com corpo
diferente dá erro 400. Nunca use timestamp ou aleatório puro "por garantia": isso derruba a proteção contra duplicar.

## Paginação

- `api`: `--paginate` (e `--max-pages`), ou `page`/`pageSize` na rota.
- `query`: `--limit` é o tamanho da página (até **100**); `--paginate` segue o cursor sozinho até `--max-pages` (padrão 10).
  Para **contar ou somar**, use `--limit 100 --paginate --max-pages 100` e confira que `nextCursor` veio `null` (senão a lista
  foi cortada). `state` do orçamento vem como número: 1 aberto, 2 perdido, 3 ganho (reaberto mantém `wonDate`). Detalhes em
  `query-reference.md`, seção "Contar e somar". Para sincronizar o que mudou, `--updated-since <data ISO>` em vez de reler tudo.
- Resposta traz `nextCursor` (query) ou `hasNextPage` (api). Nunca assuma que a primeira página é tudo; diga ao usuário quando
  cortou por `--max-pages`/`--limit`.

## Erros: como corrigir

A CLI imprime o código e uma dica. Resumo:

| Código | HTTP | Significa | Como corrigir |
|---|---|---|---|
| 85 | 403 | Rota não liberada para token delegado | Não há como liberar pela CLI. Use outra rota do `api --list`/`query --list`/`actions list`, ou peça ao usuário para fazer na tela. Não tente outro caminho para o mesmo efeito. |
| 88 | 403 | Ação não exposta (`ActionNotExposed`) | A rota não está na lista de `actions list`. Diga ao usuário que a CLI ainda não faz isso. |
| 89 | 428 | Rota marcada para aprovação (caso raro) | Não é falha: mostre o link de aprovação e espere (ver acima). |
| 90 | 400 | Falta a Idempotency-Key | Reenvie com `--idempotency-key` estável por conteúdo. |
| 91 | 409 | Aprovação não confere com o pedido | O corpo mudou depois de aprovado, ou a aprovação já foi usada. Peça nova aprovação com o corpo final. |
| 92 | 429 | Teto diário de aprovações da conta | Pare; avise o usuário que o limite do dia foi atingido. |
| 93 | 404 | Recurso de consulta não ligado | `holdprint query --list` e escolha um recurso ligado. |
| 94 | 400 | Filtro em campo sem índice | Use só os filtros que `query --list` marca como permitidos; refine por outro campo ou por `--updated-since`. |
| 95 | 400 | Campo não permitido | Use os campos de `query --list`. |
| 96 | 429 | Muitas escritas simultâneas na conta | Espere o `Retry-After` e repita **com a mesma chave**; não dispare escritas em paralelo. |

Outros: `401` = refazer `holdprint login`; `403` sem código acima pode ser perfil sem permissão (diga qual) ou o interruptor
**"Acesso por CLI e MCP"** desligado na conta (tela Plugins; só o Administrador liga). Nesse caso a CLI inteira dá 403, e o
usuário precisa pedir ao Administrador.

## Limites conhecidos

- **Rotas que repassam o token do usuário ao Auth ou ao Merlin não funcionam pelo terminal** (o token delegado não serve nelas).
  Se aparecer 401/403 numa rota que parece permitida, diga isso ao usuário em vez de insistir.
- Plugins (quadro, funções) não mudam com o interruptor da conta; só `api`, `query` e `actions`.
- Cliente (`CustomersController.Create`) e orçamento (`BudgetsController.Create`) **já podem ser criados** pela CLI, como as demais
  rotas JWT de escrita do ERP (mais de mil rotas, achadas por `actions list --search`).
- Não há `GET` em `actions list` (só escrita): para ler use `api GET /api/...`, `query` ou `tools`.
- Streams (SSE), download binário (PDF/XML) e rotas que repassam o token ao Merlin/Auth não funcionam por `actions run`; use `tools`
  ou diga ao usuário.
- Depois de `--no-wait`, rodar o mesmo comando de novo gera **outro** pedido de aprovação; para não pedir duas vezes, prefira
  esperar (sem `--no-wait`).

## Treinar sem risco

A conta **91585** ("Gráfica Exemplo") é uma base congelada, usada para treino e medição. Em dúvida sobre um comando, ensaie
nela. Em conta real, **leitura primeiro**; escrita só quando o usuário pediu aquela escrita.

## Regras

1. Descubra (`--list`, `describe`) antes de chamar.
2. Leia com `--fields`; não despeje o registro inteiro.
3. Não grave nada que o usuário não pediu; mostre (`--dry-run`) o que vai fazer antes de escrita de dinheiro, nota fiscal ou mensagem externa.
4. Nunca contorne interruptor, permissão ou, no caso raro, aprovação.
5. Nunca imprima, guarde ou envie o token da CLI.
6. Relate no fim: o que leu/escreveu, quantos registros, e se alguma escrita ficou aguardando aprovação (caso raro).

## Referências

- `query-reference.md`: consulta genérica, `--where`, operadores, campos, ordenação e paginação.
- `actions-reference.md`: descoberta, `--dry-run`, execução, Idempotency-Key, receitas (estoque, preço de insumo, CNPJ/CEP, ganhar orçamento), mapa de nomes do MCP e a aprovação rara.
