# Deploy e referências

## IDs

- Planilha ativa (cópia de teste do app oficial): `19bO6gkJX9yre2a3Qzt5EUxsNacj_-sR9C6hrz-UhBG4`
- Planilha de teste anterior (backup): `1i_P-BGv3GROHrVCUh8ifHxOk6gpi5rucLADvAOzgOrA`
- Apps Script (vinculado): `1E98hK1UhabSftMUnCR1j1Jm_XHfQZeTqv96PfqT9h26HND-Zyw1bOBfS`
- Implantação web: `AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL`
- Versão publicada do painel: **199** (17/11/2026; número da apólice no card Seguro da ficha do veículo)
- Planilha do Frotas: `1ck1lDtk_W9vjyQEnhV2Ze5secbayGLFfZi4Z0NuX-GY`
- Apps Script do Frotas: `1fo2YYypS1ponMDM3llLnMWAOiKuJHvhFYPAto_k2k_fRkW1V0-BncRyh`
- Implantação do Frotas: `AKfycby3W5KlwLYtX7j3_lvi6Zcf6d67k2fKnsg7K0MOmIK-b2X3xY7y57Al-uEPBdzxBaLB`
- Versão publicada do Frotas: **26** (push com link do painel e token inválido)
- App de push FCM: `https://gvg-controle-de-frotas.web.app/`
- Link único: `https://script.google.com/macros/s/AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL/exec`
- Pasta principal: `1eWXZren3iZClUFg4GU0yTIMg1h4__hb2`
- Fotos ativas: `1eBVC5bV7wOqUszfS6roN5eYl5IZkXbLZ` (177 fotos oficiais copiadas)
- Fotos do teste anterior: `10HPAB7x-z1AgLnQGXWV0EApPFp1MEYHQ`
- Anexos: `1FH8SACEEUe-mffzT4PigUt-m_hp0xnD1`
- Pasta do app oficial copiado: `1L5L4vFmlyaMMTIcVwEeGnnpqrT9CoXgI`
- Origem intacta — planilha: `1tIy8EZpWKnD-tSl7cGMPX0cRBZwLIJYD6APD862ZKws`
- Origem intacta — fotos: `1Rg8aAL7RI--SVqYIymFs3G-GHn06ryIF`

## Publicar

```bash
cd gvg-artefal
clasp push
clasp create-version "descrição da versão"
clasp update-deployment AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL -V <número>
```

O painel e o módulo Pedidos compartilham a mesma implantação. O modo de acesso é
`ANYONE_ANONYMOUS` com execução como o proprietário; a proteção é feita pelo login
próprio e pelas verificações de sessão/perfil no servidor.

## Teste rápido

1. Abra o link único em uma janela anônima.
2. Entre com um usuário ADMIN.
3. Confirme os indicadores, abra Pedidos e cadastre um pedido fictício.
4. Confirme que o registro aparece na planilha nova e na Gestão.

## Cadastro — versão 194

- Layout claro com a mesma arte 3D e identidade do login; apresentação dos cinco módulos.
- Formulário adaptado para computador e celular, com mostrar/ocultar senha e navegação por teclado.
- Fluxo de solicitação e aprovação existente preservado.
- Conferidos: desktop, celular 390 × 844, campos vazios, visibilidade da senha e retorno ao login. Não foram criados cadastros de teste.

## Apresentação dos aplicativos — versão 195

- Ao abrir o cadastro, a apresentação começa pela arte original e segue por Order Catalog, Gastos, Fornecedores, Máquinas e Frotas em ciclos de 3 segundos.
- Imagens exibidas inteiras, com transição suave, seleção manual e pausa. Ao fechar o cadastro ou ocultar a página, o temporizador para; a reabertura reinicia na imagem original.
- Conferidos em desktop e celular 390 × 844: seis imagens carregadas, enquadramento sem corte, troca automática, pausa, retomada e preservação do preenchimento.

## Ícone Order Catalog — versão 196

- Arte digital aprovada com tablet, materiais e selo dourado aplicada nos layouts claro e escuro e no carrossel do cadastro.
- WebP responsivo em 256, 384, 768 e 1254 pixels; URLs novas para evitar o ícone antigo em cache.
- Cadastro mantém imagem inicial, intervalo de 3 segundos e enquadramento completo.

## Imagem do login ao vento — versão 197

- A arte do login ondula como tecido ao vento, com a borda esquerda fixa, elevação suave da borda direita e iluminação acompanhando as dobras.
- Renderização WebGL sem dependências; formulário e cadastro mantêm seu posicionamento e comportamento.
- Animação pausada com a página oculta, login fora da tela, cadastro aberto ou usuário conectado. Respeita a preferência de movimento reduzido.
- A imagem original permanece como reserva se WebGL ou a textura não estiverem disponíveis. Renderização limitada a 60 quadros por segundo e densidade de pixels 1,5.
- Conferidos: sintaxe, animação na prévia, pausa ao abrir cadastro e layout móvel 390 × 844 sem rolagem lateral.

## Velocidade do vento — versão 198

- Relógio da animação multiplicado por 1,4: ondas e elevação 40% mais rápidas, com o mesmo enquadramento e amplitude.
- Sintaxe da animação validada; fluxo de login e proteções de pausa mantidos.

## Card Seguro do Frotas — versão 199

- Card da ficha do veículo exibe o número cadastrado da apólice/proposta, preservando zeros e formatação.
- Quando não há número, mantém a identificação anterior; quando não há seguro, mantém a ação de cadastro.
- Botão Ver registro mantém a navegação para Seguro e apólice. Dados da planilha e regras de seleção da apólice não foram alterados.
