# Arquitetura — GVG&ARTEFAL

## Visão geral

O painel é uma web app do Google Apps Script vinculada à planilha nova. Um único link `/exec` entrega o shell do painel; o módulo Pedidos é servido pela mesma implantação com `?modulo=pedidos` e carregado em um iframe na área principal.

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
- **Dois layouts da visão geral**: o layout A (Executivo) e o layout B (Monitor) usam os mesmos dados. Um temporizador de 10 segundos alterna os layouts com transição, atualiza os indicadores e pode ser pausado. A rotação só ocorre na Visão geral; ao abrir Pedidos ou uma integração futura, ela é suspensa.
- **Apps Script vinculado**: o projeto novo foi criado com `parentId` igual à planilha nova. Assim, planilha e código ficam dentro da pasta GVG&ARTEFAL; o projeto aparece embutido na planilha no Drive.
- **Uma implantação**: o mesmo deployment serve o painel e o módulo, reduzindo links e evitando duplicidade de versões.
- **Base independente**: nenhuma fórmula ou função do painel aponta para a planilha antiga. A única cópia de produção foi o registro do administrador (hash de senha) para preservar o acesso existente.

## Backend (`src/Code.gs`)

- Constantes: `GVG_SPREADSHEET_ID`, `GVG_BASE_FOLDER_ID`, `GVG_FOTOS_FOLDER_ID`, `GVG_ANEXOS_FOLDER_ID`.
- `doGet(e)`: roteia para `doGetPainel_` ou `doGetPedidos_`.
- `getPainelInicial(sessao)`: valida a sessão e devolve indicadores, recentes e mais solicitados. Não cria dados.
- Funções originais de Pedidos preservadas: catálogo, solicitações, usuários, sessões, auditoria, entrega, fotos e gestão.
- `enviarFotoProduto` grava na pasta nova `04 - Fotos de Produtos` via `GVG_FOTOS_FOLDER_ID`.
- `autorizarAmbiente` e `testarNovaBase` são funções auxiliares de diagnóstico.

## Frontend

- `src/Painel.html`: shell corporativo, menu lateral fixo/recolhível, cartões com profundidade discreta, login próprio, indicadores e iframe do Pedidos. CSS todo prefixado com `gvgp-` e escopo `#gvgpApp`.
- `src/index.html`: cópia do aplicativo Pedidos, com alterações mínimas:
  - `<base target="_self">` para navegação interna no iframe;
  - favicon local em data URI;
  - nenhuma alteração visual ou funcional no catálogo, carrinho, gestão ou login.

## Dados

A planilha nova tem as abas `PRODUTOS`, `CATEGORIAS`, `OBRAS`, `CONFIG`, `PEDIDOS`, `ITENS_PEDIDO`, `AUDITORIA`, `GVG_USUARIOS`, `SESSOES_GVG`, `PEDIDOS_USUARIOS` e `LEIA-ME`. Os cabeçalhos e validações seguem o código original; as fórmulas de indicadores ficam na aba `LEIA-ME`.

## Limitações

- O aplicativo original não possui anexos por pedido; somente foto de produto e conferência de entrega.
- O envio ao WhatsApp é manual e ocorre no navegador do usuário; o servidor apenas registra a solicitação.
- A implantação é anônima para permitir o link único; a proteção dos dados é feita pelo login próprio e pelas validações de sessão/perfil no servidor.
