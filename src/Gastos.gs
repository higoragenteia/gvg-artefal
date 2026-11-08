/** GVG & ARTEFAL — Controle de Gastos (código oficial integrado ao projeto do painel). book_() usa a cópia de teste GVG_GASTOS_ID. */
/** GVG & ARTEFAL — Controle de Gastos. Use em projeto Apps Script VINCULADO à cópia Google Sheets. */
const CFG={base:'Base de Dados',budget:'Orçamento Mensal',reg:'Cadastro',adjust:'Ajustes de Saldo',audit:'Auditoria Dashboard'};
function book_(){return SpreadsheetApp.openById(GVG_GASTOS_ID);}
function sh_(n){const x=book_().getSheetByName(n);if(!x)throw Error('Aba não encontrada: '+n+'. Execute prepararDashboard primeiro.');return x;}
function s_(v){return String(v==null?'':v).trim();}
function validDate_(d){let x=new Date(String(d).slice(0,10)+'T12:00:00');if(isNaN(x.getTime()))throw Error('Data inválida');return x;}
function month_(d){return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM');}
function money_(v){let n=Number(v);if(!Number.isFinite(n)||n<0)throw Error('Informe um valor válido maior ou igual a zero');return Math.round(n*100)/100;}
function guard_(o){if(!o||typeof o!=='object')throw Error('Dados não informados');}
function audit_(action,detail){let who='sistema';try{who=currentUser_().email;}catch(e){}sh_(CFG.audit).appendRow([new Date(),who,action,JSON.stringify(detail)]);}
function prepararDashboard(){const ss=book_();const specs={
'Base de Dados':['Data','Descrição do Gasto','Pessoa','Categoria','Empresa','Forma de Pagamento','Valor (R$)','Saldo da Categoria no Mês por Pessoa (R$)','Observações'],
'Orçamento Mensal':['A partir de (mês)','Categoria','Claudemir Jeronimo','Edson Alves Dias de Araujo Junior','Iran Francisco','Douglas Max'],
'Cadastro':['Categoria','Pessoa','Forma de Pagamento','Empresa'],
'Ajustes de Saldo':['Data','Pessoa','Categoria','Tipo','Valor (R$)','Observações'],
'Auditoria Dashboard':['Data e hora','Operador','Ação','Detalhes'],'USUARIOS':['E-mail','Nome','Perfil','Status','Último acesso','Atualizado em','SenhaHash','SenhaSalt','Solicitado em','Aprovado por','Aprovado em'],'SESSOES':['TokenHash','Email','ExpiraEm','Revogada','CriadaEm']};
for(let [name,header] of Object.entries(specs)){let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,header.length).setValues([header]);sh.setFrozenRows(1);sh.getRange(1,1,1,header.length).setBackground('#151c29').setFontColor('#f9c948').setFontWeight('bold');sh.autoResizeColumns(1,header.length);}}
// Importação do Excel traz cabeçalhos abaixo de notas. Mantemos os dados originais e procuramos os cabeçalhos sem reordená-los.
return {ok:true,message:'Abas adicionais prontas. Dados originais preservados.'};}
function table_(name,keyword){const sh=sh_(name),v=sh.getDataRange().getValues();let i=v.findIndex(r=>s_(r[0]).toLowerCase()===keyword.toLowerCase());if(i<0)throw Error('Cabeçalho '+keyword+' não encontrado em '+name);return {sh,heading:i+1,headers:v[i].map(s_),rows:v.slice(i+1).map((r,j)=>({row:i+j+2,v:r})).filter(x=>x.v.some(y=>s_(y)!==''))};}
function col_(t,label){let i=t.headers.indexOf(label);if(i<0)throw Error('Campo ausente: '+label);return i;}
function formatDate_(d){return Object.prototype.toString.call(d)==='[object Date]'&&!isNaN(d)?Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd'):s_(d).slice(0,10);}
function getDadosDashboard(yearMonth){currentUser_();const target=/^\d{4}-\d{2}$/.test(yearMonth||'')?yearMonth:month_(new Date());const tr=table_(CFG.base,'Data'),b=table_(CFG.budget,'A partir de (mês)'),cad=table_(CFG.reg,'Categoria');const adj=table_(CFG.adjust,'Data');
const ix=Object.fromEntries(['Data','Descrição do Gasto','Pessoa','Categoria','Empresa','Forma de Pagamento','Valor (R$)','Observações'].map(k=>[k,col_(tr,k)]));
const expenses=tr.rows.filter(x=>x.v[ix['Pessoa']]&&x.v[ix['Data']]).map(x=>({row:x.row,date:formatDate_(x.v[ix.Data]),description:s_(x.v[ix['Descrição do Gasto']]),person:s_(x.v[ix.Pessoa]),category:s_(x.v[ix.Categoria]),company:s_(x.v[ix.Empresa]),payment:s_(x.v[ix['Forma de Pagamento']]),value:Number(x.v[ix['Valor (R$)']])||0,notes:s_(x.v[ix.Observações])}));
const adjustments=adj.rows.filter(x=>x.v[0]).map(x=>({row:x.row,date:formatDate_(x.v[0]),person:s_(x.v[1]),category:s_(x.v[2]),type:s_(x.v[3]),value:Number(x.v[4])||0,notes:s_(x.v[5])}));
const people=cad.rows.map(x=>s_(x.v[1])).filter(Boolean);const cats=cad.rows.map(x=>s_(x.v[0])).filter(Boolean).filter(x=>x!=='Custo do Funcionário');const companies=cad.rows.map(x=>s_(x.v[3])).filter(Boolean);const payments=cad.rows.map(x=>s_(x.v[2])).filter(Boolean);
let current={};for(let x of b.rows){let d=formatDate_(x.v[0]);if(d.slice(0,7)>target||!d)continue;let cat=s_(x.v[1]);if(!cat)continue;for(let k=2;k<b.headers.length;k++){let person=s_(b.headers[k]);if(!person)continue;let key=person+'||'+cat;let old=current[key];if(s_(x.v[k])==='')continue;if(!old||d>=old.date)current[key]={date:d,value:Number(x.v[k])||0};}}
const budgets={};for(let [key,x] of Object.entries(current)){if(!key.endsWith('||Custo do Funcionário'))budgets[key]=x.value;}
const inMonth=expenses.filter(x=>x.date.slice(0,7)===target);const inAdj=adjustments.filter(x=>x.date.slice(0,7)===target);const sums={};for(let x of inMonth){let k=x.person+'||'+x.category;sums[k]=(sums[k]||0)+x.value;}for(let x of inAdj){let k=x.person+'||'+x.category;budgets[k]=(budgets[k]||0)+(x.type==='Adicionar'?x.value:-x.value)}
const budgetTotal=Object.values(budgets).reduce((a,b)=>a+b,0),spent=inMonth.reduce((a,b)=>a+b.value,0);
return {month:target,people:[...new Set([...people,...Object.keys(budgets).map(x=>x.split('||')[0])])],categories:[...new Set(cats)],companies:[...new Set(companies)],payments:[...new Set(payments)],expenses,adjustments,budgets,spentByKey:sums,summary:{budget:budgetTotal,spent,remaining:budgetTotal-spent}};}
function addGasto(o){requireAdmin_();guard_(o);const lock=LockService.getScriptLock();lock.waitLock(15000);try{const t=table_(CFG.base,'Data'),cols=t.headers;const d=validDate_(o.date),value=money_(o.value);if(!s_(o.person)||!s_(o.category)||!s_(o.description))throw Error('Pessoa, categoria e descrição são obrigatórios');if(value===0)throw Error('Valor do gasto deve ser maior que zero');const row=Array(cols.length).fill('');const set=(name,v)=>row[col_(t,name)]=v;
set('Data',d);set('Descrição do Gasto',s_(o.description));set('Pessoa',s_(o.person));set('Categoria',s_(o.category));set('Empresa',s_(o.company));set('Forma de Pagamento',s_(o.payment));set('Valor (R$)',value);set('Observações',s_(o.notes));let last=Math.max(t.heading,...t.rows.map(x=>x.row));let dest=last+1;for(let c=0;c<row.length;c++){if(c===7)continue;t.sh.getRange(dest,c+1).setValue(row[c]);}if(!t.sh.getRange(dest,8).getFormula()){const prev=t.sh.getRange(Math.max(6,dest-1),8);if(prev.getFormula())prev.copyTo(t.sh.getRange(dest,8),SpreadsheetApp.CopyPasteType.PASTE_FORMULA,false);}audit_('NOVO GASTO',{row:dest,person:o.person,value});return {ok:true};}finally{lock.releaseLock();}}
function editarGasto(o){requireAdmin_();guard_(o);const lock=LockService.getScriptLock();lock.waitLock(15000);try{const t=table_(CFG.base,'Data'),n=Number(o.row);if(!t.rows.some(x=>x.row===n))throw Error('Lançamento não encontrado');const val=money_(o.value);if(!s_(o.person)||!s_(o.category)||!s_(o.description)||val===0)throw Error('Preencha os campos obrigatórios');const updates={'Data':validDate_(o.date),'Descrição do Gasto':s_(o.description),'Pessoa':s_(o.person),'Categoria':s_(o.category),'Empresa':s_(o.company),'Forma de Pagamento':s_(o.payment),'Valor (R$)':val,'Observações':s_(o.notes)};for(const [k,v] of Object.entries(updates))t.sh.getRange(n,col_(t,k)+1).setValue(v);audit_('EDITAR GASTO',{row:n});return {ok:true};}finally{lock.releaseLock();}}
function excluirGasto(row){requireAdmin_();const lock=LockService.getScriptLock();lock.waitLock(15000);try{const t=table_(CFG.base,'Data'),n=Number(row);if(!t.rows.some(x=>x.row===n))throw Error('Gasto não localizado');const old=t.sh.getRange(n,1,1,t.headers.length).getValues()[0];audit_('EXCLUIR GASTO',{row:n,old:old.map(x=>x instanceof Date?formatDate_(x):x)});t.sh.getRange(n,1,1,t.headers.length).clearContent();if(n>6){const f=t.sh.getRange(n-1,8);if(f.getFormula())f.copyTo(t.sh.getRange(n,8),SpreadsheetApp.CopyPasteType.PASTE_FORMULA,false);}return {ok:true};}finally{lock.releaseLock();}}
function ajustarSaldo(o){requireAdmin_();guard_(o);const lock=LockService.getScriptLock();lock.waitLock(15000);try{if(!s_(o.person)||!s_(o.category)||!['Adicionar','Retirar'].includes(o.type))throw Error('Selecione pessoa, categoria e operação');const v=money_(o.value);if(!v)throw Error('Valor deve ser maior que zero');sh_(CFG.adjust).appendRow([validDate_(o.date),s_(o.person),s_(o.category),o.type,v,s_(o.notes)]);audit_('AJUSTAR SALDO',{person:o.person,category:o.category,type:o.type,value:v});return {ok:true};}finally{lock.releaseLock();}}
function alterarOrcamento(o){requireAdmin_();guard_(o);const lock=LockService.getScriptLock();lock.waitLock(15000);try{let t=table_(CFG.budget,'A partir de (mês)'),ci=t.headers.indexOf(s_(o.person));if(ci<2)throw Error('Pessoa não encontrada nas colunas do orçamento. Cadastre a coluna primeiro.');const cat=s_(o.category);if(!cat)throw Error('Categoria obrigatória');const first=String(o.month||'').slice(0,7)+'-01';const d=validDate_(first);let row=t.rows.find(x=>formatDate_(x.v[0]).slice(0,7)===first.slice(0,7)&&s_(x.v[1])===cat);if(!row){let target=Math.max(t.heading,...t.rows.map(x=>x.row))+1;t.sh.getRange(target,1,1,t.headers.length).setValues([Array(t.headers.length).fill('')]);t.sh.getRange(target,1).setValue(d);t.sh.getRange(target,2).setValue(cat);row={row:target};}t.sh.getRange(row.row,ci+1).setValue(money_(o.value));audit_('ALTERAR ORÇAMENTO',{month:first,person:o.person,category:cat,value:o.value});return {ok:true};}finally{lock.releaseLock();}}
function cadastrarOpcao(o){requireAdmin_();guard_(o);const col={category:1,person:2,payment:3,company:4}[o.kind];if(!col)throw Error('Tipo de cadastro inválido');let value=s_(o.value);if(!value)throw Error('Informe o nome');const sh=sh_(CFG.reg),t=table_(CFG.reg,'Categoria');if(t.rows.some(x=>s_(x.v[col-1]).toLowerCase()===value.toLowerCase()))throw Error('Cadastro já existe');let target=t.heading+1;while(s_(sh.getRange(target,col).getValue()))target++;sh.getRange(target,col).setValue(value);if(o.kind==='person'){let b=sh_(CFG.budget),h=table_(CFG.budget,'A partir de (mês)');let j=h.headers.length+1;b.getRange(h.heading,j).setValue(value);b.getRange(h.heading,j).setBackground('#286f9c').setFontColor('#ffffff').setFontWeight('bold');}audit_('CADASTRAR OPÇÃO',{kind:o.kind,value});return {ok:true,message:'Cadastro criado.'};}

function editarAjuste(o){requireAdmin_();guard_(o);const lock=LockService.getScriptLock();lock.waitLock(15000);try{const sh=sh_(CFG.adjust),row=Number(o.row);if(row<2||row>sh.getLastRow()||!sh.getRange(row,1).getValue())throw Error('Ajuste não localizado');if(!['Adicionar','Retirar'].includes(o.type)||!s_(o.person)||!s_(o.category))throw Error('Confira pessoa, categoria e operação');let old=sh.getRange(row,1,1,6).getValues()[0];sh.getRange(row,1,1,6).setValues([[validDate_(o.date),s_(o.person),s_(o.category),o.type,money_(o.value),s_(o.notes)]]);audit_('EDITAR AJUSTE',{row,old:old.map(x=>x instanceof Date?formatDate_(x):x),novo:o});return {ok:true};}finally{lock.releaseLock();}}
function excluirAjuste(row){requireAdmin_();const lock=LockService.getScriptLock();lock.waitLock(15000);try{const sh=sh_(CFG.adjust),n=Number(row);if(n<2||n>sh.getLastRow()||!sh.getRange(n,1).getValue())throw Error('Ajuste não encontrado');const old=sh.getRange(n,1,1,6).getValues()[0];audit_('EXCLUIR AJUSTE',{row:n,old:old.map(x=>x instanceof Date?formatDate_(x):x)});sh.getRange(n,1,1,6).clearContent();return {ok:true};}finally{lock.releaseLock();}}
function getAuditoria(){requireAdmin_();const sh=sh_(CFG.audit),v=sh.getDataRange().getValues();return v.slice(1).filter(r=>r[0]).slice(-150).reverse().map(r=>({date:formatDate_(r[0]),user:s_(r[1]),action:s_(r[2]),detail:s_(r[3])}));}


/* ================= AUTENTICAÇÃO PRÓPRIA — CONTROLE DE GASTOS ================= */
var ACTIVE_TOKEN_ = '';

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
function authSheet_(name, headers) {
  const ss = book_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setBackground('#151c29').setFontColor('#f9c948').setFontWeight('bold');
  }
  return sh;
}
function usuariosSheet_() {
  return authSheet_('USUARIOS', ['E-mail','Nome','Perfil','Status','Último acesso','Atualizado em','SenhaHash','SenhaSalt','Solicitado em','Aprovado por','Aprovado em']);
}
function sessoesSheet_() {
  return authSheet_('SESSOES', ['TokenHash','Email','ExpiraEm','Revogada','CriadaEm']);
}
function authDate_(v){return v instanceof Date && !isNaN(v) ? Utilities.formatDate(v,Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm') : s_(v);}
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
  const token = String(ACTIVE_TOKEN_ || '');
  if (token.length < 32) throw Error('AUTH_REQUIRED');
  const sh = sessoesSheet_();
  const v = sh.getDataRange().getValues();
  const h = hashToken_(token);
  const agora = Date.now();
  let sessao = null;
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) === h && String(v[i][3]) !== 'SIM' && Number(v[i][2]) > agora) {
      sessao = v[i];
      break;
    }
  }
  if (!sessao) throw Error('AUTH_REQUIRED');
  const email = String(sessao[1]).toLowerCase();
  const rows = usuariosSheet_().getDataRange().getValues().slice(1);
  const r = rows.find(function(x) { return s_(x[0]).toLowerCase() === email; });
  if (!r) throw Error('AUTH_REQUIRED');
  const user = mapUsuario_(r);
  if (user.status !== 'ATIVO') throw Error('AUTH_REQUIRED');
  return user;
}
function requireAdmin_() {
  const user = currentUser_();
  if (user.perfil !== 'ADMIN') throw Error('Seu perfil não permite esta operação.');
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
  if (!ACTIVE_TOKEN_) return { ok: false, authRequired: true };
  try {
    return { ok: true, user: currentUser_() };
  } catch (e) {
    if (String(e && e.message) === 'AUTH_REQUIRED') return { ok: false, authRequired: true };
    throw e;
  }
}

