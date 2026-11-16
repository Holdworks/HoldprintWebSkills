# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary reader: the customer's LLM** (Claude Code, Codex, Cursor, claude.ai, ChatGPT) that reads docs.holdworks.ai to connect to the Holdprint ERP, call the public API, and create, test and publish plugins. It needs complete, unambiguous, copy-ready reference and machine-readable entry points (`llms.txt`).
- **The human beside it:** the print shop's admin, an in-house developer, or a "vibe coder" (possibly on a trial account) who pastes prompts, approves consent screens and decides when to publish.

## Product Purpose
docs.holdworks.ai is the public documentation for everything a Holdprint customer can build on top of the ERP: the MCP server, the official skills, the REST API (`api.holdworks.ai/api-key/...`) and, new with WEB-1585, the plugin platform (CLI `holdprint`, SDK, manifest, `/v1` API, scopes, publication). Success: a customer's LLM goes from zero to a working plugin inside Holdprint without a human reading code.

## Positioning
The docs are written for an AI to execute, with the human approving. Every capability ships with a prompt the customer can paste, and the full content is also served as plain text for LLM ingestion.

## Operating Context
- Customers open Holdprint (ERP for print shops) in the browser; plugins appear in sidebar menu groups, action buttons (detail and batch) on live screens, "Novo registro" modals, tabs on budget and customer, and cards on the Overview.
- Flow: install skills → log in with the CLI → ask the LLM → dev mode/simulator → deploy → consent → use in the account → optional unlisted link, marketplace listing, or publication request reviewed by Holdprint.

## Capabilities and Constraints
- Static site (HTML/CSS/vanilla JS) in `docs/`, deployed on Vercel as docs.holdworks.ai. Existing stack is kept.
- Language: Portuguese (pt-BR) only.
- **Publication hold:** the plugin section is prepared and validated locally but NOT published until the plugin platform is deployed to production (CLI on npm, production cloud). Decision by Rafael, 2026-11-13.
- Never publish internal hosts, local ports, test accounts, test workers, keys or passwords.

## Brand Commitments
- Official Holdprint logo (Marketing SVG, variants 01 for light and 02 for dark grounds, with the gradient spark) in `docs-src/assets/logo-holdprint*.svg`; the spark also serves as favicon; existing docs visual system (Inter + JetBrains Mono, Holdprint blue, light and dark themes) is the incumbent identity.

## Evidence on Hand
- Existing docs content in `docs/index.html` (MCP, skills, REST API).
- Plugin reference content drafted from code in the task folder (`.claude/tarefas/WEB1585-Plataforma-Plugins/docs-publica/conteudo/`).
- No customer testimonials, metrics or third-party plugins exist yet; do not fabricate them.

## Product Principles
1. Executable over descriptive: every page answers "what do I paste/run next".
2. Verified against code: no invented command, field, route or scope.
3. Human stays in control: consent, publication and writes are explicit human steps.
4. One source, two readers: the same content renders for people and as plain text for LLMs.
