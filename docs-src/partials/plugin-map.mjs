import { icon } from './icons.mjs';

const states = [
  {
    id: 'pagina',
    label: 'Página no menu',
    view: 'page',
    where: 'Uma tela inteira no menu lateral, dentro do grupo que você escolher (aqui, Produção).',
    receives: 'O plugin recebe <code>hold.context.page === "entregas"</code>.',
    code: `{
  "contributes": {
    "pages": [
      { "id": "entregas", "menuTitle": "Jobs a entregar",
        "icon": "truck", "group": "production" }
    ]
  }
}`,
  },
  {
    id: 'acao',
    label: 'Botão no registro',
    view: 'job',
    where: 'Um botão dentro do registro aberto, aqui a ordem de produção. Abre um modal ou uma página.',
    receives: 'O plugin recebe o registro em <code>hold.context.launch.entity</code>.',
    code: `{
  "contributes": {
    "actions": [
      { "id": "avisar-producao", "title": "Avisar a produção",
        "icon": "bell", "target": "job",
        "open": "modal", "modal": { "size": "md" } }
    ]
  }
}`,
  },
  {
    id: 'lote',
    label: 'Ação em lote',
    view: 'jobs',
    where: 'Um botão sobre os itens marcados numa lista, aqui a lista de jobs.',
    receives: 'O plugin recebe até 100 registros em <code>hold.context.launch.entities</code>.',
    code: `{
  "contributes": {
    "actions": [
      { "id": "avisar-selecionados", "title": "Avisar selecionados",
        "target": "job-list",
        "open": "modal", "modal": { "size": "lg" } }
    ]
  }
}`,
  },
  {
    id: 'novo',
    label: 'Novo registro',
    view: 'overview',
    menu: true,
    where: 'Um item no menu Novo registro, no topo de qualquer tela.',
    receives: 'Sem registro: o plugin abre vazio, pronto para criar.',
    code: `{
  "contributes": {
    "actions": [
      { "id": "proposta-rapida", "title": "Proposta rápida",
        "icon": "bolt", "target": "new-record", "open": "page" }
    ]
  }
}`,
  },
  {
    id: 'aba',
    label: 'Aba',
    view: 'customer',
    where: 'Uma aba no cadastro do cliente ou no orçamento. Só carrega quando alguém clica nela.',
    receives: 'O plugin recebe <code>hold.context.tab</code> e o registro aberto em <code>launch.entity</code>.',
    code: `{
  "contributes": {
    "tabs": [
      { "id": "historico", "title": "Histórico", "target": "customer" }
    ]
  }
}`,
  },
  {
    id: 'card',
    label: 'Card na Visão Geral',
    view: 'overview',
    where: 'Um card na seção Plugins, no fim da Visão Geral. Pequeno, médio ou grande.',
    receives: 'O plugin recebe <code>hold.context.card</code> e ajusta a altura com <code>hold.ui.resize()</code>.',
    code: `{
  "contributes": {
    "cards": [
      { "id": "entregas-hoje", "title": "Entregas de hoje", "size": "small" }
    ]
  }
}`,
  },
  {
    id: 'automacao',
    label: 'Automação',
    view: 'logs',
    where: 'Nada na tela: funções rodam na hospedagem da Hold por agenda ou evento. O que aconteceu aparece nos registros do plugin.',
    receives: 'Acompanhe com <code>holdprint plugin logs</code> ou na tela do plugin.',
    code: `{
  "events": { "subscribe": ["budget.won"] },
  "functions": {
    "entry": "functions/index.ts",
    "schedules": [
      { "id": "follow-up", "every": "1d",
        "path": "/api/agenda/follow-up",
        "description": "Follow-up de orçamentos parados" }
    ],
    "events": { "path": "/api/eventos" }
  }
}`,
  },
];

const mark = icon('puzzle', 'hp-plugin-mark');

