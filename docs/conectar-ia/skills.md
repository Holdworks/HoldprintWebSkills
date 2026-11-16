# Instalar as skills

As skills ensinam a LLM a entender o domínio do Holdprint: onde fica o custo (CostMemento), como resolver campos dinâmicos, blocos e medidas. Sem elas, a IA chuta.

1.  **Instale com um comando**
    
    Detecta os harnesses instalados (Claude Code, Codex, Cursor, Gemini CLI, Copilot) e copia as skills para cada um.
    
    ```bash
    npx @holdprint/skills install
    ```
    
2.  **Alvos específicos & manutenção**
    
    ```bash
    npx @holdprint/skills install --harness=claude,codex
    npx @holdprint/skills check
    npx @holdprint/skills update
    ```
    

## O que vem instalado

`holdprint-mcp`Operar o ERP pelo MCP (as 28 tools).

`holdprint-mongo`Ler o ERP por conexão MongoDB read-only.

> **Reinicie o harness**
> 
> Depois de instalar, reinicie a ferramenta (ou abra uma nova sessão) para ela carregar as skills.

---
Fonte: https://docs.holdworks.ai/conectar-ia/skills/
