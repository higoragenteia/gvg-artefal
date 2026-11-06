/** GVG&ARTEFAL — Painel Interno | módulo Pedidos (Apps Script) */
const GVG_SPREADSHEET_ID = '1i_P-BGv3GROHrVCUh8ifHxOk6gpi5rucLADvAOzgOrA';
const GVG_BASE_FOLDER_ID = '1eWXZren3iZClUFg4GU0yTIMg1h4__hb2';
const GVG_FOTOS_FOLDER_ID = '10HPAB7x-z1AgLnQGXWV0EApPFp1MEYHQ';
const GVG_ANEXOS_FOLDER_ID = '1FH8SACEEUe-mffzT4PigUt-m_hp0xnD1';
// Reutiliza referências somente nesta execução; não guarda dados nem permissões entre acessos.
var GVG_PLANILHA_EXECUCAO_,GVG_GESTAO_EXECUCAO_=false;
function gvgPlanilha_(){return GVG_PLANILHA_EXECUCAO_||(GVG_PLANILHA_EXECUCAO_=SpreadsheetApp.openById(GVG_SPREADSHEET_ID));}

/**
 * Um único link abre o painel. O módulo Pedidos é servido na mesma
 * implantação e carregado em iframe, preservando o layout original.
 */
function doGet(e){
  const modulo=String(e&&e.parameter&&e.parameter.modulo||'').toLowerCase();
  if(modulo==='pedidos')return doGetPedidos_();
  return doGetPainel_(e);
}
function doGetPedidos_(){
  const modelo = HtmlService.createTemplateFromFile('index');
  // Inclui os produtos diretamente na página. Evita uma segunda chamada assíncrona no celular.
  modelo.initialData = JSON.stringify(getCatalogo())
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return modelo.evaluate()
    .setTitle('PEDIDOS')
    .addMetaTag('viewport','width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGetPainel_(e){
  const modelo = HtmlService.createTemplateFromFile('Painel');
  const url=ScriptApp.getService().getUrl();
  modelo.pedidosUrl=url+(url.indexOf('?')>=0?'&':'?')+'modulo=pedidos';
  return modelo.evaluate()
    .setTitle('GVG&ARTEFAL')
    .addMetaTag('viewport','width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fator de embalagem. Mantém configurações existentes e oferece padrão por categoria.
function fatorEmbalagemGVG_(r){
 const n=Number(r[5])||1;
 const tipo=String(r[2]||'')+' '+String(r[1]||'');
 // Conversões específicas acordadas para GVG & ARTEFAL.
 if(String(r[2]||'').trim().toLowerCase()==='parafusos')return n>1?n:100;
 if(/silicone/i.test(tipo)&&/estrutural/i.test(tipo))return 16;
 if(/silicone/i.test(tipo)&&/neutro/i.test(tipo))return 24;
 if(/power\s*ved/i.test(tipo)&&/preto/i.test(tipo))return 24;
 // Os demais produtos mantêm o fator cadastrado na planilha.
 if(n>1)return n;
 return 1;
}

function getCatalogo(){
  const ss = gvgPlanilha_();
  const values = ss.getSheetByName('PRODUTOS').getDataRange().getDisplayValues();
  const produtos = values.slice(1).filter(r=>r[0]&&r[1]&&String(r[6]).toUpperCase()!=='NÃO'&&String(r[6]).toUpperCase()!=='NAO').map(r=>({id:r[0],nome:r[1],categoria:r[2],unidade:r[3],descricao:r[4],porCaixa:fatorEmbalagemGVG_(r),imagem:r[7]||'',ativo:String(r[6]||'SIM').toUpperCase()}));
  const obras = ss.getSheetByName('OBRAS').getDataRange().getDisplayValues().slice(1).filter(r=>r[0]&&String(r[1]).toUpperCase()!=='NÃO'&&String(r[1]).toUpperCase()!=='NAO').map(r=>r[0]);
  const configs = ss.getSheetByName('CONFIG').getDataRange().getDisplayValues();
  const get=(key)=>{const row=configs.find(r=>r[0]===key);return row?row[1]:''};
  return {produtos,obras,whatsapp:String(get('WHATSAPP_DESTINO')).replace(/\D/g,''),titulo:get('TITULO_APP')||'GVG • Catálogo de Materiais'};
}

function testarCatalogo(){ const c=getCatalogo(); Logger.log('Produtos: '+c.produtos.length+' | Obras: '+c.obras.length+' | WhatsApp configurado: '+Boolean(c.whatsapp)); return {produtos:c.produtos.length, obras:c.obras.length, whatsappConfigurado:Boolean(c.whatsapp)}; }


// ===== GESTÃO E HISTÓRICO v2 =====
// Execute configurarAdminUmaVez() no editor após personalizar o PIN; não publique o PIN no HTML.
function configurarAdminUmaVez(){
  const PIN_INICIAL = 'ALTERE_AQUI_PARA_UM_PIN_LONGO_E_SECRETO';
  if(PIN_INICIAL.indexOf('ALTERE_AQUI')===0) throw new Error('Troque PIN_INICIAL por uma senha longa e única antes de executar.');
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty('GVG_ADMIN_HASH')) throw new Error('PIN já configurado. Para redefinir, faça-o somente no editor com autorização do proprietário.');
  props.setProperty('GVG_ADMIN_SALT',Utilities.getUuid());
  props.setProperty('GVG_ADMIN_HASH',hashPin_(PIN_INICIAL));
  Logger.log('Acesso do administrador configurado. NÃO compartilhe o PIN.');
}
function hashPin_(pin){
 const salt=PropertiesService.getScriptProperties().getProperty('GVG_ADMIN_SALT')||'';
 return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,salt+String(pin)).map(n=>('0'+(n&255).toString(16)).slice(-2)).join('');
}
function admin_(credential){
 const c=String(credential||'');
 if(/^GVGA-[a-f0-9-]{72}$/i.test(c)){if(!gvgaSessaoValida_(c))throw new Error('GVG_ADMIN_SESSAO_INVALIDA: entre novamente.');return;}
 if(c.length>=20){
  try{const u=gvguVerificarSessao_(c);if(String(u.perfil||'').toUpperCase()==='ADMIN')return;}catch(e){}
 }
 const h=PropertiesService.getScriptProperties().getProperty('GVG_ADMIN_HASH');if(!h||!c||hashPin_(c)!==String(h))throw new Error('Credencial de administrador inválida.');
}
function adminSessionUser_(credential){try{return gvguVerificarSessao_(String(credential||''));}catch(e){return null;}}
function activeAdminCount_(){return gvguUsuarios_().getDataRange().getValues().slice(1).filter(function(r){return String(r[6]||'').toUpperCase()==='ATIVO'&&String(r[10]||'').toUpperCase()==='ADMIN';}).length;}
function revogarSessoesUsuario_(id,manterToken){const sh=gvguSessoes_(),v=sh.getDataRange().getValues(),keep=manterToken?gvguSHA_(String(manterToken)):'';for(let i=1;i<v.length;i++)if(String(v[i][1])===String(id)&&(!keep||String(v[i][0])!==keep))sh.getRange(i+1,4).setValue('SIM');}
function abasGestao_(){const ss=gvgPlanilha_();if(GVG_GESTAO_EXECUCAO_)return ss;const a=[['PEDIDOS',['Pedido_ID','Data','Solicitante','Obra','Observacoes','Canal','Situacao','Data_entrega']],['ITENS_PEDIDO',['Pedido_ID','Codigo','Produto','Quantidade','Unidade','Unidades_equivalentes','Quantidade_entregue','Unidades_entregues','Observacao_entrega']],['AUDITORIA',['Data','Acao','Codigo','Produto','Detalhes']]]; a.forEach(([name,header])=>{let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.appendRow(header);else if(name==='PEDIDOS' && sh.getLastColumn()<8){sh.getRange(1,8).setValue('Data_entrega');}else if(name==='ITENS_PEDIDO' && sh.getLastColumn()<9){sh.getRange(1,7,1,3).setValues([header.slice(6)]);}});GVG_GESTAO_EXECUCAO_=true;return ss;}
function instalarAbasGestao(){abasGestao_();return 'Abas de gestão preparadas';}
function adminListar(pin){admin_(pin);const ss=abasGestao_();const produtos=ss.getSheetByName('PRODUTOS').getDataRange().getDisplayValues().slice(1).filter(r=>r[0]&&r[1]).map(r=>({id:r[0],nome:r[1],categoria:r[2],unidade:r[3],descricao:r[4],porCaixa:fatorEmbalagemGVG_(r),ativo:r[6]||'SIM',imagem:r[7]||''}));return {produtos};}
function textoSeguro_(x,max){let t=String(x==null?'':x).slice(0,max||200);return /^[=+@\-]/.test(t)?'\''+t:t;}
function salvarProduto(pin,d){
 admin_(pin);if(!d||!String(d.nome||'').trim()||!String(d.categoria||'').trim())throw new Error('Informe nome e categoria.');
 const allowed=['SIM','NÃO','EM FALTA'];const ativo=String(d.ativo||'SIM').toUpperCase();if(!allowed.includes(ativo))throw new Error('Estado inválido.');
 const img=String(d.imagem||'').trim();if(img&&!/^https:\/\//i.test(img))throw new Error('A foto deve usar um link HTTPS acessível.');
 const unit=String(d.unidade||'Unidade');const q=Number(d.porCaixa)||1;if(q<1||q>10000)throw new Error('Quantidade por caixa inválida.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
  const ss=abasGestao_(),sh=ss.getSheetByName('PRODUTOS'),vals=sh.getDataRange().getValues();
  const old=String(d.id||'');let row=vals.findIndex((r,i)=>i>0&&String(r[0])===old)+1;
  let id=old;
  if(!row){if(old)throw new Error('Produto não encontrado para edição.');id='GVG-'+Utilities.getUuid().slice(0,8).toUpperCase();}
  const values=[id,textoSeguro_(String(d.nome).trim(),180),textoSeguro_(String(d.categoria).trim(),80),textoSeguro_(unit,50),textoSeguro_(d.descricao,350),q,ativo,img];
  if(row)sh.getRange(row,1,1,8).setValues([values]);else sh.appendRow(values);
  ss.getSheetByName('AUDITORIA').appendRow([new Date(),row?'EDITAR':'CRIAR',id,values[1],ativo]);
  return {id};
 }finally{lock.releaseLock()}
}
function alterarDisponibilidade(pin,id,novo){admin_(pin);if(!['SIM','NÃO','EM FALTA'].includes(novo))throw new Error('Situação inválida.');const lock=LockService.getScriptLock();lock.waitLock(20000);try{const ss=abasGestao_(),sh=ss.getSheetByName('PRODUTOS'),v=sh.getDataRange().getValues();const idx=v.findIndex((r,i)=>i>0&&String(r[0])===String(id));if(idx<0)throw new Error('Produto não encontrado.');sh.getRange(idx+1,7).setValue(novo);ss.getSheetByName('AUDITORIA').appendRow([new Date(),'DISPONIBILIDADE',id,v[idx][1],novo]);return true}finally{lock.releaseLock()}}
// Registra SOLICITAÇÃO, não comprova envio no WhatsApp nem entrega de materiais.
function registrarSolicitacao(d){
 const auth=gvguVerificarSessao_(d&&d.sessao); d.nome=auth.nome; d.usuarioId=auth.id;
 if(!d||!String(d.nome||'').trim()||!String(d.obra||'').trim()||!Array.isArray(d.itens)||!d.itens.length)throw new Error('Pedido incompleto.');
 if(d.itens.length>100)throw new Error('Limite de itens do pedido excedido.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
  const ss=abasGestao_(),sh=ss.getSheetByName('PRODUTOS');const vals=sh.getDataRange().getValues();const mapa=new Map(vals.slice(1).filter(r=>r[0]&&String(r[6]).toUpperCase()==='SIM').map(r=>[String(r[0]),r]));
  let linhas=[];for(const x of d.itens){const r=mapa.get(String(x.id));if(!r)throw new Error('Produto indisponível ou retirado: '+x.id+'. Atualize o catálogo.');const q=Number(x.quantidade);if(!Number.isInteger(q)||q<1||q>10000)throw new Error('Quantidade inválida.');const u=['Unidade','Caixa','Pacote','Litro','Quilo'].includes(x.unidade)?x.unidade:'Unidade';const f=fatorEmbalagemGVG_(r);if(['Caixa','Pacote'].includes(u)&&f<=1)throw new Error('Embalagem indisponível para '+r[1]);if(u==='Pacote'&&String(r[2]||'').trim().toLowerCase()!=='parafusos')throw new Error('Pacote indisponível para '+r[1]);const base=String(r[3]||'').toLowerCase();if(u==='Litro'&&!(/litro/.test(base)||/litro/.test(String(r[1]))))throw new Error('Litro indisponível para '+r[1]);if(u==='Quilo'&&!(/quilo/.test(base)||/estopa/.test(String(r[1]))))throw new Error('Quilo indisponível para '+r[1]);linhas.push([String(x.id),String(r[1]),q,u,q*(['Caixa','Pacote'].includes(u)?f:1)])}
  const pedido='PED-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();const agora=new Date();const p=ss.getSheetByName('PEDIDOS');p.appendRow([pedido,agora,textoSeguro_(d.nome,120),textoSeguro_(d.obra,120),textoSeguro_(d.observacao,500),String(d.canal||'WhatsApp'),'REGISTRADO — ENVIO NÃO VERIFICADO']);const itens=ss.getSheetByName('ITENS_PEDIDO');itens.getRange(itens.getLastRow()+1,1,linhas.length,6).setValues(linhas.map(x=>[pedido,...x]));gvguVincularPedido_(ss,pedido,d.usuarioId);return {pedido};
 }finally{lock.releaseLock()}
}
function relatorioAdmin(pin){admin_(pin);const ss=abasGestao_();const p=ss.getSheetByName('PEDIDOS').getDataRange().getValues().slice(1),i=ss.getSheetByName('ITENS_PEDIDO').getDataRange().getValues().slice(1);const pedidos=p.map(r=>({id:String(r[0]),data:r[1] instanceof Date?r[1].toISOString():String(r[1]),solicitante:String(r[2]),obra:String(r[3]),canal:String(r[5]),situacao:String(r[6]),dataEntrega:r[7] instanceof Date?r[7].toISOString():''}));const itens=i.map(r=>({id:String(r[0]),codigo:String(r[1]),nome:String(r[2]),qtd:Number(r[3])||0,unidade:String(r[4]),equiv:Number(r[5])||0,entregue:r[6]===''?null:Number(r[6])||0,entregueEquiv:r[7]===''?0:Number(r[7])||0,nota:String(r[8]||'')}));return {pedidos,itens};}
// Grava quantidade REAL ENTREGUE por item. Não altera quantidade solicitada.
function confirmarEntrega(pin,id,linhas){
 admin_(pin);
 if(!Array.isArray(linhas)||!linhas.length)throw new Error('Informe a conferência de cada item.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const ss=abasGestao_(),ps=ss.getSheetByName('PEDIDOS'),its=ss.getSheetByName('ITENS_PEDIDO');
  const p=ps.getDataRange().getValues(),v=its.getDataRange().getValues();
  const row=p.findIndex((r,i)=>i>0&&String(r[0])===String(id));
  if(row<0)throw new Error('Pedido não encontrado.');
  if(['ENTREGUE','ENTREGUE PARCIAL','NÃO ENTREGUE'].includes(String(p[row][6])))throw new Error('Este pedido já foi confirmado. Não é possível contabilizar duas vezes.');
  const rows=[];for(let i=1;i<v.length;i++)if(String(v[i][0])===String(id))rows.push({idx:i,rec:v[i]});
  if(!rows.length||rows.length!==linhas.length)throw new Error('Itens divergentes. Atualize a lista de pedidos.');
  const seen=new Set();let full=true,delivered=0;
  const changes=rows.map(o=>{
   const codigo=String(o.rec[1]),unidade=String(o.rec[4]);
   const inp=linhas.find(x=>String(x.codigo)===codigo && String(x.unidade)===unidade);
   const key=codigo+'|'+unidade;if(!inp||seen.has(key))throw new Error('Conferência incompleta ou duplicada: '+key);seen.add(key);
   const asked=Number(o.rec[3]);const qty=Number(inp.qtd);
   if(!Number.isInteger(qty)||qty<0||qty>asked)throw new Error('Quantidade entregue inválida para '+o.rec[2]);
   if(qty!==asked)full=false;
   const perUnit=asked>0?Number(o.rec[5])/asked:1;
   const equiv=qty*perUnit;delivered+=equiv;
   return {idx:o.idx,qty,equiv,nota:String(inp.nota||'').slice(0,200),codigo,nome:String(o.rec[2])};
  });
  // Agrupa apenas linhas consecutivas do mesmo pedido, sem escrever nas linhas de outros pedidos.
  for(let start=0;start<changes.length;){
   let end=start+1;while(end<changes.length&&changes[end].idx===changes[end-1].idx+1)end++;
   its.getRange(changes[start].idx+1,7,end-start,3).setValues(changes.slice(start,end).map(x=>[x.qty,x.equiv,x.nota]));
   start=end;
  }
  const status=delivered===0?'NÃO ENTREGUE':full?'ENTREGUE':'ENTREGUE PARCIAL';
  ps.getRange(row+1,7,1,2).setValues([[status,new Date()]]);
  ss.getSheetByName('AUDITORIA').appendRow([new Date(),'ENTREGA',id,String(p[row][2]),status+'; '+delivered+' unidades equivalentes']);
  return {status,unidades:delivered};
 }finally{lock.releaseLock();}
}

// SOMENTE proprietário/editor do Apps Script: para trocar a senha depois,
// insira a senha NOVA abaixo e execute redefinirSenhaAdminUmaVez() no editor.
// Nunca inclua a senha no HTML ou na planilha.
function redefinirSenhaAdminUmaVez(){
 const NOVA_SENHA='ALTERE_AQUI_NOVA_SENHA_SECRETA';
 if(NOVA_SENHA.indexOf('ALTERE_AQUI')===0) throw new Error('Defina a nova senha no editor antes de executar.');
 if(String(NOVA_SENHA).length<10) throw new Error('Utilize senha com no mínimo 10 caracteres.');
 const props=PropertiesService.getScriptProperties();
 props.setProperty('GVG_ADMIN_SALT',Utilities.getUuid());
 props.setProperty('GVG_ADMIN_HASH',hashPin_(NOVA_SENHA));
 Logger.log('Senha administrativa redefinida. Remova o texto da senha do código e salve.');
}


// ===== FOTOS DA GALERIA | somente administrador autenticado =====
function enviarFotoProduto(pin, arquivo){
  admin_(pin);
  if (!arquivo || arquivo.mimeType !== 'image/jpeg' || !/^data:image\/jpeg;base64,/.test(String(arquivo.data||'')))
    throw new Error('Selecione uma foto JPEG válida.');
  const base64=String(arquivo.data).split(',')[1];
  if(base64.length>1600000)throw new Error('Imagem muito grande. Escolha uma foto menor.');
  const bytes=Utilities.base64Decode(base64);
  if(bytes.length>1200000)throw new Error('Foto excedeu o limite de 1,2 MB.');
  const prop=PropertiesService.getScriptProperties();
  let folder=null;
  const folderId=GVG_FOTOS_FOLDER_ID||prop.getProperty('GVG_FOTOS_FOLDER_ID');
  if(folderId){try{folder=DriveApp.getFolderById(folderId)}catch(e){folder=null}}
  if(!folder){
    try{folder=DriveApp.getFolderById(GVG_BASE_FOLDER_ID).createFolder('Fotos de Produtos - Pedidos')}
    catch(e){folder=DriveApp.createFolder('Fotos de Produtos - Pedidos')}
    prop.setProperty('GVG_FOTOS_FOLDER_ID',folder.getId());
  }
  const file=folder.createFile(Utilities.newBlob(bytes,'image/jpeg','produto-'+Utilities.getUuid()+'.jpg'));
  // Apenas a foto, não a planilha nem a pasta, fica acessível por link para os funcionários.
  try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW)}catch(e){
    file.setTrashed(true);
    throw new Error('O Google Drive impediu compartilhar a foto por link. Verifique a política de compartilhamento da sua conta.');
  }
  const url='https://drive.google.com/thumbnail?id='+encodeURIComponent(file.getId())+'&sz=w700';
  return {url:url,id:file.getId()};
}


