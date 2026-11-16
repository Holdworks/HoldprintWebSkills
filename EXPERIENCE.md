# EXPERIENCE — docs.holdworks.ai (site inteiro)

Direção aprovada: `.impeccable/surfaces/docs-index-html.md` (direction contract, card "Padrão de mercado", régua Stripe Docs, escolhida pelo Rafael em 13/11/2026) · Modo: Read
Suposições: nenhuma. Publicação segurada: o site é construído e validado localmente e não sobe para a Vercel até a plataforma de plugins entrar em produção.

## 1. Storyboard

O site deixa de ser uma página única e passa a ter uma página por assunto, cada uma com um gêmeo em texto (`.md`) para a IA.

| # | Página / bloco | Propósito | Composição | Assets | Batida de motion | Tecnologia |
|---|---|---|---|---|---|---|
| 1 | Cabeçalho global | Achar qualquer coisa em 2 s | Logo, busca ⌘K, abas Começar · Conectar IA · API REST · Plugins, tema | logo-full.png | nenhuma | HTML + CSS |
| 2 | Início (`/`) | Escolher um dos três caminhos | Título + lede; três linhas "caminho" com texto à esquerda e o primeiro comando ou prompt à direita; bloco "Para a sua IA" com `llms.txt` | nenhum | nenhuma | HTML gerado |
| 3 | Páginas de guia (Conectar IA, Plugins) | Ler e executar | Coluna de leitura de 680px; trilho direito com "Nesta página" e o cartão "Cole na sua IA" | prints reais existentes (oauth-login.png) | nenhuma | HTML gerado de Markdown |
| 4 | Páginas de referência (API REST, API /v1) | Montar a chamada | Cada endpoint em duas colunas: parâmetros à esquerda, requisição e resposta fixas à direita | nenhum | nenhuma | HTML gerado, painel sticky em CSS |
| 5 | Plugins › Visão geral: "Onde o plugin aparece" | Ver onde o plugin entra no Holdprint e qual trecho do manifesto faz isso | Esquema de tela do Holdprint desenhado em HTML/CSS (menu lateral, tela de orçamento, abas, cards) com pontos clicáveis; painel de código sincronizado ao lado | nenhum (desenhado em código, sem print) | troca de destaque + troca do trecho | JS vanilla |
| 6 | Rodapé de página | Seguir adiante | Anterior / Próximo, "Copiar página para a IA", "Ver como Markdown" | nenhum | nenhuma | HTML gerado |

Ritmo: guias alternam texto curto, código e tabela; referências são densas e previsíveis. Fechamento de cada página: Anterior/Próximo e o atalho de copiar para a IA.

## 2. Gramática de motion

- Easing: `cubic-bezier(.2,.8,.2,1)` (ease-out exponencial) para tudo; sem bounce.
- Durações: micro 120 ms (hover, foco) · UI 200 ms (gaveta, busca, troca de aba) · assinatura 260 ms.
- Coreografia: nada anima ao rolar; nada entra em cascata. Conteúdo visível por padrão, sem JS.
- Momento-assinatura (UM): no mapa "Onde o plugin aparece", ao escolher uma superfície o contorno de destaque desliza até ela (transform + width/height via variáveis) e o trecho do manifesto troca com fade de 120 ms; a linha correspondente do código fica marcada.
- Reduced motion: destaque e troca instantâneos; gaveta e busca sem transição.

## 3. Decisão de stack

