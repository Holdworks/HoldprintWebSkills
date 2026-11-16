# Erros da plataforma de plugins

## Formato

A API responde com uma lista de erros:

```json
[{ "type": 56, "errorType": 66, "errorCode": "HOLD_PLUGIN_PLATFORM_66", "message": "...", "fields": ["contributes.actions[0].target"], "parameters": [] }]
```

- `errorCode` é `HOLD_PLUGIN_PLATFORM_<n>`; o número está na tabela abaixo.
- `fields` aponta o campo, o escopo ou o motivo (ex.: `budgets:read`, `where.accountStatusId`).
- `message`, quando presente, já explica em português o que corrigir (comum nos erros de manifesto e de consulta).
- No SDK, o erro chega como `HoldApiError` (`status`, `body` com esta lista, `message` legível). Na CLI, como `erro: ...` com a dica de como corrigir. Na tela do plugin, mostre uma mensagem sua em português; não despeje o JSON.
- A coluna HTTP traz o status padrão. Quando não há status específico, a plataforma responde `400`.

Dois códigos fora da numeração também aparecem:

| Código | HTTP | Significado | Como corrigir |
|---|---|---|---|
| `PLUGIN_SCOPE_REQUIRED` | 403 | A rota exige um escopo que o plugin nunca declarou (`fields` traz qual). | Declare o escopo com `purpose` no manifesto, `deploy` e peça a aprovação. |
| `HOLD_GENERAL_6` | 400 | `Idempotency-Key` repetida com corpo diferente. | Mantenha o corpo idêntico em toda repetição com a mesma chave (nada de hora, contador ou texto variável), ou use uma chave nova para uma escrita nova. |

## Tabela completa

### Token e acesso

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 1 | `HOLD_PLUGIN_PLATFORM_1` | 400 | A plataforma não está com a chave de assinatura configurada. | Problema do lado da Hold: tente de novo mais tarde e avise o suporte se persistir. |
| 2 | `HOLD_PLUGIN_PLATFORM_2` | 401 | Token malformado. | O SDK renova e repete sozinho. Se persistir, a página foi aberta fora do Holdprint: abra pelo menu Plugins. |
| 3 | `HOLD_PLUGIN_PLATFORM_3` | 401 | Token expirado. | Idem: o SDK renova. Na CLI, `holdprint login`. |
| 4 | `HOLD_PLUGIN_PLATFORM_4` | 401 | Assinatura do token inválida. | Idem. Nunca monte token na mão. |
| 5 | `HOLD_PLUGIN_PLATFORM_5` | 401 | Tipo de token errado para esta rota (ex.: rota de ações chamada com token de plugin). | Use o cliente certo: tela pelo SDK, ações pela sessão da CLI. |
| 6 | `HOLD_PLUGIN_PLATFORM_6` | 401 | Token emitido para outro destino. | Use o token do próprio SDK ou da própria sessão. |
| 7 | `HOLD_PLUGIN_PLATFORM_7` | 401 | Dados do token inválidos. | O SDK renova; na CLI, `holdprint login`. |
| 8 | `HOLD_PLUGIN_PLATFORM_8` | 403 | Sessão personificada pelo suporte ou sandbox. | Plugins não instalam, não aprovam e não rodam nesses modos. Entre com uma sessão normal. |
| 9 | `HOLD_PLUGIN_PLATFORM_9` | 403 | Escopo não concedido: declarado numa versão nova ainda não aprovada, ou o perfil do usuário não tem a tela equivalente. | Peça ao Administrador para aprovar o link `/plugins/consent/<id>`; ou libere a tela no perfil do usuário. Depois da aprovação o escopo vale na próxima renovação do token (até 10 min) ou ao reabrir. |
| 10 | `HOLD_PLUGIN_PLATFORM_10` | 404 | Instalação inexistente. | Confira o id; reinstale pela tela Plugins ou `holdprint plugin deploy`. |
| 11 | `HOLD_PLUGIN_PLATFORM_11` | 409 | Instalação inativa (plugin desligado). | Religue na tela Plugins ou `holdprint plugin disable --enable`. |
| 12 | `HOLD_PLUGIN_PLATFORM_12` | 403 | Ação só do Administrador (instalar, aprovar, escolher perfis, desinstalar). | Peça a um Administrador. |
| 31 | `HOLD_PLUGIN_PLATFORM_31` | 403 | Instalação aguardando consentimento. | Um Administrador aprova pelo link `/plugins/consent/<id>`. |
| 34 | `HOLD_PLUGIN_PLATFORM_34` | 403 | O usuário não pode usar este plugin (perfil fora da lista ou sem **Plugins: Usar**). | O Administrador libera o perfil (Plugins > ⋯ > Perfis) e a permissão em Ajustes > Perfis. Não é defeito do plugin. |
| 35 | `HOLD_PLUGIN_PLATFORM_35` | 401 | Acesso do usuário revogado (bloqueio, troca ou edição de perfil, senha ou e-mail trocados). | O SDK pede token novo e repete. Se cair em `34`, o usuário perdeu o acesso: mostre "Você não tem acesso a este plugin". |
| 36 | `HOLD_PLUGIN_PLATFORM_36` | 503 | Não foi possível conferir a revogação agora. | Tente de novo em instantes. |
| 38 | `HOLD_PLUGIN_PLATFORM_38` | 403 | Usuário sem **Plugins: Gerenciar** tentando listar, ligar ou desligar plugins. | Peça a permissão ou a um Administrador. |

