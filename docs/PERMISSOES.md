# Gerenciamento de usuários e permissões

Branch de trabalho: `feat/permissoes-projetos`  
Ponto de restauração: tag `pre-permissoes-20261108`  
Produção: **v130, publicada em 11/11/2026**  
Status: **publicado**.

## 1. Modelo de acesso

### Classificações

| Classificação | Poder |
|---|---|
| **Superadministrador** | Acesso global a todos os projetos, usuários e permissões. Único perfil que gerencia cadastros e níveis. |
| **Administrador** | Poder administrativo completo somente nos projetos com nível **Gerenciar**. Não gerencia usuários nem altera as próprias permissões. |
| **Operador** | Usa as funções operacionais dos projetos autorizados. Não recebe nível **Gerenciar**. |

### Níveis por projeto

| Nível | Efeito |
|---|---|
| **Sem acesso** | Projeto oculto no menu, cartões e dados bloqueados no backend; acesso direto negado. |
| **Visualizar** | Abre o projeto e consulta dados; não executa escrita. |
| **Operar** | Executa as funções operacionais disponíveis no aplicativo; não acessa funções administrativas. |
| **Gerenciar** | Acesso administrativo completo ao projeto autorizado. Somente Administrador e Superadministrador podem receber. |

O cargo define **o que** o usuário pode fazer. As permissões definem **onde** ele pode fazer.

## 2. Projetos reconhecidos

- Pedidos
- Controle de Gastos
- Fornecedores
- Controle de Máquinas
- Controle de Frotas

O menu lateral esquerdo é montado a partir dessa lista. Se um grupo não tiver nenhum projeto autorizado, o grupo inteiro é ocultado. Ícones, cores e estrutura visual foram preservados.

## 3. Armazenamento

- `GVG_USUARIOS`: cadastro existente, acrescido da coluna `Perm_Maquinas`.
- `GVG_PERMISSOES`: histórico de alterações de classificação, status e permissões (data, responsável, usuário, perfil, projetos e detalhe).
- `AUDITORIA`: continua registrando as ações administrativas do sistema.

A coluna `Perm_Maquinas` é criada automaticamente na primeira gestão de usuários. Nenhum usuário, senha ou registro antigo é apagado.

## 4. Compatibilidade com os dados existentes

- `Perfil = ADMIN` continua sendo Administrador, com as permissões já gravadas.
- `Perfil = CONSULTA` é tratado como Operador.
- Valores antigos `ADMIN`, `OPERADOR`, `VISUAL` são convertidos para `GERENCIAR`, `OPERAR`, `VISUAL`.
- Administradores antigos sem `Perm_Maquinas` recebem **Gerenciar** em Máquinas para preservar o acesso que já possuíam.
- A conta principal `higorjose.gvgesquadrias@gmail.com` é tratada como **Superadministrador**, mesmo que a coluna ainda diga ADMIN.
- A conta principal não pode ser bloqueada, excluída ou rebaixada. Também não é permitido remover o último Superadministrador ativo.

## 5. Interface

No painel, o botão **Usuários** aparece somente para o Superadministrador. A janela permite:

- listar cadastros e pendências;
- criar usuário com nome, login, e-mail, senha, classificação e permissões;
- alterar classificação e os cinco projetos;
- aprovar, recusar, bloquear, reativar, excluir e redefinir senha;
- consultar o histórico de alterações.

Os seletores de projeto respeitam a classificação:

- Operador: Sem acesso, Visualizar, Operar.
- Administrador: Sem acesso, Visualizar, Operar, Gerenciar.
- Superadministrador: acesso global automático.

A própria conta e a conta principal protegida ficam com classificação/permissões desabilitadas na interface.

## 6. Bloqueio no backend

Não existe bloqueio apenas visual.

- `getPainelInicial` devolve somente os projetos e atividades autorizados.
- `getPainelExternos` devolve somente os resumos autorizados.
- `getCatalogo` exige acesso ao Pedidos; `registrarSolicitacao` exige nível Operar ou Gerenciar.
- Funções administrativas do Pedidos exigem nível Gerenciar.
- Funções globais de usuários e permissões exigem Superadministrador.
- Os módulos Gastos, Fornecedores e Máquinas recebem o token do painel e validam o nível no backend.
- O acesso direto aos módulos sem sessão do painel é negado; o login nativo dos módulos foi desativado no modo atual.
- Alterar permissões invalida o cache do painel do usuário afetado; novas operações são negadas imediatamente.

## 7. Comportamento por aplicativo

