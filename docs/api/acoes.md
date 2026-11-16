# Ações pela CLI e MCP

Além das rotas da API `/v1`, a sessão da CLI e o MCP executam 1.474 ações do próprio Holdprint: cadastrar cliente, ganhar orçamento, lançar e baixar conta, mexer em estoque, emitir nota e muito mais. A IA descobre cada ação na hora, já logada na conta; esta página explica o mecanismo e mostra o que existe por área.

## Do pedido à execução

1.  **Procurar**
    
    Liste as ações por palavra ou risco. Cada item traz chave, verbo, rota, escopo, risco, impacto e permissão.
    
    ```bash
    holdprint actions list --search cliente
    holdprint actions list --risk low
    ```
    
2.  **Descrever**
    
    Veja o formato do corpo (JSON Schema) antes de montar a chamada.
    
    ```bash
    holdprint actions describe CustomersController.Create:POST:api/customers
    ```
    
3.  **Conferir sem enviar**
    
    A prévia mostra método, caminho, corpo, risco, impacto e a chave de idempotência, sem gravar nada. Use sempre antes de dinheiro, nota fiscal ou mensagem para fora.
    
    ```bash
    holdprint actions run CustomersController.Create:POST:api/customers --data @cliente.json --dry-run
    ```
    
4.  **Executar**
    
    Roda como o usuário logado, com o que o perfil dele pode fazer.
    
    ```bash
    holdprint actions run CustomersController.Create:POST:api/customers --data @cliente.json
    ```
    

```
Cadastre o cliente "Gráfica Exemplo" pela CLI holdprint. Procure a ação certa com holdprint actions list,
monte o corpo pelo describe, me mostre a prévia com --dry-run e só execute depois que eu confirmar.
```

## Regras que valem para toda ação

-   **Sem duplicar:** toda escrita leva uma `Idempotency-Key` (a CLI calcula do conteúdo). Repetir a mesma chamada em 24 horas devolve a resposta guardada; mesma chave com corpo diferente é recusada.
-   **Como o usuário:** o que o perfil não pode fazer no Holdprint, a ação também não faz.
-   **Até 4 escritas ao mesmo tempo por conta:** acima disso, erro 96 com o tempo de espera.
-   **Aprovação:** se uma ação for marcada para aprovação, a CLI mostra o link para um Administrador aprovar e espera.
-   **Desligar:** o Administrador pode desligar o acesso por CLI e MCP da conta inteira na tela Plugins.

