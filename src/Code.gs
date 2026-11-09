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
  if(modulo==='pedidos')return doGetPedidos_(e);
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
  const modelo=HtmlService.createTemplateFromFile('MaquinasIndex');
  const url=ScriptApp.getService().getUrl();
  modelo.maquinasApiUrl=url+(url.indexOf('?')>=0?'&':'?')+'modulo=maquinas-api';
  return modelo.evaluate()
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
function doGetPedidos_(e){
  const modelo = HtmlService.createTemplateFromFile('index');
  // O catálogo só é carregado depois do login, com sessão válida.
  modelo.initialData = 'null';
  modelo.pedidoInicial = JSON.stringify(String(e&&e.parameter&&e.parameter.pedido||''));
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
  const auth=gvguVerificarSessao_(sessao);
  if(!gvguPodeVisualizar_(auth,'pedidos'))throw new Error('GVG_SEM_ACESSO_PROJETO: seu perfil não tem acesso ao Pedidos.');
  const acesso={nivel:gvguNivelProjeto_(auth,'pedidos'),podeOperar:gvguPodeOperar_(auth,'pedidos'),podeGerenciar:gvguPodeGerenciar_(auth,'pedidos')};
  const cache=CacheService.getScriptCache();
  const cacheKey='gvg_catalogo_v2';
  const cached=cache.get(cacheKey);
  if(cached){try{const out=JSON.parse(cached);out.acesso=acesso;return out;}catch(e){}}
  const ss = gvgPlanilha_();
  const values = ss.getSheetByName('PRODUTOS').getDataRange().getDisplayValues();
  const produtos = values.slice(1).filter(r=>r[0]&&r[1]&&String(r[6]).toUpperCase()!=='NÃO'&&String(r[6]).toUpperCase()!=='NAO').map(r=>({id:r[0],nome:r[1],categoria:r[2],unidade:r[3],descricao:r[4],porCaixa:fatorEmbalagemGVG_(r),imagem:r[7]||'',ativo:String(r[6]||'SIM').toUpperCase()}));
  const obras = ss.getSheetByName('OBRAS').getDataRange().getDisplayValues().slice(1).filter(r=>r[0]&&String(r[1]).toUpperCase()!=='NÃO'&&String(r[1]).toUpperCase()!=='NAO').map(r=>r[0]);
  const configs = ss.getSheetByName('CONFIG').getDataRange().getDisplayValues();
  const get=(key)=>{const row=configs.find(r=>r[0]===key);return row?row[1]:''};
  const out={produtos,obras,whatsapp:String(get('WHATSAPP_DESTINO')).replace(/\D/g,''),titulo:get('TITULO_APP')||'GVG • Catálogo de Materiais'};
  try{cache.put(cacheKey,JSON.stringify(out),300);}catch(e){}
  out.acesso=acesso;return out;
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
 if(/^GVGA-[a-f0-9-]{72}$/i.test(c)){if(!gvgaSessaoValida_(c))throw new Error('GVG_ADMIN_SESSAO_INVALIDA: entre novamente.');return {perfil:'SUPERADMIN',permissoes:{pedidos:'GERENCIAR'},superadmin:true};}
 if(c.length>=20){
  try{const u=gvguVerificarSessao_(c);if(gvguPodeGerenciar_(u,'pedidos'))return u;}catch(e){}
 }
 const h=PropertiesService.getScriptProperties().getProperty('GVG_ADMIN_HASH');if(h&&c&&hashPin_(c)===String(h))return {perfil:'SUPERADMIN',permissoes:{pedidos:'GERENCIAR'},superadmin:true};
 throw new Error('GVG_SEM_PERMISSAO_GERENCIAR: seu perfil não permite administrar o Pedidos.');
}
function revogarSessoesUsuario_(id,manterToken){const sh=gvguSessoes_(),v=sh.getDataRange().getValues(),keep=manterToken?gvguSHA_(String(manterToken)):'';for(let i=1;i<v.length;i++)if(String(v[i][1])===String(id)&&(!keep||String(v[i][0])!==keep))sh.getRange(i+1,4).setValue('SIM');}
function abasGestao_(forcar){
 const ss=gvgPlanilha_();
 if(GVG_GESTAO_EXECUCAO_)return ss;
 const cache=CacheService.getScriptCache();
 if(!forcar){try{if(cache.get('gvg_estrutura_ok_v2')==='1'){GVG_GESTAO_EXECUCAO_=true;return ss;}}catch(e){}}
 const defs=[
  ['PEDIDOS',['Pedido_ID','Data','Solicitante','Obra','Observacoes','Canal','Situacao','Data_entrega','Status_em','Status_por','Observacao_almoxarife','Atualizado_em','Atualizado_por']],
  ['ITENS_PEDIDO',['Pedido_ID','Codigo','Produto','Quantidade','Unidade','Unidades_equivalentes','Quantidade_entregue','Unidades_entregues','Observacao_entrega','Confirmado_em','Confirmado_por','Atualizado_em','Atualizado_por']],
  ['AUDITORIA',['Data','Acao','Codigo','Produto','Detalhes']],
  ['PEDIDO_HISTORICO',['Data','Pedido_ID','Acao','Produto','Qtd_solicitada','Qtd_anterior','Qtd_confirmada','Status_anterior','Status_novo','Usuario_ID','Usuario_nome','Observacao']],
  ['NOTIFICACOES',['ID','Pedido_ID','Usuario_ID','Tipo','Titulo','Mensagem','Criada_em','Lida','Lida_em']]
 ];
 defs.forEach(function(def){
  const name=def[0],header=def[1];
  let sh=ss.getSheetByName(name);
  if(!sh){try{sh=ss.insertSheet(name);}catch(e){sh=ss.getSheetByName(name);if(!sh)throw e;}}
  if(sh.getLastRow()===0){sh.getRange(1,1,1,header.length).setValues([header]);return;}
  const current=sh.getLastColumn();
  if(name==='PEDIDOS'&&current<13)sh.getRange(1,9,1,5).setValues([header.slice(8)]);
  if(name==='ITENS_PEDIDO'&&current<13)sh.getRange(1,10,1,4).setValues([header.slice(9)]);
  if((name==='PEDIDO_HISTORICO'||name==='NOTIFICACOES')&&current<header.length)sh.getRange(1,current+1,1,header.length-current).setValues([header.slice(current)]);
 });
 try{cache.put('gvg_estrutura_ok_v2','1',300);}catch(e){}
 GVG_GESTAO_EXECUCAO_=true;return ss;
}
function instalarAbasGestao(){try{const c=CacheService.getScriptCache();c.remove('gvg_estrutura_ok_v1');c.remove('gvg_estrutura_ok_v2');}catch(e){}abasGestao_(true);return 'Abas de gestão preparadas';}
function adminListar(pin){admin_(pin);const ss=abasGestao_();const produtos=ss.getSheetByName('PRODUTOS').getDataRange().getDisplayValues().slice(1).filter(r=>r[0]&&r[1]).map(r=>({id:r[0],nome:r[1],categoria:r[2],unidade:r[3],descricao:r[4],porCaixa:fatorEmbalagemGVG_(r),ativo:r[6]||'SIM',imagem:r[7]||''}));return {produtos};}
function textoSeguro_(x,max){let t=String(x==null?'':x).slice(0,max||200);return /^[=+@\-]/.test(t)?'\''+t:t;}

