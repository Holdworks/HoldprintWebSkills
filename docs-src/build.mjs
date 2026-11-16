import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import * as cheerio from 'cheerio';
import { createHighlighter } from 'shiki';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { site, areas, placeholders, placeholderHelp, legacyAnchors, pluginSourceLinks, pluginRulesForAi } from './site.mjs';
import { homeBody } from './partials/home.mjs';
import { pluginMap } from './partials/plugin-map.mjs';
import { icon } from './partials/icons.mjs';
import { apiOverview, apiQueries, apiActions } from './partials/api-pages.mjs';

const generators = { 'api-overview': apiOverview, 'api-queries': apiQueries, 'api-actions': apiActions };

const here = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(here, 'content');
const outDir = path.resolve(here, '..', 'docs');
const checkOnly = process.argv.includes('--check');

const highlighter = await createHighlighter({
  themes: ['github-dark-default'],
  langs: ['bash', 'json', 'javascript', 'typescript', 'html', 'http'],
});

const langAlias = { sh: 'bash', shell: 'bash', terminal: 'bash', js: 'javascript', ts: 'typescript', exemplo: 'javascript', header: 'http' };
const langLabel = { bash: 'Terminal', json: 'JSON', javascript: 'JavaScript', typescript: 'TypeScript', html: 'HTML', http: 'Header', text: 'Saída' };

const report = { placeholders: new Map(), internal: [], brokenLinks: [] };
const internalPatterns = [/localhost/i, /127\.0\.0\.1/, /\.localtest\.me/i, /ngrok/i, /holdprint-teste|\.teste\./i, /\bconta 4\d\d\b/i, /fatia\s*\d+/i];

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function allPages() {
  return areas.flatMap((area) => area.pages.filter((page) => !page.navOnly).map((page) => ({ ...page, area })));
}

function twinPath(route) {
  return route === '/' ? '/index.md' : `${route.replace(/\/$/, '')}.md`;
}

function notePlaceholder(name, route) {
  if (!report.placeholders.has(name)) report.placeholders.set(name, new Set());
  report.placeholders.get(name).add(route);
}

