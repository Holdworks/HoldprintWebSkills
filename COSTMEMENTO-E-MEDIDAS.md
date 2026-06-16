# Holdprint — CostMemento e como ler as medidas de um produto

> Guia de referência para uma LLM consultar o MongoDB do ERP Holdprint (banco do tenant
> `holdprint-db-<id>`, **somente leitura**). Foco: entender o **custeio (CostMemento)** e extrair
> **medidas de produto** — largura, altura, comprimento, quantidade, etc.
> Tudo aqui foi extraído das entidades reais (.NET / MongoDB.Driver).

---

## 0. Convenções que valem para tudo

- Collections em **CamelCase** (`CostMemento`, `Budget`, `Product`); campos em **snake_case** (`total_price`, `public_identification`).
- **Soft-delete:** filtre `deleted: false` (ou `{ $ne: true }`). Nada é apagado de verdade.
- **Enums são INTEIROS** no banco cru. Ex.: `Budget.state` → `1=Open, 2=Lost, 3=Won`.
- **Coleções versionadas** (`CostMemento`, `CostCenterGroup`): pegue a maior `version` (`sort({version:-1}).limit(1)`).
- **IDs** são `ObjectId`, **exceto** o par `Budget.code` ↔ `CostMemento.public_identification`, que é **inteiro**.
- Valores monetários (`total_price`, `unit_price`) são `double`.

---

## 1. Modelo mental: do orçamento ao custo

```
Budget (orçamento)
  ├── code (int)  ───────────────┐  (vínculo principal com o custo)
  ├── winner_propose_id ─► Propose (proposta)
  │                           └── calc_id (ObjectId, string) ─► CostMemento._id
  └── winner_propose  = a proposta vencedora DENORMALIZADA embutida no Budget

CostMemento (SNAPSHOT de custo/preço de uma proposta — versionado)
  ├── public_identification (int)  ==  Budget.code
  ├── total_price / total_profit_percentual
  └── cost_memento_items[]  (as LINHAS do orçamento)
        └── CostMementoItem
              ├── quantity, measurement_unit, unit_price, total_price
              ├── products[]   ─► BudgetProduct  (o produto, com BLOCOS e MEDIDAS)
              ├── processes[]  ─► BudgetProcess   (cortes/margens com width/length)
              ├── feedstocks[] ─► insumos
              └── costs        ─► CostCalculated  (composição do custo)
```

**Dois "produtos" diferentes — não confundir:**

| | Onde | Para quê |
|---|---|---|
| `Product` (template) | collection `Product` | cadastro/modelo do produto; blocos com medidas **padrão** |
| `BudgetProduct` (snapshot) | dentro de `CostMementoItem.products[]` | o produto **daquele orçamento**, com as medidas **escolhidas** |

Para "qual a largura/altura desse orçamento" → use o **BudgetProduct** dentro do CostMemento.
Para "qual a medida padrão do produto X no cadastro" → use a collection **Product**.

---

## 2. CostMemento — campos (collection `CostMemento`)

| Campo (BSON) | Tipo | Significado |
|---|---|---|
| `_id` | ObjectId | id do snapshot |
| `public_identification` | **int** | **== `Budget.code`** — é por aqui que se liga ao orçamento |
| `name` / `description` | string | nome/descrição |
| `total_price` | double | **preço total** do orçamento |
| `total_profit_percentual` | double | margem total (%) |
| `payment_option` | objeto | condição de pagamento |
| `cost_memento_items` | array | **as linhas** (ver §3) |
| `costs` | objeto (CostCalculated) | composição de custo agregada |
| `warnings` | array | avisos da precificação |
| `version` | int | **versionado — pegue o maior** |
| `creation_time` | date | quando foi calculado |
| `deadline_days` / `deadline_date` | int / date | prazo de entrega |
| `propose_revision_number` | int | nº da revisão da proposta |
| `lock` | bool | snapshot travado |

> O `total_price` do orçamento está **aqui**, nunca no `Budget`.

---

