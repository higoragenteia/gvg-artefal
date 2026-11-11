/** GVG&ARTEFAL — módulo Frotas integrado ao painel.
 *  Fonte original: projeto Apps Script do Controle de Frotas (produção v21).
 *  Este arquivo mantém o backend original isolado em um namespace para não
 *  colidir com as funções do painel. A autenticação vem do painel (SSO).
 */
var GVG_FROTAS_MODULE = (function(){
'use strict';
/**
 * GVG & ARTEFAL | CONTROLE DE FROTA | VERSÃO EMPRESA
 * Dados: Google Sheets da conta higorjose.gvgesquadrias@gmail.com.
 * Todas as gravações são auditadas. As fórmulas nativas não são sobrescritas.
 */
const FROTA_ID = '1ck1lDtk_W9vjyQEnhV2Ze5secbayGLFfZi4Z0NuX-GY';
const FROTA_TZ = 'America/Recife';
const ABAS = {
  BASE:'Base de Dados', SEGUROS:'Seguros', VENC:'Vencimentos', EXTRAS:'Vencimentos Extras',
  PAG:'Pagamentos', ALERTAS:'Alertas Automáticos App', AUDIT:'Histórico de Alterações',
  KM:'Registros de KM', FUEL:'Abastecimentos', MANUT:'Manutenções', FOTOS:'Fotos Veículos', DOCS:'Documentos Frota'
};
const HEADERS = {
  [ABAS.ALERTAS]:['Chave','Placa','Veículo','Tipo','Vencimento','Dias restantes','Status','Alerta -10','Alerta -5','Pago/Regularizado','Última verificação','Observação'],
  [ABAS.AUDIT]:['Data/Hora','Usuário','Ação','Aba','Identificador','Antes','Depois'],
  [ABAS.EXTRAS]:['ID','Placa','Tipo','Descrição','Vencimento','Valor','Pago/Regularizado','Observação'],
  [ABAS.PAG]:['ID','Placa','Data','Tipo','Descrição','Valor','Comprovante URL'],
  [ABAS.KM]:['ID','Placa','Data','Quilometragem','Observação'],
  [ABAS.FUEL]:['ID','Placa','Data','Combustível','Litros','Valor (R$)','Quilometragem','Posto','Comprovante URL','Observação','Motorista'],
  [ABAS.MANUT]:['ID','Placa','Data','Serviço','Quilometragem','Valor (R$)','Próxima revisão (data)','Próxima revisão (km)','Status','Prestador','Comprovante URL','Observação'],
  [ABAS.FOTOS]:['ID','Placa','Foto URL','Legenda'],
  [ABAS.DOCS]:['ID','Placa','Tipo','Documento URL','Emissão','Vencimento','Status','Observação','Valor do IPVA']
};
const ESQUEMAS = {
 'Base de Dados':{edit:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],dates:[],numeric:[13],key:0},
 'Seguros':{edit:[0,1,2,3,4,5,6,9,10,11,12],dates:[5,6],numeric:[9,10,11],key:0},
 'Vencimentos':{edit:[0,1,2,3,4,5,6,7,8,9],dates:[4,6],numeric:[7],key:0},
 'Vencimentos Extras':{edit:[0,1,2,3,4,5,6,7],dates:[4],numeric:[5],key:0},
 'Pagamentos':{edit:[0,1,2,3,4,5,6],dates:[2],numeric:[5],key:0},
 'Registros de KM':{edit:[0,1,2,3,4],dates:[2],numeric:[3],key:0},
 'Abastecimentos':{edit:[0,1,2,3,4,5,6,7,8,9,10],dates:[2],numeric:[4,5,6],key:0},
 'Manutenções':{edit:[0,1,2,3,4,5,6,7,8,9,10,11],dates:[2,6],numeric:[4,5,7],key:0},
 'Fotos Veículos':{edit:[0,1,2,3],dates:[],key:0},
 'Documentos Frota':{edit:[0,1,2,3,4,5,6,7,8],dates:[4,5],numeric:[8],key:0}
};
function ss_(){return SpreadsheetApp.openById(FROTA_ID);}
function sh_(name){const s=ss_().getSheetByName(name);if(!s)throw Error('Aba não encontrada: '+name+'. Execute setupFrota uma vez no projeto corporativo.');return s;}
function doGet(){return HtmlService.createHtmlOutputFromFile('Index').setTitle('GVG & ARTEFAL • Controle de Frota').addMetaTag('viewport','width=device-width,initial-scale=1,viewport-fit=cover').setFaviconUrl('https://higoragenteia.github.io/gvg-frotas/icone-180.png').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}
function ymd_(v){
 if(v instanceof Date&&!isNaN(v))return Utilities.formatDate(v,FROTA_TZ,'yyyy-MM-dd');
 const x=String(v===null||v===undefined?'':v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(x))return x;
 const m=x.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?m[3]+'-'+m[2]+'-'+m[1]:'';
}
function date_(v){const s=ymd_(v);if(!s)throw Error('Data inválida: '+String(v));const a=s.split('-').map(Number),d=new Date(a[0],a[1]-1,a[2],12,0,0);if(d.getFullYear()!==a[0]||d.getMonth()!==a[1]-1||d.getDate()!==a[2])throw Error('Data inexistente: '+s);return d;}
function norm_(s){return String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function plusDays_(date,days){const d=date_(date);d.setDate(d.getDate()+Number(days||0));return Utilities.formatDate(d,FROTA_TZ,'yyyy-MM-dd');}
function val_(v){if(v instanceof Date)return ymd_(v);return v===undefined||v===null?'':v;}
function rows_(name){const sh=sh_(name),last=sh.getLastRow();if(last<2)return [];return sh.getRange(2,1,last-1,sh.getLastColumn()).getValues().map((r,i)=>({row:i+2,values:r.map(val_)})).filter(x=>x.values.some(v=>v!==''));}
function getRows_(name){return rows_(name).map(x=>({row:x.row,v:x.values}));}
function setupFrota(){
 const ss=ss_();Object.keys(HEADERS).forEach(name=>{
  if(ss.getSheetByName(name))return;
  const head=HEADERS[name],s=ss.insertSheet(name);s.getRange(1,1,1,head.length).setValues([head]);s.setFrozenRows(1);
  s.getRange(1,1,1,head.length).setBackground('#0d2440').setFontColor('white').setFontWeight('bold');
 });
 const fuelSheet=ss.getSheetByName(ABAS.FUEL);
 if(fuelSheet&&!String(fuelSheet.getRange(1,11).getDisplayValue()).trim()){fuelSheet.getRange(1,11).setValue('Motorista').setBackground('#0d2440').setFontColor('white').setFontWeight('bold');}
 const prop=PropertiesService.getScriptProperties();
 const owner=String(Session.getEffectiveUser().getEmail()||'').toLowerCase().trim();
 const allowed=String(prop.getProperty('ALLOWED_EMAILS')||'').toLowerCase().split(/[;,]/).map(x=>x.trim()).filter(Boolean);
 if(owner&&!allowed.includes(owner))prop.setProperty('ALLOWED_EMAILS',[...allowed,owner].join(','));
 if(!prop.getProperty('ALERT_EMAIL')&&owner)prop.setProperty('ALERT_EMAIL',owner);
 atualizarNotificacoes();
 return 'Abas verificadas, e-mail proprietário preparado e notificações sincronizadas. Execute configurarGatilho uma vez.';
}
/**
 * MODO PROPRIETÁRIO: se o Web App for implantado como "Eu" e SOMENTE EU,
 * Session.getActiveUser pode ficar vazio. Nesse caso usa-se o proprietário
 * efetivo, configurado em ALLOWED_EMAILS. NUNCA publique esta implantação
 * para "Qualquer pessoa" / "Qualquer pessoa com Conta Google".
 * Para acesso multiusuário: implantar "executar como usuário que acessa",
 * compartilhar a planilha e autorizar individualmente ALLOWED_EMAILS.
 */
function usuarioAutorizado_(){
 const p=PropertiesService.getScriptProperties();
 const list=String(p.getProperty('ALLOWED_EMAILS')||'').toLowerCase().split(/[;,]/).map(s=>s.trim()).filter(Boolean);
 const active=String(Session.getActiveUser().getEmail()||'').toLowerCase().trim();
 const owner=String(Session.getEffectiveUser().getEmail()||'').toLowerCase().trim();
 if(active&&list.includes(active))return active;
 if(!active&&owner&&list.includes(owner))return owner; // app privado, executar como Eu
 throw Error('Conta não autorizada. Em Propriedades do script configure ALLOWED_EMAILS com o e-mail da conta de implantação; para uso compartilhado implante como o usuário que acessa.');
}
function auditar_(email,acao,aba,id,antes,depois){sh_(ABAS.AUDIT).appendRow([new Date(),email,acao,aba,String(id),JSON.stringify(antes).slice(0,30000),JSON.stringify(depois).slice(0,30000)]);}
function uids_(){return 'FRO-'+Utilities.getUuid().slice(0,12).toUpperCase();}
function frotaData_(){
 const b=getRows_(ABAS.BASE),seg=getRows_(ABAS.SEGUROS),extras=getRows_(ABAS.EXTRAS),venc=getRows_(ABAS.VENC),pay=getRows_(ABAS.PAG),km=getRows_(ABAS.KM),fuel=getRows_(ABAS.FUEL),man=getRows_(ABAS.MANUT),photos=getRows_(ABAS.FOTOS),docs=getRows_(ABAS.DOCS);
 const vehicles=b.filter(x=>x.v[0]).map(x=>({row:x.row,id:String(x.v[0]),type:x.v[1],model:x.v[2],plate:x.v[3],year:x.v[6],color:x.v[7],owner:x.v[8],driver:x.v[10],crlv:x.v[11],notes:x.v[14]}));
 const insurance=seg.filter(x=>x.v[0]).map(x=>{
  const from=ymd_(x.v[5]);
  const toRaw=ymd_(x.v[6]);
  const to=toRaw||(from?plusDays_(from,365):'');
  return {row:x.row,id:x.v[0],plate:x.v[1],insurer:x.v[2],policy:x.v[3],documentType:x.v[4],from:from,to:to,toManual:!!toRaw,status:x.v[8],premium:x.v[9],installments:x.v[10],installmentAmount:x.v[11],notes:x.v[12]};
 });
 const mapping=(arr,keys)=>arr.map(x=>{const o={row:x.row};keys.forEach((k,i)=>o[k]=x.v[i]);return o;});
 const collections={
  extras:mapping(extras,['id','plate','type','description','date','amount','paid','notes']),
  vencimentos:mapping(venc,['id','plate','type','description','date','paid','paidAt','amount','receipt','notes']).map(x=>{
   const d=ymd_(x.date);
   const paidAt=ymd_(x.paidAt);
   return Object.assign({},x,{date:d||(paidAt?plusDays_(paidAt,365):'')});
  }),
  payments:mapping(pay,['id','plate','date','type','description','amount','receipt']),
  km:mapping(km,['id','plate','date','odometer','notes']),
  fuel:mapping(fuel,['id','plate','date','fuel','liters','amount','odometer','station','receipt','notes','driver']),
  maintenance:mapping(man,['id','plate','date','service','odometer','amount','nextDate','nextKm','status','provider','receipt','notes']),
  photos:mapping(photos,['id','plate','url','caption']),
  documents:mapping(docs,['id','plate','type','url','issued','date','status','notes','amount'])};
 const alerts=gerarAlertas_({vehicles,insurance,...collections});
 return {vehicles,insurance,alerts,...collections,updatedAt:Utilities.formatDate(new Date(),FROTA_TZ,'dd/MM/yyyy HH:mm'),sheetUrl:'https://docs.google.com/spreadsheets/d/'+FROTA_ID+'/edit'};
}
function getData(){currentUser_();return frotaData_();}
function parseNum_(x){if(typeof x==='number')return x;let s=String(x||'').trim().replace(/R\$|\s/g,'');if(s.indexOf(',')>=0)s=s.replace(/\./g,'').replace(',','.');return Number(s)||0;}
function statusPago_(s){return ['SIM','PAGO','PAGA','REGULARIZADO','REGULARIZADA','QUITADO','CONCLUÍDO','CONCLUIDO'].includes(String(s||'').toUpperCase().trim());}
function gerarAlertas_(d){
 const names={};d.vehicles.forEach(v=>names[String(v.plate||'').toUpperCase()]=v.model);
 const list=[],seen=new Map();
 function put(plate,tipo,day,paid,desc){
  const date=ymd_(day),p=String(plate||'').trim().toUpperCase(),type=String(tipo||'').trim();if(!p||!type||!date)return;
  const key=p+'|'+type.toUpperCase()+'|'+date;
  if(seen.has(key)){
    const existing=list[seen.get(key)];
    if(paid){existing.paid=true;existing.status='REGULARIZADO';}
    if(!existing.notes&&desc)existing.notes=desc;
    return;
  }
  const today=Utilities.formatDate(new Date(),FROTA_TZ,'yyyy-MM-dd');
  const delta=Math.round((date_(date).getTime()-date_(today).getTime())/86400000);
  const status=paid?'REGULARIZADO':delta<=0?'VENCIDO':delta<=5?'URGENTE':delta<=10?'PRÓXIMO':'EM DIA';
  seen.set(key,list.length);
  list.push({key,plate:p,vehicle:names[p]||'',type,date,days:delta,status,paid:!!paid,notes:desc||''});
 }
 // Seguro: usa a apólice com vencimento mais recente por placa. Ignora propostas para alerta.
 const apolices={};
 d.insurance.forEach(s=>{
  if(!norm_(s.documentType).includes('apolice')||!s.to)return;
  const p=String(s.plate||'').trim().toUpperCase();if(!p)return;
  if(!apolices[p]||String(s.to)>String(apolices[p].to))apolices[p]=s;
 });
 Object.keys(apolices).forEach(p=>{const s=apolices[p];put(s.plate,'Seguro',s.to,false,s.notes);});
 const placasComApolice=new Set(Object.keys(apolices));
 d.vencimentos.forEach(s=>{
  if(String(s.paid||'').toLowerCase().includes('proposta'))return;
  const p=String(s.plate||'').trim().toUpperCase();
  // Evita alerta duplicado de seguro quando a aba Seguros já tem a apólice.
  if(norm_(s.type)==='seguro'&&placasComApolice.has(p))return;
  put(s.plate,s.type,s.date,statusPago_(s.paid),s.description);
 });
 d.extras.forEach(s=>put(s.plate,s.type,s.date,statusPago_(s.paid),s.description));
 d.documents.forEach(s=>put(s.plate,s.type||'Documento',s.date,statusPago_(s.status),s.notes));
 d.maintenance.forEach(s=>{if(s.nextDate)put(s.plate,'Manutenção',s.nextDate,statusPago_(s.status),s.service);});
 return list.sort((a,b)=>a.days-b.days);
}
function atualizarNotificacoes(){
 const data=frotaData_(),a=sh_(ABAS.ALERTAS),old=rows_(ABAS.ALERTAS),prior={};
 old.forEach(x=>{const v=x.values;prior[String(v[0])]={date:ymd_(v[4]),sent10:ymd_(v[7]),sent5:ymd_(v[8])};});
 const o=data.alerts.map(t=>{const p=prior[t.key]||{},same=p.date===t.date;return [t.key,t.plate,t.vehicle,t.type,date_(t.date),t.days,t.status,same&&p.sent10?date_(p.sent10):'',same&&p.sent5?date_(p.sent5):'',t.paid?'SIM':'NÃO',new Date(),t.notes];});
 if(a.getLastRow()>1)a.getRange(2,1,a.getLastRow()-1,12).clearContent();
 if(o.length)a.getRange(2,1,o.length,12).setValues(o);return {updated:o.length};
}
function enviarAlertasDiarios(){
 atualizarNotificacoes();const email=(PropertiesService.getScriptProperties().getProperty('ALERT_EMAIL')||Session.getEffectiveUser().getEmail()||'').trim();
 if(!email)throw Error('Configure ALERT_EMAIL nas Propriedades do script antes do envio automático.');
 const s=sh_(ABAS.ALERTAS),data=s.getDataRange().getValues(),hoje=ymd_(new Date()),msgs=[];
 for(let i=1;i<data.length;i++){const r=data[i],dias=Number(r[5]),col=dias===10?8:dias===5?9:0;
  if(!col||String(r[9]).toUpperCase()==='SIM'||ymd_(r[col-1])===hoje)continue;
  msgs.push({row:i+1,col,msg:r[1]+' — '+r[3]+' vence em '+dias+' dias ('+ymd_(r[4])+')'});
 }
 if(!msgs.length)return 'Nenhum novo alerta de 10 ou 5 dias.';
 MailApp.sendEmail(email,'GVG & ARTEFAL | Alertas de vencimento',msgs.map(x=>x.msg).join('\n'));
 msgs.forEach(x=>s.getRange(x.row,x.col).setValue(new Date()));return msgs.length+' alerta(s) enviado(s).';
}
function configurarGatilho(){
 usuarioAutorizado_();const props=PropertiesService.getScriptProperties(),email=props.getProperty('ALERT_EMAIL')||Session.getEffectiveUser().getEmail();
 if(!email)throw Error('Defina ALERT_EMAIL (e-mail de recebimento) nas Propriedades do script.');
 if(!props.getProperty('ALERT_EMAIL'))props.setProperty('ALERT_EMAIL',email);
 ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='enviarAlertasDiarios').forEach(t=>ScriptApp.deleteTrigger(t));
 ScriptApp.newTrigger('enviarAlertasDiarios').timeBased().everyDays(1).atHour(8).create();
 return 'Um gatilho diário de envio criado (aproximadamente às 8h, no fuso do projeto).';
}
function getTables(){
 requireAdmin_();const out={};Object.keys(ESQUEMAS).forEach(name=>{
  const sh=sh_(name),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],schema=ESQUEMAS[name];
  out[name]={headers,rows:rows_(name),editable:schema.edit,dates:schema.dates};
 });return out;
}
function safe_(v){if(typeof v==='string'&&/^[=+@]/.test(v))return "'"+v;return v;}
function saveRecord(tab,row,values){
 const user=requireAdmin_().email,schema=ESQUEMAS[tab];if(!schema||!Array.isArray(values))throw Error('Tabela ou registro não autorizado.');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const sh=sh_(tab),width=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].filter(Boolean).length;
  if(values.length<width)throw Error('Dados incompletos: número de campos diferente do esperado.');
  const novo=Number(row)===0,pos=novo?sh.getLastRow()+1:Number(row);
  if(!novo&&(!Number.isInteger(pos)||pos<2||pos>sh.getLastRow()))throw Error('Linha não encontrada.');
  const prev=novo?[]:sh.getRange(pos,1,1,sh.getLastColumn()).getValues()[0].map(val_);
  const vals=values.slice(0,width).map(v=>v===undefined||v===null?'':v);
  if(tab==='Seguros'){
   const doc=norm_(vals[4]);
   if(doc.includes('apolice'))vals[4]='Apólice';
   else if(doc.includes('proposta'))vals[4]='Proposta';
   else if(doc.includes('nenhum'))vals[4]='Nenhum';
   // Regra padrão: se informou o início e deixou o fim vazio, vence em 365 dias.
   if(!String(vals[6]||'').trim() && String(vals[5]||'').trim())vals[6]=plusDays_(vals[5],365);
  }
  if(novo&&tab!=='Base de Dados'&&!String(vals[schema.key]||'').trim()){if(tab==='Seguros'||tab==='Vencimentos'){const rec=rows_(ABAS.BASE).find(x=>String(x.values[3]).toUpperCase()===String(vals[1]||'').toUpperCase());if(!rec)throw Error('Placa não cadastrada na frota.');vals[0]=rec.values[0];}else vals[schema.key]=uids_();}
  if(tab==='Base de Dados'){
   if(!String(vals[0]||'').trim())vals[0]='V'+Utilities.getUuid().slice(0,7).toUpperCase();if(!String(vals[3]||'').trim())throw Error('Informe a placa do veículo.');
   const all=rows_(tab).filter(x=>novo||x.row!==pos);
   if(all.some(x=>String(x.values[0]).toUpperCase()===String(vals[0]).toUpperCase()))throw Error('ID de veículo já cadastrado.');
   if(all.some(x=>String(x.values[3]).toUpperCase()===String(vals[3]).toUpperCase()))throw Error('Placa já cadastrada.');
  }else if(tab!=='Seguros'&&!String(vals[1]||'').trim())throw Error('Informe a placa.');
  // Escreve somente colunas permitidas, preservando fórmulas calculadas.
  const changes=[];
  schema.edit.forEach(j=>{
   let v=vals[j];if(schema.dates.includes(j)&&v!=='')v=date_(v);
   else if((schema.numeric||[]).includes(j)&&v!==''){const str=String(v).replace(/R\$|\s/g,'');if(!/^-?[\d.,]+$/.test(str))throw Error('Valor numérico inválido na coluna '+(j+1));v=parseNum_(v);}
   else if(typeof v==='string')v=safe_(v.trim());
   const old=novo?'':sh.getRange(pos,j+1).getValue();
   if(novo||String(val_(old))!==String(val_(v)))changes.push({col:j+1,value:v});
  });
  changes.forEach(c=>sh.getRange(pos,c.col).setValue(c.value));
  if(tab==='Seguros'){
   sh.getRange(pos,8).setFormula('=IF(OR(A'+pos+'="";G'+pos+'="");"";G'+pos+'-TODAY())');
   sh.getRange(pos,9).setFormula('=IF(A'+pos+'="";"";IF(E'+pos+'="Nenhum";"SEM SEGURO";IF(G'+pos+'="";"VERIFICAR";IF(E'+pos+'="Proposta";"SEM APÓLICE CONFIRMADA";IF(G'+pos+'<=TODAY();"VENCIDO";IF(G'+pos+'<=TODAY()+30;"VENCE EM ATÉ 30 DIAS";"VIGENTE"))))))');
  }
  auditar_(user,novo?'CRIAR':'EDITAR',tab,vals[schema.key]||pos,prev,vals);
  if(['Seguros','Vencimentos','Vencimentos Extras','Documentos Frota','Manutenções'].includes(tab))atualizarNotificacoes();
  SpreadsheetApp.flush();return {ok:true,row:pos,tab};
 }finally{lock.releaseLock();}
}
function deleteRecord(tab,row){
 const user=requireAdmin_().email;if(!ESQUEMAS[tab])throw Error('Tabela não autorizada.');
 const sh=sh_(tab),pos=Number(row);if(!Number.isInteger(pos)||pos<2||pos>sh.getLastRow())throw Error('Linha inválida.');
 const lock=LockService.getScriptLock();lock.waitLock(30000);try{
  const previous=sh.getRange(pos,1,1,sh.getLastColumn()).getValues()[0].map(val_);
  // Impede excluir a ficha de um veículo que ainda tem registros vinculados.
  if(tab==='Base de Dados'){
   const placa=String(previous[3]||'').toUpperCase();
   for(const other of Object.keys(ESQUEMAS).filter(k=>k!=='Base de Dados')){
    if(rows_(other).some(x=>String(x.values[1]||'').toUpperCase()===placa))throw Error('Veículo possui registros em '+other+'. Remova ou transfira os vínculos antes de excluir.');
   }
  }
  auditar_(user,'EXCLUIR',tab,previous[0]||pos,previous,[]);sh.deleteRow(pos);
  if(['Seguros','Vencimentos','Vencimentos Extras','Documentos Frota','Manutenções'].includes(tab))atualizarNotificacoes();
  return {ok:true};
 }finally{lock.releaseLock();}
}
function getAudit(){requireAdmin_();return rows_(ABAS.AUDIT).slice(-100).reverse().map(x=>x.values);}

