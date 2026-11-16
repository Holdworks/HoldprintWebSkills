import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const snapshot = JSON.parse(fs.readFileSync(path.join(here, '..', 'data', 'api-snapshot.json'), 'utf8'));

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (lang, text, caption) => `<div class="code"${caption ? ` data-caption="${esc(caption)}"` : ''}><div class="code-head"><span class="code-label">${lang}</span></div><pre><code>${esc(text)}</code></pre></div>`;
const chips = (list) => list.map((f) => `<code class="inline">${esc(f)}</code>`).join(' ');

const areaLabels = {
  core: 'Orçamentos, produtos, insumos, jobs e compras',
  invoice: 'Notas fiscais',
  financial: 'Financeiro',
  defrayal: 'Custeio',
  register: 'Cadastros',
  production: 'Produção',
  crm: 'CRM e funil',
  dashboards: 'Painéis',
  ecommerce: 'E-commerce',
  'hold-one': 'Atendimento por WhatsApp',
  calendar: 'Agenda',
  holdprint: 'Usuários e conta',
  plugins: 'Plugins',
  settings: 'Ajustes',
  suppliers: 'Fornecedores e catálogos',
  'gift-store': 'Loja de brindes',
  'import-ai': 'Importação por IA',
  reports: 'Relatórios',
  hpl: 'Scripts HPL',
  'hold-bridge': 'Integração HoldBridge',
  'api-key': 'Rotas da API Key',
  common: 'Tabelas comuns',
  webhook: 'Webhooks',
  translation: 'Traduções',
};

const riskLabel = { low: 'baixo', medium: 'médio', high: 'alto' };

const queryExamples = {
  budgets: { where: { state: { eq: 'Open' }, creationTime: { gte: '2026-11-01T00:00:00Z' } }, fields: ['id', 'code', 'budgetTitle', 'customer', 'businessValue'], sort: '-creationTime', cli: "holdprint query budgets --where state=Open --where creationTime>=2026-11-01 --fields id,code,budgetTitle,customer,businessValue --sort -creationTime --limit 20" },
  customers: { where: { deleted: { eq: false } }, fields: ['id', 'name', 'mainEmail', 'mainPhoneNumber'], sort: 'name', cli: 'holdprint query customers --where deleted=false --fields id,name,mainEmail,mainPhoneNumber --sort name' },
  tasks: { where: { relatedEntity: { eq: 'Budget' }, deleted: { eq: false } }, fields: ['id', 'budgetCode', 'title', 'endTime', 'responsibleUserId'], sort: '-endTime', cli: 'holdprint query tasks --where relatedEntity=Budget --where deleted=false --fields id,budgetCode,title,endTime --sort -endTime' },
  jobs: { where: { deleted: { eq: false }, isFinalized: { eq: false }, deliveryNeeded: { lte: '2026-11-20T00:00:00Z' } }, fields: ['id', 'code', 'title', 'customerId', 'deliveryNeeded'], sort: 'deliveryNeeded', cli: 'holdprint query jobs --where deleted=false --where isFinalized=false --where deliveryNeeded<=2026-11-20 --sort deliveryNeeded' },
  expenses: { where: { accountStatusId: { eq: '<id do status>' }, active: { eq: true }, dueDate: { gte: '2026-11-01T00:00:00Z' } }, fields: ['id', 'description', 'amountPayable', 'dueDate'], sort: 'dueDate', cli: 'holdprint query expenses --where accountStatusId=<id do status> --where active=true --where dueDate>=2026-11-01 --sort dueDate' },
  incomes: { where: { accountStatusId: { eq: '<id do status>' }, active: { eq: true }, dueDate: { gte: '2026-11-01T00:00:00Z' } }, fields: ['id', 'description', 'amountReceivable', 'dueDate'], sort: 'dueDate', cli: 'holdprint query incomes --where accountStatusId=<id do status> --where active=true --where dueDate>=2026-11-01 --sort dueDate' },
  feedstocks: { where: { deleted: { eq: false }, inactive: { eq: false } }, fields: ['id', 'technicalName', 'unitUse', 'publicId'], sort: 'technicalName', cli: 'holdprint query feedstocks --where deleted=false --where inactive=false --sort technicalName' },
};