## 3. CostMementoItem — a linha do orçamento (`cost_memento_items[]`)

Cada item é um produto/serviço orçado. **A quantidade está aqui.**

| Campo (BSON) | Tipo | Significado |
|---|---|---|
| `public_identification` | int | id público do item |
| `name` / `description` | string | nome/descrição da linha |
| `quantity` | **double** | **QUANTIDADE** orçada da linha |
| `measurement_unit` | string | unidade da quantidade (ex.: "un", "m²") |
| `unit_price` | double | preço unitário |
| `total_price` | double | preço total da linha |
| `original_total_price` | double | preço antes de desconto |
| `production_quantity` | double | quantidade a **produzir** |
| `billing_quantity` | double | quantidade a **faturar** |
| `products` | array `BudgetProduct` | os produtos da linha (medidas — ver §4) |
| `processes` | array `BudgetProcess` | processos (cortes/margens — ver §5) |
| `feedstocks` | array | insumos consumidos |
| `costs` | objeto (CostCalculated) | composição de custo da linha |
| `discount` | objeto | desconto aplicado |
| `tax_group` | objeto | grupo tributário |
| `total_profit` / `profit_percentual` | double | lucro e margem da linha |

**Quantidade, em resumo:** `quantity` (orçada) — e quando precisar diferenciar, `production_quantity` (produzir) e `billing_quantity` (faturar). No produto também há `BudgetProduct.quantity` e `sale_quantity` (§4).

---

## 4. BudgetProduct — o produto e suas MEDIDAS (`cost_memento_items[].products[]`)

Este é o produto **daquele orçamento**. As medidas (largura, altura, …) **não são campos fixos** —
são **campos dinâmicos** dentro de **blocos**.

Campos diretos úteis:

| Campo (BSON) | Tipo | Significado |
|---|---|---|
| `id` / `public_id` / `version` | — | identificação do produto |
| `name` / `description` | string | |
| `quantity` | double | quantidade do produto |
| `sale_quantity` | double | quantidade de venda |
| `unit_price` / `total_value` | double | preço |
| `selling_measurement_unit` | objeto/ref | unidade de venda |
| `blocks` | array `Block` | **blocos de parâmetros — onde vivem as medidas** |
| `block_fields_values` | objeto (dict) | **valores resolvidos dos campos dos blocos** (chaves `hold…`) |
| `custom_fields_values` | objeto (dict) | valores dos campos personalizados (chaves `hold…`) |
| `custom_measurement_units` | — | unidades customizadas |
| `total_quantity_formula` | — | fórmula de quantidade |

### 4.1 Onde estão largura/altura/comprimento

As medidas ficam em **blocos** (`blocks[]`). Cada `Block` tem um **tipo** (`block_type`); o bloco de
medidas é o **`WorkMeasures` (block_type = 2)** — "medidas de trabalho".

```
BudgetProduct
└── blocks[]  (Block)
      ├── title          (ex.: "Medidas")
      ├── block_type     2 = WorkMeasures  (1=Custom, 3=Restrictions, ...)
      └── content[]      (BlockContent)
            ├── name             (ex.: "Largura")
            ├── block_content_type   1=SimpleField, 2=ComposedFields, 3=Filter
            ├── fields[]         (FieldMeasured — DEFINIÇÃO do campo)
            │     ├── field_type        ObjectId → Fields._id   (qual campo é)
            │     ├── measurement_unit  ObjectId → MeasurementUnits._id
            │     └── content_type      tipo do valor
            └── value[]          (FieldMeasuredValue[] — VALORES; é ARRAY p/ repetíveis)
                  └── { "hold<ObjectId>": { class_name, number|content|date } }
```

Além de `value[]` dentro do bloco, os valores finais costumam estar consolidados em
**`block_fields_values`** (um dict `hold<id> → valor`), que é o caminho mais direto para ler.

### 4.2 Como saber qual hold-key é "Largura" e qual é "Altura"

As chaves são `"hold" + <ObjectId>`. Tire o `hold`, case com a collection **`Fields`** e leia o
**`name_key`** (rótulo canônico). O próprio ERP mapeia assim (regra real do field-resolver):

