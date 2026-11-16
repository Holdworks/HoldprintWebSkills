# Plugins do Holdprint: visão geral

Telas no menu, botões nas telas, abas, cards na Visão Geral e automações que rodam dentro do Holdprint. A sua IA cria e testa; você aprova o que o plugin pode ler e fazer.

> Convenção desta documentação: `{APP_URL}` é o endereço do Holdprint que você usa no navegador e `{BASE_URL}` é o endereço da API. Os dois serão fixados na publicação.

## O que é um plugin

Um plugin é uma extensão que a sua gráfica (ou alguém por ela) cria para o Holdprint. Ele aparece **dentro** do Holdprint, com os dados da sua conta, como se fosse parte do sistema: uma tela nova no menu, um botão numa ordem de produção, uma aba no cadastro do cliente, um indicador na Visão Geral ou uma rotina que roda sozinha de madrugada.

Por dentro, um plugin é:

- uma **tela** feita de HTML, CSS e JavaScript estáticos (sem build obrigatório), que roda isolada dentro do Holdprint e conversa com a conta pelo SDK `Holdprint.connect()`;
- um **manifesto** `holdprint.plugin.json`, que diz o nome, onde o plugin aparece e quais dados ele pede para ler ou gravar;
- opcionalmente, **funções**: código que roda na hospedagem da Hold, sem ninguém com a tela aberta (agenda, aviso de evento, chamada de um serviço externo).

Você não precisa saber programar: a forma recomendada de criar é pedir a uma IA (Claude, ChatGPT, Codex, Cursor) que já conhece o Holdprint pelas skills oficiais. Veja [Comece com a sua IA](02-comece-com-sua-ia.md).

## O que dá para construir

| Lugar no Holdprint | Como se declara | Exemplo |
|---|---|---|
| **Página no menu**, dentro do grupo que fizer sentido: Produção, Financeiro, Estoque, CRM, Cadastros, Custeio, Relatórios ou Plugins | `contributes.pages` (até 5) | "Relatório de produção da semana" no menu Produção |
| **Botão de ação no detalhe** de um registro (orçamento, cliente, ordem de produção, conta a pagar e a receber, insumo, pedido de compra, fornecedor, nota fiscal, contrato e outros) | `contributes.actions` com o alvo da tela (até 10 ações) | "Avisar a produção" dentro da ordem de produção |
| **Botão de ação em lote**, sobre os itens marcados numa lista | `contributes.actions` com alvo `<tela>-list` | "Enviar selecionados para a transportadora" na lista de jobs |
| **Novo registro**, no menu do topo, abrindo um modal ou uma página | `contributes.actions` com alvo `new-record` | "Proposta rápida" |
| **Aba** dentro do orçamento ou do cliente | `contributes.tabs` (até 3) | Aba "Histórico de compras" no cliente |
| **Card na Visão Geral** (pequeno, médio ou grande) | `contributes.cards` (até 3) | Card "Meta do mês" |
| **Automação** sem tela aberta: agenda, reação a eventos, chamada de serviço externo (hook), "Executar agora" | `functions`, `events`, `secrets`, `network` | Follow-up automático de orçamentos parados há 7 dias |
| **App fora do Holdprint** (TV da produção, página no celular) que entra com a conta Holdprint | `contributes.externalApps` (até 3) | Painel de TV com os jobs do dia |

Um plugin pode juntar várias dessas peças: uma página no menu, um botão no orçamento que abre um modal e uma agenda diária formam **um plugin só**, com um único consentimento.

## Ideias reais para gráficas

- **Painel de vendas por vendedor**: orçamentos abertos, ganhos no mês e taxa de conversão de cada vendedor, com um botão que cria a tarefa de follow-up.
- **Follow-up automático**: todo dia, procura orçamentos abertos sem movimento há 7 dias e cria uma tarefa para o vendedor responsável.
- **Gerar proposta**: botão no orçamento que abre um modal, monta o texto da proposta e registra a tarefa "Proposta enviada".
- **Jobs a entregar**: página no grupo Produção com os jobs não finalizados ordenados pela data de entrega, e um botão em lote para avisar a equipe sobre os selecionados.
- **Contas a vencer na semana**: card na Visão Geral com o total a pagar nos próximos 7 dias.
- **Histórico do cliente**: aba no cadastro do cliente com os orçamentos ganhos e perdidos e as tarefas abertas.
- **Integração com a transportadora ou o serviço de cobrança**: função que recebe o aviso do serviço externo (hook), confere a assinatura e registra no Holdprint.
- **Painel da produção na TV**: app externo que entra por um código na TV e mostra os jobs do dia, sem senha na TV.