/** Diagnóstico de implantação: não modifica a planilha. */
function verificarSistema(){
 const email=requireAdmin_().email;
 const sheets=Object.values(ABAS).map(n=>({aba:n,existe:!!ss_().getSheetByName(n)}));
 const triggers=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='enviarAlertasDiarios').length;
 return {ok:sheets.every(s=>s.existe),email,spreadsheetId:FROTA_ID,abas:sheets,gatilhosDiarios:triggers,alertEmail:PropertiesService.getScriptProperties().getProperty('ALERT_EMAIL')||'',fuso:Session.getScriptTimeZone()};
}


/* ================= AUTENTICAÇÃO PRÓPRIA — CONTROLE DE FROTAS ================= */
var ACTIVE_TOKEN_ = '';
var ACTIVE_PANEL_TOKEN_ = '';

function s_(v) { return String(v == null ? '' : v).trim(); }
function hexBytes_(bytes) {
  return bytes.map(function(b) {
    const n = (b < 0 ? b + 256 : b).toString(16);
    return n.length === 1 ? '0' + n : n;
  }).join('');
}
function hashPassword_(senha, salt) {
  let h = salt + ':' + senha;
  for (let i = 0; i < 800; i++) {
    h = hexBytes_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + ':' + salt));
  }
  return h;
}
function verifyPassword_(senha, salt, hash) {
  if (!salt || !hash) return false;
  return hashPassword_(senha, salt) === hash;
}
function hashToken_(token) {
  return hexBytes_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token)));
}
function emailValid_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}
function safeText_(x, max) {
  let t = String(x == null ? '' : x).slice(0, max || 200);
  return /^[=+@\-]/.test(t) ? "'" + t : t;
}
function authDate_(v) {
  return v instanceof Date && !isNaN(v)
    ? Utilities.formatDate(v, FROTA_TZ, 'dd/MM/yyyy HH:mm')
    : s_(v);
}
function authSheet_(name, headers) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setBackground('#071020').setFontColor('#f2c646').setFontWeight('bold');
  }
  return sh;
}
function usuariosSheet_() {
  return authSheet_('USUARIOS', ['E-mail','Nome','Perfil','Status','Último acesso','Atualizado em','SenhaHash','SenhaSalt','Solicitado em','Aprovado por','Aprovado em']);
}
function sessoesSheet_() {
  return authSheet_('SESSOES', ['TokenHash','Email','ExpiraEm','Revogada','CriadaEm']);
}
function authAudit_(user, action, email, detail) {
  try {
    sh_(ABAS.AUDIT).appendRow([new Date(), user || 'sistema', action, 'USUARIOS', email || '', '', JSON.stringify(detail || {})]);
  } catch (e) {}
}
function mapUsuario_(r) {
  return {
    email: s_(r[0]).toLowerCase(),
    nome: s_(r[1]),
    perfil: (s_(r[2]) || 'CONSULTA').toUpperCase(),
    status: (s_(r[3]) || 'ATIVO').toUpperCase(),
    ultimoAcesso: authDate_(r[4]),
    atualizadoEm: authDate_(r[5]),
    temSenha: !!s_(r[6]),
    solicitadoEm: authDate_(r[8]),
    aprovadoPor: s_(r[9]),
    aprovadoEm: authDate_(r[10])
  };
}
function createSession_(user) {
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  const expira = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessoesSheet_().appendRow([hashToken_(token), String(user.email).toLowerCase(), expira, 'NAO', new Date()]);
  return token;
}
function revokeSession_(token) {
  if (!token) return;
  const sh = sessoesSheet_();
  const v = sh.getDataRange().getValues();
  const h = hashToken_(token);
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) === h && String(v[i][3]) !== 'SIM') {
      sh.getRange(i + 1, 4).setValue('SIM');
      return;
    }
  }
}
function revokeSessionsForEmail_(email) {
  const alvo = s_(email).toLowerCase();
  if (!alvo) return;
  const sh = sessoesSheet_();
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][1]).toLowerCase() === alvo && String(v[i][3]) !== 'SIM') {
      sh.getRange(i + 1, 4).setValue('SIM');
    }
  }
}
function currentUser_() {
  if (ACTIVE_PANEL_TOKEN_) {
    const a = gvguAcessoPainel_(ACTIVE_PANEL_TOKEN_, 'frotas');
    const nivel = String(a.nivel || '');
    if (nivel !== 'VISUAL' && nivel !== 'OPERAR' && nivel !== 'GERENCIAR') throw Error('GVG_SEM_ACESSO_PROJETO: seu perfil não tem acesso ao Controle de Frotas.');
    return {
      email: a.usuario.email || a.usuario.login || '',
      nome: a.usuario.nome || '',
      perfil: nivel === 'VISUAL' ? 'CONSULTA' : 'ADMIN',
      status: 'ATIVO',
      painel: true,
      painelNivel: nivel,
      canEdit: nivel !== 'VISUAL',
      canManage: nivel === 'GERENCIAR'
    };
  }
  throw Error('AUTH_REQUIRED_PAINEL');
}
function requireAdmin_() {
  const user = currentUser_();
  if (user.perfil !== 'ADMIN') throw Error('Seu perfil não permite esta operação.');
  return user;
}
function requireManager_() {
  const user = currentUser_();
  if (!(user.canManage || (user.perfil === 'ADMIN' && !user.painel))) throw Error('Somente o perfil Gerenciar pode consultar a auditoria.');
  return user;
}
function assertNotLastAdmin_(target, action) {
  if (s_(target[2]).toUpperCase() !== 'ADMIN' || s_(target[3]).toUpperCase() !== 'ATIVO') return;
  const admins = usuariosSheet_().getDataRange().getValues().slice(1).filter(function(r) {
    return s_(r[0]) && s_(r[2]).toUpperCase() === 'ADMIN' && s_(r[3]).toUpperCase() === 'ATIVO';
  });
  if (admins.length <= 1) throw Error('Não é permitido ' + action + ' o último administrador ativo.');
}

