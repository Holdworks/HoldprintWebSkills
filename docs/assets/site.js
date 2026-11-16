(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');

  const legacy = {
    overview: '/conectar-ia/', quickstart: '/comecar/inicio-rapido/', 'install-cc': '/conectar-ia/claude-code/',
    'install-web': '/conectar-ia/claude-ai-e-chatgpt/', skills: '/conectar-ia/skills/', usar: '/conectar-ia/como-usar/',
    tools: '/conectar-ia/tools-do-mcp/', domain: '/conectar-ia/dominio/', mongo: '/conectar-ia/banco-read-only/', mcp: '/conectar-ia/',
    'api-overview': '/api/', 'api-customers': '/api/clientes/', 'api-suppliers': '/api/fornecedores/', 'api-budgets': '/api/orcamentos/',
    'api-jobs': '/api/jobs/', 'api-expenses': '/api/contas-a-pagar/', 'api-incomes': '/api/contas-a-receber/',
    'api-financial-lookups': '/api/cadastros-financeiros/', faq: '/comecar/perguntas-frequentes/',
  };
  if (location.pathname === '/' && location.hash && legacy[location.hash.slice(1)]) {
    location.replace(legacy[location.hash.slice(1)]);
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toastEl = document.querySelector('[data-toast]');
  let toastTimer;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 1800);
  }

  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    const figure = button.closest('figure');
    const pre = figure && figure.querySelector('pre');
    if (!pre) return;
    const ok = await writeClipboard(pre.innerText.replace(/\n$/, ''));
    const label = button.querySelector('span');
    if (!ok) { toast('Não foi possível copiar. Selecione o texto e copie.'); return; }
    button.classList.add('is-done');
    if (label) label.textContent = 'Copiado';
    toast(figure.classList.contains('prompt') ? 'Prompt copiado. Cole na sua IA.' : 'Código copiado.');
    setTimeout(() => { button.classList.remove('is-done'); if (label) label.textContent = 'Copiar'; }, 1600);
  });

  document.querySelectorAll('[data-copy-page]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const response = await fetch(button.dataset.copyPage);
        if (!response.ok) throw new Error(String(response.status));
        const ok = await writeClipboard(await response.text());
        toast(ok ? 'Página copiada em Markdown. Cole na sua IA.' : 'Não foi possível copiar.');
      } catch {
        toast('Não foi possível carregar a página em Markdown.');
      }
    });
  });

  const themeButton = document.querySelector('[data-theme-toggle]');
  if (themeButton) {
    themeButton.addEventListener('click', () => {
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      const next = dark ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('hp-docs-theme', next); } catch { /* sem armazenamento */ }
    });
  }

  const sidebar = document.getElementById('sidebar');
  const scrim = document.querySelector('[data-scrim]');
  const menuButton = document.querySelector('[data-menu]');
  function setDrawer(open) {
    if (!sidebar || !menuButton) return;
    sidebar.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (scrim) scrim.hidden = !open;
    if (open) { sidebar.tabIndex = -1; sidebar.focus({ preventScroll: true }); }
  }
  if (menuButton) menuButton.addEventListener('click', () => setDrawer(!sidebar.classList.contains('is-open')));
  if (scrim) scrim.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar && sidebar.classList.contains('is-open')) { setDrawer(false); menuButton.focus(); }
  });
  const current = sidebar && sidebar.querySelector('[aria-current="page"]');
  if (current && current.scrollIntoView && sidebar.scrollHeight > sidebar.clientHeight) {
    const top = current.offsetTop - sidebar.clientHeight / 3;
    if (top > 0) sidebar.scrollTop = top;
  }

  function wireTablist(list, onSelect) {
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      onSelect(tab);
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (event.key in keys) {
          event.preventDefault();
          select(tabs[(index + keys[event.key] + tabs.length) % tabs.length], true);
        } else if (event.key === 'Home') { event.preventDefault(); select(tabs[0], true); }
        else if (event.key === 'End') { event.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
    return { tabs, select };
  }

  document.querySelectorAll('[data-tabs]').forEach((box) => {
    wireTablist(box.querySelector('[role="tablist"]'), (tab) => {
      box.querySelectorAll('[role="tabpanel"]').forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    });
  });

  const pmap = document.querySelector('[data-pmap]');
  if (pmap) {
    const screen = pmap.querySelector('.hp');
    const ring = pmap.querySelector('.hp-ring');
    let active = null;
    function placeRing() {
      if (!active || !screen || screen.offsetParent === null) return;
      const target = screen.querySelector(`[data-t="${active.dataset.state}"]`);
      if (!target) { screen.classList.remove('has-ring'); return; }
      const box = screen.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      const pad = 3;
      ring.style.setProperty('--rx', `${rect.left - box.left - pad}px`);
      ring.style.setProperty('--ry', `${rect.top - box.top - pad}px`);
      ring.style.setProperty('--rw', `${rect.width + pad * 2}px`);
      ring.style.setProperty('--rh', `${rect.height + pad * 2}px`);
      screen.classList.add('has-ring');
    }
    const { tabs, select } = wireTablist(pmap.querySelector('[role="tablist"]'), (tab) => {
      active = tab;
      screen.dataset.view = tab.dataset.view;
      screen.dataset.menu = tab.hasAttribute('data-menu-open') ? 'open' : 'closed';
      pmap.querySelectorAll('.pmap-panel').forEach((panel) => panel.classList.toggle('is-active', panel.id === tab.getAttribute('aria-controls')));
      requestAnimationFrame(placeRing);
    });
    select(tabs[0], false);
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(placeRing, 80); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeRing);
  }

  const tocLinks = Array.from(document.querySelectorAll('.toc a'));
  if (tocLinks.length) {
    const pairs = tocLinks.map((a) => [document.getElementById(decodeURIComponent(a.hash.slice(1))), a]).filter(([h]) => h);
    let ticking = false;
    function spy() {
      ticking = false;
      const line = Math.min(260, window.innerHeight * 0.3);
      let pick = null;
      for (const [heading, link] of pairs) {
        if (heading.getBoundingClientRect().top < line) pick = link; else break;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && pairs.length) pick = pairs[pairs.length - 1][1];
      tocLinks.forEach((a) => a.classList.toggle('is-active', a === pick));
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }

  const dialog = document.querySelector('dialog.search');
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');
  let index = null;
  let items = [];
  let selected = -1;
  const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function loadIndex() {
    if (index) return index;
    const response = await fetch('/search-index.json');
    const data = await response.json();
    index = data.map((page) => ({ ...page, ft: fold(page.t), fd: fold(page.d), fx: fold(page.x), fh: page.h.map(([text, id]) => [fold(text), text, id]) }));
    return index;
  }

  function highlight(text, terms) {
    let html = escapeHtml(text);
    terms.forEach((term) => {
      if (term.length < 2) return;
      const folded = fold(html);
      const parts = [];
      let from = 0;
      let at = folded.indexOf(term, from);
      while (at !== -1) {
        parts.push(html.slice(from, at), `<mark>${html.slice(at, at + term.length)}</mark>`);
        from = at + term.length;
        at = folded.indexOf(term, from);
      }
      parts.push(html.slice(from));
      html = parts.join('');
    });
    return html;
  }

  function snippet(page, terms) {
    const first = terms.find((t) => page.fx.includes(t));
    if (!first) return page.d;
    const at = page.fx.indexOf(first);
    const start = Math.max(0, at - 50);
    return `${start > 0 ? '…' : ''}${page.x.slice(start, start + 150)}…`;
  }

  function search(query) {
    const terms = fold(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const hits = [];
    for (const page of index) {
      let score = 0;
      let heading = null;
      let allFound = true;
      for (const term of terms) {
        let found = false;
        if (page.ft.includes(term)) { score += 12; found = true; }
        if (page.fd.includes(term)) { score += 4; found = true; }
        const h = page.fh.find(([f]) => f.includes(term));
        if (h) { score += 7; found = true; if (!heading) heading = h; }
        if (page.fx.includes(term)) { score += 1; found = true; }
        if (!found) allFound = false;
      }
      if (score && allFound) hits.push({ page, score, heading });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, 12).map(({ page, heading }) => ({
      url: heading ? `${page.u}#${heading[2]}` : page.u,
      area: heading ? `${page.a} · ${page.t}` : page.a,
      title: heading ? heading[1] : page.t,
      snippet: snippet(page, terms),
      terms,
    }));
  }

  function render(list, query) {
    items = list;
    selected = list.length ? 0 : -1;
    if (!query.trim()) { results.innerHTML = ''; return; }
    if (!list.length) {
      results.innerHTML = `<li class="search-empty">Nada encontrado para “${escapeHtml(query)}”. Tente outra palavra, como manifesto, clientes ou erro.</li>`;
      return;
    }
    results.innerHTML = list.map((item, i) => `<li role="option" id="sr-${i}" aria-selected="${i === selected}"><a href="${item.url}"><span class="sr-area">${escapeHtml(item.area)}</span><span class="sr-title">${highlight(item.title, item.terms)}</span><span class="sr-snippet">${highlight(item.snippet, item.terms)}</span></a></li>`).join('');
  }

  function move(step) {
    if (!items.length) return;
    selected = (selected + step + items.length) % items.length;
    results.querySelectorAll('[role="option"]').forEach((li, i) => li.setAttribute('aria-selected', String(i === selected)));
    const el = document.getElementById(`sr-${selected}`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  async function openSearch() {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    input.value = '';
    render([], '');
    input.focus();
    try { await loadIndex(); } catch { results.innerHTML = '<li class="search-empty">A busca não carregou. Recarregue a página.</li>'; }
  }

  if (dialog) {
    document.querySelectorAll('[data-search-open]').forEach((b) => b.addEventListener('click', openSearch));
    document.addEventListener('keydown', (event) => {
      const typing = /^(input|textarea|select)$/i.test(event.target.tagName) || event.target.isContentEditable;
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        openSearch();
      }
    });
    input.addEventListener('input', async () => {
      await loadIndex();
      render(search(input.value), input.value);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
      else if (event.key === 'Enter') {
        event.preventDefault();
        if (items[selected]) { dialog.close(); location.href = items[selected].url; }
      }
    });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    results.addEventListener('click', (event) => { if (event.target.closest('a')) dialog.close(); });
  }

  if (reduceMotion.matches) root.classList.add('reduce-motion');
})();
