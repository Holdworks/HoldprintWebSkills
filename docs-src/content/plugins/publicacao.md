# Publicação, versões e Marketplace

Um plugin pode ficar em três alcances. Cada um tem o seu passo, e nenhum pula a aprovação de um Administrador da conta que instala.

| Alcance | Comando | Quem aprova |
|---|---|---|
| **Só a sua conta** | `holdprint plugin deploy` | Um Administrador da sua conta (consentimento). |
| **Contas que receberem um link** (não listado) | `holdprint plugin publish --unlisted` | O Administrador de cada conta que instala. |
| **Todas as gráficas** (Marketplace, seção Da comunidade) | `holdprint plugin submit` | A Hold analisa o pedido; depois, o Administrador de cada conta que instala. |

## 1. Privado na sua conta

```bash
holdprint plugin validate
holdprint plugin deploy
```

1. O `deploy` publica a versão `v1` e instala na sua conta.
2. O plugin fica **aguardando consentimento** e não aparece para ninguém. A CLI imprime:
   `==> Aguardando aprovação de um Administrador: {APP_URL}/plugins/consent/<installationId>`
3. Um Administrador abre o link e vê:
   - cada permissão com o motivo (`purpose`);
   - **onde o plugin aparece** (páginas com o grupo do menu, ações com a tela, abas, cards);
   - o que **roda sozinho** (agendas com a frequência), com quais sites **fala** (`network.domains`), de onde **recebe chamadas** (hooks), para onde **envia avisos** (webhook) e os apps externos;
   - "Hospedado pela Hold" quando há funções.
4. Ele marca os **perfis** que podem usar (Administrador sempre pode), digita a senha de novo e clica em **Aprovar e instalar**. O plugin aparece na hora e os administradores recebem um e-mail.

Quem usa: Administrador sempre; os outros perfis só se marcados na aprovação (ou depois, em **Plugins > ⋯ > Perfis**) e se o perfil tiver **Plugins: Usar** em Ajustes > Perfis.

Na tela **Plugins** o Administrador também: liga e desliga, desinstala, troca perfis, grava **Segredos**, vê **Chamadas e cotas** (com **Automações**, **Executar agora** e **Avisos enviados**), **Registros** das funções e **Acessos conectados**. Quem tem **Plugins: Gerenciar** liga e desliga.

## 2. Versões, prévia, liberação e rollback

- Cada `deploy` cria uma versão nova e **imutável** (`v1`, `v2`, `v3`...). Para corrigir, publique outra.
- A primeira versão é liberada direto. **Da segunda em diante, o `deploy` publica como prévia**:
  `Prévia: {APP_URL}/plugins/<installationId>?versao=v3`
  Só Administradores abrem a prévia; a janela mostra "Prévia v3 · só administradores veem · a equipe vê v2". A equipe continua na versão liberada.
- `holdprint plugin release [vN]` libera para a equipe (sem argumento, a prévia mais nova). Vale na próxima abertura.
- `holdprint plugin rollback [vN]` volta (sem argumento, à liberada anterior).
- `holdprint plugin deploy --release` publica e libera de uma vez.
- A hospedagem pode levar cerca de 60 s para refletir deploy, release, rollback, desligar ou reinstalar.
- Antes de publicar, use o **modo desenvolvedor** (`holdprint plugin dev --account`) para ver a pasta local dentro do Holdprint, só leitura e só na sua janela.

### Atualizar um plugin já instalado

| Mudança | O que acontece |
|---|---|
| Código, textos, páginas, ações, abas, cards, `listing` | Nova versão em prévia; `release` quando estiver bom. Sem nova aprovação. |
| Escopo novo, agenda nova, hook novo, domínio novo, host de webhook novo, app externo ou origem nova | A CLI imprime de novo o link `/plugins/consent/<id>` e a tela Plugins mostra "Pede novas permissões", com o item novo marcado como **Novo**. Até um Administrador aprovar, o plugin segue com as permissões antigas. |

Nas outras contas que instalaram (por link ou Marketplace), a versão nova vale para todas; escopo novo deixa cada conta nas permissões antigas até o Administrador dela aprovar.

## 3. Vitrine (`listing`)

A página de apresentação do plugin (no Marketplace e no link) é gerada a partir do bloco `listing` do manifesto:

```json
"listing": {
  "summary": "Orçamentos abertos por vendedor, atualizados sozinhos",
  "category": "vendas",
  "highlights": ["Atualiza sozinho", "Cria tarefa de follow-up"],
  "support": "suporte@grafica.com.br"
}
```

`summary` (até 140 caracteres) e `category` (`vendas`, `producao`, `financeiro`, `estoque`, `relatorios`, `integracoes`, `automacao`, `outros`) são obrigatórios; até 5 `highlights` de 80 caracteres; `support` é e-mail ou `https://`. Texto puro, sem promessas. O ícone vem da primeira página do plugin. Mudar o `listing` não pede nova aprovação.

## 4. Link não listado (outra gráfica)

```bash
holdprint plugin publish --unlisted [--max-accounts 10] [--expires 30d]
```

