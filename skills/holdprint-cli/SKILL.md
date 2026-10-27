---
name: holdprint-cli
description: Use quando o usuário pedir para consultar ou operar a conta do Holdprint (ERP) pelo terminal ou pelo Claude Code — "lista os orçamentos abertos", "quantos clientes novos esse mês", "cadastra um cliente", "ganha o orçamento 1064", "dá baixa na conta a pagar", "o que eu posso fazer pela CLI", "holdprint whoami", "holdprint query", "holdprint actions". Ensina `holdprint whoami`, `holdprint api`, `holdprint query` (consulta genérica), `holdprint actions list/describe/run` (escritas, com aprovação humana nas de alto impacto), paginação, Idempotency-Key e os erros 85 e 88–96 com "como corrigir". Para criar plugin use `holdprint-plugins`; para o MCP hospedado, `holdprint-mcp`.
---

# Operar a conta do Holdprint pela CLI

## O que é

A CLI `holdprint` (a mesma dos plugins) também lê e opera a **conta do próprio usuário**, sem abrir plugin nem tela. Tudo roda
**como o usuário que fez login**: os escopos do token são o catálogo ∩ as permissões do perfil dele, e a visibilidade dos
dados é a do perfil. O que o usuário não vê no Holdprint, a CLI também não vê.

Dois caminhos de leitura e um de escrita:

| Preciso de | Use | Detalhe |
|---|---|---|
| Ler pela API estável (`/v1`: me, budgets, customers, funnels, users, tasks, step) | `holdprint api` | abaixo |
| Consultar qualquer um dos recursos liberados, com filtro, campos e ordenação | `holdprint query` | `query-reference.md` |
| Escrever (cadastrar, ganhar orçamento, estoque, financeiro) | `holdprint actions` | `actions-reference.md` |

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
```

- Verbos `GET`, `POST`, `PUT`, `DELETE`. Corpo com `--data @arquivo.json` ou `--data -` (stdin).
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
holdprint actions run <acao> --data @corpo.json          # executa; alto impacto pede aprovação e ESPERA
holdprint api --help | holdprint query --help | holdprint actions --help   # uso exato de cada comando
```

Fluxo certo, sempre: **`query --list` / `actions list` antes de adivinhar nome de recurso, campo ou rota.**

## Aprovação humana: regra que não se negocia

Escrita de alto impacto (dinheiro, nota fiscal, mensagem externa) e **toda escrita ainda não revisada por um humano** pedem a
aprovação de uma pessoa. A CLI imprime no erro padrão `Acao de alto impacto (<ação>): precisa da aprovacao de uma pessoa.` e
`Link de aprovacao: <Holdprint>/aprovacoes/<id>`, e **espera** (confere a cada 3 s; `--interval`/`--timeout`, padrão 1800 s).
Aprovada, ela repete a chamada uma única vez e imprime `Acao executada.`; recusada, expirada ou já usada, sai com erro claro.

- Mostre o link ao usuário com as suas palavras ("abra este endereço no Holdprint e aprove: valor X, entidade Y") e espere.
- **Nunca** tente contornar: não chame outra rota que faça o mesmo efeito, não divida a ação em partes menores, não use `api`
  no lugar de `actions run`, não reenvie com outra Idempotency-Key para "furar" a fila, não peça ao usuário um token.
- Só um Administrador (ou quem tem a permissão da rota) aprova, pela tela, com o login do ERP. O token da CLI nunca aprova.
- Aprovação vale **uma execução**, para exatamente aquele método + rota + corpo, por 30 minutos. Corpo diferente = pedido novo.
- Rejeitada ou expirada: diga ao usuário e pare. Não repita em loop.

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
| 89 | 428 | Ação exige aprovação | Não é falha: mostre o link de aprovação e espere (ver acima). |
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
- Orçamento novo não é criável pela CLI hoje (rota não exposta); cadastro de cliente (`POST api/customers`) também não está
  exposto à CLI (aguarda a revisão humana das ações).
- **Hoje toda escrita por `actions run` pede aprovação**: nenhuma ação do ERP foi revisada por humano ainda (`reviewed: false`
  em `actions list`). Só as rotas do `/v1` revisadas (tarefas, mover etapa) executam direto com `api`. Quando a revisão for
  aprovada, `actions describe` passa a mostrar `reviewed: true` e risco baixo/médio executa sem pedir; confie no `describe`.
- Depois de `--no-wait`, rodar o mesmo comando de novo gera **outro** pedido de aprovação; para não pedir duas vezes, prefira
  esperar (sem `--no-wait`).

## Treinar sem risco

A conta **91585** ("Gráfica Exemplo") é uma base congelada, usada para treino e medição. Em dúvida sobre um comando, ensaie
nela. Em conta real, **leitura primeiro**; escrita só quando o usuário pediu aquela escrita.

## Regras

1. Descubra (`--list`, `describe`) antes de chamar.
2. Leia com `--fields`; não despeje o registro inteiro.
3. Não grave nada que o usuário não pediu; mostre o que vai fazer antes da escrita de alto impacto.
4. Nunca contorne aprovação, interruptor ou permissão.
5. Nunca imprima, guarde ou envie o token da CLI.
6. Relate no fim: o que leu/escreveu, quantos registros, e se alguma escrita ficou aguardando aprovação.

## Referências

- `query-reference.md`: consulta genérica, `--where`, operadores, campos, ordenação e paginação.
- `actions-reference.md`: descoberta, execução, aprovação, Idempotency-Key e as ações mais comuns.
