# Skills & domínio do Holdprint

As skills (`holdprint-mcp` e `holdprint-mongo`) ensinam a LLM as regras do domínio que ela erraria sozinha. O essencial:

## O custo do orçamento NÃO está no Budget

O preço/custo vive em `CostMemento` (versionado — use a maior `version`). Join: `Budget.code == CostMemento.public_identification` (inteiro, não ObjectId); ou `Budget.winner_propose_id → Propose.calc_id → CostMemento._id`. Quantidade em `CostMementoItem.quantity`.

### Campos dinâmicos & medidas

Campos dinâmicos ficam em `fields_values` com chaves `"hold"+ObjectId` → resolva pela collection `Fields` (remove "hold", casa o `_id`, lê o `name_key`: WIDTH/LARGURA, HEIGHT/ALTURA…). O valor é polimórfico, discriminado por `class_name` (a classe .NET, não `_t`). `Feedstock.fields_values` é array; em Product/Process/Equipment é objeto.

### Enums e exclusão

No Mongo cru, enums são **inteiros** (`Budget.state`: 1=Open, 2=Lost, 3=Won) — o MCP aceita string e converte. Exclusão é **lógica**: filtre sempre `deleted:false`. Product/Entity têm `active`; Budget/Process/Equipment não.

> **Pelo MCP, você não lida com isso**
> 
> A skill `holdprint-mcp` + as tools já cuidam de enums, soft-delete e nomes. O detalhe acima importa para quem usa o **banco read-only** (skill `holdprint-mongo`).

---
Fonte: https://docs.holdworks.ai/conectar-ia/dominio/
