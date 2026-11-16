# Instalar no claude.ai & ChatGPT

Pelo navegador, sem instalar nada. Adicione um conector personalizado apontando para o MCP.

### claude.ai

1.  **Abra os conectores**
    
    Em claude.ai: **Configurações → Conectores → Adicionar conector personalizado**.
    
2.  **Cole o endpoint**
    
    Informe um nome e a URL do MCP. Salve.
    
    _Tela de exemplo (claude.ai/settings/connectors):_ Adicionar conector personalizado · Conecte uma ferramenta via MCP. · Nome · Holdprint ERP · URL do servidor MCP · https://mcp.holdprint.net/mcp · Adicionar
    
3.  **Faça login (OAuth)**
    
    Ao conectar, abre a tela de login da Holdprint. Entre com seu e-mail e senha do ERP e autorize. O conector fica **Conectado**.
    
4.  **Use no chat**
    
    As tools `holdprint_*` ficam disponíveis. Pergunte em português.
    

### ChatGPT

1.  **Abra os conectores**
    
    No ChatGPT (planos com conectores): **Settings → Connectors → Add custom / MCP server**.
    
2.  **Cole o endpoint**
    
    Tipo `http` (streamable), URL abaixo. Autenticação: OAuth.
    
    ```endpoint
    https://mcp.holdprint.net/mcp
    ```
    
3.  **Faça login e use**
    
    O login da Holdprint abre automaticamente. Depois é só pedir à IA.
    

> **Endpoint a confirmar**
> 
> A URL oficial de produção do MCP será confirmada na publicação. Se não responder, peça a URL atual ao suporte Holdprint.

---
Fonte: https://docs.holdworks.ai/conectar-ia/claude-ai-e-chatgpt/
