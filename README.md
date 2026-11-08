# GVG&ARTEFAL — Painel Interno

Painel interno acessível por um único link, com o módulo **Pedidos** integrado na primeira etapa. O layout e as funções do aplicativo de Pedidos foram preservados e carregados em uma área isolada do painel.

## Link oficial (GitHub Pages)

**https://higoragenteia.github.io/gvg-artefal/**

O GitHub Pages abre o painel embutido e oculta a faixa azul do Google Apps Script. O login é o mesmo do aplicativo e funciona no desktop e no celular.

### Link direto do Apps Script (alternativa)

**https://script.google.com/macros/s/AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL/exec**

- A implantação está como **QUALQUER PESSOA** (acesso anônimo ao shell).
- O login é próprio do sistema (usuário/e-mail + senha), com sessões gravadas na planilha nova.
- O módulo Pedidos é aberto pelo menu lateral **Pedidos**, dentro do mesmo painel.
- O acesso à **Gestão** continua restrito ao perfil ADMIN, validado no servidor.

## Links do projeto

| Item | Link |
|---|---|
| Link oficial (GitHub Pages) | https://higoragenteia.github.io/gvg-artefal/ |
| Painel direto no Apps Script (alternativa) | https://script.google.com/macros/s/AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL/exec |
| Código completo do app Pedidos | [`src/index.html`](src/index.html) — 199 KB, 983 linhas, catálogo/carrinho/gestão completos |
| Shell do painel | [`src/Painel.html`](src/Painel.html) |
| Backend Apps Script | [`src/Code.gs`](src/Code.gs) |
| Repositório | https://github.com/higoragenteia/gvg-artefal |

## Recursos novos

