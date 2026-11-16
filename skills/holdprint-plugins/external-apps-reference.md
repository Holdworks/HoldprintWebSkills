# Apps externos (entrar com a conta Holdprint)

App externo é uma página ou sistema **fora do Holdprint** (painel numa TV, página no celular, site do cliente) que lê dados
da conta **como o usuário que entrou**. O plugin declara o app no manifesto; quem usa entra com a conta Holdprint e aprova
no próprio Holdprint. **O app nunca vê nem pede a senha.**

Exemplo de referência completo e testado: `examples/painel-tv` do repositório `holdprint-plugins` (página dentro do Holdprint com
"Abrir na TV" + app da TV em `external/`).

## 1. Quando usar

| Pedido | `kind` |
|---|---|
| Painel de TV, quiosque, tela sem teclado | `device` (a tela mostra um código e um QR; a pessoa aprova no celular ou computador) |
| Página no celular, site ou sistema com navegador normal | `web` (redireciona ao Holdprint e volta; código + PKCE) |

Se a tela só precisa abrir dentro do Holdprint, **não** use app externo: use `contributes.page` e `Holdprint.connect()`.

## 2. Manifesto: `contributes.externalApps`

```json
"scopes": [{ "scope": "budgets:read", "purpose": "Mostrar os orçamentos ganhos hoje no painel da TV" }],
"contributes": {
  "page": { "menuTitle": "Painel da TV", "icon": "device-tv" },
  "externalApps": [
    { "id": "tv", "name": "Painel da produção", "kind": "device",
      "origins": ["http://localhost:4791"], "scopes": ["budgets:read"] },
    { "id": "celular", "name": "Produção no celular", "kind": "web",
      "origins": ["https://painel.minhagrafica.com.br"],
      "redirectUris": ["https://painel.minhagrafica.com.br/entrar"], "scopes": ["budgets:read"] }
  ]
}
```

| Campo | Regra |
|---|---|
| `id` | Mesmo formato das ações (`^[a-z0-9][a-z0-9-]{1,38}$`), único no plugin. |
| `name` | Nome que a pessoa vê na tela de aprovação (pt-BR, curto). |
| `kind` | `device` ou `web`. |
| `origins[]` | Origens do app (`esquema://host[:porta]`, sem caminho). `https://`; `http://localhost` só em desenvolvimento, na máquina de quem desenvolve. Só estas origens recebem CORS. |
| `redirectUris[]` | Obrigatório em `web` (endereços exatos para onde o Holdprint devolve o `code`). Em `device` não existe. |
| `scopes[]` | **Subconjunto** dos `scopes` do manifesto. Escopo que o plugin não declarou é recusado. |
| Limites | Até **3 apps** por plugin. Fora das regras: `400 HOLD_PLUGIN_PLATFORM_80` (`ExternalAppInvalid`). |

Um plugin só com `externalApps` (sem `page`) é válido.

**Consentimento:** app novo ou origem nova **pede novo consentimento** do Administrador. A tela mostra
"Acessa de fora do Holdprint: <app> em <origem>". Mostre o link `/plugins/consent/<id>` ao usuário e espere a aprovação,
como em qualquer escopo novo. Antes do consentimento, aprovar o app dá erro (a instalação não está ativa). Tirar app ou origem não pede.

## 3. O que a pessoa vê e o que o app recebe

Quando alguém entra no app, o **Holdprint** (já logado) mostra: nome do app, publicador e os escopos com o propósito de cada um.
Exige o plugin instalado e o perfil da pessoa liberado. **Personificação e sandbox não autorizam** apps externos.

O app recebe um token `plugin_user`: vale para **aquele plugin e aquela instalação**, para **aquela origem** (`azp`), com os escopos
aprovados e a **visibilidade do usuário** (Vendedor só vê o que a tela dele mostraria). O access dura **10 min** e o refresh dura
90 dias, rotativo (o SDK renova sozinho). Quem revogar em **Plugins > Acessos conectados** derruba o app em até 60 s.

## 4. SDK do app externo: `HoldprintExternal`

Carregue o SDK pelo endereço `id.` do porteiro. O SDK usa esse mesmo endereço para o login e troca `id.` por `api.` para os dados:

| SDK | Login (`identityBase`) | Dados (`apiBase`) |
|---|---|---|
| `https://id.<domínio técnico>/sdk/external-v1.js` | `https://id.<domínio técnico>` | `https://api.<domínio técnico>` |

O `<domínio técnico>` aparece na tela de aprovação do plugin e na saída do `deploy`.

```html
<script src="https://id.<domínio técnico>/sdk/external-v1.js"></script>
```