function checkExample(resource, example) {
  const known = new Set([...resource.fields, ...resource.filters.map((f) => f.field)]);
  for (const name of [...Object.keys(example.where), ...example.fields]) {
    if (!known.has(name)) throw new Error(`Exemplo de consulta de ${resource.resource} usa campo fora do catálogo: ${name}`);
  }
}

export function apiOverview() {
  return `<h2>API do Holdprint</h2>
<p class="section-sub">Duas formas de integrar por HTTP: a API <code class="inline">/v1</code>, nova, que serve à CLI, ao MCP, aos plugins e a apps externos, e a API Key, mais antiga, para integração entre sistemas com uma chave fixa.</p>
<h3>Qual usar</h3>
<table class="dtable"><thead><tr><th></th><th>API /v1 (recomendada)</th><th>API Key (legada)</th></tr></thead><tbody>
<tr><td><strong>Como entra</strong></td><td>Login de um usuário pelo navegador (CLI, MCP, plugin ou app externo). A chamada vê só o que esse usuário vê no Holdprint.</td><td>Chave fixa gerada em Ajustes &gt; API/MCP, no cabeçalho <code class="inline">x-api-key</code>.</td></tr>
<tr><td><strong>O que cobre</strong></td><td>Consulta com filtros de ${snapshot.query.resources.length} recursos, leitura por id de ${snapshot.query.resources.length + snapshot.query.byIdOnly.length} cadastros, tarefas, etapa do funil, eventos e as ${snapshot.actions.total.toLocaleString('pt-BR')} ações do sistema pela CLI e pelo MCP.</td><td>Clientes, fornecedores, orçamentos, jobs, contas a pagar e a receber e cadastros financeiros.</td></tr>
<tr><td><strong>Endereço</strong></td><td><code class="inline">{BASE_URL}/v1</code></td><td><code class="inline">https://api.holdworks.ai</code></td></tr>
<tr><td><strong>Para quem</strong></td><td>A IA da gráfica, plugins e automações que agem em nome de um usuário.</td><td>Integração servidor a servidor com outro ERP, BI ou loja.</td></tr>
</tbody></table>
<h3>Comece pela CLI</h3>
<p>A CLI <code class="inline">holdprint</code> faz o login, guarda a sessão e chama a API <code class="inline">/v1</code> por você. É o caminho mais curto para a sua IA consultar e operar a conta.</p>
${code('bash', 'npm install -g @holdprint/cli\nholdprint login\nholdprint whoami\nholdprint query budgets --where state=Open --fields id,code,customer,businessValue --limit 5\nholdprint actions list --search cliente')}
${code('prompt', 'Use a CLI holdprint para listar os 10 orçamentos abertos de maior valor.\nAntes de mudar qualquer coisa na conta, me mostre a prévia (--dry-run) e espere eu confirmar.')}
<h3>Nesta seção</h3>
<ul>
<li><a href="/api/v1/">API /v1</a>: endereço, autenticação, rotas, paginação, eventos, cotas e formato de erro.</li>
<li><a href="/api/v1/consultas/">Consultas por recurso</a>: campos, filtros e ordenações de cada recurso, com o comando da CLI.</li>
<li><a href="/api/acoes/">Ações pela CLI e MCP</a>: como a IA descobre, confere e executa as ${snapshot.actions.total.toLocaleString('pt-BR')} ações do sistema.</li>
<li><a href="/api/chave/">API Key (legada)</a>: as rotas com chave fixa, mantidas para integrações existentes.</li>
</ul>`;
}