### Registro, instalação e CLI

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 13 | `HOLD_PLUGIN_PLATFORM_13` | 404 | Plugin não encontrado (ou não é da sua conta). | Confira o id ou a pasta (`.holdprint/deploy.json`). |
| 14 | `HOLD_PLUGIN_PLATFORM_14` | 409 | Plugin já instalado nesta conta. | Use a instalação existente (`holdprint plugin list`). |
| 15 | `HOLD_PLUGIN_PLATFORM_15` | 400 | Escopo pedido que o manifesto não declara (ou ação/aba sem o escopo da tela). | Declare o escopo em `scopes` com `purpose`. |
| 16 | `HOLD_PLUGIN_PLATFORM_16` | 400 | Nome de coleção do storage inválido. | Minúsculas, números, `-` e `_`, até 64. |
| 17 | `HOLD_PLUGIN_PLATFORM_17` | 400 | Chave do storage inválida. | Letras, números e `. _ : -`, até 128, começando por letra ou número. |
| 18 | `HOLD_PLUGIN_PLATFORM_18` | 400 | Valor do storage acima de 256 KiB. | Divida em registros menores. |
| 19 | `HOLD_PLUGIN_PLATFORM_19` | 400 | Limite de 5 mil registros do plugin esgotado. | Apague registros antigos (`hold.storage.delete`). |
| 20 | `HOLD_PLUGIN_PLATFORM_20` | 400 | `slug` inválido. | 3 a 40 caracteres, minúsculas, números e hífens, sem hífen nas pontas. |
| 21 | `HOLD_PLUGIN_PLATFORM_21` | 400 | Falta `name`. | Preencha `name` (até 60). |
| 22 | `HOLD_PLUGIN_PLATFORM_22` | 400 | Escopo desconhecido. | Use só o [catálogo](07-escopos.md). |
| 23 | `HOLD_PLUGIN_PLATFORM_23` | 400 | Escopo sem `purpose`. | Escreva o motivo em português. |
| 24 | `HOLD_PLUGIN_PLATFORM_24` | 400 | Versão inválida. | Deixe a CLI numerar as versões; não edite `.holdprint/deploy.json`. |
| 25 | `HOLD_PLUGIN_PLATFORM_25` | 400 | Manifesto inválido. | `holdprint plugin validate` lista o que corrigir. |
| 26 | `HOLD_PLUGIN_PLATFORM_26` | 400 | O registro do plugin não pertence à sua conta. | Use um `slug` novo; não publique sobre plugin de outra conta. |
| 27 | `HOLD_PLUGIN_PLATFORM_27` | 404 | Sessão de login da CLI não encontrada. | `holdprint login` de novo. |
| 28 | `HOLD_PLUGIN_PLATFORM_28` | 410 | Sessão de login da CLI expirada. | `holdprint login` de novo. |
| 29 | `HOLD_PLUGIN_PLATFORM_29` | 400 | Código de login inválido. | `holdprint login` de novo e confira o código. |
| 32 | `HOLD_PLUGIN_PLATFORM_32` | 400 | Na aprovação: as permissões mudaram durante a revisão. | Recarregue a tela de aprovação. |
| 33 | `HOLD_PLUGIN_PLATFORM_33` | 400 | Na aprovação: senha errada. | Digite a senha de novo. |
| 37 | `HOLD_PLUGIN_PLATFORM_37` | 400 | Na aprovação: perfil inexistente. | Recarregue e escolha os perfis de novo. |
| 46 | `HOLD_PLUGIN_PLATFORM_46` | 404 | Prévia de versão que não existe. | Confira o `?versao=` (`holdprint plugin list`, `deploy`). |
| 47 | `HOLD_PLUGIN_PLATFORM_47` | 403 | Prévia aberta por quem não é Administrador. | Esperado: só Administradores veem prévia. Libere com `holdprint plugin release`. |
| 48 | `HOLD_PLUGIN_PLATFORM_48` | 503 | Hospedagem dos plugins indisponível (deploy, segredos, registros). | Tente de novo em instantes. |

