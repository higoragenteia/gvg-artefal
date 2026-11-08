/** GVG & ARTEFAL — Controle de Fornecedores (código oficial integrado ao projeto do painel).
 *  O código fica isolado em um namespace próprio para não conflitar com Pedidos/Gastos.
 *  A planilha usada é a cópia de teste GVG_FORNECEDORES_ID.
 */
var GVG_FORNECEDORES_APP_ = (function(){
/**
 * GVG & ARTEFAL — Sistema de Controle de Fornecedores
 * Backend Google Apps Script vinculado à planilha BASE OPERACIONAL.
 * Não apaga fornecedores: desativa. Toda alteração relevante gera histórico.
 */

const CFG = Object.freeze({
  SPREADSHEET_ID: '1f0jl1mN5O0z_Dgy77_FotdYpHP0bEoUF4wEb65cXllk',
  TZ: 'America/Recife',
  VERSION: '2.3.0',
  SHEETS: {
    FORNECEDORES: ['ID','Fornecedor / Empresa','Categoria / Segmento','Contato','Telefone / WhatsApp','E-mail','Website / Catálogo','Condições de pagamento','Observações','Status','Atualizado em','Razão Social','CNPJ','Inscrição Estadual','Endereço','Descontos comerciais','Entrega/Retirada','Prazo de entrega'],
    PRODUTOS: ['ID produto','Descrição do produto / serviço','Categoria','Unidade','Especificação','Status','Observações','Atualizado em','Imagem'],
    COTACOES: ['ID cotação','ID produto','ID fornecedor','Descrição','Quantidade','Unidade','Preço unitário (R$)','Desconto (%)','Frete (R$)','Preço total (R$)','Data da cotação','Validade','Forma pagamento','Prazo entrega','Status','Responsável','Observações','Link da proposta','Motivo da escolha','Vencedor','Atualizado em'],
    HISTORICO_PRECOS: ['ID registro','ID cotação','ID produto','ID fornecedor','Preço anterior (R$)','Preço novo (R$)','Data / Hora','Responsável','Motivo'],
    HISTORICO_ACOES: ['ID evento','Data / Hora','Usuário','Ação','Tabela','ID registro','Descrição anterior','Descrição nova'],
    CONFIGURACOES: ['Chave','Valor','Descrição'],
    USUARIOS: ['E-mail','Nome','Perfil','Status','Último acesso','Atualizado em','SenhaHash','SenhaSalt','Solicitado em','Aprovado por','Aprovado em'],
    SESSOES: ['TokenHash','Email','ExpiraEm','Revogada','CriadaEm'],
    COMPRAS: ['ID compra','Data','ID fornecedor','ID produto','Quantidade','Preço unitário (R$)','Preço total (R$)','Frete (R$)','Responsável','Número do pedido','Número da nota fiscal','Situação da entrega','Observações','ID cotação','Atualizado em']
  },
  QUOTE_STATUS: ['Em elaboração','Aguardando resposta','Recebida','Em análise','Aprovada','Rejeitada','Cancelada'],
  DELIVERY_STATUS: ['Pendente','Em trânsito','Entregue','Atrasada','Cancelada'],
  PROFILES: ['ADMIN','COMPRAS','CONSULTA']
});

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.initialView = (e && e.parameter && e.parameter.view) || '';
  return template
    .evaluate()
    .setTitle('GVG & ARTEFAL | Controle de Fornecedores')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
    .setFaviconUrl('https://higoragenteia.github.io/gvg-fornecedores/icons/apple-touch-icon-v3.png').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('GVG Fornecedores')
      .addItem('Abrir dashboard', 'abrirDashboard')
      .addItem('Criar backup agora', 'criarBackup')
      .addItem('Preparar estrutura', 'setup')
      .addToUi();
  } catch (e) {}
}

function abrirDashboard() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    '<script>window.open(' + JSON.stringify(url || '') + ',"_blank");google.script.host.close();</script>'
  ).setWidth(320).setHeight(80);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abrindo dashboard...');
}

/* ------------------------------------------------------------------ */
/* Estrutura e leitura                                                  */
/* ------------------------------------------------------------------ */

function ss_() {
  const override = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID_OVERRIDE');
  return SpreadsheetApp.openById(override || CFG.SPREADSHEET_ID);
}

function sh_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Aba ausente: ' + name + '. Execute a preparação da estrutura.');
  return sh;
}

function headers_(sh) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const raw = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  while (raw.length && !String(raw[raw.length - 1]).trim()) raw.pop();
  return raw.map(h => String(h).trim());
}

function objects_(name) {
  const sh = sh_(name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = headers_(sh);
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row.some(v => String(v).trim() !== '')) continue;
    const obj = {};
    headers.forEach((h, idx) => { if (h) obj[h] = row[idx]; });
    out.push(obj);
  }
  return out;
}

function writeObject_(name, obj, idHeader, idValue) {
  const sh = sh_(name);
  const headers = headers_(sh);
  if (!headers.length) throw new Error('Cabeçalho ausente em ' + name + '.');
  const idCol = headers.indexOf(idHeader);
  if (idCol < 0) throw new Error('Coluna de ID ausente em ' + name + ': ' + idHeader);
  const values = sh.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]).trim() === String(idValue).trim()) { rowIndex = i + 1; break; }
  }
  const row = headers.map(h => obj[h] === undefined || obj[h] === null ? '' : obj[h]);
  if (rowIndex < 0) rowIndex = Math.max(sh.getLastRow() + 1, 2);
  sh.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
  return rowIndex;
}

function appendObject_(name, obj) {
  const sh = sh_(name);
  const headers = headers_(sh);
  const row = headers.map(h => obj[h] === undefined || obj[h] === null ? '' : obj[h]);
  sh.getRange(sh.getLastRow() + 1, 1, 1, headers.length).setValues([row]);
  return sh.getLastRow();
}

function nextId_(name, prefix, pad) {
  const sh = sh_(name);
  const last = sh.getLastRow();
  let max = 0;
  if (last >= 2) {
    const ids = sh.getRange(2, 1, last - 1, 1).getValues();
    ids.forEach(r => {
      const m = String(r[0]).match(/(\d+)\s*$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
  }
  return prefix + String(max + 1).padStart(pad, '0');
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

function now_() {
  return Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd HH:mm:ss');
}
function today_() {
  return Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd');
}
function str_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}
function safeText_(v, max) {
  let s = v === null || v === undefined ? '' : String(v).trim();
  if (/^[=@]/.test(s)) s = "'" + s;
  return s.slice(0, max || 5000);
}
function num_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  let s = String(v === null || v === undefined ? '' : v).trim();
  if (!s) return 0;
  s = s.replace(/R\$/gi, '').replace(/%/g, '').replace(/\s/g, '');
  if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.indexOf(',') >= 0) {
    s = s.replace(',', '.');
  } else if ((s.match(/\./g) || []).length > 1) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return isFinite(n) ? n : 0;
}
function round2_(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
function dateStr_(v) {
  if (!v) return '';
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v, CFG.TZ, 'yyyy-MM-dd');
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return Utilities.formatDate(d, CFG.TZ, 'yyyy-MM-dd');
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let y = m[3]; if (y.length === 2) y = '20' + y;
    return y + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
  }
  return s;
}
function dateTimeStr_(v) {
  if (!v) return '';
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v, CFG.TZ, 'yyyy-MM-dd HH:mm:ss');
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return Utilities.formatDate(d, CFG.TZ, 'yyyy-MM-dd HH:mm:ss');
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 19).replace('T', ' ');
  return s;
}
function bool_(v) {
  return v === true || /^(sim|s|true|1|x)$/i.test(str_(v));
}
function active_(v) {
  return !/^(inativo|inativa|nao|não|false|0|excluido|excluida)$/i.test(str_(v));
}
function emailValid_(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str_(v));
}
function urlValid_(v) {
  return !v || /^https?:\/\/[^\s]+$/i.test(str_(v));
}
function cnpjDigits_(v) {
  return str_(v).replace(/\D/g, '');
}
function monthKey_(dateStr) {
  const d = dateStr_(dateStr);
  return d ? d.slice(0, 7) : '';
}

/* ------------------------------------------------------------------ */
/* Acesso                                                               */
/* ------------------------------------------------------------------ */

function readConfig_() {
  const out = {};
  objects_('CONFIGURACOES').forEach(o => { out[str_(o['Chave'])] = str_(o['Valor']); });
  return out;
}

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

/* Sessões próprias do app: token aleatório, hash no servidor e validade de 7 dias. */
var ACTIVE_TOKEN_ = '';
var ACTIVE_PANEL_TOKEN_ = '';

function hashToken_(token) {
  return hexBytes_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token)));
}

function sessoesSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName('SESSOES');
  if (!sh) {
    sh = ss.insertSheet('SESSOES');
    sh.getRange(1, 1, 1, CFG.SHEETS.SESSOES.length).setValues([CFG.SHEETS.SESSOES]);
  }
  return sh;
}

function createSession_(user) {
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  const expira = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessoesSheet_().appendRow([hashToken_(token), String(user.email).toLowerCase(), expira, 'NAO', now_()]);
  return token;
}

function revokeSession_(token) {
  if (!token) return;
  const sh = sessoesSheet_();
  const values = sh.getDataRange().getValues();
  const hash = hashToken_(token);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === hash && String(values[i][3]) !== 'SIM') {
      sh.getRange(i + 1, 4).setValue('SIM');
      return;
    }
  }
}

function revokeSessionsForEmail_(email) {
  const alvo = str_(email).toLowerCase();
  if (!alvo) return;
  const sh = sessoesSheet_();
  const values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][1]).toLowerCase() === alvo && String(values[i][3]) !== 'SIM') {
      sh.getRange(i + 1, 4).setValue('SIM');
    }
  }
}

