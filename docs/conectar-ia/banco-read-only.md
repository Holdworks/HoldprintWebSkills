# Banco read-only (avançado)

Para quem precisa de queries diretas no MongoDB. A connection string é liberada manualmente pela equipe — não é gerada sozinha.

1.  **Solicite o acesso**
    
    Fale com o suporte Holdprint para receber uma string de conexão somente-leitura ao seu banco de produção.
    
2.  **Use a skill holdprint-mongo**
    
    Ela ensina a LLM a navegar o schema (orçamento ↔ custeio, campos dinâmicos, blocos) e a montar queries corretas.
    

> **Regras de ouro**
> 
> É somente leitura — nunca escreva. Filtre sempre `deleted: false` (a exclusão é lógica). Nunca compartilhe a string: ela dá acesso aos seus dados.

---
Fonte: https://docs.holdworks.ai/conectar-ia/banco-read-only/