| `name_key` (em `Fields`) | Medida |
|---|---|
| contém `WIDTH` ou `== LARGURA` | **largura** |
| contém `HEIGHT` ou `== ALTURA` | **altura** |
| contém `LENGTH` ou `== COMPRIMENTO` | **comprimento** |
| contém `THICKNESS` ou `== ESPESSURA` | **espessura** |
| contém `DENSITY` ou `== DENSIDADE` | **densidade** |

A **unidade** vem de `MeasurementUnits` (via `Fields.unit_symbol` ou `FieldMeasured.measurement_unit` → `MeasurementUnits._id.symbol`).

### 4.3 O valor é polimórfico (discriminador `class_name`)

Cada valor é um objeto. O tipo está no campo **`class_name`** (nome completo da classe .NET — **não** `_t`),
e o número/texto fica num campo que **depende do tipo**:

| `class_name` termina em… | Campo do valor | Tipo |
|---|---|---|
| `HoldprintNumberContent` | `number` | número (medidas são quase sempre aqui) |
| `HoldprintTextContent` | `content` | texto |
| `HoldprintBooleanContent` | `content` | booleano |
| `HoldprintArrayContent` | `content` | lista de strings |
| `HoldprintDateContent` | `date` | data |

Regra prática para medidas: pegue `valor.number`.

---

## 5. Medidas de corte/margem (processos) — `CostMementoItemMeasurement`

Dentro de `CostMementoItem.processes[]` (BudgetProcess), cortes e margens carregam medidas
explícitas em `CostMementoItemMeasurement`:

| Campo (BSON) | Tipo | Significado |
|---|---|---|
| `width` | decimal | largura |
| `length` | decimal | comprimento |
| `measure_unit_width` | string | unidade da largura |
| `measure_unit_length` | string | unidade do comprimento |
| `copies` | int | nº de cópias |
| `measurement_index` | int | índice da medida |

Use isto quando a pergunta for sobre **corte/margem de um processo**. Para a medida "do produto"
(o que o cliente vê), use os blocos do BudgetProduct (§4).

---

## 6. Passo a passo — extrair largura/altura/quantidade

### 6.1 Quantidade e preço de um orçamento (por código)
```js
// CostMemento vigente do orçamento de código 12345
db.CostMemento.aggregate([
  { $match: { public_identification: 12345, deleted: { $ne: true } } },
  { $sort: { version: -1 } }, { $limit: 1 },
  { $unwind: "$cost_memento_items" },
  { $project: {
      _id: 0,
      item: "$cost_memento_items.name",
      quantidade: "$cost_memento_items.quantity",
      unidade: "$cost_memento_items.measurement_unit",
      preco_unit: "$cost_memento_items.unit_price",
      preco_total: "$cost_memento_items.total_price"
  }}
])
```