export function apiQueries() {
  const sections = snapshot.query.resources.map((resource) => {
    const example = queryExamples[resource.resource];
    if (!example) throw new Error(`Falta exemplo de consulta para ${resource.resource}`);
    checkExample(resource, example);
    const required = resource.requiresAllFilters.length ? `<p><strong>Filtros obrigatórios:</strong> ${chips(resource.requiresAllFilters)}, sempre juntos (sem eles, erro 94).</p>` : '';
    const anyOf = resource.requiresAnyFilter.length ? `<p><strong>Pelo menos um destes filtros:</strong> ${chips(resource.requiresAnyFilter)}.</p>` : '';
    const sortNotes = Object.entries(resource.sortRequires).map(([sort, needs]) => `<code class="inline">${esc(sort)}</code> só junto com ${chips([].concat(needs))}`).join('; ');
    const filterRows = resource.filters.map((f) => `<tr><td><code class="inline">${esc(f.field)}</code></td><td>${f.ops.map((o) => `<code class="inline">${o}</code>`).join(' ')}</td><td>${f.requires.length ? `junto com ${chips(f.requires)}` : ''}</td></tr>`).join('');
    const body = { where: example.where, fields: example.fields, sort: example.sort, limit: 20, cursor: null };
    const response = { data: [Object.fromEntries(example.fields.map((f) => [f, '…']))], nextCursor: 'eyJvIjoyMH0' };
    return `<div class="ref">
  <div class="ref-head"><span class="ref-tag post">POST</span><code>/v1/${resource.resource}/query</code></div>
  <div class="ref-body">
    <p><strong>${esc(resource.title)}.</strong> Escopo <code class="inline">${esc(resource.scope)}</code>. Até ${resource.maxLimit} por página, com cursor. ${resource.updatedSince ? 'Aceita <code class="inline">updatedSince</code> para sincronizar só o que mudou.' : 'Não aceita <code class="inline">updatedSince</code>.'}</p>
    ${required}${anyOf}
    <h3>Filtros</h3>
    <table class="dtable"><thead><tr><th>Campo</th><th>Operadores</th><th>Regra</th></tr></thead><tbody>${filterRows}</tbody></table>
    <h3>Ordenação</h3>
    <p>${chips(resource.sorts)} (padrão <code class="inline">${esc(resource.defaultSort)}</code>; prefixo <code class="inline">-</code> para decrescente).${sortNotes ? ` ${sortNotes}.` : ''}</p>
    <h3>Campos</h3>
    <p>${chips(resource.fields)}</p>
    ${code('json', JSON.stringify(body, null, 2), 'Requisição')}
    ${code('bash', example.cli, 'CLI')}
    ${code('json', JSON.stringify(response, null, 2), 'Resposta')}
  </div>
</div>`;
  }).join('\n');

  const byIdRows = [...snapshot.query.resources, ...snapshot.query.byIdOnly].map((r) => `<tr><td><code class="inline">GET /v1/${r.resource}/{id}</code></td><td>${esc(r.title)}</td><td><code class="inline">${esc(r.scope)}</code></td></tr>`).join('');

  return `<h2>Consultas por recurso</h2>
<p class="section-sub">Cada recurso com consulta tem a rota <code class="inline">POST /v1/{recurso}/query</code>, com filtros só em campos indexados. Esta página é gerada do catálogo da API (versão de ${snapshot.generatedAt}); a lista atual também vem de <code class="inline">GET /v1/query</code> e de <code class="inline">holdprint query --list</code>.</p>
<h3>Como funciona</h3>
<ul>
<li>Operadores: ${snapshot.query.operators.map((o) => `<code class="inline">${o}</code>`).join(', ')}. Vários filtros se combinam com E.</li>
<li><code class="inline">limit</code> padrão ${snapshot.query.limits.defaultLimit}, máximo ${snapshot.query.limits.maxLimit}. Repita com <code class="inline">cursor</code> enquanto <code class="inline">nextCursor</code> não for <code class="inline">null</code>.</li>
<li>Filtro em campo sem índice: erro 94, com a lista dos permitidos. Campo fora da lista: erro 95. Recurso sem consulta ligada: erro 93.</li>
<li>O usuário vê só o que o perfil dele vê: um vendedor que só enxerga os próprios orçamentos recebe só esses.</li>
</ul>
${sections}
<h3>Leitura por id</h3>
<p>Todos os ${snapshot.query.resources.length + snapshot.query.byIdOnly.length} recursos abaixo têm leitura de um registro por id. A resposta traz <code class="inline">id</code>, <code class="inline">title</code> e <code class="inline">name</code>, mais os campos de negócio; nunca documento pessoal, salário, dado bancário ou segredo. Registro inexistente ou fora do alcance do usuário: erro 113.</p>
<table class="dtable"><thead><tr><th>Rota</th><th>Recurso</th><th>Escopo</th></tr></thead><tbody>${byIdRows}</tbody></table>`;
}