1. Faça o `deploy` e, se o plugin é novo, espere a aprovação na sua conta.
2. A CLI imprime o link **uma única vez**: `{APP_URL}/plugins/install/<pluginId>.<token>`. Guarde ou envie na hora; se perder, revogue e gere outro.
3. `--max-accounts` de 1 a 10 (padrão 10); `--expires` de `1d` a `90d` (padrão `30d`). A sua conta não conta no teto; desinstalar libera a vaga.
4. Quem abre o link vê a página do plugin com a faixa "Publicado por outra conta: <nome da sua conta>", a validade e quantas contas já instalaram. Só o **Administrador** da outra conta instala, e o consentimento é dele.
5. `holdprint plugin links` lista os links e as contas que instalaram (nunca reexibe o endereço). `holdprint plugin links --revoke <linkId>` revoga: o link passa a dar "Link inválido" e quem já instalou continua.

Regras:
- **Plugin com `secrets` não vai para outra conta.** Projete sem segredo (tela, ações, agendas e eventos). Integração com chave própria ainda não funciona entre contas.
- **Cada conta tem os próprios dados.** Storage, agendas, hooks, registros e a API valem por instalação: a outra gráfica vê os orçamentos dela, nunca os seus, e cada conta só lê os registros das próprias instalações.

## 5. Marketplace

O item **Marketplace** do menu Plugins (para Administrador ou quem tem Plugins: Gerenciar) tem quatro seções:

| Seção | O que mostra |
|---|---|
| **Da sua conta** | Plugins publicados pela sua conta, instalados ou não (serve para reinstalar). |
| **Da comunidade** | Plugins de outras contas que a Hold aprovou para todas as gráficas. |
| **Recebidos por link** | Plugins que a sua conta instalou por link. |
| **Destaques da Hold** | Plugins publicados pela Hold. |

Instalar pela vitrine leva ao mesmo consentimento de sempre. A tela Plugins mostra a coluna **Origem** (Da sua conta, Marketplace ou Link).

## 6. Pedido de publicação para todas as gráficas

Diferente de instalar na sua conta e do link: aqui a **Hold analisa** e, se aprovar, o plugin aparece em **Da comunidade** no Marketplace de todas as contas.

Antes de pedir, confira:
- bloco `listing` com `summary` e `category`;
- **nenhum** `secrets` no manifesto;
- uma **versão liberada** (`holdprint plugin release` ou `deploy --release`);
- login de **Administrador** da conta (`holdprint whoami` mostra o perfil).

```bash
holdprint plugin submit --note "Mostra os orçamentos abertos por vendedor e cria follow-up"
```

```text
Pedido de publicação enviado (v3). A Hold vai analisar; acompanhe com holdprint plugin submission.
```

Acompanhar:

```bash
holdprint plugin submission
# Status: Em análise pela Hold | No Marketplace | Recusado: <motivo> | Sem pedido
```

O andamento também aparece na coluna `publicacao` de `holdprint plugin list` e como selo na tela Plugins ("Em análise pela Hold", "No Marketplace", "Recusado" com o motivo). Na tela Plugins, o menu ⋯ tem "Pedir publicação no Marketplace" e "Retirar do Marketplace".

- **Pedido repetido** enquanto está em análise devolve o mesmo pedido.
- **Recusado:** a Hold sempre informa o motivo. Corrija o que ele pede (resumo da vitrine, segredo, versão, comportamento), libere uma versão nova e rode `holdprint plugin submit` de novo; o pedido volta para análise com a versão liberada atual.
- **Retirar:** `holdprint plugin submit --withdraw` tira o pedido da fila ou o plugin do Marketplace. Quem já instalou continua com o plugin. Plugin retirado, recusado ou bloqueado some da seção em até 1 minuto.
- **Bloqueio:** a Hold pode bloquear um plugin ou os plugins de uma conta. Não tente contornar (republicar com outro slug, religar, reinstalar); veja o motivo em `holdprint plugin list` e fale com o suporte da Hold.

Erros do pedido: `403 _97` (quem pediu não é Administrador), `409 _98` (bloqueado pela Hold), `409 _99` (tem segredo), `400 _100` (falta `listing`), `409 _101` (sem versão liberada), `404 _102` (não há pedido). Ver [Erros](09-erros.md).

## 7. Instalação pelo cliente

Para quem recebe um plugin (pelo Marketplace ou por link):

1. Entre como **Administrador** e abra o plugin no **Marketplace** (ou o link recebido).
2. Leia a página: o que faz, quem publicou ("Publicado por outra conta: <nome>"), o que acessa.
3. Clique para instalar. A tela de consentimento mostra permissões, lugares onde aparece, o que roda sozinho e com quem fala.
4. Marque os perfis que podem usar, digite a senha e clique em **Aprovar e instalar**.
5. Quando o autor publicar uma versão que pede permissão nova, a tela Plugins mostra "Pede novas permissões"; o plugin segue funcionando com as antigas até você aprovar.

Sessões personificadas pelo suporte e a sandbox não instalam nem aprovam plugins.
