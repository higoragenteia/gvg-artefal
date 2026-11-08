# Testes realizados — 05/11/2026

Ambiente: navegador Chromium 156, conta administradora existente, base nova `GVG&ARTEFAL - Base de Dados`.

## Origem identificada (somente leitura)

- Repositório: `higoragenteia/gvg-pedidos`.
- Apps Script: `1R5vYtduycRs5gV7fkn-akasrBoyjRmxsr36lkinmUcOA5XqvLbeo47zc`.
- Planilha: `1tIy8EZpWKnD-tSl7cGMPX0cRBZwLIJYD6APD862ZKws`.
- Implantação antiga: `AKfycbzobPnorpwc2geTu-Tq37FwLfBtSb9knz3h_KsF6bx-yBtgwF-UKsY5_5vD-TyFZV9yMQ`.

## Estrutura e implantação

- Pasta `GVG&ARTEFAL` criada antes dos demais recursos, com seis subpastas.
- Planilha nova criada dentro de `01 - Planilhas`.
- Apps Script novo vinculado à planilha (`parentId`), com deployment web próprio.
- Nenhum arquivo novo do projeto ficou na raiz do Drive.

## Layout e navegação

| Teste | Resultado |
|---|---|
| Link único abre o painel | OK — título `GVG&ARTEFAL` |
| Acesso anônimo ao shell (sem login Google) | OK |
| Menu lateral fixo no desktop (1440×900) | OK — sidebar `fixed`, largura 268 px, menu hambúrguer oculto |
| Menu recolhível no celular (390×844) | OK — hambúrguer visível, sidebar off-canvas, cartões em 2 colunas |
| Visão geral | OK — KPIs, recentes, mais solicitados e mini-indicadores |
| Dois layouts da visão geral | OK — Executivo (claro) e Monitor (escuro) |
| Rotação automática a cada 10s | OK — alternou A→B→A com transição e atualização dos dados |
| Controle Pausar/Retomar | OK — pausou, manteve o layout e retomou a rotação |
| Estado vazio antes do primeiro pedido | OK — KPIs zerados e cartão “A base ainda não tem pedidos” |
| Abrir Pedidos pelo menu | OK — iframe carregado na área principal, menu mantido no desktop |
| Controle de Gastos | OK — app oficial integrado em iframe, login próprio, dashboard e permissão de administrador |
| Fornecedores | OK — app oficial integrado em iframe, login próprio, dashboard e permissão de administrador |
| Controle de Máquinas | OK — app oficial integrado em iframe, login próprio, dashboard e permissão de administrador |
| Frotas | OK — selo “Em breve” e tela de integração futura |
| Ícones do menu lateral | OK — efeito 3D dourado em Visão geral, Pedidos, Gastos, Fornecedores, Máquinas e Frotas |
| Abertura dos módulos | OK — modo expandido ocupando toda a área útil; retorno pela Visão geral |
| Correção do menu lateral | OK — logo e ícone de instalação embutidos; rodapé “Versão funcional” visível e navegação com rolagem em telas baixas |
| Topbar no celular | OK — relógio acima do nome do usuário, sem sobrepor título ou subtítulo |
| Voltar à visão geral | OK |

## Login e permissões

| Teste | Resultado |
|---|---|
| Login de administrador de teste | OK — perfil ADMIN, indicadores exibidos |
| Sessão preservada após recarregar | OK |
| Gestão visível para ADMIN | OK |
| Login de usuário comum de teste | OK — perfil CONSULTA |
| Gestão oculta para usuário comum | OK — `display:none` |
| Chamada administrativa com token de usuário comum | OK — servidor recusou: “Credencial de administrador inválida.” |
| Login do administrador real (sessão técnica temporária, sem alterar senha) | OK — Higor José / ADMIN / Gestão visível |

## Pedidos

Pedido fictício: `PED-20261105-8015B6`  
Obra: `Obra Demo Centro`  
Itens: 1 Pacote de Parafuso 4,2x16 (100 un.) + 1 Caixa de Silicone neutro (24 un.)

| Teste | Resultado |
|---|---|
| Cadastro pela interface do módulo | OK — pedido gravado em `PEDIDOS` e `ITENS_PEDIDO` |
| Recarregar o painel e consultar | OK — pedido apareceu em “Pedidos recentes” e na Gestão |
| Histórico do usuário | OK — pedido e itens aparecem em “Meu histórico” |
| Conferência de entrega parcial | OK — 1 Pacote entregue, 1 Caixa não enviada com observação |
| Status após conferência | OK — `ENTREGUE PARCIAL` |
| Auditoria | OK — linha `ENTREGA` com “ENTREGUE PARCIAL; 100 unidades equivalentes” |
| Edição de produto | OK — produto salvo e linha `EDITAR` na auditoria |
| Upload de foto de produto | OK — JPEG gravado em `04 - Fotos de Produtos`, URL salva em `PRODUTOS!H2` |
| Isolamento de WhatsApp | OK — popup interceptado no teste; nenhuma mensagem enviada; número fictício em `CONFIG` |

