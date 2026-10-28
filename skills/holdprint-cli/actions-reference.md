# `holdprint actions`: escrever na conta

## Comandos

```bash
holdprint actions list [--search texto] [--risk low|medium|high]
holdprint actions describe <acao>
holdprint actions run <acao> [--param nome=valor] [--data @corpo.json|-] [--dry-run] [--no-wait] [--interval SEGUNDOS] [--timeout SEGUNDOS]
```

A chave da ação é a de `actions list` (ex.: `ExpensesController.Liquidate:POST:api/expenses/liquidate`, rótulo "Liquidar
despesa"); passe-a inteira, entre aspas se o terminal pedir. `--param` preenche os `{parâmetros}` da rota; o que sobra vai na
query.

- `list` mostra, por ação: chave, verbo, rota, risco, se já foi revisada por humano, se tem prévia, idempotência e permissão.
- `describe` traz o JSON Schema do corpo. Monte o corpo **a partir dele**, não de memória.
- `run` chama a **própria rota interna** da ação, sem tradução: o que `describe` mostra é o que vai.
- `--dry-run`: resolve a rota e os parâmetros e imprime método, caminho final, corpo, risco, `impact`, `reviewed` e a Idempotency-Key,
  **sem enviar nada**. É a sua rede de segurança: use antes de escrita de dinheiro, nota fiscal ou mensagem externa e mostre ao usuário.
- `--no-wait`: só vale no caso raro de rota marcada para aprovação; imprime o link e sai.

## Fluxo

1. `holdprint actions list --search <assunto>` e escolha a ação (a busca é pelo rótulo, ex.: "Ganhar orçamento").
2. `holdprint actions describe <acao>`: leia risco e schema.
3. Antes de escrever, **leia** o que vai mexer (`query`/`api GET /api/...`) e confirme a entidade.
4. Grave o corpo em arquivo e ensaie: `holdprint actions run <acao> --data @corpo.json --dry-run`. Em dinheiro, nota fiscal ou
   mensagem externa, mostre o resultado ao usuário e espere o OK.
5. `holdprint actions run <acao> --data @corpo.json`: **executa direto** e devolve o resultado.
6. Releia o registro para provar que a escrita pegou; não confie só no 200.

## Aprovação (caso raro)

Nenhuma rota pede aprovação por padrão. Só se a plataforma marcar uma rota (`approval: sim` em `actions list`, ou o 428 / erro 89):

1. A CLI cria o pedido (`POST /v1/actions/approvals`) e imprime `Link de aprovacao: <Holdprint>/aprovacoes/<id>`.
2. Mostre o link ao usuário e **espere**: a CLI consulta o estado (`pending`, `approved`, `rejected`, `expired`, `consumed`) a cada
   3 s (`--interval`), até 1800 s (`--timeout`). Aprovada, repete a MESMA chamada com `x-hold-approval` (uma execução só).
3. Recusada, expirada (30 min), já usada ou teto diário (92): a CLI sai com erro. Reporte e pare.
4. Só um Administrador (ou quem tem a permissão da rota) aprova, pela tela. O token da CLI nunca aprova.
5. `--no-wait` imprime `{approvalRequired, approvalId, url}` e sai com código 2; rodar de novo gera outro pedido.

Nunca: trocar de rota para o mesmo efeito, quebrar em ações pequenas, mudar o corpo depois de aprovado (dá 91).

## Idempotency-Key

Obrigatória (sem ela, erro 90). `actions run` deriva a chave do conteúdo (método + ação/caminho + corpo canônico): mesma
intenção, mesma chave, então repetir depois de timeout é seguro e devolve a resposta guardada (`Idempotent-Replayed: true`).
A janela é de **24 horas**: dentro dela, duas escritas idênticas viram uma. Para repetir de propósito, mude algo que identifique
a operação (descrição, observação, data). Erro 96 (muitas escritas ao mesmo tempo, teto de 4 por conta): espere o `Retry-After`
e repita com a mesma chave; faça escritas em sequência.

## Ações mais comuns e nomes do MCP

Chaves exatas: `holdprint actions list --search <termo>`. Ação do MCP -> chave da CLI:

| MCP | Chave da CLI | Rota |
|---|---|---|
| `create-customer` | `CustomersController.Create:POST:api/customers` | cadastrar cliente |
| (criar orçamento) | `BudgetsController.Create:POST:api/budgets` | criar orçamento |
| `win-budget` | `BudgetsController.Won:POST:api/budgets/won` | ganhar orçamento |
| `liquidate-expense` | `ExpensesController.Liquidate:POST:api/expenses/liquidate` | baixa de conta a pagar |
| (lançar despesa) | `ExpensesController.PostExpense:POST:api/expenses` / `.../manual-create` | conta a pagar |
| (anexar arquivo) | `BudgetsController.AddFile:PUT:api/budgets/{budgetid}/add-files` | corpo `["<idArquivo>"]` |
| (link público) | `BudgetEmailsController.GetExternalBudgetLink:POST:api/budget-email/get-link` | precisa dos mementos |
| (estoque) | `StockMovementsController.Post:POST:api/stock-movements`, `.Transfer` em `.../transfer` | movimentar/transferir |
| `set_feedstock_price` | `FeedstockPriceController.Create:POST:api/feedstock-prices` | preço de insumo |

**Ganhar orçamento exige o Budget completo com a proposta vencedora**: corpo parcial dá 500 NullReference opaco (defeito O08 do
experimento). Leia o orçamento inteiro (`api GET /api/budgets/<id>`) e devolva-o no corpo.

## Receitas

**CNPJ e CEP** (consulta pública, não precisa de login): `curl -s https://brasilapi.com.br/api/cnpj/v1/<cnpj>` e
`curl -s https://brasilapi.com.br/api/cep/v2/<cep>`; ou `holdprint api GET /api/cnpj/<cnpj>`. Situação cadastral diferente de 2
(ativa) = avise o usuário e confirme antes de cadastrar. Também: `holdprint tools run holdprint_lookup_cnpj --cnpj <cnpj>`.

**Movimentação de estoque** (`StockMovementsController.Post`): corpo com o insumo (publicId), o depósito, a quantidade e a direção
(entrada, saída ou ajuste). **Insumo com opções exige o `optionId` da opção** (esquecer deu 6 erros na rodada 2). Rode `--dry-run`,
confira insumo/depósito/opção e execute. Transferência entre depósitos: `holdprint tools run holdprint_stock_transfer` (monta os dois
StockCentral sozinho); à mão exige os dois objetos completos.

**Preço de insumo** (`FeedstockPriceController.Create`): `responsibleUserId` = o usuário do `holdprint whoami`; `priceType` 1 = manual,
2 = LIFO; preços são **versionados** (cada chamada cria um registro novo, não sobrescreve). Alternativa: `tools run holdprint_set_feedstock_price`.

**Contar, somar e agrupar** (sem relatório pronto): `holdprint query <recurso> --fields id,campo --limit 100 --paginate --max-pages 100 | jq '.data|length'`,
`jq '[.data[].valor]|add'`, `jq '.data|group_by(.estado)|map({estado:.[0].estado,n:length})'`. Vale só para os recursos de `query --list`;
para as demais entidades use `tools run holdprint_count` / `holdprint_aggregate`. Confira `nextCursor: null` antes de confiar no total.

**Leitura grande, saída em arquivo**: `holdprint query budgets --paginate --max-pages 100 > /tmp/orc.json` e fatie com `jq`; ou
`holdprint tools run <ferramenta> --out /tmp/saida.txt`. É onde a CLI supera o MCP (o MCP recusa relatório grande demais).

**Intenção -> receita**:

| Pergunta | Caminho |
|---|---|
| Quanto vendi no mês | `tools run holdprint_report --report vendas_reais ...` ou `query budgets --where state=3 --where wonDate>=<data> --paginate | jq` |
| Jobs atrasados / a entregar | `tools run holdprint_report --report jobs_atrasados_real` |
| Contas a pagar/receber, fluxo de caixa | `tools run holdprint_report --report contas_a_pagar` / `contas_a_receber` / `fluxo_de_caixa` |
| Saldo de estoque | `tools run holdprint_report --report saldo_estoque` |
| Saúde da empresa / equilíbrio | `tools run holdprint_checkup` / `holdprint_breakeven` |
| Um registro por id | `api GET /api/<rota>/<id>` |
| Quais campos tem a entidade X | `tools run holdprint_describe --entity X` |
| Adicionar item a orçamento | `tools run holdprint_add_item` (calcula sozinho) |

(`tools describe holdprint_report` mostra os nomes válidos; confirme os parâmetros com `tools describe` antes de usar.)

## Erros de `run`

Ver a tabela no `SKILL.md` (85, 88 a 96). Resumo: 88 = a CLI não faz isso; 89 = aprovação (caso raro, rota marcada); 90 = faltou chave;
91 = o corpo mudou depois de aprovado; 92 = teto do dia; 96 = escrita simultânea, espere e repita.
