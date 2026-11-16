# Funções, agenda, segredos e hooks

Função é código do plugin que roda **na hospedagem da Hold (Cloudflare)**, sem navegador aberto: numa agenda, ao receber um
aviso do Holdprint, ao receber uma chamada de um serviço externo (hook), por "Executar agora" ou a pedido da própria tela.
Use só quando a tela sozinha não resolve (rotina automática, integração com serviço externo, segredo que não pode ir ao navegador).
Plugin que só mostra dados continua sendo HTML + SDK, sem `functions/`.

## Começar

```
holdprint plugin create <pasta> --template automacao
```

Gera `public/` (tela), `functions/index.ts` (uma agenda de exemplo) e um `.gitignore` que já ignora `.holdprint/dev-secrets.json`.
Depois: `holdprint plugin validate`, `holdprint dev` (simulador, com "Executar agenda <id>" na moldura) e `holdprint plugin deploy`.

## Manifesto

```json
{
  "functions": {
    "entry": "functions/index.ts",
    "schedules": [{ "id": "follow-up", "every": "1d", "path": "/api/agenda/follow-up",
                    "description": "Follow-up" }],
    "events": { "path": "/api/eventos" },
    "hooks": [{ "name": "cobranca", "path": "/api/hooks/cobranca" }]
  },
  "secrets": [{ "name": "CHAVE_SERVICO", "description": "Chave da API do serviço de teste" }],
  "network": { "domains": ["api.servico-externo.com.br"] }
}
```

| Campo | Regra |
|---|---|
| `functions.entry` | Obrigatório para ter agenda, `events.path` ou hooks. |
| `schedules[].every` | Só estes valores: `1m`, `15m`, `30m`, `1h`, `6h`, `12h`, `1d`. O servidor tem um mínimo: 15 min em produção (`1m` não é aceito). Fora do catálogo ou abaixo do mínimo dá `400 HOLD_PLUGIN_PLATFORM_60`. A tela de aprovação mostra `<description>, <frequência>` (ex.: "Follow-up, todo dia"). |
| `schedules[].id`, `hooks[].name` | `^[a-z0-9][a-z0-9-]{1,38}$`. Até 5 agendas e 5 hooks. |
| `path` | Começa com `/api/`. |
| `events.path` | Exige `events.subscribe` (tipos do catálogo). A função recebe um POST por evento. |
| `scopes` | `storage` **não** é escopo: o `storage` do plugin funciona sem declarar nada (declarar reprova no `validate`). |
| `secrets[].name` | `^[A-Z][A-Z0-9_]{1,63}$` (ex.: `CHAVE_SERVICO`). Até 20. Só nomes declarados aqui podem ser gravados (`400 _58`). |
| `network.domains` | Nome de site público, sem IP, curinga, porta nem sufixo interno. Até 10. Inválido dá `400 _62`. |

**Declarar de novo pede consentimento de novo.** Domínio novo, primeira agenda, agenda nova ou hook novo sobem a versão do
consentimento; remover não sobe. Depois do `deploy`, mostre ao usuário o link `/plugins/consent/<id>` e peça a aprovação de um
Administrador, como nos escopos. A tela de aprovação mostra "Hospedado pela Hold (Cloudflare)", "Roda sozinho: …", "Fala com: …" (selo
**Novo** no domínio recém-declarado) e "Recebe chamadas de: <URL do hook>".

## Escrever a função

```ts
import { createHold, HoldFunctionApiError, MissingSecretError } from "@holdprint/functions"; // resolvido pela CLI, sem npm install

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    const hold = createHold(request, env);
    // hold.trigger ("screen" | "schedule" | "event" | "hook" | "manual"), hold.user ({ id } só na tela, senão null),
    // hold.installationId, hold.invocationId, hold.api, hold.storage, hold.requireSecret, hold.verifyHmac, hold.daysAgo, hold.isoWeek
    const caminho = new URL(request.url).pathname;
    if (caminho === "/api/agenda/follow-up") return followUp(hold);
    return Response.json({ error: "not_found" }, { status: 404 });
  }
};
```

- **Fale com o Holdprint só por `hold.api.get/post/put/del("/caminho", ...)`** (vai ao host virtual `https://api.hold.invalid/v1/...`;
  a hospedagem põe o token). Nunca `fetch` para o endereço da WebApi, nunca token na mão. O plugin nunca vê credencial.
  Erro da API vira `HoldFunctionApiError` (`status`, `body`).