// ===== ACOMPANHAMENTO DE PEDIDOS =====
const GVG_STATUS_FLOW=['EM ANÁLISE','EM SEPARAÇÃO','PRONTO PARA RETIRADA','RETIRADO'];
function gvgStatusNormalizar_(v){
 const s=String(v==null?'':v).trim().toUpperCase().replace(/\s+/g,' ');
 if(!s)return 'EM ANÁLISE';
 if(/^EM\s*AN[ÁA]LISE$/.test(s)||/^REGISTRADO/.test(s))return 'EM ANÁLISE';
 if(/^EM\s*SEPARA/.test(s))return 'EM SEPARAÇÃO';
 if(/^PRONTO/.test(s))return 'PRONTO PARA RETIRADA';
 if(s==='RETIRADO'||s==='ENTREGUE'||s==='ENTREGUE PARCIAL'||s==='NÃO ENTREGUE'||s==='NAO ENTREGUE'||s==='CANCELADO')return 'RETIRADO';
 return s;
}
function gvgStatusIndex_(v){return GVG_STATUS_FLOW.indexOf(gvgStatusNormalizar_(v));}
function gvgStatusFinalizado_(v){return gvgStatusIndex_(v)===GVG_STATUS_FLOW.length-1;}
function gvgDataISO_(v){return v instanceof Date?v.toISOString():String(v||'');}
function gvgLinkPedido_(id){
 const base=ScriptApp.getService().getUrl();
 return base+(base.indexOf('?')>=0?'&':'?')+'modulo=pedidos&pedido='+encodeURIComponent(String(id||''));
}
function gvgDestinatariosPedido_(ss,pedido){
 const sh=ss.getSheetByName('PEDIDOS_USUARIOS');if(!sh)return [];
 const v=sh.getDataRange().getValues();const out=[];
 v.slice(1).forEach(function(r){if(String(r[0])===String(pedido)&&r[1]){const id=String(r[1]);if(out.indexOf(id)<0)out.push(id);}});
 return out;
}
function gvgNotifCacheKey_(uid){return 'gvg_notif_'+String(uid||'');}
function gvgNotifInvalidar_(uid){try{CacheService.getScriptCache().remove(gvgNotifCacheKey_(uid));}catch(e){}}
function gvgNotifSheet_(){return abasGestao_().getSheetByName('NOTIFICACOES');}
function gvgPedidoHistoricoSheet_(){return abasGestao_().getSheetByName('PEDIDO_HISTORICO');}
function gvgPedidoHistorico_(acao,pedido,info){
 info=info||{};const sh=gvgPedidoHistoricoSheet_();if(!sh)return;
 sh.appendRow([new Date(),String(pedido||''),String(acao||''),String(info.produto||''),info.qtdSolicitada===undefined?'':Number(info.qtdSolicitada),info.qtdAnterior===undefined||info.qtdAnterior===null?'':Number(info.qtdAnterior),info.qtdConfirmada===undefined?'':Number(info.qtdConfirmada),String(info.statusAnterior||''),String(info.statusNovo||''),String(info.usuarioId||''),String(info.usuarioNome||''),String(info.observacao||'').slice(0,500)]);
}
function gvgNotificarPedido_(ss,pedido,tipo,titulo,mensagem){
 const ids=gvgDestinatariosPedido_(ss,pedido);if(!ids.length)return 0;
 const sh=gvgNotifSheet_();if(!sh)return 0;
 const agora=new Date();let n=0;
 ids.forEach(function(uid){
  sh.appendRow(['NOT-'+Utilities.getUuid(),String(pedido),String(uid),String(tipo),String(titulo).slice(0,160),String(mensagem).slice(0,500),agora,'NÃO','']);
  gvgNotifInvalidar_(uid);n++;
 });
 return n;
}
function gvgNotificacaoStatusMensagem_(status){
 const s=gvgStatusNormalizar_(status);
 if(s==='EM SEPARAÇÃO')return 'Seu pedido está em separação pelo almoxarifado.';
 if(s==='PRONTO PARA RETIRADA')return 'Seus materiais estão prontos para retirada.';
 if(s==='RETIRADO')return 'Pedido retirado. Obrigado!';
 return 'Seu pedido está em análise pelo almoxarifado.';
}
function gvgNumeroQtd_(n){const v=Number(n);return Number.isFinite(v)?v.toLocaleString('pt-BR',{maximumFractionDigits:2}):'0';}

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
 const auth=gvguVerificarSessao_(d&&d.sessao); if(!gvguPodeOperar_(auth,'pedidos'))throw new Error('Seu acesso ao Pedidos é somente leitura.'); d.nome=auth.nome; d.usuarioId=auth.id;
 if(!d||!String(d.nome||'').trim()||!String(d.obra||'').trim()||!Array.isArray(d.itens)||!d.itens.length)throw new Error('Pedido incompleto.');
 if(d.itens.length>100)throw new Error('Limite de itens do pedido excedido.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
  const ss=abasGestao_(),sh=ss.getSheetByName('PRODUTOS');const vals=sh.getDataRange().getValues();const mapa=new Map(vals.slice(1).filter(r=>r[0]&&String(r[6]).toUpperCase()==='SIM').map(r=>[String(r[0]),r]));
  let linhas=[];for(const x of d.itens){const r=mapa.get(String(x.id));if(!r)throw new Error('Produto indisponível ou retirado: '+x.id+'. Atualize o catálogo.');const q=Number(x.quantidade);if(!Number.isInteger(q)||q<1||q>10000)throw new Error('Quantidade inválida.');const u=['Unidade','Caixa','Pacote','Litro','Quilo'].includes(x.unidade)?x.unidade:'Unidade';const f=fatorEmbalagemGVG_(r);if(['Caixa','Pacote'].includes(u)&&f<=1)throw new Error('Embalagem indisponível para '+r[1]);if(u==='Pacote'&&String(r[2]||'').trim().toLowerCase()!=='parafusos')throw new Error('Pacote indisponível para '+r[1]);const base=String(r[3]||'').toLowerCase();if(u==='Litro'&&!(/litro/.test(base)||/litro/.test(String(r[1]))))throw new Error('Litro indisponível para '+r[1]);if(u==='Quilo'&&!(/quilo/.test(base)||/estopa/.test(String(r[1]))))throw new Error('Quilo indisponível para '+r[1]);linhas.push([String(x.id),String(r[1]),q,u,q*(['Caixa','Pacote'].includes(u)?f:1)])}
  const pedido='PED-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();
  const agora=new Date();const p=ss.getSheetByName('PEDIDOS');
  p.appendRow([pedido,agora,textoSeguro_(d.nome,120),textoSeguro_(d.obra,120),textoSeguro_(d.observacao,500),String(d.canal||'WhatsApp'),'EM ANÁLISE','',agora,auth.nome,'',agora,auth.nome]);
  const itens=ss.getSheetByName('ITENS_PEDIDO');
  itens.getRange(itens.getLastRow()+1,1,linhas.length,13).setValues(linhas.map(x=>[pedido,...x,'','','','','',agora,auth.nome]));
  gvguVincularPedido_(ss,pedido,d.usuarioId);
  gvgPedidoHistorico_('CRIADO',pedido,{statusNovo:'EM ANÁLISE',usuarioId:auth.id,usuarioNome:auth.nome,observacao:'Pedido registrado pelo aplicativo.'});
  try{const cache=CacheService.getScriptCache();cache.remove('gvg_painel_v4_'+auth.id);cache.remove('gvg_painel_pedidos_v1');}catch(e){}
  return {pedido,link:gvgLinkPedido_(pedido)};
 }finally{lock.releaseLock()}
}
function relatorioAdmin(pin){
 admin_(pin);
 const ss=abasGestao_();
 const p=ss.getSheetByName('PEDIDOS').getDataRange().getValues().slice(1).filter(r=>r[0]);
 const i=ss.getSheetByName('ITENS_PEDIDO').getDataRange().getValues().slice(1).filter(r=>r[0]);
 const pedidos=p.map(r=>({
  id:String(r[0]),data:gvgDataISO_(r[1]),solicitante:String(r[2]||''),obra:String(r[3]||''),canal:String(r[5]||''),
  situacao:gvgStatusNormalizar_(r[6]),dataEntrega:gvgDataISO_(r[7]),statusEm:gvgDataISO_(r[8]),statusPor:String(r[9]||''),
  observacaoAlmox:String(r[10]||''),atualizadoEm:gvgDataISO_(r[11]),atualizadoPor:String(r[12]||'')
 }));
 const itens=i.map(r=>({
  id:String(r[0]),codigo:String(r[1]||''),nome:String(r[2]||''),qtd:Number(r[3])||0,unidade:String(r[4]||''),equiv:Number(r[5])||0,
  entregue:r[6]===''?null:Number(r[6])||0,entregueEquiv:r[7]===''?0:Number(r[7])||0,nota:String(r[8]||''),
  confirmadoEm:gvgDataISO_(r[9]),confirmadoPor:String(r[10]||''),atualizadoEm:gvgDataISO_(r[11]),atualizadoPor:String(r[12]||'')
 }));
 return {pedidos,itens};
}
function historicoPedido(credencial,id){
 admin_(credencial);
 const sh=gvgPedidoHistoricoSheet_();if(!sh||sh.getLastRow()<2)return {historico:[]};
 const v=sh.getDataRange().getValues().slice(1);
 const historico=v.filter(r=>String(r[1])===String(id)).map(r=>({
  data:gvgDataISO_(r[0]),pedidoId:String(r[1]||''),acao:String(r[2]||''),produto:String(r[3]||''),
  qtdSolicitada:r[4]===''?null:Number(r[4]),qtdAnterior:r[5]===''?null:Number(r[5]),qtdConfirmada:r[6]===''?null:Number(r[6]),
  statusAnterior:String(r[7]||''),statusNovo:String(r[8]||''),usuarioId:String(r[9]||''),usuarioNome:String(r[10]||''),observacao:String(r[11]||'')
 }));
 return {historico};
}
function atualizarPedidoAdmin(credencial,id,dados){
 const ator=admin_(credencial);id=String(id||'').trim();dados=dados||{};
 if(!id)throw new Error('Pedido não informado.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const ss=abasGestao_(),ps=ss.getSheetByName('PEDIDOS'),its=ss.getSheetByName('ITENS_PEDIDO');
  const p=ps.getDataRange().getValues();const row=p.findIndex((r,i)=>i>0&&String(r[0])===id);
  if(row<0)throw new Error('Pedido não encontrado.');
  const statusAtual=gvgStatusNormalizar_(p[row][6]);
  if(statusAtual==='RETIRADO')throw new Error('Pedido já retirado. Não é possível alterar.');
  const novoStatus=dados.status?gvgStatusNormalizar_(dados.status):statusAtual;
  if(gvgStatusIndex_(novoStatus)<0)throw new Error('Status inválido.');
  if(gvgStatusIndex_(novoStatus)<gvgStatusIndex_(statusAtual))throw new Error('Não é permitido voltar o status do pedido.');
  const precisaItens=dados.itens!==undefined||novoStatus==='RETIRADO';
  const rows=[];
  if(precisaItens){
   const v=its.getDataRange().getValues();
   for(let i=1;i<v.length;i++)if(String(v[i][0])===id)rows.push({idx:i,rec:v[i]});
  }
  if(precisaItens&&!rows.length)throw new Error('Pedido sem itens.');
  if(novoStatus==='RETIRADO'){
   const pendentes=[];rows.forEach(function(o){
    const codigo=String(o.rec[1]),unidade=String(o.rec[4]);let q=o.rec[6]===''?null:Number(o.rec[6]);
    if(Array.isArray(dados.itens)){const inp=dados.itens.find(function(x){return String(x&&x.codigo)===codigo&&String(x&&x.unidade)===unidade;});if(inp&&inp.qtd!==undefined&&inp.qtd!==null&&String(inp.qtd).trim()!=='')q=Number(inp.qtd);}
    if(q===null)pendentes.push(String(o.rec[2]||codigo));
   });
   if(pendentes.length)throw new Error('Confirme todos os itens antes de finalizar. Pendentes: '+pendentes.join(', ')+'. Use 0 para material indisponível.');
  }
  const agora=new Date();const changes=[];
  if(dados.itens!==undefined){
   if(!Array.isArray(dados.itens))throw new Error('Conferência inválida.');
   const byKey=new Map();rows.forEach(function(o){byKey.set(String(o.rec[1])+'|'+String(o.rec[4]),o);});
   const seen=new Set();
   dados.itens.forEach(function(inp){
    const codigo=String(inp&&inp.codigo||''),unidade=String(inp&&inp.unidade||'');const key=codigo+'|'+unidade;
    const o=byKey.get(key);if(!o)throw new Error('Item não pertence ao pedido: '+key);if(seen.has(key))throw new Error('Item duplicado na conferência: '+key);seen.add(key);
    // Campo vazio/null = item ainda pendente; não altera nem confirma os demais.
    if(inp.qtd===undefined||inp.qtd===null||String(inp.qtd).trim()==='')return;
    const asked=Number(o.rec[3])||0;const qty=Number(inp.qtd);
    if(!Number.isInteger(qty)||qty<0||qty>asked)throw new Error('Quantidade confirmada inválida para '+o.rec[2]+'. Use de 0 a '+asked+'.');
    const nota=String(inp.nota||'').slice(0,200);
    const anterior=o.rec[6]===''?null:Number(o.rec[6]);const notaAnterior=String(o.rec[8]||'');
    if(anterior!==qty||notaAnterior!==nota){
     const perUnit=asked>0?Number(o.rec[5])/asked:1;const equiv=Math.round(qty*perUnit*100)/100;
     its.getRange(o.idx+1,7,1,7).setValues([[qty,equiv,nota,agora,ator.nome,agora,ator.nome]]);
     changes.push({codigo,nome:String(o.rec[2]||''),unidade,asked,anterior,qtd:qty,nota,equiv});
    }
   });
  }
  const obsNova=dados.observacaoAlmox!==undefined?String(dados.observacaoAlmox||'').trim().slice(0,500):String(p[row][10]||'');
  const obsAnterior=String(p[row][10]||'');
  const statusMudou=novoStatus!==statusAtual;const obsMudou=obsNova!==obsAnterior;
  if(!statusMudou&&!obsMudou&&!changes.length)return {ok:true,status:statusAtual,alteracoes:0,notificacoes:0};
  const dataEntrega=statusMudou&&novoStatus==='RETIRADO'?agora:(p[row][7]||'');
  const statusEm=statusMudou?agora:(p[row][8]||'');
  const statusPor=statusMudou?ator.nome:(p[row][9]||'');
  ps.getRange(row+1,7,1,7).setValues([[novoStatus,dataEntrega,statusEm,statusPor,obsNova,agora,ator.nome]]);
  if(statusMudou)gvgPedidoHistorico_('STATUS',id,{statusAnterior:statusAtual,statusNovo:novoStatus,usuarioId:ator.id,usuarioNome:ator.nome,observacao:'Status atualizado pelo almoxarifado.'});
  if(obsMudou)gvgPedidoHistorico_('OBSERVACAO',id,{statusAnterior:statusAtual,statusNovo:novoStatus,usuarioId:ator.id,usuarioNome:ator.nome,observacao:obsNova});
  changes.forEach(function(c){gvgPedidoHistorico_('QUANTIDADE',id,{produto:c.nome,qtdSolicitada:c.asked,qtdAnterior:c.anterior,qtdConfirmada:c.qtd,statusAnterior:statusAtual,statusNovo:novoStatus,usuarioId:ator.id,usuarioNome:ator.nome,observacao:c.nota});});
  let notificacoes=0;const titulo='PEDIDO '+id;
  changes.forEach(function(c){
   const msg=c.qtd===0?'Material indisponível: '+c.nome+'. Quantidade confirmada: 0 '+c.unidade+'.':'Você solicitou '+gvgNumeroQtd_(c.asked)+' '+c.unidade+' de '+c.nome+'. O almoxarifado confirmou '+gvgNumeroQtd_(c.qtd)+' '+c.unidade+'.';
   notificacoes+=gvgNotificarPedido_(ss,id,'QUANTIDADE',titulo,msg);
  });
  if(statusMudou)notificacoes+=gvgNotificarPedido_(ss,id,'STATUS',titulo,gvgNotificacaoStatusMensagem_(novoStatus));
  if(obsMudou&&obsNova)notificacoes+=gvgNotificarPedido_(ss,id,'OBSERVACAO',titulo,'Observação do almoxarifado: '+obsNova);
  ss.getSheetByName('AUDITORIA').appendRow([agora,'PEDIDO_ATUALIZADO',id,String(p[row][2]||''),JSON.stringify({status:novoStatus,alteracoes:changes.map(function(c){return {produto:c.nome,de:c.anterior,para:c.qtd};}),observacao:obsMudou})]);
  try{CacheService.getScriptCache().remove('gvg_painel_pedidos_v1');}catch(e){}
  return {ok:true,status:novoStatus,alteracoes:changes.length,notificacoes:notificacoes};
 }finally{lock.releaseLock();}
}
// Limpeza exclusiva para demonstração: apaga pedidos, itens, vínculos e auditorias de entrega.
// Mantém produtos, obras, usuários, configurações e demais históricos intactos.
function limparPedidosDemo(credencial,confirmacao){
 const ator=superadmin_(credencial);
 if(String(confirmacao||'').trim().toUpperCase()!=='LIMPAR')throw new Error('Confirmação inválida. Digite LIMPAR.');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const ss=abasGestao_();const res={pedidos:0,itens:0,vinculos:0,historico:0,notificacoes:0,auditoria:0};
  ['PEDIDOS','ITENS_PEDIDO','PEDIDOS_USUARIOS','PEDIDO_HISTORICO','NOTIFICACOES'].forEach(function(name){
   const sh=ss.getSheetByName(name);if(!sh)return;
   const n=Math.max(0,sh.getLastRow()-1);if(n){sh.deleteRows(2,n);}
   if(name==='PEDIDOS')res.pedidos=n;else if(name==='ITENS_PEDIDO')res.itens=n;else if(name==='PEDIDOS_USUARIOS')res.vinculos=n;else if(name==='PEDIDO_HISTORICO')res.historico=n;else res.notificacoes=n;
  });
  const aud=ss.getSheetByName('AUDITORIA');
  if(aud&&aud.getLastRow()>1){
   const vals=aud.getRange(2,1,aud.getLastRow()-1,Math.max(5,aud.getLastColumn())).getValues();
   const rows=[];
   vals.forEach(function(r,i){
    const acao=String(r[1]||'').trim().toUpperCase(),codigo=String(r[2]||'').trim().toUpperCase(),detalhe=String(r[4]||'');
    if(acao==='ENTREGA'||codigo.indexOf('PED-')===0||detalhe.indexOf('PED-')>=0)rows.push(i+2);
   });
   for(let i=rows.length-1;i>=0;i--)aud.deleteRow(rows[i]);
   res.auditoria=rows.length;
  }
  try{const cache=CacheService.getScriptCache();cache.remove('gvg_painel_pedidos_v1');cache.remove('gvg_painel_v4_'+ator.id);const us=gvguUsuarios_().getDataRange().getValues();us.slice(1).forEach(function(u){if(u[0])gvgNotifInvalidar_(u[0]);});}catch(e){}
  gvguAuditar_('LIMPAR_PEDIDOS_DEMO',ator.id,JSON.stringify(res));
  SpreadsheetApp.flush();
  return {ok:true,pedidos:res.pedidos,itens:res.itens,vinculos:res.vinculos,historico:res.historico,notificacoes:res.notificacoes,auditoria:res.auditoria};
 }finally{lock.releaseLock()}
}
// Grava quantidade REAL ENTREGUE por item. Não altera quantidade solicitada.
function confirmarEntrega(pin,id,linhas){
 const r=atualizarPedidoAdmin(pin,id,{itens:linhas,status:'RETIRADO'});
 return {status:r.status,unidades:0};
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
const GVG_PERM_KEYS=['pedidos','gastos','fornecedores','frotas','maquinas'];
const GVG_PROJETOS=[
 {key:'pedidos',label:'Pedidos'},
 {key:'gastos',label:'Controle de Gastos'},
 {key:'fornecedores',label:'Fornecedores'},
 {key:'maquinas',label:'Controle de Máquinas'},
 {key:'frotas',label:'Controle de Frotas'}
];
const GVG_SUPERADMIN_EMAIL='higorjose.gvgesquadrias@gmail.com';
function gvguPerfilValor_(v){
 v=String(v||'').toUpperCase();
 if(v==='SUPERADMIN'||v==='SUPERADMINISTRADOR')return 'SUPERADMIN';
 if(v==='ADMIN'||v==='ADMINISTRADOR')return 'ADMIN';
 return 'OPERADOR';
}
function gvguPerfilEfetivo_(email,perfil){
 const p=gvguPerfilValor_(perfil);
 const e=String(email||'').trim().toLowerCase();
 if(e===GVG_SUPERADMIN_EMAIL&&(p==='ADMIN'||p==='SUPERADMIN'))return 'SUPERADMIN';
 return p;
}
function gvguPermValor_(v){
 v=String(v||'').toUpperCase();
 if(v==='VISUAL'||v==='VISUALIZAR')return 'VISUAL';
 if(v==='OPERADOR'||v==='OPERAR')return 'OPERAR';
 if(v==='ADMIN'||v==='GERENCIAR')return 'GERENCIAR';
 return '';
}
function gvguPermissoes_(r){return {pedidos:gvguPermValor_(r&&r[12]),gastos:gvguPermValor_(r&&r[13]),fornecedores:gvguPermValor_(r&&r[14]),frotas:gvguPermValor_(r&&r[15]),maquinas:gvguPermValor_(r&&r[16])};}
function gvguPermObj_(p){const o={};GVG_PERM_KEYS.forEach(k=>o[k]=gvguPermValor_(p&&p[k]));return o;}
function gvguNivelProjeto_(u,projeto){
 if(!u)return '';
 const perfil=String(u.perfil||'').toUpperCase();
 if(perfil==='SUPERADMIN')return 'GERENCIAR';
 const nivel=gvguPermValor_((u.permissoes||{})[projeto]);
 if(perfil==='OPERADOR'&&nivel==='GERENCIAR')return 'OPERAR';
 return nivel;
}
function gvguPodeVisualizar_(u,projeto){return !!gvguNivelProjeto_(u,projeto);}
function gvguPodeOperar_(u,projeto){const n=gvguNivelProjeto_(u,projeto);return n==='OPERAR'||n==='GERENCIAR';}
function gvguPodeGerenciar_(u,projeto){return gvguNivelProjeto_(u,projeto)==='GERENCIAR';}
function gvguProjetosVisiveis_(u){return GVG_PROJETOS.filter(p=>gvguPodeVisualizar_(u,p.key)).map(p=>p.key);}
const GVG_MODULOS_SSO_OBRIGATORIO=true;
function gvguModuloSsoObrigatorio_(){return GVG_MODULOS_SSO_OBRIGATORIO;}
function gvguAcessoPainel_(token,projeto){
 const u=gvguVerificarSessao_(token);const nivel=gvguNivelProjeto_(u,projeto);
 if(!nivel)throw new Error('GVG_SEM_ACESSO_PROJETO: seu perfil não tem acesso a '+projeto+'.');
 return {usuario:u,nivel:nivel};
}
function gvguSuperadmin_(u){return String(u&&u.perfil||'').toUpperCase()==='SUPERADMIN';}
function gvguUsuarioPublico_(u){
 const perfil=String(u.perfil||'OPERADOR').toUpperCase();
 return {id:u.id||'',nome:u.nome||'',login:u.login||'',email:u.email||'',perfil:perfil,foto:u.foto||'',permissoes:gvguPermObj_(u.permissoes||{}),superadmin:perfil==='SUPERADMIN',projetos:gvguProjetosVisiveis_(u)};
}
function gvguVerificarSessao_(token){
 const hash=gvguSHA_(token||'');if(!token||String(token).length<20)throw new Error('Entre na sua conta para solicitar materiais.');
 const sh=gvguUsuarios_(),fotoCol=gvguFotoCol_(sh);
 const ss=gvguSessoes_().getDataRange().getValues();const r=ss.find((x,i)=>i>0&&x[0]===hash&&x[3]!=='SIM'&&Number(x[2])>Date.now());if(!r)throw new Error('Sessão expirada. Entre novamente.');
 const users=sh.getDataRange().getValues();const user=users.find((x,i)=>i>0&&x[0]===r[1]&&x[6]==='ATIVO');if(!user)throw new Error('Acesso não autorizado ou bloqueado.');
 const email=String(user[9]||'').toLowerCase();const perfil=gvguPerfilEfetivo_(email,user[10]);const permissoes=gvguPermissoes_(user);
 if(perfil==='ADMIN'&&!permissoes.maquinas)permissoes.maquinas='GERENCIAR';
 if(perfil==='SUPERADMIN')GVG_PERM_KEYS.forEach(k=>permissoes[k]='GERENCIAR');
 const out={id:user[0],nome:user[1],login:user[2],email:email,perfil:perfil,foto:String(user[fotoCol-1]||''),permissoes:permissoes};
 out.superadmin=perfil==='SUPERADMIN';out.projetos=gvguProjetosVisiveis_(out);return out;
}
function entrarFuncionario(login,password){
 const l=String(login||'').trim().toLowerCase(),p=String(password||'');
 const sh=gvguUsuarios_(),fotoCol=gvguFotoCol_(sh),users=sh.getDataRange().getValues();const idx=users.findIndex((x,i)=>i>0&&(String(x[9]||'').trim().toLowerCase()===l||String(x[2]||'').trim().toLowerCase()===l));const r=idx>=0?users[idx]:null;
 if(!r||!gvguSenhaConfere_(p,r[4],r[5]))throw new Error('Usuário ou senha inválidos.');
 if(r[6]!=='ATIVO')throw new Error(r[6]==='PENDENTE'?'Cadastro aguardando aprovação.':'Acesso bloqueado.');
 if(!/^F:\d+:/.test(String(r[5]))){try{sh.getRange(idx+1,6).setValue(gvguHashNovo_(p,r[4]));}catch(e){}}
 const token=Utilities.getUuid()+Utilities.getUuid(),exp=Date.now()+GVGU_SESS_MILLIS;
 gvguSessoes_().appendRow([gvguSHA_(token),r[0],exp,'NÃO']);
 const email=String(r[9]||'').trim().toLowerCase();const perfil=gvguPerfilEfetivo_(email,r[10]);const permissoes=gvguPermissoes_(r);
 if(perfil==='ADMIN'&&!permissoes.maquinas)permissoes.maquinas='GERENCIAR';
 if(perfil==='SUPERADMIN')GVG_PERM_KEYS.forEach(k=>permissoes[k]='GERENCIAR');
 const out={token,id:r[0],nome:r[1],login:r[2],email:email,perfil:perfil,foto:String(r[fotoCol-1]||''),permissoes:permissoes,expira:exp};
 out.superadmin=perfil==='SUPERADMIN';out.projetos=gvguProjetosVisiveis_(out);return out;
}
function sessaoFuncionario(token){const u=gvguVerificarSessao_(token);return {nome:u.nome,login:u.login,email:u.email,perfil:u.perfil,foto:u.foto||'',permissoes:u.permissoes||{},superadmin:u.superadmin,projetos:u.projetos||[]}}
function gvguPermHeaders_(sh){
 const h=sh.getRange(1,13,1,5).getValues()[0];
 if(String(h[0])!=='Perm_Pedidos'||String(h[1])!=='Perm_Gastos'||String(h[2])!=='Perm_Fornecedores'||String(h[3])!=='Perm_Frotas'||String(h[4])!=='Perm_Maquinas')sh.getRange(1,13,1,5).setValues([['Perm_Pedidos','Perm_Gastos','Perm_Fornecedores','Perm_Frotas','Perm_Maquinas']]);
}
function gvguUsuarios_(){const ss=gvgPlanilha_();const existing=ss.getSheetByName('USUARIOS_GVG')||ss.getSheetByName('GVG_USUARIOS');return existing||gvguSheet_('GVG_USUARIOS',['ID','Nome','Login','WhatsApp','Salt','Senha_hash','Status','Data_cadastro','Data_status','E-mail','Perfil'])}
function gvguSessoes_(){return gvguSheet_('SESSOES_GVG',['Token_hash','Usuario_ID','Expira_em','Revogada'])}
function gvguVinculos_(){return gvguSheet_('PEDIDOS_USUARIOS',['Pedido_ID','Usuario_ID'])}
function cadastrarFuncionario(d){
 const rawLogin=String(d&&(d.login||d.email)||'').trim().toLowerCase(),senha=String(d&&d.senha||''),nome=String(d&&d.nome||rawLogin).trim().slice(0,120),whats=String(d&&d.whatsapp||'').replace(/\D/g,''),email=String(d&&d.email||'').trim().toLowerCase();
 const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawLogin);
 if(!rawLogin)throw new Error('Informe um usuário.');
 if(!isEmail&&!/^[a-z0-9._-]{2,40}$/.test(rawLogin))throw new Error('Usuário: use de 2 a 40 letras sem acentos, números, ponto, traço ou sublinhado, sem espaços.');
 if(senha.length<1||senha.length>128)throw new Error('Informe uma senha de 1 a 128 caracteres.');
 if(whats&&!(whats.length>=10&&whats.length<=13))throw new Error('WhatsApp inválido.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
  const sh=gvguUsuarios_();gvguPermHeaders_(sh);const v=sh.getDataRange().getValues();
  const iguais=v.map((r,i)=>({r,i})).filter(x=>x.i>0&&(String(x.r[9]||'').trim().toLowerCase()===rawLogin||String(x.r[2]||'').trim().toLowerCase()===rawLogin));
  if(iguais.some(x=>String(x.r[6]).trim().toUpperCase()!=='EXCLUIDO'))throw new Error('Este usuário já está cadastrado.');
  for(let n=iguais.length-1;n>=0;n--){const x=iguais[n];gvguExcluirCadastro_(sh,x.i+1,x.r[0]);}
  const id='USR-'+Utilities.getUuid(),salt=Utilities.getUuid();
  sh.appendRow([id,textoSeguro_(nome||rawLogin,120),rawLogin,whats,salt,gvguHashNovo_(senha,salt),'PENDENTE',new Date(),new Date(),email||(isEmail?rawLogin:''),'OPERADOR','','','','','','']);
  gvguAuditar_('CADASTRO_PENDENTE',id,rawLogin);
  return {status:'PENDENTE',mensagem:'Cadastro enviado para aprovação do administrador.'};
 }finally{lock.releaseLock()}
}
function sairFuncionario(token){const h=gvguSHA_(token),sh=gvguSessoes_(),v=sh.getDataRange().getValues();for(let i=1;i<v.length;i++)if(v[i][0]===h)sh.getRange(i+1,4).setValue('SIM');return true}
function gvguVincularPedido_(ss,pedido,id){gvguVinculos_().appendRow([pedido,id])}
function meusPedidos(token){
 const u=gvguVerificarSessao_(token);
 if(!gvguPodeVisualizar_(u,'pedidos'))throw new Error('GVG_SEM_ACESSO_PROJETO: seu perfil não tem acesso ao Pedidos.');
 const ss=abasGestao_(),linked=gvguVinculos_().getDataRange().getValues();
 const ids=new Set(linked.slice(1).filter(r=>String(r[1])===String(u.id)).map(r=>String(r[0])));
 const pedidos=ss.getSheetByName('PEDIDOS').getDataRange().getValues().slice(1).filter(r=>r[0]&&ids.has(String(r[0]))).map(r=>({
  id:String(r[0]),data:gvgDataISO_(r[1]),solicitante:String(r[2]||''),obra:String(r[3]||''),canal:String(r[5]||''),
  status:gvgStatusNormalizar_(r[6]),statusEm:gvgDataISO_(r[8]),statusPor:String(r[9]||''),
  observacaoAlmox:String(r[10]||''),dataEntrega:gvgDataISO_(r[7]),atualizadoEm:gvgDataISO_(r[11]),atualizadoPor:String(r[12]||'')
 }));
 const itens=ss.getSheetByName('ITENS_PEDIDO').getDataRange().getValues().slice(1).filter(r=>r[0]&&ids.has(String(r[0]))).map(r=>({
  id:String(r[0]),codigo:String(r[1]||''),nome:String(r[2]||''),solicitado:Number(r[3])||0,unidade:String(r[4]||''),equiv:Number(r[5])||0,
  entregue:r[6]===''?null:Number(r[6])||0,entregueEquiv:r[7]===''?0:Number(r[7])||0,nota:String(r[8]||''),
  confirmadoEm:gvgDataISO_(r[9]),confirmadoPor:String(r[10]||'')
 }));
 const hs=ss.getSheetByName('PEDIDO_HISTORICO');let historico=[];
 if(hs&&hs.getLastRow()>1)historico=hs.getDataRange().getValues().slice(1).filter(r=>ids.has(String(r[1]))).map(r=>({
  data:gvgDataISO_(r[0]),pedidoId:String(r[1]||''),acao:String(r[2]||''),produto:String(r[3]||''),
  qtdSolicitada:r[4]===''?null:Number(r[4]),qtdAnterior:r[5]===''?null:Number(r[5]),qtdConfirmada:r[6]===''?null:Number(r[6]),
  statusAnterior:String(r[7]||''),statusNovo:String(r[8]||''),usuarioNome:String(r[10]||''),observacao:String(r[11]||'')
 }));
 return {pedidos,itens,historico};
}
function notificacoesUsuario(token){
 const u=gvguVerificarSessao_(token);
 if(!gvguPodeVisualizar_(u,'pedidos'))throw new Error('GVG_SEM_ACESSO_PROJETO: seu perfil não tem acesso ao Pedidos.');
 const cache=CacheService.getScriptCache(),key=gvgNotifCacheKey_(u.id);const cached=cache.get(key);
 if(cached){try{return JSON.parse(cached);}catch(e){}}
 const sh=gvgNotifSheet_();const out=[];
 if(sh&&sh.getLastRow()>1){
  sh.getDataRange().getValues().slice(1).forEach(function(r){
   if(String(r[2])!==String(u.id))return;
   out.push({id:String(r[0]),pedidoId:String(r[1]),tipo:String(r[3]),titulo:String(r[4]),mensagem:String(r[5]),criadaEm:gvgDataISO_(r[6]),lida:String(r[7]).toUpperCase()==='SIM',lidaEm:gvgDataISO_(r[8])});
  });
 }
 out.sort(function(a,b){return String(b.criadaEm||'').localeCompare(String(a.criadaEm||''));});
 const res={notificacoes:out.slice(0,100),naoLidas:out.filter(function(n){return !n.lida;}).length};
 try{cache.put(key,JSON.stringify(res),30);}catch(e){}
 return res;
}
function marcarNotificacaoLida(token,id){
 const u=gvguVerificarSessao_(token);const sh=gvgNotifSheet_();if(!sh)throw new Error('Notificação não encontrada.');
 const v=sh.getDataRange().getValues();
 for(let i=1;i<v.length;i++)if(String(v[i][0])===String(id)&&String(v[i][2])===String(u.id)){
  if(String(v[i][7]).toUpperCase()!=='SIM')sh.getRange(i+1,8,1,2).setValues([['SIM',new Date()]]);
  gvgNotifInvalidar_(u.id);return {ok:true};
 }
 throw new Error('Notificação não encontrada.');
}
function marcarTodasNotificacoesLidas(token){
 const u=gvguVerificarSessao_(token);const sh=gvgNotifSheet_();if(!sh)return {ok:true,atualizadas:0};
 const v=sh.getDataRange().getValues();let n=0;const agora=new Date();
 for(let i=1;i<v.length;i++)if(String(v[i][2])===String(u.id)&&String(v[i][7]).toUpperCase()!=='SIM'){sh.getRange(i+1,8,1,2).setValues([['SIM',agora]]);n++;}
 gvgNotifInvalidar_(u.id);return {ok:true,atualizadas:n};
}
function gvguAuditar_(acao,id,det){abasGestao_().getSheetByName('AUDITORIA').appendRow([new Date(),acao,id,'USUARIOS_GVG',String(det||'').slice(0,500)])}
function gvguHistoricoPermissoes_(){return gvguSheet_('GVG_PERMISSOES',['Data','Responsavel','Usuario_ID','Login','Perfil','Status','Projetos','Detalhes'])}
function gvguRegistrarHistorico_(ator,id,login,perfil,status,perms,detalhe){
 try{gvguHistoricoPermissoes_().appendRow([new Date(),String(ator&&(ator.email||ator.login)||'sistema'),String(id||''),String(login||''),String(perfil||''),String(status||''),JSON.stringify(perms||{}),String(detalhe||'').slice(0,500)]);}catch(e){}
}
function superadmin_(credential){
 const c=String(credential||'');
 if(/^GVGA-[a-f0-9-]{72}$/i.test(c)){if(gvgaSessaoValida_(c))return {id:'',nome:'Superadministrador emergencial',login:'',email:'',perfil:'SUPERADMIN',foto:'',permissoes:gvguPermObj_({pedidos:'GERENCIAR',gastos:'GERENCIAR',fornecedores:'GERENCIAR',frotas:'GERENCIAR',maquinas:'GERENCIAR'}),superadmin:true,projetos:GVG_PERM_KEYS};}
 const u=gvguVerificarSessao_(c);
 if(gvguSuperadmin_(u))return u;
 throw new Error('GVG_SUPERADMIN_NECESSARIO: somente o Superadministrador pode executar esta ação.');
}
function adminSessionUser_(credential){try{return gvguVerificarSessao_(String(credential||''));}catch(e){return null;}}
function activeSuperadminCount_(){const v=gvguUsuarios_().getDataRange().getValues();let n=0;for(let i=1;i<v.length;i++){const perfil=gvguPerfilEfetivo_(v[i][9],v[i][10]);if(String(v[i][6]||'').toUpperCase()==='ATIVO'&&perfil==='SUPERADMIN')n++;}return n;}
function gvguExcluirCadastro_(sh,row,id){
 const sessions=gvguSessoes_(),values=sessions.getDataRange().getValues();
 for(let j=values.length-1;j>0;j--)if(String(values[j][1])===String(id))sessions.deleteRow(j+1);
 sh.deleteRow(row);
 gvguAuditar_('CADASTRO_EXCLUIDO',id,'Cadastro e sessões removidos; histórico de pedidos preservado.');
}
function adminUsuarios(pin){
 superadmin_(pin);const sh=gvguUsuarios_();gvguPermHeaders_(sh);
 return sh.getDataRange().getValues().slice(1).map(r=>{
  const perfil=gvguPerfilEfetivo_(r[9],r[10]);
  const permissoes=gvguPermissoes_(r);if(perfil==='ADMIN'&&!permissoes.maquinas)permissoes.maquinas='GERENCIAR';if(perfil==='SUPERADMIN')GVG_PERM_KEYS.forEach(k=>permissoes[k]='GERENCIAR');
  return {id:r[0],nome:r[1],login:r[2],whatsapp:r[3],status:String(r[6]||'PENDENTE').toUpperCase(),email:String(r[9]||''),perfil:perfil,foto:String(r[11]||''),permissoes:permissoes,superadmin:perfil==='SUPERADMIN',projetos:GVG_PROJETOS.filter(p=>permissoes[p.key]).map(p=>p.key)};
 });
}
function adminSalvarUsuario(pin,dados){
 const ator=superadmin_(pin);const d=dados||{};
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=gvguUsuarios_();gvguPermHeaders_(sh);const v=sh.getDataRange().getValues();
  const id=String(d.id||'').trim();const idx=id?v.findIndex((r,n)=>n>0&&String(r[0])===id):-1;
  if(id&&idx<0)throw new Error('Usuário não encontrado. Atualize a lista.');
  const novo=!id;
  const nome=textoSeguro_(String(d.nome||'').trim(),120);
  const login=String(d.login||'').trim();
  const email=String(d.email||'').trim().toLowerCase();
  const senha=String(d.senha||'');
  const perfil=String(d.perfil||'OPERADOR').toUpperCase()==='SUPERADMIN'?'SUPERADMIN':String(d.perfil||'OPERADOR').toUpperCase()==='ADMIN'?'ADMIN':'OPERADOR';
  const status=String(d.status||(novo?'ATIVO':(idx>=0?v[idx][6]:'ATIVO'))||'ATIVO').toUpperCase();
  if(!nome)throw new Error('Informe o nome do usuário.');
  if(!login)throw new Error('Informe o login.');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('E-mail inválido.');
  if(novo&&!senha)throw new Error('Informe a senha do novo usuário.');
  if(['ATIVO','BLOQUEADO','PENDENTE'].indexOf(status)<0)throw new Error('Status inválido.');
  for(let n=1;n<v.length;n++){
   if(n===idx)continue;
   if(String(v[n][2]||'').trim().toLowerCase()===login.toLowerCase())throw new Error('Login já cadastrado.');
   if(email&&String(v[n][9]||'').trim().toLowerCase()===email)throw new Error('E-mail já cadastrado.');
  }
  const permissoesEntrada=d.permissoes||{};
  const perms=gvguPermObj_(permissoesEntrada);
  if(perfil==='ADMIN'&&!Object.prototype.hasOwnProperty.call(permissoesEntrada,'maquinas'))perms.maquinas='GERENCIAR';
  if(perfil==='SUPERADMIN')GVG_PERM_KEYS.forEach(k=>perms[k]='GERENCIAR');
  if(perfil==='OPERADOR')GVG_PERM_KEYS.forEach(k=>{if(perms[k]==='GERENCIAR')perms[k]='OPERAR';});
  const targetEmail=novo?email:String(idx>=0?(v[idx][9]||''):'').toLowerCase();
  if(!novo&&targetEmail===GVG_SUPERADMIN_EMAIL&&email!==GVG_SUPERADMIN_EMAIL)throw new Error('O e-mail da conta principal do Superadministrador não pode ser alterado por outro usuário.');
  const oldPerfil=novo?'':gvguPerfilEfetivo_(targetEmail,idx>=0?v[idx][10]:'');
  const oldStatus=novo?'':String(idx>=0?(v[idx][6]||''):'').toUpperCase();
  if(targetEmail===GVG_SUPERADMIN_EMAIL&&(perfil!=='SUPERADMIN'||status!=='ATIVO'))throw new Error('A conta principal do Superadministrador não pode ser bloqueada ou rebaixada.');
  if(!novo&&oldPerfil==='SUPERADMIN'&&(perfil!=='SUPERADMIN'||status!=='ATIVO')){
   if(activeSuperadminCount_()<=1)throw new Error('Não é permitido remover o último Superadministrador ativo.');
  }
  if(!novo&&String(ator.email||'').toLowerCase()===targetEmail&&(perfil!=='SUPERADMIN'||status!=='ATIVO'))throw new Error('Você não pode remover seu próprio acesso de Superadministrador.');
  const now=new Date();
  if(novo){
   const newId='USR-'+Utilities.getUuid();const salt=Utilities.getUuid();
   sh.appendRow([newId,nome,login,'',salt,gvguHashNovo_(senha,salt),status,now,now,email,perfil,'',perms.pedidos,perms.gastos,perms.fornecedores,perms.frotas,perms.maquinas]);
   gvguRegistrarHistorico_(ator,newId,login,perfil,status,perms,'CRIAR');
   gvguAuditar_('CRIAR_USUARIO',newId,JSON.stringify({login:login,perfil:perfil,status:status,permissoes:perms}));
   return {ok:true,id:newId,perfil:perfil,status:status,permissoes:perms};
  }
  sh.getRange(idx+1,2).setValue(nome);sh.getRange(idx+1,3).setValue(login);sh.getRange(idx+1,10).setValue(email);sh.getRange(idx+1,11).setValue(perfil);sh.getRange(idx+1,7).setValue(status);sh.getRange(idx+1,9).setValue(now);
  sh.getRange(idx+1,13,1,5).setValues([[perms.pedidos,perms.gastos,perms.fornecedores,perms.frotas,perms.maquinas]]);
  if(senha){const salt=Utilities.getUuid();sh.getRange(idx+1,5,1,2).setValues([[salt,gvguHashNovo_(senha,salt)]]);}
  if(status!=='ATIVO')revogarSessoesUsuario_(id);
  try{CacheService.getScriptCache().remove('gvg_painel_v4_'+id);}catch(e){}
  gvguRegistrarHistorico_(ator,id,login,perfil,status,perms,oldPerfil+'/'+oldStatus+' -> '+perfil+'/'+status);
  gvguAuditar_('SALVAR_USUARIO',id,JSON.stringify({perfil:perfil,status:status,permissoes:perms}));
  return {ok:true,id:id,perfil:perfil,status:status,permissoes:perms};
 }finally{lock.releaseLock()}
}
function adminCriarUsuario(pin,dados){return adminSalvarUsuario(pin,dados||{});}
function adminSituacaoUsuario(pin,id,status,perfil,permissoes){
 superadmin_(pin);status=String(status||'').toUpperCase();if(['ATIVO','BLOQUEADO','EXCLUIDO'].indexOf(status)<0)throw new Error('Status inválido.');
 const sh=gvguUsuarios_();gvguPermHeaders_(sh);const v=sh.getDataRange().getValues();
 const i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));if(i<0)throw new Error('Usuário não encontrado. Atualize a lista.');
 const ator=superadmin_(pin);const alvoEmail=String(v[i][9]||'').toLowerCase();const alvoPerfil=gvguPerfilEfetivo_(alvoEmail,v[i][10]);const alvoStatus=String(v[i][6]||'').toUpperCase();
 if(alvoEmail===GVG_SUPERADMIN_EMAIL&&status!=='ATIVO')throw new Error('A conta principal do Superadministrador não pode ser bloqueada ou excluída.');
 if(String(ator.email||'').toLowerCase()===alvoEmail&&status!=='ATIVO')throw new Error('Você não pode bloquear ou excluir seu próprio usuário.');
 if(status!=='ATIVO'&&alvoPerfil==='SUPERADMIN'&&alvoStatus==='ATIVO'&&activeSuperadminCount_()<=1)throw new Error('Não é permitido bloquear ou excluir o último Superadministrador ativo.');
 if(status==='EXCLUIDO'){
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{gvguExcluirCadastro_(sh,i+1,id);gvguRegistrarHistorico_(ator,id,v[i][2],alvoPerfil,'EXCLUIDO',gvguPermissoes_(v[i]),'EXCLUIR');SpreadsheetApp.flush();return {status:'EXCLUIDO',excluido:true};}finally{lock.releaseLock()}
 }
 if(status==='ATIVO'&&alvoStatus==='PENDENTE'){
  const perfilFinal=String(perfil||'OPERADOR').toUpperCase()==='SUPERADMIN'?'SUPERADMIN':String(perfil||'OPERADOR').toUpperCase()==='ADMIN'?'ADMIN':'OPERADOR';
  return adminSalvarUsuario(pin,{id:id,nome:v[i][1],login:v[i][2],email:v[i][9],perfil:perfilFinal,status:'ATIVO',permissoes:permissoes||{}});
 }
 return adminSalvarUsuario(pin,{id:id,nome:v[i][1],login:v[i][2],email:v[i][9],perfil:alvoPerfil,status:status,permissoes:permissoes||gvguPermissoes_(v[i])});
}