// ===== MÓDULO DE USUÁRIOS INTEGRADO =====
/** GVG v1: autenticação e rastreio de pedidos. Adicionar como arquivo separado no mesmo projeto Apps Script. */
const GVGU_PWD_ITER=4000,GVGU_SESS_MILLIS=1000*60*60*24*7;
function gvguSheet_(name,headers){const ss=gvgPlanilha_();let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.appendRow(headers)}return sh}
function gvguSHA_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s)).map(x=>('0'+(x&255).toString(16)).slice(-2)).join('')}
function gvguHash_(password,salt){let s=salt+'|'+password;for(let i=0;i<GVGU_PWD_ITER;i++)s=gvguSHA_(s);return s}
function gvguUsuarios_(){const ss=gvgPlanilha_();const existing=ss.getSheetByName('USUARIOS_GVG')||ss.getSheetByName('GVG_USUARIOS');return existing||gvguSheet_('GVG_USUARIOS',['ID','Nome','Login','WhatsApp','Salt','Senha_hash','Status','Data_cadastro','Data_status','E-mail','Perfil'])}
function gvguSessoes_(){return gvguSheet_('SESSOES_GVG',['Token_hash','Usuario_ID','Expira_em','Revogada'])}
function gvguVinculos_(){return gvguSheet_('PEDIDOS_USUARIOS',['Pedido_ID','Usuario_ID'])}
function gvguAuditar_(acao,id,det){abasGestao_().getSheetByName('AUDITORIA').appendRow([new Date(),acao,id,'USUARIOS_GVG',String(det||'').slice(0,200)])}
function cadastrarFuncionario(d){
 const rawLogin=String(d&&(d.login||d.email)||'').trim().toLowerCase(),senha=String(d&&d.senha||''),nome=String(d&&d.nome||rawLogin).trim().slice(0,120),whats=String(d&&d.whatsapp||'').replace(/\D/g,''),email=String(d&&d.email||'').trim().toLowerCase();
 const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawLogin);
 if(!rawLogin)throw new Error('Informe um usuário.');
 if(!isEmail&&!/^[a-z0-9._-]{2,40}$/.test(rawLogin))throw new Error('Usuário: use de 2 a 40 letras sem acentos, números, ponto, traço ou sublinhado, sem espaços.');
 if(senha.length<1||senha.length>128)throw new Error('Informe uma senha de 1 a 128 caracteres.');
 if(whats&&!(whats.length>=10&&whats.length<=13))throw new Error('WhatsApp inválido.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const sh=gvguUsuarios_(),v=sh.getDataRange().getValues();
 const iguais=v.map((r,i)=>({r,i})).filter(x=>x.i>0&&(String(x.r[9]||'').trim().toLowerCase()===rawLogin||String(x.r[2]||'').trim().toLowerCase()===rawLogin));
 if(iguais.some(x=>String(x.r[6]).trim().toUpperCase()!=='EXCLUIDO'))throw new Error('Este usuário já está cadastrado.');
 for(let n=iguais.length-1;n>=0;n--){const x=iguais[n];gvguExcluirCadastro_(sh,x.i+1,x.r[0]);}
 const id='USR-'+Utilities.getUuid(),salt=Utilities.getUuid();sh.appendRow([id,textoSeguro_(nome||rawLogin,120),rawLogin,whats,salt,gvguHash_(senha,salt),'PENDENTE',new Date(),new Date(),email||(isEmail?rawLogin:''),'CONSULTA']);gvguAuditar_('CADASTRO_PENDENTE',id,rawLogin);return {status:'PENDENTE',mensagem:'Cadastro enviado para aprovação do administrador.'};
 }finally{lock.releaseLock()}
}
function gvguVerificarSessao_(token){
 const hash=gvguSHA_(token||'');if(!token||String(token).length<20)throw new Error('Entre na sua conta para solicitar materiais.');
 const ss=gvguSessoes_().getDataRange().getValues();const r=ss.find((x,i)=>i>0&&x[0]===hash&&x[3]!=='SIM'&&Number(x[2])>Date.now());if(!r)throw new Error('Sessão expirada. Entre novamente.');
 const users=gvguUsuarios_().getDataRange().getValues();const user=users.find((x,i)=>i>0&&x[0]===r[1]&&x[6]==='ATIVO');if(!user)throw new Error('Acesso não autorizado ou bloqueado.');return {id:user[0],nome:user[1],login:user[2],email:String(user[9]||'').toLowerCase(),perfil:String(user[10]||'CONSULTA').toUpperCase()};
}
function entrarFuncionario(login,password){
 const l=String(login||'').trim().toLowerCase(),p=String(password||'');
 const users=gvguUsuarios_().getDataRange().getValues();const r=users.find((x,i)=>i>0&&(String(x[9]||'').trim().toLowerCase()===l||String(x[2]||'').trim().toLowerCase()===l));
 if(!r||gvguHash_(p,r[4])!==r[5])throw new Error('Usuário ou senha inválidos.');
 if(r[6]!=='ATIVO')throw new Error(r[6]==='PENDENTE'?'Cadastro aguardando aprovação.':'Acesso bloqueado.');
 const token=Utilities.getUuid()+Utilities.getUuid(),exp=Date.now()+GVGU_SESS_MILLIS;
 gvguSessoes_().appendRow([gvguSHA_(token),r[0],exp,'NÃO']);return {token,id:r[0],nome:r[1],login:r[2],email:String(r[9]||'').trim().toLowerCase(),perfil:String(r[10]||'CONSULTA').toUpperCase(),expira:exp};
}
function sessaoFuncionario(token){const u=gvguVerificarSessao_(token);return {nome:u.nome,login:u.login,email:u.email,perfil:u.perfil}}
function sairFuncionario(token){const h=gvguSHA_(token),sh=gvguSessoes_(),v=sh.getDataRange().getValues();for(let i=1;i<v.length;i++)if(v[i][0]===h)sh.getRange(i+1,4).setValue('SIM');return true}
function gvguVincularPedido_(ss,pedido,id){gvguVinculos_().appendRow([pedido,id])}
function meusPedidos(token){const u=gvguVerificarSessao_(token),ss=abasGestao_(),linked=gvguVinculos_().getDataRange().getValues();const ids=new Set(linked.slice(1).filter(r=>String(r[1])===u.id).map(r=>String(r[0])));
 const pedidos=ss.getSheetByName('PEDIDOS').getDataRange().getValues().slice(1).filter(r=>ids.has(String(r[0]))).map(r=>({id:String(r[0]),data:r[1] instanceof Date?r[1].toISOString():'',obra:r[3],status:r[6]}));
 const itens=ss.getSheetByName('ITENS_PEDIDO').getDataRange().getValues().slice(1).filter(r=>ids.has(String(r[0]))).map(r=>({id:String(r[0]),nome:r[2],solicitado:Number(r[3])||0,unidade:String(r[4]),entregue:r[6]===''?null:Number(r[6]),nota:String(r[8]||'')}));return {pedidos,itens};}