function renderPlaceholdersHtml(html, route) {
  const swap = (text) => text.replace(/\{(APP_URL|BASE_URL|DOMINIO_TECNICO|DOCS_URL)\}/g, (whole, name) => {
    if (placeholders[name]) return placeholders[name];
    notePlaceholder(name, route);
    return `<span class="ph" title="${escapeHtml(placeholderHelp[name] || 'Definido na publicação.')}">${whole}</span>`;
  });
  if (!html.includes('<')) return swap(html);
  return html
    .replace(/(href|src)="\{(DOCS_URL)\}/g, (_m, attr, name) => `${attr}="${placeholders[name]}`)
    .replace(/>([^<]+)</g, (_m, text) => `>${swap(text)}<`);
}

function renderPlaceholdersText(text) {
  return text.replace(/\{(APP_URL|BASE_URL|DOMINIO_TECNICO|DOCS_URL)\}/g, (whole, name) => placeholders[name] || whole);
}

const codeStore = [];

function storeCode(lang, text, caption) {
  const id = codeStore.length;
  codeStore.push({ lang, text: text.replace(/\n+$/, ''), caption });
  return `<!--CODE:${id}-->`;
}

function codeComponent(entry, route) {
  const raw = (entry.lang || 'text').toLowerCase();
  if (raw === 'prompt') return promptComponent(entry.text, route);
  const lang = langAlias[raw] || raw;
  const known = ['bash', 'json', 'javascript', 'typescript', 'html', 'http'].includes(lang);
  const body = known
    ? highlighter.codeToHtml(entry.text, { lang, theme: 'github-dark-default' })
    : `<pre class="shiki plain"><code>${escapeHtml(entry.text)}</code></pre>`;
  const label = entry.caption || langLabel[known ? lang : 'text'] || raw;
  return `<figure class="code"><figcaption><span class="code-label">${escapeHtml(label)}</span><button class="copy" type="button" data-copy aria-label="Copiar código">${icon('copy')}<span>Copiar</span></button></figcaption>${renderPlaceholdersHtml(body, route)}</figure>`;
}

function promptComponent(text, route) {
  return `<figure class="prompt"><figcaption><span class="prompt-label">${icon('sparkle')}Cole na sua IA</span><button class="copy" type="button" data-copy aria-label="Copiar prompt">${icon('copy')}<span>Copiar</span></button></figcaption><pre><code>${renderPlaceholdersHtml(escapeHtml(text.replace(/\n+$/, '')), route)}</code></pre></figure>`;
}

function plainCode(entry) {
  const lang = (entry.lang || 'text').toLowerCase() === 'prompt' ? 'text' : langAlias[entry.lang] || entry.lang || 'text';
  return `<pre><code class="language-${lang}">${escapeHtml(entry.text)}</code></pre>`;
}

function resolveCodes(html, route, plain = false) {
  return html.replace(/<!--CODE:(\d+)-->/g, (_m, id) => (plain ? plainCode(codeStore[Number(id)]) : codeComponent(codeStore[Number(id)], route)));
}

function rewritePluginHref(href) {
  if (!href) return href;
  const [file, hash] = href.split('#');
  if (pluginSourceLinks[file]) return pluginSourceLinks[file] + (hash ? `#${hash}` : '');
  const docsMatch = href.match(/^\{DOCS_URL\}(\/.*)$/);
  if (docsMatch) return docsMatch[1].replace(/\.md$/, '/');
  return href;
}

function calloutKind(text) {
  if (/^\s*(\*\*)?Aten[cç][aã]o/i.test(text)) return 'warn';
  if (/^\s*Para a IA/i.test(text)) return 'ai';
  return 'note';
}

function calloutHtml(kind, inner) {
  const iconName = { warn: 'alert', ai: 'sparkle', note: 'info' }[kind];
  return `<aside class="callout callout-${kind}">${icon(iconName)}<div>${inner}</div></aside>`;
}

function renderMarkdown(source, route) {
  const marked = new Marked({ gfm: true });
  let title = null;
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        if (depth === 1) {
          title = inner;
          return '';
        }
        const id = slugify(text.replace(/`/g, ''));
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      code({ text, lang }) {
        return storeCode(lang, text);
      },
      blockquote({ tokens }) {
        const raw = tokens.map((t) => t.raw).join('');
        return calloutHtml(calloutKind(raw), this.parser.parse(tokens));
      },
      table(token) {
        const head = token.header.map((cell) => `<th${cell.align ? ` style="text-align:${cell.align}"` : ''}>${this.parser.parseInline(cell.tokens)}</th>`).join('');
        const rows = token.rows.map((row) => `<tr>${row.map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`).join('');
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
      link({ href, title: linkTitle, tokens }) {
        const target = rewritePluginHref(href);
        const external = /^https?:/.test(target) && !target.startsWith(site.url);
        return `<a href="${escapeHtml(target)}"${linkTitle ? ` title="${escapeHtml(linkTitle)}"` : ''}${external ? ' rel="noreferrer" target="_blank"' : ''}>${this.parser.parseInline(tokens)}</a>`;
      },
    },
  });
  const html = marked.parse(source);
  return { title, html };
}

function normalizeLegacy(source, route, layout) {
  const $ = cheerio.load(`<article>${source}</article>`, null, false);
  const art = $('article');
  art.find('.eyebrow, .hero-demo, .code-dot, .shot-bar .d, .backdrop').remove();

  const firstHeading = art.find('h1, h2').first();
  const title = firstHeading.html();
  firstHeading.remove();
  const sub = art.find('.section-sub, .lede').first();
  const lede = sub.length ? sub.html() : null;
  sub.remove();

  art.children('h3').each((_i, el) => { el.tagName = 'h2'; });
  art.children('h4').each((_i, el) => { el.tagName = 'h3'; });
  art.find('span.grad').each((_i, el) => $(el).replaceWith($(el).html()));
  art.find('code.inline').removeAttr('class');
  art.find('.know svg, .ask > svg, .callout > svg, .path-ico, h3 > svg, .tab-btn svg').remove();

  art.find('.code').each((_i, el) => {
    const block = $(el);
    const label = block.find('.code-label').text().trim().toLowerCase();
    const text = block.find('pre').text();
    const lang = label === 'prompt' ? 'prompt' : label;
    block.replaceWith(storeCode(lang, text, block.attr('data-caption')));
  });

  art.find('.asks').each((_i, el) => {
    const items = $(el).find('.ask').map((_j, ask) => {
      const q = $(ask).find('.q').text().trim().replace(/^[“"]|[”"]$/g, '');
      const a = $(ask).find('.a').html();
      return `<div class="example">${storeCode('prompt', q)}<p>${a}</p></div>`;
    }).get().join('');
    $(el).replaceWith(`<div class="examples">${items}</div>`);
  });

  art.find('.know').each((_i, el) => {
    $(el).replaceWith($(el).html());
  });

  art.find('.callout').each((_i, el) => {
    const box = $(el);
    const kind = box.hasClass('warn') ? 'warn' : 'note';
    box.find('.ct-title').each((_j, t) => $(t).replaceWith(`<p class="callout-title">${$(t).html()}</p>`));
    const inner = box.children('div').first().html() ?? box.html();
    box.replaceWith(calloutHtml(kind, inner));
  });

  art.find('table.dtable').each((_i, el) => {
    const table = $(el);
    table.removeAttr('class');
    table.find('td.req-yes').each((_j, td) => $(td).removeAttr('class').html('<span class="req req-yes">obrigatório</span>'));
    table.find('td.req-no').each((_j, td) => {
      const t = $(td).text().trim().toLowerCase();
      $(td).removeAttr('class').html(`<span class="req">${t === 'não' || t === 'nao' || t === 'opcional' ? 'opcional' : escapeHtml($(td).text().trim())}</span>`);
    });
    table.wrap('<div class="table-wrap"></div>');
  });

  art.find('.ref').each((_i, el) => {
    const ref = $(el);
    const tag = ref.find('.ref-tag').first();
    const method = ['get', 'post', 'put', 'patch', 'delete'].find((m) => tag.hasClass(m));
    const nameHtml = ref.find('.ref-head code').first().html();
    const nameText = ref.find('.ref-head code').first().text();
    const body = ref.find('.ref-body').first();
    if (method) {
      const id = slugify(`${method} ${nameText}`);
      const codes = [];
      let lastHeading = null;
      body.contents().each((_j, child) => {
        const node = $(child);
        if (child.type === 'tag' && node.is('h3')) lastHeading = node.text().trim();
        const html = child.type === 'comment' ? `<!--${child.data}-->` : '';
        const m = html.match(/^<!--CODE:(\d+)-->$/);
        if (m) {
          const entry = codeStore[Number(m[1])];
          const isRequest = codes.length === 0 && ['bash', 'terminal', 'sh'].includes((entry.lang || '').toLowerCase());
          const isResponse = (entry.lang || '').toLowerCase() === 'json' && codes.length > 0 && !lastHeading?.match(/body|corpo/i);
          const headingCaption = lastHeading && /request body/i.test(lastHeading) ? 'Corpo da requisição' : lastHeading;
          entry.caption = entry.caption || (isRequest ? 'Requisição' : isResponse ? 'Resposta' : headingCaption || langLabel[langAlias[entry.lang] || entry.lang] || 'Exemplo');
          codes.push(html);
          node.remove();
        }
      });
      const doc = body.html();
      let codeBody = codes.join('');
      if (codes.length > 1) {
        const ids = codes.map((html) => Number(html.match(/CODE:(\d+)/)[1]));
        const tabBase = `${id}-code`;
        const bar = ids.map((cid, j) => `<button type="button" role="tab" id="${tabBase}-t${j}" aria-controls="${tabBase}-p${j}" aria-selected="${j === 0}" tabindex="${j === 0 ? 0 : -1}">${escapeHtml(codeStore[cid].caption)}</button>`).join('');
        const panels = codes.map((html, j) => `<div role="tabpanel" id="${tabBase}-p${j}" aria-labelledby="${tabBase}-t${j}"${j === 0 ? '' : ' hidden'}>${html}</div>`).join('');
        codeBody = `<div class="code-tabs" data-tabs><div class="tab-list" role="tablist" aria-label="Exemplos deste endpoint">${bar}</div>${panels}</div>`;
      }
      const codeCol = codes.length ? `<div class="endpoint-code"><div class="endpoint-code-inner">${codeBody}</div></div>` : '';
      ref.replaceWith(`<section class="endpoint" id="${id}"><h2 class="endpoint-head"><span class="method method-${method}">${method.toUpperCase()}</span><code class="endpoint-path">${nameHtml}</code></h2><div class="endpoint-grid${codes.length ? '' : ' no-code'}"><div class="endpoint-doc">${doc}</div>${codeCol}</div></section>`);
    } else {
      const badge = tag.text().trim();
      const id = slugify(nameText);
      const isBase = badge === 'base';
      ref.replaceWith(`<section class="def${isBase ? ' def-base' : ''}" id="${id}"><h3 class="def-head"><code>${nameHtml}</code>${badge && !isBase ? `<span class="badge badge-${slugify(badge)}">${escapeHtml(badge)}</span>` : ''}${isBase ? '<span class="badge">URL base</span>' : ''}</h3><div class="def-body">${body.html() || ''}</div></section>`);
    }
  });

  art.find('.params').each((_i, el) => {
    const rows = $(el).find('.param').map((_j, p) => {
      const name = $(p).children('code').first();
      const desc = $(p).children('span').first();
      const optional = name.text().endsWith('?');
      return `<div class="param"><dt><code>${escapeHtml(name.text().replace(/\?$/, ''))}</code>${optional ? '<span class="req">opcional</span>' : ''}</dt><dd>${desc.html() ?? ''}</dd></div>`;
    }).get().join('');
    $(el).replaceWith(`<dl class="params">${rows}</dl>`);
  });

  art.find('.steps').each((_i, el) => {
    const items = $(el).children('.step').map((_j, step) => `<li>${$(step).find('.step-body').first().html()}</li>`).get().join('');
    $(el).replaceWith(`<ol class="steps">${items}</ol>`);
  });

  art.find('.tabs').each((_i, el) => {
    const tabs = $(el);
    const buttons = tabs.find('.tab-btn');
    const tabId = tabs.attr('id') || `tabs-${_i}`;
    const bar = buttons.map((j, b) => `<button type="button" role="tab" id="${tabId}-t${j}" aria-controls="${tabId}-p${j}" aria-selected="${j === 0}" tabindex="${j === 0 ? 0 : -1}">${$(b).text().trim()}</button>`).get().join('');
    const panels = tabs.find('.tab-panel').map((j, p) => `<div role="tabpanel" id="${tabId}-p${j}" aria-labelledby="${tabId}-t${j}"${j === 0 ? '' : ' hidden'}><h3 class="tab-print-title">${$(buttons[j]).text().trim()}</h3>${$(p).html()}</div>`).get().join('');
    tabs.replaceWith(`<div class="tabs" data-tabs><div class="tab-list" role="tablist">${bar}</div>${panels}</div>`);
  });

  art.find('.shot').each((_i, el) => {
    const shot = $(el);
    const url = shot.find('.shot-url').text().trim();
    const body = shot.find('.shot-body').first().html();
    shot.replaceWith(`<figure class="mock"><div class="mock-bar"><span class="mock-url">${escapeHtml(url)}</span></div><div class="mock-body">${body}</div></figure>`);
  });

  art.find('.faq').each((_i, el) => {
    $(el).find('details').removeAttr('open');
    $(el).find('details').first().attr('open', '');
  });

  art.find('img').each((_i, img) => {
    const src = $(img).attr('src') || '';
    if (!/^(\/|https?:|data:)/.test(src)) $(img).attr('src', `/${src}`);
    $(img).attr('loading', 'lazy');
    $(img).attr('decoding', 'async');
  });

  art.find('a[href^="#"]').each((_i, a) => {
    const id = $(a).attr('href').slice(1);
    if (legacyAnchors[id]) $(a).attr('href', legacyAnchors[id]);
  });

  art.find('h3').each((_i, h) => {
    const node = $(h);
    if (!node.attr('id')) node.attr('id', slugify(node.text()));
  });

  return { title, lede, html: art.html() };
}

function normalizeHeadings(html) {
  const $ = cheerio.load(`<div id="__root">${html}</div>`, null, false);
  let previous = 1;
  const used = new Set();
  $('#__root').find('h2, h3, h4, h5').each((_i, el) => {
    const node = $(el);
    if (node.closest('[role="tabpanel"]').length && node.hasClass('tab-print-title')) return;
    const level = Number(el.tagName.slice(1));
    const fixed = Math.min(level, previous + 1);
    if (fixed !== level) el.tagName = `h${fixed}`;
    previous = fixed;
    let id = node.attr('id') || slugify(node.text());
    let unique = id;
    let n = 2;
    while (used.has(unique)) unique = `${id}-${n++}`;
    used.add(unique);
    node.attr('id', unique);
  });
  return $('#__root').html();
}

function collectToc(html) {
  const $ = cheerio.load(`<div id="__root">${html}</div>`, null, false);
  const items = [];
  $('#__root').find('h2, h3').each((_i, el) => {
    const node = $(el);
    if (node.hasClass('tab-print-title') || node.closest('.endpoint-doc, .def, [role="tabpanel"], .steps, .faq').length) return;
    const text = node.hasClass('endpoint-head') ? `${node.find('.method').text()} ${node.find('.endpoint-path').text()}` : node.text().trim();
    items.push({ level: Number(el.tagName.slice(1)), id: node.attr('id'), text, method: node.find('.method').text().toLowerCase() || null });
  });
  return items;
}

function addHeadingAnchors(html) {
  return html.replace(/<h([23])([^>]*) id="([^"]+)"([^>]*)>([\s\S]*?)<\/h\1>/g, (whole, level, pre, id, post, inner) => {
    if (/tab-print-title/.test(pre + post)) return whole;
    return `<h${level}${pre} id="${id}"${post}>${inner}<a class="anchor" href="#${id}" aria-label="Link para esta seção">#</a></h${level}>`;
  });
}

function plainText(html) {
  const $ = cheerio.load(`<div>${html}</div>`, null, false);
  $('script, style, button, svg').remove();
  return $('div').text().replace(/\s+/g, ' ').trim();
}

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
turndown.use(gfm);
turndown.addRule('fencedLang', {
  filter: (node) => node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE',
  replacement: (_c, node) => {
    const code = node.firstChild;
    const lang = (code.getAttribute('class') || '').replace('language-', '');
    return `\n\n\`\`\`${lang === 'text' ? '' : lang}\n${code.textContent.replace(/\n$/, '')}\n\`\`\`\n\n`;
  },
});
turndown.addRule('dropAnchors', { filter: (node) => node.nodeName === 'A' && node.classList.contains('anchor'), replacement: () => '' });
turndown.addRule('absoluteLinks', {
  filter: (node) => node.nodeName === 'A' && (node.getAttribute('href') || '').startsWith('/'),
  replacement: (content, node) => `[${content}](${site.url}${twinPath(node.getAttribute('href').split('#')[0])}${node.getAttribute('href').includes('#') ? `#${node.getAttribute('href').split('#')[1]}` : ''})`,
});

function prepareForMarkdown(html) {
  const $ = cheerio.load(`<div id="__md">${html}</div>`, null, false);
  const box = $('#__md');
  box.find('.tab-list, .anchor, button, svg').remove();
  box.find('.method').each((_i, el) => $(el).replaceWith(`${$(el).text()} `));
  box.find('.steps > li').each((_i, li) => {
    $(li).children('h2, h3, h4').each((_j, h) => $(h).replaceWith(`<p><strong>${$(h).html()}</strong></p>`));
  });
  box.find('figure.mock').each((_i, el) => {
    const url = $(el).find('.mock-url').text().trim();
    const parts = $(el).find('.mock-body *').filter((_j, n) => $(n).children().length === 0 && $(n).text().trim()).map((_j, n) => $(n).text().trim()).get();
    $(el).replaceWith(`<p><em>Tela de exemplo${url ? ` (${url})` : ''}:</em> ${parts.join(' · ')}</p>`);
  });
  box.find('aside.callout').each((_i, el) => {
    const inner = $(el).children('div').first();
    const title = inner.find('.callout-title').first();
    if (title.length) title.replaceWith(`<p><strong>${title.html()}</strong></p>`);
    $(el).replaceWith(`<blockquote>${inner.html()}</blockquote>`);
  });
  box.find('td, th').each((_i, cell) => {
    $(cell).find('*').addBack().contents().each((_j, node) => {
      if (node.type === 'text' && node.data.includes('|')) node.data = node.data.replace(/\|/g, 'PIPEESCAPE');
    });
  });
  return box.html();
}

function markdownTwinFromSource(source) {
  return renderPlaceholdersText(source).replace(/\]\(([^)]+)\)/g, (whole, href) => {
    const target = rewritePluginHref(href);
    if (target.startsWith('/')) {
      const [p, hash] = target.split('#');
      return `](${site.url}${twinPath(p)}${hash ? `#${hash}` : ''})`;
    }
    return `](${renderPlaceholdersText(target)})`;
  });
}