```js
const app = HoldprintExternal.init({ pluginId: 'p-xxxxxxxxxx', appId: 'tv', persist: 'local' });
const sessao = await app.signIn({
  onCode: (info) => {
    document.getElementById('codigo').textContent = info.userCode;          // o código que a pessoa digita
    document.getElementById('endereco').textContent = info.verificationUri; // onde ela digita
    document.getElementById('qr').innerHTML = info.qrSvg;                    // QR PRONTO (SVG gerado pelo SDK)
  }
});
const res = await app.api.get('/budgets?state=won&limit=100');
```

**QR: `info.qrUrl` é TEXTO, não imagem.** É o endereço de aprovação que vai *dentro* do QR. Nunca use `<img src={qrUrl}>`
nem `img.src = info.qrUrl` (aparece imagem quebrada). O desenho pronto vem em **`info.qrSvg`** (SVG gerado localmente pelo SDK):
`el.innerHTML = info.qrSvg` num `<div id="qr">` (fundo branco ajuda a câmera). Para outro tamanho ou cor:
`HoldprintExternal.qrSvg(info.qrUrl, { size: 320, dark: '#000', light: '#fff', margin: 4 })` (devolve a string SVG; `size` em px).
**Não** carregue biblioteca de QR de CDN (jsDelivr, unpkg, Google Charts) nem mande o código para serviço de terceiro.

| Membro | O que faz |
|---|---|
| `HoldprintExternal.init({ pluginId, appId, identityBase?, apiBase?, persist? })` | Cria o cliente. `pluginId` está em `.holdprint/deploy.json` depois do deploy; `appId` é o `id` do `externalApps`. Sem `identityBase`, usa o endereço de onde o script veio. `persist`: `'session'` (padrão, some ao fechar a aba), `'local'` (aparelho dedicado, como TV ou quiosque, que precisa continuar logado depois de recarregar) ou `'memory'`. |
| `signIn({ onCode, signal })` | Com sessão guardada, só renova e devolve `{ scope, expiresAt }`. Sem sessão: **com `onCode`** é o fluxo `device`: o SDK pede o código, chama `onCode({ userCode, verificationUri, verificationUriComplete, qrUrl, qrSvg, expiresIn, interval })` para você **mostrar o código e o QR**: `qrSvg` é o QR pronto (`el.innerHTML = info.qrSvg`); `qrUrl` é só o texto que vai dentro dele, nunca `img.src`; `expiresIn` em segundos e espera a aprovação; `signal` (AbortController) cancela. **Sem `onCode`** é o fluxo `web`: redireciona ao Holdprint (PKCE feito pelo SDK). |
| `handleRedirect()` | No app `web`, chame ao carregar a página de volta (`redirectUris`): troca `code` + `state` pelo token e limpa a URL. Devolve `null` se a URL não é um retorno de login. |
| `isSignedIn()` / `signOut()` | Estado da sessão; `signOut` revoga a concessão e apaga a sessão guardada. |
| `api.get / post / put / del` | Chama `/v1` com o Bearer certo, **renova sozinho** e repete uma vez no 401. Erro de dados: `HoldApiError` (`status`, `retryAfterMs` no 429), como no `hold.api`. Sessão sem volta (revogada, refresh reusado, vencida): `ExternalAuthError` (`code`, `status`, `platformCode`). |
| `HoldprintExternal.qrSvg(texto, { size?, margin?, dark?, light? })` | Gera o SVG de um QR para qualquer texto (localmente, sem rede). O `info.qrSvg` do `onCode` já é `qrSvg(info.qrUrl)`. |
| `verifyContext(jws)` | Confere o contexto assinado de um deep link (seção 6). Também existe `HoldprintExternal.verifyContext(jws, { pluginId, appId })`. |

**Regras que não se negociam:**
- **Nunca** peça usuário e senha no app, nem faça campo de login próprio. A única entrada é `signIn`.
- **Quem guarda a sessão é o SDK** (escolha só o `persist`). **Nunca** copie token, refresh ou código para outro lugar: nada em
  `localStorage`/cookie seu, URL, log, console ou arquivo do projeto. Não reimplemente a renovação.
- **Nunca** ponha segredo no app (ele é público; o cliente é público de propósito).
- `ExternalAuthError` (sessão revogada `HOLD_PLUGIN_PLATFORM_82`, refresh reusado `_83`) = volte para a tela "Entrar com Holdprint",
  sem laço de repetição. `HoldApiError` (rede, 5xx, 429) = mostre o aviso e tente de novo no próximo ciclo.

## 5. O app só fala com `api.<domínio técnico>`

