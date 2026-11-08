/** GVG&ARTEFAL — Painel Interno | módulo Pedidos (Apps Script) */
// Base ativa: cópia de teste do app oficial de Pedidos (06/11/2026).
// Original preservado em PLANILHA DE PEDIDOS (1IZ05GppQ5XkipMGPJo95M6TiznLq5VIq / 1tIy8EZpWKnD-tSl7cGMPX0cRBZwLIJYD6APD862ZKws).
const GVG_SPREADSHEET_ID = '19bO6gkJX9yre2a3Qzt5EUxsNacj_-sR9C6hrz-UhBG4';
const GVG_BASE_FOLDER_ID = '1eWXZren3iZClUFg4GU0yTIMg1h4__hb2';
const GVG_FOTOS_FOLDER_ID = '1eBVC5bV7wOqUszfS6roN5eYl5IZkXbLZ';
const GVG_PERFIL_FOLDER_ID = '1r899FRbDxLA23BmItwSiKlEDy7TEbB2d';
const GVG_ANEXOS_FOLDER_ID = '1FH8SACEEUe-mffzT4PigUt-m_hp0xnD1';
// Resumos somente leitura dos aplicativos existentes (uma informação por app).
const GVG_GASTOS_ID = '1lTz62h76XlmKnKJdSWTRW20s1sROe-0s6jgeTJTPs5Y';
const GVG_FORNECEDORES_ID = '1f0jl1mN5O0z_Dgy77_FotdYpHP0bEoUF4wEb65cXllk';
const GVG_MAQUINAS_ID = '1AnTsJ4KfZIvigbEnbO9gtu23J0Q1JWzevzCyaqN1jWI';
const GVG_FROTAS_ID = '1ck1lDtk_W9vjyQEnhV2Ze5secbayGLFfZi4Z0NuX-GY';
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
  if(modulo==='gastos')return doGetGastos_();
  if(modulo==='fornecedores')return doGetFornecedores_(e);
  if(modulo==='maquinas')return doGetMaquinas_();
  if(modulo==='maquinas-api')return maquinasApiGet_(e);
  return doGetPainel_(e);
}
function doPost(e){
  const modulo=String(e&&e.parameter&&e.parameter.modulo||'').toLowerCase();
  if(modulo==='maquinas-api')return maquinasApiPost_(e);
  return ContentService.createTextOutput(JSON.stringify({ok:false,error:{code:'ROTA_INVALIDA',message:'Rota não encontrada.'}})).setMimeType(ContentService.MimeType.JSON);
}
function doGetMaquinas_(){
  return HtmlService.createHtmlOutputFromFile('MaquinasIndex')
    .setTitle('GVG & ARTEFAL | Controle de Máquinas')
    .addMetaTag('viewport','width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
    .setFaviconUrl('https://higoragenteia.github.io/gvg-maquinas-ferramentas/icons/icone-180.png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGetGastos_(){
  return HtmlService.createHtmlOutputFromFile('GastosIndex')
    .setTitle('GVG & ARTEFAL | Controle de Gastos')
    .addMetaTag('viewport','width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
    .setFaviconUrl('https://higoragenteia.github.io/gvg-gastos/icons/apple-touch-icon-gastos-v3.png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGetFornecedores_(e){
  const modelo = HtmlService.createTemplateFromFile('FornecedoresIndex');
  modelo.initialView = String(e&&e.parameter&&e.parameter.view||'');
  return modelo.evaluate()
    .setTitle('GVG & ARTEFAL | Controle de Fornecedores')
    .addMetaTag('viewport','width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
    .setFaviconUrl('https://higoragenteia.github.io/gvg-fornecedores/icons/apple-touch-icon-v3.png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGetPedidos_(){
  const modelo = HtmlService.createTemplateFromFile('index');
  // O catálogo só é carregado depois do login, com sessão válida.
  modelo.initialData = 'null';
  return modelo.evaluate()
    .setTitle('PEDIDOS')
    .addMetaTag('viewport','width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGetPainel_(e){
  const modelo = HtmlService.createTemplateFromFile('Painel');
  const url=ScriptApp.getService().getUrl();
  modelo.pedidosUrl=url+(url.indexOf('?')>=0?'&':'?')+'modulo=pedidos';
  modelo.gastosUrl=url+(url.indexOf('?')>=0?'&':'?')+'modulo=gastos';
  modelo.fornecedoresUrl=url+(url.indexOf('?')>=0?'&':'?')+'modulo=fornecedores';
  modelo.maquinasUrl=url+(url.indexOf('?')>=0?'&':'?')+'modulo=maquinas';
  modelo.maquinasApiUrl=url+(url.indexOf('?')>=0?'&':'?')+'modulo=maquinas-api';
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

function getCatalogo(sessao){
  gvguVerificarSessao_(sessao);
  const cache=CacheService.getScriptCache();
  const cacheKey='gvg_catalogo_v2';
  const cached=cache.get(cacheKey);
  if(cached){try{return JSON.parse(cached);}catch(e){}}
  const ss = gvgPlanilha_();
  const values = ss.getSheetByName('PRODUTOS').getDataRange().getDisplayValues();
  const produtos = values.slice(1).filter(r=>r[0]&&r[1]&&String(r[6]).toUpperCase()!=='NÃO'&&String(r[6]).toUpperCase()!=='NAO').map(r=>({id:r[0],nome:r[1],categoria:r[2],unidade:r[3],descricao:r[4],porCaixa:fatorEmbalagemGVG_(r),imagem:r[7]||'',ativo:String(r[6]||'SIM').toUpperCase()}));
  const obras = ss.getSheetByName('OBRAS').getDataRange().getDisplayValues().slice(1).filter(r=>r[0]&&String(r[1]).toUpperCase()!=='NÃO'&&String(r[1]).toUpperCase()!=='NAO').map(r=>r[0]);
  const configs = ss.getSheetByName('CONFIG').getDataRange().getDisplayValues();
  const get=(key)=>{const row=configs.find(r=>r[0]===key);return row?row[1]:''};
  const out={produtos,obras,whatsapp:String(get('WHATSAPP_DESTINO')).replace(/\D/g,''),titulo:get('TITULO_APP')||'GVG • Catálogo de Materiais'};
  try{cache.put(cacheKey,JSON.stringify(out),300);}catch(e){}
  return out;
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
  try{CacheService.getScriptCache().remove('gvg_catalogo_v2');}catch(e){}
   return {id};
 }finally{lock.releaseLock()}
}
function alterarDisponibilidade(pin,id,novo){admin_(pin);if(!['SIM','NÃO','EM FALTA'].includes(novo))throw new Error('Situação inválida.');const lock=LockService.getScriptLock();lock.waitLock(20000);try{const ss=abasGestao_(),sh=ss.getSheetByName('PRODUTOS'),v=sh.getDataRange().getValues();const idx=v.findIndex((r,i)=>i>0&&String(r[0])===String(id));if(idx<0)throw new Error('Produto não encontrado.');sh.getRange(idx+1,7).setValue(novo);try{CacheService.getScriptCache().remove('gvg_catalogo_v2');}catch(e){}ss.getSheetByName('AUDITORIA').appendRow([new Date(),'DISPONIBILIDADE',id,v[idx][1],novo]);return true}finally{lock.releaseLock()}}
function gvguPerfilFolder_(){
  try{return DriveApp.getFolderById(GVG_PERFIL_FOLDER_ID);}catch(e){}
  const base=DriveApp.getFolderById(GVG_BASE_FOLDER_ID);
  const it=base.getFoldersByName('08 - Fotos de Perfil');
  return it.hasNext()?it.next():base.createFolder('08 - Fotos de Perfil');
}
function salvarFotoPerfil(sessao,foto){
  const auth=gvguVerificarSessao_(sessao);
  const data=String(foto&&foto.data||'');
  const m=data.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if(!m)throw new Error('Envie uma imagem JPG, PNG ou WebP.');
  const mime=m[1].toLowerCase(),bytes=Utilities.base64Decode(m[2]);
  if(bytes.length>1500000)throw new Error('A foto deve ter no máximo 1,5 MB.');
  const ext=/png/.test(mime)?'png':/webp/.test(mime)?'webp':'jpg';
  const folder=gvguPerfilFolder_();
  const file=folder.createFile(Utilities.newBlob(bytes,mime,'perfil-'+auth.id+'-'+Utilities.getUuid()+'.'+ext));
  try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(e){}
  const url='https://drive.google.com/thumbnail?id='+file.getId()+'&sz=w256';
  const sh=gvguUsuarios_(),col=gvguFotoCol_(sh),v=sh.getDataRange().getValues();
  const idx=v.findIndex((r,i)=>i>0&&String(r[0])===String(auth.id));
  if(idx<0)throw new Error('Usuário não encontrado.');
  sh.getRange(idx+1,col).setValue(url);
  return {url,arquivo:file.getId()};
}
// Registra SOLICITAÇÃO, não comprova envio no WhatsApp nem entrega de materiais.
function registrarSolicitacao(d){
 const auth=gvguVerificarSessao_(d&&d.sessao); const perm=String(auth.permissoes&&auth.permissoes.pedidos||'').toUpperCase(); if(perm!=='OPERADOR'&&perm!=='ADMIN')throw new Error('Seu acesso ao Pedidos é somente leitura.'); d.nome=auth.nome; d.usuarioId=auth.id;
 if(!d||!String(d.nome||'').trim()||!String(d.obra||'').trim()||!Array.isArray(d.itens)||!d.itens.length)throw new Error('Pedido incompleto.');
 if(d.itens.length>100)throw new Error('Limite de itens do pedido excedido.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
  const ss=abasGestao_(),sh=ss.getSheetByName('PRODUTOS');const vals=sh.getDataRange().getValues();const mapa=new Map(vals.slice(1).filter(r=>r[0]&&String(r[6]).toUpperCase()==='SIM').map(r=>[String(r[0]),r]));
  let linhas=[];for(const x of d.itens){const r=mapa.get(String(x.id));if(!r)throw new Error('Produto indisponível ou retirado: '+x.id+'. Atualize o catálogo.');const q=Number(x.quantidade);if(!Number.isInteger(q)||q<1||q>10000)throw new Error('Quantidade inválida.');const u=['Unidade','Caixa','Pacote','Litro','Quilo'].includes(x.unidade)?x.unidade:'Unidade';const f=fatorEmbalagemGVG_(r);if(['Caixa','Pacote'].includes(u)&&f<=1)throw new Error('Embalagem indisponível para '+r[1]);if(u==='Pacote'&&String(r[2]||'').trim().toLowerCase()!=='parafusos')throw new Error('Pacote indisponível para '+r[1]);const base=String(r[3]||'').toLowerCase();if(u==='Litro'&&!(/litro/.test(base)||/litro/.test(String(r[1]))))throw new Error('Litro indisponível para '+r[1]);if(u==='Quilo'&&!(/quilo/.test(base)||/estopa/.test(String(r[1]))))throw new Error('Quilo indisponível para '+r[1]);linhas.push([String(x.id),String(r[1]),q,u,q*(['Caixa','Pacote'].includes(u)?f:1)])}
  const pedido='PED-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();const agora=new Date();const p=ss.getSheetByName('PEDIDOS');p.appendRow([pedido,agora,textoSeguro_(d.nome,120),textoSeguro_(d.obra,120),textoSeguro_(d.observacao,500),String(d.canal||'WhatsApp'),'REGISTRADO — ENVIO NÃO VERIFICADO']);const itens=ss.getSheetByName('ITENS_PEDIDO');itens.getRange(itens.getLastRow()+1,1,linhas.length,6).setValues(linhas.map(x=>[pedido,...x]));gvguVincularPedido_(ss,pedido,d.usuarioId);try{CacheService.getScriptCache().remove('gvg_painel_v4_'+auth.id);}catch(e){}return {pedido};
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
const GVGU_PWD_ITER=4000,GVGU_PWD_ITER_FAST=400,GVGU_SESS_MILLIS=1000*60*60*24*7;
function gvguSheet_(name,headers){const ss=gvgPlanilha_();let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.appendRow(headers)}return sh}
function gvguSHA_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s)).map(x=>('0'+(x&255).toString(16)).slice(-2)).join('')}
function gvguHash_(password,salt,iter){let s=salt+'|'+password;const n=iter||GVGU_PWD_ITER;for(let i=0;i<n;i++)s=gvguSHA_(s);return s}
function gvguHashNovo_(password,salt){return 'F:'+GVGU_PWD_ITER_FAST+':'+gvguHash_(password,salt,GVGU_PWD_ITER_FAST)}
function gvguSenhaConfere_(password,salt,stored){
 const s=String(stored||'');
 if(/^F:\d+:[a-f0-9]+$/i.test(s)){const p=s.split(':');return gvguHash_(password,salt,Number(p[1]))===p[2];}
 return gvguHash_(password,salt)===s;
}
function gvguFotoCol_(sh){
  const headers=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),12)).getValues()[0];
  let col=headers.findIndex(h=>/foto/i.test(String(h)));
  if(col<0){sh.getRange(1,12).setValue('Foto (URL)');col=11;}
  return col+1;
}
const GVG_PERM_KEYS=['pedidos','gastos','fornecedores','frotas'];
function gvguPermValor_(v){v=String(v||'').toUpperCase();return ['VISUAL','OPERADOR','ADMIN'].indexOf(v)>=0?v:'';}
function gvguPermissoes_(r){return {pedidos:gvguPermValor_(r&&r[12]),gastos:gvguPermValor_(r&&r[13]),fornecedores:gvguPermValor_(r&&r[14]),frotas:gvguPermValor_(r&&r[15])};}
function gvguPermObj_(p){const o={};GVG_PERM_KEYS.forEach(k=>o[k]=gvguPermValor_(p&&p[k]));return o;}
function gvguPermHeaders_(sh){
  const h=sh.getRange(1,13,1,4).getValues()[0];
  if(String(h[0])!=='Perm_Pedidos'||String(h[1])!=='Perm_Gastos'||String(h[2])!=='Perm_Fornecedores'||String(h[3])!=='Perm_Frotas')sh.getRange(1,13,1,4).setValues([['Perm_Pedidos','Perm_Gastos','Perm_Fornecedores','Perm_Frotas']]);
}
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
 const id='USR-'+Utilities.getUuid(),salt=Utilities.getUuid();sh.appendRow([id,textoSeguro_(nome||rawLogin,120),rawLogin,whats,salt,gvguHashNovo_(senha,salt),'PENDENTE',new Date(),new Date(),email||(isEmail?rawLogin:''),'CONSULTA']);gvguAuditar_('CADASTRO_PENDENTE',id,rawLogin);return {status:'PENDENTE',mensagem:'Cadastro enviado para aprovação do administrador.'};
 }finally{lock.releaseLock()}
}
function gvguVerificarSessao_(token){
 const hash=gvguSHA_(token||'');if(!token||String(token).length<20)throw new Error('Entre na sua conta para solicitar materiais.');
 const sh=gvguUsuarios_(),fotoCol=gvguFotoCol_(sh);
 const ss=gvguSessoes_().getDataRange().getValues();const r=ss.find((x,i)=>i>0&&x[0]===hash&&x[3]!=='SIM'&&Number(x[2])>Date.now());if(!r)throw new Error('Sessão expirada. Entre novamente.');
 const users=sh.getDataRange().getValues();const user=users.find((x,i)=>i>0&&x[0]===r[1]&&x[6]==='ATIVO');if(!user)throw new Error('Acesso não autorizado ou bloqueado.');return {id:user[0],nome:user[1],login:user[2],email:String(user[9]||'').toLowerCase(),perfil:String(user[10]||'CONSULTA').toUpperCase(),foto:String(user[fotoCol-1]||''),permissoes:gvguPermissoes_(user)};
}
function entrarFuncionario(login,password){
 const l=String(login||'').trim().toLowerCase(),p=String(password||'');
 const sh=gvguUsuarios_(),fotoCol=gvguFotoCol_(sh),users=sh.getDataRange().getValues();const idx=users.findIndex((x,i)=>i>0&&(String(x[9]||'').trim().toLowerCase()===l||String(x[2]||'').trim().toLowerCase()===l));const r=idx>=0?users[idx]:null;
 if(!r||!gvguSenhaConfere_(p,r[4],r[5]))throw new Error('Usuário ou senha inválidos.');
 if(r[6]!=='ATIVO')throw new Error(r[6]==='PENDENTE'?'Cadastro aguardando aprovação.':'Acesso bloqueado.');
 if(!/^F:\d+:/.test(String(r[5]))){try{sh.getRange(idx+1,6).setValue(gvguHashNovo_(p,r[4]));}catch(e){}}
 const token=Utilities.getUuid()+Utilities.getUuid(),exp=Date.now()+GVGU_SESS_MILLIS;
 gvguSessoes_().appendRow([gvguSHA_(token),r[0],exp,'NÃO']);return {token,id:r[0],nome:r[1],login:r[2],email:String(r[9]||'').trim().toLowerCase(),perfil:String(r[10]||'CONSULTA').toUpperCase(),foto:String(r[fotoCol-1]||''),permissoes:gvguPermissoes_(r),expira:exp};
}
function sessaoFuncionario(token){const u=gvguVerificarSessao_(token);return {nome:u.nome,login:u.login,email:u.email,perfil:u.perfil,foto:u.foto||'',permissoes:u.permissoes||{}}}
function sairFuncionario(token){const h=gvguSHA_(token),sh=gvguSessoes_(),v=sh.getDataRange().getValues();for(let i=1;i<v.length;i++)if(v[i][0]===h)sh.getRange(i+1,4).setValue('SIM');return true}
function gvguVincularPedido_(ss,pedido,id){gvguVinculos_().appendRow([pedido,id])}
function meusPedidos(token){const u=gvguVerificarSessao_(token),ss=abasGestao_(),linked=gvguVinculos_().getDataRange().getValues();const ids=new Set(linked.slice(1).filter(r=>String(r[1])===u.id).map(r=>String(r[0])));
 const pedidos=ss.getSheetByName('PEDIDOS').getDataRange().getValues().slice(1).filter(r=>ids.has(String(r[0]))).map(r=>({id:String(r[0]),data:r[1] instanceof Date?r[1].toISOString():'',obra:r[3],status:r[6]}));
 const itens=ss.getSheetByName('ITENS_PEDIDO').getDataRange().getValues().slice(1).filter(r=>ids.has(String(r[0]))).map(r=>({id:String(r[0]),nome:r[2],solicitado:Number(r[3])||0,unidade:String(r[4]),entregue:r[6]===''?null:Number(r[6]),nota:String(r[8]||'')}));return {pedidos,itens};}