function navHtml(current) {
  return areas.map((area) => {
    const open = area.id === current.area.id;
    const links = area.pages.map((page) => {
      const active = page.route === current.route && !page.navOnly;
      const heading = page.navHeading ? `<li class="nav-sub" role="presentation">${escapeHtml(page.navHeading)}</li>` : '';
      return `${heading}<li><a href="${page.route}"${active ? ' aria-current="page"' : ''}>${escapeHtml(page.nav)}</a></li>`;
    }).join('');
    return `<div class="nav-group${open ? ' is-open' : ''}"><a class="nav-group-title" href="${area.pages[0].route}"${open ? ' aria-current="true"' : ''}>${escapeHtml(area.title)}${icon('chevron')}</a><ul>${links}</ul></div>`;
  }).join('');
}

function tabsHtml(current) {
  return areas.map((area) => `<a href="${area.pages[0].route}"${area.id === current.area.id ? ' aria-current="true"' : ''}>${escapeHtml(area.title)}</a>`).join('');
}

function tocHtml(fullToc, page) {
  const toc = fullToc.length > 14 ? fullToc.filter((t) => t.level === 2) : fullToc;
  if (!toc.length) return '';
  const items = toc.map((t) => `<li class="toc-l${t.level}"><a href="#${t.id}">${t.method ? `<span class="method method-${t.method} method-sm">${t.method.toUpperCase()}</span>${escapeHtml(t.text.replace(/^\S+\s/, ''))}` : escapeHtml(t.text)}</a></li>`).join('');
  return `<nav class="toc" aria-label="Nesta página"><p class="rail-title">Nesta página</p><ul>${items}</ul></nav>`;
}