function getBootstrap() {
  if (!ACTIVE_PANEL_TOKEN_) return { ok: false, authRequired: true, painelRequired: true };
  try {
    return { ok: true, user: currentUser_() };
  } catch (e) {
    const msg = String(e && e.message || e);
    if (msg.indexOf('GVG_SEM_ACESSO_PROJETO') >= 0) throw e;
    return { ok: false, authRequired: true, painelRequired: true, message: msg };
  }
}

function apiCall(fn, args, token, painelToken) {
  ACTIVE_TOKEN_ = token == null ? '' : String(token);
  ACTIVE_PANEL_TOKEN_ = painelToken == null ? '' : String(painelToken);
  if (ACTIVE_PANEL_TOKEN_) {
    const blocked = ['registrarUsuario','loginUsuario','alterarMinhaSenha','redefinirSenhaUsuario','listarUsuarios','aprovarUsuario','recusarUsuario','alterarPerfilUsuario','bloquearUsuario','excluirUsuario'];
    if (blocked.indexOf(fn) >= 0) throw Error('Usuários e senhas são gerenciados no painel GVG&ARTEFAL.');
  }
  const allowed = {
    getBootstrap: getBootstrap,
    getData: getData,
    getTables: getTables,
    getAudit: getAudit,
    saveRecord: saveRecord,
    deleteRecord: deleteRecord,
    verificarSistema: verificarSistema,
    registrarUsuario: registrarUsuario,
    loginUsuario: loginUsuario,
    logoutUsuario: logoutUsuario,
    alterarMinhaSenha: alterarMinhaSenha,
    redefinirSenhaUsuario: redefinirSenhaUsuario,
    listarUsuarios: listarUsuarios,
    aprovarUsuario: aprovarUsuario,
    recusarUsuario: recusarUsuario,
    alterarPerfilUsuario: alterarPerfilUsuario,
    bloquearUsuario: bloquearUsuario,
    excluirUsuario: excluirUsuario
  };
  if (!Object.prototype.hasOwnProperty.call(allowed, fn)) throw Error('Função inválida.');
  const list = Array.isArray(args) ? args : [];
  return allowed[fn].apply(null, list);
}

