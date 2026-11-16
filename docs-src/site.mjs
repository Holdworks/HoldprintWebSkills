export const site = {
  name: 'Holdprint Docs',
  url: 'https://docs.holdworks.ai',
  description: 'Documentação pública do Holdprint para IAs e desenvolvedores: MCP, skills, API (/v1 e API Key) e plataforma de plugins.',
  github: 'https://github.com/holdprint/skills',
};

export const placeholders = {
  DOCS_URL: site.url,
  APP_URL: null,
  BASE_URL: null,
  DOMINIO_TECNICO: null,
};

export const placeholderHelp = {
  APP_URL: 'Endereço do Holdprint no navegador. Definido na publicação.',
  BASE_URL: 'Endereço da API de plugins. Definido na publicação.',
  DOMINIO_TECNICO: 'Domínio da hospedagem dos plugins. Definido na publicação.',
};

export const legacyAnchors = {
  overview: '/conectar-ia/',
  quickstart: '/comecar/inicio-rapido/',
  'install-cc': '/conectar-ia/claude-code/',
  'install-web': '/conectar-ia/claude-ai-e-chatgpt/',
  skills: '/conectar-ia/skills/',
  usar: '/conectar-ia/como-usar/',
  tools: '/conectar-ia/tools-do-mcp/',
  domain: '/conectar-ia/dominio/',
  mongo: '/conectar-ia/banco-read-only/',
  mcp: '/conectar-ia/',
  'api-overview': '/api/chave/',
  'api-customers': '/api/clientes/',
  'api-suppliers': '/api/fornecedores/',
  'api-budgets': '/api/orcamentos/',
  'api-jobs': '/api/jobs/',
  'api-expenses': '/api/contas-a-pagar/',
  'api-incomes': '/api/contas-a-receber/',
  'api-financial-lookups': '/api/cadastros-financeiros/',
  faq: '/comecar/perguntas-frequentes/',
};

export const pluginSourceLinks = {
  '01-visao-geral.md': '/plugins/',
  '02-comece-com-sua-ia.md': '/plugins/comece-com-sua-ia/',
  '03-cli.md': '/plugins/cli/',
  '04-manifesto.md': '/plugins/manifesto/',
  '05-sdk.md': '/plugins/sdk/',
  '06-api-v1.md': '/api/v1/',
  '07-escopos.md': '/plugins/escopos/',
  '08-publicacao.md': '/plugins/publicacao/',
  '09-erros.md': '/plugins/erros/',
};

const starterPrompt = 'Leia https://docs.holdworks.ai/llms.txt e me ajude a conectar o Holdprint à minha IA.';

