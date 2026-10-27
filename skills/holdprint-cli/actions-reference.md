# `holdprint actions`: escrever na conta

## Comandos

```bash
holdprint actions list [--search texto] [--risk low|medium|high]
holdprint actions describe <acao>
holdprint actions run <acao> [--param nome=valor] [--data @corpo.json|-] [--no-wait] [--interval SEGUNDOS] [--timeout SEGUNDOS]
```

A chave da ação é a de `actions list` (ex.: `ExpensesController.Liquidate:POST:api/expenses/liquidate`, rótulo "Liquidar
despesa"); passe-a inteira, entre aspas se o terminal pedir. `--param` preenche os `{parâmetros}` da rota; o que sobra vai na
query.

- `list` mostra, por ação: chave, verbo, rota, risco, se já foi revisada por humano, se tem prévia, idempotência e permissão.
- `describe` traz o JSON Schema do corpo. Monte o corpo **a partir dele**, não de memória.
- `run` chama a **própria rota interna** da ação, sem tradução: o que `describe` mostra é o que vai.
- `--no-wait`: não espera a aprovação; imprime o link e sai (use só se o usuário pediu para continuar depois).

## Fluxo

1. `holdprint actions list --search <assunto>` e escolha a ação.
2. `holdprint actions describe <acao>`: leia risco e schema.
3. Antes de escrever, **leia** o que vai mexer (`query`/`api GET`) e confirme a entidade.
4. Grave o corpo em arquivo, `holdprint actions run <acao> --data @corpo.json`.
5. Risco baixo/médio **já revisado**: executa e devolve o resultado. Alto, ou não revisado: a CLI pede aprovação.
6. Releia o registro para provar que a escrita pegou; não confie só no 200.

## Aprovação (o que a CLI faz e o que você faz)

1. A CLI recebe 428 (erro 89), cria o pedido (`POST /v1/actions/approvals`) e imprime no erro padrão:
   `Acao de alto impacto (Liquidar despesa): precisa da aprovacao de uma pessoa.` e `Link de aprovacao: <Holdprint>/aprovacoes/<id>`.
   A tela do link mostra a ação, a entidade (ex.: a despesa), o valor, a conta, quem pediu e por qual cliente ("pedido pela
   CLI por <nome>") e a validade.
2. Você mostra o link ao usuário e **espera**. A CLI imprime `Esperando a aprovacao...` e consulta o estado (`pending`,
   `approved`, `rejected`, `expired`, `consumed`) a cada 3 s (`--interval`), até 1800 s (`--timeout`).
3. Aprovada: `Aprovada. Executando...`, a CLI repete a MESMA chamada com o cabeçalho `x-hold-approval` (uma execução só) e
   termina com `Acao executada.` e o resultado.
4. Recusada (`A aprovacao foi RECUSADA por uma pessoa...`), expirada (30 min), já usada ou teto diário (92): a CLI sai com erro.
   Reporte ao usuário e pare.
5. Quem aprova é um Administrador (ou quem tem a permissão da rota), na tela, com o login do ERP. O token da CLI nunca aprova (403).
6. `--no-wait` imprime `{approvalRequired, approvalId, url}` e sai com código 2. Rodar o mesmo comando de novo depois gera
   **outro** pedido; por isso, prefira esperar.

Nunca: trocar de rota para o mesmo efeito, quebrar em ações pequenas, mudar o corpo depois de aprovado (dá 91), reenviar sem
a aprovação, tentar pelo MCP ou por `api` o que `actions` pediu para aprovar.

## Idempotency-Key

Obrigatória (sem ela, erro 90). `actions run` deriva a chave do conteúdo (método + ação/caminho + corpo canônico): mesma
intenção, mesma chave, então repetir depois de timeout é seguro e devolve a resposta guardada (`Idempotent-Replayed: true`).
A janela é de **24 horas**: dentro dela, duas escritas idênticas viram uma. Para repetir de propósito, mude algo que identifique
a operação (descrição, observação, data). Erro 96 (muitas escritas ao mesmo tempo, teto de 4 por conta): espere o `Retry-After`
e repita com a mesma chave; faça escritas em sequência.

## Ações mais comuns (confirme em `actions list`)

| Ação | Rota | Risco proposto | Aprovação |
|---|---|---|---|
| Cadastrar cliente | `POST api/customers` | médio | depende da revisão; hoje a rota nem está exposta à CLI |
| Adicionar item ao orçamento | `PUT api/budgets/{id}/proposal` | médio | idem |
| Ganhar orçamento | `POST api/budgets/won` | médio | idem |
| Gerar link público do orçamento | `POST api/budget-email/get-link` | médio | idem |
| Entrada/saída e transferência de estoque | `POST api/stock-movements`, `.../transfer` | médio | idem |
| Lançar conta a pagar | `POST api/expenses/manual-create` | **alto** | sempre |
| Dar baixa em conta a pagar | `POST api/expenses/liquidate` | **alto** | sempre |

Hoje nenhuma ação do ERP foi revisada por humano (`reviewed: false` em todas), então **toda** escrita por `actions run` pede
aprovação, inclusive as de risco médio. Quando a revisão for aprovada, o `actions describe` mostra `reviewed: true` e as de
risco baixo/médio executam direto. Nunca presuma: o `describe` diz. Escritas do `/v1` revisadas (criar e concluir tarefa,
mover etapa do orçamento) executam com `holdprint api` sem aprovação.

## Erros de `run`

Ver a tabela no `SKILL.md` (85, 88 a 96). Resumo: 88 = a CLI não faz isso; 89 = aprovação, é o fluxo normal; 90 = faltou chave;
91 = o corpo mudou depois de aprovado; 92 = teto do dia; 96 = escrita simultânea, espere e repita.