function currentUser_() {
  if (ACTIVE_PANEL_TOKEN_) {
    const a = gvguAcessoPainel_(ACTIVE_PANEL_TOKEN_, 'fornecedores');
    return { email: a.usuario.email || a.usuario.login, nome: a.usuario.nome, perfil: a.nivel === 'GERENCIAR' ? 'ADMIN' : 'CONSULTA', status: 'ATIVO', painelNivel: a.nivel, painel: true };
  }
  if (gvguModuloSsoObrigatorio_()) throw new Error('AUTH_REQUIRED_PAINEL');
  const token = String(ACTIVE_TOKEN_ || '');
  if (token.length < 32) throw new Error('AUTH_REQUIRED');

  const sh = sessoesSheet_();
  const values = sh.getDataRange().getValues();
  const hash = hashToken_(token);
  const agora = Date.now();
  let sessao = null;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === hash && String(values[i][3]) !== 'SIM' && Number(values[i][2]) > agora) {
      sessao = values[i];
      break;
    }
  }
  if (!sessao) throw new Error('AUTH_REQUIRED');

  const email = String(sessao[1]).toLowerCase();
  const obj = objects_('USUARIOS').find(function(r) {
    return str_(r['E-mail']).toLowerCase() === email;
  });
  if (!obj) throw new Error('AUTH_REQUIRED');

  const user = mapUsuario_(obj);
  if (user.status !== 'ATIVO') throw new Error('AUTH_REQUIRED');
  return user;
}

function canWrite_(user) {
  return !!user && String(user.perfil).toUpperCase() === 'ADMIN';
}

function requireRole_(roles) {
  const user = currentUser_();
  if (!canWrite_(user)) {
    throw new Error('Seu perfil (' + user.perfil + ') não permite esta operação.');
  }
  return user;
}

/* Ponto único de entrada do frontend. O token é validado em currentUser_(). */
function apiCall(fn, args, token, painelToken) {
  ACTIVE_TOKEN_ = token == null ? '' : String(token);
  ACTIVE_PANEL_TOKEN_ = painelToken == null ? '' : String(painelToken);
  const allowed = {
    getBootstrap: getBootstrap,
    registrarUsuario: registrarUsuario,
    loginUsuario: loginUsuario,
    logoutUsuario: logoutUsuario,
    alterarMinhaSenha: alterarMinhaSenha,
    redefinirSenhaUsuario: redefinirSenhaUsuario,
    aprovarUsuario: aprovarUsuario,
    recusarUsuario: recusarUsuario,
    alterarPerfilUsuario: alterarPerfilUsuario,
    bloquearUsuario: bloquearUsuario,
    excluirUsuario: excluirUsuario,
    salvarUsuario: salvarUsuario,
    salvarFornecedor: salvarFornecedor,
    desativarFornecedor: desativarFornecedor,
    salvarProduto: salvarProduto,
    excluirProduto: excluirProduto,
    salvarCotacao: salvarCotacao,
    excluirCotacao: excluirCotacao,
    alterarPreco: alterarPreco,
    salvarCompra: salvarCompra,
    salvarConfiguracao: salvarConfiguracao,
    criarBackup: criarBackup,
    selfTest: selfTest,
    getRelatorios: getRelatorios,
    getProductImage: getProductImage
  };
  if (!Object.prototype.hasOwnProperty.call(allowed, fn)) throw new Error('Função inválida.');
  const list = Array.isArray(args) ? args : [];
  return allowed[fn].apply(null, list);
}

function touchUser_(user) {
  try {
    const cache = CacheService.getUserCache();
    if (cache.get('lastAccess')) return;
    const obj = objects_('USUARIOS').find(r => str_(r['E-mail']).toLowerCase() === user.email.toLowerCase());
    if (!obj) return;
    obj['Último acesso'] = now_();
    writeObject_('USUARIOS', obj, 'E-mail', user.email);
    cache.put('lastAccess', '1', 300);
  } catch (e) {}
}

