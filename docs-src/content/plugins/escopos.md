# Escopos (permissões do plugin)

Escopo é cada permissão que o plugin pede no manifesto (`scopes`). O Administrador vê a lista, com o motivo que você escreveu em `purpose`, na tela de aprovação. O plugin só acessa o que foi aprovado.

```json
"scopes": [
  { "scope": "budgets:read", "purpose": "Mostrar os orçamentos abertos por vendedor" },
  { "scope": "tasks:write",  "purpose": "Criar a tarefa de follow-up no orçamento" }
]
```

Três regras valem sempre:

1. **Mínimo necessário.** Peça só o que o plugin usa, cada um com um motivo claro em português.
2. **O usuário precisa da tela.** Mesmo com o escopo aprovado, quem abre o plugin só recebe a permissão se o perfil dele tiver acesso à tela equivalente no Holdprint. Sem isso, a rota responde `403 HOLD_PLUGIN_PLATFORM_9`, o botão da tela não aparece e os eventos não chegam a ele.
3. **Escopo novo pede nova aprovação.** Até o Administrador aprovar, o plugin continua com os escopos antigos.

Não declare `storage` (dados do próprio plugin) nem `me` (quem está usando): valem sempre. Escopo fora desta lista faz a validação falhar.

## Vendas e CRM

| Escopo | O que libera | Tela exigida do usuário |
|---|---|---|
| `budgets:read` | Ler orçamentos e propostas (totais), ler um orçamento, sincronizar, consultar; botões e aba no orçamento; eventos `budget.won` e `budget.step_changed`. Um vendedor sem "ver negociações de outros vendedores" vê só os próprios. | Painel de Negociações |
| `budgets:move-step` | Mover o orçamento de etapa no funil (`PUT /v1/budgets/{id}/step`). Cria a tarefa "Mudança de etapa" com a autoria "via plugin". | Painel de Negociações |
| `funnels:read` | Ler funis e etapas. | Painel de Negociações |
| `tasks:read` | Ler as tarefas dos orçamentos; eventos `task.created` e `task.completed`. | Painel de Negociações |
| `tasks:write` | Criar e concluir tarefas em orçamentos. | Painel de Negociações |
| `customers:read` | Ler clientes (com endereços, contatos e campos personalizados), consultar e sincronizar; botões e aba no cliente; evento `customer.created`. Respeita a carteira de clientes do perfil. | Clientes |
| `users:read` | Ler a lista de usuários ativos (nome, e-mail, perfil), para mostrar vendedores e responsáveis. | nenhuma |
| `contracts:read` | Ler um contrato; botões no contrato e na lista de contratos. | Contratos |

## Produção e estoque

| Escopo | O que libera | Tela exigida do usuário |
|---|---|---|
| `jobs:read` | Ler e consultar jobs (ordens de produção); botões no job e na lista de jobs. | Jobs |
| `feedstocks:read` | Ler e consultar insumos (versão atual); botões no insumo e na lista. | Insumos |
| `purchase-orders:read` | Ler um pedido de compra; botões no pedido e na lista. | Pedidos de compra |
| `stock-movements:read` | Ler uma movimentação de estoque; botões na movimentação e na lista. | Movimentações de estoque |
| `stock-centrals:read` | Ler uma central de estoque; botões na central e na lista. | Centrais de estoque |
| `equipments:read` | Ler um equipamento; botões no equipamento e na lista. | Equipamentos |
| `processes:read` | Ler um processo; botões no processo e na lista. | Processos |
| `products:read` | Ler um produto; botões no produto e na lista. | Produtos |
| `outsourceds:read` | Ler um terceirizado; botões no terceirizado e na lista. | Terceirizados |

## Financeiro

| Escopo | O que libera | Tela exigida do usuário |
|---|---|---|
| `expenses:read` | Ler e consultar contas a pagar; botões na conta e na lista (e no relatório). | Contas a pagar |
| `incomes:read` | Ler e consultar contas a receber; botões na conta e na lista (e no relatório). | Contas a receber |
| `fixed-expenses:read` | Ler uma despesa fixa; botões na lista de despesas fixas. | Despesas fixas |
| `financial-transactions:read` | Ler uma movimentação financeira; botões na Central de movimentações e nos extratos. | Central de movimentações |
| `bank-reconciliations:read` | Ler uma conciliação bancária; botões na conciliação e na lista. | Central de movimentações |
| `credit-cards:read` | Ler um cartão da empresa (bandeira, limite, limite disponível, dia de vencimento); botões no cartão. | Controle de cartões |
| `commissions:read` | Ler uma comissão; botões no controle de comissões. | Controle de comissões |
| `invoices:read` | Ler uma nota fiscal (NF-e, NFS-e, NFC-e, MDF-e, nota comercial); botões no documento e nas listas de notas. | Notas fiscais |
| `cost-centers:read` | Ler um centro de custo; botões nos centros de custo. | Centros de custo |

## Cadastros

| Escopo | O que libera | Tela exigida do usuário |
|---|---|---|
| `suppliers:read` | Ler um fornecedor (nome, contato principal, site); botões no fornecedor e na lista. | Fornecedores |
| `employees:read` | Ler um funcionário (só nome e se está ativo; nunca e-mail, telefone ou salário); botões no funcionário e na lista. | Funcionários |
| `agencies:read` | Ler uma agência; botões na agência e na lista. | Agências |

## O que nenhum escopo libera

- Documento pessoal (CPF, RG), salário, dado bancário, senha, token, certificado ou chave.
- Rotas internas do Holdprint fora da [API /v1](06-api-v1.md).
- Escrita fora de tarefas e etapa do orçamento (a tela do plugin só lê o resto).

## Escopos da sessão da CLI

A sessão da CLI (`holdprint login`) recebe os escopos acima que o perfil pode usar, mais três que **não** se declaram em manifesto:

| Escopo | O que libera |
|---|---|
| `erp:read` | Ler a conta pelo terminal (`holdprint api GET`, `holdprint query`). |
| `actions:run` | Escrever pela CLI (`holdprint actions run` e escritas do `/v1`). |
| `plugins:publish` | Publicar, liberar, compartilhar e gerir plugins. Só para Administrador. |

## Escopos de app externo

Um app externo (`contributes.externalApps`) declara os próprios `scopes`, que precisam estar dentro dos `scopes` do plugin. A pessoa aprova o app ao entrar e pode desconectar em **Plugins > Acessos conectados**.
