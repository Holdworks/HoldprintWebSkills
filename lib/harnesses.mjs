/**
 * Mapa de harnesses (Claude Code, Codex, Cursor, Gemini, Copilot) → diretório de skills.
 *
 * O padrão Agent Skills é o mesmo em todos os harnesses (uma pasta por skill com SKILL.md),
 * mas cada harness lê de um diretório diferente. Esse mapa segue a convenção usada por
 * ferramentas cross-harness (ex.: impeccable, `npx skills add`):
 *   - Claude Code lê de  <root>/.claude/skills
 *   - Codex lê de        <root>/.agents/skills   (home do Codex é ~/.codex, mas as skills vivem em .agents)
 *   - Cursor lê de       <root>/.cursor/skills
 *   - Gemini CLI lê de   <root>/.gemini/skills
 *   - GitHub Copilot lê  <root>/.github/skills
 *
 * <root> = home do usuário (instalação global, default) ou o diretório do projeto (--project).
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** harness "home" (como detectamos que está instalado) → "provider" (onde as skills vivem). */
export const HARNESSES = [
  { id: "claude", label: "Claude Code", home: ".claude", provider: ".claude" },
  { id: "codex", label: "Codex", home: ".codex", provider: ".agents" },
  { id: "cursor", label: "Cursor", home: ".cursor", provider: ".cursor" },
  { id: "gemini", label: "Gemini CLI", home: ".gemini", provider: ".gemini" },
  { id: "copilot", label: "GitHub Copilot", home: ".github", provider: ".github" },
];

/** Todos os diretórios de provider possíveis (para varrer instalações já existentes). */
export const PROVIDER_DIRS = [".claude", ".agents", ".cursor", ".gemini", ".github"];

/** Default quando nada é detectado: Claude Code + Codex (cobrem a maioria). */
export const DEFAULT_PROVIDERS = [".claude", ".agents"];

/** Rótulo amigável de um provider dir. */
export function providerLabel(provider) {
  const hit = HARNESSES.find((h) => h.provider === provider);
  return hit ? hit.label : provider;
}

/** Mapeia uma lista de ids/aliases de harness para provider dirs. Ex.: "codex" → ".agents". */
export function providersFromNames(names) {
  const out = [];
  for (const raw of names) {
    const name = String(raw).trim().toLowerCase();
    if (!name) continue;
    if (name.startsWith(".")) {
      out.push(name);
      continue;
    }
    const hit = HARNESSES.find((h) => h.id === name || h.label.toLowerCase() === name);
    if (hit) out.push(hit.provider);
  }
  return [...new Set(out)];
}

/** Providers cujo harness está instalado no home do usuário (ex.: ~/.claude existe). */
export function detectInstalledProviders(root = homedir()) {
  const out = [];
  for (const h of HARNESSES) {
    if (existsSync(join(root, h.home))) out.push(h.provider);
  }
  return [...new Set(out)];
}

/** Providers que já têm uma pasta skills/ (com conteúdo) sob um root. */
export function detectProvidersWithSkills(root) {
  const out = [];
  for (const provider of PROVIDER_DIRS) {
    const skillsDir = join(root, provider, "skills");
    if (!existsSync(skillsDir)) continue;
    try {
      if (readdirSync(skillsDir).length > 0) out.push(provider);
    } catch {
      /* ignore */
    }
  }
  return [...new Set(out)];
}

/**
 * Resolve a lista final de provider dirs e o root onde instalar.
 * Prioridade: --providers explícito → --project (cwd) → harness detectado em ~ → default.
 */
export function resolveTargets({ providers, project } = {}) {
  const root = project ? process.cwd() : homedir();

  if (providers && providers.length) {
    return { root, providers: [...new Set(providers)], reason: "explícito (--harness/--providers)" };
  }

  if (project) {
    const withSkills = detectProvidersWithSkills(root);
    if (withSkills.length) return { root, providers: withSkills, reason: "projeto (pastas skills/ existentes)" };
    return { root, providers: DEFAULT_PROVIDERS, reason: "projeto (default)" };
  }

  const installed = detectInstalledProviders(root);
  if (installed.length) return { root, providers: installed, reason: "harnesses detectados no seu usuário" };

  return { root, providers: DEFAULT_PROVIDERS, reason: "default (.claude + .agents)" };
}
