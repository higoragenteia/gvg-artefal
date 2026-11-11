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
| Aviso por voz em segundo plano | OK — consulta e áudio continuam com a aba oculta/minimizada; o navegador pode atrasar a verificação |
| Atualização automática da Gestão | OK — painel e histórico atualizados a cada 120 segundos; formulário de produto e conferência de entrega abertos foram preservados; pedido de teste apareceu e saiu da lista automaticamente |
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

## Otimizações de desempenho (08/11/2026)

Branch `perf/otimizacao-mobile`, produção v83 preservada. Detalhes e medições completas em [`OTIMIZACOES.md`](OTIMIZACOES.md).

| Teste | Resultado |
|---|---|
| Payload do painel | OK — HTML de 366.093 B para 236.607 B; comprimido de 206.081 B para 99.243 B (−51,8%) |
| Payload do Pedidos | OK — HTML de 268.230 B para 177.650 B; comprimido de 159.800 B para 88.311 B (−44,7%) |
| Imagens responsivas | OK — imagens do dashboard de 879.675 B para 213.338 B no celular (−75,7%) |
| Catálogo progressivo | OK — 36 produtos no celular e 96 no desktop; restante ao rolar; busca, categorias e carrinho funcionando |
| DOM inicial do catálogo | OK — 5.016 para 815 nós no celular (−83,8%) |
| Memória no celular | OK — 4 para 2 iframes carregados; heap após GC de 29,4 MB para 20,5 MB (−30,3%) |
| Recarregamento de módulos | OK — evento de sessão com o mesmo token não recarrega mais o iframe |
| PWA offline | OK — shell do GitHub Pages servido pelo cache; nenhum dado operacional armazenado |
| Permissões do operador | OK — somente Pedidos visível; Gestão oculta |
| Gestão do Pedidos | OK — atualização automática de 120 s, formulário e conferência preservados |
| Produção | OK — v83 inalterada; implantações de teste removidas; HEAD restaurado |
| Limpeza | OK — usuários, sessões e pedidos de teste removidos; planilhas sem registros de teste |
| Publicação v90 | OK — assets no GitHub Pages, Apps Script v90 e branch integrada à `main` |
| Fumaça em produção | OK — login, dashboard, catálogo com 36 itens iniciais, Gestão 120 s, Gastos, Fornecedores, Máquinas, service worker e logout |
| Botão Sair após sessão | OK — corrigido; permanece disponível após evento de sessão e troca de módulos |
| Limpeza pós-publicação | OK — usuário e sessões de teste removidos; implantações temporárias excluídas |

## Gerenciamento de usuários e permissões (08/11/2026)

Branch `feat/permissoes-projetos`, produção v90 preservada. Detalhes em [`PERMISSOES.md`](PERMISSOES.md).

| Teste | Resultado |
|---|---|
| Operador — Pedidos Operar / Máquinas Visualizar | OK — pedido registrado; alteração em Máquinas negada com “somente leitura” |
| Administrador limitado — dois projetos | OK — Pedidos e Máquinas com Gestão/Gerenciar; Gastos, Fornecedores e Frotas ocultos |
| Superadministrador | OK — cinco projetos no menu e gerenciamento global de usuários |
| Acesso direto a projeto bloqueado | OK — sem token do painel: “Acesse pelo Painel”; com token sem permissão: negado no backend |
| Alteração de permissão | OK — remoção de Máquinas ocultou o menu e bloqueou novas operações; Pedidos permaneceu |
| Criação de usuário pela interface | OK — Operador/Visualizar criado e login funcionando |
| Proteção da conta principal | OK — rebaixamento e bloqueio do Superadministrador recusados |
| Escalação por Administrador | OK — promoção para Superadministrador e listagem global recusadas |
| Limpeza | OK — usuários, sessões, auditorias, histórico e implantações de teste removidos; coluna temporária limpa |
| Produção | OK — v90 inalterada; HEAD restaurado; implantação de teste excluída |

## Publicação das permissões — v99 (08/11/2026)

