/**
 * Copia as skills empacotadas para os diretórios de cada harness. Idempotente:
 * `install` sempre sobrescreve para garantir a versão mais recente.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVIDER_DIRS } from "./harnesses.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const VERSION_FILE = ".holdprint-skills-version";

export function packageVersion() {
  try {
    return JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")).version;
  } catch {
    return "0.0.0";
  }
}

export function bundledSkillsDir() {
  return join(PKG_ROOT, "skills");
}

/** Nomes das skills empacotadas (pastas com SKILL.md). */
export function listBundledSkills() {
  const dir = bundledSkillsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => existsSync(join(dir, name, "SKILL.md")))
    .sort();
}

/** Instala (copia) todas as skills nos providers informados, sob `root`. */
export function installSkills({ root, providers }) {
  const version = packageVersion();
  const skills = listBundledSkills();
  const results = [];

  for (const provider of providers) {
    const skillsRoot = join(root, provider, "skills");
    mkdirSync(skillsRoot, { recursive: true });

    for (const skill of skills) {
      const src = join(bundledSkillsDir(), skill);
      const dest = join(skillsRoot, skill);
      const existed = existsSync(dest);

      rmSync(dest, { recursive: true, force: true });
      cpSync(src, dest, { recursive: true });
      writeFileSync(join(dest, VERSION_FILE), `${version}\n`);

      results.push({ provider, skill, dest, action: existed ? "atualizada" : "instalada" });
    }
  }

  return { version, skills, results };
}

/** Lista o que está instalado (varrendo todos os providers conhecidos) sob `root`. */
export function installedReport({ root }) {
  const rows = [];
  const skills = listBundledSkills();

  for (const provider of PROVIDER_DIRS) {
    const skillsRoot = join(root, provider, "skills");
    for (const skill of skills) {
      const dest = join(skillsRoot, skill);
      if (!existsSync(dest)) continue;
      let installedVersion = "desconhecida";
      try {
        installedVersion = readFileSync(join(dest, VERSION_FILE), "utf8").trim();
      } catch {
        /* sem marker de versão */
      }
      rows.push({ provider, skill, version: installedVersion });
    }
  }

  return rows;
}