## Isolamento e limpeza

- A planilha e o script antigos não foram alterados.
- Nenhum gatilho, `MailApp` ou envio automático foi criado.
- Usuários de teste `teste.admin` e `teste.usuario` e suas sessões foram removidos.
- Os recursos temporários `__GVG_TESTE_HELPER__` e `__GVG_TESTE_BOUND__` foram movidos para a lixeira.
- O pedido fictício permanece na base nova para demonstração; a observação contém “NÃO ENVIAR”.

## Integração do Controle de Gastos (08/11/2026)

| Teste | Resultado |
|---|---|
| Cópia da planilha oficial | OK — 8 abas e fórmulas preservadas; original com `modifiedTime` inalterado |
| Código oficial integrado | OK — `Código` e `Index` preservados no projeto do painel; `book_()` aponta para a cópia de teste |
| Login do painel como Admin | OK — menu Controle de Gastos ativo e iframe carregado |
| Login do app de Gastos | OK — dashboard com orçamento de R$ 26.000,00 |
| Lançamento de despesa | OK — gravado na Base de Dados e auditado |
| Exclusão da despesa de teste | OK — linha removida e auditoria registrada |
| Operador | OK — menu de Gastos oculto e cartão bloqueado com aviso; Pedidos permanece disponível |
| Pedidos após a integração | OK — catálogo com 297 produtos |
| Saída do painel | OK — sessão do Gastos encerrada e tela de login restaurada |
| Limpeza | OK — usuários, sessões e despesas de teste removidos; somente a cópia organizada permanece |

## Integração do Controle de Fornecedores (08/11/2026)

| Teste | Resultado |
|---|---|
| Cópia da planilha oficial | OK — 9 abas preservadas; original com `modifiedTime` inalterado |
| Código oficial integrado | OK — `Code` e `Index` preservados no projeto do painel, isolados em namespace próprio |
| Login do painel como Admin | OK — menu Fornecedores ativo e iframe carregado |
| Login do app de Fornecedores | OK — dashboard com 20 fornecedores, 8 produtos e 8 cotações |
| Navegação | OK — Fornecedores, Produtos, Cotações, Compras e Gestão de Usuários |
| Cadastro de fornecedor | OK — fornecedor de teste gravado na base e removido na limpeza |
| Operador | OK — menu de Fornecedores oculto e cartão bloqueado com aviso |
| Pedidos após a integração | OK — catálogo com 297 produtos |
| Gastos após a integração | OK — dashboard e login continuam funcionando |
| Saída do painel | OK — sessão de Fornecedores encerrada e tela de login restaurada |
| Limpeza | OK — usuários, sessões, fornecedor e históricos de teste removidos |

## Integração do Controle de Máquinas (08/11/2026)

| Teste | Resultado |
|---|---|
| Cópia da planilha oficial | OK — 22 abas preservadas; original com `modifiedTime` inalterado |
| Backend oficial integrado | OK — 7 arquivos preservados e isolados em namespace próprio; API em `?modulo=maquinas-api` |
| Frontend oficial integrado | OK — HTML, CSS e JS oficiais servidos pelo painel; service worker desativado dentro do iframe |
| Admin do usuário | OK — `higorjose.gvgesquadrias@gmail.com` configurado como ADMINISTRADOR na cópia de teste |
| Login do painel como Admin | OK — menu Máquinas ativo e iframe carregado |
| Login do app de Máquinas | OK — dashboard com 50 equipamentos e 27 disponíveis |
| Resumo no painel | OK — card mostra 27 equipamentos disponíveis |
| Operador | OK — menu de Máquinas oculto e cartão bloqueado com aviso |
| Saída do painel | OK — sessão de Máquinas encerrada e token local removido |
| Limpeza | OK — usuários, sessões e auditorias de teste removidos |

## Pendências

- Integrar Frotas. Controle de Gastos, Fornecedores e Controle de Máquinas já estão integrados.
- Criar fluxo de anexos por pedido em etapa futura (o app original não possui).
- Trocar o WhatsApp fictício antes de produção.

## Migração do app oficial (06/11/2026)

| Teste | Resultado |
|---|---|
| Fotos copiadas | OK — 177/177, bytes e MD5 idênticos |
| Produtos na cópia | OK — 297, todos com foto |
| URLs de fotos atualizadas | OK — 172 linhas, 168 IDs únicos; 125 URLs externas preservadas |
| Origem intacta | OK — 177 fotos / 20.179.061 bytes; planilha oficial com modifiedTime inalterado |
| Sessões da cópia | OK — 23 sessões antigas removidas |
| WhatsApp de teste | OK — número fictício `5500000000000` |
| Painel com a cópia | OK — 40 pedidos e catálogo com 297 produtos |
