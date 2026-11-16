# Conecte a sua IA ao Holdprint

Conecte Claude, ChatGPT, Cursor, Gemini ou Copilot ao Holdprint e peça relatórios, análises e automações em português, sem depender de um programador.

## Dois jeitos de conectar

|  | MCP hospedado (recomendado) | Banco read-only |
| --- | --- | --- |
| **Como entra** | Login pelo navegador (OAuth), com o seu e-mail e senha do Holdprint | String de conexão MongoDB somente leitura, liberada pela equipe Holdprint |
| **O que a IA faz** | Usa 28 tools prontas para ler e operar o ERP; o que grava passa antes por uma prévia | Consultas diretas no banco, só leitura |
| **Para quem** | Qualquer pessoa da gráfica | Casos avançados que precisam de queries próprias |
| **Onde funciona** | Claude Code, claude.ai, ChatGPT, Cursor, Codex e outras IAs com MCP | Qualquer IA ou ferramenta que fale com MongoDB |

## Como fica no dia a dia

Depois de conectar, você conversa em português. Por exemplo:

```
Quanto faturei este mês e qual o meu saldo em caixa?
```

A IA chama a tool `holdprint_report` e responde com os números da sua conta. Veja mais exemplos em [Como usar](https://docs.holdworks.ai/conectar-ia/como-usar.md).

## Por onde começar

1.  **Instale as skills**
    
    Elas ensinam a IA as regras do Holdprint. Veja [Instalar as skills](https://docs.holdworks.ai/conectar-ia/skills.md).
    
2.  **Conecte o MCP**
    
    No terminal, pelo [Claude Code](https://docs.holdworks.ai/conectar-ia/claude-code.md); no navegador, pelo [claude.ai ou ChatGPT](https://docs.holdworks.ai/conectar-ia/claude-ai-e-chatgpt.md).
    
3.  **Pergunte**
    
    Em português, como falaria com alguém da equipe.
    

> **Quer telas e automações dentro do Holdprint?**
> 
> A mesma IA pode criar plugins: páginas no menu, botões nas telas, abas, cards e rotinas automáticas. Veja [Plugins](https://docs.holdworks.ai/plugins.md).

---
Fonte: https://docs.holdworks.ai/conectar-ia/