function adminUsuarios(pin){admin_(pin);return gvguUsuarios_().getDataRange().getValues().slice(1).map(r=>({id:r[0],nome:r[1],login:r[2],whatsapp:r[3],status:r[6],email:String(r[9]||''),perfil:String(r[10]||'CONSULTA').toUpperCase()}))}
// Uso interno, sempre sob o bloqueio de escrita de cadastro/gestão.
function gvguExcluirCadastro_(sh,row,id){
 const sessions=gvguSessoes_(),values=sessions.getDataRange().getValues();
 for(let j=values.length-1;j>0;j--)if(String(values[j][1])===String(id))sessions.deleteRow(j+1);
 sh.deleteRow(row);
 // Pedidos, itens e vínculos históricos mantêm seus IDs originais.
 gvguAuditar_('CADASTRO_EXCLUIDO',id,'Cadastro e sessões removidos; histórico de pedidos preservado.');
}
function adminSituacaoUsuario(pin,id,status,perfil){
 admin_(pin);status=String(status||'').toUpperCase();if(['ATIVO','BLOQUEADO','EXCLUIDO'].indexOf(status)<0)throw new Error('Status inválido.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const sh=gvguUsuarios_(),v=sh.getDataRange().getValues(),i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));
 if(i<0)throw new Error('Usuário não encontrado. Atualize a lista.');
 const adminUser=adminSessionUser_(pin),currentStatus=String(v[i][6]||'').toUpperCase(),currentPerfil=String(v[i][10]||'CONSULTA').toUpperCase();
 if(adminUser&&String(v[i][0])===String(adminUser.id)&&status!=='ATIVO')throw new Error('Você não pode bloquear ou excluir seu próprio usuário.');
 if(status!=='ATIVO'&&currentPerfil==='ADMIN'&&currentStatus==='ATIVO'&&activeAdminCount_()<=1)throw new Error('Não é permitido bloquear ou excluir o último administrador ativo.');
 if(status==='ATIVO'&&currentStatus==='PENDENTE'){
  const role=String(perfil||currentPerfil||'CONSULTA').toUpperCase()==='ADMIN'?'ADMIN':'CONSULTA';
  sh.getRange(i+1,11).setValue(role);
 }
 if(status==='EXCLUIDO'){
  gvguExcluirCadastro_(sh,i+1,id);
  SpreadsheetApp.flush();
  return {status:'EXCLUIDO',excluido:true};
 }
 sh.getRange(i+1,7).setValue(status);sh.getRange(i+1,9).setValue(new Date());
 if(status==='BLOQUEADO')revogarSessoesUsuario_(id);
 gvguAuditar_('STATUS_USUARIO',id,status+(perfil?' | '+perfil:''));return {status};
 }finally{lock.releaseLock()}
}
function adminDefinirPerfil(pin,id,perfil){
 admin_(pin);perfil=String(perfil||'').toUpperCase();if(['ADMIN','CONSULTA'].indexOf(perfil)<0)throw new Error('Perfil inválido.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const sh=gvguUsuarios_(),v=sh.getDataRange().getValues(),i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));
 if(i<0)throw new Error('Usuário não encontrado. Atualize a lista.');
 const adminUser=adminSessionUser_(pin),currentPerfil=String(v[i][10]||'CONSULTA').toUpperCase();
 if(adminUser&&String(v[i][0])===String(adminUser.id)&&perfil!=='ADMIN')throw new Error('Você não pode remover seu próprio acesso administrativo.');
 if(currentPerfil==='ADMIN'&&perfil!=='ADMIN'&&String(v[i][6]||'').toUpperCase()==='ATIVO'&&activeAdminCount_()<=1)throw new Error('Não é permitido rebaixar o último administrador ativo.');
 sh.getRange(i+1,11).setValue(perfil);sh.getRange(i+1,9).setValue(new Date());
 gvguAuditar_('ALTERAR_PERFIL',id,perfil);return {ok:true,perfil:perfil};
 }finally{lock.releaseLock()}
}
function adminRedefinirSenha(pin,id,nova){
 admin_(pin);const senha=String(nova==null?'':nova);if(!senha||senha.length>128)throw new Error('Informe uma senha de 1 a 128 caracteres.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const sh=gvguUsuarios_(),v=sh.getDataRange().getValues(),i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));
 if(i<0)throw new Error('Usuário não encontrado. Atualize a lista.');
 const salt=Utilities.getUuid();sh.getRange(i+1,5,1,2).setValues([[salt,gvguHash_(senha,salt)]]);sh.getRange(i+1,9).setValue(new Date());
 const adminUser=adminSessionUser_(pin);revogarSessoesUsuario_(id,adminUser&&String(adminUser.id)===String(id)?pin:'');gvguAuditar_('REDEFINIR_SENHA',id,'Senha redefinida pelo administrador.');
 return {ok:true};
 }finally{lock.releaseLock()}
}

