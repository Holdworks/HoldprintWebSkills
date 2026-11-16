import { icon } from './icons.mjs';

const paths = [
  {
    icon: 'bot',
    title: 'Conectar a sua IA',
    href: '/conectar-ia/',
    text: 'Pergunte ao Holdprint em português pelo Claude, ChatGPT, Cursor ou Codex. O login é pelo navegador e a IA recebe 28 ferramentas para ler e operar a conta, com prévia antes de gravar.',
    links: [
      ['Claude Code', '/conectar-ia/claude-code/'],
      ['claude.ai e ChatGPT', '/conectar-ia/claude-ai-e-chatgpt/'],
      ['Tools do MCP', '/conectar-ia/tools-do-mcp/'],
    ],
    code: ['bash', 'claude mcp add --transport http holdprint https://mcp.holdprint.net/mcp', 'Terminal'],
  },
  {
    icon: 'braces',
    title: 'Usar a API',
    href: '/api/',
    text: 'Consulte e opere a conta pela API /v1, a mesma da CLI e do MCP: consultas com filtros, leitura por id e as ações do sistema, sempre como o usuário logado. Para integração entre sistemas, a API Key continua disponível.',
    links: [
      ['Consultas por recurso', '/api/v1/consultas/'],
      ['Ações pela CLI e MCP', '/api/acoes/'],
      ['API Key (legada)', '/api/chave/'],
    ],
    code: ['bash', 'holdprint login\nholdprint query budgets --where state=Open --limit 5\nholdprint actions list --search cliente', 'Terminal'],
  },
  {
    icon: 'puzzle',
    title: 'Criar plugins',
    href: '/plugins/',
    text: 'Telas no menu, botões nas telas, abas, cards na Visão Geral e automações que rodam dentro do Holdprint. A sua IA cria e testa; você aprova o que o plugin pode ler e fazer.',
    links: [
      ['Comece com a sua IA', '/plugins/comece-com-sua-ia/'],
      ['Manifesto', '/plugins/manifesto/'],
      ['Publicação', '/plugins/publicacao/'],
    ],
    code: ['prompt', 'Crie um plugin do Holdprint que mostra os orçamentos abertos de cada vendedor,\ncom um botão para criar a tarefa de follow-up. Comece pelo simulador.'],
  },
];

const addresses = [
  ['MCP hospedado', 'https://mcp.holdprint.net/mcp', '/conectar-ia/'],
  ['API /v1', '{BASE_URL}/v1', '/api/v1/'],
  ['API Key (legada)', 'https://api.holdworks.ai', '/api/chave/'],
  ['Skills oficiais', 'npx @holdprint/skills install', '/conectar-ia/skills/'],
  ['CLI de plugins', 'npm install -g @holdprint/cli', '/plugins/cli/'],
  ['Índice para IAs', 'https://docs.holdworks.ai/llms.txt', '/llms.txt'],
];

export function homeBody({ storeCode }) {
  const rows = paths.map((p) => `
<section class="path" aria-labelledby="path-${p.href.replace(/\W/g, '')}">
  <div class="path-text">
    <div class="path-head">${icon(p.icon)}<h2 id="path-${p.href.replace(/\W/g, '')}"><a href="${p.href}">${p.title}${icon('arrow')}</a></h2></div>
    <p>${p.text}</p>
    <ul class="path-links">${p.links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
  </div>
  <div class="path-code">${storeCode(p.code[0], p.code[1], p.code[2])}</div>
</section>`).join('');

  const html = `
${storeCode('prompt', 'Leia https://docs.holdworks.ai/llms.txt e me ajude a conectar o Holdprint à minha IA.\nDepois me diga o que dá para fazer com a minha conta.')}
<div class="paths">${rows}</div>
<h2 id="para-a-sua-ia">Para a sua IA</h2>
<p>Esta documentação é escrita para uma IA executar. Cada página tem uma versão em Markdown no mesmo endereço terminado em <code>.md</code>, o arquivo <a href="/llms.txt"><code>llms.txt</code></a> lista todas elas e o <a href="/llms-full.txt"><code>llms-full.txt</code></a> junta tudo num arquivo só. Em qualquer página, o botão <strong>Copiar para a IA</strong> copia o conteúdo em Markdown, pronto para colar.</p>
<h2 id="enderecos">Endereços e comandos</h2>
<div class="table-wrap"><table class="addresses"><thead><tr><th>O quê</th><th>Endereço ou comando</th></tr></thead><tbody>
${addresses.map(([label, value, href]) => `<tr><td><a href="${href}">${label}</a></td><td><code>${value}</code></td></tr>`).join('')}
</tbody></table></div>
<h2 id="precisa-de-ajuda">Precisa de ajuda</h2>
<p>Comece pelas <a href="/comecar/perguntas-frequentes/">perguntas frequentes</a>. Para liberar o banco somente leitura ou tirar dúvidas da sua conta, fale com o suporte do Holdprint pelo próprio sistema.</p>`;

  return {
    lede: 'Conecte a sua IA ao ERP, use a API ou crie plugins que rodam dentro do Holdprint. Cada página foi escrita para a sua IA executar e para você aprovar.',
    html,
  };
}