### Cotas, sincronização e etapa

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 30 | `HOLD_PLUGIN_PLATFORM_30` | 404 | Orçamento inexistente ou que o usuário não vê (tarefa, mover etapa). | Use o id de `launch.entity` ou de uma lista que o usuário vê. |
| 39 | `HOLD_PLUGIN_PLATFORM_39` | 429 | Cota diária da instalação (10 mil) estourada. | Respeite `Retry-After`; troque varredura por `hold.sync.pull`. |
| 40 | `HOLD_PLUGIN_PLATFORM_40` | 429 | Limite por minuto (300) estourado. | Respeite `Retry-After`; faça menos chamadas em paralelo. |
| 41 | `HOLD_PLUGIN_PLATFORM_41` | 400 | `updated_since` inválido. | Data ISO 8601 (ex.: `2026-11-13T12:00:00Z`). |
| 42 | `HOLD_PLUGIN_PLATFORM_42` | 400 | Cursor inválido ou de outro recurso. | Recomece a leitura sem cursor. Não monte nem edite cursor. |
| 43 | `HOLD_PLUGIN_PLATFORM_43` | 503 | Consulta passou de 5 s. | Intervalo de datas menor ou `limit` menor; tente de novo. |
| 44 | `HOLD_PLUGIN_PLATFORM_44` | 400 | Mover etapa: `stepId` não é do funil do orçamento. | Leia as etapas em `GET /v1/funnels/{id}`. |
| 45 | `HOLD_PLUGIN_PLATFORM_45` | 400 | Mover etapa: orçamento não está aberto. | Só orçamentos abertos mudam de etapa. |

### Modo desenvolvedor

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 49 | `HOLD_PLUGIN_PLATFORM_49` | 410 | A sessão do modo desenvolvedor terminou (CLI parada ou sem sinal por 90 s). | A janela volta à versão publicada; rode `holdprint plugin dev --account` de novo. |
| 50 | `HOLD_PLUGIN_PLATFORM_50` | 400 | Origem local inválida. | O modo desenvolvedor só aceita `localhost`, `127.0.0.1` ou `[::1]`. Não use túnel. |
| 51 | `HOLD_PLUGIN_PLATFORM_51` | 403 | Escrita no modo desenvolvedor só leitura (ou acima de 100 escritas com `--allow-writes`). | Teste escrita no simulador, na versão publicada ou com `--allow-writes`. |
| 52 | `HOLD_PLUGIN_PLATFORM_52` | 403 | Link do modo desenvolvedor aberto por outra pessoa. | O link é só de quem rodou a CLI. Para mostrar a outros, publique uma prévia. |