function registrarUsuario(payload) {
  ensureSetup_();
  const p = payload || {};
  const email = str_(p.email).toLowerCase();
  const nome = safeText_(p.nome, 200);
  const senha = String(p.senha == null ? '' : p.senha);
  const confirmar = String(p.confirmar == null ? '' : p.confirmar);
  if (!email || !emailValid_(email)) throw new Error('Informe um e-mail válido.');
  if (nome.split(/\s+/).filter(Boolean).length < 2) throw new Error('Informe nome e sobrenome.');
  if (!senha) throw new Error('Informe uma senha.');
  if (senha !== confirmar) throw new Error('As senhas não conferem.');

  const all = objects_('USUARIOS');
  if (all.some(function(r) { return str_(r['E-mail']).toLowerCase() === email; })) {
    throw new Error('Este e-mail já está cadastrado no sistema.');
  }

  const salt = Utilities.getUuid().replace(/-/g, '');
  appendObject_('USUARIOS', {
    'E-mail': email,
    'Nome': nome,
    'Perfil': 'CONSULTA',
    'Status': 'PENDENTE',
    'Último acesso': '',
    'Atualizado em': now_(),
    'SenhaHash': hashPassword_(senha, salt),
    'SenhaSalt': salt,
    'Solicitado em': now_(),
    'Aprovado por': '',
    'Aprovado em': ''
  });
  logAction_({ email: email, nome: nome }, 'Solicitar cadastro', 'USUARIOS', email, {}, { nome: nome, status: 'PENDENTE' });
  return { ok: true, message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o sistema.' };
}

function loginUsuario(payload) {
  ensureSetup_();
  if (gvguModuloSsoObrigatorio_()) throw new Error('ACESSE_PELO_PAINEL: acesse o módulo Fornecedores pelo Painel GVG&ARTEFAL.');
  const p = payload || {};
  const email = str_(p.email).toLowerCase();
  const senha = String(p.senha == null ? '' : p.senha);
  if (!email || !emailValid_(email)) throw new Error('Informe um e-mail válido.');
  if (!senha) throw new Error('Informe a senha.');

  const cache = CacheService.getScriptCache();
  const failKey = 'loginfail_' + hashToken_(email);
  const falhas = Number(cache.get(failKey) || 0);
  if (falhas >= 10) throw new Error('Muitas tentativas. Aguarde 15 minutos e tente novamente.');

  const obj = objects_('USUARIOS').find(function(r) { return str_(r['E-mail']).toLowerCase() === email; });
  const hash = obj ? str_(obj['SenhaHash']) : '';
  const salt = obj ? str_(obj['SenhaSalt']) : '';
  const senhaOk = !!obj && !!hash && verifyPassword_(senha, salt, hash);
  if (!senhaOk) {
    cache.put(failKey, String(falhas + 1), 900);
    throw new Error('E-mail ou senha inválidos.');
  }
  cache.remove(failKey);

  const status = str_(obj['Status']).toUpperCase();
  if (status === 'PENDENTE') throw new Error('Seu cadastro ainda está aguardando aprovação.');
  if (status === 'RECUSADO') throw new Error('Seu cadastro foi recusado.');
  if (status === 'BLOQUEADO' || status === 'INATIVO') throw new Error('Seu usuário está bloqueado.');
  if (status !== 'ATIVO') throw new Error('Usuário sem acesso ativo.');

  const user = mapUsuario_(obj);
  const token = createSession_(user);
  logAction_({ email: user.email, nome: user.nome }, 'Login', 'USUARIOS', user.email, {}, {});
  return { ok: true, token: token, user: user };
}

function logoutUsuario(payload) {
  const token = ACTIVE_TOKEN_ || (payload && payload.token) || '';
  revokeSession_(token);
  return { ok: true };
}

function alterarMinhaSenha(payload) {
  const user = currentUser_();
  const p = payload || {};
  const atual = String(p.atual == null ? '' : p.atual);
  const nova = String(p.nova == null ? '' : p.nova);
  const confirmar = String(p.confirmar == null ? '' : p.confirmar);
  if (!nova) throw new Error('Informe a nova senha.');
  if (nova !== confirmar) throw new Error('As senhas não conferem.');
  const obj = adminUserObject_(user.email);
  const hash = str_(obj['SenhaHash']);
  if (hash && !verifyPassword_(atual, str_(obj['SenhaSalt']), hash)) throw new Error('Senha atual incorreta.');
  const salt = Utilities.getUuid().replace(/-/g, '');
  obj['SenhaHash'] = hashPassword_(nova, salt);
  obj['SenhaSalt'] = salt;
  obj['Atualizado em'] = now_();
  writeObject_('USUARIOS', obj, 'E-mail', user.email);
  revokeSessionsForEmail_(user.email);
  const token = createSession_(mapUsuario_(obj));
  logAction_(user, 'Alterar própria senha', 'USUARIOS', user.email, {}, {});
  return { ok: true, token: token };
}

function redefinirSenhaUsuario(payload) {
  const admin = requireRole_(['ADMIN']);
  const p = payload || {};
  const email = str_(p.email).toLowerCase();
  const nova = String(p.nova == null ? (p.senha == null ? '' : p.senha) : p.nova);
  const confirmar = String(p.confirmar == null ? nova : p.confirmar);
  if (!email) throw new Error('Usuário não informado.');
  if (!nova) throw new Error('Informe a nova senha.');
  if (nova !== confirmar) throw new Error('As senhas não conferem.');
  const obj = adminUserObject_(email);
  const salt = Utilities.getUuid().replace(/-/g, '');
  obj['SenhaHash'] = hashPassword_(nova, salt);
  obj['SenhaSalt'] = salt;
  obj['Atualizado em'] = now_();
  writeObject_('USUARIOS', obj, 'E-mail', email);
  revokeSessionsForEmail_(email);
  logAction_(admin, 'Redefinir senha', 'USUARIOS', email, {}, {});
  return { ok: true };
}

function adminUserObject_(email) {
  const obj = objects_('USUARIOS').find(function(r) { return str_(r['E-mail']).toLowerCase() === str_(email).toLowerCase(); });
  if (!obj) throw new Error('Usuário não encontrado.');
  return obj;
}

function assertNotLastAdmin_(target, action) {
  if (str_(target['Perfil']).toUpperCase() !== 'ADMIN' || str_(target['Status']).toUpperCase() !== 'ATIVO') return;
  const activeAdmins = objects_('USUARIOS').map(mapUsuario_).filter(function(u) {
    return u.perfil === 'ADMIN' && u.status === 'ATIVO';
  });
  if (activeAdmins.length <= 1) throw new Error('Não é permitido ' + action + ' o último administrador ativo.');
}

function aprovarUsuario(payload) {
  const admin = requireRole_(['ADMIN']);
  const p = payload || {};
  const email = str_(p.email).toLowerCase();
  const obj = adminUserObject_(email);
  if (!str_(obj['SenhaHash'])) throw new Error('Usuário sem senha cadastrada.');
  const perfil = str_(p.perfil || 'CONSULTA').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CONSULTA';
  obj['Perfil'] = perfil;
  obj['Status'] = 'ATIVO';
  obj['Aprovado por'] = admin.email;
  obj['Aprovado em'] = now_();
  obj['Atualizado em'] = now_();
  writeObject_('USUARIOS', obj, 'E-mail', email);
  logAction_(admin, 'Aprovar cadastro', 'USUARIOS', email, {}, { perfil: perfil, status: 'ATIVO' });
  return { ok: true, item: mapUsuario_(obj) };
}

function recusarUsuario(payload) {
  const admin = requireRole_(['ADMIN']);
  const p = payload || {};
  const email = str_(p.email).toLowerCase();
  const obj = adminUserObject_(email);
  if (email === admin.email.toLowerCase()) throw new Error('Você não pode recusar seu próprio usuário.');
  obj['Status'] = 'RECUSADO';
  obj['Aprovado por'] = admin.email;
  obj['Aprovado em'] = now_();
  obj['Atualizado em'] = now_();
  writeObject_('USUARIOS', obj, 'E-mail', email);
  revokeSessionsForEmail_(email);
  logAction_(admin, 'Recusar cadastro', 'USUARIOS', email, {}, { status: 'RECUSADO' });
  return { ok: true, item: mapUsuario_(obj) };
}

function alterarPerfilUsuario(payload) {
  const admin = requireRole_(['ADMIN']);
  const p = payload || {};
  const email = str_(p.email).toLowerCase();
  const obj = adminUserObject_(email);
  const perfil = str_(p.perfil || '').toUpperCase();
  if (['ADMIN', 'CONSULTA'].indexOf(perfil) < 0) throw new Error('Perfil inválido.');
  if (email === admin.email.toLowerCase() && perfil !== 'ADMIN') throw new Error('Você não pode remover seu próprio acesso administrativo.');
  assertNotLastAdmin_(obj, 'rebaixar');
  const before = mapUsuario_(obj);
  obj['Perfil'] = perfil;
  obj['Atualizado em'] = now_();
  writeObject_('USUARIOS', obj, 'E-mail', email);
  logAction_(admin, 'Alterar permissão', 'USUARIOS', email, before, mapUsuario_(obj));
  return { ok: true, item: mapUsuario_(obj) };
}

function bloquearUsuario(payload) {
  const admin = requireRole_(['ADMIN']);
  const p = payload || {};
  const email = str_(p.email).toLowerCase();
  const obj = adminUserObject_(email);
  if (email === admin.email.toLowerCase()) throw new Error('Você não pode bloquear seu próprio usuário.');
  const status = str_(p.status || 'BLOQUEADO').toUpperCase() === 'ATIVO' ? 'ATIVO' : 'BLOQUEADO';
  if (status === 'BLOQUEADO') assertNotLastAdmin_(obj, 'bloquear');
  const before = mapUsuario_(obj);
  obj['Status'] = status;
  obj['Atualizado em'] = now_();
  writeObject_('USUARIOS', obj, 'E-mail', email);
  if (status === 'BLOQUEADO') revokeSessionsForEmail_(email);
  logAction_(admin, status === 'ATIVO' ? 'Reativar usuário' : 'Bloquear usuário', 'USUARIOS', email, before, mapUsuario_(obj));
  return { ok: true, item: mapUsuario_(obj) };
}

function excluirUsuario(payload) {
  const admin = requireRole_(['ADMIN']);
  const email = str_((payload || {}).email).toLowerCase();
  const obj = adminUserObject_(email);
  if (email === admin.email.toLowerCase()) throw new Error('Você não pode excluir seu próprio usuário.');
  assertNotLastAdmin_(obj, 'excluir');
  const before = mapUsuario_(obj);
  const removed = deleteRowById_('USUARIOS', 'E-mail', email);
  if (!removed) throw new Error('Não foi possível excluir o usuário.');
  revokeSessionsForEmail_(email);
  logAction_(admin, 'Excluir usuário', 'USUARIOS', email, before, {});
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Mapeadores                                                           */
/* ------------------------------------------------------------------ */

function mapFornecedor_(o) {
  return {
    id: str_(o['ID']),
    nome: str_(o['Fornecedor / Empresa']),
    categoria: str_(o['Categoria / Segmento']),
    contato: str_(o['Contato']),
    telefone: str_(o['Telefone / WhatsApp']),
    email: str_(o['E-mail']),
    site: str_(o['Website / Catálogo']),
    pagamento: str_(o['Condições de pagamento']),
    observacoes: str_(o['Observações']),
    status: str_(o['Status']) || 'Ativo',
    atualizadoEm: dateTimeStr_(o['Atualizado em']),
    razaoSocial: str_(o['Razão Social']),
    cnpj: str_(o['CNPJ']),
    inscricaoEstadual: str_(o['Inscrição Estadual']),
    endereco: str_(o['Endereço']),
    descontos: str_(o['Descontos comerciais']),
    entrega: str_(o['Entrega/Retirada']),
    prazoEntrega: str_(o['Prazo de entrega'])
  };
}
function mapProduto_(o) {
  return {
    id: str_(o['ID produto']),
    nome: str_(o['Descrição do produto / serviço']),
    categoria: str_(o['Categoria']),
    unidade: str_(o['Unidade']),
    especificacao: str_(o['Especificação']),
    status: str_(o['Status']) || 'Ativo',
    observacoes: str_(o['Observações']),
    atualizadoEm: dateTimeStr_(o['Atualizado em']),
    imagem: str_(o['Imagem'])
  };
}
function mapCotacao_(o) {
  return {
    id: str_(o['ID cotação']),
    produtoId: str_(o['ID produto']),
    fornecedorId: str_(o['ID fornecedor']),
    descricao: str_(o['Descrição']),
    quantidade: num_(o['Quantidade']),
    unidade: str_(o['Unidade']),
    precoUnitario: num_(o['Preço unitário (R$)']),
    desconto: num_(o['Desconto (%)']),
    frete: num_(o['Frete (R$)']),
    precoTotal: num_(o['Preço total (R$)']),
    data: dateStr_(o['Data da cotação']),
    validade: dateStr_(o['Validade']),
    formaPagamento: str_(o['Forma pagamento']),
    prazoEntrega: str_(o['Prazo entrega']),
    status: str_(o['Status']) || 'Em elaboração',
    responsavel: str_(o['Responsável']),
    observacoes: str_(o['Observações']),
    linkProposta: str_(o['Link da proposta']),
    motivoEscolha: str_(o['Motivo da escolha']),
    vencedor: bool_(o['Vencedor']),
    atualizadoEm: dateTimeStr_(o['Atualizado em'])
  };
}
function mapHistoricoPreco_(o) {
  return {
    id: str_(o['ID registro']),
    cotacaoId: str_(o['ID cotação']),
    produtoId: str_(o['ID produto']),
    fornecedorId: str_(o['ID fornecedor']),
    precoAnterior: num_(o['Preço anterior (R$)']),
    precoNovo: num_(o['Preço novo (R$)']),
    dataHora: dateTimeStr_(o['Data / Hora']),
    responsavel: str_(o['Responsável']),
    motivo: str_(o['Motivo'])
  };
}
function mapEvento_(o) {
  return {
    id: str_(o['ID evento']),
    dataHora: dateTimeStr_(o['Data / Hora']),
    usuario: str_(o['Usuário']),
    acao: str_(o['Ação']),
    tabela: str_(o['Tabela']),
    registroId: str_(o['ID registro']),
    antes: str_(o['Descrição anterior']),
    depois: str_(o['Descrição nova'])
  };
}
function mapUsuario_(o) {
  return {
    email: str_(o['E-mail']),
    nome: str_(o['Nome']),
    perfil: (str_(o['Perfil']) || 'CONSULTA').toUpperCase(),
    status: (str_(o['Status']) || 'ATIVO').toUpperCase(),
    ultimoAcesso: dateTimeStr_(o['Último acesso']),
    atualizadoEm: dateTimeStr_(o['Atualizado em']),
    temSenha: !!str_(o['SenhaHash']),
    solicitadoEm: dateTimeStr_(o['Solicitado em']),
    aprovadoPor: str_(o['Aprovado por']),
    aprovadoEm: dateTimeStr_(o['Aprovado em'])
  };
}
function mapCompra_(o) {
  return {
    id: str_(o['ID compra']),
    data: dateStr_(o['Data']),
    fornecedorId: str_(o['ID fornecedor']),
    produtoId: str_(o['ID produto']),
    quantidade: num_(o['Quantidade']),
    precoUnitario: num_(o['Preço unitário (R$)']),
    precoTotal: num_(o['Preço total (R$)']),
    frete: num_(o['Frete (R$)']),
    responsavel: str_(o['Responsável']),
    pedido: str_(o['Número do pedido']),
    notaFiscal: str_(o['Número da nota fiscal']),
    situacao: str_(o['Situação da entrega']) || 'Pendente',
    observacoes: str_(o['Observações']),
    cotacaoId: str_(o['ID cotação']),
    atualizadoEm: dateTimeStr_(o['Atualizado em'])
  };
}

/* ------------------------------------------------------------------ */
/* Bootstrap e indicadores                                              */
/* ------------------------------------------------------------------ */

function ensureSetup_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SETUP_VERSION') === CFG.VERSION) return;
  setup();
}

function getBootstrap() {
  ensureSetup_();
  if (!ACTIVE_TOKEN_ && !ACTIVE_PANEL_TOKEN_) {
    return { ok: false, authRequired: true, painelRequired: gvguModuloSsoObrigatorio_(), auth: { state: 'login' } };
  }
  let user;
  try {
    user = currentUser_();
  } catch (e) {
    const msg=String(e && e.message);
    if (msg === 'AUTH_REQUIRED' || msg === 'AUTH_REQUIRED_PAINEL') {
      return { ok: false, authRequired: true, painelRequired: msg === 'AUTH_REQUIRED_PAINEL' || gvguModuloSsoObrigatorio_(), auth: { state: 'login' } };
    }
    throw e;
  }
  touchUser_(user);
  const data = {
    fornecedores: objects_('FORNECEDORES').map(mapFornecedor_).filter(x => x.id),
    produtos: objects_('PRODUTOS').map(mapProduto_).filter(x => x.id),
    cotacoes: objects_('COTACOES').map(mapCotacao_).filter(x => x.id),
    historicoPrecos: objects_('HISTORICO_PRECOS').map(mapHistoricoPreco_).filter(x => x.id),
    historicoAcoes: objects_('HISTORICO_ACOES').map(mapEvento_).filter(x => x.id),
    compras: objects_('COMPRAS').map(mapCompra_).filter(x => x.id),
    configuracoes: objects_('CONFIGURACOES').map(o => ({ chave: str_(o['Chave']), valor: str_(o['Valor']), descricao: str_(o['Descrição']) })),
    usuarios: user.perfil === 'ADMIN' ? objects_('USUARIOS').map(mapUsuario_) : []
  };
  return {
    ok: true,
    user: user,
    canEdit: user.perfil === 'ADMIN',
    isAdmin: user.perfil === 'ADMIN',
    data: data,
    dashboard: buildDashboard_(data),
    meta: {
      timezone: CFG.TZ,
      version: CFG.VERSION,
      serverTime: now_(),
      spreadsheetId: CFG.SPREADSHEET_ID,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + CFG.SPREADSHEET_ID + '/edit'
    }
  };
}

function quoteTotal_(q) {
  const qty = num_(q.quantidade);
  const unit = num_(q.precoUnitario);
  const disc = Math.min(Math.max(num_(q.desconto), 0), 100);
  const freight = num_(q.frete);
  return round2_(qty * unit * (1 - disc / 100) + freight);
}

function latestOffers_(cotacoes) {
  const map = {};
  cotacoes
    .filter(q => ['CANCELADA', 'REJEITADA'].indexOf(String(q.status || '').toUpperCase()) < 0)
    .sort((a, b) => {
      const da = (a.data || '') + ' ' + (a.atualizadoEm || '');
      const db = (b.data || '') + ' ' + (b.atualizadoEm || '');
      return da.localeCompare(db);
    })
    .forEach(q => {
      const key = q.produtoId + '|' + q.fornecedorId;
      map[key] = q;
    });
  return Object.keys(map).map(k => map[k]).map(q => Object.assign({}, q, { total: quoteTotal_(q) }));
}

function savings_(cotacoes) {
  const offers = latestOffers_(cotacoes);
  const byProduct = {};
  offers.forEach(q => {
    if (!byProduct[q.produtoId]) byProduct[q.produtoId] = [];
    byProduct[q.produtoId].push(q);
  });
  let total = 0;
  const opps = [];
  Object.keys(byProduct).forEach(pid => {
    const list = byProduct[pid];
    if (list.length < 2) return;
    const totals = list.map(x => x.total);
    const min = Math.min.apply(null, totals);
    const max = Math.max.apply(null, totals);
    const eco = round2_(max - min);
    total += eco;
    const best = list.find(x => x.total === min);
    opps.push({
      produtoId: pid,
      fornecedorId: best ? best.fornecedorId : '',
      cotacaoId: best ? best.id : '',
      totalMin: min,
      totalMax: max,
      economia: eco,
      ofertas: list.length
    });
  });
  return { total: round2_(total), opps: opps.sort((a, b) => b.economia - a.economia) };
}

function buildDashboard_(data) {
  const suppliers = data.fornecedores || [];
  const products = data.produtos || [];
  const quotes = data.cotacoes || [];
  const purchases = data.compras || [];
  const events = data.historicoAcoes || [];
  const activeSuppliers = suppliers.filter(s => active_(s.status));
  const activeProducts = products.filter(p => active_(p.status));
  const visibleProducts = products.filter(p => String(p.status).toUpperCase().indexOf('EXCLU') < 0);
  const byCat = {};
  activeSuppliers.forEach(s => { const k = s.categoria || 'Sem categoria'; byCat[k] = (byCat[k] || 0) + 1; });
  const byStatus = {};
  quotes.forEach(q => { const k = q.status || 'Em elaboração'; byStatus[k] = (byStatus[k] || 0) + 1; });
  const sav = savings_(quotes);
  const prodMap = {};
  products.forEach(p => { prodMap[p.id] = p.nome; });
  const fornMap = {};
  suppliers.forEach(f => { fornMap[f.id] = f.nome; });
  const opps = sav.opps.slice(0, 6).map(o => Object.assign({}, o, {
    produtoNome: prodMap[o.produtoId] || o.produtoId,
    fornecedorNome: fornMap[o.fornecedorId] || o.fornecedorId
  }));
  const lastUpdate = [].concat(
    suppliers.map(x => x.atualizadoEm),
    products.map(x => x.atualizadoEm),
    quotes.map(x => x.atualizadoEm),
    purchases.map(x => x.atualizadoEm)
  ).filter(Boolean).sort().pop() || '';
  return {
    totalFornecedores: suppliers.length,
    fornecedoresAtivos: activeSuppliers.length,
    totalProdutos: visibleProducts.length,
    produtosAtivos: activeProducts.length,
    totalCotacoes: quotes.length,
    totalCompras: purchases.length,
    valorCompras: round2_(purchases.filter(p => String(p.situacao).toUpperCase() !== 'CANCELADA').reduce((s, p) => s + num_(p.precoTotal), 0)),
    economia: sav.total,
    fornecedoresPorCategoria: byCat,
    cotacoesPorStatus: byStatus,
    oportunidades: opps,
    ultimasAlteracoes: events.slice(-8).reverse(),
    ultimaAtualizacao: lastUpdate
  };
}

function getComparacao(produtoId) {
  currentUser_();
  const products = objects_('PRODUTOS').map(mapProduto_);
  const suppliers = objects_('FORNECEDORES').map(mapFornecedor_);
  const quotes = objects_('COTACOES').map(mapCotacao_);
  const product = products.find(p => p.id === produtoId);
  if (!product) throw new Error('Produto não encontrado.');
  const offers = latestOffers_(quotes.filter(q => q.produtoId === produtoId)).map(q => {
    const f = suppliers.find(x => x.id === q.fornecedorId);
    return Object.assign({}, q, {
      fornecedorNome: f ? f.nome : q.fornecedorId,
      total: quoteTotal_(q)
    });
  }).sort((a, b) => a.total - b.total);
  const max = offers.length ? Math.max.apply(null, offers.map(o => o.total)) : 0;
  const min = offers.length ? Math.min.apply(null, offers.map(o => o.total)) : 0;
  return {
    ok: true,
    produto: product,
    ofertas: offers,
    melhorId: offers.length ? offers[0].id : '',
    economia: round2_(max - min),
    totalMax: max,
    totalMin: min
  };
}

function getRelatorios(filtros) {
  currentUser_();
  const f = filtros || {};
  const start = dateStr_(f.inicio);
  const end = dateStr_(f.fim);
  const supplierId = str_(f.fornecedorId);
  const category = str_(f.categoria);
  const products = objects_('PRODUTOS').map(mapProduto_);
  const suppliers = objects_('FORNECEDORES').map(mapFornecedor_);
  const prodMap = {}; products.forEach(p => prodMap[p.id] = p);
  const fornMap = {}; suppliers.forEach(s => fornMap[s.id] = s);
  const inRange = d => {
    const x = dateStr_(d);
    if (start && (!x || x < start)) return false;
    if (end && (!x || x > end)) return false;
    return true;
  };
  const quotes = objects_('COTACOES').map(mapCotacao_).filter(q => {
    if (!inRange(q.data)) return false;
    if (supplierId && q.fornecedorId !== supplierId) return false;
    if (category && (!prodMap[q.produtoId] || prodMap[q.produtoId].categoria !== category)) return false;
    return true;
  });
  const purchases = objects_('COMPRAS').map(mapCompra_).filter(p => {
    if (!inRange(p.data)) return false;
    if (supplierId && p.fornecedorId !== supplierId) return false;
    if (category && (!prodMap[p.produtoId] || prodMap[p.produtoId].categoria !== category)) return false;
    return true;
  });
  const bySupplier = {};
  quotes.filter(q => String(q.status).toUpperCase() !== 'CANCELADA').forEach(q => {
    const k = q.fornecedorId || 'Sem fornecedor';
    if (!bySupplier[k]) bySupplier[k] = { id: k, nome: fornMap[k] ? fornMap[k].nome : k, total: 0, quantidade: 0 };
    bySupplier[k].total += quoteTotal_(q);
    bySupplier[k].quantidade++;
  });
  const byProduct = {};
  quotes.filter(q => String(q.status).toUpperCase() !== 'CANCELADA').forEach(q => {
    const k = q.produtoId || 'Sem produto';
    if (!byProduct[k]) byProduct[k] = { id: k, nome: prodMap[k] ? prodMap[k].nome : k, total: 0, quantidade: 0 };
    byProduct[k].total += quoteTotal_(q);
    byProduct[k].quantidade++;
  });
  const series = [];
  const base = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const key = Utilities.formatDate(d, CFG.TZ, 'yyyy-MM');
    const qs = quotes.filter(q => monthKey_(q.data) === key);
    const ps = purchases.filter(p => monthKey_(p.data) === key);
    series.push({
      mes: Utilities.formatDate(d, CFG.TZ, 'MM/yyyy'),
      cotacoes: qs.length,
      valorCotacoes: round2_(qs.reduce((s, q) => s + quoteTotal_(q), 0)),
      compras: ps.length,
      valorCompras: round2_(ps.reduce((s, p) => s + num_(p.precoTotal), 0))
    });
  }
  const status = {};
  quotes.forEach(q => { status[q.status] = (status[q.status] || 0) + 1; });
  return {
    ok: true,
    filtros: { inicio: start, fim: end, fornecedorId: supplierId, categoria: category },
    totais: {
      cotacoes: quotes.length,
      valorCotacoes: round2_(quotes.filter(q => String(q.status).toUpperCase() !== 'CANCELADA').reduce((s, q) => s + quoteTotal_(q), 0)),
      valorAprovado: round2_(quotes.filter(q => String(q.status).toUpperCase() === 'APROVADA').reduce((s, q) => s + quoteTotal_(q), 0)),
      compras: purchases.length,
      valorCompras: round2_(purchases.filter(p => String(p.situacao).toUpperCase() !== 'CANCELADA').reduce((s, p) => s + num_(p.precoTotal), 0)),
      economia: savings_(quotes).total
    },
    porStatus: status,
    topFornecedores: Object.keys(bySupplier).map(k => bySupplier[k]).sort((a, b) => b.total - a.total).slice(0, 8),
    topProdutos: Object.keys(byProduct).map(k => byProduct[k]).sort((a, b) => b.total - a.total).slice(0, 8),
    serieMensal: series
  };
}