function registrarUsuario(payload) {
  const p = payload || {};
  const email = s_(p.email).toLowerCase();
  const nome = safeText_(p.nome, 200);
  const senha = String(p.senha == null ? '' : p.senha);
  const confirmar = String(p.confirmar == null ? '' : p.confirmar);
  if (!email || !emailValid_(email)) throw Error('Informe um e-mail válido.');
  if (nome.split(/\s+/).filter(Boolean).length < 2) throw Error('Informe nome e sobrenome.');
  if (!senha) throw Error('Informe uma senha.');
  if (senha !== confirmar) throw Error('As senhas não conferem.');
  const rows = usuariosSheet_().getDataRange().getValues().slice(1);
  if (rows.some(function(r) { return s_(r[0]).toLowerCase() === email; })) throw Error('Este e-mail já está cadastrado no sistema.');
  const salt = Utilities.getUuid().replace(/-/g, '');
  const now = new Date();
  usuariosSheet_().appendRow([email, nome, 'CONSULTA', 'PENDENTE', '', now, hashPassword_(senha, salt), salt, now, '', '']);
  authAudit_(email, 'SOLICITAR CADASTRO', email, { nome: nome, status: 'PENDENTE' });
  return { ok: true, message: 'Cadastro realizado. Aguarde a aprovação do administrador.' };
}