function railHtml(toc, page) {
  const prompt = page.prompt ? `<div class="rail-prompt">${promptComponent(page.prompt, page.route)}</div>` : '';
  return `<aside class="rail">${tocHtml(toc, page)}${prompt}</aside>`;
}

function pagerHtml(index, pages) {
  const prev = pages[index - 1];
  const next = pages[index + 1];
  const cell = (p, dir) => (p ? `<a class="pager-${dir}" href="${p.route}"><span>${dir === 'prev' ? 'Anterior' : 'Próximo'}</span><strong>${escapeHtml(p.area.title)} · ${escapeHtml(p.nav)}</strong></a>` : '<span></span>');
  return `<nav class="pager" aria-label="Paginação">${cell(prev, 'prev')}${cell(next, 'next')}</nav>`;
}

function layout({ page, title, lede, body, toc, index, pages }) {
  const isHome = page.route === '/';
  const isReference = page.layout === 'reference';
  const docTitle = isHome ? `${site.name}: MCP, API REST e plugins` : `${plainText(title)} · ${page.area.title} · ${site.name}`;
  const crumbs = isHome ? '' : `<nav class="crumbs" aria-label="Você está aqui"><a href="${page.area.pages[0].route}">${escapeHtml(page.area.title)}</a>${page.route !== page.area.pages[0].route ? `${icon('chevron')}<span>${escapeHtml(page.nav)}</span>` : ''}</nav>`;
  const actions = `<div class="page-actions"><button class="btn btn-ghost" type="button" data-copy-page="${twinPath(page.route)}">${icon('copy')}<span>Copiar para a IA</span></button><a class="btn btn-ghost" href="${twinPath(page.route)}">${icon('file')}<span>Markdown</span></a></div>`;
  const head = `<header class="page-head">${isHome ? '' : `<div class="page-meta">${crumbs}${actions}</div>`}<h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</header>`;
  const content = `<div class="article-body">${body}</div>`;
  const main = isReference || isHome
    ? `<main class="main${isReference ? ' main-reference' : ''}" id="conteudo"><article class="article">${head}${tocInline(toc)}${content}${pagerHtml(index, pages)}</article></main>`
    : `<main class="main" id="conteudo"><article class="article">${head}${content}${pagerHtml(index, pages)}</article>${railHtml(toc, page)}</main>`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(docTitle)}</title>