/* ------------------------------------------------------------------ */
/* Escritas                                                             */
/* ------------------------------------------------------------------ */

function logAction_(user, action, table, recordId, before, after) {
  try {
    appendObject_('HISTORICO_ACOES', {
      'ID evento': nextId_('HISTORICO_ACOES', 'EVT-', 4),
      'Data / Hora': now_(),
      'Usuário': user.email,
      'Ação': action,
      'Tabela': table,
      'ID registro': recordId || '',
      'Descrição anterior': JSON.stringify(before || {}).slice(0, 4000),
      'Descrição nova': JSON.stringify(after || {}).slice(0, 4000)
    });
  } catch (e) {}
}

function salvarFornecedor(payload) {
  const user = requireRole_(['ADMIN']);
  const p = payload || {};
  const all = objects_('FORNECEDORES').map(mapFornecedor_);
  const id = str_(p.id);
  const existing = id ? all.find(x => x.id === id) : null;
  if (id && !existing) throw new Error('Fornecedor não encontrado.');
  const nome = safeText_(p.nome, 200);
  if (!nome) throw new Error('Informe o nome do fornecedor.');
  const email = safeText_(p.email, 200);
  if (email && !emailValid_(email)) throw new Error('E-mail inválido.');
  const site = safeText_(p.site, 500);
  if (!urlValid_(site)) throw new Error('Website deve começar com http:// ou https://.');
  const cnpj = cnpjDigits_(p.cnpj);
  if (cnpj && cnpj.length !== 14) throw new Error('CNPJ deve ter 14 dígitos.');
  if (cnpj && all.some(x => x.id !== id && cnpjDigits_(x.cnpj) === cnpj)) throw new Error('Já existe fornecedor com este CNPJ.');
  const newId = id || nextId_('FORNECEDORES', 'FOR-', 3);
  const row = {
    'ID': newId,
    'Fornecedor / Empresa': nome,
    'Categoria / Segmento': safeText_(p.categoria, 200),
    'Contato': safeText_(p.contato, 200),
    'Telefone / WhatsApp': safeText_(p.telefone, 100),
    'E-mail': email,
    'Website / Catálogo': site,
    'Condições de pagamento': safeText_(p.pagamento, 300),
    'Observações': safeText_(p.observacoes, 4000),
    'Status': p.status ? safeText_(p.status, 30) : (existing ? existing.status : 'Ativo'),
    'Atualizado em': now_(),
    'Razão Social': safeText_(p.razaoSocial, 300),
    'CNPJ': cnpj,
    'Inscrição Estadual': safeText_(p.inscricaoEstadual, 100),
    'Endereço': safeText_(p.endereco, 500),
    'Descontos comerciais': safeText_(p.descontos, 300),
    'Entrega/Retirada': safeText_(p.entrega, 100),
    'Prazo de entrega': safeText_(p.prazoEntrega, 100)
  };
  writeObject_('FORNECEDORES', row, 'ID', newId);
  logAction_(user, existing ? 'Editar' : 'Criar', 'FORNECEDORES', newId, existing || {}, row);
  return { ok: true, item: mapFornecedor_(row) };
}