function loginUsuario(payload) {
  const p = payload || {};
  const email = s_(p.email).toLowerCase();
  const senha = String(p.senha == null ? '' : p.senha);
  if (!email || !emailValid_(email)) throw Error('Informe um e-mail válido.');
  if (!senha) throw Error('Informe a senha.');
  const cache = CacheService.getScriptCache();
  const failKey = 'frotasfail_' + hashToken_(email);
  const falhas = Number(cache.get(failKey) || 0);
  if (falhas >= 10) throw Error('Muitas tentativas. Aguarde 15 minutos.');
  const rows = usuariosSheet_().getDataRange().getValues().slice(1);
  const idx = rows.findIndex(function(x) { return s_(x[0]).toLowerCase() === email; });
  const r = idx >= 0 ? rows[idx] : null;
  const hash = r ? s_(r[6]) : '';
  const salt = r ? s_(r[7]) : '';
  const ok = !!r && !!hash && verifyPassword_(senha, salt, hash);
  if (!ok) {
    cache.put(failKey, String(falhas + 1), 900);
    throw Error('E-mail ou senha inválidos.');
  }
  cache.remove(failKey);
  const user = mapUsuario_(r);
  if (user.status === 'PENDENTE') throw Error('Seu cadastro ainda está aguardando aprovação.');
  if (user.status === 'RECUSADO') throw Error('Seu cadastro foi recusado.');
  if (user.status === 'BLOQUEADO' || user.status === 'INATIVO') throw Error('Seu usuário está bloqueado.');
  if (user.status !== 'ATIVO') throw Error('Usuário sem acesso ativo.');
  try { usuariosSheet_().getRange(idx + 2, 5).setValue(new Date()); } catch (e) {}
  const token = createSession_(user);
  return { ok: true, token: token, user: user };
}