| Teste | Resultado |
|---|---|
| Backup dos usuários | OK — aba `BACKUP_GVG_USUARIOS_PRE_PERMISSOES_20261108` criada |
| Publicação do Apps Script | OK — versão 99 na implantação oficial |
| Superadministrador em produção | OK — cinco projetos, modal de usuários e proteção da conta principal |
| Administrador limitado em produção | OK — somente Pedidos e Máquinas; leitura administrativa do módulo funcionando |
| Operador em produção | OK — Pedidos e Máquinas; Máquinas em modo somente leitura e escrita negada |
| Módulos na produção | OK — Máquinas, Gastos e Fornecedores com SSO do painel |
| Limpeza | OK — usuários e sessões de teste removidos; nenhum pedido de teste permaneceu |
| GitHub Pages | OK — wrapper atualizado para a v99 |

## Limpeza de demonstração — pedidos (08/11/2026)

| Teste | Resultado |
|---|---|
| Botão na Gestão | OK — tecla discreta “Limpar histórico”, visível somente ao Superadministrador |
| Limpeza em cópia | OK — PEDIDOS, ITENS_PEDIDO, PEDIDOS_USUARIOS e auditorias de entrega zerados |
| Preservação | OK — 297 produtos, obras, usuários, configurações e demais auditorias mantidos |
| Bloqueio para Administrador | OK — botão oculto e backend recusou a operação |
| Retorno visual | OK — ranking, histórico e contador de alertas zerados; mensagem de confirmação |
| Teste em produção | OK — funcionalidade validada em cópia; pedidos reais preservados |

## Publicação da limpeza de demonstração — v102 (08/11/2026)

| Teste | Resultado |
|---|---|
| Botão na Gestão do Pedidos | OK — tecla discreta “🧹 Limpar histórico” ao lado de “Atualizar pedidos” |
| Visibilidade | OK — somente Superadministrador; Administrador não vê e o backend recusa |
| Teste em cópia | OK — pedidos, itens, vínculos e auditorias de entrega zerados; 297 produtos e usuários preservados |
| Produção | OK — botão visível na conta de teste; pedidos reais não foram apagados |
| Publicação | OK — Apps Script v102 e GitHub Pages v102 |

## Organização dos textos do hero — v104 (08/11/2026)

| Teste | Resultado |
|---|---|
| Arte e layout | OK — mesma arte dourada, mesmas proporções e posições |
| Catálogo inicial | OK — “ESQUADRIAS”, “Catálogo de materiais” e “AQUI CUMPRIMOS COM O QUE PROMETEMOS!” |
| Gestão do Pedidos | OK — “ESQUADRIAS” removido de trás do subtítulo; título e subtítulo sem sobreposição |
| Frase do rodapé | OK — corrigida na própria arte, sem “PROMETEMOS” rasurado |
| Celular | OK — 320 px e 390 px com textos reorganizados sem sobreposição |
| Tablet/desktop | OK — 768 px e 1280 px com a mesma arte e layout |
| Publicação | OK — Apps Script v104 e GitHub Pages v104 |

## Gestão compacta — v116 (09/11/2026)

| Teste | Resultado |
|---|---|
| Formulário de produto | OK — recolhido por padrão; abre/fecha pelo botão e abre ao clicar em Editar |
| Cartões de alertas/ferramentas | OK — compactados, com textos longos dentro de “saiba mais” |
| Layout | OK — sem alteração no catálogo, carrinho ou dados |

## Visual da lista de materiais — v117 (09/11/2026)

| Teste | Resultado |
|---|---|
| Busca e categoria | OK — campos lado a lado, categoria filtrando a lista |
| Cartões | OK — fundo escuro, foto, nome, código/categoria, status e ações |
| Interruptor | OK — bege quando disponível, cinza quando indisponível |
| Editar | OK — botão dourado e abertura do cadastro |
| Formulário | OK — continua recolhido por padrão |
| Catálogo/carrinho | OK — sem alteração |

## Correção da lista de materiais — v118 (09/11/2026)

