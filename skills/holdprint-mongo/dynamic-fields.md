# Campos dinâmicos: `fields_values`, chaves `hold…` e FieldResolver

Este é o ponto que mais quebra LLMs no banco da Holdprint. Leia inteiro antes de reportar campos dinâmicos.

## O problema

Entidades configuráveis (Product, Process, Equipment, Feedstock, Budget) guardam campos definidos
pelo usuário em **`fields_values`**. As chaves NÃO são nomes legíveis — são `"hold" + <ObjectId>`:

```jsonc
// Product.fields_values  (objeto/dict)
{
  "hold5db1d535ece810d5adb60e41": { "class_name": "...HoldprintNumberContent", "number": 12.5 },
  "hold5db1d535ece810d5adb60e42": { "class_name": "...HoldprintTextContent",   "content": "Azul" }
}
```

Reportar `hold5db1d535…` cru é inútil para o usuário. Você precisa **resolver** a chave para o nome real.

## Passo 1 — resolver a CHAVE (nome do campo)

1. Tire o prefixo `hold` da chave → sobra o `_id` (hex) de um documento na collection **`Fields`**.
2. Busque em `Fields` (no mesmo banco do tenant): `{ _id: ObjectId("5db1d535ece810d5adb60e41") }`.
3. O documento traz `name`, `name_key`, `unit_symbol`, `content_type`.

`Fields` é o "dicionário" dos campos. Carregue-o uma vez e monte um mapa `_id → {name, unit_symbol}`
(é exatamente o que o ERP chama de **FieldResolver**). Unidades vêm de `MeasurementUnits` (`_id → symbol`).

> A definição também aparece em `<entidade>.custom_fields[]`: cada item tem `field_type` (ObjectId)
> que é o mesmo `_id` do campo (a chave sem o `hold`), além de `content_type` e `measurement_unit`.

## Passo 2 — ler o VALOR (objeto polimórfico)

Cada valor é um objeto com um campo discriminador **`class_name`** = o nome completo da classe .NET.
O valor em si fica num campo que **depende do tipo**:

| `class_name` termina em… | Campo do valor | Tipo |
|---|---|---|
| `HoldprintNumberContent` | `number` | número |
| `HoldprintTextContent` | `content` | texto |
| `HoldprintBooleanContent` | `content` | booleano |
| `HoldprintArrayContent` | `content` | lista de strings |
| `HoldprintDateContent` | `date` | data |
| `HoldprintFeedstockFilterContent`, `HoldprintInkContent`, `HoldprintEquipamentListContent`, `HoldprintProcessReferenceContent`, … | objeto próprio | inspecione com `findOne` |

Regra prática: olhe o **sufixo** de `class_name` para saber o tipo, depois pegue `number`/`content`/`date`.

## Passo 3 — Feedstock é diferente (ARRAY)

Em Product/Process/Equipment, `fields_values` é **um objeto** (dict). Em **Feedstock**, `fields_values`
é um **array** de objetos desse tipo — uma entrada por "opção" do insumo (fornecedores, variações…).
Itere o array; cada elemento é um dict `hold… → valor` igual ao de cima.

## Resolver completo (referência, JS)

```js
// 1) carregue o dicionário uma vez (no banco do tenant)
const fieldDocs = await db.collection("Fields").find({ deleted: { $ne: true } }).toArray();
const fields = new Map(fieldDocs.map(f => [String(f._id), { name: f.name || f.name_key, unit: f.unit_symbol }]));

// 2) extraia o valor de um FieldContent polimórfico
function readContent(v) {
  if (v == null || typeof v !== "object") return v;
  if ("number" in v)  return v.number;   // NumberContent
  if ("date" in v)    return v.date;     // DateContent
  if ("content" in v) return v.content;  // Text / Boolean / Array
  return v;                               // tipos complexos: devolva cru e inspecione
}

// 3) resolva um fields_values (dict) para { nome: valor }
function resolve(fieldsValues) {
  const out = {};
  for (const [key, val] of Object.entries(fieldsValues || {})) {
    const id = key.startsWith("hold") ? key.slice(4) : key;
    const def = fields.get(id);
    const label = def ? (def.unit ? `${def.name} (${def.unit})` : def.name) : key;
    out[label] = readContent(val);
  }
  return out;
}
// Feedstock: fieldsValues é array → feedstock.fields_values.map(resolve)
```

## Erros a evitar
- Reportar a chave `hold…` em vez do nome → sempre resolva via `Fields`.
- Assumir que o valor está direto na chave → o valor é um objeto; pegue `number`/`content`/`date`.
- Tratar Feedstock como dict → é **array** de dicts.
- Usar `_t` como discriminador → aqui o discriminador é **`class_name`** (nome completo da classe).