function apiCall(fn, args, token) {
  ACTIVE_TOKEN_ = token == null ? '' : String(token);
  const allowed = {
    getBootstrap: getBootstrap,
    getDadosDashboard: getDadosDashboard,
    getAuditoria: getAuditoria,
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
    excluirUsuario: excluirUsuario,
    addGasto: addGasto,
    editarGasto: editarGasto,
    excluirGasto: excluirGasto,
    ajustarSaldo: ajustarSaldo,
    alterarOrcamento: alterarOrcamento,
    cadastrarOpcao: cadastrarOpcao,
    editarAjuste: editarAjuste,
    excluirAjuste: excluirAjuste
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
  sh_(CFG.audit).appendRow([now, email, 'SOLICITAR CADASTRO', JSON.stringify({ nome: nome, status: 'PENDENTE' })]);
  return { ok: true, message: 'Cadastro realizado. Aguarde a aprovação do administrador.' };
}

function loginUsuario(payload) {
  const p = payload || {};
  const email = s_(p.email).toLowerCase();
  const senha = String(p.senha == null ? '' : p.senha);
  if (!email || !emailValid_(email)) throw Error('Informe um e-mail válido.');
  if (!senha) throw Error('Informe a senha.');
  const cache = CacheService.getScriptCache();
  const failKey = 'gastosfail_' + hashToken_(email);
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
  try { usuariosSheet_().getRange(idx + 2, 5).setValue(new Date()); } catch (e) {}
  if (user.status === 'PENDENTE') throw Error('Seu cadastro ainda está aguardando aprovação.');
  if (user.status === 'RECUSADO') throw Error('Seu cadastro foi recusado.');
  if (user.status === 'BLOQUEADO' || user.status === 'INATIVO') throw Error('Seu usuário está bloqueado.');
  if (user.status !== 'ATIVO') throw Error('Usuário sem acesso ativo.');
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
  sh_(CFG.audit).appendRow([new Date(), user.email, 'ALTERAR PRÓPRIA SENHA', '{}']);
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
  sh_(CFG.audit).appendRow([new Date(), admin.email, 'REDEFINIR SENHA', JSON.stringify({ email: email })]);
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
  sh_(CFG.audit).appendRow([new Date(), admin.email, 'APROVAR CADASTRO', JSON.stringify({ email: email, perfil: perfil })]);
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
  sh_(CFG.audit).appendRow([new Date(), admin.email, 'RECUSAR CADASTRO', JSON.stringify({ email: email })]);
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
  sh_(CFG.audit).appendRow([new Date(), admin.email, 'ALTERAR PERFIL', JSON.stringify({ email: email, perfil: perfil })]);
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
  sh_(CFG.audit).appendRow([new Date(), admin.email, status === 'ATIVO' ? 'REATIVAR USUÁRIO' : 'BLOQUEAR USUÁRIO', JSON.stringify({ email: email })]);
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
  sh_(CFG.audit).appendRow([new Date(), admin.email, 'EXCLUIR USUÁRIO', JSON.stringify({ email: email })]);
  return { ok: true };
}
