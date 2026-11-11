# Integração do Controle de Frotas — v127 (11/11/2026)

## Resultado

O Controle de Frotas foi integrado ao painel GVG&ARTEFAL como módulo completo:

- menu lateral **VEÍCULOS → Frotas** e cartão **Frotas** da página inicial;
- visual e funcionalidades do Frotas preservados (visão geral, veículos, manutenções, documentos, despesas, motoristas, relatórios, configurações e auditoria);
- dados continuam na planilha oficial `1ck1lDtk_W9vjyQEnhV2Ze5secbayGLFfZi4Z0NuX-GY`;
- autenticação feita pela sessão do painel (SSO), sem segundo login dentro do iframe;
- permissões do painel aplicadas no backend do Frotas, não apenas na interface;
- o projeto Apps Script original do Frotas e o aplicativo de push do Firebase continuam separados e operacionais.

## Arquitetura

```
Painel GVG&ARTEFAL (/exec)
  ├── Painel.html
  │     └── iframe /exec?modulo=frotas&alerta=...
  │           └── FrotasIndex.html (visual original preservado)
  │                 └── google.script.run.frotasApiCall(...)
  │                       └── Frotas.gs (backend original isolado em namespace)
  │                             └── planilha oficial do Frotas
  └── Code.gs
        ├── gvguAcessoPainel_(token, 'frotas')
        └── doGetFrotas_(e)

Firebase (fora do painel)
  ├── gvg-controle-de-frotas.web.app — app de registro do dispositivo
  ├── Firestore devices — token, uid, e-mail e status (pending/approved/invalid)
  └── FCM v1 — envio diário pelo Apps Script do Frotas
```

### Por que o backend foi copiado para o projeto do painel

O Frotas original é uma implantação Apps Script separada. Para usar a sessão do painel sem criar um segundo login e sem expor um token de painel em URL, o backend foi incorporado ao mesmo projeto do painel dentro de um namespace (`GVG_FROTAS_MODULE`) e exposto apenas por `frotasApiCall`. A planilha e as regras de negócio são as mesmas.

