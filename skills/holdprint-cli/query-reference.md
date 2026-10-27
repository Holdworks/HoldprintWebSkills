# `holdprint query`: consulta genérica

## Comando

```bash
holdprint query <recurso> [--where campo=valor ...] [--fields a,b] [--sort [-]campo] [--limit N] [--paginate] [--max-pages N] [--updated-since <ISO>]
holdprint query --list
```

Por baixo é `POST /v1/<recurso>/query` com `{ where, fields, sort, limit, cursor, updatedSince }`, resposta `{ data[], nextCursor }`.
`GET /v1/query` (o `--list`) devolve o catálogo: recursos, campos, filtros, ordenações e se o recurso está ligado.

## Recursos (confira sempre no `--list`)

Ligados hoje: `budgets`, `customers`, `funnels`, `users`, `tasks`, `jobs`, `expenses`, `feedstocks`. Desligados (erro 93):
`incomes` e `stock-movements` (ainda sem índice para filtrar). **Cada recurso só responde quando está ligado**; o que vale é o
`--list`, não esta lista. Filtros e ordenações de hoje:

| Recurso | Filtros (operadores) | Ordenação |
|---|---|---|
| `budgets` | `state` (eq, in, gte, lte), `wonDate`, `lostDate`, `creationTime` (gte, lte), `responsibleUserId`, `customer` (eq, in) | `wonDate`, `lostDate`, `creationTime` |
| `customers` | `deleted` (eq) | `name` |
| `funnels` | nenhum | nenhuma |
| `users` | nenhum | `userName` |
| `tasks` | `budgetId`, `relatedEntity` (eq, in), `deleted` (eq) | `endTime` |
| `jobs` | `code` (eq, in, gte, lte), `budgetId` (eq, in), `deleted`, `isFinalized` (eq), `creationTime`, `deliveryNeeded` (gte, lte) | `creationTime`, `deliveryNeeded`, `code` |
| `expenses` | `accountStatusId` e `active` (eq) **sempre juntos** (prefixo do índice; sem eles dá 94), `dueDate` (gte, lte) | `dueDate` |
| `feedstocks` | `publicId` (eq, in), `deleted`, `inactive` (eq) | `technicalName` |

`state` do orçamento: `Open` (aberto), `Won` (ganho), `Lost` (perdido); na resposta vem como número (1, 3, 2).

## Filtros (`--where`)

- `campo=valor` é igualdade (`eq`; `true`/`false` viram booleanos); `campo=a,b,c` é `in`; `campo>=valor` e `campo<=valor` são `gte` e `lte`. Repetir a flag
  combina com E (ex.: `--where creationTime>=2026-10-01 --where creationTime<=2026-10-31`).
- **Só campos indexados filtram** (os da tabela). Filtro fora da lista dá erro 94; peça outro filtro, não tente contornar.
- Campo fora dos `fields` permitidos dá erro 95.

## Campos, ordenação e página

- `--fields id,code,customer`: sempre peça só o que vai usar.
- `--sort -creationTime` (prefixo `-` = decrescente); só ordenações listadas.
- `--limit N` é o **tamanho da página** (padrão 50, máximo 100), não o total. `--paginate` segue o `nextCursor` (opaco, não
  monte nem edite) até acabar ou até `--max-pages` (padrão **10 páginas**: com `--limit 100`, no máximo 1.000 registros).
  A saída paginada traz `{ data, nextCursor, pages }`: **`nextCursor` diferente de `null` = a lista foi cortada**; aumente
  `--max-pages` e rode de novo antes de contar ou somar.
- `--updated-since 2026-10-01T00:00:00Z` traz só o alterado desde então (sincronização incremental).

## Contar e somar

- Não há contagem no servidor: conte a lista inteira. `holdprint query <recurso> --where ... --fields id --limit 100 --paginate --max-pages 100 > lista.json`,
  confira `jq '.nextCursor' lista.json` (`null`) e conte com `jq '.data | length' lista.json`.
- Filtre no servidor sempre que der (é mais rápido e não estoura página); some com `jq '[.data[].campo] | add'`.
- Orçamento reaberto continua com `wonDate` (ou `lostDate`) preenchida e `state` 1. "Ganhos no período" = `state` 3 **e**
  `wonDate` no período; "perdidos" = `state` 2 **e** `lostDate` no período. Datas vazias vêm como `0001-01-01T00:00:00Z`.
- Período fechado: `--where wonDate>=2026-07-01 --where wonDate<=2026-07-31T23:59:59.999Z` (datas em UTC).

## Exemplos

```bash
holdprint query budgets --where state=Open --where creationTime>=2026-10-01 --fields id,code,customer,businessValue --sort -creationTime --limit 20
holdprint query tasks --where budgetId=<id do orçamento> --fields id,title,endTime
holdprint query expenses --where accountStatusId=<situação> --where active=true --where dueDate<=2026-10-31 --fields id,description,amountPayable,dueDate --sort dueDate
holdprint query budgets --updated-since 2026-10-20T00:00:00Z --fields id,code --paginate --max-pages 10 | jq '.data | length'
```

Saída: tabela no terminal; em pipe, o JSON `{ "data": [...], "nextCursor": "..." }`.

## Boas práticas

- Totais e contagens: peça só `id` e conte, ou use `--limit` baixo; avise o usuário se cortou.
- Dados que o perfil não enxerga não aparecem: "lista vazia" pode ser permissão, não ausência. Confira com `holdprint whoami`.
- Precisa de um recurso fora do catálogo: diga ao usuário; não tente `holdprint api` em rota interna.