// Sessão administrativa: salva somente o hash do token e a versão da credencial.
// A senha nunca é devolvida nem armazenada no navegador.
function gvgaChaveSessao_(token){return 'GVG_ADM_SESSAO_'+gvguSHA_(String(token||''));}
function gvgaSessaoValida_(token){
 if(!/^GVGA-[a-f0-9-]{72}$/i.test(String(token||'')))return false;
 const props=PropertiesService.getScriptProperties(),h=props.getProperty('GVG_ADMIN_HASH');
 const raw=props.getProperty(gvgaChaveSessao_(token));if(!h||!raw)return false;
 let session;try{session=JSON.parse(raw)}catch(e){return false}
 return session.credencial===h;
}
function entrarAdminGVG(pin){
 const props=PropertiesService.getScriptProperties(),h=props.getProperty('GVG_ADMIN_HASH');
 if(!h||!pin||hashPin_(pin)!==h)throw new Error('Credencial de administrador inválida.');
 const token='GVGA-'+Utilities.getUuid()+Utilities.getUuid();
 props.setProperty(gvgaChaveSessao_(token),JSON.stringify({credencial:h,criadaEm:Date.now()}));
 return {token};
}
function validarSessaoAdminGVG(token){
 if(gvgaSessaoValida_(token))return {ok:true};
 try{const u=gvguVerificarSessao_(token);if(String(u.perfil||'').toUpperCase()==='ADMIN')return {ok:true,nome:u.nome,email:u.email};}catch(e){}
 return {ok:false};
}
function sairAdminGVG(token){
 if(/^GVGA-[a-f0-9-]{72}$/i.test(String(token||'')))PropertiesService.getScriptProperties().deleteProperty(gvgaChaveSessao_(token));
 return {ok:true};
}
function estadoSessaoFuncionarioGVG(token){
 try{const u=gvguVerificarSessao_(token);return {ok:true,id:u.id,nome:u.nome,login:u.login,email:u.email,perfil:u.perfil};}
 catch(e){const message=String(e&&e.message||e);
  if(/^(Entre na sua conta para solicitar materiais\.|Sessão expirada\. Entre novamente\.|Acesso não autorizado ou bloqueado\.)$/.test(message))return {ok:false};
  throw e;
 }
}
// Consulta leve para alertas: não lê itens nem modifica o relatório aberto.
function avisosPedidosAdminGVG(credencial){
 admin_(credencial);const sh=gvgPlanilha_().getSheetByName('PEDIDOS');
 if(!sh||sh.getLastRow()<2)return {ids:[],total:0};
 const rows=sh.getRange(2,1,sh.getLastRow()-1,7).getValues();
 const finalizados=['ENTREGUE','ENTREGUE PARCIAL','NÃO ENTREGUE','CANCELADO'];
 const ids=rows.filter(r=>r[0]&&!finalizados.includes(String(r[6]||'').trim().toUpperCase())).map(r=>String(r[0]));
 return {ids,total:ids.length};
}

