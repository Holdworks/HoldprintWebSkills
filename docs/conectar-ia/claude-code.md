# Instalar no Claude Code

Terminal, um comando. Ideal para quem já usa Claude Code no editor.

1.  **Adicione o servidor MCP**
    
    ```bash
    claude mcp add --transport http holdprint https://mcp.holdprint.net/mcp
    ```
    
2.  **Faça login**
    
    Na primeira chamada, o Claude abre o navegador na tela de login da Holdprint. Entre com o seu e-mail e senha do ERP — nenhum token é colado.
    
    _Tela de exemplo (mcp.holdprint.net/authorize):_
    
3.  **Verifique**
    
    ```bash
    claude mcp list
    # holdprint ✓ conectado
    ```

---
Fonte: https://docs.holdworks.ai/conectar-ia/claude-code/