O app **não** chama o ERP, a WebApi nem outro serviço da Hold. Toda leitura vai para `<apiBase>/v1/...` (a mesma API `/v1` do
plugin, mesmos escopos, cotas, paginação e erros; veja `api-v1-reference.md`). O porteiro confere o token, a instalação e a revogação,
e devolve CORS **só para a origem registrada** daquele app (`Access-Control-Allow-Origin` = a origem do token); de outra origem a
resposta é `403 origin_not_allowed` sem CORS, e o navegador bloqueia: é o esperado. Token da CLI ou do MCP em `api.` dá 401.
Se a origem do app mudar (outra porta, outro domínio), é **origem nova**: atualize `origins`, rode `holdprint plugin deploy` e peça nova aprovação.

## 6. Deep link: do Holdprint para o app (`hold.nav.openExternal`)

Dentro do plugin (no Holdprint), um botão pode abrir o app externo já no orçamento escolhido:

```js
await hold.nav.openExternal('tv', { entity: { type: 'budget', id: orcamentoId } });
```

- **Só orçamento** (`type: 'budget'`). Outro tipo: o SDK recusa com erro claro e a API daria `400 HOLD_PLUGIN_PLATFORM_69`. Sem
  `entity`, abre o app sem registro escolhido.
- O Holdprint confere que a pessoa pode usar o plugin e ver o orçamento (senão `404 HOLD_PLUGIN_PLATFORM_68`, sem link), assina um
  contexto de **2 minutos** e abre uma janela nova em `<primeira origem do app>#hold_ctx=<jws>`.

No app:

```js
const jws = new URLSearchParams(location.hash.slice(1)).get('hold_ctx');
if (jws) {
  history.replaceState(null, '', location.pathname + location.search);   // tire o contexto da URL
  try {
    const ctx = await app.verifyContext(jws);
    // ctx = { appId, pluginId, entity: { type, id }, user: { id, name }, installationId, expiresAt, claims }
    // claims.entity traz também code e title do orçamento
    destacar(ctx.entity.id);
  } catch (erro) {
    avisar('Link do Holdprint recusado (' + erro.reason + ')');   // ExternalContextError: bad_signature, expired, wrong_audience...
  }
}
```

- **Nunca** confie no id vindo de `location`, query ou hash sem `verifyContext` (a conferência é pelo JWKS do Holdprint; mudar 1 caractere invalida).
- O contexto só diz *o que abrir*. Quem lê os dados é o token do `signIn`.
- O `appId` precisa existir em `externalApps`; a origem aberta é a primeira de `origins`.

## 7. CLI: `holdprint login`, `logout` e Acessos conectados

- `holdprint login` usa o **device code**. A CLI imprime `Código de confirmação: XXXX-XXXX` e
  `Aprove em: <endereço do Holdprint>/identity/device?code=...` (no macOS abre o navegador sozinha; `--no-open` não abre) e fica em
  `Aguardando a aprovação no navegador...`. O usuário, já logado no Holdprint, confere "Holdprint CLI", a conta e as permissões e
  clica em **Aprovar**; a CLI responde `Login feito como <e-mail> (conta <n>). A sessão renova sozinha.` Sem senha na CLI.
- A credencial vai para o **Keychain do macOS** (serviço `holdprint-cli`). Se não houver Keychain, cai num arquivo `0600` **com aviso**.
  O `~/.holdprint/config.json` não guarda token. Nunca copie, imprima ou cole o token da CLI.
- O acesso dura 1 h e a CLI renova sozinha (refresh de 30 dias); depois disso, `holdprint login` de novo. `holdprint whoami` mostra
  `Sessao: Hold Identity (renova sozinha)`.
- `holdprint logout` **revoga** a concessão no servidor e apaga a credencial local (`Logout feito: acesso revogado e credencial apagada.`).
  A próxima chamada pede `holdprint login`.
- **Plugins > Acessos conectados** (`/identity/grants`): cada pessoa vê e revoga o que ela mesma conectou: CLI, MCP e apps externos
  (todo usuário vê este item, mesmo sem plugin liberado). Revogar derruba a sessão em até 60 s. Quando um usuário diz
  "tire o acesso da TV", é aqui.
- **Limite conhecido do token delegado (CLI e MCP):** rotas do ERP que repassam o token do usuário a outros serviços da Hold
  (Auth, Merlin) falham com ele. Nesses casos use a tela do Holdprint ou um plugin com tela.

## 8. Exemplo: painel de TV da produção (orçamentos ganhos hoje)

Pedido: "cria um painel para a TV da produção que entra com a conta Holdprint e mostra os orçamentos ganhos hoje".
Modelo pronto: `examples/painel-tv` (copie a estrutura, troque o `slug`).