- **Dado do plugin entre execuções: `hold.storage`** (mesmos nomes do SDK de tela):
  `await hold.storage.get<T>(colecao, chave)` → o **valor** gravado ou `null` (chave ausente);
  `await hold.storage.set(colecao, chave, valor)` (ou `put`, sinônimo) grava o valor como está;
  `await hold.storage.list(colecao, { prefix })` → `[{ collection, key, value, sizeBytes, updatedAt }]` (segue as páginas);
  `await hold.storage.delete(colecao, chave)`.
  **Envelope:** `GET /v1/storage/{colecao}/{chave}` (e `hold.api.get("/storage/...")`) devolve o **registro**
  `{ collection, key, value, sizeBytes, updatedAt }`, não o valor, e 404 quando a chave não existe. Quem usa `hold.api` direto e trata
  o registro como valor passa na 1ª execução e quebra na 2ª (`TypeError: execucoes.unshift is not a function`). Use `hold.storage`;
  rode a agenda duas vezes para provar.
- **Quem está chamando:** chamada da **tela** usa o token do usuário (o Vendedor vê só o que já veria). Agenda, evento, hook e
  "Executar agora" **não têm usuário**: rodam como a instalação, com os escopos consentidos sobre a conta inteira (`GET /v1/me`
  mostra `principal: "installation"`). Tarefa criada assim sai "via plugin <nome>" e, sem responsável, fica com o vendedor do orçamento.
- **Chamar a função pela tela:** `await hold.functions.call("integracao/teste", { ping: 1 })` (POST em `/api/integracao/teste`;
  numa prévia, `/_v/<versão>/api/...`, que roda as funções da própria versão). Devolve o JSON da função.
- **Serviço externo:** `fetch` só para domínios de `network.domains`; qualquer outro dá `403 blocked_by_hold undeclared_domain`
  (aparece nos Registros).
- **Limites por execução:** 50 chamadas à API do Holdprint e **35 s**. Trabalho grande vira lotes: no máximo ~20 itens por execução,
  em lotes paralelos pequenos (o exemplo usa 5 por vez com `Promise.all`), e o progresso (cursor do `/v1/budgets`) no `storage`
  (`hold.storage.set("<colecao>", "<chave>", valor)`) para continuar na próxima execução.
- **Idempotência:** toda escrita com `idempotencyKey` derivada do fato, ex.: `follow-up-${orcamento.id}-${hold.isoWeek()}`
  (a chave é por plugin e dura pelo menos 24 h: repetir na mesma semana devolve a tarefa já criada, sem duplicar). A entrega pode
  ser repetida (nova tentativa) e a agenda perdida (relay parado) roda **uma vez** ao voltar, nunca em rajada.
- **Orçamentos parados:** `hold.api.get("/budgets", { state: "Open", updated_before: hold.daysAgo(7), limit: 20, cursor })`.
  Inclui orçamentos que nunca foram alterados desde a ativação da sincronização (usa a data da última alteração).
- **Laço:** evento causado pelo próprio plugin (ex.: a tarefa que a função criou) não dispara as funções dele.
- **Registros:** `console.log/info/warn/error` da função vira registro (até 50 linhas de 2 KiB por execução, guardado 7 dias), mais
  uma linha de resumo `POST /api/x -> 200 (N ms)`. Nunca imprima segredo, token nem dado pessoal desnecessário: o Holdprint troca o
  valor exato de um segredo por `***`, mas não texto derivado (ex.: base64).

## Segredos

O valor de um segredo **nunca passa pelo chat nem pelo código**.

**Regra do Claude: nunca peça o valor de um segredo ao usuário no chat, nunca o escreva em arquivo, comando, manifesto, exemplo ou
log, e nunca aceite que o usuário o cole na conversa.** Se o usuário colar um valor mesmo assim, não o repita nem o use; oriente
a gravar do jeito certo. Declare o **nome** no manifesto e diga ao usuário uma das duas formas:

1. Tela **Plugins > ⋯ > Segredos** (só Administrador): campo de senha por segredo, com "Trocar" e "Remover". Mostra "faltando" ou
   "Definido em … por …", nunca o valor.
2. No terminal do usuário, para ele mesmo digitar sem eco:
   `! holdprint plugin secrets set NOME` (a CLI pede o valor sem mostrar; também aceita `--from-env VAR` ou `--stdin`; nunca aceita o
   valor como argumento). `holdprint plugin secrets list` mostra nomes e situação; `holdprint plugin secrets delete NOME` remove.

Lugar de cada coisa: a Hold guarda o segredo cifrado e o aplica na hospedagem; a função lê com `hold.requireSecret("NOME")`
(se faltar, lança `MissingSecretError` com a instrução de como gravar). Trocar o valor vale na próxima chamada, sem novo deploy.
A CLI acha a instalação pelo `.holdprint/deploy.json` da pasta, ou por `--installation <id>`. Em desenvolvimento local os valores
ficam em `.holdprint/dev-secrets.json` (já no `.gitignore`; nunca versionar). Segredo faltando: a função chama `hold.requireSecret` e
falha com mensagem clara; avise o usuário de qual nome falta e como gravar.