| Projeto | Visualizar | Operar | Gerenciar |
|---|---|---|---|
| Pedidos | Consulta o catálogo, sem carrinho. | Consulta e solicita materiais. | Gestão, produtos, relatório e conferência. |
| Gastos | Consulta o dashboard. | Consulta (o app atual só possui escrita administrativa). | Cadastros, despesas, orçamento e usuários do módulo. |
| Fornecedores | Consulta. | Consulta (o app atual só possui escrita administrativa). | Cadastros, cotações, compras e configurações. |
| Máquinas | Consulta. | Executa operações autenticadas permitidas. | Cadastros, equipamentos, colaboradores, manutenções e auditoria. |
| Frotas | Menu/tela futura. | Menu/tela futura. | Menu/tela futura. |

A limitação de Operar em Gastos/Fornecedores é uma característica atual desses aplicativos, não uma permissão fictícia: a escrita existente neles é administrativa.

## 8. Testes realizados

Ambiente: Chromium 158 headless, emulação Pixel 5 e desktop, implantação temporária de teste. Nenhum aparelho físico.

| Teste | Resultado |
|---|---|
| Operador — Pedidos Operar e Máquinas Visualizar | OK — pedido registrado; escrita em Máquinas negada com `SOMENTE_LEITURA` |
| Administrador limitado — Pedidos e Máquinas Gerenciar | OK — Gestão do Pedidos abriu e `adminListar` retornou 297 produtos; leitura administrativa de Máquinas funcionou; Gastos/Fornecedores continuaram ocultos |
| Superadministrador — acesso global | OK — cinco projetos no menu; usuários e permissões acessíveis |
| Acesso direto a projeto bloqueado | OK — módulo sem token mostrou “Acesse pelo Painel”; token sem permissão foi negado |
| Alteração de permissão em tempo real | OK — remoção de Máquinas ocultou o menu e bloqueou novas operações; Pedidos permaneceu |
| Criação de usuário pela interface | OK — usuário criado com Operador/Visualizar e login funcionando |
| Proteção do Superadministrador | OK — rebaixar/bloquear a conta principal foi recusado |
| Administrador tentando virar Superadministrador | OK — recusado pelo backend |
| Administrador tentando listar usuários globais | OK — recusado pelo backend |
| Integridade | OK — usuários reais e dados preservados; registros de teste removidos |

## 9. Limitações e cuidados de implantação

- Os usuários que hoje entram diretamente nos módulos Gastos, Fornecedores ou Máquinas precisarão entrar pelo Painel GVG&ARTEFAL, pois o login nativo desses módulos foi desativado no modo de SSO obrigatório.
- A conta principal do painel é a chave de recuperação do Superadministrador. Mantenha o e-mail `higorjose.gvgesquadrias@gmail.com` ativo. Se ele mudar, atualize a constante `GVG_SUPERADMIN_EMAIL` em `src/Code.gs`.
- A atualização visual do menu após uma alteração de permissão ocorre no próximo ciclo de 30 s ou ao recarregar. A negação de novas operações é imediata no backend.
- O gerenciamento nativo de usuários dentro dos módulos foi preservado como legado, mas não é mais a via de login desses aplicativos. A fonte de verdade é o cadastro do painel.
- O módulo Frotas ainda não possui aplicativo; a permissão controla apenas menu/tela futura.
- O e-mail de acesso aos módulos é o mesmo do cadastro do painel. Contas antigas dos módulos que não existirem no painel não terão acesso até serem cadastradas e autorizadas.

## 10. Publicação realizada

Em 08/11/2026:

1. A aba `GVG_USUARIOS` foi duplicada como `BACKUP_GVG_USUARIOS_PRE_PERMISSOES_20261108`.
2. A branch foi integrada à `main`.
3. O Apps Script foi publicado na versão 99 e a implantação oficial foi atualizada.
4. A coluna `Perm_Maquinas` foi criada automaticamente.
5. A conta principal foi confirmada como Superadministrador protegido.
6. Um Superadministrador, um Administrador limitado e um Operador de teste validaram menu, módulos, SSO e bloqueios.
7. Os usuários e sessões de teste foram removidos.
8. O GitHub Pages foi atualizado para a v99.

A aba `GVG_PERMISSOES` será criada automaticamente na primeira alteração de permissões feita pelo Superadministrador.

## 11. Reversão

- Reapontar a implantação oficial para a versão 90.
- Reverter o commit da branch no Git e enviar a `main`.
- Restaurar `src/Code.gs`, `src/Painel.html`, `src/index.html`, `src/Gastos.gs`, `src/GastosIndex.html`, `src/Fornecedores.gs`, `src/FornecedoresIndex.html`, `src/Maquinas.gs` e `src/MaquinasIndex.html` da versão anterior.
- A coluna `Perm_Maquinas` e a aba `GVG_PERMISSOES` podem ser removidas manualmente se a funcionalidade for descartada; não há exclusão automática de usuários.
- O backup `BACKUP_GVG_USUARIOS_PRE_PERMISSOES_20261108` deve ser preservado.
