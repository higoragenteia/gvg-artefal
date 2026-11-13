# Modo foco dos projetos + Código referente + cotações — v134 (13/11/2026)

## 1. Modo foco ao abrir um projeto

Quando um dos cinco módulos é aberto, o painel entra em modo foco:

- o iframe do projeto ocupa **100% da largura e da altura** da área disponível;
- a topbar do painel é recolhida no desktop;
- a sidebar esquerda fica recolhida fora da tela;
- uma aba discreta com **três pontos** aparece na borda esquerda, no centro;
- ao clicar nos três pontos, a sidebar completa entra como **sobreposição**, com fundo escurecido;
- clicar fora da sidebar, pressionar **Esc** ou escolher outro módulo fecha o menu;
- ao voltar para **Visão geral**, a sidebar e a topbar voltam exatamente como antes;
- no celular, o comportamento existente é preservado: topbar com menu hambúrguer e sidebar off-canvas.

Nenhum dado, API, permissão, Firebase, notificação ou PWA foi alterado por esse modo.

## 2. Código referente no cadastro de produtos

O cadastro de produtos do Order Catalog ganhou o campo **Código referente**.

- A planilha `PRODUTOS` recebeu a coluna **I — Código referente**.
- O campo aparece no formulário **Gestão → Cadastrar / editar produto**.
- Pode ser preenchido, alterado ou apagado em qualquer produto.
- O código referente aparece:
  - na lista de produtos da Gestão;
  - no seletor de produto para edição;
  - no catálogo do colaborador;
  - no carrinho;
  - na busca do catálogo e da Gestão.
- O **Código interno** existente (coluna A, como `273`, `101`, `PT01`) permanece estável. Ele é a chave usada pelos pedidos, itens, vínculos e auditoria.
- Produtos novos continuam recebendo um código interno automático (`GVG-XXXXXXXX`), mas agora podem receber também o código referente do fornecedor/fabricante.
- Salvar um produto grava a coluna I e invalida o cache `gvg_catalogo_v4`; o catálogo passa a devolver o campo `referencia`.

### Por que o código interno não é editável

Alterar a coluna A de um produto existente quebraria pedidos antigos, itens, vínculos e históricos. Por isso, a edição solicitada foi implementada como **Código referente** (coluna I), independente e segura, sem migração dos registros existentes.

## 3. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/Painel.html` | modo foco, aba de três pontos, sidebar sobreposta, CSS e eventos |
| `src/Code.gs` | coluna I, `gvgGarantirRefProduto_`, `adminListar`, `salvarProduto`, `getCatalogo`, cache v4 |
| `src/index.html` | campo `editReferencia`, carga/gravação, exibição na Gestão, catálogo e carrinho, busca |
| `docs/index.html` | wrapper `v=134&ui=foco-ref` |
| `docs/sw.js` | cache `gvg-shell-v5` |
| `deploy.json` | versão 134 |
| `docs/PERMISSOES.md`, `docs/OTIMIZACOES.md`, `docs/DEPLOY.md`, `docs/TESTES.md` | versão e evidências |

## 4. Testes executados

### Modo foco — desktop 1440×1000

| Teste | Resultado |
|---|---|
| Abrir Order Catalog pelo atalho | OK |
| Iframe em tela cheia | OK — 1440 px de largura, main com margem 0 |
| Sidebar recolhida | OK — fora da tela |
| Topbar recolhida | OK |
| Aba de três pontos visível | OK — 24 px na borda esquerda |
| Clique nos três pontos | OK — sidebar completa sobreposta, backdrop escuro |
| Fechar pelo backdrop | OK |
| Abrir Gastos pelo menu sobreposto | OK — menu fecha e Gastos ocupa a tela |
| Voltar para Visão geral | OK — sidebar e topbar restauradas |
| Erros de JavaScript | Nenhum |

### Modo foco — celular 390×844

| Teste | Resultado |
|---|---|
| Abrir Order Catalog | OK — iframe com 390 px |
| Três pontos | Oculto, pois o menu hambúrguer existente já atende |
| Menu hambúrguer | OK — sidebar off-canvas abre e fecha |
| Topbar | OK — preservada no celular |

### Código referente

| Teste | Resultado |
|---|---|
| Cabeçalho da coluna I | OK — `Código referente` |
| `adminListar` devolve referência | OK |
| Criar produto com referência pelo backend | OK — `GVG-22A27970` / `REF-TESTE-...` |
| `getCatalogo` devolve referência | OK |
| Alterar referência | OK — `REF-TESTE-...-EDITADO` |
| Campo visível na Gestão | OK |
| Carregar produto no formulário | OK — referência preenchida |
| Salvar referência pela interface | OK — `REF-UI-...` gravada |
| Lista de produtos | OK — referência exibida quando preenchida |
| Catálogo/carrinho | OK — referência exibida quando preenchida |
| Busca | OK — referência incluída no texto pesquisável |
| Limpeza | OK — produto de teste removido; 304 produtos reais preservados |
| Código interno dos 304 produtos | OK — coluna A não foi alterada |

### Cotações do Fornecedores — v134

| Teste | Resultado |
|---|---|
| Cotações carregadas | OK — 12 registros |
| Miniaturas renderizadas | OK — 12 elementos `.thumb` e 12 imagens |
| Imagens carregadas na amostra | OK — 9 de 12; as demais seguem carregando de forma lazy |
| Exibição visual na tela | OK — miniaturas visíveis na lista de cotações |

## 5. Ponto de recuperação

- Tag: `pre-focus-refcode-v130`
- Backup: `/home/pcnovo/backups-focus-refcode-2026-11-13/`
- Versão anterior: **130**
- Versão publicada: **134** (versão 139 do script)
- Para voltar: publicar a versão 130 na implantação `AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL` e restaurar o wrapper para `v=130`.

## 6. Publicação e integração com o repositório remoto

- A **v134** está publicada e reúne o modo foco, o Código referente e as **miniaturas nas cotações do Fornecedores** (commit `91958be`).
- A implantação principal `AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL` aponta para a **versão 139 do script**, com o mesmo conteúdo do repositório.
- O wrapper do domínio foi atualizado para `v=134&ui=foco-ref` e o service worker para `gvg-shell-v5`.
- A publicação temporária usada na limpeza foi excluída; o usuário de teste `teste.ajuste@example.com` e suas 10 sessões foram removidos.

## 7. Pendências e limites

- O código interno (coluna A) continua protegido contra edição para não quebrar pedidos. O campo novo atende à criação/edição de códigos referenciais.
- Se for necessário renomear o código interno de um produto já usado, será preciso um procedimento de migração que atualize também `ITENS_PEDIDO`, vínculos e auditoria.
- A confirmação visual em dispositivo físico do PWA continua manual.
