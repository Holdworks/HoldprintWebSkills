# Perguntas frequentes

Preciso saber programar?

Não. Você conversa em português com a LLM; ela usa as tools do MCP (ou o banco read-only) para responder, gerar relatórios e montar integrações.

Qual a diferença entre MCP e banco read-only?

O MCP é o caminho recomendado: simples e seguro, com login por OAuth e tools prontas. O banco read-only é para casos avançados que precisam de queries diretas no MongoDB.

É seguro? A IA pode alterar meus dados?

Pelo MCP, ações que alteram dados rodam primeiro em prévia (dry-run) e exigem confirmação. O acesso ao banco é somente leitura. Você continua no controle.

As skills funcionam em quais ferramentas?

Claude Code, Codex, Cursor, Gemini CLI e GitHub Copilot. O comando `npx @holdprint/skills install` detecta o que você tem instalado.

Meus dados ficam expostos publicamente?

Não. O acesso é por conta: o login OAuth identifica você e a IA só enxerga os dados da sua empresa. As credenciais não são compartilhadas com o aplicativo de IA.

---
Fonte: https://docs.holdworks.ai/comecar/perguntas-frequentes/