As mesmas etapas existem por HTTP: `GET /v1/actions`, `GET /v1/actions/{chave}` e a chamada da própria rota com o token da sessão. Detalhes em [API /v1 > Ações de escrita](https://docs.holdworks.ai/api/v1.md#acoes-de-escrita).

## Exemplos

| O que faz | Rota | Risco | Área |
| --- | --- | --- | --- |
| Cadastrar cliente | `POST /api/customers` | médio | Cadastros |
| Atualizar cliente | `PUT /api/customers/{id}` | médio | Cadastros |
| Criar orçamento | `POST /api/budgets` | médio | Orçamentos, produtos, insumos, jobs e compras |
| Ganhar orçamento | `POST /api/budgets/won` | médio | Orçamentos, produtos, insumos, jobs e compras |
| Perder orçamento | `POST /api/budgets/lost` | médio | Orçamentos, produtos, insumos, jobs e compras |
| Lançar conta a pagar (com parcelas) | `POST /api/expenses/create-expense-installments` | alto | Financeiro |
| Lançar conta a receber (com parcelas) | `POST /api/incomes/create-income-installments` | alto | Orçamentos, produtos, insumos, jobs e compras |
| Mudar o preço de insumos | `POST /api/feedstocks/change-feedstocks-prices` | médio | Orçamentos, produtos, insumos, jobs e compras |
| Dar entrada no estoque pelo pedido de compra | `PUT /api/purchase-orders/stock-entry/{id}` | médio | Orçamentos, produtos, insumos, jobs e compras |
| Finalizar jobs | `POST /api/jobs/finalize` | alto | Orçamentos, produtos, insumos, jobs e compras |
| Anexar arquivo à conta | `POST /api/account-files` | médio | Orçamentos, produtos, insumos, jobs e compras |
| Enviar NF-e para a Sefaz | `PUT /api/nfes/send/{id}` | alto | Notas fiscais |

## Índice por área

Retrato do catálogo de ações em 2026-11-13. A lista completa e atual, com descrição e formato de cada uma, é a de `holdprint actions list`.

| Área | Ações | Risco baixo / médio / alto | Principais recursos |
| --- | --- | --- | --- |
| Orçamentos, produtos, insumos, jobs e compras | 597 | 222 / 235 / 140 | `budgets` `product` `jobs` `feedstock` `incomes` |
| Notas fiscais | 222 | 39 / 0 / 183 | `nfe` `nfse` `nfce` `mdfe` `company-invoice` |
| Financeiro | 131 | 41 / 0 / 90 | `expenses` `hold-link` `financial-transactions` `card-reconciliations` `payment-terminals` |
| Custeio | 110 | 37 / 61 / 12 | `process` `equipment` `outsourced` `cost-center-group` `cost-center-ai` |
| Cadastros | 86 | 25 / 45 / 16 | `customers` `employees` `suppliers` `ad-agencies` `customer-list-public-views` |
| Produção | 57 | 18 / 33 / 6 | `customer-portal` `job-production` `production-flow` `attendance` `ecommerce-proof` |
| CRM e funil | 39 | 11 / 17 / 11 | `budget-task` `contracts` `cost-memento-item` `budget-emails` `contract-templates` |
| Painéis | 34 | 30 / 2 / 2 | `financial-dashboard` `breakeven-point-dashboard` `budget-task-dashboard` |
| E-commerce | 32 | 0 / 26 / 6 | `ecommerce-catalog-items` `ecommerce-catalog-publication` `ecommerce-order` `ecommerce-attribute-drafts` `ecommerce-category-drafts` |
| Atendimento por WhatsApp | 31 | 9 / 0 / 22 | `hold-one-contact` `hold-one-agent` `hold-one-channel` `hold-one-tag` `hold-one-budget-ai` |
| Agenda | 22 | 7 / 11 / 4 | `calendar-event` `calendar-sync` `calendar` `financial-calendar-projector` `fiscal-crm-calendar-projector` |
| Usuários e conta | 22 | 4 / 0 / 18 | `holdprint-users` |
| Plugins | 18 | 2 / 13 / 3 | `plugin-cli` `plugin-installations` `plugin-catalog` `plugin-platform-settings` |
| Ajustes | 16 | 2 / 6 / 8 | `user-profiles` `system-setting-value` `budget-description-settings` `crm-settings` `financial-settings` |
| Fornecedores e catálogos | 15 | 1 / 13 / 1 | `supplier-integrations` `gift-catalog` |
| Loja de brindes | 13 | 1 / 10 / 2 | `gift-store-connection` `gift-store` `gift-store-monitor` |
| Importação por IA | 9 | 0 / 8 / 1 | `import-ai` |
| Relatórios | 6 | 6 / 0 / 0 | `hold-trace` |
| Scripts HPL | 4 | 1 / 2 / 1 | `hpl-script` |
| Integração HoldBridge | 4 | 0 / 4 / 0 | `hold-bridge-app` |
| Rotas da API Key | 2 | 1 / 1 / 0 | `budgets-ai` |
| Tabelas comuns | 2 | 2 / 0 / 0 | `ibge-code` |
| Webhooks | 1 | 0 / 0 / 1 | `stripe-webhook-relay` |
| Traduções | 1 | 0 / 1 / 0 | `translation` |

---
Fonte: https://docs.holdworks.ai/api/acoes/