### Eventos, funções, segredos e hooks

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 53 | `HOLD_PLUGIN_PLATFORM_53` | 400 | Cursor de eventos inválido. | Recomece com `cursor=now`. |
| 54 | `HOLD_PLUGIN_PLATFORM_54` | 410 | Cursor de eventos com mais de 30 dias. | Releia por `hold.sync.pull` (o SDK chama `onResync`). |
| 55 | `HOLD_PLUGIN_PLATFORM_55` | 400 | URL de webhook inválida. | `https` público, sem IP, sem rede privada, sem domínio da Hold. |
| 56 | `HOLD_PLUGIN_PLATFORM_56` | 400 | Tipo de evento desconhecido. | `budget.won`, `budget.step_changed`, `task.created`, `task.completed`, `customer.created`. |
| 57 | `HOLD_PLUGIN_PLATFORM_57` | 400 | Nome de segredo inválido. | `^[A-Z][A-Z0-9_]{1,63}$` (ex.: `CHAVE_SERVICO`). |
| 58 | `HOLD_PLUGIN_PLATFORM_58` | 400 | Segredo não declarado no manifesto. | Declare o nome em `secrets` e faça `deploy`. |
| 59 | `HOLD_PLUGIN_PLATFORM_59` | 400 | Valor do segredo vazio ou acima de 4 KiB. | Confira o valor. |
| 60 | `HOLD_PLUGIN_PLATFORM_60` | 400 | Agenda inválida (`every` fora da lista ou abaixo do mínimo, caminho ou id inválido). | `every`: `15m`, `30m`, `1h`, `6h`, `12h`, `1d`; `path` começando com `/api/`. |
| 61 | `HOLD_PLUGIN_PLATFORM_61` | 404 | "Executar agora" com agenda inexistente. | Use o `id` de `functions.schedules`. |
| 62 | `HOLD_PLUGIN_PLATFORM_62` | 400 | Domínio de rede inválido. | Nome de site público, sem IP, curinga, porta ou sufixo interno. |
| 63 | `HOLD_PLUGIN_PLATFORM_63` | 404 | Hook não declarado (ou plugin desligado). | Declare em `functions.hooks` e confira a URL na tela de aprovação. |
| 64 | `HOLD_PLUGIN_PLATFORM_64` | 413 | Corpo do hook acima de 256 KiB. | O serviço externo precisa mandar menos dados. |
| 65 | `HOLD_PLUGIN_PLATFORM_65` | 401 | Chave interna da hospedagem inválida. | Interno da Hold; não aparece para o plugin. |

### Manifesto: lugares na tela e abertura

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 66 | `HOLD_PLUGIN_PLATFORM_66` | 400 | `contributes.actions` inválido: alvo, `open` ou `modal.size` fora do catálogo; mais de 10 ações; id repetido; ação sem o escopo da tela; `modal` com `open: "page"`; ou plugin sem página, ação, aba, card, função ou app externo. | Siga a `message`; `holdprint plugin validate` aponta antes. |
| 67 | `HOLD_PLUGIN_PLATFORM_67` | 404 | Ao abrir pelo botão ou deep link: ação inexistente nesta versão. | Confira o `id` da ação. |
| 68 | `HOLD_PLUGIN_PLATFORM_68` | 404 | Ao abrir: registro fora da conta ou que o usuário não vê (no lote, basta um). | Esperado para quem não tem acesso. Não é defeito do plugin. |
| 69 | `HOLD_PLUGIN_PLATFORM_69` | 400 | Abertura com alvo errado (ação de tela sem registro, ou Novo registro com registro). | Use o botão no lugar declarado. |
| 107 | `HOLD_PLUGIN_PLATFORM_107` | 400 | `pages` inválido: mais de 5, id repetido ou fora do padrão, título ou ícone grandes, grupo inexistente. | A `message` lista os grupos válidos. |
| 108 | `HOLD_PLUGIN_PLATFORM_108` | 400 | `page` e `pages` no mesmo manifesto. | Use um dos dois. |
| 109 | `HOLD_PLUGIN_PLATFORM_109` | 400 | `tabs` inválido: mais de 3, alvo diferente de `budget`/`customer`, título grande ou aba sem o escopo do alvo. | Corrija conforme a `message`. |
| 110 | `HOLD_PLUGIN_PLATFORM_110` | 400 | `cards` inválido: mais de 3, `size` fora de `small`/`medium`/`large`, título grande. | Corrija conforme a `message`. |
| 111 | `HOLD_PLUGIN_PLATFORM_111` | 400 | Ao abrir: `surface` desconhecida. | Use `page`, `modal`, `tab` ou `card`. |
| 112 | `HOLD_PLUGIN_PLATFORM_112` | 404 | Ao abrir: página, aba ou card que a versão não declara. | Confira o `id` no manifesto e libere a versão certa. |

