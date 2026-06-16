# @holdprint/skills

Skills oficiais da **Holdprint** para agentes de IA (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot).

Elas ensinam a LLM a usar o ERP Holdprint de duas formas:

- **`holdprint-mcp`** — via o **MCP hospedado** da Holdprint (OAuth). A LLM usa tools `holdprint_*` em linguagem simples; o servidor cuida de filtros, enums e soft-delete.
- **`holdprint-mongo`** — para quem recebeu uma **connection string read-only** do MongoDB de produção. Ensina o schema real (orçamento/custeio, blocos, campos dinâmicos, FieldResolver) para a LLM montar queries corretas.

## Instalação

```bash
npx @holdprint/skills install
```

Detecta os harnesses instalados (`~/.claude`, `~/.codex`, `~/.cursor`, `~/.gemini`, `~/.github`) e copia as skills para o diretório de cada um. Reinicie o harness depois.

```bash
npx @holdprint/skills install --harness=claude,codex   # alvos específicos
npx @holdprint/skills install --project                # instala em ./ (projeto atual)
npx @holdprint/skills check                            # o que está instalado vs disponível
npx @holdprint/skills update                           # atualizar
```

## Conectar ao MCP

```bash
npx @holdprint/skills mcp
```

Mostra o passo-a-passo para conectar ao MCP hospedado (você loga com seu e-mail/senha do ERP via OAuth — sem colar token).

## O que cada skill cobre

| Skill | Público | Conteúdo |
|---|---|---|
| `holdprint-mcp` | Clientes que usam o MCP | As 10 tools `holdprint_*`, fluxo `discover → describe → query/aggregate`, ações com dry-run |
| `holdprint-mongo` | Clientes com string read-only | Collections, soft-delete, Budget↔CostMemento, Block/BlockContent, `custom_fields`/`fields_values`, FieldResolver |

## Licença

MIT.