function screen() {
  const jobRows = [
    ['2051', 'Banner lona 3×1 m', 'Gráfica Alfa', 'Hoje', true],
    ['2049', 'Adesivo vitrine', 'Loja Beta', 'Amanhã', true],
    ['2046', 'Cartão de visita', 'Studio Gama', '18/11', false],
    ['2043', 'Fachada ACM', 'Padaria Delta', '20/11', false],
  ];
  return `
<div class="hp" aria-hidden="true" data-view="page">
  <div class="hp-top">
    <span class="hp-logo">holdprint</span>
    <span class="hp-search">Buscar</span>
    <span class="hp-new" data-t="novo-btn">+ Novo registro
      <span class="hp-menu">
        <span>Orçamento</span><span>Cliente</span><span>Tarefa</span>
        <span class="hp-menu-sep">Plugins</span>
        <span class="hp-is-plugin" data-t="novo">${mark}Proposta rápida</span>
      </span>
    </span>
    <span class="hp-avatar">RA</span>
  </div>
  <div class="hp-side">
    <span class="hp-nav">Visão geral</span>
    <span class="hp-nav">CRM</span>
    <span class="hp-nav hp-nav-open">Produção</span>
    <span class="hp-sub">Jobs</span>
    <span class="hp-sub hp-is-plugin" data-t="pagina">${mark}Jobs a entregar</span>
    <span class="hp-nav">Financeiro</span>
    <span class="hp-nav">Estoque</span>
    <span class="hp-nav">Cadastros</span>
    <span class="hp-nav">Relatórios</span>
    <span class="hp-nav">Plugins</span>
  </div>
  <div class="hp-main">
    <div class="hp-view" data-v="page">
      <div class="hp-h">Jobs a entregar <span class="hp-pill">plugin Produção 360</span></div>
      <div class="hp-table">
        <span class="hp-th">Job</span><span class="hp-th">Cliente</span><span class="hp-th">Entrega</span>
        ${jobRows.map(([n, , c, d]) => `<span>#${n}</span><span>${c}</span><span>${d}</span>`).join('')}
      </div>
    </div>
    <div class="hp-view" data-v="job">
      <div class="hp-crumb">Produção / Jobs / #2051</div>
      <div class="hp-h">Banner lona 3×1 m
        <span class="hp-actions"><span class="hp-btn">Editar</span><span class="hp-btn">Imprimir OP</span><span class="hp-btn hp-btn-plugin hp-is-plugin" data-t="acao">${mark}Avisar a produção</span></span>
      </div>
      <div class="hp-fields">
        <span><b>Cliente</b>Gráfica Alfa</span><span><b>Entrega</b>Hoje, 17h</span><span><b>Etapa</b>Impressão</span><span><b>Quantidade</b>2</span>
      </div>
      <div class="hp-bar"><span style="width:62%"></span></div>
      <div class="hp-section">Itens</div>
      <div class="hp-table hp-table-items">
        <span class="hp-th">Item</span><span class="hp-th">Material</span><span class="hp-th">Qtd.</span>
        <span>Banner 3×1 m</span><span>Lona 440 g</span><span>2</span>
        <span>Ilhós a cada 50 cm</span><span>Acabamento</span><span>2</span>
        <span>Bastão e corda</span><span>Acabamento</span><span>2</span>
      </div>
    </div>
    <div class="hp-view" data-v="jobs">
      <div class="hp-h">Jobs</div>
      <div class="hp-bulk"><span>2 selecionados</span><span class="hp-btn">Exportar</span><span class="hp-btn hp-btn-plugin hp-is-plugin" data-t="lote">${mark}Avisar selecionados</span></div>
      <div class="hp-table hp-table-check">
        <span class="hp-th"></span><span class="hp-th">Job</span><span class="hp-th">Descrição</span><span class="hp-th">Entrega</span>
        ${jobRows.map(([n, desc, , d, on]) => `<span class="hp-check${on ? ' on' : ''}"></span><span>#${n}</span><span>${desc}</span><span>${d}</span>`).join('')}
      </div>
    </div>
    <div class="hp-view" data-v="customer">
      <div class="hp-crumb">Cadastros / Clientes</div>
      <div class="hp-h">Gráfica Alfa</div>
      <div class="hp-tabs"><span class="on">Dados</span><span>Contatos</span><span>Financeiro</span><span class="hp-is-plugin" data-t="aba">${mark}Histórico</span></div>
      <div class="hp-fields"><span><b>CNPJ</b>00.000.000/0001-00</span><span><b>Cidade</b>Curitiba</span><span><b>Vendedor</b>Ana</span><span><b>Limite</b>R$ 20.000</span></div>
    </div>
    <div class="hp-view" data-v="overview">
      <div class="hp-h">Visão geral</div>
      <div class="hp-kpis"><span><b>R$ 84,2 mil</b>Faturado no mês</span><span><b>37</b>Orçamentos abertos</span><span><b>12</b>Jobs em produção</span></div>
      <div class="hp-section">Plugins</div>
      <div class="hp-cards"><span class="hp-card hp-is-plugin" data-t="card">${mark}<b>Entregas de hoje</b><em>7</em>3 atrasadas</span><span class="hp-card hp-card-empty"></span></div>
    </div>
    <div class="hp-view" data-v="logs">
      <div class="hp-crumb">Plugins / Produção 360</div>
      <div class="hp-h">Registros</div>
      <div class="hp-logs" data-t="automacao">
        <span><i>07:00</i>agenda follow-up<em>3 tarefas criadas</em></span>
        <span><i>10:42</i>evento budget.won<em>ok</em></span>
        <span><i>14:15</i>evento budget.won<em>ok</em></span>
      </div>
    </div>
  </div>
  <span class="hp-ring"></span>
</div>`;
}

export function pluginMap({ storeCode }) {
  const picker = states.map((s, i) => `<button type="button" role="tab" id="pmap-t-${s.id}" aria-controls="pmap-p-${s.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-state="${s.id}" data-view="${s.view}"${s.menu ? ' data-menu-open' : ''}>${s.label}</button>`).join('');
  const panels = states.map((s, i) => `<div class="pmap-panel${i === 0 ? ' is-active' : ''}" role="tabpanel" id="pmap-p-${s.id}" aria-labelledby="pmap-t-${s.id}">
  <p class="pmap-where"><strong>${s.label}.</strong> ${s.where}</p>
  ${storeCode('json', s.code, 'holdprint.plugin.json')}
  <p class="pmap-receives">${s.receives}</p>
</div>`).join('');
  return `<h2 id="onde-o-plugin-aparece">Onde o plugin aparece</h2>
<p>Escolha um lugar: a tela destaca onde o plugin entra no Holdprint, e o trecho do manifesto mostra o que o coloca lá. Um plugin pode juntar vários lugares.</p>
<div class="pmap" data-pmap>
  <div class="pmap-picker" role="tablist" aria-label="Lugares onde o plugin aparece">${picker}</div>
  <div class="pmap-stage">
    <div class="pmap-screen">${screen()}</div>
    <div class="pmap-panels">${panels}</div>
  </div>
</div>
`;
}
