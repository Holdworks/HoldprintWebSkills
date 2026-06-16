/**
 * Instruções de conexão ao MCP hospedado da Holdprint (OAuth 2.1).
 * O endpoint oficial é definido aqui em um único lugar — quando o MCP for publicado,
 * basta atualizar MCP_URL (ou exportar HOLDPRINT_MCP_URL no ambiente).
 */

/** ⚠ Endpoint a confirmar quando o MCP for publicado. Pode ser sobrescrito por env. */
export const MCP_URL = process.env.HOLDPRINT_MCP_URL || "https://mcp.holdprint.net/mcp";

export function printMcpInstructions() {
  const url = MCP_URL;
  console.log(`
Conectar ao MCP hospedado da Holdprint (OAuth — você loga com seu e-mail/senha do ERP)

  Endpoint: ${url}
  ${MCP_URL.includes("mcp.holdprint.net") ? "(⚠ endpoint oficial a confirmar — peça a URL atual ao suporte Holdprint)" : ""}

Claude Code:
  claude mcp add --transport http holdprint ${url}
  # na primeira chamada, o Claude abre o navegador para você fazer login (OAuth)

Codex / Cursor / Gemini / Copilot:
  Adicione um MCP server remoto do tipo "http" (streamable) apontando para o endpoint acima.
  A autenticação é OAuth 2.1 — o harness abre a tela de login da Holdprint automaticamente.
  Não é preciso colar token manualmente.

Depois de conectar, peça à LLM:
  "Use as tools holdprint_* para listar meus orçamentos abertos"
`);
}