## Quem pode criar

| Perfil | O que pode fazer |
|---|---|
| **Administrador da conta** | Tudo: criar, publicar na conta, aprovar (consentimento), escolher os perfis que usam, gravar segredos, gerar link para outra gráfica e pedir publicação no Marketplace. |
| **Desenvolvedor da gráfica** (sem perfil de Administrador) | Desenhar e testar o plugin no **simulador** (`holdprint dev`), com dados fictícios, sem login. Para publicar na conta é preciso o login de um Administrador. |
| **Quem ainda não tem conta** ("vibe coder") | Começa no simulador, sem conta. Para colocar o plugin num Holdprint de verdade ou publicar, cria uma **conta de teste grátis** em `{APP_URL}/holdai/register`, ativa pelo e-mail e entra com `holdprint login`. Na conta de teste, a pessoa é Administradora. |

Quem **usa** o plugin depois de instalado: o Administrador sempre; os demais perfis só se um Administrador os liberar na aprovação e se o perfil tiver a permissão **Plugins: Usar** em Ajustes > Perfis. Quem tem **Plugins: Gerenciar** pode ligar e desligar plugins.

## Segurança, em linguagem simples

- **Isolado.** A tela do plugin roda numa área separada do Holdprint (outro endereço, sem acesso aos cookies nem à tela do sistema). Ela não chama sites de fora: bibliotecas e fontes vão dentro do próprio plugin. Serviço externo só por função, e só para os sites que o plugin declarou.
- **Só o que pediu.** O plugin declara no manifesto cada permissão (escopo) que precisa, com o motivo em português. Ele não acessa nada fora dessa lista, e a lista é curta e fixa: não existe "acesso total".
- **Você aprova.** Nada aparece para ninguém antes de um Administrador abrir a tela de consentimento, conferir o que o plugin acessa, onde aparece, o que roda sozinho e com quais sites fala, digitar a senha e clicar em **Aprovar e instalar**. Se uma versão nova pedir permissão nova, o Holdprint pede aprovação de novo; até lá o plugin continua com as permissões antigas.
- **Vê o que o usuário vê.** Quando alguém abre o plugin, ele enxerga só o que essa pessoa já enxerga no Holdprint. Um vendedor que só vê os próprios orçamentos vê só os próprios orçamentos no plugin.
- **Dados por conta.** Cada conta tem os próprios dados, registros e configurações do plugin. Um plugin instalado em outra gráfica nunca vê os dados da sua.
- **Sem senha, sem token.** O plugin nunca pede senha. A credencial é do SDK, curta e renovada sozinha. Segredos (chaves de serviços externos) são gravados por um Administrador numa tela própria e nunca aparecem no código, no chat da IA nem nos registros.
- **Limites.** Cada instalação tem cota de chamadas (10 mil por dia e 300 por minuto) para não pesar no sistema. O Administrador acompanha o consumo em **Plugins > Chamadas e cotas**.
- **Desligar e revogar.** O Administrador desliga, desinstala ou revoga o acesso a qualquer momento na tela Plugins. Acessos da CLI, do MCP e de apps externos aparecem em **Plugins > Acessos conectados** e podem ser desconectados.

## Próximos passos

1. [Comece com a sua IA](02-comece-com-sua-ia.md): o kit para pedir o plugin ao Claude, ao ChatGPT, ao Codex ou ao Cursor.
2. [CLI](03-cli.md), [Manifesto](04-manifesto.md), [SDK](05-sdk.md), [API /v1](06-api-v1.md), [Escopos](07-escopos.md), [Publicação](08-publicacao.md) e [Erros](09-erros.md): a referência técnica.