function logoutUsuario(payload) {
  revokeSession_(ACTIVE_TOKEN_ || (payload && payload.token) || '');
  return { ok: true };
}

function alterarMinhaSenha(payload) {
  const user = currentUser_();
  const p = payload || {};
  const atual = String(p.atual == null ? '' : p.atual);
  const nova = String(p.nova == null ? '' : p.nova);
  const confirmar = String(p.confirmar == null ? '' : p.confirmar);
  if (!nova) throw Error('Informe a nova senha.');
  if (nova !== confirmar) throw Error('As senhas não conferem.');
  const rows = usuariosSheet_().getDataRange().getValues();
  const idx = rows.findIndex(function(r, i) { return i > 0 && s_(r[0]).toLowerCase() === user.email; });
  if (idx < 0) throw Error('Usuário não encontrado.');
  const hash = s_(rows[idx][6]);
  if (hash && !verifyPassword_(atual, s_(rows[idx][7]), hash)) throw Error('Senha atual incorreta.');
  const salt = Utilities.getUuid().replace(/-/g, '');
  const sh = usuariosSheet_();
  sh.getRange(idx + 1, 7, 1, 2).setValues([[hashPassword_(nova, salt), salt]]);
  sh.getRange(idx + 1, 6).setValue(new Date());
  revokeSessionsForEmail_(user.email);
  const token = createSession_(user);
  authAudit_(user.email, 'ALTERAR PRÓPRIA SENHA', user.email, {});
  return { ok: true, token: token };
}

