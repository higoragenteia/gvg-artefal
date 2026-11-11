# Arquitetura — GVG&ARTEFAL

## Visão geral

O painel é uma web app do Google Apps Script vinculada à planilha nova. Um único link `/exec` entrega o shell do painel; os módulos Order Catalog, Gastos, Fornecedores, Máquinas e Frotas são servidos pela mesma implantação com `?modulo=...` e carregados em iframes na área principal.

```
Navegador
  └── Apps Script /exec (shell do painel GVG&ARTEFAL)
        ├── Visão geral: google.script.run → getPainelInicial(sessao)
        └── iframe /exec?modulo=pedidos
              └── aplicativo Pedidos original (HTML/CSS/JS preservado)
                    └── google.script.run → Code.gs (planilha nova)
```

## Decisões

- **Iframe**: isola o CSS e o comportamento do aplicativo original, preservando o layout sem conflito com o painel. O login e a sessão ficam no mesmo armazenamento de origem do Apps Script e são reaproveitados pelo módulo.
- **Dois layouts da visão geral**: o layout A (Executivo) e o layout B (Monitor) usam os mesmos dados. Um temporizador de 30 segundos alterna os layouts com transição, atualiza os indicadores e pode ser pausado. A rotação só ocorre na Visão geral; ao abrir Pedidos ou uma integração futura, ela é suspensa.
- **Apps Script vinculado**: o projeto novo foi criado com `parentId` igual à planilha nova. Assim, planilha e código ficam dentro da pasta GVG&ARTEFAL; o projeto aparece embutido na planilha no Drive.
- **Uma implantação**: o mesmo deployment serve o painel e o módulo, reduzindo links e evitando duplicidade de versões.
- **Base ativa**: o painel aponta para a cópia de teste do app oficial de Pedidos (`19bO6...`). A planilha original (`1tIy...`) e a pasta de fotos oficial (`1Rg8...`) permanecem intactas; o app foi copiado como um todo, com 177 fotos verificadas por MD5.

## Backend (`src/Code.gs`)

- Constantes: `GVG_SPREADSHEET_ID`, `GVG_BASE_FOLDER_ID`, `GVG_FOTOS_FOLDER_ID`, `GVG_ANEXOS_FOLDER_ID`.
- `doGet(e)`: roteia para `doGetPainel_` ou `doGetPedidos_`.
- `getPainelInicial(sessao)`: valida a sessão e devolve indicadores, recentes e mais solicitados. Não cria dados.
- Funções originais de Pedidos preservadas: catálogo, solicitações, usuários, sessões, auditoria, entrega, fotos e gestão.
- `enviarFotoProduto` grava na pasta de fotos da cópia oficial (`1eBVC...`) via `GVG_FOTOS_FOLDER_ID`.
- `autorizarAmbiente` e `testarNovaBase` são funções auxiliares de diagnóstico.

## Frontend

- `src/Painel.html`: shell corporativo, menu lateral fixo/recolhível, cartões com profundidade discreta, login próprio, indicadores e iframe do Pedidos. CSS todo prefixado com `gvgp-` e escopo `#gvgpApp`.
- `src/index.html`: cópia do aplicativo Pedidos, com alterações mínimas:
  - `<base target="_self">` para navegação interna no iframe;
  - favicon local em data URI;
  - nenhuma alteração visual ou funcional no catálogo, carrinho, gestão ou login.

## Dados

A planilha ativa é a cópia de teste do app oficial (`19bO6...`), com as abas `PRODUTOS`, `CATEGORIAS`, `OBRAS`, `CONFIG`, `PEDIDOS`, `ITENS_PEDIDO`, `AUDITORIA`, `GVG_USUARIOS`, `SESSOES_GVG`, `PEDIDOS_USUARIOS`, `BACKUP_PRODUTOS_20261026` e `LEIA-ME`. Os 297 produtos e as 177 fotos oficiais foram copiados; o WhatsApp está fictício e as sessões antigas foram limpas.

## Módulo Frotas (v127)

- `src/Frotas.gs`: backend original do Controle de Frotas isolado em `GVG_FROTAS_MODULE` para não colidir com as funções do painel. Expõe apenas `frotasApiCall`.
- `src/FrotasIndex.html`: frontend original preservado; recebe a sessão do painel por `localStorage` (`gvgUsrToken`) e envia o token como quarto argumento para `frotasApiCall`.
- `doGetFrotas_(e)`: serve o módulo e injeta `initialAlert` para o deep link de notificação.
- `gvguAcessoPainel_(token, 'frotas')`: valida a permissão no backend. **Visualizar** vira `CONSULTA` (somente leitura); **Operar/Gerenciar** viram `ADMIN` (escrita). **Gerenciar** recebe `canManage=true`.
- O módulo não tem login próprio no painel e recusa acesso direto sem sessão do painel (`AUTH_REQUIRED_PAINEL`).
- A planilha oficial do Frotas e o app de push Firebase permanecem externos ao painel.
- O wrapper PWA encaminha `view` e `alerta` para o `/exec`, permitindo que o toque na notificação abra o veículo correto.

## Limitações

- O aplicativo original não possui anexos por pedido; somente foto de produto e conferência de entrega.
- O envio ao WhatsApp é manual e ocorre no navegador do usuário; o servidor apenas registra a solicitação.
- A implantação é anônima para permitir o link único; a proteção dos dados é feita pelo login próprio e pelas validações de sessão/perfil no servidor.
