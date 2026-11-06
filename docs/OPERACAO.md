# Operação e manutenção

## Acessos

- **Painel:** link `/exec` da implantação de teste.
- **Planilha:** dentro de `GVG&ARTEFAL/01 - Planilhas`.
- **Apps Script:** vinculado à planilha; abra pela planilha em Extensões → Apps Script ou pelo link do editor.
- **Repositório:** privado, fonte de `src/Code.gs`, `src/Painel.html`, `src/index.html` e `src/appsscript.json`.

## Publicar uma atualização

1. Edite os arquivos em `src/`.
2. Envie com `clasp push`.
3. Crie uma versão: `clasp create-version "descrição"`.
4. Atualize o deployment usado pelo painel:
   `clasp update-deployment AKfycby35-KiTddoqhEuo9zalGkVC2Wfspw5lG7i9Vt-_qJXZBa_wqeyiV51_42xh4ITtHhL -V <número>`.
5. Teste o link único e o módulo Pedidos.

## Administração

- O acesso à Gestão usa o perfil ADMIN da aba `GVG_USUARIOS`.
- O cadastro do administrador existente foi copiado com salt/hash; a senha não foi alterada.
- Novos usuários entram como PENDENTE e precisam de aprovação na Gestão.
- A senha nunca é gravada em texto; o código usa hash com salt na planilha.

## Dados e backup

- Faça backup periódico da planilha pelo menu Arquivo → Fazer uma cópia.
- A aba `AUDITORIA` registra edições de produto, disponibilidade e entregas.
- A pasta `04 - Fotos de Produtos` contém as fotos enviadas pelo aplicativo.
- A pasta `03 - Anexos de Pedidos` está reservada para uma etapa futura.

## Cuidados

- Não publique o link do painel fora da empresa: ele é anônimo no nível do Google, mas protegido pelo login próprio.
- Não coloque segredos na planilha, no HTML ou no repositório.
- O WhatsApp em `CONFIG!B2` é fictício; troque antes de uso real.
- O envio de WhatsApp é manual no aparelho do usuário; o servidor não envia mensagens.