export function apiActions() {
  const exampleRows = snapshot.actions.examples.map((e) => `<tr><td>${esc(e.label)}</td><td><code class="inline">${e.method} ${esc(e.route)}</code></td><td>${riskLabel[e.risk]}</td><td>${esc(areaLabels[e.area] || e.area)}</td></tr>`).join('');
  const areaRows = snapshot.actions.modules.map((m) => {
    const top = Object.entries(m.resources).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([r]) => r).filter(Boolean);
    return `<tr><td>${esc(areaLabels[m.module] || m.module)}</td><td>${m.total}</td><td>${m.risk.low || 0} / ${m.risk.medium || 0} / ${m.risk.high || 0}</td><td>${chips(top)}</td></tr>`;
  }).join('');
  return `<h2>Ações pela CLI e MCP</h2>
<p class="section-sub">Além das rotas da API <code class="inline">/v1</code>, a sessão da CLI e o MCP executam ${snapshot.actions.total.toLocaleString('pt-BR')} ações do próprio Holdprint: cadastrar cliente, ganhar orçamento, lançar e baixar conta, mexer em estoque, emitir nota e muito mais. A IA descobre cada ação na hora, já logada na conta; esta página explica o mecanismo e mostra o que existe por área.</p>
<h3>Do pedido à execução</h3>
<div class="steps">
<div class="step"><div class="step-body"><h4>Procurar</h4><p>Liste as ações por palavra ou risco. Cada item traz chave, verbo, rota, escopo, risco, impacto e permissão.</p>${code('bash', 'holdprint actions list --search cliente\nholdprint actions list --risk low')}</div></div>
<div class="step"><div class="step-body"><h4>Descrever</h4><p>Veja o formato do corpo (JSON Schema) antes de montar a chamada.</p>${code('bash', 'holdprint actions describe CustomersController.Create:POST:api/customers')}</div></div>
<div class="step"><div class="step-body"><h4>Conferir sem enviar</h4><p>A prévia mostra método, caminho, corpo, risco, impacto e a chave de idempotência, sem gravar nada. Use sempre antes de dinheiro, nota fiscal ou mensagem para fora.</p>${code('bash', 'holdprint actions run CustomersController.Create:POST:api/customers --data @cliente.json --dry-run')}</div></div>
<div class="step"><div class="step-body"><h4>Executar</h4><p>Roda como o usuário logado, com o que o perfil dele pode fazer.</p>${code('bash', 'holdprint actions run CustomersController.Create:POST:api/customers --data @cliente.json')}</div></div>
</div>
${code('prompt', 'Cadastre o cliente "Gráfica Exemplo" pela CLI holdprint. Procure a ação certa com holdprint actions list,\nmonte o corpo pelo describe, me mostre a prévia com --dry-run e só execute depois que eu confirmar.')}
<h3>Regras que valem para toda ação</h3>
<ul>
<li><strong>Sem duplicar:</strong> toda escrita leva uma <code class="inline">Idempotency-Key</code> (a CLI calcula do conteúdo). Repetir a mesma chamada em 24 horas devolve a resposta guardada; mesma chave com corpo diferente é recusada.</li>
<li><strong>Como o usuário:</strong> o que o perfil não pode fazer no Holdprint, a ação também não faz.</li>
<li><strong>Até 4 escritas ao mesmo tempo por conta:</strong> acima disso, erro 96 com o tempo de espera.</li>
<li><strong>Aprovação:</strong> se uma ação for marcada para aprovação, a CLI mostra o link para um Administrador aprovar e espera.</li>
<li><strong>Desligar:</strong> o Administrador pode desligar o acesso por CLI e MCP da conta inteira na tela Plugins.</li>
</ul>
<p>As mesmas etapas existem por HTTP: <code class="inline">GET /v1/actions</code>, <code class="inline">GET /v1/actions/{chave}</code> e a chamada da própria rota com o token da sessão. Detalhes em <a href="/api/v1/#acoes-de-escrita">API /v1 &gt; Ações de escrita</a>.</p>
<h3>Exemplos</h3>
<table class="dtable"><thead><tr><th>O que faz</th><th>Rota</th><th>Risco</th><th>Área</th></tr></thead><tbody>${exampleRows}</tbody></table>
<h3>Índice por área</h3>
<p>Retrato do catálogo de ações em ${snapshot.generatedAt}. A lista completa e atual, com descrição e formato de cada uma, é a de <code class="inline">holdprint actions list</code>.</p>
<table class="dtable"><thead><tr><th>Área</th><th>Ações</th><th>Risco baixo / médio / alto</th><th>Principais recursos</th></tr></thead><tbody>${areaRows}</tbody></table>`;
}