### 6.2 Resolver as medidas (largura/altura/…) — FieldResolver em JS (mongosh)
```js
(function () {
  const code = 12345;

  // 1) dicionário de campos (Fields) e unidades (MeasurementUnits)
  const fields = new Map(
    db.Fields.find({ deleted: { $ne: true } },
      { name: 1, name_key: 1, unit_symbol: 1 }).toArray()
      .map(f => [String(f._id), { name: f.name || f.name_key, key: (f.name_key || "").toUpperCase(), unit: f.unit_symbol }])
  );

  // 2) extrair valor de um FieldContent polimórfico
  function val(v) {
    if (v == null || typeof v !== "object") return v;
    if ("number"  in v) return v.number;
    if ("date"    in v) return v.date;
    if ("content" in v) return v.content;
    return v;
  }
  // 3) classificar a medida pelo name_key (regra do ERP)
  function tipoMedida(k) {
    if (k.includes("WIDTH")  || k === "LARGURA")     return "largura";
    if (k.includes("HEIGHT") || k === "ALTURA")      return "altura";
    if (k.includes("LENGTH") || k === "COMPRIMENTO") return "comprimento";
    if (k.includes("THICKNESS") || k === "ESPESSURA")return "espessura";
    if (k.includes("DENSITY") || k === "DENSIDADE")  return "densidade";
    return null;
  }

  const cm = db.CostMemento.find({ public_identification: code, deleted: { $ne: true } })
                .sort({ version: -1 }).limit(1).toArray()[0];
  if (!cm) { print("CostMemento não encontrado"); return; }

  (cm.cost_memento_items || []).forEach(item => {
    (item.products || []).forEach(prod => {
      const fv = prod.block_fields_values || {};
      const medidas = {};
      const todos = {};
      for (const [key, v] of Object.entries(fv)) {
        const id = key.startsWith("hold") ? key.slice(4) : key;
        const def = fields.get(id);
        const nome = def ? def.name : key;
        const unidade = def ? def.unit : "";
        const valor = val(v);
        todos[unidade ? `${nome} (${unidade})` : nome] = valor;
        const t = def ? tipoMedida(def.key) : null;
        if (t) medidas[t] = { valor, unidade };
      }
      printjson({
        item: item.name, produto: prod.name,
        quantidade: item.quantity, unidade_qtd: item.measurement_unit,
        medidas,            // { largura: {...}, altura: {...} }
        todos_os_campos: todos
      });
    });
  });
})();
```

### 6.3 Medidas no cadastro do produto (template)
```js
// blocos de medida do produto cadastrado (WorkMeasures = block_type 2)
db.Product.aggregate([
  { $match: { _id: ObjectId("<productId>"), deleted: false } },
  { $unwind: "$blocks" },
  { $match: { "blocks.block_type": 2 } },                 // WorkMeasures
  { $unwind: "$blocks.content" },
  { $project: { _id: 0, bloco: "$blocks.title", campo: "$blocks.content.name",
                tipo_conteudo: "$blocks.content.block_content_type" } }   // 1=Simple,2=Composed
])
```
Os **valores** dos campos do produto-template estão em `Product.fields_values` (dict `hold…`),
resolvidos do mesmo jeito do §6.2 (via `Fields`).

---

## 7. Checklist para a LLM (não erre)

- [ ] Preço/quantidade → **CostMemento / CostMementoItem**, nunca no Budget.
- [ ] Ligou por `Budget.code == CostMemento.public_identification` (**int**) e pegou a maior `version`.
- [ ] Quantidade = `CostMementoItem.quantity` (ou `production_quantity`/`billing_quantity`).
- [ ] Largura/altura = campos dinâmicos nos `blocks` (WorkMeasures) / `block_fields_values`, com chave `hold…`.
- [ ] Resolveu a chave: tirou `hold`, casou com `Fields._id`, leu `name_key` (LARGURA/ALTURA/…) e `unit_symbol`.
- [ ] Leu o valor pelo polimórfico: `class_name` (não `_t`) → `number`/`content`/`date`.
- [ ] Filtrou `deleted` em todas as pontas; lembrou que enums são inteiros.
- [ ] Corte/margem de processo → `CostMementoItemMeasurement` (`width`/`length`/`copies`).

---

## 8. Glossário rápido de campos

| Pergunta do usuário | Onde buscar |
|---|---|
| "Quanto custou / preço do orçamento" | `CostMemento.total_price` (versão maior) |
| "Quantidade do item" | `CostMementoItem.quantity` |
| "Largura / altura do produto" | `BudgetProduct.block_fields_values` → resolver via `Fields` (name_key WIDTH/LARGURA, HEIGHT/ALTURA) |
| "Comprimento / espessura" | idem, name_key LENGTH/COMPRIMENTO, THICKNESS/ESPESSURA |
| "Unidade de medida" | `MeasurementUnits.symbol` (via `Fields.unit_symbol` ou `FieldMeasured.measurement_unit`) |
| "Medida de corte do processo" | `CostMementoItemMeasurement.width / length / copies` |
| "Margem / lucro" | `CostMemento.total_profit_percentual`, `CostMementoItem.profit_percentual` |