function adminUsuarios(pin){admin_(pin);const sh=gvguUsuarios_();gvguPermHeaders_(sh);return sh.getDataRange().getValues().slice(1).map(r=>({id:r[0],nome:r[1],login:r[2],whatsapp:r[3],status:r[6],email:String(r[9]||''),perfil:String(r[10]||'CONSULTA').toUpperCase(),foto:String(r[11]||''),permissoes:gvguPermissoes_(r)}))}
// Uso interno, sempre sob o bloqueio de escrita de cadastro/gestão.
function gvguExcluirCadastro_(sh,row,id){
 const sessions=gvguSessoes_(),values=sessions.getDataRange().getValues();
 for(let j=values.length-1;j>0;j--)if(String(values[j][1])===String(id))sessions.deleteRow(j+1);
 sh.deleteRow(row);
 // Pedidos, itens e vínculos históricos mantêm seus IDs originais.
 gvguAuditar_('CADASTRO_EXCLUIDO',id,'Cadastro e sessões removidos; histórico de pedidos preservado.');
}
function adminSituacaoUsuario(pin,id,status,perfil,permissoes){
 admin_(pin);status=String(status||'').toUpperCase();if(['ATIVO','BLOQUEADO','EXCLUIDO'].indexOf(status)<0)throw new Error('Status inválido.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const sh=gvguUsuarios_(),v=sh.getDataRange().getValues(),i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));
 if(i<0)throw new Error('Usuário não encontrado. Atualize a lista.');
 const adminUser=adminSessionUser_(pin),currentStatus=String(v[i][6]||'').toUpperCase(),currentPerfil=String(v[i][10]||'CONSULTA').toUpperCase();
 if(adminUser&&String(v[i][0])===String(adminUser.id)&&status!=='ATIVO')throw new Error('Você não pode bloquear ou excluir seu próprio usuário.');
 if(status!=='ATIVO'&&currentPerfil==='ADMIN'&&currentStatus==='ATIVO'&&activeAdminCount_()<=1)throw new Error('Não é permitido bloquear ou excluir o último administrador ativo.');
 let perms=null;
 if(status==='ATIVO'&&currentStatus==='PENDENTE'){
  perms=gvguPermObj_(permissoes||{pedidos:'OPERADOR'});
  const role=perms.pedidos==='ADMIN'?'ADMIN':'CONSULTA';
  sh.getRange(i+1,11).setValue(role);
  sh.getRange(i+1,13,1,4).setValues([[perms.pedidos,perms.gastos,perms.fornecedores,perms.frotas]]);
 }else if(permissoes){
  perms=gvguPermObj_(permissoes);
  sh.getRange(i+1,13,1,4).setValues([[perms.pedidos,perms.gastos,perms.fornecedores,perms.frotas]]);
 }
 if(status==='EXCLUIDO'){
  gvguExcluirCadastro_(sh,i+1,id);
  SpreadsheetApp.flush();
  return {status:'EXCLUIDO',excluido:true};
 }
 sh.getRange(i+1,7).setValue(status);sh.getRange(i+1,9).setValue(new Date());
 if(status==='BLOQUEADO')revogarSessoesUsuario_(id);
 gvguAuditar_('STATUS_USUARIO',id,status+(perms?' | '+JSON.stringify(perms):''));
 return {status,permissoes:perms};
 }finally{lock.releaseLock()}
}
function adminDefinirPermissoes(pin,id,permissoes){
 admin_(pin);const perms=gvguPermObj_(permissoes||{});
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
  const sh=gvguUsuarios_(),v=sh.getDataRange().getValues(),i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));
  if(i<0)throw new Error('Usuário não encontrado. Atualize a lista.');
  const adminUser=adminSessionUser_(pin),currentPerfil=String(v[i][10]||'CONSULTA').toUpperCase(),currentStatus=String(v[i][6]||'').toUpperCase();
  if(adminUser&&String(v[i][0])===String(adminUser.id)&&perms.pedidos!=='ADMIN')throw new Error('Você não pode remover seu próprio acesso de administrador do Pedidos.');
  if(currentPerfil==='ADMIN'&&perms.pedidos!=='ADMIN'&&currentStatus==='ATIVO'&&activeAdminCount_()<=1)throw new Error('Não é permitido rebaixar o último administrador ativo.');
  sh.getRange(i+1,13,1,4).setValues([[perms.pedidos,perms.gastos,perms.fornecedores,perms.frotas]]);
  const perfil=perms.pedidos==='ADMIN'?'ADMIN':'CONSULTA';
  sh.getRange(i+1,11).setValue(perfil);sh.getRange(i+1,9).setValue(new Date());
  gvguAuditar_('ALTERAR_PERMISSOES',id,JSON.stringify(perms));
  return {ok:true,permissoes:perms,perfil};
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
 const salt=Utilities.getUuid();sh.getRange(i+1,5,1,2).setValues([[salt,gvguHashNovo_(senha,salt)]]);sh.getRange(i+1,9).setValue(new Date());
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
 try{const u=gvguVerificarSessao_(token);return {ok:true,id:u.id,nome:u.nome,login:u.login,email:u.email,perfil:u.perfil,foto:u.foto||'',permissoes:u.permissoes||{}};}
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
function painelMes_(v){
  if(v instanceof Date&&!isNaN(v))return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM');
  const s=String(v||'');
  let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if(m)return m[3]+'-'+m[2];
  m=s.match(/^(\d{4})-(\d{2})/);
  if(m)return m[1]+'-'+m[2];
  return '';
}
function painelNumero_(v){
  if(typeof v==='number')return isFinite(v)?v:0;
  let s=String(v==null?'':v).replace(/[^\d,.-]/g,'');
  if(s.indexOf(',')>=0)s=s.replace(/\./g,'').replace(',','.');
  const n=Number(s);
  return isFinite(n)?n:0;
}
function painelMoeda_(n){
  return 'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function painelResumoGastos_(){
  const ss=SpreadsheetApp.openById(GVG_GASTOS_ID);
  const sh=ss.getSheetByName('Base de Dados');
  if(!sh)throw new Error('Aba Base de Dados não encontrada em Gastos.');
  const v=sh.getDataRange().getValues();
  const hi=v.findIndex(r=>String(r[0]).trim()==='Data');
  if(hi<0)throw new Error('Cabeçalho Data não encontrado em Gastos.');
  const headers=v[hi].map(x=>String(x).trim());
  const di=0, desci=headers.indexOf('Descrição do Gasto'), vi=headers.indexOf('Valor (R$)');
  const mes=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM');
  let total=0,recente=null,recenteMs=0;
  for(let i=hi+1;i<v.length;i++){
    const r=v[i];if(!r[di])continue;
    const valor=painelNumero_(vi>=0?r[vi]:0);
    if(painelMes_(r[di])===mes)total+=valor;
    const ms=r[di] instanceof Date?r[di].getTime():0;
    if(!recente||ms>=recenteMs){
      recenteMs=ms;
      recente={titulo:String(desci>=0?r[desci]||'Gasto':'Gasto'),detalhe:painelMoeda_(valor),data:r[di] instanceof Date?Utilities.formatDate(r[di],Session.getScriptTimeZone(),'dd/MM/yyyy'):String(r[di]||'')};
    }
  }
  return {valor:painelMoeda_(total),label:'gastos no mês',detalhe:'Total do mês atual',recente:recente};
}
function painelResumoFornecedores_(){
  const ss=SpreadsheetApp.openById(GVG_FORNECEDORES_ID);
  const sh=ss.getSheetByName('FORNECEDORES');
  if(!sh)throw new Error('Aba FORNECEDORES não encontrada.');
  const v=sh.getDataRange().getValues();
  const headers=(v[0]||[]).map(x=>String(x).trim());
  const si=headers.indexOf('Status'), ni=headers.indexOf('Fornecedor / Empresa'), ui=headers.indexOf('Atualizado em');
  let ativos=0,recente=null,recenteMs=0;
  for(let i=1;i<v.length;i++){
    const r=v[i];if(!r[ni])continue;
    if(String(si>=0?r[si]:'').trim().toLowerCase()==='ativo'){
      ativos++;
      const ms=ui>=0&&r[ui] instanceof Date?r[ui].getTime():0;
      if(!recente||ms>=recenteMs){recenteMs=ms;recente={titulo:String(r[ni]),detalhe:'Fornecedor ativo',data:ui>=0&&r[ui] instanceof Date?Utilities.formatDate(r[ui],Session.getScriptTimeZone(),'dd/MM/yyyy'):''};}
    }
  }
  return {valor:ativos,label:'fornecedores ativos',detalhe:'Cadastros com status ativo',recente:recente};
}
function painelResumoFrotas_(){
  const ss=SpreadsheetApp.openById(GVG_FROTAS_ID);
  const sh=ss.getSheetByName('Base de Dados');
  if(!sh)throw new Error('Aba Base de Dados não encontrada em Frotas.');
  const v=sh.getDataRange().getValues();
  const headers=(v[0]||[]).map(x=>String(x).trim());
  const idi=headers.indexOf('ID'), mi=headers.indexOf('Marca / Modelo'), pi=headers.indexOf('Placa');
  let total=0,recente=null;
  for(let i=1;i<v.length;i++){
    const r=v[i];if(!r[idi])continue;
    total++;
    recente={titulo:String(mi>=0?r[mi]||'Veículo':'Veículo'),detalhe:String(pi>=0?r[pi]||'':'')};
  }
  return {valor:total,label:'veículos na frota',detalhe:'Veículos cadastrados',recente:recente};
}
function painelResumoMaquinas_(){
  const ss=SpreadsheetApp.openById(GVG_MAQUINAS_ID);
  const sh=ss.getSheetByName('EQUIPAMENTOS');
  if(!sh)throw new Error('Aba EQUIPAMENTOS não encontrada em Máquinas.');
  const v=sh.getDataRange().getValues();
  const headers=(v[0]||[]).map(x=>String(x).trim());
  const si=headers.indexOf('STATUS'), qi=headers.indexOf('QUANTIDADE_DISPONIVEL'), ci=headers.indexOf('CODIGO'), di=headers.indexOf('DESCRICAO'), ui=headers.indexOf('ATUALIZADO_EM');
  let disponiveis=0,ativos=0,recente=null,recenteMs=0;
  for(let i=1;i<v.length;i++){
    const r=v[i];if(!r[ci]&&!r[di])continue;
    const status=String(si>=0?r[si]:'').trim().toUpperCase();
    if(status==='INATIVO')continue;
    ativos++;
    disponiveis+=painelNumero_(qi>=0?r[qi]:0);
    const ms=ui>=0&&r[ui] instanceof Date?r[ui].getTime():0;
    if(!recente||ms>=recenteMs){recenteMs=ms;recente={titulo:String(ci>=0?r[ci]||'Equipamento':'Equipamento'),detalhe:String(di>=0?r[di]||'':'') ,data:ui>=0?painelData_(r[ui]):''};}
  }
  return {valor:disponiveis,label:'equipamentos disponíveis',detalhe:ativos+' cadastros ativos',recente:recente};
}
function painelResumosExternos_(){
  const cache=CacheService.getScriptCache();
  const key='gvg_painel_resumos_v2';
  const cached=cache.get(key);
  if(cached){
    try{const parsed=JSON.parse(cached);if(parsed&&parsed.gastos&&parsed.fornecedores&&parsed.maquinas&&parsed.frotas)return parsed;}catch(e){}
  }
  let gastos={valor:'—',label:'gastos no mês',detalhe:'Indisponível',recente:null};
  let fornecedores={valor:'—',label:'fornecedores ativos',detalhe:'Indisponível',recente:null};
  let maquinas={valor:'—',label:'equipamentos disponíveis',detalhe:'Indisponível',recente:null};
  let frotas={valor:'—',label:'veículos na frota',detalhe:'Indisponível',recente:null};
  try{gastos=painelResumoGastos_()}catch(e){}
  try{fornecedores=painelResumoFornecedores_()}catch(e){}
  try{maquinas=painelResumoMaquinas_()}catch(e){}
  try{frotas=painelResumoFrotas_()}catch(e){}
  const out={gastos:gastos,fornecedores:fornecedores,maquinas:maquinas,frotas:frotas};
  try{cache.put(key,JSON.stringify(out),900);}catch(e){}
  return out;
}
function aquecerResumos(){
  const r=painelResumosExternos_();
  return {gastos:r.gastos.valor,fornecedores:r.fornecedores.valor,maquinas:r.maquinas.valor,frotas:r.frotas.valor};
}
function getPainelInicial(sessao){
  let usuario;
  try{usuario=gvguVerificarSessao_(sessao);}catch(e){return {ok:false,error:String(e&&e.message||e)};}
  const cache=CacheService.getScriptCache();
  const cacheKey='gvg_painel_v4_'+usuario.id;
  const cached=cache.get(cacheKey);
  if(cached){
    try{
      const out=JSON.parse(cached);
      out.usuario={id:usuario.id,nome:usuario.nome,login:usuario.login,email:usuario.email,perfil:usuario.perfil,foto:usuario.foto||'',permissoes:usuario.permissoes||{}};
      return out;
    }catch(e){}
  }
  try{
    const ss=abasGestao_();
    const pedidos=ss.getSheetByName('PEDIDOS').getDataRange().getValues().slice(1).filter(r=>r[0]);
    const config=ss.getSheetByName('CONFIG').getDataRange().getValues().slice(1);
    const cfg=key=>{const r=config.find(x=>String(x[0])===key);return r?r[1]:'';};
    const finalizados=['ENTREGUE','ENTREGUE PARCIAL','NÃO ENTREGUE','CANCELADO'];
    let abertos=0,latest=null,latestMs=-1;
    pedidos.forEach(r=>{
      const status=String(r[6]||'');
      if(!finalizados.includes(status.toUpperCase()))abertos++;
      const ms=r[1] instanceof Date?r[1].getTime():0;
      if(!latest||ms>=latestMs){latestMs=ms;latest={id:String(r[0]),status:status,data:painelData_(r[1])};}
    });
    let externos=null;
    try{const ext=cache.get('gvg_painel_resumos_v2');if(ext)externos=JSON.parse(ext);}catch(e){}
    if(!externos||!externos.gastos||!externos.maquinas)externos={gastos:{valor:'—',label:'gastos no mês',detalhe:'Carregando…',recente:null},fornecedores:{valor:'—',label:'fornecedores ativos',detalhe:'Carregando…',recente:null},maquinas:{valor:'—',label:'equipamentos disponíveis',detalhe:'Carregando…',recente:null},frotas:{valor:'—',label:'veículos na frota',detalhe:'Carregando…',recente:null}};
    const gastos=externos.gastos,fornecedores=externos.fornecedores,maquinas=externos.maquinas,frotas=externos.frotas;
    const pedidosResumo={valor:pedidos.length,label:pedidos.length===1?'pedido registrado':'pedidos registrados',detalhe:abertos===1?'1 em andamento':abertos+' em andamento',recente:latest?{titulo:latest.id,detalhe:latest.status,data:latest.data}:null};
    const apps={pedidos:pedidosResumo,gastos:gastos,fornecedores:fornecedores,maquinas:maquinas,frotas:frotas};
    const atividades=[
      {app:'Pedidos',tone:'gold',titulo:pedidosResumo.recente?pedidosResumo.recente.titulo:'Sem pedidos recentes',detalhe:pedidosResumo.recente?pedidosResumo.recente.detalhe:'',data:pedidosResumo.recente?pedidosResumo.recente.data:''},
      {app:'Controle de Gastos',tone:'green',titulo:gastos.recente?gastos.recente.titulo:'Sem gastos recentes',detalhe:gastos.recente?gastos.recente.detalhe:'',data:gastos.recente?gastos.recente.data:''},
      {app:'Fornecedores',tone:'purple',titulo:fornecedores.recente?fornecedores.recente.titulo:'Sem fornecedores recentes',detalhe:fornecedores.recente?fornecedores.recente.detalhe:'',data:fornecedores.recente?fornecedores.recente.data:''},
      {app:'Frotas',tone:'blue',titulo:frotas.recente?frotas.recente.titulo:'Sem veículos recentes',detalhe:frotas.recente?frotas.recente.detalhe:'',data:''}
    ];
    const out={ok:true,usuario:{id:usuario.id,nome:usuario.nome,login:usuario.login,email:usuario.email,perfil:usuario.perfil,foto:usuario.foto||'',permissoes:usuario.permissoes||{}},ambiente:String(cfg('AMBIENTE')||'TESTE'),atualizadoEm:Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'),vazio:pedidos.length===0,apps:apps,atividades:atividades};
    try{cache.put(cacheKey,JSON.stringify(out),30);}catch(e){}
    return out;
  }catch(e){
    return {ok:false,error:'Não foi possível carregar os indicadores: '+String(e&&e.message||e)};
  }
}
function getPainelExternos(sessao){
  try{gvguVerificarSessao_(sessao);}catch(e){return {ok:false,error:String(e&&e.message||e)};}
  try{
    const r=painelResumosExternos_();
    return {ok:true,apps:{gastos:r.gastos,fornecedores:r.fornecedores,maquinas:r.maquinas,frotas:r.frotas}};
  }catch(e){return {ok:false,error:'Não foi possível carregar os resumos: '+String(e&&e.message||e)};}
}