function redefinirSenhaUsuario(payload) {
  const admin = requireAdmin_();
  const p = payload || {};
  const email = s_(p.email).toLowerCase();
  const nova = String(p.nova == null ? '' : p.nova);
  const confirmar = String(p.confirmar == null ? nova : p.confirmar);
  if (!email) throw Error('Usuário não informado.');
  if (!nova) throw Error('Informe a nova senha.');
  if (nova !== confirmar) throw Error('As senhas não conferem.');
  const sh = usuariosSheet_();
  const v = sh.getDataRange().getValues();
  const idx = v.findIndex(function(r, i) { return i > 0 && s_(r[0]).toLowerCase() === email; });
  if (idx < 0) throw Error('Usuário não encontrado.');
  const salt = Utilities.getUuid().replace(/-/g, '');
  sh.getRange(idx + 1, 7, 1, 2).setValues([[hashPassword_(nova, salt), salt]]);
  sh.getRange(idx + 1, 6).setValue(new Date());
  revokeSessionsForEmail_(email);
  authAudit_(admin.email, 'REDEFINIR SENHA', email, {});
  return { ok: true };
}

function listarUsuarios() {
  requireAdmin_();
  return usuariosSheet_().getDataRange().getValues().slice(1).filter(function(r) { return s_(r[0]); }).map(mapUsuario_);
}