<meta name="description" content="${escapeHtml(page.description || site.description)}">
<link rel="canonical" href="${site.url}${page.route}">
<link rel="alternate" type="text/markdown" href="${twinPath(page.route)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0f17" media="(prefers-color-scheme: dark)">
<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('hp-docs-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="stylesheet" href="/assets/site.css">
</head>
<body${isHome ? ' class="is-home"' : ''}>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<header class="topbar">
  <button class="icon-btn menu-btn" type="button" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false" data-menu>${icon('menu')}</button>
  <a class="brand" href="/" aria-label="Holdprint Docs, início"><img class="brand-logo brand-logo-on-light" src="/assets/logo-holdprint.svg" alt="Holdprint" width="111" height="22"><img class="brand-logo brand-logo-on-dark" src="/assets/logo-holdprint-claro-sobre-escuro.svg" alt="" aria-hidden="true" width="111" height="22"><span>Docs</span></a>
  <button class="search-trigger" type="button" data-search-open aria-label="Buscar na documentação">${icon('search')}<span>Buscar na documentação</span><kbd>⌘K</kbd></button>
  <nav class="top-tabs" aria-label="Áreas">${tabsHtml(page)}</nav>
  <div class="top-actions">
    <a class="icon-btn" href="/llms.txt" title="llms.txt: índice para IAs" aria-label="llms.txt, índice para IAs">${icon('bot')}</a>
    <button class="icon-btn" type="button" data-theme-toggle aria-label="Alternar tema claro e escuro">${icon('sun')}${icon('moon')}</button>
  </div>
</header>
<div class="shell">
  <aside class="sidebar" id="sidebar" aria-label="Navegação da documentação">
    <nav class="sidebar-nav">${navHtml(page)}</nav>
    <div class="sidebar-foot"><a href="/llms.txt">llms.txt</a><a href="/llms-full.txt">llms-full.txt</a><a href="${site.github}" rel="noreferrer" target="_blank">GitHub</a></div>
  </aside>
  <div class="scrim" data-scrim hidden></div>
  ${main}
</div>
<dialog class="search" aria-label="Buscar na documentação">
  <form method="dialog" class="search-box" role="search">
    ${icon('search')}<input type="search" placeholder="Buscar: plugin, manifesto, contas a pagar, erro 94…" aria-label="Termo de busca" autocomplete="off" spellcheck="false" data-search-input>
    <button class="search-esc" type="submit" aria-label="Fechar busca">Esc</button>
  </form>
  <ul class="search-results" role="listbox" aria-label="Resultados" data-search-results></ul>
  <p class="search-hint"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></p>
</dialog>
<div class="toast" role="status" aria-live="polite" data-toast></div>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

function tocInline(toc) {
  const endpoints = toc.filter((t) => t.method);
  if (!endpoints.length) return '';
  return `<nav class="endpoint-index" aria-label="Endpoints desta página"><p class="rail-title">Endpoints</p><ul>${endpoints.map((t) => `<li><a href="#${t.id}"><span class="method method-${t.method} method-sm">${t.method.toUpperCase()}</span><code>${escapeHtml(t.text.replace(/^\S+\s/, ''))}</code></a></li>`).join('')}</ul></nav>`;
}

function scanInternal(route, text) {
  for (const pattern of internalPatterns) {
    const m = text.match(pattern);
    if (m && /desenvolvedor|\[::1\]/.test(text.slice(Math.max(0, m.index - 80), m.index + 80))) continue;
    if (m) report.internal.push(`${route}: "${text.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ')}"`);
  }
}

function writeFile(rel, data) {
  const dest = path.join(outDir, rel);
  if (checkOnly) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, data);
}