Estrutura (`holdprint plugin create painel-tv-<sufixo>`, depois acrescente `external/`):

```
painel-tv-<sufixo>/
  holdprint.plugin.json
  public/index.html, app.js        # página dentro do Holdprint, com o botão "Abrir na TV"
  external/index.html, app.js      # o app da TV (servido por você em http://localhost:4791)
```

`holdprint.plugin.json` (trecho): o `externalApps` da seção 2 com `id: "tv"`, `kind: "device"`, `origins: ["http://localhost:4791"]`,
`scopes: ["budgets:read"]`, e `budgets:read` em `scopes` com propósito claro.

`external/app.js` (o `index.html` carrega o SDK da seção 4 antes deste arquivo):

```js
const app = HoldprintExternal.init({ pluginId: PLUGIN_ID, appId: 'tv', persist: 'local' });

function ehHoje(data) {
  const d = new Date(data), h = new Date();
  return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth() && d.getDate() === h.getDate();
}

async function ganhosHoje() {
  const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
  const vistos = new Map();
  let cursor = null;
  for (let pagina = 0; pagina < 5; pagina++) {
    const res = await app.api.get('/budgets?state=won&limit=100&updated_since=' + encodeURIComponent(inicio.toISOString())
      + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
    for (const o of res.data) if (!o.deleted && o.wonDate && ehHoje(o.wonDate)) vistos.set(o.id, o);  // tira duplicados por id
    if (!res.hasMore || !res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return [...vistos.values()];
}

async function atualizar() {
  try {
    desenharLista(await ganhosHoje());   // use textContent, nunca innerHTML com dado do ERP
  } catch (erro) {
    if (erro.name === 'ExternalAuthError') return voltarParaEntrar('O acesso desta TV foi revogado ou expirou.');
    mostrarAviso('Falha ao atualizar; tentando de novo em 30 s.');
  }
}

async function iniciar() {
  await app.signIn({ onCode: (info) => mostrarCodigo(info.userCode, info.verificationUri, info.qrSvg, info.expiresIn) });
  // mostrarCodigo: textContent no código e no endereço; document.getElementById('qr').innerHTML = qrSvg
  esconderCodigo();
  await atualizar();
  setInterval(atualizar, 30000);
}
iniciar();
```

Valor do orçamento: a proposta vencedora (`proposes.find((p) => p.isWinner).totalPrice`).

Passos que o agente faz e diz ao usuário:
1. `holdprint plugin validate` e `holdprint plugin deploy` (o plugin é novo: slug novo, como no fluxo principal).
2. Mostrar o link de consentimento. Dizer o que o Administrador vai aprovar: `budgets:read` ("Mostrar os orçamentos ganhos hoje") e
   "Acessa de fora do Holdprint: Painel da produção em http://localhost:4791".
3. Servir a pasta `external/` na origem registrada (porta **4791**), com o `pluginId` de `.holdprint/deploy.json`, e abrir
   `http://localhost:4791`.  Qualquer servidor estático serve (por exemplo `npx serve external -l 4791`).
4. A TV mostra "Entrar com Holdprint" → código e QR. O usuário aprova no Holdprint; a lista aparece e continua atualizando sozinha.
5. Para tirar o acesso: **Plugins > Acessos conectados**.

Erros comuns do app externo:

| Sintoma | Causa e correção |
|---|---|
| `400 HOLD_PLUGIN_PLATFORM_80` no deploy ou ao entrar | `externalApps` inválido (escopo fora do manifesto, `web` sem `redirectUris`, `http://` fora do local, mais de 3 apps) ou app que não existe no plugin. |
| `400 _81` ao autorizar | `redirect_uri` diferente das registradas. Use o endereço exato. |
| CORS bloqueado / `403 origin_not_allowed` | O app roda numa origem que não está em `origins`, ou chama algo que não é `api.<domínio técnico>`. |
| `403 _87` | O Hold Identity recusou a origem do pedido de login (origem fora de `origins`). |
| `401 _82` | A pessoa revogou o acesso. Volte para "Entrar com Holdprint". |
| `401 _83` | Refresh já usado (cópia do token em outro lugar). A concessão inteira é revogada: entre de novo e **não** replique o token. |
| `400 _84` | Código ou pedido vencido (cerca de 10 min). Gere outro código. |
| Aprovar dá erro logo depois do deploy | O Administrador ainda não consentiu o app/origem novos. Mostre o link de consentimento. |
| QR aparece como imagem quebrada | O app pôs `info.qrUrl` num `<img>`. `qrUrl` é texto; use `el.innerHTML = info.qrSvg`. |
| `invalid_grant` logo após aprovar | Relógio do aparelho fora de hora. |