## Hooks de terceiros (receber chamada de fora)

Um serviço externo (cobrança, formulário) pode chamar o plugin em `POST https://hooks.<domínio da Hold>/<installationId>/<nome>`
(a URL exata aparece na tela de aprovação). O porteiro
aceita só POST de até 256 KiB (acima disso, 413), descarta cookies e cabeçalhos internos, guarda a chamada e responde `202 {id}`.
Hook não declarado (ou instalação desligada) dá `404 _63`. A função recebe depois, com `x-hold-trigger: hook`, o corpo e os
cabeçalhos do terceiro (ex.: `x-signature`).

**A função tem de conferir a assinatura do terceiro** com um segredo dela (declare-o em `secrets`). `hold.verifyHmac` recebe o
**valor** do segredo, não o nome:

```ts
const corpo = await request.text();
const ok = await hold.verifyHmac(corpo, request.headers.get("x-signature") ?? "", hold.requireSecret("SEGREDO_COBRANCA"),
  { prefix: "sha256=" });                       // opções: algorithm ("SHA-256" padrão), encoding ("hex" padrão | "base64"), prefix
if (!ok) return Response.json({ erro: "assinatura_invalida" }, { status: 401 });
```

Sem conferir, qualquer pessoa que descubra a URL dispara a função. Para testar, peça ao serviço de cobrança um envio de teste para a URL do hook, assinado com o segredo (o valor nunca passa pelo chat).

## Testar

- **Agora, sem esperar a agenda:** `holdprint plugin run <agenda>` ("Executar agora"; imprime o `deliveryId`) ou o botão **Executar agora**
  em Plugins > ⋯ > Chamadas e cotas > Automações. Só Administrador.
- **Ver o que aconteceu:** `holdprint plugin logs [--follow] [--since 10m] [--trigger schedule]` ou Plugins > ⋯ > **Registros** (últimos 7 dias,
  Administrador ou quem tem "Gerenciar plugins"). Controle da hospedagem fora do ar dá `503 _48`.
- **Simulador e modo desenvolvedor:** `holdprint dev` roda `functions/` com API simulada e o botão "Executar agenda <id>" na moldura;
  `plugin dev --account` roda as funções no computador com os dados reais em **só leitura** (escrita dá `403 _51`); salvar
  `functions/index.ts` vale na próxima chamada. Segredos locais em `.holdprint/dev-secrets.json`.
- **Prévia:** a tela de uma versão em prévia chama as funções **da própria versão** (`/_v/<versão>/api/...`), não as da liberada.

## Ordem do deploy

`deploy` publica o script, registra a versão na WebApi e **só então** a WebApi aplica os segredos e move o ponteiro (se `--release`).
Assim nenhuma versão fica no ar sem os segredos (a CLI nunca move o ponteiro direto). Do segundo deploy em diante a versão sai como
prévia; `--release` (ou `holdprint plugin release`) libera.

## Erros

| HTTP | Código | Significado |
|---|---|---|
| 400 | `_57` | Nome de segredo inválido |
| 400 | `_58` | Segredo não declarado no manifesto |
| 400 | `_59` | Valor vazio ou acima de 4 KiB |
| 400 | `_60` | Agenda inválida (`every` fora do catálogo ou abaixo do mínimo, caminho, id) |
| 404 | `_61` | Agenda inexistente (em "Executar agora") |
| 400 | `_62` | Domínio de rede inválido (IP, curinga, porta, sufixo interno) |
| 404 | `_63` | Hook não declarado |
| 413 | `_64` ou `body_too_large` | Corpo do hook acima de 256 KiB (o porteiro recusa antes da WebApi) |
| 401 | `_65` | Chave de entrada da plataforma inválida (só o porteiro chama; não é erro do plugin) |
| 503 | `_48` | Hospedagem indisponível (registros) |

Assinatura da plataforma recusada com 401 (`platform_signature` nos registros): relógio do computador fora de hora (janela de 60 s).

## Limitações conhecidas

- O `console` é capturado globalmente: execuções simultâneas no mesmo isolate podem misturar linhas nos Registros.
- O corpo do hook é guardado como texto UTF-8: corpo binário é alterado e a assinatura HMAC do terceiro não confere.
- Trocar um segredo reinicia o plugin por ~1 s: uma execução em curso pode falhar uma vez e a entrega tenta de novo.
- Os Registros podem levar até ~60 s para aparecer (`holdprint plugin logs --follow` alcança sozinho).
