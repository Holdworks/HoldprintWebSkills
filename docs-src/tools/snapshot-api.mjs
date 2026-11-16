import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const argIndex = process.argv.indexOf('--webapi');
const webapi = argIndex > -1 ? process.argv[argIndex + 1] : process.env.HOLDPRINT_WEBAPI_DIR;
if (!webapi) {
  console.error('Uso: node tools/snapshot-api.mjs --webapi <caminho do repositório HoldprintWebApi>');
  process.exit(1);
}

const resources = path.join(webapi, 'HoldprintNetApi', 'Resources');
const catalog = JSON.parse(fs.readFileSync(path.join(resources, 'v1-query-catalog.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(resources, 'action-manifest.json'), 'utf8'));
let commit = 'desconhecido';
try {
  commit = execFileSync('git', ['-C', webapi, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  commit = 'desconhecido';
}

const queryResources = catalog.resources
  .filter((r) => r.enabled)
  .map((r) => ({
    resource: r.resource,
    title: r.title,
    scope: r.scope,
    fields: r.fields,
    filters: r.filters.map((f) => ({ field: f.field, ops: f.ops, requires: f.requires || [] })),
    sorts: r.sorts,
    defaultSort: r.defaultSort,
    updatedSince: Boolean(r.updatedSince),
    requiresAnyFilter: r.requiresAnyFilter || [],
    requiresAllFilters: r.requiresAllFilters || [],
    sortRequires: r.sortRequires || {},
    maxLimit: r.maxLimit,
  }));

const byIdOnly = catalog.resources.filter((r) => !r.enabled).map((r) => ({ resource: r.resource, title: r.title, scope: r.scope }));

const modules = {};
for (const [key, action] of Object.entries(manifest)) {
  if (!action.exposure.includes('cli-mcp')) continue;
  const [method, ...routeParts] = key.split(':').slice(1);
  const route = routeParts.join(':');
  const [moduleName, rest] = action.scope.split('.');
  const resource = (rest || '').split(':')[0];
  const entry = modules[moduleName] || (modules[moduleName] = { module: moduleName, total: 0, risk: { low: 0, medium: 0, high: 0 }, resources: {} });
  entry.total += 1;
  entry.risk[action.risk] = (entry.risk[action.risk] || 0) + 1;
  entry.resources[resource] = (entry.resources[resource] || 0) + 1;
}

const curated = JSON.parse(fs.readFileSync(path.join(here, '..', 'data', 'acoes-exemplos.json'), 'utf8'));
const examples = curated.map(({ key, label }) => {
  const action = manifest[key];
  if (!action || !action.exposure.includes('cli-mcp')) {
    console.error(`Exemplo inexistente ou fora da CLI: ${key}`);
    process.exitCode = 1;
    return null;
  }
  const [method, ...routeParts] = key.split(':').slice(1);
  return { key, label, method, route: `/${routeParts.join(':')}`, risk: action.risk, area: action.scope.split('.')[0] };
}).filter(Boolean);

const snapshot = {
  generatedAt: new Date().toISOString().slice(0, 10),
  sourceCommit: commit,
  query: { limits: catalog.limits, operators: catalog.operators, resources: queryResources, byIdOnly },
  actions: {
    total: Object.values(modules).reduce((sum, m) => sum + m.total, 0),
    examples,
    modules: Object.values(modules).sort((a, b) => b.total - a.total),
  },
};

const out = path.join(here, '..', 'data', 'api-snapshot.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Retrato salvo em data/api-snapshot.json: ${queryResources.length} recursos com consulta, ${byIdOnly.length} só por id, ${snapshot.actions.total} ações em ${snapshot.actions.modules.length} áreas (WebApi ${commit}).`);
