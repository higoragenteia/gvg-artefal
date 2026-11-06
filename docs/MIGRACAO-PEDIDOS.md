# Migração do app oficial de Pedidos — 06/11/2026

## Resultado

O aplicativo oficial de Pedidos foi copiado **como um todo** para o ambiente de teste, sem mover, alterar ou apagar nada da origem. O painel GVG&ARTEFAL passou a usar a cópia ativa, mantendo os layouts, ícones, efeito de digitação e demais ajustes já aprovados.

## Origem — mantida intacta

| Item | ID / link |
|---|---|
| Pasta `PLANILHA DE PEDIDOS` | `1IZ05GppQ5XkipMGPJo95M6TiznLq5VIq` |
| Planilha `APLICATIVO DE PEDIDOS` | `1tIy8EZpWKnD-tSl7cGMPX0cRBZwLIJYD6APD862ZKws` |
| Pasta `GVG CATALOGO - FOTOS DOS PRODUTOS` | `1Rg8aAL7RI--SVqYIymFs3G-GHn06ryIF` |
| Fotos na origem | 177 arquivos / 20.179.061 bytes |
| Última modificação da planilha de origem | `2026-11-05T22:36:00.180Z` (inalterada) |

## Cópia ativa no ambiente de teste

| Item | ID / link |
|---|---|
| Pasta `07 - App Pedidos Oficial (teste)` | `1L5L4vFmlyaMMTIcVwEeGnnpqrT9CoXgI` |
| Planilha `APLICATIVO DE PEDIDOS - CÓPIA TESTE` | `19bO6gkJX9yre2a3Qzt5EUxsNacj_-sR9C6hrz-UhBG4` |
| Pasta `GVG CATALOGO - FOTOS DOS PRODUTOS` (cópia) | `1eBVC5bV7wOqUszfS6roN5eYl5IZkXbLZ` |
| Manifesto com IDs e MD5 | [`fotos-oficiais-manifest.csv`](fotos-oficiais-manifest.csv) |

## Conferência

- **177 de 177 fotos** copiadas; **177 MD5 iguais** e soma de bytes idêntica (20.179.061).
- **297 produtos** na cópia, todos com foto.
- **172 linhas** de produtos com URL de foto atualizada para o novo ID; **168 IDs únicos** de fotos do catálogo.
- **125 URLs externas** (fora do Drive) preservadas.
- **176 fotos** mantiveram o compartilhamento “qualquer pessoa com o link”; **1 foto privada** permaneceu privada.
- `SESSOES_GVG` da cópia limpo (23 sessões antigas removidas).
- `WHATSAPP_DESTINO` da cópia trocado para `5500000000000` (fictício), evitando envios reais.
- `AMBIENTE=TESTE` e `TITULO_APP=GVG&ARTEFAL | Pedidos` na cópia.
- Usuários, pedidos e auditoria oficiais copiados, pois o app foi trazido como um todo.
- Painel validado: **40 pedidos registrados** e catálogo com **297 produtos** no iframe.

## O que permanece como estava

- A pasta original `PLANILHA DE PEDIDOS` e a planilha oficial.
- A pasta original `GVG CATALOGO - FOTOS DOS PRODUTOS` com as 177 fotos.
- A pasta `FOTOS_PRODUTOS_GVG_ARTEFAL` (9 subpastas por categoria) na raiz do Drive.
- A planilha de teste anterior `1i_P-BGv3GROHrVCUh8ifHxOk6gpi5rucLADvAOzgOrA` e sua foto de teste em `04 - Fotos de Produtos`.
- O código, os dois layouts, os ícones 3D, o fundo 4K e o efeito de digitação do nome.

## Versão publicada

- Versão **32** da implantação web.
- Link: https://script.google.com/macros/s/AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL/exec