export const areas = [
  {
    id: 'comecar',
    title: 'Começar',
    pages: [
      {
        route: '/',
        source: 'home',
        nav: 'Visão geral',
        title: 'Construa sobre o Holdprint',
        description: 'Os três caminhos para construir sobre o Holdprint: conectar a sua IA, usar a API e criar plugins.',
        prompt: starterPrompt,
      },
      {
        route: '/comecar/inicio-rapido/',
        source: 'comecar/inicio-rapido.html',
        nav: 'Início rápido',
        description: 'Dois passos: instalar as skills e conectar a IA ao MCP do Holdprint.',
        prompt: 'Instale as skills do Holdprint com npx @holdprint/skills install e conecte o MCP do Holdprint.',
      },
      {
        route: '/comecar/perguntas-frequentes/',
        source: 'comecar/perguntas-frequentes.html',
        nav: 'Perguntas frequentes',
        description: 'Programação, segurança, MCP versus banco read-only e ferramentas compatíveis.',
      },
    ],
  },
  {
    id: 'conectar-ia',
    title: 'Conectar IA',
    pages: [
      {
        route: '/conectar-ia/',
        source: 'conectar-ia/index.html',
        nav: 'Visão geral',
        title: 'Conecte a sua IA ao Holdprint',
        description: 'MCP hospedado com login pelo navegador ou banco somente leitura: qual usar e como funciona.',
        prompt: starterPrompt,
      },
      {
        route: '/conectar-ia/claude-code/',
        source: 'conectar-ia/claude-code.html',
        nav: 'Claude Code',
        description: 'Adicionar o servidor MCP do Holdprint no Claude Code, fazer login e verificar.',
        prompt: 'Adicione o MCP do Holdprint no Claude Code com claude mcp add --transport http holdprint https://mcp.holdprint.net/mcp e me ajude a fazer o login.',
      },
      {
        route: '/conectar-ia/claude-ai-e-chatgpt/',
        source: 'conectar-ia/claude-ai-e-chatgpt.html',
        nav: 'claude.ai e ChatGPT',
        description: 'Conector personalizado no claude.ai e no ChatGPT apontando para o MCP do Holdprint.',
      },
      {
        route: '/conectar-ia/skills/',
        source: 'conectar-ia/skills.html',
        nav: 'Instalar as skills',
        description: 'Instalar as skills oficiais do Holdprint em Claude Code, Codex, Cursor, Gemini CLI e Copilot.',
        prompt: 'Rode npx @holdprint/skills install e confira com npx @holdprint/skills check.',
      },
      {
        route: '/conectar-ia/como-usar/',
        source: 'conectar-ia/como-usar.html',
        nav: 'Como usar',
        description: 'Perguntas que funcionam de imediato depois de conectar a IA.',
      },
      {
        route: '/conectar-ia/tools-do-mcp/',
        source: 'conectar-ia/tools-do-mcp.html',
        nav: 'Tools do MCP',
        description: 'Referência das 28 tools do MCP do Holdprint, de leitura e de escrita, com parâmetros.',
      },
      {
        route: '/conectar-ia/dominio/',
        source: 'conectar-ia/dominio.html',
        nav: 'Skills e domínio',
        description: 'Regras do domínio do Holdprint que a IA erraria sozinha: custo do orçamento, campos dinâmicos, enums.',
      },
      {
        route: '/conectar-ia/banco-read-only/',
        source: 'conectar-ia/banco-read-only.html',
        nav: 'Banco read-only',
        description: 'Conexão MongoDB somente leitura para casos avançados, liberada sob demanda.',
      },
    ],
  },
  {
    id: 'api',
    title: 'API',
    pages: [
      {
        route: '/api/',
        source: 'gen:api-overview',
        nav: 'Visão geral',
        title: 'API do Holdprint',
        description: 'As duas APIs do Holdprint: a /v1, que serve à CLI, ao MCP e aos plugins, e a API Key legada; qual usar e como começar pela CLI.',
        prompt: 'Use a CLI holdprint para listar os 10 orçamentos abertos de maior valor. Antes de mudar qualquer coisa, me mostre a prévia com --dry-run.',
      },
      {
        route: '/api/v1/',
        source: 'api/v1.md',
        nav: 'API /v1',
        title: 'API /v1',
        description: 'Endereço, autenticação (SDK, token de instalação, Hold Identity), rotas, paginação, eventos, storage, ações de escrita, cotas e formato de erro.',
      },
      {
        route: '/api/v1/consultas/',
        source: 'gen:api-queries',
        nav: 'Consultas por recurso',
        layout: 'reference',
        description: 'POST /v1/{recurso}/query recurso a recurso: campos, filtros, ordenações, exemplo HTTP e comando da CLI; leitura por id.',
      },
      {
        route: '/api/acoes/',
        source: 'gen:api-actions',
        nav: 'Ações pela CLI e MCP',
        description: 'Como a IA procura, descreve, confere (--dry-run) e executa as ações do Holdprint pela CLI e pelo MCP, com exemplos e índice por área.',
        prompt: 'Cadastre um cliente pela CLI holdprint: procure a ação com holdprint actions list, me mostre a prévia com --dry-run e só execute depois que eu confirmar.',
      },
      {
        route: '/api/chave/',
        source: 'api/chave.html',
        nav: 'Visão geral',
        navHeading: 'API Key (legada)',
        title: 'API Key (legada)',
        description: 'API com chave fixa: URL base, autenticação por x-api-key, formato de resposta, erros e códigos de status.',
      },
      { route: '/api/clientes/', source: 'api/clientes.html', nav: 'Clientes', layout: 'reference', description: 'Consultar, criar e atualizar clientes pela API Key.' },
      { route: '/api/fornecedores/', source: 'api/fornecedores.html', nav: 'Fornecedores', layout: 'reference', description: 'Consultar fornecedores e suas categorias.' },
      { route: '/api/orcamentos/', source: 'api/orcamentos.html', nav: 'Orçamentos', layout: 'reference', description: 'Consultar orçamentos com propostas, itens e produtos.' },
      { route: '/api/jobs/', source: 'api/jobs.html', nav: 'Jobs', layout: 'reference', description: 'Consultar jobs de produção com custos, tarefas e insumos.' },
      { route: '/api/contas-a-pagar/', source: 'api/contas-a-pagar.html', nav: 'Contas a pagar', layout: 'reference', description: 'Consultar, criar, editar e dar baixa em contas a pagar.' },
      { route: '/api/contas-a-receber/', source: 'api/contas-a-receber.html', nav: 'Contas a receber', layout: 'reference', description: 'Consultar, criar, editar e dar baixa em contas a receber.' },
      { route: '/api/cadastros-financeiros/', source: 'api/cadastros-financeiros.html', nav: 'Cadastros financeiros', layout: 'reference', description: 'Listas de apoio: contas, categorias, centros de custo e formas de pagamento.' },
    ],
  },
  {
    id: 'plugins',
    title: 'Plugins',
    pages: [
      {
        route: '/plugins/',
        source: 'plugins/index.md',
        nav: 'Visão geral',
        title: 'Construa dentro do Holdprint com a sua IA',
        description: 'O que é um plugin, onde ele aparece no Holdprint, quem pode criar e como a segurança funciona.',
        prompt: 'Crie um plugin do Holdprint que mostra os jobs atrasados num card da Visão Geral. Comece pelo simulador e me mostre a tela.',
      },
      {
        route: '/plugins/comece-com-sua-ia/',
        source: 'plugins/comece-com-sua-ia.md',
        nav: 'Comece com a sua IA',
        description: 'Skills, CLI, login, prompts prontos e o que a IA faz e o que você aprova, por assistente.',
        prompt: 'Instale as skills do Holdprint (npx @holdprint/skills install), siga a skill holdprint-plugins e crie um plugin que mostra os orçamentos abertos por vendedor.',
      },
      { route: '/plugins/cli/', source: 'plugins/cli.md', nav: 'CLI holdprint', description: 'Todos os comandos e opções da CLI holdprint, com saídas típicas.' },
      { route: '/plugins/manifesto/', source: 'plugins/manifesto.md', nav: 'Manifesto', description: 'O holdprint.plugin.json campo a campo: páginas, ações, abas, cards, eventos, funções e vitrine.' },
      { route: '/plugins/sdk/', source: 'plugins/sdk.md', nav: 'SDK', description: 'Holdprint.connect e tudo que o plugin usa: contexto, API, sincronização, eventos, armazenamento, interface e funções.' },
      { route: '/api/v1/', nav: 'API /v1', navOnly: true },
      { route: '/plugins/escopos/', source: 'plugins/escopos.md', nav: 'Escopos', description: 'Os escopos declaráveis, o que cada um libera e a permissão de tela exigida.' },
      { route: '/plugins/publicacao/', source: 'plugins/publicacao.md', nav: 'Publicação', description: 'Consentimento, versões, release, rollback, vitrine, link não listado, Marketplace e pedido de publicação.' },
      { route: '/plugins/erros/', source: 'plugins/erros.md', nav: 'Erros', description: 'Todos os códigos de erro da plataforma de plugins com HTTP, significado e correção.' },
    ],
  },
];

export const pluginRulesForAi = 'Regras para a IA que cria plugins: instale e siga a skill `holdprint-plugins` (`npx @holdprint/skills install`); rode `holdprint whoami` antes de tudo; use um `slug` novo e único por plugin; declare o mínimo de escopos, cada um com `purpose` em português; nunca peça senha, token ou valor de segredo no chat; nunca grave dado do ERP em `hold.storage` (é compartilhado por todos os usuários da conta); escrita sempre com `idempotencyKey` derivada do fato e corpo idêntico; o id do registro vem de `hold.context.launch`, nunca da URL; sem domínio externo na tela; depois do primeiro `deploy`, mostre o link `/plugins/consent/<id>` e espere a aprovação; só peça publicação no Marketplace quando o usuário pedir.';