### Vitrine, links e bloqueios

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 70 | `HOLD_PLUGIN_PLATFORM_70` | 400 | `listing` inválido. | `summary` até 140, `category` da lista, até 5 `highlights` de 80, `support` e-mail ou `https://`. |
| 71 | `HOLD_PLUGIN_PLATFORM_71` | 404 | Plugin não disponível para esta conta no Marketplace. | Confira se ele foi compartilhado com você por link ou está no Marketplace. |
| 72 | `HOLD_PLUGIN_PLATFORM_72` | 404 | Link de instalação inválido, revogado ou vencido. | Peça um link novo (`holdprint plugin publish --unlisted`). |
| 73 | `HOLD_PLUGIN_PLATFORM_73` | 409 | Link chegou ao teto de contas. | Gere outro com `--max-accounts` maior (até 10). |
| 74 | `HOLD_PLUGIN_PLATFORM_74` | 409 | Plugin com `secrets` não instala em outra conta. | Tire `secrets` do manifesto, `deploy` e gere o link de novo. |
| 75 | `HOLD_PLUGIN_PLATFORM_75` | 409 | Não dá para acrescentar segredo: outra conta já instalou. | Tire o segredo novo ou peça para a outra conta desinstalar. |
| 76 | `HOLD_PLUGIN_PLATFORM_76` | 403 | A Hold bloqueou este plugin. | Não tente contornar. Veja o motivo em `holdprint plugin list` e fale com o suporte da Hold. |
| 77 | `HOLD_PLUGIN_PLATFORM_77` | 403 | A Hold bloqueou os plugins desta conta. | Fale com o suporte da Hold. |
| 78 | `HOLD_PLUGIN_PLATFORM_78` | 400 | Bloqueio sem motivo. | Interno da Hold. |
| 79 | `HOLD_PLUGIN_PLATFORM_79` | 400 | Destaque pedido por conta que não é da Hold. | Interno da Hold. |

### Apps externos e Hold Identity

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 80 | `HOLD_PLUGIN_PLATFORM_80` | 400 | App externo inválido (manifesto ou cliente). | Confira `id`, `kind`, `origins`, `redirectUris` e `scopes` dentro dos do plugin. |
| 81 | `HOLD_PLUGIN_PLATFORM_81` | 400 | `redirect_uri` não cadastrado para o app. | Cadastre exatamente o mesmo endereço (esquema, host, porta, caminho). |
| 82 | `HOLD_PLUGIN_PLATFORM_82` | 401 | Sessão encerrada ou acesso revogado (Acessos conectados). | Entre de novo (`holdprint login` ou `app.signIn()`). |
| 83 | `HOLD_PLUGIN_PLATFORM_83` | 401 | Refresh token reaproveitado: a sessão inteira foi revogada por segurança. | Entre de novo. Não copie nem reutilize tokens. |
| 84 | `HOLD_PLUGIN_PLATFORM_84` | 400 | O pedido de login expirou. | Comece o login de novo e aprove a tempo. |
| 86 | `HOLD_PLUGIN_PLATFORM_86` | 503 | Chave de assinatura do Hold Identity indisponível. | Tente de novo em instantes; avise a Hold se persistir. |
| 87 | `HOLD_PLUGIN_PLATFORM_87` | 403 | Origem do navegador não cadastrada para o app. | Cadastre a origem exata em `origins`. |

### CLI: consulta e ações

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 85 | `HOLD_PLUGIN_PLATFORM_85` | 403 | Rota não aceita a sessão da CLI/MCP. Com `fields` `installation_required`: a rota (storage, events) exige plugin instalado; `delegated_access_disabled`: o Administrador desligou o acesso por CLI e MCP. | Use a rota `/v1` equivalente ou uma ação de `holdprint actions list`; peça ao Administrador para religar o acesso na tela Plugins. |
| 88 | `HOLD_PLUGIN_PLATFORM_88` | 403 | Ação não exposta à CLI/MCP. | Veja as disponíveis em `holdprint actions list`. |
| 89 | `HOLD_PLUGIN_PLATFORM_89` | 428 | Rota marcada para aprovação de uma pessoa. | Abra o link de aprovação; a CLI conclui sozinha depois. |
| 90 | `HOLD_PLUGIN_PLATFORM_90` | 400 | Falta `Idempotency-Key`. | Envie uma chave estável por conteúdo (a CLI gera). |
| 91 | `HOLD_PLUGIN_PLATFORM_91` | 409 | Aprovação não confere com o pedido (corpo mudou, já usada, outra ação). | Peça nova aprovação com o corpo final. |
| 92 | `HOLD_PLUGIN_PLATFORM_92` | 429 | Teto diário de aprovações da conta. | Tente amanhã. |
| 93 | `HOLD_PLUGIN_PLATFORM_93` | 404 | Recurso sem consulta ligada (ou sem leitura por id). | `GET /v1/query` (ou `holdprint query --list`) mostra os ligados. |
| 94 | `HOLD_PLUGIN_PLATFORM_94` | 400 | Filtro ou ordenação em campo sem índice, ou faltou um filtro obrigatório. | A `message` lista os filtros permitidos (ex.: contas a pagar e a receber exigem `accountStatusId` e `active`). |
| 95 | `HOLD_PLUGIN_PLATFORM_95` | 400 | Campo não permitido no recurso. | Use os campos do catálogo. |
| 96 | `HOLD_PLUGIN_PLATFORM_96` | 429 | Escritas simultâneas demais na conta (mais de 4). | Espere o `Retry-After` e repita com a mesma chave; escreva em sequência. |
| 113 | `HOLD_PLUGIN_PLATFORM_113` | 404 | Registro não encontrado em `GET /v1/{recurso}/{id}`. | Confira o id (use o de `launch.entity`). |