O projeto original do Frotas **não foi substituído nem desativado**. Ele continua sendo a origem do envio FCM e pode ser usado como contingência.

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/Code.gs` | rota `modulo=frotas`, `doGetFrotas_(e)`, `frotasUrl`, `initialView` e `initialAlert` |
| `src/Painel.html` | item de menu e cartão ativos, view `gvgpViewFrotas`, iframe, deep link, ciclo de sessão/cache, logout |
| `src/Frotas.gs` | backend original do Frotas isolado; SSO pelo painel; edição × visualização; auditoria |
| `src/FrotasIndex.html` | frontend original do Frotas; `frotasApiCall`, sessão do painel, deep link de notificação, bloqueio de acesso direto |
| `docs/index.html` | wrapper PWA encaminha `view` e `alerta` para o Apps Script |
| `docs/sw.js` | cache do shell atualizado para `gvg-shell-v2` |
| `docs/manifest.webmanifest` | descrição atualizada |
| `deploy.json` | versão 127 |
| `docs/*.md` | documentação e evidências |

No projeto Apps Script original do Frotas, foi alterado apenas `Push_Frota_GVG.gs`:

- link do webpush passou a abrir `https://gvgartefalesquadrias.com.br/?view=frotas&alerta=...`;
- token inválido (`UNREGISTERED`, `NOT_FOUND`, 404 ou `INVALID_ARGUMENT` de token) é marcado como `invalid` no Firestore;
- a deduplicação por evento + dispositivo foi preservada.

## Permissões

| Nível no painel | Acesso ao Frotas | Escrita | Auditoria | Usuários do Frotas |
|---|---|---|---|---|
| Sem acesso | negado no menu, cartão, iframe e backend | não | não | não |
| Visualizar | leitura | não | não | não |
| Operar | leitura + escrita operacional | sim | sim | não |
| Gerenciar | leitura + escrita + administração | sim | sim | gerenciados no painel |

O backend retorna `GVG_SEM_ACESSO_PROJETO` para quem não tem nível. A escrita usa `requireAdmin_`, que só aceita `perfil ADMIN`; o nível **Visualizar** recebe `perfil CONSULTA`. Ocultar botões é apenas consequência; a validação real é no servidor.

## Firebase e notificações

- Projeto: `gvg-controle-de-frotas`.
- App de registro: `https://gvg-controle-de-frotas.web.app/`.
- Firestore: coleção `devices`, documentos com `status='approved'` e `token`.
- FCM: `https://fcm.googleapis.com/v1/projects/gvg-controle-de-frotas/messages:send`.
- Service worker do push: `https://gvg-controle-de-frotas.web.app/firebase-messaging-sw.js`.
- Service worker do painel: `https://gvgartefalesquadrias.com.br/sw.js` (origem diferente; não intercepta o Firebase).
- Gatilho diário do Frotas: `gvgPushAlertasDiarios`, aproximadamente 8h.
- Ledger: aba `Histórico Push Frota`, deduplicação por evento + dispositivo.

O app de registro continua usando login Google e mantém o dispositivo como `pending` até aprovação do administrador. A aprovação é feita no Firestore; nenhum dispositivo é aprovado automaticamente.

## Testes executados em 11/11/2026

### Automatizados (Chromium/Playwright, dados reais de leitura)

| Teste | Resultado |
|---|---|
| Login de teste e abertura do Frotas pelo cartão/menu | OK |
| Dados carregados | OK — 6 veículos e 3 alertas |
| Usuário Gerenciar | OK — edição e auditoria visíveis; usuários do Frotas ocultos |
| Usuário Operar | OK — edição visível; criou, editou e excluiu um KM de teste; auditoria consultada |
| Usuário Visualizar | OK — edição oculta; `saveRecord` recusado pelo backend |
| Usuário sem acesso | OK — menu/cartão ocultos; backend recusou `GVG_SEM_ACESSO_PROJETO` |
| Acesso direto a `?modulo=frotas` sem sessão do painel | OK — bloqueado, sem dados |
| Deep link `alerta=...` | OK — abriu o veículo SOD7H56 e a aba Histórico, com destaque no alerta |
| Logout do painel | OK — token removido, iframe do Frotas descarregado, login restaurado |
| Order Catalog após a integração | OK — 36 produtos carregados |
| Gastos após a integração | OK — dashboard carregado |
| Fornecedores após a integração | OK — dashboard carregado em modo somente leitura |
| Máquinas após a integração | OK — painel carregado em modo somente leitura |

### FCM (executado)

| Teste | Resultado |
|---|---|
| Diagnóstico de dispositivos | OK — 3 dispositivos `approved` |
| Envio real para um dispositivo | OK — FCM aceitou `projects/gvg-controle-de-frotas/messages/614654b4-...` |
| Link do envio | OK — `?view=frotas&alerta=<chave real>` |
| Geração de alerta de 10 dias | OK — chave, data e link gerados; registro de teste removido |
| Token inválido | OK — FCM recusou, dispositivo falso marcado `invalid` no Firestore e removido |
| Recebimento/exibição no aparelho | **Não confirmado** — depende do dispositivo físico e do sistema operacional |

### Externo/manual pendente

- Confirmar a exibição e o toque na notificação em Android e iPhone (app aberto, segundo plano e fechado).
- Confirmar o comportamento do PWA instalado no domínio novo.
- Confirmar a política de destinatários: o envio atual alcança **todos** os dispositivos aprovados; não existe segmentação por usuário/obra no backend.
- Confirmar permissão de notificação negada, token revogado no aparelho e troca de conta em dispositivo compartilhado.

## Recuperação

- Tag Git do painel antes da integração: `pre-frotas-integracao-v123`.
- Cópia do código: `/home/pcnovo/backups-frotas-integracao-2026-11-10/`.
- Cópia da planilha do Frotas: `BACKUP_FROTAS_PRE_INTEGRACAO_2026-11-10` (`1RHMoCtEzuQsXH57Omw45U2CaJP_nhxotTrGWuUWXMtc`).
- Projeto Frotas original: script `1fo2YYypS1ponMDM3llLnMWAOiKuJHvhFYPAto_k2k_fRkW1V0-BncRyh`, implantação `AKfycby3W5KlwLYtX7j3_lvi6Zcf6d67k2fKnsg7K0MOmIK-b2X3xY7y57Al-uEPBdzxBaLB`.
- Versão anterior do Frotas: v21 (antes do ajuste de push); versão publicada após o ajuste: v26.
- Versão anterior do painel: v123; versão publicada: v127.

Para voltar o painel: publicar novamente a versão 123 na implantação `AKfycby35-...` e restaurar `docs/index.html` para `v=123`. Para voltar o Frotas: publicar a versão 21 na implantação `AKfycby3W5KlwLYtX7j3_...`.