function adminDefinirPermissoes(pin,id,permissoes){
 const u=superadmin_(pin);const sh=gvguUsuarios_();gvguPermHeaders_(sh);const v=sh.getDataRange().getValues();const i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));
 if(i<0)throw new Error('Usuário não encontrado.');const perfil=gvguPerfilEfetivo_(v[i][9],v[i][10]);
 return adminSalvarUsuario(pin,{id:id,nome:v[i][1],login:v[i][2],email:v[i][9],perfil:perfil,status:v[i][6],permissoes:permissoes||{}});
}
function adminDefinirPerfil(pin,id,perfil){
 perfil=String(perfil||'').toUpperCase();if(['SUPERADMIN','ADMIN','OPERADOR','CONSULTA'].indexOf(perfil)<0)throw new Error('Perfil inválido.');
 const sh=gvguUsuarios_();gvguPermHeaders_(sh);const v=sh.getDataRange().getValues();const i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));
 if(i<0)throw new Error('Usuário não encontrado.');const perms=gvguPermissoes_(v[i]);
 return adminSalvarUsuario(pin,{id:id,nome:v[i][1],login:v[i][2],email:v[i][9],perfil:perfil,status:v[i][6],permissoes:perms});
}
function adminRedefinirSenha(pin,id,nova){
 const ator=superadmin_(pin);const senha=String(nova==null?'':nova);if(!senha||senha.length>128)throw new Error('Informe uma senha de 1 a 128 caracteres.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const sh=gvguUsuarios_(),v=sh.getDataRange().getValues(),i=v.findIndex((r,n)=>n>0&&String(r[0])===String(id));
 if(i<0)throw new Error('Usuário não encontrado. Atualize a lista.');
 const targetEmail=String(v[i][9]||'').toLowerCase();
 if(targetEmail===GVG_SUPERADMIN_EMAIL&&String(ator.email||'').toLowerCase()!==GVG_SUPERADMIN_EMAIL)throw new Error('A senha da conta principal do Superadministrador só pode ser alterada por ela mesma.');
 const salt=Utilities.getUuid();sh.getRange(i+1,5,1,2).setValues([[salt,gvguHashNovo_(senha,salt)]]);sh.getRange(i+1,9).setValue(new Date());
 revogarSessoesUsuario_(id,String(ator.id)===String(id)?pin:'');gvguAuditar_('REDEFINIR_SENHA',id,'Senha redefinida pelo administrador.');
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
 if(gvgaSessaoValida_(token))return {ok:true,perfil:'SUPERADMIN',superadmin:true,podeGerenciarPedidos:true};
 try{const u=gvguVerificarSessao_(token);if(gvguPodeGerenciar_(u,'pedidos'))return {ok:true,nome:u.nome,email:u.email,perfil:u.perfil,superadmin:u.superadmin,podeGerenciarPedidos:true,permissoes:u.permissoes};}catch(e){}
 return {ok:false};
}
function sairAdminGVG(token){
 if(/^GVGA-[a-f0-9-]{72}$/i.test(String(token||'')))PropertiesService.getScriptProperties().deleteProperty(gvgaChaveSessao_(token));
 return {ok:true};
}
function estadoSessaoFuncionarioGVG(token){
 try{const u=gvguVerificarSessao_(token);return {ok:true,id:u.id,nome:u.nome,login:u.login,email:u.email,perfil:u.perfil,foto:u.foto||'',permissoes:u.permissoes||{},superadmin:u.superadmin,projetos:u.projetos||[],podeGerenciarPedidos:gvguPodeGerenciar_(u,'pedidos'),podeOperarPedidos:gvguPodeOperar_(u,'pedidos')};}
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
 const ids=rows.filter(r=>r[0]&&!gvgStatusFinalizado_(r[6])).map(r=>String(r[0]));
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
function painelResumoPedidos_(){
  const cache=CacheService.getScriptCache(),key='gvg_painel_pedidos_v1';
  const cached=cache.get(key);
  if(cached){try{return JSON.parse(cached);}catch(e){}}
  const ss=abasGestao_();
  const pedidos=ss.getSheetByName('PEDIDOS').getDataRange().getValues().slice(1).filter(r=>r[0]);
  const config=ss.getSheetByName('CONFIG').getDataRange().getValues().slice(1);
  const cfg=key=>{const r=config.find(x=>String(x[0])===key);return r?r[1]:'';};
  let abertos=0,latest=null,latestMs=-1;
  pedidos.forEach(r=>{
    const status=gvgStatusNormalizar_(r[6]);
    if(status!=='RETIRADO')abertos++;
    const ms=r[1] instanceof Date?r[1].getTime():0;
    if(!latest||ms>=latestMs){latestMs=ms;latest={id:String(r[0]),status:status,data:painelData_(r[1])};}
  });
  const out={vazio:pedidos.length===0,ambiente:String(cfg('AMBIENTE')||'TESTE'),total:pedidos.length,abertos:abertos,recente:latest,atualizadoEm:Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm')};
  try{cache.put(key,JSON.stringify(out),30);}catch(e){}
  return out;
}
function gvguFiltrarAppsPainel_(apps,usuario){
 const out={};GVG_PROJETOS.forEach(p=>{if(apps&&apps[p.key]&&gvguPodeVisualizar_(usuario,p.key))out[p.key]=apps[p.key];});return out;
}
function gvguFiltrarAtividadesPainel_(atividades,usuario){
 const map={'Pedidos':'pedidos','Controle de Gastos':'gastos','Fornecedores':'fornecedores','Frotas':'frotas','Controle de Máquinas':'maquinas'};
 return (atividades||[]).filter(a=>{const k=map[a&&a.app];return !k||gvguPodeVisualizar_(usuario,k);});
}
function getPainelInicial(sessao){
 let usuario;
 try{usuario=gvguVerificarSessao_(sessao);}catch(e){return {ok:false,error:String(e&&e.message||e)};}
 const publico=gvguUsuarioPublico_(usuario);
 const cache=CacheService.getScriptCache();
 const cacheKey='gvg_painel_v4_'+usuario.id;
 const cached=cache.get(cacheKey);
 if(cached){
  try{
   const out=JSON.parse(cached);
   out.usuario=publico;
   out.apps=gvguFiltrarAppsPainel_(out.apps,usuario);
   out.atividades=gvguFiltrarAtividadesPainel_(out.atividades,usuario);
   if(!gvguPodeVisualizar_(usuario,'pedidos'))out.vazio=false;
   return out;
  }catch(e){}
 }
 try{
  const verPedidos=gvguPodeVisualizar_(usuario,'pedidos');
  const resumo=verPedidos?painelResumoPedidos_():null;
  let externos=null;
  if(gvguPodeVisualizar_(usuario,'gastos')||gvguPodeVisualizar_(usuario,'fornecedores')||gvguPodeVisualizar_(usuario,'maquinas')||gvguPodeVisualizar_(usuario,'frotas')){
   try{const ext=cache.get('gvg_painel_resumos_v2');if(ext)externos=JSON.parse(ext);}catch(e){}
  }
  if(!externos||!externos.gastos||!externos.maquinas)externos={gastos:{valor:'—',label:'gastos no mês',detalhe:'Carregando…',recente:null},fornecedores:{valor:'—',label:'fornecedores ativos',detalhe:'Carregando…',recente:null},maquinas:{valor:'—',label:'equipamentos disponíveis',detalhe:'Carregando…',recente:null},frotas:{valor:'—',label:'veículos na frota',detalhe:'Carregando…',recente:null}};
  const apps={};
  if(verPedidos){const latest=resumo.recente,abertos=resumo.abertos;apps.pedidos={valor:resumo.total,label:resumo.total===1?'pedido registrado':'pedidos registrados',detalhe:abertos===1?'1 em andamento':abertos+' em andamento',recente:latest?{titulo:latest.id,detalhe:latest.status,data:latest.data}:null};}
  if(gvguPodeVisualizar_(usuario,'gastos'))apps.gastos=externos.gastos;
  if(gvguPodeVisualizar_(usuario,'fornecedores'))apps.fornecedores=externos.fornecedores;
  if(gvguPodeVisualizar_(usuario,'maquinas'))apps.maquinas=externos.maquinas;
  if(gvguPodeVisualizar_(usuario,'frotas'))apps.frotas=externos.frotas;
  const atividades=[];
  if(verPedidos)atividades.push({app:'Pedidos',tone:'gold',titulo:apps.pedidos.recente?apps.pedidos.recente.titulo:'Sem pedidos recentes',detalhe:apps.pedidos.recente?apps.pedidos.recente.detalhe:'',data:apps.pedidos.recente?apps.pedidos.recente.data:''});
  if(gvguPodeVisualizar_(usuario,'gastos'))atividades.push({app:'Controle de Gastos',tone:'green',titulo:externos.gastos.recente?externos.gastos.recente.titulo:'Sem gastos recentes',detalhe:externos.gastos.recente?externos.gastos.recente.detalhe:'',data:externos.gastos.recente?externos.gastos.recente.data:''});
  if(gvguPodeVisualizar_(usuario,'fornecedores'))atividades.push({app:'Fornecedores',tone:'purple',titulo:externos.fornecedores.recente?externos.fornecedores.recente.titulo:'Sem fornecedores recentes',detalhe:externos.fornecedores.recente?externos.fornecedores.recente.detalhe:'',data:externos.fornecedores.recente?externos.fornecedores.recente.data:''});
  if(gvguPodeVisualizar_(usuario,'frotas'))atividades.push({app:'Frotas',tone:'blue',titulo:externos.frotas.recente?externos.frotas.recente.titulo:'Sem veículos recentes',detalhe:externos.frotas.recente?externos.frotas.recente.detalhe:'',data:''});
  const out={ok:true,usuario:publico,ambiente:resumo?resumo.ambiente:'TESTE',atualizadoEm:resumo?resumo.atualizadoEm:Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'),vazio:verPedidos?resumo.vazio:false,apps:apps,atividades:atividades};
  try{cache.put(cacheKey,JSON.stringify(out),30);}catch(e){}
  return out;
 }catch(e){
  return {ok:false,error:'Não foi possível carregar os indicadores: '+String(e&&e.message||e)};
 }
}
function getPainelExternos(sessao){
 let usuario;
 try{usuario=gvguVerificarSessao_(sessao);}catch(e){return {ok:false,error:String(e&&e.message||e)};}
 try{
  const r=painelResumosExternos_();const apps={};
  if(gvguPodeVisualizar_(usuario,'gastos'))apps.gastos=r.gastos;
  if(gvguPodeVisualizar_(usuario,'fornecedores'))apps.fornecedores=r.fornecedores;
  if(gvguPodeVisualizar_(usuario,'maquinas'))apps.maquinas=r.maquinas;
  if(gvguPodeVisualizar_(usuario,'frotas'))apps.frotas=r.frotas;
  return {ok:true,apps:apps};
 }catch(e){return {ok:false,error:'Não foi possível carregar os resumos: '+String(e&&e.message||e)};}
}
