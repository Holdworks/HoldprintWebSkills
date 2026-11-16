---
name: Holdworks Docs
description: Documentation workbench for docs.holdworks.ai where every page pairs reference with a copy-ready action for the reader's AI.
colors:
  ground: "#ffffff"
  ground-subtle: "#f8fafc"
  ground-muted: "#f1f5f9"
  ink: "#0f172a"
  text: "#334155"
  text-secondary: "#475569"
  text-tertiary: "#64748b"
  hairline: "#e2e8f0"
  hairline-strong: "#cbd5e1"
  holdprint-blue: "#2563eb"
  holdprint-blue-ink: "#1d4ed8"
  blue-wash: "#eff6ff"
  blue-line: "#bfdbfe"
  code-slate: "#0d1424"
  code-slate-head: "#111a2e"
  code-slate-line: "#1e293b"
  code-text: "#e2e8f0"
  code-muted: "#94a3b8"
  caution-wash: "#fffbeb"
  caution-line: "#fde68a"
  caution-ink: "#b45309"
  pending-wash: "#fef3c7"
  pending-ink: "#92400e"
  pending-line: "#f59e0b"
  method-get-bg: "#dcfce7"
  method-get-ink: "#166534"
  method-post-bg: "#dbeafe"
  method-post-ink: "#1e40af"
  method-patch-bg: "#fef3c7"
  method-patch-ink: "#92400e"
  method-delete-bg: "#fee2e2"
  method-delete-ink: "#991b1b"
  dark-ground: "#0b0f17"
  dark-ground-subtle: "#0f1521"
  dark-ground-muted: "#151d2b"
  dark-ink: "#f1f5f9"
  dark-text: "#cbd5e1"
  dark-hairline: "#1e2735"
  dark-blue: "#60a5fa"
  dark-blue-ink: "#93c5fd"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2rem, 1.35rem + 1.5vw, 2.75rem)"
    fontWeight: 720
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 620
    lineHeight: 1.3
    letterSpacing: "-0.014em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.006em"
  lede:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  ui:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.4
  code:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.7
  endpoint-path:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  dialog: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "44px"
  topbar: "60px"
  sidebar: "272px"
components:
  button-ghost:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "0 11px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.ground-subtle}"
    textColor: "{colors.ink}"
  search-trigger:
    backgroundColor: "{colors.ground-subtle}"
    textColor: "{colors.text-tertiary}"
    rounded: "{rounded.md}"
    height: "36px"
    width: "300px"
  code-figure:
    backgroundColor: "{colors.code-slate}"
    textColor: "{colors.code-text}"
    rounded: "{rounded.lg}"
  prompt-figure:
    backgroundColor: "{colors.blue-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  callout-note:
    backgroundColor: "{colors.ground-subtle}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  callout-warn:
    backgroundColor: "{colors.caution-wash}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  method-badge:
    backgroundColor: "{colors.method-get-bg}"
    textColor: "{colors.method-get-ink}"
    rounded: "{rounded.xs}"
    padding: "5px 7px"
  pending-chip:
    backgroundColor: "{colors.pending-wash}"
    textColor: "{colors.pending-ink}"
    rounded: "{rounded.xs}"
  pager-card:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
---

# Design System: Holdworks Docs

## Overview

**Creative North Star: "The Workbench"**

docs.holdworks.ai is a workbench that the reader's AI executes while the human approves. Every page pairs reference with a copy-ready action: a command, a prompt or a request. The look is the documentation category's canon, embraced without irony: white ground, slate ink, one Holdprint blue, slate hairlines. Light and dark themes are equal citizens. Dark follows the OS preference and a manual toggle, with no hierarchy between them.

Density is calm and reference-grade. Prose sits in a 45rem reading column with a 15rem right rail. API pages widen to a two-column layout. Depth comes from 1px hairlines and tonal steps between ground, subtle and muted surfaces. The only things that read as dark objects are the code panels. Delight is limited to small moves: a 120ms hover on every interactive surface, a 3px arrow nudge on path cards, and a ring that glides across the Holdprint screen map.

