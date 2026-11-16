const paths = {
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  sparkle: '<path d="M12 3.5 13.9 9a1.5 1.5 0 0 0 1 1l5.6 2-5.6 2a1.5 1.5 0 0 0-1 1L12 20.5 10.1 15a1.5 1.5 0 0 0-1-1L3.5 12l5.6-2a1.5 1.5 0 0 0 1-1z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
  alert: '<path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 16.8v.1"/>',
  chevron: '<path d="m9.5 6.5 5.5 5.5-5.5 5.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  bot: '<rect x="4.5" y="8" width="15" height="11" rx="3"/><path d="M12 4.5V8M9 13v1.5M15 13v1.5M2.5 13v2.5M21.5 13v2.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  file: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10z"/><path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="m7 9.5 3 2.5-3 2.5M12.5 15H17"/>',
  braces: '<path d="M8 4H7a2 2 0 0 0-2 2v3.5A2.5 2.5 0 0 1 2.5 12 2.5 2.5 0 0 1 5 14.5V18a2 2 0 0 0 2 2h1M16 4h1a2 2 0 0 1 2 2v3.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5V18a2 2 0 0 1-2 2h-1"/>',
  puzzle: '<path d="M10 4.5a2 2 0 1 1 4 0V6h3.5a1.5 1.5 0 0 1 1.5 1.5V11h-1.5a2 2 0 1 0 0 4H19v3.5a1.5 1.5 0 0 1-1.5 1.5H14v-1.5a2 2 0 1 0-4 0V20H6.5A1.5 1.5 0 0 1 5 18.5V15h1.5a2 2 0 1 0 0-4H5V7.5A1.5 1.5 0 0 1 6.5 6H10z"/>',
  plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"/>',
};

export function icon(name, className = '') {
  const body = paths[name];
  if (!body) throw new Error(`Ícone desconhecido: ${name}`);
  return `<svg class="i i-${name}${className ? ` ${className}` : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const iconPaths = paths;