| Teste | Resultado |
|---|---|
| Erro de JavaScript | OK — corrigido o trecho que impedia a lista de renderizar |
| Cores | OK — fundo `#0f141b`, cartões `#1c232b`, busca `#1d242c` e dourado `#e4b75f` |
| Lista real | OK — 100 itens carregados, sem erro de página |
| Categoria | OK — opções reais preenchidas e filtro funcional |
| Formulário | OK — recolhido por padrão |

## Menu de categoria escuro — v119 (09/11/2026)

| Teste | Resultado |
|---|---|
| Menu nativo branco | OK — substituído por lista escura personalizada |
| Filtro por categoria | OK — seleção atualiza o rótulo e filtra os cartões |
| Fechamento | OK — clique fora ou Esc fecha |
| Restante da Gestão | OK — sem alterações |

## Domínio novo — v120 (10/11/2026)

| Teste | Resultado |
|---|---|
| URLs antigas | OK — todas as imagens migradas para `https://gvgartefalesquadrias.com.br/assets/` |
| Ícones do painel | OK — arquivos retornam HTTP 200 no domínio novo |
| Login visual | OK — referência HTTPS atualizada |
| Catálogo/Gestão | OK — heros e ícones com o domínio novo |
| Link do painel | OK — aponta para o domínio novo |

## Papel toalha — pacote de 24 — v121 (10/11/2026)

| Teste | Resultado |
|---|---|
| Cadastro | OK — PT01 atualizado para 24 unidades por pacote |
| Catálogo | OK — opções “Unidade” e “Pacote (24)” no cartão |
| Padrão | OK — pacote selecionado, 24 unidades equivalentes |
| Pedido por pacote | OK — backend aceitou e registrou |
| Pedido por unidade | OK — backend aceitou e registrou |
| Limpeza | OK — pedidos de teste removidos; produção limpa |

## Nome ORDER CATALOG — v122 (10/11/2026)

| Teste | Resultado |
|---|---|
| Logo e título | OK — ORDER CATALOG no cabeçalho e na aba |
| Login | OK — “Minha conta · ORDER CATALOG” |
| Painel | OK — menu e cartão do módulo ORDER CATALOG |
| Permissões | OK — rótulo ORDER CATALOG |
| WhatsApp | OK — cabeçalho ORDER CATALOG |
| Frases em português | OK — “pedido/pedidos” preservados no texto comum |

## Grafia Order Catalog — v123 (10/11/2026)

| Teste | Resultado |
|---|---|
| Nome do app | OK — “Order Catalog” no logo, título, painel, login, permissão e WhatsApp |
| Frases em português | OK — “pedido/pedidos” preservados no texto comum |

## Integração do Controle de Frotas — v127 (11/11/2026)

Detalhes completos em [`FROTAS_INTEGRACAO.md`](FROTAS_INTEGRACAO.md).

| Teste | Resultado |
|---|---|
| Menu e cartão Frotas | OK — ativos, sem “Em breve” |
| Dados reais | OK — 6 veículos, 3 alertas |
| SSO pelo painel | OK — sem segundo login no iframe |
| Gerenciar | OK — edição, auditoria e logout |
| Operar | OK — criação, edição e exclusão de KM de teste; limpeza confirmada |
| Visualizar | OK — botões ocultos e escrita recusada pelo backend |
| Sem acesso | OK — menu/cartão ocultos e backend recusou |
| Acesso direto sem painel | OK — bloqueado, sem dados |
| Deep link de notificação | OK — veículo SOD7H56 e aba Histórico |
| FCM — diagnóstico | OK — 3 dispositivos aprovados |
| FCM — envio real | OK — mensagem aceita pelo FCM |
| FCM — token inválido | OK — dispositivo falso marcado `invalid` e removido |
| FCM — alerta de 10 dias | OK — chave e link gerados; teste removido |
| Exibição/toque no aparelho | Não confirmado — depende de dispositivo físico |
| Order Catalog, Gastos, Fornecedores e Máquinas | OK — módulos continuam carregando |
| PWA/domínio | Teste final no endereço público registrado abaixo |

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
