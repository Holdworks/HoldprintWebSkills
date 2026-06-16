#!/usr/bin/env node
/**
 * @holdprint/skills — CLI de instalação das skills oficiais da Holdprint.
 *
 * Uso:
 *   npx @holdprint/skills install            # instala nos harnesses detectados
 *   npx @holdprint/skills update             # idem (sobrescreve com a versão atual)
 *   npx @holdprint/skills check              # mostra o que está instalado vs disponível
 *   npx @holdprint/skills mcp                # como conectar ao MCP hospedado
 *
 * Opções:
 *   --harness=claude,codex,cursor,gemini,copilot   alvos explícitos
 *   --project                                       instala no projeto atual (./) em vez de global (~)
 *   --version / -v
 */
import { homedir } from "node:os";
import { resolveTargets, providersFromNames, providerLabel } from "../lib/harnesses.mjs";
import { installSkills, installedReport, listBundledSkills, packageVersion } from "../lib/installer.mjs";
import { printMcpInstructions } from "../lib/mcp.mjs";

const argv = process.argv.slice(2);
const command = argv[0];

function parseFlags(args) {
  const flags = { project: false, providers: null };
  for (const a of args) {
    if (a === "--project") flags.project = true;
    else if (a === "--global") flags.project = false;
    else if (a.startsWith("--harness=") || a.startsWith("--providers=")) {
      const value = a.split("=")[1] || "";
      flags.providers = providersFromNames(value.split(","));
    }
  }
  return flags;
}

function printHelp() {
  console.log(`@holdprint/skills v${packageVersion()}

Skills oficiais da Holdprint para LLMs (Claude Code, Codex, Cursor, Gemini, Copilot).
Skills incluídas: ${listBundledSkills().join(", ") || "(nenhuma)"}.

Comandos:
  install            Instala as skills nos harnesses detectados (~)
  update             Reinstala/atualiza para a versão atual
  check              Lista o que está instalado e se há atualização
  mcp                Mostra como conectar ao MCP hospedado da Holdprint
  help               Esta ajuda

Opções:
  --harness=a,b      Alvos explícitos (claude, codex, cursor, gemini, copilot)
  --project          Instala no diretório do projeto atual (./) em vez de global (~)
  --version, -v      Versão

Exemplos:
  npx @holdprint/skills install
  npx @holdprint/skills install --harness=claude,codex
  npx @holdprint/skills install --project
  npx @holdprint/skills mcp
`);
}

function runInstall(args) {
  const flags = parseFlags(args);
  const { root, providers, reason } = resolveTargets(flags);

  if (!providers.length) {
    console.error("Nenhum harness alvo. Use --harness=claude,codex ou instale um harness primeiro.");
    process.exitCode = 1;
    return;
  }

  console.log(`Instalando @holdprint/skills v${packageVersion()}`);
  console.log(`Destino: ${flags.project ? "projeto (" + root + ")" : "global (" + root + ")"} — ${reason}`);
  console.log(`Harnesses: ${providers.map(providerLabel).join(", ")}\n`);

  const { results } = installSkills({ root, providers });
  for (const r of results) {
    console.log(`  ✓ ${r.skill} → ${r.dest}  [${r.action}]`);
  }
  console.log(`\nPronto. ${results.length} skill(s) gravada(s). Reinicie o harness se ele já estiver aberto.`);
  console.log("Conecte também ao MCP:  npx @holdprint/skills mcp");
}

function runCheck() {
  const version = packageVersion();
  const rows = installedReport({ root: homedir() });
  const projectRows = installedReport({ root: process.cwd() });

  console.log(`@holdprint/skills disponível: v${version}\n`);
  const all = [
    ...rows.map((r) => ({ ...r, scope: "global" })),
    ...projectRows.map((r) => ({ ...r, scope: "projeto" })),
  ];
  if (!all.length) {
    console.log("Nada instalado ainda. Rode: npx @holdprint/skills install");
    return;
  }
  for (const r of all) {
    const status = r.version === version ? "atualizada" : `desatualizada (instalada: ${r.version})`;
    console.log(`  ${r.scope.padEnd(7)} ${providerLabel(r.provider).padEnd(16)} ${r.skill.padEnd(18)} ${status}`);
  }
  const stale = all.some((r) => r.version !== version);
  if (stale) console.log("\nHá skills desatualizadas. Rode: npx @holdprint/skills update");
}

switch (command) {
  case "install":
  case "update":
    runInstall(argv.slice(1));
    break;
  case "check":
    runCheck();
    break;
  case "mcp":
    printMcpInstructions();
    break;
  case "-v":
  case "--version":
    console.log(packageVersion());
    break;
  case undefined:
  case "help":
  case "--help":
  case "-h":
    printHelp();
    break;
  default:
    console.error(`Comando desconhecido: ${command}\n`);
    printHelp();
    process.exitCode = 1;
}
