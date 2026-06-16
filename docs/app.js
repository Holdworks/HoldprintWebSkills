// Holdprint docs — copy buttons, scroll-spy, mobile drawer, harness tabs.
(function () {
  'use strict';

  const COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  const OK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>';

  // Copy buttons on every code block marked data-copy
  document.querySelectorAll('.code[data-copy]').forEach((block) => {
    const pre = block.querySelector('pre');
    if (!pre) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Copiar');
    btn.innerHTML = COPY_ICON;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.innerText.trim()).then(() => {
        btn.classList.add('ok');
        btn.innerHTML = OK_ICON;
        setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = COPY_ICON; }, 1700);
      });
    });
    block.appendChild(btn);
  });

  // Harness tabs (claude.ai / ChatGPT)
  const tabRoot = document.getElementById('webTabs');
  if (tabRoot) {
    const btns = tabRoot.querySelectorAll('.tab-btn');
    const panels = tabRoot.querySelectorAll('.tab-panel');
    btns.forEach((b) => b.addEventListener('click', () => {
      const t = b.dataset.tab;
      btns.forEach((x) => x.classList.toggle('active', x === b));
      panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === t));
    }));
  }

  // Mobile drawer
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');
  const toggle = document.getElementById('menuToggle');
  const closeDrawer = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); };
  if (toggle) toggle.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('show'); });
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  sidebar.querySelectorAll('.nav-link').forEach((l) => l.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 920px)').matches) closeDrawer();
  }));

  // Scroll-spy: highlight active section in sidebar
  const links = Array.from(document.querySelectorAll('.sidebar .nav-link'));
  const map = new Map();
  links.forEach((l) => { const id = l.getAttribute('href').slice(1); const sec = document.getElementById(id); if (sec) map.set(sec, l); });
  const setActive = (link) => links.forEach((l) => l.classList.toggle('active', l === link));
  const obs = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]) setActive(map.get(visible[0].target));
  }, { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] });
  map.forEach((_l, sec) => obs.observe(sec));
})();
