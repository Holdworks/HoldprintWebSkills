---
version: 1
slug: "docs-index-html"
primary_target: "docs/index.html"
related_targets: ["docs"]
---

# Surface: docs.holdworks.ai (whole site)

Mode: Read. Audience: the customer's LLM first, the print-shop human beside it. Job: go from zero to a connected AI, a working API call or a published plugin. Constraints: static HTML/CSS/vanilla JS in `docs/`, pt-BR only, publication hold (built and verified locally, not deployed), no internal hosts, ports, test accounts or keys. Quality bar chosen by Rafael: Stripe Docs.

## Direction contract

THESIS: The docs are a workbench the reader's AI executes: every page pairs reference with a copy-ready action (command, prompt or request). Refuses the marketing hero on a docs home (gradient headline, fake chat demo) and the single endless scrolling page; each topic is its own addressable page with a plain-text twin.

OWN-WORLD: Category canon at Stripe grade. White ground, slate ink, one Holdprint blue accent, slate hairlines, no gradients, no glass, no shadows past 1px. Dark slate code panels with blue and teal tokens. Inter for UI and prose, JetBrains Mono for code, method badges and paths. Three-column shell: left nav grouped by product area, 680px reading column, right rail with "Nesta página" and the "Cole na sua IA" card. API pages switch the right rail to a sticky request/response panel. Light and dark themes are equal citizens.

STORY: The reader sees three ways to build (Conectar IA, API REST, Plugins), picks one, copies the next command or prompt, and gets a result. The AI can fetch `/llms.txt` and the `.md` twin of any page.

FIRST VIEWPORT: 60px header (logo, 300px search with ⌘K, top tabs Começar, Conectar IA, API REST, Plugins, theme toggle). Left nav. Breadcrumb, H1 at 44px max two lines, 18px lede, then the three-command code block in the reading column. Right rail: "Nesta página" and the paste-to-your-AI card. Primary action: copy the starter prompt.

FORM: Canon card (the category standard, embraced without irony), chosen by Rafael over the ordered list. Signature interaction: "Onde o plugin aparece", a Holdprint screen map where choosing a surface (menu page, action, tab, card, function) highlights it and swaps the manifest snippet in the synced code panel. seed:e901defa51f2566c

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Production URLs ({APP_URL}, {BASE_URL}, {DOMINIO_TECNICO}, {DOCS_URL}) undefined; rendered as visible pending markers until decided.
