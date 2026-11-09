# Acompanhamento de pedidos — GVG & ARTEFAL

Produção: **v114, publicada em 09/11/2026** (sujeita à validação final da publicação).

## Fluxo de status

1. **EM ANÁLISE** — pedido registrado pelo aplicativo.
2. **EM SEPARAÇÃO** — almoxarife iniciou a conferência.
3. **PRONTO PARA RETIRADA** — materiais separados.
4. **RETIRADO** — conclusão definitiva; o pedido não pode mais ser alterado.

O status anterior fica registrado no histórico. Não é permitido voltar o status.

## Quantidades

- `ITENS_PEDIDO.Quantidade` é a quantidade originalmente solicitada e **nunca é alterada**.
- `ITENS_PEDIDO.Quantidade_entregue` é a quantidade confirmada pelo almoxarife.
- A diferença é calculada na interface.
- Quantidade `0` indica material indisponível.
- Cada item é confirmado individualmente; deixar o campo em branco mantém o item pendente e não altera os demais.
- Pedido com item pendente não pode ser finalizado como RETIRADO.

## WhatsApp

O texto compartilhado continua sendo montado no aplicativo e inclui:

```
Pedido: PED-AAAAMMDD-XXXXXX
Acompanhe: https://script.google.com/macros/s/.../exec?modulo=pedidos&pedido=PED-...
```

O link abre o aplicativo no pedido correspondente após o login. O WhatsApp continua sendo o canal inicial; as atualizações ficam no aplicativo. Não há webhook nem confirmação automática de entrega da mensagem.

## Notificações internas

- Aba `NOTIFICACOES`: `ID`, `Pedido_ID`, `Usuario_ID`, `Tipo`, `Titulo`, `Mensagem`, `Criada_em`, `Lida`, `Lida_em`.
- Geradas para o funcionário vinculado ao pedido em alterações de quantidade, material indisponível, mudança de status e observação do almoxarife.
- O sino mostra não lidas; clicar abre o pedido. É possível marcar uma ou todas como lidas.
- A consulta usa cache curto e é feita sob demanda; a primeira verificação após o login é adiada para não competir com o carregamento do catálogo.
- Sem push com o aplicativo fechado: as notificações ficam registradas para o próximo acesso.

## Abas e histórico

- `PEDIDOS`: status atual, data/hora e responsável pelo status, observação do almoxarifado e última atualização.
- `ITENS_PEDIDO`: quantidade confirmada, unidades equivalentes, observação do item, data/hora e responsável pela confirmação.
- `PEDIDO_HISTORICO`: uma linha por criação, alteração de quantidade, alteração de status ou observação, com pedido, produto, quantidades, status anterior/novo, usuário, data/hora e observação.
- `AUDITORIA`: continua registrando as ações administrativas.

## Segurança

- Funcionário só consulta pedidos vinculados ao próprio usuário.
- Alterações exigem sessão com permissão **GERENCIAR** no projeto Pedidos (ou Superadministrador); o backend valida, não apenas a interface.
- Pedido RETIRADO é somente leitura no backend e na interface.
- Quantidades negativas, acima do solicitado ou não inteiras são recusadas.
- Nenhuma credencial ou token é gravado no repositório.

## Desempenho

- O catálogo continua carregando apenas produtos, obras e configuração.
- Pedidos, histórico e notificações são carregados sob demanda.
- A lista administrativa lê os pedidos ao abrir a Gestão; o histórico de um pedido é lido somente ao abri-lo.
- Notificações usam cache de 30 s e consulta periódica de 60 s com o app aberto.
- Medição de ponta a ponta na cópia de teste (login + catálogo): aproximadamente 5,2–6,5 s, sem regressão relevante em relação à versão anterior (5,6–6,1 s). O tempo inclui a inicialização do Apps Script; o catálogo em si não foi alterado.

## Funções principais

- `registrarSolicitacao` — cria pedido, itens, vínculo, histórico e link.
- `meusPedidos` — pedidos do funcionário, itens, quantidades e histórico.
- `relatorioAdmin` — pedidos e itens para a Gestão.
- `atualizarPedidoAdmin` — quantidades, observação e status, com validação e notificações.
- `historicoPedido` — histórico de um pedido para a Gestão.
- `notificacoesUsuario`, `marcarNotificacaoLida`, `marcarTodasNotificacoesLidas` — sino e leitura.
- `abasGestao_` — garante as colunas e abas novas sem apagar dados existentes.