| Recurso | Referência |
|---|---|
| GitHub Pages | [Abrir link oficial](https://higoragenteia.github.io/gvg-artefal/) |
| Pasta principal no Drive | [GVG&ARTEFAL](https://drive.google.com/drive/folders/1eWXZren3iZClUFg4GU0yTIMg1h4__hb2) |
| Planilha ativa (cópia de teste do app oficial) | [APLICATIVO DE PEDIDOS - CÓPIA TESTE](https://docs.google.com/spreadsheets/d/19bO6gkJX9yre2a3Qzt5EUxsNacj_-sR9C6hrz-UhBG4/edit) |
| Pasta do app oficial copiado | [07 - App Pedidos Oficial (teste)](https://drive.google.com/drive/folders/1L5L4vFmlyaMMTIcVwEeGnnpqrT9CoXgI) |
| Planilha de teste anterior (backup) | [GVG&ARTEFAL - Base de Dados](https://docs.google.com/spreadsheets/d/1i_P-BGv3GROHrVCUh8ifHxOk6gpi5rucLADvAOzgOrA/edit) |
| Origem oficial (intacta) | [PLANILHA DE PEDIDOS](https://drive.google.com/drive/folders/1IZ05GppQ5XkipMGPJo95M6TiznLq5VIq) |
| Fotos oficiais originais (intactas) | [GVG CATALOGO - FOTOS DOS PRODUTOS](https://drive.google.com/drive/folders/1Rg8aAL7RI--SVqYIymFs3G-GHn06ryIF) |
| Apps Script novo (vinculado à planilha) | [Editor do projeto](https://script.google.com/d/1E98hK1UhabSftMUnCR1j1Jm_XHfQZeTqv96PfqT9h26HND-Zyw1bOBfS/edit) |
| Script ID | `1E98hK1UhabSftMUnCR1j1Jm_XHfQZeTqv96PfqT9h26HND-Zyw1bOBfS` |
| Implantação web | `AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL` |
| Repositório privado | https://github.com/higoragenteia/gvg-artefal |
| Base ativa | 297 produtos, 40 pedidos e 177 fotos oficiais copiados |
| Manifesto das fotos | `docs/fotos-oficiais-manifest.csv` |

## Estrutura da pasta no Drive

```
GVG&ARTEFAL/
├── 01 - Planilhas/
│   └── GVG&ARTEFAL - Base de Dados
├── 02 - Apps Script/
│   └── LEIA-ME - Apps Script.txt (ponteiro para o projeto vinculado)
├── 03 - Anexos de Pedidos/
│   └── LEIA-ME - Anexos.txt
├── 04 - Fotos de Produtos/
│   └── produto-....jpg (foto de teste do fluxo anterior)
├── 05 - Identidade Visual/
│   └── icone-gvg-artefal.png
├── 06 - Documentacao/
│   ├── ...
└── 07 - App Pedidos Oficial (teste)/
    ├── APLICATIVO DE PEDIDOS - CÓPIA TESTE
    ├── GVG CATALOGO - FOTOS DOS PRODUTOS/ (177 fotos)
    ├── MAPA-FOTOS-OFICIAIS.csv
    └── LEIA-ME - ORIGEM E CÓPIA.txt
```

O Apps Script é **vinculado à planilha de teste original** e abre a planilha ativa por ID; a pasta `02 - Apps Script` contém o ponteiro e as instruções. Nenhum arquivo novo do projeto foi deixado na raiz do Drive; os dois artefatos temporários de teste (`__GVG_TESTE_HELPER__` e `__GVG_TESTE_BOUND__`) foram movidos para a lixeira.

## Módulos do menu

- **Visão geral** — indicadores calculados da base ativa: pedidos, em andamento, entregues, itens, produtos ativos, obras ativas, pedidos recentes e mais solicitados. Com base vazia, exibe estado vazio com atalho para Pedidos. A visão alterna automaticamente entre **dois layouts** (Executivo e Monitor) a cada **30 segundos**, com transição; o botão **Pausar/Retomar** fica no topo. Os dados são atualizados a cada troca.
- **Abertura dos módulos** — Pedidos, Gastos, Fornecedores e Máquinas abrem em **tela ampliada**, ocupando toda a área útil ao lado do menu; a topbar do painel é recolhida e o retorno é pela **Visão geral**.
- **Pedidos** — aplicativo original preservado: catálogo, carrinho, obras, solicitação, histórico do usuário, Gestão, disponibilidade de produtos, relatório, conferência de entrega e foto de produto.
- **Controle de Gastos** — app oficial integrado ao painel, com dashboard financeiro, despesas, orçamento, saldo, cadastros e usuários; usa a cópia de teste da planilha de Gastos e fica disponível somente para administradores.
- **Fornecedores** — app oficial integrado ao painel, com fornecedores, produtos/serviços, cotações, comparação de preços, compras, relatórios, usuários e configurações; usa a cópia de teste da planilha de Fornecedores e fica disponível somente para administradores.
- **Controle de Máquinas** — app oficial integrado ao painel, com equipamentos, colaboradores, categorias, movimentações, manutenções, usuários e auditoria; usa a cópia de teste da planilha de Máquinas, login próprio e fica disponível somente para administradores.
- **Frotas** — sinalizado como **Em breve**; abre uma tela de integração futura, sem alterar Pedidos, Gastos, Fornecedores e Máquinas.

## Abas da planilha ativa (cópia oficial)

`PRODUTOS`, `CATEGORIAS`, `OBRAS`, `CONFIG`, `PEDIDOS`, `ITENS_PEDIDO`, `AUDITORIA`, `GVG_USUARIOS`, `SESSOES_GVG`, `PEDIDOS_USUARIOS` e `LEIA-ME`.

Recursos aplicados: cabeçalhos, validações de lista e numéricas, formatos de data, congelamento de cabeçalho, filtros, formatação condicional e fórmulas de indicadores na aba `LEIA-ME`. A base ativa é uma **cópia de teste do app oficial de Pedidos**: 297 produtos, 40 pedidos e 177 fotos copiadas com verificação de MD5. O WhatsApp permanece fictício e as sessões antigas foram limpas. A planilha de teste anterior (`1i_P-BG...`) continua como backup.

## Segurança e isolamento

- Nenhuma credencial, chave privada ou `client_secret` foi copiada para o repositório ou para o navegador.
- O hash da senha do administrador existente foi copiado da base original; a senha em texto não é conhecida nem armazenada pelo projeto.
- Os usuários de teste usados na validação (`teste.admin` e `teste.usuario`) foram removidos, junto com suas sessões.
- O número de WhatsApp em `CONFIG` é fictício. O servidor não envia WhatsApp, e-mail ou notificação; o compartilhamento é manual no aplicativo, como no fluxo original.
- A cópia de teste inclui os usuários, pedidos e auditoria oficiais, pois o aplicativo foi trazido como um todo. As sessões antigas foram limpas e o WhatsApp está fictício para evitar envios reais.
- A planilha, o script, a implantação e a pasta de fotos oficiais originais não foram alterados; foram usados somente para leitura e cópia. O original permanece em `PLANILHA DE PEDIDOS`.

## Como atualizar

O código-fonte está em `src/` e o projeto está vinculado pelo `.clasp.json`.

```bash
cd gvg-artefal
clasp push
clasp create-version "descrição"
clasp update-deployment <deploymentId> -V <versão>
```

O painel e o módulo Pedidos usam a mesma implantação; atualizações de código não exigem reinstalação nos aparelhos.

## Pendências desta etapa

1. Integrar **Frotas** (item já reservado no menu). **Controle de Gastos**, **Fornecedores** e **Controle de Máquinas** já estão integrados.
2. O aplicativo de Pedidos original não possui fluxo de anexos por pedido. Foram mantidos apenas os fluxos existentes (foto de produto e conferência de entrega). A pasta `03 - Anexos de Pedidos` está preparada para uma etapa futura.
3. Substituir o número fictício de WhatsApp em `CONFIG!B2` antes de uso em produção.
4. O pedido fictício de teste pode ser mantido para demonstração ou removido pela Gestão/planilha após a validação.