// Preferência de voz vinculada à sessão administrativa, preservada após F5.
function preferenciaVozAdminGVG(token,ativa){
 admin_(token);
 const props=PropertiesService.getScriptProperties(),key=gvgaChaveSessao_(token)+'_VOZ';
 if(typeof ativa!=='undefined'){
  if(typeof ativa!=='boolean')throw new Error('Preferência de voz inválida.');
  props.setProperty(key,ativa?'1':'0');
 }
 return {ativa:props.getProperty(key)==='1'};
}

// ===== PAINEL GVG&ARTEFAL | visão geral =====
function autorizarAmbiente(){
  const ss=gvgPlanilha_();
  const fotos=DriveApp.getFolderById(GVG_FOTOS_FOLDER_ID);
  const anexos=DriveApp.getFolderById(GVG_ANEXOS_FOLDER_ID);
  return {ok:true,planilha:ss.getName(),fotos:fotos.getName(),anexos:anexos.getName(),usuario:Session.getActiveUser().getEmail()};
}
function testarNovaBase(){
  const c=getCatalogo();
  return {planilha:gvgPlanilha_().getName(),produtos:c.produtos.length,obras:c.obras.length,whatsappConfigurado:Boolean(c.whatsapp),ambiente:String(c.titulo||'')};
}
function painelData_(v){
  if(!v)return '';
  if(v instanceof Date)return Utilities.formatDate(v,Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm');
  return String(v);
}
function getPainelInicial(sessao){
  let usuario;
  try{usuario=gvguVerificarSessao_(sessao);}catch(e){return {ok:false,error:String(e&&e.message||e)};}
  try{
    const ss=abasGestao_();
    const pedidos=ss.getSheetByName('PEDIDOS').getDataRange().getValues().slice(1).filter(r=>r[0]);
    const itens=ss.getSheetByName('ITENS_PEDIDO').getDataRange().getValues().slice(1).filter(r=>r[0]);
    const produtos=ss.getSheetByName('PRODUTOS').getDataRange().getValues().slice(1).filter(r=>r[0]&&r[1]);
    const obras=ss.getSheetByName('OBRAS').getDataRange().getValues().slice(1).filter(r=>r[0]&&String(r[1]).toUpperCase()==='SIM');
    const config=ss.getSheetByName('CONFIG').getDataRange().getValues().slice(1);
    const cfg=key=>{const r=config.find(x=>String(x[0])===key);return r?r[1]:'';};
    const finalizados=['ENTREGUE','ENTREGUE PARCIAL','NÃO ENTREGUE','CANCELADO'];
    const lista=pedidos.map(r=>({
      id:String(r[0]),
      data:painelData_(r[1]),
      dataOrdenacao:r[1] instanceof Date?r[1].getTime():0,
      solicitante:String(r[2]||''),
      obra:String(r[3]||''),
      observacao:String(r[4]||''),
      canal:String(r[5]||''),
      status:String(r[6]||''),
      entrega:painelData_(r[7])
    })).sort((a,b)=>b.dataOrdenacao-a.dataOrdenacao);
    const abertos=lista.filter(p=>!finalizados.includes(p.status.toUpperCase())).length;
    const entregues=lista.filter(p=>p.status==='ENTREGUE'||p.status==='ENTREGUE PARCIAL').length;
    const mapaProdutos={};
    itens.forEach(r=>{
      const nome=String(r[2]||'');
      if(!nome)return;
      const q=Number(r[3])||0;
      if(!mapaProdutos[nome])mapaProdutos[nome]={nome,quantidade:0,pedidos:0};
      mapaProdutos[nome].quantidade+=q;
      mapaProdutos[nome].pedidos++;
    });
    const topProdutos=Object.values(mapaProdutos).sort((a,b)=>b.quantidade-a.quantidade).slice(0,5);
    return {
      ok:true,
      usuario:{nome:usuario.nome,login:usuario.login,email:usuario.email,perfil:usuario.perfil},
      ambiente:String(cfg('AMBIENTE')||'TESTE'),
      atualizadoEm:Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'),
      vazio:lista.length===0,
      indicadores:{
        totalPedidos:lista.length,
        abertos:abertos,
        entregues:entregues,
        itens:itens.length,
        produtosAtivos:produtos.filter(r=>String(r[6]).toUpperCase()==='SIM').length,
        obrasAtivas:obras.length
      },
      recentes:lista.slice(0,8),
      topProdutos:topProdutos
    };
  }catch(e){
    return {ok:false,error:'Não foi possível carregar os indicadores: '+String(e&&e.message||e)};
  }
}
