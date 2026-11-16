import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const source = fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');

const routes = {
  overview: 'conectar-ia/index',
  quickstart: 'comecar/inicio-rapido',
  'install-cc': 'conectar-ia/claude-code',
  'install-web': 'conectar-ia/claude-ai-e-chatgpt',
  skills: 'conectar-ia/skills',
  usar: 'conectar-ia/como-usar',
  tools: 'conectar-ia/tools-do-mcp',
  domain: 'conectar-ia/dominio',
  mongo: 'conectar-ia/banco-read-only',
  'api-overview': 'api/index',
  'api-customers': 'api/clientes',
  'api-suppliers': 'api/fornecedores',
  'api-budgets': 'api/orcamentos',
  'api-jobs': 'api/jobs',
  'api-expenses': 'api/contas-a-pagar',
  'api-incomes': 'api/contas-a-receber',
  'api-financial-lookups': 'api/cadastros-financeiros',
  faq: 'comecar/perguntas-frequentes',
};

const sectionPattern = /<section class="doc" id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
let match;
while ((match = sectionPattern.exec(source))) {
  const [, id, body] = match;
  const dest = path.join(root, 'docs-src', 'content', `${routes[id]}.html`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, `<!-- legacy-id: ${id} -->\n${body.trim()}\n`);
  console.log(id, '->', path.relative(root, dest));
}
