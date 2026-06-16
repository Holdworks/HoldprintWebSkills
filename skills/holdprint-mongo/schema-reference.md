# Schema reference (banco do tenant `holdprint-db-<id>`)

Collections em **CamelCase**, campos em **snake_case**. **Enums são gravados como inteiros.**
Esta é a referência das entidades que mais aparecem; para campos exóticos, faça um `findOne` e inspecione.

---

## Budget (orçamento)
Campos principais (verificados):

| Campo | Tipo | Nota |
|---|---|---|
| `_id` | ObjectId | |
| `code` | int | **código público do orçamento** — chave para o custo (ver relationships) |
| `budget_title` | string | |
| `state` | int (enum BudgetState) | **1=Open, 2=Lost, 3=Won** |
| `customer` | ObjectId | → `Entity` (cliente) |
| `contact` | int | |
| `funnel` | ObjectId | funil |
| `winner_propose_id` | ObjectId | → `Propose._id` (proposta vencedora) |
| `winner_propose` | objeto | **a proposta vencedora denormalizada embutida** |
| `propose_list` | ObjectId[] | propostas do orçamento |
| `custom_fields` | FieldMeasured[] | definição dos campos dinâmicos (ver dynamic-fields) |
| `fields_values` | objeto (dict) | valores dos campos dinâmicos (chaves `hold…`) |
| `cost_center_version` | int | versão do CC usada |
| `business_value` | double | valor do "negócio" (prospecção) |
| `creation_time` / `won_date` / `lost_date` / `expiration_date` | date | |
| `deleted` | bool | soft-delete. **Budget NÃO tem `active`** — use `state` |

`BudgetState`: `Open=1`, `Lost=2`, `Won=3`.

---

## CostMemento (o "custeio"/custo calculado — snapshot)
O **custo e o preço do orçamento moram aqui**, não no Budget. É um snapshot versionado.

| Campo | Tipo | Nota |
|---|---|---|
| `_id` | ObjectId | |
| `public_identification` | int | **== `Budget.code`** (vínculo principal) |
| `name` / `description` | string | |
| `total_price` | double | preço total calculado |
| `total_profit_percentual` | double | margem % |
| `payment_option` | objeto | condição de pagamento |
| `cost_memento_items` | array | itens de custo (processos, materiais…) |
| `costs` | objeto | custos calculados detalhados |
| `warnings` | array | avisos da precificação |
| `version` | int | **versionado — pegue o maior (`sort {version:-1}`)** |
| `creation_time` | date | |
| `deadline_days` / `deadline_date` | int / date | prazo |
| `propose_revision_number` | int | |

---

## Propose (proposta)
- `_id` (ObjectId), `calc_id` (string ObjectId) → **`CostMemento._id`**.
- Uma proposta aponta para o seu CostMemento via `calc_id`. (Ver `relationships.md`.)

---

## CostCenterGroup (centro de custo — estrutura)
- `cost_centers` (array polimórfico — produtivos/administrativos), `version` (int, **versionado**),
  `lock` (bool), `deleted` (bool), `creation_date` (date).
- Pegue sempre a maior `version`.

## BudgetPriceMethod (método de precificação)
- `name`, `price_method_type` (enum int), `specific_fields` (polimórfico), `is_default` (bool),
  `active` (bool), `deleted` (bool). Define COMO o preço é calculado.

---

## Block e BlockContent (blocos de parâmetros)
Aparecem em **Product (`blocks`)**, **Process (`parameters_blocks`)**, **Equipment (`parameters_blocks`)**.

### Block
| Campo | Tipo | Nota |
|---|---|---|
| `title` | string | nome do bloco (ex.: "Dimensões") |
| `block_type` | int (enum BlockType) | classifica o bloco (ver enum) |
| `block_status` | int (enum BlockStatus) | `0=Default, 1=Checked, 2=Unchecked` |
| `content` | BlockContent[] | conteúdos do bloco |
| `additional_fields` | objeto | polimórfico |
| `public_id` | int | |
| `is_conditional` / `is_hidden_block` | bool | |

`BlockType`: `Custom=1, WorkMeasures=2, Restrictions=3, PrinterProperties=4, Equipments=5, PrintingProfiles=6, FeedstockOptionsFilter=7, GeneticAccuracyOptions=8`.

### BlockContent  ← aqui mora "campo simples" vs "campos compostos"
| Campo | Tipo | Nota |
|---|---|---|
| `name` | string | |
| `block_content_type` | int (enum BlockContentType) | **`SimpleField=1` (campo simples), `ComposedFields=2` (campos compostos), `Filter=3`** |
| `fields` | FieldMeasured[] | definição dos campos do conteúdo |
| `value` | FieldMeasuredValue[] | **array** de valores (composto/repetível pode ter vários) |
| `default_values` | FieldMeasuredValue | valores padrão |
| `public_key` / `public_id` / `type` | string/int/string | |

> "Bloco composto" = `BlockContent` com `block_content_type = 2 (ComposedFields)`: um conjunto de
> campos que se repete em linhas (`value` é array). "Campo simples" = `1 (SimpleField)`.

---

## Product / Process / Equipment / Feedstock — onde ficam os campos dinâmicos

| Entidade | Blocos | Definição | Valores | tem `active`? |
|---|---|---|---|---|
| `Product` | `blocks` | `custom_fields` | `fields_values` (dict) | **sim** (`active`) |
| `Process` | `parameters_blocks` | `custom_fields` | `fields_values` (dict) | não (use `deleted`) |
| `Equipment` | `parameters_blocks` | `custom_fields` | `fields_values` (dict `Dictionary<string,object>`) | não |
| `Feedstock` | — | — | `fields_values` (**ARRAY** `FieldMeasuredValue[]`) | não |

Todas têm `version` e `deleted`. **Feedstock é a exceção**: `fields_values` é um **array** (várias
opções/instâncias), enquanto Product/Process/Equipment usam um único objeto (dict). Ver `dynamic-fields.md`.

---

## Fields e MeasurementUnits (catálogo dos campos dinâmicos)
- `Fields`: `_id`, `name`, `name_key`, `unit_symbol`, `content_type`, `deleted`. É o "dicionário"
  dos campos dinâmicos — a chave `hold<_id>` em `fields_values` aponta para um doc daqui.
- `MeasurementUnits`: `_id`, `symbol`, `name`, `deleted`. Unidades de medida.
- Ver `dynamic-fields.md` para o passo-a-passo de resolução.