### Pedido de publicação no Marketplace

| # | Código | HTTP | Significado | Como corrigir |
|---|---|---|---|---|
| 97 | `HOLD_PLUGIN_PLATFORM_97` | 403 | Pedido feito por quem não é Administrador. | Um Administrador roda `holdprint plugin submit`. |
| 98 | `HOLD_PLUGIN_PLATFORM_98` | 409 | Plugin bloqueado pela Hold. | Veja o motivo e fale com a Hold. |
| 99 | `HOLD_PLUGIN_PLATFORM_99` | 409 | Plugin com segredo não pode ir para outras contas. | Tire `secrets`, `deploy`, `release` e peça de novo. |
| 100 | `HOLD_PLUGIN_PLATFORM_100` | 400 | Falta `listing` (resumo e categoria). | Preencha, `validate`, `deploy --release` e peça de novo. |
| 101 | `HOLD_PLUGIN_PLATFORM_101` | 409 | Nenhuma versão liberada. | `holdprint plugin release` e peça de novo. |
| 102 | `HOLD_PLUGIN_PLATFORM_102` | 404 | Não há pedido de publicação para este plugin. | Peça com `holdprint plugin submit`. |
| 103 | `HOLD_PLUGIN_PLATFORM_103` | 409 | Pedido não está em análise. | Interno da análise da Hold. |
| 104 | `HOLD_PLUGIN_PLATFORM_104` | 409 | Pedido não está aprovado. | Interno da análise da Hold. |
| 105 | `HOLD_PLUGIN_PLATFORM_105` | 409 | Pedido não está ativo. | Interno da análise da Hold. |
| 106 | `HOLD_PLUGIN_PLATFORM_106` | 400 | Recusa ou retirada sem motivo. | Interno da análise da Hold. |

## Sintomas sem código

| Sintoma | Causa e correção |
|---|---|
| Tela em branco, `Holdprint is not defined` | Falta `<script src="/_hold/sdk/v1.js"></script>` antes do `app.js`. |
| `Refused to connect` ou erro de CSP no console | Chamada a site externo ou `fetch` fora do SDK. Coloque a biblioteca dentro de `public/`; serviço externo só por função. |
| `410` ao abrir o plugin | Plugin desligado. Religue na tela Plugins. |
| Botão não aparece | Plugin aguardando aprovação, perfil sem acesso, usuário sem a tela, ou cache de até 60 s. Reabra a tela depois de um minuto. |
| Lista vazia para um vendedor | Visibilidade do perfil, não falha. Mostre "Nenhum registro disponível para o seu perfil". |
| Mudei o código e nada mudou | Rode `deploy` (e `release`, da segunda versão em diante) e recarregue o Holdprint. |
| Primeiro deploy de plugin novo saiu como `v2` ou mais | O `slug` colidiu com outro plugin da conta. Troque o slug. |
| Função falha com "segredo faltando" | Grave o valor em Plugins > ⋯ > Segredos ou `holdprint plugin secrets set NOME`. |
| Função recusada com `platform_signature` nos registros | Relógio do computador fora de hora (janela de 60 s), no modo desenvolvedor. |
| Função recusada com `blocked_by_hold undeclared_domain` | Domínio externo fora de `network.domains`. Declare e aprove. |
| `400` em `/v1/budgets` | `state` fora de `open`/`won`/`lost`, ou `sellerId` inválido. |