function copyAssets() {
  const assetsSrc = path.join(here, 'assets');
  for (const name of fs.readdirSync(assetsSrc)) writeFile(path.join('assets', name), fs.readFileSync(path.join(assetsSrc, name)));
  const fonts = [
    ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter-latin-wght-normal.woff2'],
    ['@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2', 'inter-latin-ext-wght-normal.woff2'],
    ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'jetbrains-mono-latin-400-normal.woff2'],
    ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2', 'jetbrains-mono-latin-600-normal.woff2'],
  ];
  for (const [from, to] of fonts) writeFile(path.join('assets', 'fonts', to), fs.readFileSync(path.join(here, 'node_modules', from)));
}

const pages = allPages();
const searchIndex = [];
const twins = [];

for (const [index, page] of pages.entries()) {
  let title;
  let lede = null;
  let bodyHtml;
  let twin;

  if (page.source === 'home') {
    const home = homeBody({ storeCode, areas });
    title = page.title;
    lede = home.lede;
    bodyHtml = home.html;
  } else if (page.source.endsWith('.md')) {
    let source = fs.readFileSync(path.join(contentDir, page.source), 'utf8');
    const rendered = renderMarkdown(source, page.route);
    title = page.title || rendered.title;
    let html = rendered.html;
    const firstPara = html.match(/^\s*<p>([\s\S]*?)<\/p>\n?/);
    if (firstPara) {
      lede = firstPara[1];
      html = html.slice(firstPara[0].length);
    }
    if (page.route === '/plugins/') html = html.replace('<h2 id="o-que-da-para-construir">', `${pluginMap({ storeCode })}<h2 id="o-que-da-para-construir">`);
    bodyHtml = html;
    twin = markdownTwinFromSource(source.replace(/^# .*$/m, `# ${plainText(title)}`));
  } else {
    const source = page.source.startsWith('gen:') ? generators[page.source.slice(4)]() : fs.readFileSync(path.join(contentDir, page.source), 'utf8').replace(/^<!--[^>]*-->\n/, '');
    const legacy = normalizeLegacy(source, page.route, page.layout);
    title = page.title || legacy.title;
    lede = legacy.lede;
    bodyHtml = legacy.html;
  }

  bodyHtml = normalizeHeadings(renderPlaceholdersHtml(bodyHtml, page.route));
  const toc = collectToc(bodyHtml);
  const finalBody = addHeadingAnchors(resolveCodes(bodyHtml, page.route));

  if (!twin) {
    const plain = resolveCodes(bodyHtml, page.route, true).replace(/<span class="ph"[^>]*>([^<]*)<\/span>/g, '$1');
    twin = `# ${plainText(title)}\n\n${lede ? `${turndown.turndown(lede)}\n\n` : ''}${turndown.turndown(prepareForMarkdown(plain)).replace(/PIPEESCAPE/g, '\\|')}\n`;
  }
  twin = `${twin.trim()}\n\n---\nFonte: ${site.url}${page.route}\n`;

  const html = layout({ page, title, lede, body: finalBody, toc, index, pages });
  scanInternal(page.route, twin);
  writeFile(page.route === '/' ? 'index.html' : path.join(page.route, 'index.html'), html);
  writeFile(twinPath(page.route).slice(1), twin);
  twins.push({ page, title: plainText(title), twin });

  const $ = cheerio.load(finalBody, null, false);
  const headings = $('h2[id], h3[id]').map((_i, h) => [[$(h).text().replace(/#$/, '').trim(), $(h).attr('id')]]).get();
  searchIndex.push({ t: plainText(title), a: page.area.title, u: page.route, d: page.description || '', h: headings, x: plainText(finalBody).slice(0, 9000) });

  $('a[href^="/"]').each((_i, a) => {
    const href = $(a).attr('href').split('#')[0];
    if (!pages.some((p) => p.route === href) && !href.endsWith('.md') && !href.endsWith('.txt')) report.brokenLinks.push(`${page.route} -> ${href}`);
  });
}

const llms = [
  '# Holdprint Docs',
  '',
  '> Documentação pública do Holdprint (ERP para gráficas) para IAs e desenvolvedores: conectar uma IA pelo MCP hospedado, instalar as skills oficiais, chamar a API REST com API Key e criar plugins que rodam dentro do Holdprint. Cada página tem uma versão em Markdown no mesmo endereço terminado em .md.',
  '',
  pluginRulesForAi,
  '',
  ...areas.flatMap((area) => [
    `## ${area.title}`,
    '',
    ...area.pages.map((page) => `- [${area.title} · ${page.nav}](${site.url}${twinPath(page.route)}): ${page.description || ''}`),
    '',
  ]),
  '## Opcional',
  '',
  `- [Tudo em um arquivo](${site.url}/llms-full.txt): todas as páginas acima concatenadas`,
  '',
].join('\n');
writeFile('llms.txt', renderPlaceholdersText(llms));
writeFile('llms-full.txt', twins.map((t) => t.twin).join('\n\n'));
writeFile('search-index.json', JSON.stringify(searchIndex));
writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site.url}${p.route}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
copyAssets();

const redirects = { '/plugins/api-v1/': '/api/v1/' };
for (const [from, to] of Object.entries(redirects)) {
  writeFile(path.join(from, 'index.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Página movida</title><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${site.url}${to}"></head><body><p>Esta página mudou para <a href="${to}">${to}</a>.</p></body></html>\n`);
  writeFile(twinPath(from).slice(1), `Esta página mudou para ${site.url}${twinPath(to)}\n`);
}

const notFoundPage = { route: '/404/', nav: 'Página não encontrada', area: areas[0], description: 'Página não encontrada.' };
writeFile('404.html', layout({
  page: notFoundPage,
  title: 'Página não encontrada',
  lede: 'O endereço pode ter mudado: a documentação agora tem uma página por assunto.',
  body: `<p>Use a busca (<kbd>⌘K</kbd>) ou comece por uma das áreas:</p><ul>${areas.map((a) => `<li><a href="${a.pages[0].route}">${a.title}</a></li>`).join('')}</ul>`,
  toc: [],
  index: -1,
  pages: [],
}).replace('<link rel="canonical" href="https://docs.holdworks.ai/404/">', ''));

const lines = [`Páginas: ${pages.length}`];
if (report.placeholders.size) lines.push(`Marcadores pendentes: ${[...report.placeholders.entries()].map(([k, v]) => `${k} (${v.size} pág.)`).join(', ')}`);
lines.push(report.internal.length ? `ATENÇÃO, possível conteúdo interno:\n  ${report.internal.join('\n  ')}` : 'Conteúdo interno: nenhum');
lines.push(report.brokenLinks.length ? `LINKS QUEBRADOS:\n  ${report.brokenLinks.join('\n  ')}` : 'Links internos: ok');
console.log(lines.join('\n'));
if (report.brokenLinks.length || report.internal.length) process.exitCode = 1;
