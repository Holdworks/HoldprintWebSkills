# Relacionamentos não-óbvios

O que mais derruba LLMs: **ligar o orçamento ao seu custo/preço**. O custo NÃO está no `Budget`.

## Budget → custo (CostMemento)

Há dois caminhos válidos:

### Caminho A (mais simples e robusto): por código inteiro
```
Budget.code  (int)  ==  CostMemento.public_identification  (int)
```
**Atenção:** é um inteiro, **não** ObjectId. Não tente casar `Budget._id` com nada do CostMemento.
Como CostMemento é versionado, pegue a maior `version`.

### Caminho B: via proposta vencedora
```
Budget.winner_propose_id (ObjectId) → Propose._id
Propose.calc_id          (string ObjectId) → CostMemento._id
```
Ou use direto `Budget.winner_propose` (a proposta vencedora vem **denormalizada embutida** no Budget).

## Budget → cliente
```
Budget.customer (ObjectId) → Entity._id   // Entity = cadastro de clientes/fornecedores
```

## Budget → proposta(s)
```
Budget.propose_list (ObjectId[]) → Propose._id
Budget.winner_propose_id          → a vencedora
```

## CostCenter / custos
- `CostCenterGroup.cost_centers[]` é polimórfico (produtivos vs administrativos).
- `Budget.cost_center_version` indica qual versão do grupo foi usada no cálculo.

## Campos dinâmicos (cross-collection)
```
<entidade>.fields_values  chave "hold<id>"  → Fields._id == <id>   (nome do campo)
<entidade>.custom_fields[].field_type (ObjectId) → Fields._id      (definição)
FieldMeasured.measurement_unit (ObjectId) → MeasurementUnits._id   (unidade)
```
Detalhe em `dynamic-fields.md`.

## Regras que afetam todo join
- Filtre `deleted: false` em **todas** as pontas.
- Em coleções versionadas (`CostMemento`, `CostCenterGroup`), use a maior `version`.
- IDs de referência são `ObjectId`, exceto o par `code ↔ public_identification` que é **int**.