function aprovarUsuario(payload) {
  const admin = requireAdmin_();
  const p = payload || {};
  const email = s_(p.email).toLowerCase();
  const sh = usuariosSheet_();
  const v = sh.getDataRange().getValues();
  const idx = v.findIndex(function(r, i) { return i > 0 && s_(r[0]).toLowerCase() === email; });
  if (idx < 0) throw Error('Usuário não encontrado.');
  if (!s_(v[idx][6])) throw Error('Usuário sem senha cadastrada.');
  const perfil = s_(p.perfil || 'CONSULTA').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CONSULTA';
  sh.getRange(idx + 1, 3, 1, 4).setValues([[perfil, 'ATIVO', v[idx][4], new Date()]]);
  sh.getRange(idx + 1, 10, 1, 2).setValues([[admin.email, new Date()]]);
  authAudit_(admin.email, 'APROVAR CADASTRO', email, { perfil: perfil });
  return { ok: true };
}

function recusarUsuario(payload) {
  const admin = requireAdmin_();
  const email = s_((payload || {}).email).toLowerCase();
  if (email === admin.email) throw Error('Você não pode recusar seu próprio usuário.');
  const sh = usuariosSheet_();
  const v = sh.getDataRange().getValues();
  const idx = v.findIndex(function(r, i) { return i > 0 && s_(r[0]).toLowerCase() === email; });
  if (idx < 0) throw Error('Usuário não encontrado.');
  sh.getRange(idx + 1, 4).setValue('RECUSADO');
  sh.getRange(idx + 1, 6).setValue(new Date());
  revokeSessionsForEmail_(email);
  authAudit_(admin.email, 'RECUSAR CADASTRO', email, {});
  return { ok: true };
}

function alterarPerfilUsuario(payload) {
  const admin = requireAdmin_();
  const p = payload || {};
  const email = s_(p.email).toLowerCase();
  const perfil = s_(p.perfil || '').toUpperCase();
  if (['ADMIN', 'CONSULTA'].indexOf(perfil) < 0) throw Error('Perfil inválido.');
  if (email === admin.email && perfil !== 'ADMIN') throw Error('Você não pode remover seu próprio acesso administrativo.');
  const sh = usuariosSheet_();
  const v = sh.getDataRange().getValues();
  const idx = v.findIndex(function(r, i) { return i > 0 && s_(r[0]).toLowerCase() === email; });
  if (idx < 0) throw Error('Usuário não encontrado.');
  assertNotLastAdmin_(v[idx], 'rebaixar');
  sh.getRange(idx + 1, 3).setValue(perfil);
  sh.getRange(idx + 1, 6).setValue(new Date());
  authAudit_(admin.email, 'ALTERAR PERFIL', email, { perfil: perfil });
  return { ok: true };
}

function bloquearUsuario(payload) {
  const admin = requireAdmin_();
  const p = payload || {};
  const email = s_(p.email).toLowerCase();
  if (email === admin.email) throw Error('Você não pode bloquear seu próprio usuário.');
  const status = s_(p.status || 'BLOQUEADO').toUpperCase() === 'ATIVO' ? 'ATIVO' : 'BLOQUEADO';
  const sh = usuariosSheet_();
  const v = sh.getDataRange().getValues();
  const idx = v.findIndex(function(r, i) { return i > 0 && s_(r[0]).toLowerCase() === email; });
  if (idx < 0) throw Error('Usuário não encontrado.');
  if (status === 'BLOQUEADO') assertNotLastAdmin_(v[idx], 'bloquear');
  sh.getRange(idx + 1, 4).setValue(status);
  sh.getRange(idx + 1, 6).setValue(new Date());
  if (status === 'BLOQUEADO') revokeSessionsForEmail_(email);
  authAudit_(admin.email, status === 'ATIVO' ? 'REATIVAR USUÁRIO' : 'BLOQUEAR USUÁRIO', email, {});
  return { ok: true };
}

function excluirUsuario(payload) {
  const admin = requireAdmin_();
  const email = s_((payload || {}).email).toLowerCase();
  if (email === admin.email) throw Error('Você não pode excluir seu próprio usuário.');
  const sh = usuariosSheet_();
  const v = sh.getDataRange().getValues();
  const idx = v.findIndex(function(r, i) { return i > 0 && s_(r[0]).toLowerCase() === email; });
  if (idx < 0) throw Error('Usuário não encontrado.');
  assertNotLastAdmin_(v[idx], 'excluir');
  sh.deleteRow(idx + 1);
  revokeSessionsForEmail_(email);
  authAudit_(admin.email, 'EXCLUIR USUÁRIO', email, {});
  return { ok: true };
}

return { apiCall: apiCall };
})();
function frotasApiCall(fn, args, token, painelToken) {
  return GVG_FROTAS_MODULE.apiCall(fn, args, token, painelToken);
}