| Capacidade | Escolha | Por quê | Rejeitado |
|---|---|---|---|
| Geração das páginas | Script Node `docs-src/build.mjs` (marked + cheerio + shiki + turndown, dependências locais só em `docs-src/`) gerando HTML estático em `docs/` | A Vercel continua servindo `docs/` como hoje, sem build no deploy; uma fonte vira HTML para pessoas e `.md` para IAs | Next/Astro (troca o deploy e o stack do repo); manter página única (146 KB, sem endereço por assunto) |
| Realce de código | shiki em tempo de build, temas claro e escuro por variáveis CSS | Qualidade de cor igual à de docs de referência, zero JS no navegador | Prism/highlight.js no navegador (JS extra, cores piores) |
| Busca | Índice JSON gerado no build + JS vanilla (⌘K) | Site pequeno, sem serviço externo | Algolia (serviço externo, conta) |
| Motion de UI | CSS transitions | Só micro-interações e uma assinatura | GSAP/Motion (peso sem necessidade) |
| Smooth scroll / 3D / vídeo | nenhum | Modo Read | — |
| Fontes | Inter (variável) e JetBrains Mono, hospedadas no próprio site (woff2) | Identidade atual da marca; sem dependência do Google no carregamento | Google Fonts por link (requisição a terceiro) |

Pacotes locais: `npm install` em `docs-src/` (marked, cheerio, shiki, turndown, @fontsource-variable/inter, @fontsource/jetbrains-mono).

## 4. Ficha de imagens

### IMG-01 — oauth-login.png (existente)
Função: mostrar a tela de login do MCP · Origem: print real já publicado · Entrega: PNG atual, `loading="lazy"`, largura máxima da coluna · Alt: "Tela de login do Holdprint pedindo autorização para o conector" · Motion: nenhum.

### IMG-02 — Mapa "Onde o plugin aparece"
Função: assinatura da seção Plugins · Origem: desenhado em HTML/CSS, não é imagem · Conteúdo: menu lateral com grupos reais (Produção, Financeiro, Estoque, CRM, Cadastros, Custeio, Relatórios, Plugins), tela de orçamento com barra de ações, abas e um card da Visão Geral · Proporção: 16:10 no desktop; no celular vira lista de superfícies com o trecho abaixo · Alt textual: cada ponto é um botão com nome da superfície.

Nenhuma outra imagem; nenhum stock.

## 5. Orçamento de performance

| Métrica | Alvo | Medido (antes) | Medido (final) |
|---|---|---|---|
| LCP mobile (laboratório: Slow 4G + CPU 4x, /plugins/, servidor local sem compressão) | ≤ 2.5 s | n/d | 1,93 s |
| INP | ≤ 100 ms | n/d | sem trabalho longo no carregamento (JS 4,5 KB gzip, deferido) |
| CLS | ≤ 0.05 | n/d | 0,00 |
| JS inicial (gzip) | ≤ 15 KB | 1,2 KB | 4,5 KB |
| Peso da primeira dobra | ≤ 300 KB | ~180 KB (HTML de 146 KB) | ~70 KB gzip no início (HTML 4 KB + CSS 9 KB + JS 4,5 KB + Inter 48 KB + logo) |
| Fontes críticas | 2 famílias / ≤ 4 arquivos | Google Fonts | 2 famílias, 4 woff2 no próprio site (1 pré-carregado) |

Lighthouse (celular, /plugins/): acessibilidade 100, boas práticas 100, SEO 100, navegação por agentes 100.

Camadas: T0 (sem JS) lê tudo, navega por links, código visível; T1 (celular) gaveta de menu e trilho direito recolhido; T2 (desktop) três colunas, busca ⌘K, mapa interativo.

## 6. Matriz de QA

Viewports: 360×780 · 430×932 · 820×1180 · 1280×800 · 1440×900 · 1920×1080 · 2560×1080, em tema claro e escuro.
Teclado: ⌘K abre a busca, setas e Enter navegam nos resultados, Esc fecha; Tab percorre menu, conteúdo e mapa com foco visível.
Reduced motion: mapa e gaveta sem transição.
Aparelho fraco: CPU 4x no Lighthouse; nota de desempenho ≥ 95.
Conteúdo: nenhum endereço interno, porta local, conta de teste ou chave; marcadores de endereço de produção aparecem destacados como pendentes.
