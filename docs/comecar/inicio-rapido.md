# Início rápido

Dois passos: ensine a LLM a falar “Holdprint” (skills) e conecte ela aos seus dados (MCP).

1.  **Instale as skills**
    
    Um comando ensina sua LLM o domínio do ERP (orçamento, custeio, campos dinâmicos).
    
    ```bash
    npx @holdprint/skills install
    ```
    
2.  **Conecte ao MCP**
    
    No Claude Code, um comando. No claude.ai/ChatGPT, um conector. O login abre no navegador.
    
    ```bash
    claude mcp add --transport http holdprint https://mcp.holdprint.net/mcp
    ```
    
3.  **Pergunte**
    
    Pronto. Fale em português com a IA.
    
    ```
    Quanto eu faturei este ano e qual meu saldo em caixa?
    ```

---
Fonte: https://docs.holdworks.ai/comecar/inicio-rapido/
