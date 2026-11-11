# Layout 4 — Catálogo digital (v130, 11/11/2026)

## Resultado

A tela inicial bege/dourada do painel GVG&ARTEFAL foi redesenhada para o layout **4 · Catálogo digital**, mantendo a identidade visual, o menu lateral e os cinco módulos.

- Layout publicado no rodízio existente: **A (Catálogo digital) → B (Monitor escuro) → A**.
- Duração preservada: **30 segundos** por layout.
- Efeitos preservados: transição de 300 ms + entrada `gvgpLayoutIn` de 580 ms.
- Botão **Pausar/Retomar** preservado, com o mesmo comportamento.
- Login, permissões, APIs, Firebase, notificações, PWA e aplicativos internos não foram alterados.

## O que mudou

### Tela inicial
- Hero de boas-vindas **“Olá, {nome}.”** com o texto “Tudo pronto para começar.”.
- Indicador de **aplicativos conectados** calculado pelas permissões reais do usuário.
- Painel **“GVG&ARTEFAL · Central de operações”** com os cinco cartões:
  - Order Catalog
  - Controle de Gastos
  - Fornecedores
  - Controle de Máquinas
  - Frotas
- Ícone novo do **Order Catalog**: catálogo aberto com caneta e confirmação dourada, extraído da referência e publicado em WebP.
- Barra de **Acesso rápido** com os cinco atalhos.
- Cartões **Meu dia** e **Continuar trabalhando**.
- Rodapé **“4 · Catálogo digital”**.
- Busca local no topo (“Buscar no painel...”), sem consulta ao backend.
- Sininho de notificações que abre o Controle de Frotas, onde fica a central de notificações existente.

### Componentes preservados
- Sidebar, tópicos e cinco módulos.
- Login e tela de logout.
- Layout B (monitor escuro) sem alteração visual.
- Rotação, transição, contagem e pausa.
- Deep link de notificação do Frotas (`?view=frotas&alerta=...`).

## Dados reais

A tela usa os mesmos dados de `getPainelInicial` e `getPainelExternos`:

| Indicador | Origem |
|---|---|
| Order Catalog | pedidos registrados |
| Controle de Gastos | gastos no mês |
| Fornecedores | fornecedores ativos |
| Controle de Máquinas | equipamentos disponíveis |
| Frotas | veículos na frota |
| Aplicativos conectados | permissões do usuário |
| Meu dia | pedidos e primeiro módulo autorizado |

Nenhuma consulta duplicada foi criada. O layout apenas reaproveita o estado já carregado pelo painel.

## Arquivos alterados

- `src/Painel.html`: HTML do layout, CSS, busca, saudação, “Meu dia”, sincronização do modo catálogo e ajustes de acessibilidade.
- `assets/icone-order-catalog-catalogo-256.webp` e `384.webp`: novo ícone.
- `docs/assets/icone-order-catalog-catalogo-256.webp` e `384.webp`: cópias públicas para o domínio.
- `docs/index.html`: wrapper PWA para `v=130&ui=catalogo`.
- `docs/sw.js`: cache `gvg-shell-v3`.
- `deploy.json`: versão 130.
- Documentação e testes.

## Testes executados

| Teste | Resultado |
|---|---|
| Visual desktop 1440×1000 | OK — layout completo sem rolagem vertical (955 px) |
| Visual celular 390×844 | OK — hero, cartões em 2 colunas, atalhos com rolagem horizontal e rodapé |
| Responsivo 360, 430, 768, 1024, 1366 e 1440 | OK — sem overflow horizontal |
| Busca “frota” | OK — apenas o cartão Frotas permaneceu visível |
| Cinco atalhos de acesso rápido | OK — cada um abriu o módulo correspondente |
| Três atalhos “Continuar trabalhando” | OK — Order Catalog, Máquinas e Frotas |
| Sininho | OK — abriu o Frotas |
| Usuário limitado (Pedidos + Frotas) | OK — somente 2 cartões, 2 atalhos, 2 botões e contador 2 |
| Rotação A→B | OK — cerca de 29,5 s no teste, tema escuro e relógio visível |
| Pausa | OK — 32 s sem trocar de layout |
| Retomada | OK — voltou ao layout A em cerca de 30,2 s |
| Efeito de entrada | OK — classe `gvgp-layout-enter` aplicada nos dois layouts |
| Layout B | OK — imagem, cartões e métricas preservados |
| Login | OK — tela de login e cadastro intactas |
| Carregamento pós-login | OK — catálogo com esqueletos “—” em vez de tela vazia |
| Logout | OK — login restaurado e catálogo oculto |
| Order Catalog | OK — 96 produtos no teste desktop |
| Gastos, Fornecedores e Máquinas | OK — módulos abriram |
| Deep link do Frotas | OK — veículo SOD7H56 e histórico do seguro |
| PWA/domínio | OK — wrapper v130 e service worker `gvg-shell-v3` |

## Desempenho

Medição no Chromium, viewport 1440×1000, após login, mesma rede:

| Métrica | Antes (v127) | Depois (v130) |
|---|---|---|
| Login → dashboard visível | ~4,54 s | ~3,13 s (média de 3 execuções: 2,90–3,38 s) |
| Login → cinco métricas preenchidas | ~7,39 s | ~6,16 s (média: 5,84–6,61 s) |
| Nós no DOM | 533 | 633 |
| Long tasks na carga | 2 (50 ms e 95 ms) | 1–3 (95–194 ms na primeira execução; ~95–98 ms nas seguintes) |
| Long tasks durante a rotação | não medida | nenhuma |
| Novas dependências | — | nenhuma |
| Novos assets | — | 20 KB (256 px) + 32 KB (384 px); o navegador escolhe um |

A primeira execução após a publicação teve uma long task maior (≈194 ms), compatível com compilação/renderização inicial. As execuções seguintes ficaram na faixa de 95–98 ms, próxima da linha de base. A carga até o dashboard e até os dados ficou mais rápida no teste.

## Ponto de recuperação

- Tag: `pre-layout-catalogo-v127`
- Backup: `/home/pcnovo/backups-layout-catalogo-2026-11-11/`
- Versão anterior do painel: **127**
- Versão publicada: **130**
- Para voltar: publicar a versão 127 na implantação `AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL` e restaurar o wrapper para `v=127`.

## Pendências e limites

- Os atalhos abrem o módulo correspondente; não alterei os fluxos internos para abrir diretamente um formulário específico, conforme a restrição de mexer apenas no visual.
- A busca filtra os cinco cartões no navegador; não pesquisa registros dentro dos aplicativos.
- O sininho abre o Frotas; a central de notificações continua sendo a existente no próprio Frotas.
- A confirmação final de instalação/visual do PWA em aparelho físico continua manual.
