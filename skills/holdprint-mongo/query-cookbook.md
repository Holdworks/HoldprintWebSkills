# Query cookbook (MongoDB read-only)

Exemplos em sintaxe mongosh para o banco do tenant `holdprint-db-<id>`. **Tudo leitura.**
Lembre: `deleted: false` sempre; enums são inteiros; `CostMemento`/`CostCenterGroup` são versionados.

## Soft-delete e "ativos"
```js
db.Product.find({ deleted: false, active: true })          // produtos vigentes
db.Budget.find({ deleted: false, state: 3 })               // orçamentos ganhos (Won=3)
db.Process.find({ deleted: false })                        // Process não tem `active`
```

## Orçamentos por situação (state é INT)
```js
db.Budget.countDocuments({ deleted: false, state: 1 })     // Open
db.Budget.countDocuments({ deleted: false, state: 3 })     // Won
db.Budget.find({ deleted: false, state: 3 },
  { code: 1, budget_title: 1, customer: 1, won_date: 1 }).sort({ won_date: -1 })
```

## Custo/preço de um orçamento (Budget.code ↔ CostMemento.public_identification)
```js
// 1) versão vigente do custo de um orçamento de código 12345
db.CostMemento.find({ public_identification: 12345 }).sort({ version: -1 }).limit(1)

// 2) join orçamentos ganhos → custo (pegando a maior versão do memento)
db.Budget.aggregate([
  { $match: { deleted: false, state: 3 } },
  { $lookup: {
      from: "CostMemento",
      let: { code: "$code" },
      pipeline: [
        { $match: { $expr: { $eq: ["$public_identification", "$$code"] } } },
        { $sort: { version: -1 } },
        { $limit: 1 }
      ],
      as: "cost"
  }},
  { $unwind: { path: "$cost", preserveNullAndEmptyArrays: true } },
  { $project: { code: 1, budget_title: 1, total_price: "$cost.total_price", margin: "$cost.total_profit_percentual" } }
])
```

## Preço total faturado (somando o custo vigente)
```js
db.CostMemento.aggregate([
  { $sort: { public_identification: 1, version: -1 } },
  { $group: { _id: "$public_identification", total_price: { $first: "$total_price" } } },
  { $group: { _id: null, faturado: { $sum: "$total_price" } } }
])
```

## Desmontar campos dinâmicos (chaves hold…) com $objectToArray
```js
db.Product.aggregate([
  { $match: { deleted: false, _id: ObjectId("...") } },
  { $project: { name: 1, kv: { $objectToArray: "$fields_values" } } },
  { $unwind: "$kv" },
  { $addFields: { field_id: { $substrCP: ["$kv.k", 4, 50] } } },   // tira "hold"
  { $lookup: { from: "Fields", let: { fid: "$field_id" },
      pipeline: [ { $match: { $expr: { $eq: [ { $toString: "$_id" }, "$$fid" ] } } } ], as: "def" } },
  { $unwind: { path: "$def", preserveNullAndEmptyArrays: true } },
  { $project: { name: 1, campo: "$def.name", unidade: "$def.unit_symbol",
                valor: { $ifNull: ["$kv.v.number", { $ifNull: ["$kv.v.content", "$kv.v.date"] }] } } }
])
```

## Blocos: achar "campos compostos" (block_content_type = 2)
```js
db.Process.aggregate([
  { $match: { deleted: false, _id: ObjectId("...") } },
  { $unwind: "$parameters_blocks" },
  { $unwind: "$parameters_blocks.content" },
  { $match: { "parameters_blocks.content.block_content_type": 2 } },   // ComposedFields
  { $project: { bloco: "$parameters_blocks.title",
                conteudo: "$parameters_blocks.content.name",
                tipo_conteudo: "$parameters_blocks.content.block_content_type" } }
])
```
(`block_content_type`: 1=SimpleField, 2=ComposedFields, 3=Filter.)

## Feedstock (fields_values é ARRAY)
```js
db.Feedstock.aggregate([
  { $match: { deleted: false, _id: ObjectId("...") } },
  { $project: { opcoes: { $size: "$fields_values" }, fields_values: 1 } }
])
// cada item de fields_values é um dict hold…→valor; resolva com Fields (ver dynamic-fields.md)
```

## Centro de custo vigente
```js
db.CostCenterGroup.find({ deleted: false }).sort({ version: -1 }).limit(1)
```

## Dica de performance
- Sempre projete só os campos necessários (3º argumento do `find` ou `$project`).
- A conexão é read-only e pode iterar muitos docs — use `limit` ao explorar.