function desativarFornecedor(id) {
  const user = requireRole_(['ADMIN']);
  const obj = objects_('FORNECEDORES').find(x => str_(x['ID']) === str_(id));
  if (!obj) throw new Error('Fornecedor não encontrado.');
  const before = mapFornecedor_(obj);
  obj['Status'] = before.status === 'Inativo' ? 'Ativo' : 'Inativo';
  obj['Atualizado em'] = now_();
  writeObject_('FORNECEDORES', obj, 'ID', id);
  logAction_(user, obj['Status'] === 'Inativo' ? 'Desativar' : 'Reativar', 'FORNECEDORES', id, before, mapFornecedor_(obj));
  return { ok: true, item: mapFornecedor_(obj) };
}

function deleteRowById_(sheetName, idHeader, idValue) {
  const sh = sh_(sheetName);
  const headers = headers_(sh);
  const idCol = headers.indexOf(idHeader);
  if (idCol < 0) throw new Error('Coluna de ID ausente em ' + sheetName + '.');
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (str_(values[i][idCol]) === str_(idValue)) {
      sh.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function imageFolder_() {
  const name = 'GVG Fornecedores - Imagens';
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('IMAGE_FOLDER_ID');
  if (saved) {
    try { return DriveApp.getFolderById(saved); } catch (e) {}
  }
  try {
    const folder = DriveApp.createFolder(name);
    props.setProperty('IMAGE_FOLDER_ID', folder.getId());
    return folder;
  } catch (e) {
    // A conta pode não ter concedido acesso amplo ao Drive. Neste caso,
    // o arquivo é criado na raiz e compartilhado apenas para leitura por link.
    return null;
  }
}

function deleteDriveFile_(ref) {
  const s = str_(ref);
  if (!/^drive:[\w-]+$/.test(s)) return;
  try { DriveApp.getFileById(s.slice(6)).setTrashed(true); } catch (e) {}
}

function uploadProductImage(payload) {
  requireRole_(['ADMIN']);
  const p = payload || {};
  let raw = str_(p.base64);
  const mime = str_(p.mimeType) || 'image/jpeg';
  if (['image/jpeg', 'image/png', 'image/webp'].indexOf(mime) < 0) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  raw = raw.replace(/^data:[^;]+;base64,/, '');
  if (!raw) throw new Error('Imagem vazia.');
  if (raw.length > 9 * 1024 * 1024) throw new Error('Imagem muito grande. Use uma imagem menor que 6 MB.');
  const bytes = Utilities.base64Decode(raw);
  if (bytes.length > 6 * 1024 * 1024) throw new Error('Imagem muito grande. Use uma imagem menor que 6 MB.');
  const extension = mime.indexOf('png') >= 0 ? 'png' : mime.indexOf('webp') >= 0 ? 'webp' : 'jpg';
  const blob = Utilities.newBlob(bytes, mime, 'produto_' + Date.now() + '_' + Utilities.getUuid().slice(0, 8) + '.' + extension);
  const folder = imageFolder_();
  const file = folder ? folder.createFile(blob) : DriveApp.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  return { ok: true, ref: 'drive:' + file.getId(), id: file.getId(), url: file.getUrl() };
}

function getProductImage(ref) {
  currentUser_();
  const s = str_(ref);
  if (/^https?:\/\//i.test(s)) return { ok: true, src: s };
  if (/^data:image\//i.test(s)) return { ok: true, src: s };
  if (!/^drive:[\w-]+$/.test(s)) throw new Error('Imagem inválida.');
  const file = DriveApp.getFileById(s.slice(6));
  const blob = file.getBlob();
  if (blob.getBytes().length > 8 * 1024 * 1024) throw new Error('Imagem muito grande para exibir.');
  return { ok: true, src: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
}

function excluirProduto(id) {
  const user = requireRole_(['ADMIN']);
  const all = objects_('PRODUTOS').map(mapProduto_);
  const product = all.find(x => x.id === str_(id));
  if (!product) throw new Error('Produto não encontrado.');
  if (String(product.status).toUpperCase() === 'EXCLUÍDO') throw new Error('Este produto já está excluído.');
  const quotes = objects_('COTACOES').filter(x => str_(x['ID produto']) === product.id);
  const purchases = objects_('COMPRAS').filter(x => str_(x['ID produto']) === product.id);
  const history = objects_('HISTORICO_PRECOS').filter(x => str_(x['ID produto']) === product.id);
  const links = { cotacoes: quotes.length, compras: purchases.length, historico: history.length };
  if (quotes.length || purchases.length || history.length) {
    const obj = objects_('PRODUTOS').find(x => str_(x['ID produto']) === product.id);
    obj['Status'] = 'Excluído';
    obj['Atualizado em'] = now_();
    writeObject_('PRODUTOS', obj, 'ID produto', product.id);
    logAction_(user, 'Excluir logicamente', 'PRODUTOS', product.id, product, { status: 'Excluído', vinculos: links });
    return { ok: true, modo: 'logico', item: mapProduto_(obj), vinculos: links, message: 'Produto com vínculos históricos: foi ocultado e preservado para manter o histórico.' };
  }
  const removed = deleteRowById_('PRODUTOS', 'ID produto', product.id);
  if (!removed) throw new Error('Não foi possível localizar a linha do produto.');
  deleteDriveFile_(product.imagem);
  logAction_(user, 'Excluir', 'PRODUTOS', product.id, product, {});
  return { ok: true, modo: 'fisico', item: product, vinculos: links, message: 'Produto excluído da planilha.' };
}

function salvarProduto(payload) {
  const user = requireRole_(['ADMIN']);
  const p = payload || {};
  const all = objects_('PRODUTOS').map(mapProduto_);
  const id = str_(p.id);
  const existing = id ? all.find(x => x.id === id) : null;
  if (id && !existing) throw new Error('Produto não encontrado.');
  const nome = safeText_(p.nome, 300);
  if (!nome) throw new Error('Informe a descrição do produto ou serviço.');
  const unidade = safeText_(p.unidade, 30);
  if (!unidade) throw new Error('Informe a unidade.');
  const imagem = p.imagem === undefined ? (existing ? existing.imagem : '') : safeText_(p.imagem, 45000);
  if (imagem && !/^drive:[\w-]+$/.test(imagem) && !/^https?:\/\//i.test(imagem) && !/^data:image\//i.test(imagem)) throw new Error('Referência de imagem inválida.');
  const newId = id || nextId_('PRODUTOS', 'PRO-', 3);
  const row = {
    'ID produto': newId,
    'Descrição do produto / serviço': nome,
    'Categoria': safeText_(p.categoria, 200),
    'Unidade': unidade,
    'Especificação': safeText_(p.especificacao, 1000),
    'Status': p.status ? safeText_(p.status, 30) : (existing ? existing.status : 'Ativo'),
    'Observações': safeText_(p.observacoes, 4000),
    'Atualizado em': now_(),
    'Imagem': imagem
  };
  writeObject_('PRODUTOS', row, 'ID produto', newId);
  if (existing && existing.imagem && existing.imagem !== imagem) deleteDriveFile_(existing.imagem);
  logAction_(user, existing ? 'Editar' : 'Criar', 'PRODUTOS', newId, existing || {}, row);
  return { ok: true, item: mapProduto_(row) };
}

function salvarCotacao(payload) {
  const user = requireRole_(['ADMIN']);
  const p = payload || {};
  const products = objects_('PRODUTOS').map(mapProduto_);
  const suppliers = objects_('FORNECEDORES').map(mapFornecedor_);
  const product = products.find(x => x.id === str_(p.produtoId));
  const supplier = suppliers.find(x => x.id === str_(p.fornecedorId));
  if (!product) throw new Error('Selecione um produto válido.');
  if (String(product.status).toUpperCase().indexOf('EXCLU') === 0) throw new Error('Este produto foi excluído e não pode receber novas cotações.');
  if (!supplier) throw new Error('Selecione um fornecedor válido.');
  const qty = num_(p.quantidade);
  const unit = num_(p.precoUnitario);
  const disc = num_(p.desconto);
  const freight = num_(p.frete);
  if (!Number.isInteger(qty) || qty < 1) throw new Error('Quantidade deve ser um número inteiro maior ou igual a 1.');
  if (unit < 0) throw new Error('Preço unitário inválido.');
  if (disc < 0 || disc > 100) throw new Error('Desconto deve ficar entre 0 e 100%.');
  if (freight < 0) throw new Error('Frete inválido.');
  if (!urlValid_(p.linkProposta)) throw new Error('O link da proposta deve começar com http:// ou https://.');
  const all = objects_('COTACOES').map(mapCotacao_);
  const id = str_(p.id);
  const existing = id ? all.find(x => x.id === id) : null;
  if (id && !existing) throw new Error('Cotação não encontrada.');
  const status = p.status ? str_(p.status) : 'Em elaboração';
  if (CFG.QUOTE_STATUS.indexOf(status) < 0) throw new Error('Status de cotação inválido.');
  const data = dateStr_(p.data) || today_();
  const validade = dateStr_(p.validade);
  const total = round2_(qty * unit * (1 - disc / 100) + freight);
  const newId = id || nextId_('COTACOES', 'COT-', 3);
  const row = {
    'ID cotação': newId,
    'ID produto': product.id,
    'ID fornecedor': supplier.id,
    'Descrição': safeText_(p.descricao, 500) || (product.nome + (product.especificacao ? ' — ' + product.especificacao : '')),
    'Quantidade': qty,
    'Unidade': safeText_(p.unidade, 30) || product.unidade,
    'Preço unitário (R$)': round2_(unit),
    'Desconto (%)': round2_(disc),
    'Frete (R$)': round2_(freight),
    'Preço total (R$)': total,
    'Data da cotação': data,
    'Validade': validade,
    'Forma pagamento': safeText_(p.formaPagamento, 200),
    'Prazo entrega': safeText_(p.prazoEntrega, 100),
    'Status': status,
    'Responsável': safeText_(p.responsavel, 200) || user.nome || user.email,
    'Observações': safeText_(p.observacoes, 4000),
    'Link da proposta': safeText_(p.linkProposta, 1000),
    'Motivo da escolha': safeText_(p.motivoEscolha, 2000),
    'Vencedor': bool_(p.vencedor) ? 'SIM' : 'NÃO',
    'Atualizado em': now_()
  };
  writeObject_('COTACOES', row, 'ID cotação', newId);

  if (bool_(p.vencedor)) {
    all.filter(x => x.produtoId === product.id && x.id !== newId && x.vencedor).forEach(x => {
      const other = objects_('COTACOES').find(o => str_(o['ID cotação']) === x.id);
      if (other) {
        other['Vencedor'] = 'NÃO';
        other['Atualizado em'] = now_();
        writeObject_('COTACOES', other, 'ID cotação', x.id);
      }
    });
  }

  let oldPrice = 0;
  if (existing) {
    oldPrice = existing.precoUnitario;
  } else {
    const previous = all
      .filter(x => x.produtoId === product.id && x.fornecedorId === supplier.id)
      .sort((a, b) => ((a.data || '') + (a.atualizadoEm || '')).localeCompare((b.data || '') + (b.atualizadoEm || '')))
      .pop();
    oldPrice = previous ? previous.precoUnitario : 0;
  }
  if (round2_(unit) !== round2_(oldPrice)) {
    appendObject_('HISTORICO_PRECOS', {
      'ID registro': nextId_('HISTORICO_PRECOS', 'HPR-', 4),
      'ID cotação': newId,
      'ID produto': product.id,
      'ID fornecedor': supplier.id,
      'Preço anterior (R$)': round2_(oldPrice),
      'Preço novo (R$)': round2_(unit),
      'Data / Hora': now_(),
      'Responsável': user.nome || user.email,
      'Motivo': safeText_(p.motivoPreco, 500) || (existing ? 'Alteração de preço na cotação' : (oldPrice ? 'Atualização de preço na cotação' : 'Primeiro preço registrado'))
    });
  }
  logAction_(user, existing ? 'Editar' : 'Criar', 'COTACOES', newId, existing || {}, row);
  return { ok: true, item: mapCotacao_(row) };
}

function alterarPreco(payload) {
  const user = requireRole_(['ADMIN']);
  const p = payload || {};
  const id = str_(p.id);
  const obj = objects_('COTACOES').find(x => str_(x['ID cotação']) === id);
  if (!obj) throw new Error('Cotação não encontrada.');
  const before = mapCotacao_(obj);
  const newPrice = num_(p.novoPreco);
  if (newPrice < 0) throw new Error('Preço inválido.');
  if (round2_(newPrice) === round2_(before.precoUnitario)) throw new Error('O novo preço é igual ao preço atual.');
  const qty = num_(before.quantidade);
  const disc = num_(before.desconto);
  const freight = num_(before.frete);
  obj['Preço unitário (R$)'] = round2_(newPrice);
  obj['Preço total (R$)'] = round2_(qty * newPrice * (1 - disc / 100) + freight);
  obj['Atualizado em'] = now_();
  writeObject_('COTACOES', obj, 'ID cotação', id);
  appendObject_('HISTORICO_PRECOS', {
    'ID registro': nextId_('HISTORICO_PRECOS', 'HPR-', 4),
    'ID cotação': id,
    'ID produto': before.produtoId,
    'ID fornecedor': before.fornecedorId,
    'Preço anterior (R$)': before.precoUnitario,
    'Preço novo (R$)': round2_(newPrice),
    'Data / Hora': now_(),
    'Responsável': user.nome || user.email,
    'Motivo': safeText_(p.motivo, 500) || 'Alteração manual de preço'
  });
  logAction_(user, 'Alterar preço', 'COTACOES', id, before, mapCotacao_(obj));
  return { ok: true, item: mapCotacao_(obj) };
}

function excluirCotacao(id) {
  const user = requireRole_(['ADMIN']);
  const quote = objects_('COTACOES').find(x => str_(x['ID cotação']) === str_(id));
  if (!quote) throw new Error('Cotação não encontrada.');
  const before = mapCotacao_(quote);
  const removed = deleteRowById_('COTACOES', 'ID cotação', id);
  if (!removed) throw new Error('Não foi possível localizar a linha da cotação.');
  logAction_(user, 'Excluir cotação', 'COTACOES', id, before, {});
  return {
    ok: true,
    id: id,
    message: 'Cotação excluída da planilha. O histórico de preços foi preservado.'
  };
}

function salvarCompra(payload) {
  const user = requireRole_(['ADMIN']);
  const p = payload || {};
  const products = objects_('PRODUTOS').map(mapProduto_);
  const suppliers = objects_('FORNECEDORES').map(mapFornecedor_);
  const product = products.find(x => x.id === str_(p.produtoId));
  const supplier = suppliers.find(x => x.id === str_(p.fornecedorId));
  if (!product) throw new Error('Selecione um produto válido.');
  if (String(product.status).toUpperCase().indexOf('EXCLU') === 0) throw new Error('Este produto foi excluído e não pode receber novas compras.');
  if (!supplier) throw new Error('Selecione um fornecedor válido.');
  const qty = num_(p.quantidade);
  const unit = num_(p.precoUnitario);
  const freight = num_(p.frete);
  if (!(qty > 0)) throw new Error('Quantidade deve ser maior que zero.');
  if (unit < 0 || freight < 0) throw new Error('Preço ou frete inválido.');
  const total = round2_(qty * unit + freight);
  const situacao = str_(p.situacao) || 'Pendente';
  if (CFG.DELIVERY_STATUS.indexOf(situacao) < 0) throw new Error('Situação de entrega inválida.');
  const all = objects_('COMPRAS').map(mapCompra_);
  const id = str_(p.id);
  const existing = id ? all.find(x => x.id === id) : null;
  if (id && !existing) throw new Error('Compra não encontrada.');
  const newId = id || nextId_('COMPRAS', 'COM-', 3);
  const row = {
    'ID compra': newId,
    'Data': dateStr_(p.data) || today_(),
    'ID fornecedor': supplier.id,
    'ID produto': product.id,
    'Quantidade': qty,
    'Preço unitário (R$)': round2_(unit),
    'Preço total (R$)': total,
    'Frete (R$)': round2_(freight),
    'Responsável': safeText_(p.responsavel, 200) || user.nome || user.email,
    'Número do pedido': safeText_(p.pedido, 100),
    'Número da nota fiscal': safeText_(p.notaFiscal, 100),
    'Situação da entrega': situacao,
    'Observações': safeText_(p.observacoes, 4000),
    'ID cotação': safeText_(p.cotacaoId, 100),
    'Atualizado em': now_()
  };
  writeObject_('COMPRAS', row, 'ID compra', newId);
  logAction_(user, existing ? 'Editar' : 'Criar', 'COMPRAS', newId, existing || {}, row);
  return { ok: true, item: mapCompra_(row) };
}

function salvarUsuario(payload) {
  const user = requireRole_(['ADMIN']);
  const p = payload || {};
  const email = str_(p.email).toLowerCase();
  const originalEmail = str_(p.originalEmail).toLowerCase() || email;
  if (!email || !emailValid_(email)) throw new Error('Informe um e-mail válido.');
  const obj = objects_('USUARIOS').find(function(r) { return str_(r['E-mail']).toLowerCase() === originalEmail; });
  if (!obj) throw new Error('Novo usuário deve ser criado pela tela de cadastro e aprovado na Gestão de Usuários.');
  const perfil = str_(p.perfil || obj['Perfil'] || 'CONSULTA').toUpperCase();
  if (['ADMIN', 'CONSULTA'].indexOf(perfil) < 0) throw new Error('Perfil inválido.');
  const status = str_(p.status || obj['Status'] || 'ATIVO').toUpperCase();
  if (['ATIVO', 'INATIVO'].indexOf(status) < 0) throw new Error('Status inválido.');
  if (email === user.email.toLowerCase() && perfil !== 'ADMIN') throw new Error('Você não pode remover seu próprio acesso administrativo.');
  const before = mapUsuario_(obj);
  assertNotLastAdmin_(obj, 'rebaixar');
  obj['E-mail'] = email;
  obj['Nome'] = safeText_(p.nome, 200);
  obj['Perfil'] = perfil;
  obj['Status'] = status;
  obj['Atualizado em'] = now_();
  writeObject_('USUARIOS', obj, 'E-mail', originalEmail);
  if (email !== originalEmail) revokeSessionsForEmail_(originalEmail);
  if (status !== 'ATIVO') revokeSessionsForEmail_(email);
  logAction_(user, 'Editar usuário', 'USUARIOS', email, before, mapUsuario_(obj));
  return { ok: true, item: mapUsuario_(obj) };
}

function salvarConfiguracao(payload) {
  const user = requireRole_(['ADMIN']);
  const p = payload || {};
  const key = str_(p.chave);
  if (!key) throw new Error('Informe a chave.');
  const value = safeText_(p.valor, 1000);
  const desc = safeText_(p.descricao, 500);
  const obj = objects_('CONFIGURACOES').find(x => str_(x['Chave']) === key);
  const before = obj || {};
  if (obj) {
    obj['Valor'] = value;
    if (desc) obj['Descrição'] = desc;
    writeObject_('CONFIGURACOES', obj, 'Chave', key);
  } else {
    appendObject_('CONFIGURACOES', { 'Chave': key, 'Valor': value, 'Descrição': desc });
  }
  logAction_(user, obj ? 'Editar' : 'Criar', 'CONFIGURACOES', key, before, { chave: key, valor: value, descricao: desc });
  return { ok: true };
}

function criarBackup() {
  const user = requireRole_(['ADMIN']);
  const ss = ss_();
  const name = 'BACKUP GVG FORNECEDORES - ' + Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd HH-mm-ss');
  try {
    const copy = ss.copy(name);
    logAction_(user, 'Backup', 'PLANILHA', copy.getId(), {}, { nome: name });
    return { ok: true, id: copy.getId(), url: copy.getUrl(), nome: name };
  } catch (e) {
    const backup = SpreadsheetApp.create(name);
    Object.keys(CFG.SHEETS).forEach(sheetName => {
      const src = ss.getSheetByName(sheetName);
      if (!src) return;
      const dst = backup.insertSheet(sheetName);
      const values = src.getDataRange().getValues();
      if (values.length && values[0].length) {
        dst.getRange(1, 1, values.length, values[0].length).setValues(values);
      }
    });
    logAction_(user, 'Backup', 'PLANILHA', backup.getId(), {}, { nome: name });
    return { ok: true, id: backup.getId(), url: backup.getUrl(), nome: name };
  }
}

/* ------------------------------------------------------------------ */
/* Autoteste isolado                                                    */
/* ------------------------------------------------------------------ */

function selfTest() {
  requireRole_(['ADMIN']);
  const originalToken = ACTIVE_TOKEN_;
  const props = PropertiesService.getScriptProperties();
  const previous = props.getProperty('SPREADSHEET_ID_OVERRIDE');
  let testSheet = null;
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name: name, ok: !!ok, detail: detail || '' });
  try {
    testSheet = SpreadsheetApp.create('AUTOTESTE GVG FORNECEDORES ' + now_());
    props.setProperty('SPREADSHEET_ID_OVERRIDE', testSheet.getId());
    setup();

    const active = str_(Session.getActiveUser().getEmail()).toLowerCase();
    if (active) {
      const users = objects_('USUARIOS').map(mapUsuario_);
      if (!users.some(u => u.email.toLowerCase() === active)) {
        appendObject_('USUARIOS', {
          'E-mail': active, 'Nome': 'Usuário do autoteste', 'Perfil': 'ADMIN',
          'Status': 'ATIVO', 'Último acesso': now_(), 'Atualizado em': now_()
        });
      }
    }
    let effective = '';
    try { effective = str_(Session.getEffectiveUser().getEmail()).toLowerCase(); } catch (e) {}
    const sessionEmail = active || effective || 'admin@local';
    const sessionUser = objects_('USUARIOS').map(mapUsuario_).find(u => u.email.toLowerCase() === sessionEmail && u.status === 'ATIVO');
    if (sessionUser) ACTIVE_TOKEN_ = createSession_(sessionUser);

    const fA = salvarFornecedor({ nome: 'FORNECEDOR TESTE A', categoria: 'Teste', status: 'Ativo' }).item;
    const fB = salvarFornecedor({ nome: 'FORNECEDOR TESTE B', categoria: 'Teste', status: 'Ativo' }).item;
    add('Cadastro de fornecedor', fA && fA.id && fB && fB.id, (fA && fA.id) + ' / ' + (fB && fB.id));

    const prod = salvarProduto({ nome: 'PRODUTO TESTE', categoria: 'Teste', unidade: 'un', status: 'Ativo' }).item;
    add('Cadastro de produto', prod && prod.id, prod && prod.id);

    const qA = salvarCotacao({
      produtoId: prod.id, fornecedorId: fA.id, quantidade: 10, precoUnitario: 15,
      desconto: 0, frete: 20, data: today_(), status: 'Recebida', vencedor: false
    }).item;
    const qB = salvarCotacao({
      produtoId: prod.id, fornecedorId: fB.id, quantidade: 10, precoUnitario: 13.5,
      desconto: 0, frete: 0, data: today_(), status: 'Recebida', vencedor: false
    }).item;
    add('Cadastro de cotações', qA && qB && qA.precoTotal === 170 && qB.precoTotal === 135, moneyTest_(qA.precoTotal) + ' / ' + moneyTest_(qB.precoTotal));
    let qtyBlocked = false;
    try {
      salvarCotacao({ produtoId: prod.id, fornecedorId: fA.id, quantidade: 1.5, precoUnitario: 10, data: today_(), status: 'Recebida' });
    } catch (e) { qtyBlocked = /inteiro/i.test(e.message); }
    add('Quantidade fracionada bloqueada', qtyBlocked, qtyBlocked ? '1,5 rejeitado' : 'não bloqueou');
    const qtyProd = salvarProduto({ nome: 'PRODUTO TESTE QUANTIDADES', categoria: 'Teste', unidade: 'un', status: 'Ativo' }).item;
    const qtyResults = [1, 2, 10, 100].map(q => salvarCotacao({
      produtoId: qtyProd.id, fornecedorId: fA.id, quantidade: q, precoUnitario: 2,
      desconto: 0, frete: 0, data: today_(), status: 'Recebida'
    }).item.quantidade === q);
    add('Quantidades 1, 2, 10 e 100', qtyResults.every(Boolean), '4 de 4 aceitas');

    const changed = alterarPreco({ id: qA.id, novoPreco: 10.9, motivo: 'Autoteste' }).item;
    add('Alteração de preço', changed && changed.precoUnitario === 10.9 && changed.precoTotal === 129, moneyTest_(changed && changed.precoTotal));

    const hist = objects_('HISTORICO_PRECOS').map(mapHistoricoPreco_);
    add('Histórico de preços', hist.length >= 2, hist.length + ' registro(s)');

    const comp = getComparacao(prod.id);
    add('Comparação de preços', comp.melhorId === qA.id && comp.economia === 6, 'melhor=' + comp.melhorId + ' economia=' + moneyTest_(comp.economia));

    const buy = salvarCompra({
      data: today_(), fornecedorId: fA.id, produtoId: prod.id, quantidade: 2,
      precoUnitario: 10.9, frete: 5, situacao: 'Entregue', notaFiscal: 'TESTE-001'
    }).item;
    add('Registro de compra', buy && buy.precoTotal === 26.8, moneyTest_(buy && buy.precoTotal));

    const rep = getRelatorios({});
    add('Relatório', rep && rep.totais && rep.totais.cotacoes >= 2 && rep.totais.compras >= 1, 'cotações=' + (rep.totais && rep.totais.cotacoes) + ' compras=' + (rep.totais && rep.totais.compras));

    const histBeforeQuote = objects_('HISTORICO_PRECOS').filter(x => str_(x['ID cotação']) === qB.id).length;
    const delQuote = excluirCotacao(qB.id);
    const quoteGone = !objects_('COTACOES').some(x => str_(x['ID cotação']) === qB.id);
    const histAfterQuote = objects_('HISTORICO_PRECOS').filter(x => str_(x['ID cotação']) === qB.id).length;
    add('Exclusão de cotação', delQuote && delQuote.ok && quoteGone && histAfterQuote >= histBeforeQuote, quoteGone ? 'saiu de COTACOES; histórico=' + histAfterQuote : 'não removeu');

    const imgProd = salvarProduto({ nome: 'PRODUTO COM IMAGEM TESTE', categoria: 'Teste', unidade: 'un', status: 'Ativo' }).item;
    const imgRef = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=';
    salvarProduto({ id: imgProd.id, nome: imgProd.nome, categoria: imgProd.categoria, unidade: imgProd.unidade, status: 'Ativo', imagem: imgRef });
    const imgGet = getProductImage(imgRef);
    add('Imagem do produto', imgRef && imgGet && /^data:image\//.test(imgGet.src), 'miniatura embutida');
    const delImg = excluirProduto(imgProd.id);
    add('Exclusão física de produto', delImg && delImg.modo === 'fisico', delImg && delImg.message);
    const delLinked = excluirProduto(prod.id);
    add('Exclusão lógica com vínculos', delLinked && delLinked.modo === 'logico', delLinked && delLinked.message);

    const testEmail = 'teste.autoteste@example.com';
    const testSalt = 'salt_' + Utilities.getUuid().replace(/-/g, '');
    const testHash = hashPassword_('SenhaTeste123', testSalt);
    appendObject_('USUARIOS', {
      'E-mail': testEmail, 'Nome': 'Usuário Teste', 'Perfil': 'CONSULTA', 'Status': 'PENDENTE',
      'Último acesso': '', 'Atualizado em': now_(), 'SenhaHash': testHash, 'SenhaSalt': testSalt,
      'Solicitado em': now_(), 'Aprovado por': '', 'Aprovado em': ''
    });
    const pendingUser = objects_('USUARIOS').map(mapUsuario_).find(u => u.email === testEmail);
    add('Cadastro pendente', pendingUser && pendingUser.status === 'PENDENTE', pendingUser && pendingUser.status);
    const approvedUser = aprovarUsuario({ email: testEmail, perfil: 'CONSULTA' }).item;
    add('Aprovação de usuário', approvedUser && approvedUser.status === 'ATIVO' && approvedUser.perfil === 'CONSULTA', approvedUser && approvedUser.status);
    const promoted = alterarPerfilUsuario({ email: testEmail, perfil: 'ADMIN' }).item;
    add('Alteração para administrador', promoted && promoted.perfil === 'ADMIN', promoted && promoted.perfil);
    const demoted = alterarPerfilUsuario({ email: testEmail, perfil: 'CONSULTA' }).item;
    add('Alteração para usuário comum', demoted && demoted.perfil === 'CONSULTA', demoted && demoted.perfil);
    add('Usuário comum sem escrita', !canWrite_({ perfil: 'CONSULTA' }), 'bloqueado no servidor');
    add('Administrador com escrita', canWrite_({ perfil: 'ADMIN' }), 'liberado no servidor');
    let duplicateBlocked = false;
    try { registrarUsuario({ nome: 'Teste Duplicado', email: testEmail, senha: 'SenhaTeste123', confirmar: 'SenhaTeste123' }); }
    catch (e) { duplicateBlocked = /já está cadastrado/i.test(e.message); }
    add('E-mail duplicado bloqueado', duplicateBlocked, 'duplicidade rejeitada');
    add('Senha protegida por hash', verifyPassword_('SenhaTeste123', testSalt, testHash) && String(testHash).indexOf('SenhaTeste123') < 0, 'hash + salt');
    const rejectedUser = recusarUsuario({ email: testEmail }).item;
    add('Recusa de cadastro', rejectedUser && rejectedUser.status === 'RECUSADO', rejectedUser && rejectedUser.status);
    add('Exclusão de usuário', excluirUsuario({ email: testEmail }).ok && !objects_('USUARIOS').some(u => str_(u['E-mail']) === testEmail), 'usuário de teste removido');

    salvarConfiguracao({ chave: 'Teste', valor: 'OK', descricao: 'Autoteste' });
    add('Configuração', objects_('CONFIGURACOES').some(x => str_(x['Chave']) === 'Teste'), 'chave Teste');

    const failed = checks.filter(c => !c.ok);
    return { ok: failed.length === 0, checks: checks, testSheetId: testSheet.getId(), message: failed.length ? 'Alguns testes falharam.' : 'Todos os testes passaram.' };
  } finally {
    ACTIVE_TOKEN_ = originalToken;
    if (previous) props.setProperty('SPREADSHEET_ID_OVERRIDE', previous);
    else props.deleteProperty('SPREADSHEET_ID_OVERRIDE');
    if (testSheet) {
      try { DriveApp.getFileById(testSheet.getId()).setTrashed(true); } catch (e) {}
    }
  }
}

function moneyTest_(v) {
  return 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ',');
}

/* ------------------------------------------------------------------ */
/* Preparação idempotente                                               */
/* ------------------------------------------------------------------ */

function setup() {
  const ss = ss_();
  ss.setSpreadsheetTimeZone(CFG.TZ);
  Object.keys(CFG.SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = headers_(sh);
    if (!headers.filter(Boolean).length) {
      sh.getRange(1, 1, 1, CFG.SHEETS[name].length).setValues([CFG.SHEETS[name]]);
    } else {
      const current = headers.slice();
      CFG.SHEETS[name].forEach(h => { if (current.indexOf(h) < 0) current.push(h); });
      if (current.join('|') !== headers.join('|')) {
        sh.getRange(1, 1, 1, current.length).setValues([current]);
      }
    }
  });

  const users = objects_('USUARIOS').map(mapUsuario_);
  if (!users.length) {
    let owner = '';
    try { owner = Session.getEffectiveUser().getEmail(); } catch (e) {}
    appendObject_('USUARIOS', {
      'E-mail': owner || 'admin@local',
      'Nome': 'Administrador',
      'Perfil': 'ADMIN',
      'Status': 'ATIVO',
      'Último acesso': '',
      'Atualizado em': now_()
    });
  }

  const cfg = objects_('CONFIGURACOES');
  const keys = {};
  cfg.forEach(x => keys[str_(x['Chave'])] = true);
  const defaults = [
    ['Fuso horário', CFG.TZ, 'Fuso usado pelo sistema'],
    ['Versão do sistema', CFG.VERSION, 'Versão do aplicativo'],
    ['Última atualização', now_(), 'Última gravação do sistema'],
    ['Backup automático', 'SIM', 'Criar cópia antes de alterações estruturais'],
    ['Acesso para visitantes', 'NAO', 'Permitir que qualquer pessoa com o link use o sistema'],
    ['Perfil para visitantes', 'CONSULTA', 'Perfil padrão de quem não está cadastrado']
  ];
  defaults.forEach(d => { if (!keys[d[0]]) appendObject_('CONFIGURACOES', { 'Chave': d[0], 'Valor': d[1], 'Descrição': d[2] }); });

  PropertiesService.getScriptProperties().setProperty('SETUP_VERSION', CFG.VERSION);
  SpreadsheetApp.flush();
  return 'Estrutura OK. Versão ' + CFG.VERSION + '.';
}

return { apiCall: apiCall };
})();
function fornecedoresApiCall(fn,args,token,painelToken){return GVG_FORNECEDORES_APP_.apiCall(fn,args,token,painelToken);}
