# GVG&ARTEFAL — Painel Interno

Painel interno acessível por um único link, com o módulo **Pedidos** integrado na primeira etapa. O layout e as funções do aplicativo de Pedidos foram preservados e carregados em uma área isolada do painel.

## Link único (versão de teste)

**https://script.google.com/macros/s/AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL/exec**

- A implantação está como **QUALQUER PESSOA** (acesso anônimo ao shell).
- O login é próprio do sistema (usuário/e-mail + senha), com sessões gravadas na planilha nova.
- O módulo Pedidos é aberto pelo menu lateral **Pedidos**, dentro do mesmo painel.
- O acesso à **Gestão** continua restrito ao perfil ADMIN, validado no servidor.

## Recursos novos

| Recurso | Referência |
|---|---|
| Pasta principal no Drive | [GVG&ARTEFAL](https://drive.google.com/drive/folders/1eWXZren3iZClUFg4GU0yTIMg1h4__hb2) |
| Planilha nova | [GVG&ARTEFAL - Base de Dados](https://docs.google.com/spreadsheets/d/1i_P-BGv3GROHrVCUh8ifHxOk6gpi5rucLADvAOzgOrA/edit) |
| Apps Script novo (vinculado à planilha) | [Editor do projeto](https://script.google.com/d/1E98hK1UhabSftMUnCR1j1Jm_XHfQZeTqv96PfqT9h26HND-Zyw1bOBfS/edit) |
| Script ID | `1E98hK1UhabSftMUnCR1j1Jm_XHfQZeTqv96PfqT9h26HND-Zyw1bOBfS` |
| Implantação web | `AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL` |
| Repositório privado | https://github.com/higoragenteia/gvg-artefal |
| Pedido fictício de teste | `PED-20261105-8015B6` |

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
│   └── produto-....jpg (foto de teste do fluxo existente)
├── 05 - Identidade Visual/
│   └── icone-gvg-artefal.png
└── 06 - Documentacao/
    ├── README.md
    ├── ARQUITETURA.md
    ├── TESTES.md
    └── OPERACAO.md
```

O Apps Script é **vinculado à planilha nova**; por isso o projeto fica dentro do arquivo da planilha, e a pasta `02 - Apps Script` contém o ponteiro e as instruções. Nenhum arquivo novo do projeto foi deixado na raiz do Drive; os dois artefatos temporários de teste (`__GVG_TESTE_HELPER__` e `__GVG_TESTE_BOUND__`) foram movidos para a lixeira.

## Módulos do menu

- **Visão geral** — indicadores calculados da planilha nova: pedidos, em andamento, entregues, itens, produtos ativos, obras ativas, pedidos recentes e mais solicitados. Com base vazia, exibe estado vazio com atalho para Pedidos. A visão alterna automaticamente entre **dois layouts** (Executivo e Monitor) a cada **10 segundos**, com transição; o botão **Pausar/Retomar** fica no topo. Os dados são atualizados a cada troca.
- **Pedidos** — aplicativo original preservado: catálogo, carrinho, obras, solicitação, histórico do usuário, Gestão, disponibilidade de produtos, relatório, conferência de entrega e foto de produto.
- **Controle de Gastos**, **Fornecedores** e **Frotas** — sinalizados como **Em breve**; abrem uma tela de integração futura, sem alterar o módulo Pedidos.

## Abas da planilha nova

`PRODUTOS`, `CATEGORIAS`, `OBRAS`, `CONFIG`, `PEDIDOS`, `ITENS_PEDIDO`, `AUDITORIA`, `GVG_USUARIOS`, `SESSOES_GVG`, `PEDIDOS_USUARIOS` e `LEIA-ME`.

Recursos aplicados: cabeçalhos, validações de lista e numéricas, formatos de data, congelamento de cabeçalho, filtros, formatação condicional e fórmulas de indicadores na aba `LEIA-ME`. Os dados de catálogo, obras e categorias são fictícios.

## Segurança e isolamento

- Nenhuma credencial, chave privada ou `client_secret` foi copiada para o repositório ou para o navegador.
- O hash da senha do administrador existente foi copiado da base original; a senha em texto não é conhecida nem armazenada pelo projeto.
- Os usuários de teste usados na validação (`teste.admin` e `teste.usuario`) foram removidos, junto com suas sessões.
- O número de WhatsApp em `CONFIG` é fictício. O servidor não envia WhatsApp, e-mail ou notificação; o compartilhamento é manual no aplicativo, como no fluxo original.
- O pedido de teste permanece na base nova como registro fictício (`PED-20261105-8015B6`), com a observação “NÃO ENVIAR”.
- A planilha, o script e a implantação antigos não foram alterados; foram usados somente para leitura e cópia.

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

1. Integrar **Controle de Gastos**, **Fornecedores** e **Frotas** (itens já reservados no menu).
2. O aplicativo de Pedidos original não possui fluxo de anexos por pedido. Foram mantidos apenas os fluxos existentes (foto de produto e conferência de entrega). A pasta `03 - Anexos de Pedidos` está preparada para uma etapa futura.
3. Substituir o número fictício de WhatsApp em `CONFIG!B2` antes de uso em produção.
4. O pedido fictício de teste pode ser mantido para demonstração ou removido pela Gestão/planilha após a validação.