Confirmed rejections: no marketing hero on the docs home (no gradient headline, no fake chat demo), no single endless scrolling page, no gradients, no glass.

**Key Characteristics:**
- One accent (Holdprint blue) on a slate neutral ramp; color otherwise only carries meaning (HTTP method, caution, pending).
- Hairline borders and tonal fills define structure; shadows exist only on overlays.
- Inter for prose and UI, JetBrains Mono for anything an AI or a shell will read literally.
- Every page ends in an action: copy button on each code and prompt figure, "Copiar para a IA" and "Markdown" in the page meta.
- A signature interaction (the plugin map) that makes the product's surfaces tangible.

## Colors

A cool slate neutral ramp, a single clear blue, and a small set of semantic hues. Values below are the light theme. The dark theme remaps the same roles (stated in the frontmatter as `dark-*`).

### Primary
- **Holdprint Blue** (#2563eb; dark #60a5fa): active tab underline, focus ring, callout icons, plugin-map ring, path-card icons, selection tint.
- **Link Blue** (#1d4ed8; dark #93c5fd): link text, active sidebar item, active TOC entry, prompt label.
- **Blue Wash** (#eff6ff; dark rgba(96,165,250,.10)) with **Blue Line** (#bfdbfe; dark rgba(96,165,250,.32)): the "Cole na sua IA" prompt figure, the AI callout and the active sidebar row.

### Neutral
- **Ground** (#ffffff; dark #0b0f17): page and sidebar.
- **Ground Subtle** (#f8fafc; dark #0f1521): search trigger, table headers, note callouts, base-URL block.
- **Ground Muted** (#f1f5f9; dark #151d2b): hover fills, inline code background, badges.
- **Ink** (#0f172a; dark #f1f5f9): headings, strong text, current nav.
- **Text** (#334155), **Text Secondary** (#475569), **Text Tertiary** (#64748b): body, ledes and nav, then metadata and breadcrumbs.
- **Hairline** (#e2e8f0) and **Hairline Strong** (#cbd5e1): all borders and dividers; strong for step markers and the brand divider.
- **Code Slate** (#0d1424, header #111a2e, line #1e293b; text #e2e8f0, muted #94a3b8): the code panel, near-identical in both themes.

### Semantic
- **Caution** (wash #fffbeb, line #fde68a, ink #b45309): warn callouts and the "escrita" badge.
- **Pending** (wash #fef3c7, ink #92400e, dashed line #f59e0b): placeholder chips for production URLs not yet decided.
- **Method pairs**: GET green (#dcfce7/#166534), POST blue (#dbeafe/#1e40af), PUT and PATCH amber (#fef3c7/#92400e), DELETE red (#fee2e2/#991b1b).

### Named Rules
**The One Accent Rule.** Blue is the only brand color. Other hues appear only as method, caution or pending semantics, never as decoration.

**The Dark Code Rule.** Code panels are dark slate in light and dark themes alike. They are the one dark object on a light page, and they are not themed away.

**The Pending Marker Rule.** An undecided value renders as an amber dashed monospace chip with a help cursor. It is never silently filled in with an invented host.

## Typography

**Display and Body Font:** Inter (variable 100-900, self-hosted latin and latin-ext, with ui-sans-serif and system fallbacks; features cv11 and ss01 on).
**Mono Font:** JetBrains Mono (400 and 600, self-hosted).

**Character:** A neutral, slightly tightened grotesque for reading, and a mono that signals "this is literal". Inter is the incumbent brand face, so it is sanctioned here as a deliberate choice. Weights stay between 500 and 720 for hierarchy, with tracking tightening as size grows.

### Hierarchy
- **Display** (720, clamp 2rem to 2.75rem, 1.12, -0.03em): the page H1, capped at 28ch (18ch on home), balanced wrap.
- **Headline** (620, 1.5rem, 1.3): article H2, with a 56px top margin.
- **Title** (600, 1.125rem, 1.4): H3; H4 at 1rem/600.
- **Lede** (400, 18px, 1.6, Text Secondary): one per page, max 42rem.
- **Body** (400, 16px, 1.7): prose in a 45rem column, roughly 70ch.
- **UI** (500, 14px): top tabs, nav, tab buttons, table cells at 14.5px.
- **Label** (600, 12.5px): prompt label, "Nesta página" rail title at 13px, code-figure captions at 500.
- **Code** (400, 13.5px, 1.7 in panels; 0.86em inline with a Ground Muted chip and hairline border): commands, paths, tokens, method badges (600, 12px).

### Named Rules
**The Literal Is Mono Rule.** Anything a reader or an AI will paste, type or match (commands, paths, headers, scopes, field names) is set in JetBrains Mono. Everything else is Inter.

**The No Uppercase Rule.** Labels are sentence case at a small size and heavier weight. The system has no uppercase or letter-spaced micro-label style, and none should be added.

## Layout

A three-column shell: a 272px sticky left nav grouped by product area, a reading column (45rem max) and a 15rem right rail ("Nesta página" scroll-spy plus the paste-to-AI card), separated by a 64px gap, centered, with 44px 48px page padding. The topbar is 60px sticky. Reference pages use a 74rem main and, from 1360px up, a two-column endpoint grid: documentation on the left and a sticky 30rem request/response code panel with tabs on the right. The home uses a 60rem main with alternating text and code "path" rows (36px vertical padding, 1px dividers).

Spacing is a 4/8/16/24 rhythm with larger section breaks of 36 to 56px. Vertical separation is made with hairline rules rather than boxes.

Responsive steps: under 1280px the rail is dropped and the column is 46rem. Under 1100px the top tabs hide. Under 900px the sidebar becomes a drawer with a scrim and a menu button. Under 640px the brand label collapses, search becomes an icon, tables get a min-width and scroll, and param lists stack. A print stylesheet removes chrome and expands tabs.

## Elevation & Depth

Flat by default and tonal. Structure comes from 1px hairlines and three ground steps (Ground, Subtle, Muted). Only overlays lift: the search dialog, the toast and the mobile drawer use `--shadow-pop`.

### Shadow Vocabulary
- **Overlay pop** (light: `0 0 0 1px var(--line), 0 2px 3px rgba(15,23,42,.1)`; dark: `0 0 0 1px var(--line), 0 2px 3px rgba(0,0,0,.45)`): dialog, toast and open drawer only.
- **Mock menu** (`0 2px 3px rgba(15,23,42,.12)`): the dropdown inside the illustrated Holdprint screen.
- **Focus ring** (`outline: 2px solid accent; offset 2px`): all keyboard focus.
- **Map ring** (`0 0 0 2px #2563eb, 0 0 0 6px rgba(37,99,235,.18)`): the plugin-map highlight, shown inside the illustration only.

### Named Rules
**The Flat Page Rule.** Page content (cards, callouts, code panels, tables) never carries a shadow. A shadow means "this floats above the page".

## Shapes

Gently rounded and consistent. Reading-surface containers (code, prompt, callout, table, pager, endpoint list) use a 10px radius. Controls (buttons, search trigger, icon buttons) use 8px. Nav rows, copy buttons and field mocks use 6 to 7px. Method badges and pending chips use 4 to 5px. Pills (999px) are reserved for the plugin-map picker and the "escrita" and tag badges. The search dialog is 14px and the map screen 12px. Borders are always 1px hairline. Step markers are 28px circles. Dashed borders mean "pending" or "empty" only.

## Components

### Buttons
- **Shape:** 8px radius, 32px tall, 13px Inter 500, 15px icon plus label.
- **Ghost (the only text button):** Ground fill, hairline border, Text Secondary text. Hover darkens the border and text to Ink and fills Ground Subtle, over 120ms with the signature ease `cubic-bezier(.2,.8,.2,1)`.
- **Icon button:** 36px square, 8px radius, transparent, Ground Muted on hover.
- **Copy button:** inside figures, 28px, 6px radius, transparent. On the code panel it brightens to white-on-7%-white, in the prompt figure it takes link blue, and `is-done` turns it green (#4ade80).

### Code figure
Dark slate panel, 10px radius, 1px slate border. A 40px caption bar holds a 12.5px label on the left and the copy button on the right. Body is mono 13.5px/1.7 with Shiki tokens (blue and teal accents), horizontally scrollable, and wraps in the endpoint rail and on mobile.

### Prompt figure ("Cole na sua IA")
Blue Wash with Blue Line border, 10px radius. The caption carries a sparkle icon, a 12.5px 600 blue label and the copy button. The body is the prompt in 15px Inter, not mono, so it reads as a sentence to the human who is approving it.

### Callouts
10px radius, icon at left (18px, accent-colored), 15px text, optional 600 title. Note uses Ground Subtle, warn uses Caution wash, and AI uses Blue Wash. The kind is inferred at build time.

### Navigation
Sticky topbar with the official Holdprint logo (SVG from Marketing: navy wordmark `#0f182c` on light, `#efefef` wordmark on dark, both with the teal-to-blue gradient spark `#1ab394`→`#1aa4e8`; swapped per theme, never recolored by filter), a divider and a "Docs" label, a 300px search trigger with a kbd hint that opens the Cmd+K dialog, top tabs (current = 2px accent inset underline) and a theme toggle. The sidebar has collapsible groups (chevron rotates 90 degrees); items are 14px, the current page is Blue Wash with 600 link blue, and the foot holds quiet links. The right rail TOC uses a left hairline; the active entry gets a blue left border and 500 weight.

### Endpoint block
Method badge (mono 12px/600, semantic pair) plus the mono path at 1.1875rem, on top of a two-column grid with a sticky code tab panel on wide screens. Parameters use a `dl` of two-column rows (term 8 to 12rem) with hairline separators. Definition blocks for MCP tools use a top hairline, a mono name and pill badges.

### Tables, steps, tabs, pager
Tables are wrapped in a 10px bordered container with scroll shadows, a Ground Subtle header at 13px/600 and tabular numerals. Steps use 28px numbered circles joined by a 1px line. Tabs use 40px text buttons with the accent inset underline. The pager is two 10px bordered cards (muted label above a 600 title) whose border turns Blue Line on hover.

### Plugin map (signature)
"Onde o plugin aparece": a pill picker (selected = Ink fill) above a container-query-scaled replica of the Holdprint screen (`.hp`, 12px radius, its own light and dark variables). Choosing a surface switches the replica's view (page, job, jobs, customer, overview, logs), slides a blue ring over the target and swaps the manifest snippet in the code panel below with a 160ms fade. The replica uses its own scale in `em` units sized by container width.

### Pending chip
Mono, amber wash, dashed amber border, 4px radius, help cursor, no wrapping. Inside code it drops the box and keeps a dashed underline.

## Do's and Don'ts

### Do:
- **Do** pair every concept with a copy-ready action: a code figure, a prompt figure or both, each with a copy button.
- **Do** use only the tokens above. Blue (#2563eb) is the sole accent, and slate carries everything else.
- **Do** set literals (paths, flags, scopes, field names) in JetBrains Mono, and everything else in Inter at 400 to 720.
- **Do** build structure with 1px hairlines and Ground/Subtle/Muted steps; separate sections with a top hairline.
- **Do** keep code panels dark slate in both themes and make light and dark equally finished.
- **Do** render undecided production URLs as amber dashed pending chips.
- **Do** use the 120ms transition with the `cubic-bezier(.2,.8,.2,1)` ease, and honor `prefers-reduced-motion`.
- **Do** keep keyboard focus visible (2px accent outline, 2px offset).

### Don't:
- **Don't** put a marketing hero, gradient headline or fake chat demo on the docs home.
- **Don't** put one endless scrolling page in place of addressable per-topic pages.
- **Don't** use gradients, glass or blur, or shadows on page content; shadow belongs to floating overlays only.
- **Don't** add a second accent hue or decorative color; semantic hues (method, caution, pending) keep their meanings.
- **Don't** theme the code panel to light.
- **Don't** use uppercase or letter-spaced micro-labels above headings; section labels are plain sentence-case text.
- **Don't** use emoji or glyph icons; icons are the inline 18px stroke SVG set (1.75 stroke, round caps).
- **Don't** invent hosts, ports, accounts or keys in examples; use a placeholder chip.
