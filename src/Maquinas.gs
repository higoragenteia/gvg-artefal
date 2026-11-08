/** GVG & ARTEFAL — Controle de Máquinas e Ferramentas (backend oficial integrado ao projeto do painel).
 *  O código fica isolado em um namespace próprio para não conflitar com os demais módulos.
 *  A planilha usada é a cópia de teste em 11 - Controle de Máquinas (teste).
 */
var GVG_MAQUINAS_API_ = (function(){
/**
 * GVG & ARTEFAL — Controle de Máquinas e Ferramentas
 * Configuração central do backend.
 *
 * IMPORTANTE: este arquivo é o único que muda entre o ambiente de teste e o de produção.
 * A planilha é privada; o acesso é feito somente pelo servidor Apps Script.
 */
const SPREADSHEET_ID = '1AnTsJ4KfZIvigbEnbO9gtu23J0Q1JWzevzCyaqN1jWI'; // CÓPIA DE TESTE
const APP_NOME = 'GVG & ARTEFAL — Controle de Máquinas e Ferramentas';
const API_VERSAO = '1.0.0';
const TZ = 'America/Recife';
const PASSWORD_ITERACOES = 1500;
const SENHA_MIN_ADMIN = 8;
const SENHA_MIN_AUTO = 5;
const AUTO_CADASTRO_POR_HORA = 20;
const SESSION_HORAS = 87600; // 10 anos: só encerra no logout, bloqueio ou troca de perfil
const IDEMPOTENCIA_SEGUNDOS = 600;
const MAX_TENTATIVAS_LOGIN = 5;
const BLOQUEIO_LOGIN_SEGUNDOS = 900;
const MAX_TENTATIVAS_SETUP = 10;

const SHEET = {
  CATEGORIAS: 'CATEGORIAS',
  COLABORADORES: 'COLABORADORES',
  EQUIPAMENTOS: 'EQUIPAMENTOS',
  EMPRESTIMOS: 'EMPRESTIMOS',
  MOVIMENTACOES: 'MOVIMENTACOES',
  MANUTENCOES: 'MANUTENCOES',
  USUARIOS: 'USUARIOS',
  SESSOES: 'SESSOES',
  AUDITORIA: 'AUDITORIA',
  CONFIG: 'CONFIG'
};

const HEADERS = {
  CATEGORIAS: ['ID','NOME','NOME_ABA','CAMPO_ITEM','PREFIXO','ORDEM','ATIVO','OBSERVACAO_ORIGEM','OBSERVACAO_IMPORTACAO','CRIADO_EM','ATUALIZADO_EM'],
  COLABORADORES: ['ID','NOME','TIPO','FUNCAO','TELEFONE','EMAIL','LOCAL_OBRA','ATIVO','OBSERVACOES','ORIGEM','CRIADO_EM','ATUALIZADO_EM','SETOR'],
  EQUIPAMENTOS: ['ID','CODIGO','CATEGORIA_ID','CATEGORIA_NOME','CODIGO_MODELO','DESCRICAO','MARCA','MODELO','NUMERO_SERIE','QUANTIDADE_TOTAL','QUANTIDADE_DISPONIVEL','ESTADO_CONSERVACAO','ESTADO_ORIGEM','STATUS','COLABORADOR_ATUAL_ID','COLABORADOR_ATUAL_NOME','CARREGADOR_CODIGO','CARREGADOR_QTD','BATERIA_CODIGO','BATERIA_QTD','DATA_ENTREGA_ATUAL','ACESSORIOS_PENDENTES','OBSERVACOES','ORIGEM_ABA','ORIGEM_LINHA','ORIGEM_NUMERO','REVISAR','MOTIVO_REVISAO','CRIADO_EM','ATUALIZADO_EM','CRIADO_POR','ATUALIZADO_POR'],
  EMPRESTIMOS: ['ID','EQUIPAMENTO_ID','EQUIPAMENTO_CODIGO','EQUIPAMENTO_NOME','COLABORADOR_ID','COLABORADOR_NOME','DATA_ENTREGA','QUANTIDADE','ESTADO_ENTREGA','ACESSORIOS_ENTREGUES','ACESSORIOS_PENDENTES','EQUIPAMENTO_DEVOLVIDO','DATA_DEVOLUCAO_EQUIPAMENTO','STATUS','MOVIMENTO_ENTREGA_ID','MOVIMENTO_ENCERRAMENTO_ID','OBSERVACOES','ORIGEM','CRIADO_EM','ATUALIZADO_EM','USUARIO'],
  MOVIMENTACOES: ['ID','DATA','TIPO','EQUIPAMENTO_ID','EQUIPAMENTO_CODIGO','CATEGORIA_NOME','QUANTIDADE','COLABORADOR_ORIGEM_ID','COLABORADOR_ORIGEM_NOME','COLABORADOR_DESTINO_ID','COLABORADOR_DESTINO_NOME','ESTADO_CONSERVACAO','ACESSORIOS_ENTREGUES','ACESSORIOS_DEVOLVIDOS','ACESSORIOS_PENDENTES','OBSERVACOES','EMPRESTIMO_ID','MANUTENCAO_ID','USUARIO_ID','USUARIO_EMAIL','ORIGEM','REQUEST_ID','CRIADO_EM'],
  MANUTENCOES: ['ID','EQUIPAMENTO_ID','EQUIPAMENTO_CODIGO','CATEGORIA_NOME','DATA_ENVIO','DEFEITO','RESPONSAVEL','STATUS','SERVICO','CUSTO','PREVISAO_RETORNO','DATA_RETORNO','ESTADO_RETORNO','OBSERVACOES','ORIGEM','USUARIO','CRIADO_EM','ATUALIZADO_EM','REVISAR','MOTIVO_REVISAO','CELULAR_RESPONSAVEL'],
  USUARIOS: ['ID','NOME','EMAIL','SENHA_HASH','SENHA_SALT','PERFIL','STATUS','CRIADO_EM','ATUALIZADO_EM','ULTIMO_ACESSO','CRIADO_POR','OBSERVACOES'],
  SESSOES: ['TOKEN_HASH','USUARIO_ID','CRIADO_EM','EXPIRA_EM','REVOGADO_EM','USER_AGENT','ULTIMO_USO','REQUEST_ID'],
  AUDITORIA: ['ID','DATA','USUARIO_ID','USUARIO_EMAIL','PERFIL','ACAO','ENTIDADE','ENTIDADE_ID','DETALHES','ORIGEM','REQUEST_ID'],
  CONFIG: ['CHAVE','VALOR','ATUALIZADO_EM']
};

const PERFIL = { ADMIN: 'ADMINISTRADOR', COLAB: 'COLABORADOR' };
const STATUS_EQ = { DISPONIVEL: 'DISPONIVEL', ENTREGUE: 'ENTREGUE', PARCIAL: 'PARCIAL', MANUTENCAO: 'MANUTENCAO', INATIVO: 'INATIVO' };
const STATUS_LOAN = { ABERTO: 'ABERTO', ENCERRADO: 'ENCERRADO', TRANSFERIDO: 'TRANSFERIDO' };
const STATUS_MAN = { ABERTA: 'ABERTA', EM_ANDAMENTO: 'EM_ANDAMENTO', CONCLUIDA: 'CONCLUIDA', CANCELADA: 'CANCELADA' };
const CONSERVACAO = ['NOVO', 'USADO', 'BOM', 'REGULAR', 'RUIM', 'NAO_INFORMADO'];
const TIPOS_MOV = ['ENTREGA','DEVOLUCAO','TRANSFERENCIA','SAIDA_MANUTENCAO','RETORNO_MANUTENCAO','AJUSTE','IMPORTACAO'];


/**
 * Utilitários de planilha, segurança, cache, locks e respostas.
 */

class ApiError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details || null;
  }
}

function fail(code, message, details) {
  throw new ApiError(code, message, details);
}

function assert(cond, code, message) {
  if (!cond) fail(code, message);
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  const sh = getSpreadsheet().getSheetByName(name);
  if (!sh) fail('ESTRUTURA_AUSENTE', 'A aba ' + name + ' não existe. A estrutura da planilha precisa ser configurada.');
  return sh;
}

function sheetHeaders(name) {
  const sh = getSheet(name);
  const lastCol = Math.max(sh.getLastColumn(), (HEADERS[name] || []).length);
  if (lastCol < 1) return (HEADERS[name] || []).slice();
  const row = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const headers = row.map(function (h) { return String(h || '').trim(); }).filter(function (h) { return h; });
  return headers.length ? headers : (HEADERS[name] || []).slice();
}

function readObjects(name) {
  const sh = getSheet(name);
  const values = sh.getDataRange().getValues();
  if (!values || values.length < 1) return [];
  const headers = values[0].map(function (h) { return String(h || '').trim(); });
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    let has = false;
    for (let j = 0; j < row.length; j++) {
      if (row[j] !== '' && row[j] !== null && row[j] !== undefined) { has = true; break; }
    }
    if (!has) continue;
    const o = { _row: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      if (!headers[j]) continue;
      o[headers[j]] = normalizarValor(row[j]);
    }
    out.push(o);
  }
  return out;
}

function normalizarValor(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  if (v === null || v === undefined) return '';
  return v;
}

function objectToRow(name, obj) {
  const headers = HEADERS[name] || sheetHeaders(name);
  return headers.map(function (h) {
    const v = obj[h];
    if (v === null || v === undefined) return '';
    return v;
  });
}

function appendObject(name, obj) {
  const sh = getSheet(name);
  const headers = HEADERS[name] || sheetHeaders(name);
  const row = Math.max(2, sh.getLastRow() + 1);
  const values = objectToRow(name, obj);
  const target = sh.getRange(row, 1, 1, Math.max(headers.length, 1));
  target.setNumberFormat('@');
  target.setValues([values]);
  return row;
}

function updateObject(name, rowNumber, obj) {
  if (!rowNumber || rowNumber < 2) fail('REGISTRO_INVALIDO', 'Registro inválido para atualização.');
  const sh = getSheet(name);
  const headers = HEADERS[name] || sheetHeaders(name);
  const values = objectToRow(name, obj);
  const target = sh.getRange(rowNumber, 1, 1, Math.max(headers.length, 1));
  target.setNumberFormat('@');
  target.setValues([values]);
}

function deleteObject(name, rowNumber) {
  if (!rowNumber || rowNumber < 2) fail('REGISTRO_INVALIDO', 'Registro inválido para exclusão.');
  getSheet(name).deleteRow(rowNumber);
}

function nowStamp() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
}

function todayIso() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function newId(prefix) {
  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase();
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizarTexto(txt) {
  return String(txt === null || txt === undefined ? '' : txt).trim().replace(/\s+/g, ' ');
}

function normalizarKey(txt) {
  return normalizarTexto(txt).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function limparTexto(v, max) {
  let s = String(v === null || v === undefined ? '' : v).trim();
  if (s.slice(0, 1) === '=') fail('TEXTO_INVALIDO', 'Não use o sinal "=" no início de um texto.');
  if (max && s.length > max) fail('TEXTO_LONGO', 'O texto ultrapassou o limite de ' + max + ' caracteres.');
  return s;
}

function toNumber(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const s = String(v === null || v === undefined ? '' : v).trim().replace(',', '.');
  if (!s) return 0;
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

function toInt(v) {
  return Math.trunc(toNumber(v));
}

function isSim(v) {
  const s = String(v === null || v === undefined ? '' : v).trim().toUpperCase();
  return s === 'SIM' || s === 'TRUE' || s === '1' || v === true;
}

function boolText(b) {
  return b ? 'SIM' : 'NAO';
}

function jsonParseSafe(txt, fallback) {
  if (txt === null || txt === undefined || txt === '') return fallback;
  if (typeof txt === 'object') return txt;
  try { return JSON.parse(String(txt)); } catch (e) { return fallback; }
}

function jsonText(v) {
  try { return JSON.stringify(v === undefined ? null : v); } catch (e) { return 'null'; }
}

function sha256Hex(txt) {
  return bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(txt), Utilities.Charset.UTF_8));
}

function bytesToHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    out += ('0' + b.toString(16)).slice(-2);
  }
  return out;
}

function iguaisSeguro(a, b) {
  const x = String(a || '');
  const y = String(b || '');
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function isIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return false;
  const p = String(s).split('-');
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return d.getFullYear() === Number(p[0]) && d.getMonth() === Number(p[1]) - 1 && d.getDate() === Number(p[2]);
}

function validarData(v, obrigatoria, campo) {
  const s = String(v === null || v === undefined ? '' : v).trim();
  if (!s) {
    if (obrigatoria) fail('DATA_OBRIGATORIA', 'Informe ' + (campo || 'a data') + '.');
    return '';
  }
  if (!isIsoDate(s)) fail('DATA_INVALIDA', 'Data inválida em ' + (campo || 'data') + '. Use o formato AAAA-MM-DD.');
  return s;
}

function getConfigMap() {
  const rows = readObjects(SHEET.CONFIG);
  const map = {};
  rows.forEach(function (r) { map[String(r.CHAVE || '').trim()] = String(r.VALOR === null || r.VALOR === undefined ? '' : r.VALOR); });
  return map;
}

function configGet(key) {
  const map = getConfigMap();
  return map[String(key)] === undefined ? '' : map[String(key)];
}

function configSetMany(pairs) {
  const sh = getSheet(SHEET.CONFIG);
  const rows = readObjects(SHEET.CONFIG);
  const byKey = {};
  rows.forEach(function (r) { byKey[String(r.CHAVE || '').trim()] = r; });
  const now = nowStamp();
  Object.keys(pairs).forEach(function (k) {
    const val = pairs[k];
    if (byKey[k]) {
      const obj = byKey[k];
      obj.VALOR = val;
      obj.ATUALIZADO_EM = now;
      updateObject(SHEET.CONFIG, obj._row, obj);
    } else {
      appendObject(SHEET.CONFIG, { CHAVE: k, VALOR: val, ATUALIZADO_EM: now });
    }
  });
}

function configSet(key, value) {
  const p = {};
  p[key] = value;
  configSetMany(p);
}

function cacheGet(key) {
  try { return CacheService.getScriptCache().get(String(key)); } catch (e) { return null; }
}

function cachePut(key, value, seconds) {
  try { CacheService.getScriptCache().put(String(key), String(value), seconds || 60); } catch (e) {}
}

function cacheRemove(key) {
  try { CacheService.getScriptCache().remove(String(key)); } catch (e) {}
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function requireRequestId(requestId) {
  const s = String(requestId || '').trim();
  assert(/^[A-Za-z0-9_-]{8,80}$/.test(s), 'REQUISICAO_INVALIDA', 'Identificador da requisição inválido. Recarregue a tela e tente novamente.');
  return s;
}

function withIdempotencia(requestId, fn) {
  const id = requireRequestId(requestId);
  const key = 'idem_' + id;
  const cached = cacheGet(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  const result = fn();
  cachePut(key, JSON.stringify(result), IDEMPOTENCIA_SEGUNDOS);
  return result;
}

function audit(session, acao, entidade, entidadeId, detalhes, requestId, origem) {
  try {
    const s = session || {};
    appendObject(SHEET.AUDITORIA, {
      ID: newId('AUD'),
      DATA: nowStamp(),
      USUARIO_ID: s.id || '',
      USUARIO_EMAIL: s.email || 'SISTEMA',
      PERFIL: s.perfil || '',
      ACAO: String(acao || '').slice(0, 80),
      ENTIDADE: String(entidade || '').slice(0, 60),
      ENTIDADE_ID: String(entidadeId || '').slice(0, 80),
      DETALHES: String(typeof detalhes === 'string' ? detalhes : jsonText(detalhes)).slice(0, 4000),
      ORIGEM: origem || 'APP',
      REQUEST_ID: String(requestId || '').slice(0, 80)
    });
  } catch (e) {
    console.error('Falha ao gravar auditoria: ' + e);
  }
}

function respostaErro(code, message, details) {
  const err = { code: code || 'ERRO', message: message || 'Não foi possível concluir a operação.' };
  if (details) err.details = details;
  return { ok: false, error: err };
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function exigirAdmin(session) {
  assert(session && session.perfil === PERFIL.ADMIN, 'SEM_PERMISSAO', 'Esta operação é exclusiva do administrador.');
}

function exigirAutenticado(session) {
  assert(session && session.id, 'NAO_AUTENTICADO', 'Entre no aplicativo para continuar.');
}

function lerTodosEquipamentos() { return readObjects(SHEET.EQUIPAMENTOS); }
function lerTodosColaboradores() { return readObjects(SHEET.COLABORADORES); }
function lerTodasCategorias() { return readObjects(SHEET.CATEGORIAS); }
function lerTodosEmprestimos() { return readObjects(SHEET.EMPRESTIMOS); }
function lerTodasManutencoes() { return readObjects(SHEET.MANUTENCOES); }
function lerTodosMovimentos() { return readObjects(SHEET.MOVIMENTACOES); }
function lerTodosUsuarios() { return readObjects(SHEET.USUARIOS); }

function porId(arr, id) {
  const alvo = String(id || '');
  for (let i = 0; i < arr.length; i++) if (String(arr[i].ID || '') === alvo) return arr[i];
  return null;
}

function exigirRegistro(obj, code, msg) {
  if (!obj) fail(code || 'NAO_ENCONTRADO', msg || 'Registro não encontrado.');
  return obj;
}


/**
 * Autenticação, sessões, usuários e procedimentos de configuração/recuperação.
 */

function hashSenha(senha, salt) {
  let h = sha256Hex(String(salt) + '|' + String(senha));
  for (let i = 1; i < PASSWORD_ITERACOES; i++) {
    h = sha256Hex(h + '|' + String(salt));
  }
  return String(PASSWORD_ITERACOES) + '$' + h;
}

function verificarSenha(senha, salt, armazenado) {
  const s = String(armazenado || '');
  let iter = PASSWORD_ITERACOES;
  let alvo = s;
  const p = s.indexOf('$');
  if (p > 0) {
    iter = Number(s.slice(0, p)) || PASSWORD_ITERACOES;
    alvo = s.slice(p + 1);
  }
  let h = sha256Hex(String(salt) + '|' + String(senha));
  for (let i = 1; i < iter; i++) h = sha256Hex(h + '|' + String(salt));
  return iguaisSeguro(h, alvo);
}

function validarSenha(senha, minimo) {
  const s = String(senha || '');
  const min = Number(minimo) || SENHA_MIN_ADMIN;
  assert(s.length >= min, 'SENHA_CURTA', 'A senha deve ter pelo menos ' + min + ' caracteres.');
  assert(s.length <= 128, 'SENHA_LONGA', 'A senha deve ter no máximo 128 caracteres.');
  assert(!/^\s+$/.test(s), 'SENHA_INVALIDA', 'A senha não pode ser só espaços.');
  return s;
}

function validarEmail(email) {
  const e = normalizarEmail(email);
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), 'EMAIL_INVALIDO', 'Informe um e-mail válido.');
  return e;
}

function validarLogin(login) {
  const s = normalizarEmail(login);
  assert(s.length >= 3 && s.length <= 80, 'LOGIN_INVALIDO', 'O usuário deve ter entre 3 e 80 caracteres.');
  if (s.indexOf('@') >= 0) {
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), 'LOGIN_INVALIDO', 'Informe um e-mail válido ou um usuário sem espaços.');
    return s;
  }
  assert(/^[a-z0-9._-]+$/.test(s), 'LOGIN_INVALIDO', 'Use letras, números, ponto, hífen ou sublinhado no usuário.');
  return s;
}

function codigoHash(codigo) {
  return sha256Hex(String(codigo || '').trim().toUpperCase());
}

function usuarioPublico(u) {
  return {
    id: u.ID,
    nome: u.NOME,
    email: u.EMAIL,
    perfil: u.PERFIL,
    status: u.STATUS,
    criadoEm: u.CRIADO_EM,
    atualizadoEm: u.ATUALIZADO_EM,
    ultimoAcesso: u.ULTIMO_ACESSO,
    observacoes: u.OBSERVACOES || '',
    podeAdministrar: String(u.PERFIL) === PERFIL.ADMIN && String(u.STATUS) === 'ATIVO'
  };
}

function criarSessao(usuario, userAgent, requestId) {
  const token = (Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '')).toLowerCase();
  const tokenHash = sha256Hex(token);
  const criado = nowStamp();
  const expira = Utilities.formatDate(new Date(Date.now() + SESSION_HORAS * 3600 * 1000), TZ, 'yyyy-MM-dd HH:mm:ss');
  appendObject(SHEET.SESSOES, {
    TOKEN_HASH: tokenHash,
    USUARIO_ID: usuario.ID,
    CRIADO_EM: criado,
    EXPIRA_EM: expira,
    REVOGADO_EM: '',
    USER_AGENT: String(userAgent || '').slice(0, 250),
    ULTIMO_USO: criado,
    REQUEST_ID: String(requestId || '').slice(0, 80)
  });
  return { token: token, expiraEm: expira };
}

function validarSessao(token) {
  const t = String(token || '').trim();
  if (!t) fail('NAO_AUTENTICADO', 'Entre no aplicativo para continuar.');
  const hash = sha256Hex(t);
  const sessoes = readObjects(SHEET.SESSOES);
  let sessao = null;
  for (let i = 0; i < sessoes.length; i++) {
    if (iguaisSeguro(String(sessoes[i].TOKEN_HASH || ''), hash)) { sessao = sessoes[i]; break; }
  }
  if (!sessao) fail('NAO_AUTENTICADO', 'Sessão inválida. Entre novamente.');
  if (String(sessao.REVOGADO_EM || '').trim()) fail('NAO_AUTENTICADO', 'Sessão encerrada. Entre novamente.');
  if (String(sessao.EXPIRA_EM || '') <= nowStamp()) fail('SESSAO_EXPIRADA', 'Sua sessão expirou. Entre novamente.');
  const usuarios = lerTodosUsuarios();
  const u = porId(usuarios, sessao.USUARIO_ID);
  if (!u) fail('NAO_AUTENTICADO', 'Usuário não encontrado. Entre novamente.');
  if (String(u.STATUS) !== 'ATIVO') fail('CONTA_BLOQUEADA', 'Sua conta está bloqueada. Fale com o administrador.');
  return {
    id: u.ID,
    nome: u.NOME,
    email: u.EMAIL,
    perfil: u.PERFIL,
    status: u.STATUS,
    tokenHash: hash,
    sessaoRow: sessao._row
  };
}

function revogarSessao(session, requestId) {
  if (!session || !session.sessaoRow) return;
  const s = readObjects(SHEET.SESSOES).filter(function (x) { return x._row === session.sessaoRow; })[0];
  if (!s) return;
  s.REVOGADO_EM = nowStamp();
  updateObject(SHEET.SESSOES, s._row, s);
  audit(session, 'LOGOUT', 'SESSAO', session.tokenHash, null, requestId);
}

function revogarSessoesUsuario(usuarioId, excetoHash) {
  const sessoes = readObjects(SHEET.SESSOES);
  const agora = nowStamp();
  sessoes.forEach(function (s) {
    if (String(s.USUARIO_ID) !== String(usuarioId)) return;
    if (String(s.REVOGADO_EM || '').trim()) return;
    if (excetoHash && iguaisSeguro(String(s.TOKEN_HASH || ''), String(excetoHash))) return;
    s.REVOGADO_EM = agora;
    updateObject(SHEET.SESSOES, s._row, s);
  });
}

function contarAdminsAtivos() {
  return lerTodosUsuarios().filter(function (u) {
    return String(u.PERFIL) === PERFIL.ADMIN && String(u.STATUS) === 'ATIVO';
  }).length;
}

function contarAdmins() {
  return lerTodosUsuarios().filter(function (u) { return String(u.PERFIL) === PERFIL.ADMIN; }).length;
}

function setupStatus() {
  const cfg = getConfigMap();
  const admins = contarAdmins();
  const hash = String(cfg.SETUP_CODE_HASH || '').trim();
  const usado = String(cfg.SETUP_USADO_EM || '').trim();
  const precisa = admins === 0 && !!hash && !usado;
  return {
    precisaSetup: precisa,
    configuracaoPendente: admins === 0 && (!hash || !!usado),
    temAdministrador: admins > 0,
    appNome: APP_NOME,
    versao: API_VERSAO
  };
}

function login(payload, requestId) {
  payload = payload || {};
  const email = normalizarEmail(payload.email);
  const senha = String(payload.senha || '');
  assert(email && senha, 'CREDENCIAIS_OBRIGATORIAS', 'Informe usuário/e-mail e senha.');
  const chave = 'login_fail_' + sha256Hex(email).slice(0, 24);
  const falhas = Number(cacheGet(chave) || 0);
  if (falhas >= MAX_TENTATIVAS_LOGIN) {
    fail('MUITAS_TENTATIVAS', 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.');
  }
  const usuarios = lerTodosUsuarios();
  let u = null;
  for (let i = 0; i < usuarios.length; i++) {
    if (normalizarEmail(usuarios[i].EMAIL) === email) { u = usuarios[i]; break; }
  }
  if (!u || !verificarSenha(senha, u.SENHA_SALT, u.SENHA_HASH)) {
    cachePut(chave, String(falhas + 1), BLOQUEIO_LOGIN_SEGUNDOS);
    audit(null, 'LOGIN_FALHA', 'USUARIO', u ? u.ID : email, { email: email }, requestId, 'APP');
    fail('CREDENCIAIS_INVALIDAS', 'Usuário/e-mail ou senha inválidos.');
  }
  if (String(u.STATUS) === 'PENDENTE') {
    fail('CADASTRO_PENDENTE', 'Cadastro aguardando aprovação do administrador.');
  }
  if (String(u.STATUS) !== 'ATIVO') {
    fail('CONTA_BLOQUEADA', 'Sua conta está bloqueada. Fale com o administrador.');
  }
  cacheRemove(chave);
  u.ULTIMO_ACESSO = nowStamp();
  updateObject(SHEET.USUARIOS, u._row, u);
  const sess = criarSessao(u, payload.userAgent, requestId);
  audit({ id: u.ID, email: u.EMAIL, perfil: u.PERFIL }, 'LOGIN', 'USUARIO', u.ID, { email: u.EMAIL }, requestId);
  return { token: sess.token, expiraEm: sess.expiraEm, usuario: usuarioPublico(u) };
}

function logout(session, requestId) {
  revogarSessao(session, requestId);
  return { ok: true };
}

function setupAdmin(payload, requestId) {
  payload = payload || {};
  requireRequestId(requestId);
  const falhas = Number(cacheGet('setup_fail') || 0);
  if (falhas >= MAX_TENTATIVAS_SETUP) {
    fail('MUITAS_TENTATIVAS', 'Muitas tentativas de configuração. Aguarde 15 minutos.');
  }
  const nome = limparTexto(payload.nome, 120);
  const email = validarLogin(payload.email);
  const senha = validarSenha(payload.senha);
  const codigo = String(payload.codigo || '').trim().toUpperCase();
  assert(nome.length >= 2, 'NOME_INVALIDO', 'Informe o nome do administrador.');
  assert(codigo, 'CODIGO_OBRIGATORIO', 'Informe o código de configuração inicial.');

  return withLock(function () {
    const admins = contarAdmins();
    if (admins > 0) fail('SETUP_INDISPONIVEL', 'O sistema já possui administrador. A configuração inicial está encerrada.');
    const cfg = getConfigMap();
    const hash = String(cfg.SETUP_CODE_HASH || '').trim();
    const usado = String(cfg.SETUP_USADO_EM || '').trim();
    if (!hash || usado) fail('SETUP_INDISPONIVEL', 'A configuração inicial não está habilitada. Solicite um novo código.');
    if (!iguaisSeguro(codigoHash(codigo), hash)) {
      cachePut('setup_fail', String(falhas + 1), BLOQUEIO_LOGIN_SEGUNDOS);
      fail('CODIGO_INVALIDO', 'Código de configuração inválido.');
    }
    const usuarios = lerTodosUsuarios();
    for (let i = 0; i < usuarios.length; i++) {
      if (normalizarEmail(usuarios[i].EMAIL) === email) fail('EMAIL_EM_USO', 'Já existe uma conta com esse usuário/e-mail.');
    }
    const salt = Utilities.getUuid() + Utilities.getUuid();
    const agora = nowStamp();
    const u = {
      ID: newId('USR'),
      NOME: nome,
      EMAIL: email,
      SENHA_HASH: hashSenha(senha, salt),
      SENHA_SALT: salt,
      PERFIL: PERFIL.ADMIN,
      STATUS: 'ATIVO',
      CRIADO_EM: agora,
      ATUALIZADO_EM: agora,
      ULTIMO_ACESSO: agora,
      CRIADO_POR: 'SETUP_INICIAL',
      OBSERVACOES: 'Conta de administrador criada na configuração inicial.'
    };
    appendObject(SHEET.USUARIOS, u);
    configSetMany({
      SETUP_CODE_HASH: '',
      SETUP_USADO_EM: agora,
      CONFIGURADO_EM: agora,
      CONFIGURADO_POR: email
    });
    cacheRemove('setup_fail');
    const sess = criarSessao(u, payload.userAgent, requestId);
    audit({ id: u.ID, email: u.EMAIL, perfil: u.PERFIL }, 'SETUP_ADMIN', 'USUARIO', u.ID, { email: email }, requestId);
    // A sincronização inicial roda em segundo plano após o painel abrir.
    return { token: sess.token, expiraEm: sess.expiraEm, usuario: usuarioPublico(u), avisos: [], precisaSincronizacao: true };
  });
}

function recuperarAdmin(payload, requestId) {
  payload = payload || {};
  const falhas = Number(cacheGet('reset_fail') || 0);
  if (falhas >= MAX_TENTATIVAS_SETUP) {
    fail('MUITAS_TENTATIVAS', 'Muitas tentativas. Aguarde 15 minutos.');
  }
  const email = validarEmail(payload.email);
  const senha = validarSenha(payload.senha);
  const codigo = String(payload.codigo || '').trim().toUpperCase();
  assert(codigo, 'CODIGO_OBRIGATORIO', 'Informe o código de recuperação.');
  return withLock(function () {
    const cfg = getConfigMap();
    const hash = String(cfg.RESET_CODE_HASH || '').trim();
    const expira = String(cfg.RESET_EXPIRA_EM || '').trim();
    if (!hash || !expira || expira <= nowStamp()) {
      fail('RECUPERACAO_INDISPONIVEL', 'A recuperação de administrador não está habilitada ou expirou.');
    }
    if (!iguaisSeguro(codigoHash(codigo), hash)) {
      cachePut('reset_fail', String(falhas + 1), BLOQUEIO_LOGIN_SEGUNDOS);
      fail('CODIGO_INVALIDO', 'Código de recuperação inválido.');
    }
    const usuarios = lerTodosUsuarios();
    let u = null;
    for (let i = 0; i < usuarios.length; i++) {
      if (normalizarEmail(usuarios[i].EMAIL) === email) { u = usuarios[i]; break; }
    }
    if (!u || String(u.PERFIL) !== PERFIL.ADMIN || String(u.STATUS) !== 'ATIVO') {
      fail('ADMIN_NAO_ENCONTRADO', 'Não há administrador ativo com esse usuário/e-mail.');
    }
    const salt = Utilities.getUuid() + Utilities.getUuid();
    u.SENHA_HASH = hashSenha(senha, salt);
    u.SENHA_SALT = salt;
    u.ATUALIZADO_EM = nowStamp();
    updateObject(SHEET.USUARIOS, u._row, u);
    revogarSessoesUsuario(u.ID, null);
    configSetMany({ RESET_CODE_HASH: '', RESET_EXPIRA_EM: '' });
    cacheRemove('reset_fail');
    audit({ id: '', email: 'RECUPERACAO', perfil: PERFIL.ADMIN }, 'RECUPERAR_ADMIN', 'USUARIO', u.ID, { email: email }, requestId);
    return { ok: true, mensagem: 'Senha do administrador redefinida. Entre com a nova senha.' };
  });
}

function alterarMinhaSenha(payload, session, requestId) {
  exigirAutenticado(session);
  payload = payload || {};
  const atual = String(payload.senhaAtual || '');
  const nova = validarSenha(payload.novaSenha);
  return withLock(function () {
    const usuarios = lerTodosUsuarios();
    const u = exigirRegistro(porId(usuarios, session.id), 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
    if (!verificarSenha(atual, u.SENHA_SALT, u.SENHA_HASH)) fail('SENHA_ATUAL_INVALIDA', 'A senha atual está incorreta.');
    const salt = Utilities.getUuid() + Utilities.getUuid();
    u.SENHA_HASH = hashSenha(nova, salt);
    u.SENHA_SALT = salt;
    u.ATUALIZADO_EM = nowStamp();
    updateObject(SHEET.USUARIOS, u._row, u);
    revogarSessoesUsuario(u.ID, null);
    const sess = criarSessao(u, payload.userAgent, requestId);
    audit({ id: u.ID, email: u.EMAIL, perfil: u.PERFIL }, 'ALTERAR_SENHA', 'USUARIO', u.ID, null, requestId);
    return { token: sess.token, expiraEm: sess.expiraEm, usuario: usuarioPublico(u) };
  });
}

function listarUsuarios(session, payload) {
  exigirAdmin(session);
  const usuarios = lerTodosUsuarios().map(usuarioPublico);
  usuarios.sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome), 'pt-BR'); });
  return { usuarios: usuarios };
}

function criarUsuario(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const nome = limparTexto(payload.nome, 120);
  const email = validarLogin(payload.email);
  const senha = validarSenha(payload.senha);
  const perfil = String(payload.perfil || PERFIL.COLAB).toUpperCase();
  assert(perfil === PERFIL.ADMIN || perfil === PERFIL.COLAB, 'PERFIL_INVALIDO', 'Perfil inválido.');
  assert(nome.length >= 2, 'NOME_INVALIDO', 'Informe o nome do usuário.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const usuarios = lerTodosUsuarios();
      for (let i = 0; i < usuarios.length; i++) {
        if (normalizarEmail(usuarios[i].EMAIL) === email) fail('EMAIL_EM_USO', 'Já existe uma conta com esse usuário/e-mail.');
      }
      const salt = Utilities.getUuid() + Utilities.getUuid();
      const agora = nowStamp();
      const u = {
        ID: newId('USR'),
        NOME: nome,
        EMAIL: email,
        SENHA_HASH: hashSenha(senha, salt),
        SENHA_SALT: salt,
        PERFIL: perfil,
        STATUS: 'ATIVO',
        CRIADO_EM: agora,
        ATUALIZADO_EM: agora,
        ULTIMO_ACESSO: '',
        CRIADO_POR: session.email,
        OBSERVACOES: limparTexto(payload.observacoes, 1000)
      };
      appendObject(SHEET.USUARIOS, u);
      audit(session, 'CRIAR_USUARIO', 'USUARIO', u.ID, { nome: nome, email: email, perfil: perfil }, requestId);
      return { usuario: usuarioPublico(u) };
    });
  });
}

function editarUsuario(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const id = String(payload.id || '').trim();
  assert(id, 'USUARIO_OBRIGATORIO', 'Informe o usuário.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const usuarios = lerTodosUsuarios();
      const u = exigirRegistro(porId(usuarios, id), 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
      const nome = limparTexto(payload.nome === undefined ? u.NOME : payload.nome, 120);
      const email = validarLogin(payload.email === undefined ? u.EMAIL : payload.email);
      const perfil = String(payload.perfil === undefined ? u.PERFIL : payload.perfil).toUpperCase();
      assert(nome.length >= 2, 'NOME_INVALIDO', 'Informe o nome do usuário.');
      assert(perfil === PERFIL.ADMIN || perfil === PERFIL.COLAB, 'PERFIL_INVALIDO', 'Perfil inválido.');
      for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].ID !== u.ID && normalizarEmail(usuarios[i].EMAIL) === email) fail('EMAIL_EM_USO', 'Já existe uma conta com esse usuário/e-mail.');
      }
      if (String(u.PERFIL) === PERFIL.ADMIN && perfil !== PERFIL.ADMIN) {
        assert(contarAdminsAtivos() > 1, 'ULTIMO_ADMIN', 'Não é possível remover o perfil do último administrador ativo.');
      }
      if (String(u.PERFIL) === PERFIL.ADMIN && String(u.STATUS) === 'ATIVO' && perfil !== PERFIL.ADMIN) {
        assert(contarAdminsAtivos() > 1, 'ULTIMO_ADMIN', 'Não é possível rebaixar o último administrador ativo.');
      }
      const perfilMudou = String(u.PERFIL) !== perfil;
      u.NOME = nome;
      u.EMAIL = email;
      u.PERFIL = perfil;
      u.OBSERVACOES = limparTexto(payload.observacoes === undefined ? u.OBSERVACOES : payload.observacoes, 1000);
      u.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.USUARIOS, u._row, u);
      if (perfilMudou) revogarSessoesUsuario(u.ID, null);
      audit(session, 'EDITAR_USUARIO', 'USUARIO', u.ID, { nome: nome, email: email, perfil: perfil }, requestId);
      return { usuario: usuarioPublico(u) };
    });
  });
}

function resetarSenhaUsuario(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const id = String(payload.id || '').trim();
  const nova = validarSenha(payload.novaSenha);
  assert(id, 'USUARIO_OBRIGATORIO', 'Informe o usuário.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const usuarios = lerTodosUsuarios();
      const u = exigirRegistro(porId(usuarios, id), 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
      const salt = Utilities.getUuid() + Utilities.getUuid();
      u.SENHA_HASH = hashSenha(nova, salt);
      u.SENHA_SALT = salt;
      u.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.USUARIOS, u._row, u);
      revogarSessoesUsuario(u.ID, null);
      audit(session, 'RESETAR_SENHA', 'USUARIO', u.ID, { email: u.EMAIL }, requestId);
      return { ok: true };
    });
  });
}

function bloquearUsuario(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  assert(id, 'USUARIO_OBRIGATORIO', 'Informe o usuário.');
  assert(id !== session.id, 'ACAO_INVALIDA', 'Você não pode bloquear a própria conta.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const usuarios = lerTodosUsuarios();
      const u = exigirRegistro(porId(usuarios, id), 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
      if (String(u.PERFIL) === PERFIL.ADMIN && String(u.STATUS) === 'ATIVO') {
        assert(contarAdminsAtivos() > 1, 'ULTIMO_ADMIN', 'Não é possível bloquear o último administrador ativo.');
      }
      u.STATUS = 'BLOQUEADO';
      u.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.USUARIOS, u._row, u);
      revogarSessoesUsuario(u.ID, null);
      audit(session, 'BLOQUEAR_USUARIO', 'USUARIO', u.ID, { email: u.EMAIL }, requestId);
      return { usuario: usuarioPublico(u) };
    });
  });
}

function desbloquearUsuario(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  assert(id, 'USUARIO_OBRIGATORIO', 'Informe o usuário.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const usuarios = lerTodosUsuarios();
      const u = exigirRegistro(porId(usuarios, id), 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
      u.STATUS = 'ATIVO';
      u.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.USUARIOS, u._row, u);
      audit(session, 'DESBLOQUEAR_USUARIO', 'USUARIO', u.ID, { email: u.EMAIL }, requestId);
      return { usuario: usuarioPublico(u) };
    });
  });
}

function autoCadastro(payload, requestId) {
  payload = payload || {};
  const login = validarLogin(payload.usuario || payload.login || payload.email);
  const senha = validarSenha(payload.senha, SENHA_MIN_AUTO);
  const nome = limparTexto(payload.nome, 120) || login;
  const hora = Utilities.formatDate(new Date(), TZ, 'yyyyMMddHH');
  const rateKey = 'auto_reg_' + hora;
  const qtd = Number(cacheGet(rateKey) || 0);
  if (qtd >= AUTO_CADASTRO_POR_HORA) {
    fail('MUITOS_CADASTROS', 'Muitos cadastros nesta hora. Tente novamente mais tarde.');
  }
  return withLock(function () {
    const usuarios = lerTodosUsuarios();
    for (let i = 0; i < usuarios.length; i++) {
      if (normalizarEmail(usuarios[i].EMAIL) === login) {
        if (String(usuarios[i].STATUS) === 'PENDENTE') {
          fail('CADASTRO_PENDENTE', 'Já existe um cadastro com esse usuário aguardando aprovação do administrador.');
        }
        fail('LOGIN_EM_USO', 'Já existe uma conta com esse usuário/e-mail.');
      }
    }
    const salt = Utilities.getUuid() + Utilities.getUuid();
    const agora = nowStamp();
    const u = {
      ID: newId('USR'),
      NOME: nome,
      EMAIL: login,
      SENHA_HASH: hashSenha(senha, salt),
      SENHA_SALT: salt,
      PERFIL: PERFIL.COLAB,
      STATUS: 'PENDENTE',
      CRIADO_EM: agora,
      ATUALIZADO_EM: agora,
      ULTIMO_ACESSO: '',
      CRIADO_POR: 'AUTO_CADASTRO',
      OBSERVACOES: 'Cadastro enviado pelo próprio usuário. Aguardando aprovação do administrador. Não possui cadastro de colaborador automaticamente.'
    };
    appendObject(SHEET.USUARIOS, u);
    cachePut(rateKey, String(qtd + 1), 3600);
    audit(null, 'AUTO_CADASTRO', 'USUARIO', u.ID, { login: login }, requestId, 'APP');
    return {
      mensagem: 'Cadastro enviado. Aguarde a aprovação do administrador.',
      status: 'PENDENTE',
      login: login
    };
  });
}

function aprovarUsuario(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  assert(id, 'USUARIO_OBRIGATORIO', 'Informe o usuário.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const usuarios = lerTodosUsuarios();
      const u = exigirRegistro(porId(usuarios, id), 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.');
      if (String(u.STATUS) === 'ATIVO') return { usuario: usuarioPublico(u) };
      if (String(u.STATUS) !== 'PENDENTE') {
        fail('USUARIO_BLOQUEADO', 'Este cadastro está bloqueado. Use Desbloquear para liberar o acesso.');
      }
      u.STATUS = 'ATIVO';
      u.ATUALIZADO_EM = nowStamp();
      u.OBSERVACOES = normalizarTexto((u.OBSERVACOES ? u.OBSERVACOES + ' | ' : '') + 'Aprovado por ' + session.email + ' em ' + nowStamp());
      updateObject(SHEET.USUARIOS, u._row, u);
      audit(session, 'APROVAR_USUARIO', 'USUARIO', u.ID, { login: u.EMAIL }, requestId);
      return { usuario: usuarioPublico(u) };
    });
  });
}

/**
 * Função de editor (não exposta na API).
 * Use no Apps Script: Executar > gerarCodigoSetup.
 * O código aparece no log de execução. Ele só funciona se ainda não existir administrador.
 */
function gerarCodigoSetup() {
  const admins = contarAdmins();
  if (admins > 0) throw new Error('Já existe administrador. Use gerarCodigoRecuperacao para redefinir a senha.');
  const codigo = 'CFG-' + Utilities.getUuid().replace(/-/g, '').slice(0, 4).toUpperCase() + '-' + Utilities.getUuid().replace(/-/g, '').slice(4, 8).toUpperCase();
  configSetMany({
    SETUP_CODE_HASH: codigoHash(codigo),
    SETUP_CRIADO_EM: nowStamp(),
    SETUP_USADO_EM: ''
  });
  Logger.log('CÓDIGO DE CONFIGURAÇÃO INICIAL: ' + codigo);
  Logger.log('Válido até a criação do primeiro administrador. Não compartilhe.');
  return codigo;
}

/**
 * Função de editor (não exposta na API).
 * Use no Apps Script: Executar > gerarCodigoRecuperacao.
 * Gera um código de 30 minutos para redefinir a senha de um administrador ativo.
 */
function gerarCodigoRecuperacao() {
  assert(contarAdminsAtivos() > 0, 'SEM_ADMIN', 'Não há administrador ativo para recuperar.');
  const codigo = 'REC-' + Utilities.getUuid().replace(/-/g, '').slice(0, 4).toUpperCase() + '-' + Utilities.getUuid().replace(/-/g, '').slice(4, 8).toUpperCase();
  const expira = Utilities.formatDate(new Date(Date.now() + 30 * 60 * 1000), TZ, 'yyyy-MM-dd HH:mm:ss');
  configSetMany({
    RESET_CODE_HASH: codigoHash(codigo),
    RESET_EXPIRA_EM: expira
  });
  Logger.log('CÓDIGO DE RECUPERAÇÃO DE ADMINISTRADOR: ' + codigo);
  Logger.log('Válido até: ' + expira + ' (horário ' + TZ + '). Não compartilhe.');
  return codigo;
}

/**
 * Função de manutenção (editor): remove sessões expiradas há mais de 30 dias.
 */
function limparSessoesAntigas() {
  const limite = Utilities.formatDate(new Date(Date.now() - 30 * 24 * 3600 * 1000), TZ, 'yyyy-MM-dd HH:mm:ss');
  const sessoes = readObjects(SHEET.SESSOES);
  let removidas = 0;
  sessoes.forEach(function (s) {
    if (String(s.EXPIRA_EM || '') < limite) {
      deleteObject(SHEET.SESSOES, s._row - removidas);
      removidas++;
    }
  });
  Logger.log('Sessões removidas: ' + removidas);
  return removidas;
}


/**
 * Regras de negócio: equipamentos, colaboradores, categorias, empréstimos,
 * devoluções parciais, transferências e manutenção.
 */

function indexarPorId(arr) {
  const m = {};
  (arr || []).forEach(function (x) { if (x && x.ID) m[String(x.ID)] = x; });
  return m;
}

function contexto() {
  const cats = lerTodasCategorias();
  const cols = lerTodosColaboradores();
  const eqs = lerTodosEquipamentos();
  const loans = lerTodosEmprestimos();
  const mans = lerTodasManutencoes();
  return {
    cats: cats,
    cols: cols,
    eqs: eqs,
    loans: loans,
    mans: mans,
    catMap: indexarPorId(cats),
    colMap: indexarPorId(cols),
    eqMap: indexarPorId(eqs)
  };
}

function nomeEquipamento(eq, cat) {
  const categoria = cat ? cat.NOME : (eq.CATEGORIA_NOME || '');
  const detalhe = String(eq.MODELO || eq.CODIGO_MODELO || '').trim();
  const base = detalhe ? (categoria + ' ' + detalhe) : (categoria + ' ' + eq.CODIGO);
  return normalizarTexto(base);
}

function acessoriosTotais(eq) {
  const out = [];
  const cq = toInt(eq.CARREGADOR_QTD);
  const bq = toInt(eq.BATERIA_QTD);
  if (cq > 0 && String(eq.CARREGADOR_CODIGO || '').trim()) {
    out.push({ tipo: 'CARREGADOR', codigo: String(eq.CARREGADOR_CODIGO), codigos: String(eq.CARREGADOR_CODIGO).split('/').map(function (x) { return x.trim(); }).filter(Boolean), qtd: cq });
  }
  if (bq > 0 && String(eq.BATERIA_CODIGO || '').trim()) {
    out.push({ tipo: 'BATERIA', codigo: String(eq.BATERIA_CODIGO), codigos: String(eq.BATERIA_CODIGO).split('/').map(function (x) { return x.trim(); }).filter(Boolean), qtd: bq });
  }
  return out;
}

function somarAcessorios(lista) {
  const out = [];
  (lista || []).forEach(function (a) {
    if (!a || !a.tipo) return;
    const q = toInt(a.qtd);
    if (q <= 0) return;
    const key = String(a.tipo) + '|' + String(a.codigo || '');
    let achou = null;
    for (let i = 0; i < out.length; i++) if (out[i]._key === key) { achou = out[i]; break; }
    if (achou) achou.qtd += q;
    else out.push({ _key: key, tipo: a.tipo, codigo: a.codigo || '', codigos: a.codigos || String(a.codigo || '').split('/').map(function (x) { return x.trim(); }).filter(Boolean), qtd: q });
  });
  return out.map(function (a) { const o = Object.assign({}, a); delete o._key; return o; });
}

function pendentesPorTipo(lista) {
  const m = { CARREGADOR: 0, BATERIA: 0 };
  (lista || []).forEach(function (a) { if (a && a.tipo) m[a.tipo] = (m[a.tipo] || 0) + toInt(a.qtd); });
  return m;
}

function removerAcessorios(pendentes, devolvidos) {
  const restante = (pendentes || []).map(function (a) { return { tipo: a.tipo, codigo: a.codigo, codigos: a.codigos || [], qtd: toInt(a.qtd) }; });
  (devolvidos || []).forEach(function (d) {
    for (let i = 0; i < restante.length; i++) {
      if (String(restante[i].tipo) === String(d.tipo) && String(restante[i].codigo) === String(d.codigo)) {
        restante[i].qtd = Math.max(0, restante[i].qtd - toInt(d.qtd));
      }
    }
  });
  return restante.filter(function (a) { return a.qtd > 0; });
}

function equipamentoView(eq, ctx) {
  const cat = ctx.catMap[eq.CATEGORIA_ID] || null;
  const openLoans = (ctx.loans || []).filter(function (l) { return String(l.EQUIPAMENTO_ID) === String(eq.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO; });
  const loansComQtd = openLoans.filter(function (l) { return toInt(l.QUANTIDADE) > 0; });
  const manOpen = (ctx.mans || []).filter(function (m) { return String(m.EQUIPAMENTO_ID) === String(eq.ID) && (String(m.STATUS) === STATUS_MAN.ABERTA || String(m.STATUS) === STATUS_MAN.EM_ANDAMENTO); })[0] || null;
  const pend = jsonParseSafe(eq.ACESSORIOS_PENDENTES, []);
  const total = toNumber(eq.QUANTIDADE_TOTAL);
  const disp = toNumber(eq.QUANTIDADE_DISPONIVEL);
  const emUso = loansComQtd.reduce(function (s, l) { return s + toInt(l.QUANTIDADE); }, 0);
  const pendTipo = pendentesPorTipo(pend);
  const totalAcc = acessoriosTotais(eq);
  const accDisp = totalAcc.map(function (a) {
    return { tipo: a.tipo, codigo: a.codigo, codigos: a.codigos, qtd: Math.max(0, a.qtd - (pendTipo[a.tipo] || 0)) };
  }).filter(function (a) { return a.qtd > 0; });
  const pendencias = openLoans.map(function (l) {
    const p = jsonParseSafe(l.ACESSORIOS_PENDENTES, []);
    return {
      emprestimoId: l.ID,
      colaboradorId: l.COLABORADOR_ID,
      colaborador: l.COLABORADOR_NOME,
      dataEntrega: l.DATA_ENTREGA,
      quantidade: toInt(l.QUANTIDADE),
      acessorios: p,
      totalItens: p.reduce(function (s, a) { return s + toInt(a.qtd); }, 0)
    };
  }).filter(function (p) { return p.totalItens > 0 || p.quantidade > 0; });
  const status = String(eq.STATUS || '');
  const ativo = status !== STATUS_EQ.INATIVO;
  const podeEntregar = ativo && status !== STATUS_EQ.MANUTENCAO && disp > 0;
  const podeManutencao = ativo && status === STATUS_EQ.DISPONIVEL && disp === total && openLoans.length === 0 && !manOpen;
  return {
    id: eq.ID,
    codigo: eq.CODIGO,
    categoriaId: eq.CATEGORIA_ID,
    categoria: cat ? cat.NOME : eq.CATEGORIA_NOME,
    nome: nomeEquipamento(eq, cat),
    codigoModelo: eq.CODIGO_MODELO || '',
    descricao: eq.DESCRICAO || '',
    marca: eq.MARCA || '',
    modelo: eq.MODELO || '',
    numeroSerie: eq.NUMERO_SERIE || '',
    quantidadeTotal: total,
    quantidadeDisponivel: disp,
    quantidadeEmUso: emUso,
    quantidadeManutencao: status === STATUS_EQ.MANUTENCAO ? total : 0,
    estadoConservacao: eq.ESTADO_CONSERVACAO || 'NAO_INFORMADO',
    estadoOrigem: eq.ESTADO_ORIGEM || '',
    status: status,
    colaboradorAtualId: eq.COLABORADOR_ATUAL_ID || '',
    colaboradorAtual: eq.COLABORADOR_ATUAL_NOME || '',
    dataEntregaAtual: eq.DATA_ENTREGA_ATUAL || '',
    carregador: { codigo: eq.CARREGADOR_CODIGO || '', qtd: toInt(eq.CARREGADOR_QTD) },
    bateria: { codigo: eq.BATERIA_CODIGO || '', qtd: toInt(eq.BATERIA_QTD) },
    acessorios: totalAcc,
    acessoriosDisponiveis: accDisp,
    acessoriosPendentes: pend,
    pendencias: pendencias,
    temPendencia: pend.length > 0,
    observacoes: eq.OBSERVACOES || '',
    origemAba: eq.ORIGEM_ABA || '',
    origemLinha: eq.ORIGEM_LINHA || '',
    origemNumero: eq.ORIGEM_NUMERO || '',
    revisar: String(eq.REVISAR) === 'SIM',
    motivoRevisao: eq.MOTIVO_REVISAO || '',
    criadoEm: eq.CRIADO_EM || '',
    atualizadoEm: eq.ATUALIZADO_EM || '',
    emprestimosAbertos: openLoans.length,
    manutencaoAberta: manOpen ? manutencaoView(manOpen, ctx) : null,
    podeEntregar: podeEntregar,
    podeDevolver: openLoans.length > 0,
    podeTransferir: loansComQtd.length > 0,
    podeManutencao: podeManutencao,
    podeInativar: ativo && openLoans.length === 0 && !manOpen,
    podeReativar: status === STATUS_EQ.INATIVO,
    podeExcluir: false
  };
}

function emprestimoView(l, ctx) {
  const eq = ctx.eqMap[l.EQUIPAMENTO_ID] || null;
  const pend = jsonParseSafe(l.ACESSORIOS_PENDENTES, []);
  return {
    id: l.ID,
    equipamentoId: l.EQUIPAMENTO_ID,
    equipamentoCodigo: l.EQUIPAMENTO_CODIGO,
    equipamentoNome: l.EQUIPAMENTO_NOME || (eq ? eq.CODIGO : ''),
    colaboradorId: l.COLABORADOR_ID,
    colaboradorNome: l.COLABORADOR_NOME,
    dataEntrega: l.DATA_ENTREGA || '',
    quantidade: toInt(l.QUANTIDADE),
    estadoEntrega: l.ESTADO_ENTREGA || '',
    acessoriosEntregues: jsonParseSafe(l.ACESSORIOS_ENTREGUES, []),
    acessoriosPendentes: pend,
    totalPendente: pend.reduce(function (s, a) { return s + toInt(a.qtd); }, 0),
    equipamentoDevolvido: String(l.EQUIPAMENTO_DEVOLVIDO) === 'SIM',
    dataDevolucaoEquipamento: l.DATA_DEVOLUCAO_EQUIPAMENTO || '',
    status: l.STATUS,
    origem: l.ORIGEM || '',
    observacoes: l.OBSERVACOES || '',
    criadoEm: l.CRIADO_EM || '',
    podeDevolver: String(l.STATUS) === STATUS_LOAN.ABERTO,
    podeTransferir: String(l.STATUS) === STATUS_LOAN.ABERTO && toInt(l.QUANTIDADE) > 0
  };
}

function manutencaoView(m, ctx) {
  const eq = ctx.eqMap[m.EQUIPAMENTO_ID] || null;
  return {
    id: m.ID,
    equipamentoId: m.EQUIPAMENTO_ID,
    equipamentoCodigo: m.EQUIPAMENTO_CODIGO,
    equipamentoNome: eq ? nomeEquipamento(eq, ctx.catMap[eq.CATEGORIA_ID]) : (m.EQUIPAMENTO_CODIGO || ''),
    categoriaNome: m.CATEGORIA_NOME || '',
    dataEnvio: m.DATA_ENVIO || '',
    defeito: m.DEFEITO || '',
    responsavel: m.RESPONSAVEL || '',
    celularResponsavel: m.CELULAR_RESPONSAVEL || '',
    status: m.STATUS,
    servico: m.SERVICO || '',
    custo: m.CUSTO === '' || m.CUSTO === null || m.CUSTO === undefined ? '' : toNumber(m.CUSTO),
    previsaoRetorno: m.PREVISAO_RETORNO || '',
    dataRetorno: m.DATA_RETORNO || '',
    estadoRetorno: m.ESTADO_RETORNO || '',
    observacoes: m.OBSERVACOES || '',
    origem: m.ORIGEM || '',
    criadoEm: m.CRIADO_EM || '',
    atualizadoEm: m.ATUALIZADO_EM || '',
    revisar: String(m.REVISAR) === 'SIM',
    motivoRevisao: m.MOTIVO_REVISAO || '',
    aberta: String(m.STATUS) === STATUS_MAN.ABERTA || String(m.STATUS) === STATUS_MAN.EM_ANDAMENTO
  };
}

function movimentoView(m) {
  return {
    id: m.ID,
    data: m.DATA || '',
    tipo: m.TIPO,
    equipamentoId: m.EQUIPAMENTO_ID,
    equipamentoCodigo: m.EQUIPAMENTO_CODIGO,
    categoriaNome: m.CATEGORIA_NOME,
    quantidade: toInt(m.QUANTIDADE),
    colaboradorOrigemId: m.COLABORADOR_ORIGEM_ID || '',
    colaboradorOrigemNome: m.COLABORADOR_ORIGEM_NOME || '',
    colaboradorDestinoId: m.COLABORADOR_DESTINO_ID || '',
    colaboradorDestinoNome: m.COLABORADOR_DESTINO_NOME || '',
    estadoConservacao: m.ESTADO_CONSERVACAO || '',
    acessoriosEntregues: jsonParseSafe(m.ACESSORIOS_ENTREGUES, []),
    acessoriosDevolvidos: jsonParseSafe(m.ACESSORIOS_DEVOLVIDOS, []),
    acessoriosPendentes: jsonParseSafe(m.ACESSORIOS_PENDENTES, []),
    observacoes: m.OBSERVACOES || '',
    emprestimoId: m.EMPRESTIMO_ID || '',
    manutencaoId: m.MANUTENCAO_ID || '',
    usuarioEmail: m.USUARIO_EMAIL || '',
    origem: m.ORIGEM || '',
    criadoEm: m.CRIADO_EM || ''
  };
}

function categoriaView(c, ctx) {
  const eqs = ctx.eqs.filter(function (e) { return String(e.CATEGORIA_ID) === String(c.ID) && String(e.STATUS) !== STATUS_EQ.INATIVO; });
  const total = eqs.reduce(function (s, e) { return s + toNumber(e.QUANTIDADE_TOTAL); }, 0);
  const disp = eqs.reduce(function (s, e) { return s + toNumber(e.QUANTIDADE_DISPONIVEL); }, 0);
  const man = eqs.filter(function (e) { return String(e.STATUS) === STATUS_EQ.MANUTENCAO; }).reduce(function (s, e) { return s + toNumber(e.QUANTIDADE_TOTAL); }, 0);
  return {
    id: c.ID,
    nome: c.NOME,
    nomeAba: c.NOME_ABA || '',
    campoItem: c.CAMPO_ITEM || 'ITEM',
    prefixo: c.PREFIXO || '',
    ordem: toInt(c.ORDEM),
    ativo: String(c.ATIVO) === 'SIM',
    observacaoOrigem: c.OBSERVACAO_ORIGEM || '',
    observacaoImportacao: c.OBSERVACAO_IMPORTACAO || '',
    criadoEm: c.CRIADO_EM || '',
    atualizadoEm: c.ATUALIZADO_EM || '',
    quantidadeEquipamentos: eqs.length,
    quantidadeTotal: total,
    quantidadeDisponivel: disp,
    quantidadeEntregue: Math.max(0, total - disp - man),
    quantidadeManutencao: man
  };
}

function colaboradorView(c, ctx) {
  const eqs = ctx.eqs.filter(function (e) {
    return String(e.COLABORADOR_ATUAL_ID) === String(c.ID) && String(e.STATUS) !== STATUS_EQ.INATIVO;
  });
  const loans = ctx.loans.filter(function (l) {
    return String(l.COLABORADOR_ID) === String(c.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO;
  });
  const pend = loans.reduce(function (s, l) {
    return s + jsonParseSafe(l.ACESSORIOS_PENDENTES, []).reduce(function (x, a) { return x + toInt(a.qtd); }, 0);
  }, 0);
  const eqIds = {};
  eqs.forEach(function (e) { eqIds[e.ID] = true; });
  const pendEqIds = {};
  loans.forEach(function (l) { if (jsonParseSafe(l.ACESSORIOS_PENDENTES, []).length) pendEqIds[l.EQUIPAMENTO_ID] = true; });
  return {
    id: c.ID,
    nome: c.NOME,
    tipo: c.TIPO || 'NAO_INFORMADO',
    funcao: c.FUNCAO || '',
    telefone: c.TELEFONE || '',
    email: c.EMAIL || '',
    localObra: c.LOCAL_OBRA || '',
    setor: c.SETOR || '',
    ativo: String(c.ATIVO) === 'SIM',
    observacoes: c.OBSERVACOES || '',
    origem: c.ORIGEM || '',
    criadoEm: c.CRIADO_EM || '',
    atualizadoEm: c.ATUALIZADO_EM || '',
    equipamentosAtuais: Object.keys(eqIds).length,
    emprestimosAbertos: loans.filter(function (l) { return toInt(l.QUANTIDADE) > 0; }).length,
    acessoriosPendentes: pend,
    equipamentosComPendencia: Object.keys(pendEqIds).length
  };
}

function compararDataDesc(a, b) {
  const da = String(a.DATA || '');
  const db = String(b.DATA || '');
  if (da && db && da !== db) return db.localeCompare(da);
  if (da && !db) return -1;
  if (!da && db) return 1;
  return String(b.CRIADO_EM || '').localeCompare(String(a.CRIADO_EM || ''));
}

function dashboardData(session) {
  const ctx = contexto();
  const ativos = ctx.eqs.filter(function (e) { return String(e.STATUS) !== STATUS_EQ.INATIVO; });
  const disponiveis = ativos.reduce(function (s, e) { return s + toNumber(e.QUANTIDADE_DISPONIVEL); }, 0);
  const manutencao = ativos.filter(function (e) { return String(e.STATUS) === STATUS_EQ.MANUTENCAO; }).reduce(function (s, e) { return s + toNumber(e.QUANTIDADE_TOTAL); }, 0);
  const openLoans = ctx.loans.filter(function (l) { return String(l.STATUS) === STATUS_LOAN.ABERTO; });
  const entregues = openLoans.reduce(function (s, l) { return s + toInt(l.QUANTIDADE); }, 0);
  const pendDevolucao = openLoans.filter(function (l) { return toInt(l.QUANTIDADE) > 0; }).length;
  const pendAccLoans = openLoans.filter(function (l) { return jsonParseSafe(l.ACESSORIOS_PENDENTES, []).length > 0; });
  const pendAccItens = pendAccLoans.reduce(function (s, l) {
    return s + jsonParseSafe(l.ACESSORIOS_PENDENTES, []).reduce(function (x, a) { return x + toInt(a.qtd); }, 0);
  }, 0);
  const revisar = ativos.filter(function (e) { return String(e.REVISAR) === 'SIM'; }).length;
  const categorias = ctx.cats.map(function (c) { return categoriaView(c, ctx); }).sort(function (a, b) { return (a.ordem || 99) - (b.ordem || 99); });
  const colaboradores = ctx.cols.map(function (c) { return colaboradorView(c, ctx); }).sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome), 'pt-BR'); });
  const equipamentos = ctx.eqs.map(function (e) { return equipamentoView(e, ctx); }).sort(function (a, b) {
    const ca = (ctx.catMap[a.categoriaId] && toInt(ctx.catMap[a.categoriaId].ORDEM)) || 99;
    const cb = (ctx.catMap[b.categoriaId] && toInt(ctx.catMap[b.categoriaId].ORDEM)) || 99;
    if (ca !== cb) return ca - cb;
    return String(a.codigo).localeCompare(String(b.codigo), 'pt-BR');
  });
  const manutencoesAbertas = ctx.mans.filter(function (m) {
    return String(m.STATUS) === STATUS_MAN.ABERTA || String(m.STATUS) === STATUS_MAN.EM_ANDAMENTO;
  }).map(function (m) { return manutencaoView(m, ctx); }).sort(compararDataDesc);
  const emprestimosAbertos = openLoans.map(function (l) { return emprestimoView(l, ctx); }).sort(function (a, b) {
    return String(b.dataEntrega || '').localeCompare(String(a.dataEntrega || ''));
  });
  const movs = lerTodosMovimentos().map(movimentoView).sort(compararDataDesc);
  const avisos = [];
  categorias.forEach(function (c) {
    if (c.observacaoImportacao) avisos.push({ tipo: 'IMPORTACAO', titulo: c.nome, texto: c.observacaoImportacao });
  });
  if (revisar > 0) avisos.push({ tipo: 'REVISAO', titulo: 'Equipamentos para revisar', texto: revisar + ' equipamento(s) com informação ambígua na origem. Abra a ficha e confira.' });
  const porCategoria = categorias.filter(function (c) { return c.ativo || c.quantidadeEquipamentos > 0; }).map(function (c) {
    return { id: c.id, nome: c.nome, total: c.quantidadeTotal, disponivel: c.quantidadeDisponivel, entregue: c.quantidadeEntregue, manutencao: c.quantidadeManutencao, revisar: ctx.eqs.filter(function (e) { return String(e.CATEGORIA_ID) === String(c.id) && String(e.REVISAR) === 'SIM' && String(e.STATUS) !== STATUS_EQ.INATIVO; }).length };
  });
  const data = {
    usuario: { id: session.id, nome: session.nome, email: session.email, perfil: session.perfil },
    config: { appNome: APP_NOME, versao: API_VERSAO },
    stats: {
      totalEquipamentos: ativos.length,
      totalItens: ativos.reduce(function (s, e) { return s + toNumber(e.QUANTIDADE_TOTAL); }, 0),
      disponiveis: disponiveis,
      entregues: entregues,
      manutencao: manutencao,
      inativos: ctx.eqs.filter(function (e) { return String(e.STATUS) === STATUS_EQ.INATIVO; }).length,
      pendenciasDevolucao: pendDevolucao,
      pendenciasAcessorios: pendAccLoans.length,
      itensPendentesAcessorios: pendAccItens,
      revisar: revisar,
      categoriasComObservacao: categorias.filter(function (c) { return !!c.observacaoImportacao; }).length
    },
    categorias: categorias,
    colaboradores: colaboradores,
    equipamentos: equipamentos,
    emprestimosAbertos: emprestimosAbertos,
    manutencoesAbertas: manutencoesAbertas,
    movimentacoesRecentes: movs.slice(0, 10),
    porCategoria: porCategoria,
    avisos: avisos,
    atualizadoEm: nowStamp()
  };
  if (session.perfil === PERFIL.ADMIN) {
    // A sincronização inicial não bloqueia mais a abertura do app.
    // O frontend a executa em segundo plano depois que o painel já está visível.
    data.precisaSincronizacao = configGet('SINCRONIZACAO_INICIAL') !== 'OK';
    data.usuarios = lerTodosUsuarios().map(usuarioPublico).sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome), 'pt-BR'); });
  }
  return data;
}

function detalheEquipamento(payload, session) {
  exigirAutenticado(session);
  const id = String((payload || {}).id || '').trim();
  const ctx = contexto();
  const eq = exigirRegistro(porId(ctx.eqs, id), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
  const loans = ctx.loans.filter(function (l) { return String(l.EQUIPAMENTO_ID) === String(id); }).map(function (l) { return emprestimoView(l, ctx); }).sort(compararDataDesc);
  const mans = ctx.mans.filter(function (m) { return String(m.EQUIPAMENTO_ID) === String(id); }).map(function (m) { return manutencaoView(m, ctx); }).sort(compararDataDesc);
  const movs = lerTodosMovimentos().filter(function (m) { return String(m.EQUIPAMENTO_ID) === String(id); }).map(movimentoView).sort(compararDataDesc);
  const view = equipamentoView(eq, ctx);
  view.podeExcluir = loans.length === 0 && mans.length === 0 && movs.length === 0;
  return { equipamento: view, emprestimos: loans, manutencoes: mans, movimentacoes: movs };
}

function listarMovimentacoes(payload, session) {
  exigirAutenticado(session);
  payload = payload || {};
  const page = Math.max(1, toInt(payload.page) || 1);
  const pageSize = Math.min(100, Math.max(10, toInt(payload.pageSize) || 25));
  const tipo = String(payload.tipo || '').toUpperCase();
  const eqId = String(payload.equipamentoId || '');
  const colId = String(payload.colaboradorId || '');
  const busca = normalizarKey(payload.busca || '');
  const ini = String(payload.dataInicio || '');
  const fim = String(payload.dataFim || '');
  let arr = lerTodosMovimentos().map(movimentoView);
  if (tipo) arr = arr.filter(function (m) { return String(m.tipo) === tipo; });
  if (eqId) arr = arr.filter(function (m) { return String(m.equipamentoId) === eqId; });
  if (colId) arr = arr.filter(function (m) { return String(m.colaboradorOrigemId) === colId || String(m.colaboradorDestinoId) === colId; });
  if (ini) arr = arr.filter(function (m) { return m.data && m.data >= ini; });
  if (fim) arr = arr.filter(function (m) { return m.data && m.data <= fim; });
  if (busca) arr = arr.filter(function (m) { return normalizarKey([m.equipamentoCodigo, m.categoriaNome, m.colaboradorOrigemNome, m.colaboradorDestinoNome, m.observacoes].join(' ')).indexOf(busca) >= 0; });
  arr.sort(compararDataDesc);
  const total = arr.length;
  const items = arr.slice((page - 1) * pageSize, page * pageSize);
  return { items: items, total: total, page: page, pageSize: pageSize, totalPaginas: Math.max(1, Math.ceil(total / pageSize)) };
}

function listarManutencoes(payload, session) {
  exigirAutenticado(session);
  payload = payload || {};
  const ctx = contexto();
  const status = String(payload.status || '').toUpperCase();
  const busca = normalizarKey(payload.busca || '');
  let arr = ctx.mans.map(function (m) { return manutencaoView(m, ctx); });
  if (status) arr = arr.filter(function (m) { return String(m.status) === status; });
  if (payload.equipamentoId) arr = arr.filter(function (m) { return String(m.equipamentoId) === String(payload.equipamentoId); });
  if (busca) arr = arr.filter(function (m) { return normalizarKey([m.equipamentoCodigo, m.equipamentoNome, m.defeito, m.responsavel, m.servico, m.observacoes].join(' ')).indexOf(busca) >= 0; });
  arr.sort(compararDataDesc);
  return { items: arr, total: arr.length };
}

function listarAuditoria(payload, session) {
  exigirAdmin(session);
  payload = payload || {};
  const page = Math.max(1, toInt(payload.page) || 1);
  const pageSize = Math.min(100, Math.max(10, toInt(payload.pageSize) || 30));
  const busca = normalizarKey(payload.busca || '');
  let arr = readObjects(SHEET.AUDITORIA);
  if (busca) arr = arr.filter(function (a) { return normalizarKey([a.USUARIO_EMAIL, a.ACAO, a.ENTIDADE, a.ENTIDADE_ID, a.DETALHES].join(' ')).indexOf(busca) >= 0; });
  arr.sort(function (a, b) { return String(b.DATA || '').localeCompare(String(a.DATA || '')); });
  const total = arr.length;
  return { items: arr.slice((page - 1) * pageSize, page * pageSize), total: total, page: page, pageSize: pageSize, totalPaginas: Math.max(1, Math.ceil(total / pageSize)) };
}

/* =========================== ESCRITAS =========================== */

function codigoUnico(codigo, excetoId) {
  const c = String(codigo || '').trim().toUpperCase();
  if (!c) return true;
  const eqs = lerTodosEquipamentos();
  for (let i = 0; i < eqs.length; i++) {
    if (String(eqs[i].ID) === String(excetoId || '')) continue;
    if (String(eqs[i].CODIGO || '').trim().toUpperCase() === c) return false;
  }
  return true;
}

function proximoCodigo(cat) {
  const eqs = lerTodosEquipamentos().filter(function (e) { return String(e.CATEGORIA_ID) === String(cat.ID); });
  let max = 0;
  eqs.forEach(function (e) {
    const m = String(e.CODIGO || '').match(/-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  const seq = String(max + 1).padStart(3, '0');
  return String(cat.PREFIXO || 'EQP') + '-' + seq;
}

function validarConservacao(v, padrao) {
  const s = String(v || padrao || 'NAO_INFORMADO').trim().toUpperCase();
  assert(CONSERVACAO.indexOf(s) >= 0, 'CONSERVACAO_INVALIDA', 'Estado de conservação inválido.');
  return s;
}

function categoriaAtiva(id) {
  const c = porId(lerTodasCategorias(), id);
  if (!c) fail('CATEGORIA_NAO_ENCONTRADA', 'Categoria não encontrada.');
  if (String(c.ATIVO) !== 'SIM') fail('CATEGORIA_INATIVA', 'A categoria está inativa.');
  return c;
}

function colaboradorAtivo(id) {
  const c = porId(lerTodosColaboradores(), id);
  if (!c) fail('COLABORADOR_NAO_ENCONTRADO', 'Colaborador não encontrado.');
  if (String(c.ATIVO) !== 'SIM') fail('COLABORADOR_INATIVO', 'O colaborador está inativo.');
  return c;
}

function criarEquipamento(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const cat = categoriaAtiva(payload.categoriaId);
  const total = Math.max(1, Math.min(9999, toInt(payload.quantidadeTotal) || 1));
  const conservacao = validarConservacao(payload.estadoConservacao, 'NAO_INFORMADO');
  const codigoInformado = limparTexto(payload.codigo, 40).toUpperCase();
  const codigo = codigoInformado || proximoCodigo(cat);
  assert(codigoUnico(codigo, null), 'CODIGO_EM_USO', 'Já existe um equipamento com esse código.');
  const carCod = limparTexto(payload.carregadorCodigo, 80);
  const batCod = limparTexto(payload.bateriaCodigo, 120);
  const carQtd = Math.max(0, Math.min(99, toInt(payload.carregadorQtd) || 0));
  const batQtd = Math.max(0, Math.min(99, toInt(payload.bateriaQtd) || 0));
  if (carQtd > 0) assert(carCod, 'ACESSORIO_INVALIDO', 'Informe o código do carregador ou zere a quantidade.');
  if (batQtd > 0) assert(batCod, 'ACESSORIO_INVALIDO', 'Informe o código da bateria ou zere a quantidade.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const agora = nowStamp();
      const eq = {
        ID: newId('EQP'),
        CODIGO: codigo,
        CATEGORIA_ID: cat.ID,
        CATEGORIA_NOME: cat.NOME,
        CODIGO_MODELO: limparTexto(payload.codigoModelo, 160),
        DESCRICAO: limparTexto(payload.descricao, 300),
        MARCA: limparTexto(payload.marca, 80),
        MODELO: limparTexto(payload.modelo, 160),
        NUMERO_SERIE: limparTexto(payload.numeroSerie, 120),
        QUANTIDADE_TOTAL: total,
        QUANTIDADE_DISPONIVEL: total,
        ESTADO_CONSERVACAO: conservacao,
        ESTADO_ORIGEM: '',
        STATUS: STATUS_EQ.DISPONIVEL,
        COLABORADOR_ATUAL_ID: '',
        COLABORADOR_ATUAL_NOME: '',
        CARREGADOR_CODIGO: carCod,
        CARREGADOR_QTD: carQtd,
        BATERIA_CODIGO: batCod,
        BATERIA_QTD: batQtd,
        DATA_ENTREGA_ATUAL: '',
        ACESSORIOS_PENDENTES: '[]',
        OBSERVACOES: limparTexto(payload.observacoes, 2000),
        ORIGEM_ABA: '',
        ORIGEM_LINHA: '',
        ORIGEM_NUMERO: '',
        REVISAR: 'NAO',
        MOTIVO_REVISAO: '',
        CRIADO_EM: agora,
        ATUALIZADO_EM: agora,
        CRIADO_POR: session.email,
        ATUALIZADO_POR: session.email
      };
      appendObject(SHEET.EQUIPAMENTOS, eq);
      const eq2 = porId(lerTodosEquipamentos(), eq.ID);
      const sync = sincronizarEquipamentoSeguro(eq2, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Equipamento salvo no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      audit(session, 'CRIAR_EQUIPAMENTO', 'EQUIPAMENTO', eq.ID, { codigo: eq.CODIGO, categoria: cat.NOME, total: total }, requestId);
      const ctx = contexto();
      return { equipamento: equipamentoView(porId(ctx.eqs, eq.ID), ctx), avisos: avisos };
    });
  });
}

function editarEquipamento(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const id = String(payload.id || '').trim();
  assert(id, 'EQUIPAMENTO_OBRIGATORIO', 'Informe o equipamento.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const eq = exigirRegistro(porId(ctx.eqs, id), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      const catAnterior = ctx.catMap[eq.CATEGORIA_ID] || null;
      const categoriaMudou = payload.categoriaId !== undefined && String(payload.categoriaId) !== String(eq.CATEGORIA_ID);
      const abaAntiga = String(eq.ORIGEM_ABA || '');
      const linhaAntiga = toInt(eq.ORIGEM_LINHA);
      let cat = catAnterior;
      if (payload.categoriaId !== undefined && String(payload.categoriaId) !== String(eq.CATEGORIA_ID)) {
        cat = categoriaAtiva(payload.categoriaId);
      }
      if (!cat) fail('CATEGORIA_NAO_ENCONTRADA', 'Categoria do equipamento não encontrada.');
      const codigo = payload.codigo === undefined ? String(eq.CODIGO) : limparTexto(payload.codigo, 40).toUpperCase();
      assert(codigo, 'CODIGO_OBRIGATORIO', 'Informe o código do equipamento.');
      assert(codigoUnico(codigo, eq.ID), 'CODIGO_EM_USO', 'Já existe um equipamento com esse código.');
      const status = String(eq.STATUS || '');
      const totalAnterior = toNumber(eq.QUANTIDADE_TOTAL);
      const dispAnterior = toNumber(eq.QUANTIDADE_DISPONIVEL);
      const emUso = Math.max(0, totalAnterior - dispAnterior);
      let total = payload.quantidadeTotal === undefined ? totalAnterior : Math.max(1, Math.min(9999, toInt(payload.quantidadeTotal)));
      if (total !== totalAnterior) {
        assert(status !== STATUS_EQ.MANUTENCAO, 'EQUIPAMENTO_MANUTENCAO', 'Não altere a quantidade enquanto o equipamento estiver em manutenção.');
        assert(total >= emUso, 'QUANTIDADE_INVALIDA', 'A quantidade total não pode ser menor que a quantidade em uso (' + emUso + ').');
      }
      const carCod = payload.carregadorCodigo === undefined ? String(eq.CARREGADOR_CODIGO || '') : limparTexto(payload.carregadorCodigo, 80);
      const batCod = payload.bateriaCodigo === undefined ? String(eq.BATERIA_CODIGO || '') : limparTexto(payload.bateriaCodigo, 120);
      const carQtd = payload.carregadorQtd === undefined ? toInt(eq.CARREGADOR_QTD) : Math.max(0, Math.min(99, toInt(payload.carregadorQtd)));
      const batQtd = payload.bateriaQtd === undefined ? toInt(eq.BATERIA_QTD) : Math.max(0, Math.min(99, toInt(payload.bateriaQtd)));
      if (carQtd > 0) assert(carCod, 'ACESSORIO_INVALIDO', 'Informe o código do carregador ou zere a quantidade.');
      if (batQtd > 0) assert(batCod, 'ACESSORIO_INVALIDO', 'Informe o código da bateria ou zere a quantidade.');
      const pend = jsonParseSafe(eq.ACESSORIOS_PENDENTES, []);
      const pt = pendentesPorTipo(pend);
      if (carQtd < (pt.CARREGADOR || 0)) fail('ACESSORIO_PENDENTE', 'A quantidade de carregadores é menor que a pendência atual (' + (pt.CARREGADOR || 0) + ').');
      if (batQtd < (pt.BATERIA || 0)) fail('ACESSORIO_PENDENTE', 'A quantidade de baterias é menor que a pendência atual (' + (pt.BATERIA || 0) + ').');
      if (carCod !== String(eq.CARREGADOR_CODIGO || '') && (pt.CARREGADOR || 0) > 0) fail('ACESSORIO_PENDENTE', 'Há carregador pendente; devolva antes de trocar o código.');
      if (batCod !== String(eq.BATERIA_CODIGO || '') && (pt.BATERIA || 0) > 0) fail('ACESSORIO_PENDENTE', 'Há bateria pendente; devolva antes de trocar o código.');
      const antes = { codigo: eq.CODIGO, total: totalAnterior, categoria: eq.CATEGORIA_ID, conservacao: eq.ESTADO_CONSERVACAO };
      eq.CODIGO = codigo;
      eq.CATEGORIA_ID = cat.ID;
      eq.CATEGORIA_NOME = cat.NOME;
      eq.CODIGO_MODELO = payload.codigoModelo === undefined ? eq.CODIGO_MODELO : limparTexto(payload.codigoModelo, 160);
      eq.DESCRICAO = payload.descricao === undefined ? eq.DESCRICAO : limparTexto(payload.descricao, 300);
      eq.MARCA = payload.marca === undefined ? eq.MARCA : limparTexto(payload.marca, 80);
      eq.MODELO = payload.modelo === undefined ? eq.MODELO : limparTexto(payload.modelo, 160);
      eq.NUMERO_SERIE = payload.numeroSerie === undefined ? eq.NUMERO_SERIE : limparTexto(payload.numeroSerie, 120);
      eq.QUANTIDADE_TOTAL = total;
      eq.ESTADO_CONSERVACAO = payload.estadoConservacao === undefined ? eq.ESTADO_CONSERVACAO : validarConservacao(payload.estadoConservacao, eq.ESTADO_CONSERVACAO);
      eq.CARREGADOR_CODIGO = carCod;
      eq.CARREGADOR_QTD = carQtd;
      eq.BATERIA_CODIGO = batCod;
      eq.BATERIA_QTD = batQtd;
      eq.OBSERVACOES = payload.observacoes === undefined ? eq.OBSERVACOES : limparTexto(payload.observacoes, 2000);
      if (total !== totalAnterior) {
        const diff = total - totalAnterior;
        if (status === STATUS_EQ.INATIVO) eq.QUANTIDADE_DISPONIVEL = total;
        else eq.QUANTIDADE_DISPONIVEL = Math.max(0, dispAnterior + diff);
      }
      eq.ATUALIZADO_EM = nowStamp();
      eq.ATUALIZADO_POR = session.email;
      if (categoriaMudou) {
        eq.ORIGEM_ABA = '';
        eq.ORIGEM_LINHA = '';
        eq.ORIGEM_NUMERO = '';
      }
      if (status !== STATUS_EQ.INATIVO && status !== STATUS_EQ.MANUTENCAO) {
        atualizarDerivados(eq, ctx.loans, ctx.mans);
      }
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      let avisoLimpeza = '';
      if (categoriaMudou) {
        try { limparLinhaAba(abaAntiga, linhaAntiga); } catch (e) { avisoLimpeza = 'A linha antiga da aba ' + abaAntiga + ' não pôde ser limpa: ' + e.message; }
      }
      if (String(antes.codigo) !== String(eq.CODIGO) || String(antes.categoria) !== String(eq.CATEGORIA_ID)) {
        const eqNome = nomeEquipamento(eq, cat);
        ctx.loans.forEach(function (l) {
          if (String(l.EQUIPAMENTO_ID) === String(eq.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO) {
            l.EQUIPAMENTO_CODIGO = eq.CODIGO;
            l.EQUIPAMENTO_NOME = eqNome;
            updateObject(SHEET.EMPRESTIMOS, l._row, l);
          }
        });
      }
      audit(session, 'EDITAR_EQUIPAMENTO', 'EQUIPAMENTO', eq.ID, { antes: antes, depois: { codigo: eq.CODIGO, total: total, categoria: eq.CATEGORIA_ID, conservacao: eq.ESTADO_CONSERVACAO } }, requestId);
      const eqAtual = porId(lerTodosEquipamentos(), eq.ID);
      const sync = sincronizarEquipamentoSeguro(eqAtual, { session: session, requestId: requestId });
      const avisos = [];
      if (avisoLimpeza) avisos.push(avisoLimpeza);
      if (!sync.ok) avisos.push('Equipamento salvo no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.');
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), avisos: avisos };
    });
  });
}

function marcarRevisadoEquipamento(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const eq = exigirRegistro(porId(ctx.eqs, id), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      const obs = limparTexto((payload || {}).observacao, 500);
      eq.REVISAR = 'NAO';
      eq.MOTIVO_REVISAO = normalizarTexto((eq.MOTIVO_REVISAO ? eq.MOTIVO_REVISAO + ' | ' : '') + 'Revisado por ' + session.email + ' em ' + nowStamp() + (obs ? ': ' + obs : ''));
      eq.ATUALIZADO_EM = nowStamp();
      eq.ATUALIZADO_POR = session.email;
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      audit(session, 'REVISAR_EQUIPAMENTO', 'EQUIPAMENTO', eq.ID, { observacao: obs }, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2) };
    });
  });
}

function inativarEquipamento(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  const motivo = limparTexto((payload || {}).motivo, 500);
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const eq = exigirRegistro(porId(ctx.eqs, id), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      if (String(eq.STATUS) === STATUS_EQ.INATIVO) fail('EQUIPAMENTO_INATIVO', 'O equipamento já está inativo.');
      const loans = ctx.loans.filter(function (l) { return String(l.EQUIPAMENTO_ID) === String(eq.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO; });
      if (loans.length) fail('EQUIPAMENTO_EM_USO', 'Não é possível inativar: há empréstimo ou acessório pendente. Registre a devolução primeiro.');
      const man = ctx.mans.filter(function (m) { return String(m.EQUIPAMENTO_ID) === String(eq.ID) && (String(m.STATUS) === STATUS_MAN.ABERTA || String(m.STATUS) === STATUS_MAN.EM_ANDAMENTO); });
      if (man.length) fail('EQUIPAMENTO_MANUTENCAO', 'Não é possível inativar um equipamento em manutenção.');
      eq.STATUS = STATUS_EQ.INATIVO;
      eq.ATUALIZADO_EM = nowStamp();
      eq.ATUALIZADO_POR = session.email;
      if (motivo) eq.OBSERVACOES = normalizarTexto((eq.OBSERVACOES ? eq.OBSERVACOES + ' | ' : '') + 'Inativado: ' + motivo);
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      const sync = sincronizarEquipamentoSeguro(eq, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Inativação salva no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      audit(session, 'INATIVAR_EQUIPAMENTO', 'EQUIPAMENTO', eq.ID, { motivo: motivo }, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), avisos: avisos };
    });
  });
}

function reativarEquipamento(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const eq = exigirRegistro(porId(ctx.eqs, id), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      if (String(eq.STATUS) !== STATUS_EQ.INATIVO) fail('EQUIPAMENTO_ATIVO', 'O equipamento já está ativo.');
      eq.STATUS = STATUS_EQ.DISPONIVEL;
      eq.QUANTIDADE_DISPONIVEL = toNumber(eq.QUANTIDADE_TOTAL);
      atualizarDerivados(eq, ctx.loans, ctx.mans);
      eq.ATUALIZADO_EM = nowStamp();
      eq.ATUALIZADO_POR = session.email;
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      const sync = sincronizarEquipamentoSeguro(eq, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Reativação salva no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      audit(session, 'REATIVAR_EQUIPAMENTO', 'EQUIPAMENTO', eq.ID, null, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), avisos: avisos };
    });
  });
}

function excluirEquipamento(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const eq = exigirRegistro(porId(ctx.eqs, id), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      const loans = ctx.loans.filter(function (l) { return String(l.EQUIPAMENTO_ID) === String(eq.ID); });
      const mans = ctx.mans.filter(function (m) { return String(m.EQUIPAMENTO_ID) === String(eq.ID); });
      const movs = lerTodosMovimentos().filter(function (m) { return String(m.EQUIPAMENTO_ID) === String(eq.ID); });
      if (loans.length || mans.length || movs.length) {
        fail('EQUIPAMENTO_COM_HISTORICO', 'Este equipamento possui histórico. Use a inativação para preservar os registros.');
      }
      const avisos = [];
      try { limparLinhaAba(eq.ORIGEM_ABA, eq.ORIGEM_LINHA); } catch (e) { avisos.push('Equipamento excluído, mas a linha da aba ' + eq.ORIGEM_ABA + ' não pôde ser limpa: ' + e.message); }
      deleteObject(SHEET.EQUIPAMENTOS, eq._row);
      audit(session, 'EXCLUIR_EQUIPAMENTO', 'EQUIPAMENTO', eq.ID, { codigo: eq.CODIGO }, requestId);
      return { ok: true, avisos: avisos };
    });
  });
}

function criarColaborador(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const nome = limparTexto(payload.nome, 120);
  assert(nome.length >= 2, 'NOME_INVALIDO', 'Informe o nome do colaborador.');
  const tipo = String(payload.tipo || 'NAO_INFORMADO').toUpperCase();
  assert(['PESSOA','GRUPO','LOCAL','NAO_INFORMADO'].indexOf(tipo) >= 0, 'TIPO_INVALIDO', 'Tipo inválido.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const cols = lerTodosColaboradores();
      for (let i = 0; i < cols.length; i++) if (normalizarKey(cols[i].NOME) === normalizarKey(nome)) fail('NOME_EM_USO', 'Já existe um colaborador com esse nome.');
      const agora = nowStamp();
      const c = {
        ID: newId('COL'), NOME: nome, TIPO: tipo,
        FUNCAO: limparTexto(payload.funcao, 120),
        TELEFONE: limparTexto(payload.telefone, 40),
        EMAIL: limparTexto(payload.email, 160),
        LOCAL_OBRA: limparTexto(payload.localObra, 160),
        SETOR: limparTexto(payload.setor, 120),
        ATIVO: 'SIM',
        OBSERVACOES: limparTexto(payload.observacoes, 1000),
        ORIGEM: 'APP', CRIADO_EM: agora, ATUALIZADO_EM: agora
      };
      appendObject(SHEET.COLABORADORES, c);
      audit(session, 'CRIAR_COLABORADOR', 'COLABORADOR', c.ID, { nome: nome }, requestId);
      const ctx = contexto();
      return { colaborador: colaboradorView(porId(ctx.cols, c.ID), ctx) };
    });
  });
}

function editarColaborador(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const id = String(payload.id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const c = exigirRegistro(porId(ctx.cols, id), 'COLABORADOR_NAO_ENCONTRADO', 'Colaborador não encontrado.');
      const nome = payload.nome === undefined ? c.NOME : limparTexto(payload.nome, 120);
      assert(nome.length >= 2, 'NOME_INVALIDO', 'Informe o nome do colaborador.');
      ctx.cols.forEach(function (x) { if (x.ID !== c.ID && normalizarKey(x.NOME) === normalizarKey(nome)) fail('NOME_EM_USO', 'Já existe um colaborador com esse nome.'); });
      const tipo = payload.tipo === undefined ? (c.TIPO || 'NAO_INFORMADO') : String(payload.tipo).toUpperCase();
      assert(['PESSOA','GRUPO','LOCAL','NAO_INFORMADO'].indexOf(tipo) >= 0, 'TIPO_INVALIDO', 'Tipo inválido.');
      const antes = c.NOME;
      c.NOME = nome; c.TIPO = tipo;
      c.FUNCAO = payload.funcao === undefined ? c.FUNCAO : limparTexto(payload.funcao, 120);
      c.TELEFONE = payload.telefone === undefined ? c.TELEFONE : limparTexto(payload.telefone, 40);
      c.EMAIL = payload.email === undefined ? c.EMAIL : limparTexto(payload.email, 160);
      c.LOCAL_OBRA = payload.localObra === undefined ? c.LOCAL_OBRA : limparTexto(payload.localObra, 160);
      c.SETOR = payload.setor === undefined ? c.SETOR : limparTexto(payload.setor, 120);
      c.OBSERVACOES = payload.observacoes === undefined ? c.OBSERVACOES : limparTexto(payload.observacoes, 1000);
      c.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.COLABORADORES, c._row, c);
      const afetados = {};
      if (normalizarKey(antes) !== normalizarKey(nome)) {
        ctx.eqs.forEach(function (e) {
          if (String(e.COLABORADOR_ATUAL_ID) === String(c.ID)) {
            e.COLABORADOR_ATUAL_NOME = nome;
            e.ATUALIZADO_EM = nowStamp();
            updateObject(SHEET.EQUIPAMENTOS, e._row, e);
            afetados[e.ID] = true;
          }
        });
        ctx.loans.forEach(function (l) {
          if (String(l.COLABORADOR_ID) === String(c.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO) {
            l.COLABORADOR_NOME = nome;
            l.ATUALIZADO_EM = nowStamp();
            updateObject(SHEET.EMPRESTIMOS, l._row, l);
            afetados[l.EQUIPAMENTO_ID] = true;
          }
        });
      }
      audit(session, 'EDITAR_COLABORADOR', 'COLABORADOR', c.ID, { antes: antes, depois: nome }, requestId);
      const ctx2 = contexto();
      const avisos = [];
      Object.keys(afetados).forEach(function (eqId) {
        const eq = porId(ctx2.eqs, eqId);
        if (!eq) return;
        const s = sincronizarEquipamentoSeguro(eq, { session: session, requestId: requestId });
        if (!s.ok) avisos.push('Aba de ' + eq.CODIGO + ' não sincronizada: ' + s.erro);
      });
      return { colaborador: colaboradorView(porId(ctx2.cols, c.ID), ctx2), avisos: avisos };
    });
  });
}

function inativarColaborador(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const c = exigirRegistro(porId(ctx.cols, id), 'COLABORADOR_NAO_ENCONTRADO', 'Colaborador não encontrado.');
      const loans = ctx.loans.filter(function (l) { return String(l.COLABORADOR_ID) === String(c.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO; });
      if (loans.length) fail('COLABORADOR_COM_PENDENCIA', 'Não é possível inativar: há equipamento ou acessório pendente com este colaborador.');
      c.ATIVO = 'NAO'; c.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.COLABORADORES, c._row, c);
      audit(session, 'INATIVAR_COLABORADOR', 'COLABORADOR', c.ID, null, requestId);
      const ctx2 = contexto();
      return { colaborador: colaboradorView(porId(ctx2.cols, c.ID), ctx2) };
    });
  });
}

function reativarColaborador(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const c = exigirRegistro(porId(ctx.cols, id), 'COLABORADOR_NAO_ENCONTRADO', 'Colaborador não encontrado.');
      c.ATIVO = 'SIM'; c.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.COLABORADORES, c._row, c);
      audit(session, 'REATIVAR_COLABORADOR', 'COLABORADOR', c.ID, null, requestId);
      const ctx2 = contexto();
      return { colaborador: colaboradorView(porId(ctx2.cols, c.ID), ctx2) };
    });
  });
}

function excluirColaborador(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const c = exigirRegistro(porId(ctx.cols, id), 'COLABORADOR_NAO_ENCONTRADO', 'Colaborador não encontrado.');
      const temEq = ctx.eqs.some(function (e) { return String(e.COLABORADOR_ATUAL_ID) === String(c.ID); });
      const temLoan = ctx.loans.some(function (l) { return String(l.COLABORADOR_ID) === String(c.ID); });
      const temMov = lerTodosMovimentos().some(function (m) { return String(m.COLABORADOR_ORIGEM_ID) === String(c.ID) || String(m.COLABORADOR_DESTINO_ID) === String(c.ID); });
      if (temEq || temLoan || temMov) fail('COLABORADOR_COM_HISTORICO', 'Este colaborador possui histórico. Use a inativação.');
      deleteObject(SHEET.COLABORADORES, c._row);
      audit(session, 'EXCLUIR_COLABORADOR', 'COLABORADOR', c.ID, { nome: c.NOME }, requestId);
      return { ok: true };
    });
  });
}

function criarCategoria(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const nome = limparTexto(payload.nome, 120);
  const prefixo = limparTexto(payload.prefixo, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
  assert(nome.length >= 2, 'NOME_INVALIDO', 'Informe o nome da categoria.');
  assert(/^[A-Z0-9]{2,6}$/.test(prefixo), 'PREFIXO_INVALIDO', 'O prefixo deve ter de 2 a 6 letras/números.');
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const cats = lerTodasCategorias();
      cats.forEach(function (c) {
        if (normalizarKey(c.NOME) === normalizarKey(nome)) fail('NOME_EM_USO', 'Já existe uma categoria com esse nome.');
        if (String(c.PREFIXO || '').toUpperCase() === prefixo) fail('PREFIXO_EM_USO', 'Já existe uma categoria com esse prefixo.');
      });
      const agora = nowStamp();
      const campoItem = limparTexto(payload.campoItem, 60) || 'ITEM';
      const aba = criarAbaCategoria(nome, campoItem, null);
      const c = {
        ID: newId('CAT'), NOME: nome, NOME_ABA: aba.nome, CAMPO_ITEM: campoItem,
        PREFIXO: prefixo, ORDEM: toInt(payload.ordem) || (cats.length + 1), ATIVO: 'SIM',
        OBSERVACAO_ORIGEM: '', OBSERVACAO_IMPORTACAO: 'Aba "' + aba.nome + '" criada pelo aplicativo em ' + agora + '.',
        CRIADO_EM: agora, ATUALIZADO_EM: agora
      };
      try {
        appendObject(SHEET.CATEGORIAS, c);
      } catch (e) {
        try { getSpreadsheet().deleteSheet(aba.sheet); } catch (e2) {}
        throw e;
      }
      audit(session, 'CRIAR_CATEGORIA', 'CATEGORIA', c.ID, { nome: nome, prefixo: prefixo, aba: aba.nome }, requestId);
      const ctx = contexto();
      return { categoria: categoriaView(porId(ctx.cats, c.ID), ctx), aba: aba.nome };
    });
  });
}

function editarCategoria(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  const id = String(payload.id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const c = exigirRegistro(porId(ctx.cats, id), 'CATEGORIA_NAO_ENCONTRADA', 'Categoria não encontrada.');
      const nome = payload.nome === undefined ? c.NOME : limparTexto(payload.nome, 120);
      const prefixo = payload.prefixo === undefined ? String(c.PREFIXO || '') : limparTexto(payload.prefixo, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
      assert(nome.length >= 2, 'NOME_INVALIDO', 'Informe o nome da categoria.');
      assert(/^[A-Z0-9]{2,6}$/.test(prefixo), 'PREFIXO_INVALIDO', 'O prefixo deve ter de 2 a 6 letras/números.');
      ctx.cats.forEach(function (x) {
        if (x.ID !== c.ID && normalizarKey(x.NOME) === normalizarKey(nome)) fail('NOME_EM_USO', 'Já existe uma categoria com esse nome.');
        if (x.ID !== c.ID && String(x.PREFIXO || '').toUpperCase() === prefixo) fail('PREFIXO_EM_USO', 'Já existe uma categoria com esse prefixo.');
      });
      if (prefixo !== String(c.PREFIXO || '')) {
        const temEq = ctx.eqs.some(function (e) { return String(e.CATEGORIA_ID) === String(c.ID); });
        if (temEq) fail('PREFIXO_COM_EQUIPAMENTOS', 'Não altere o prefixo de uma categoria que já possui equipamentos.');
      }
      const antes = c.NOME;
      c.NOME = nome;
      c.PREFIXO = prefixo;
      c.CAMPO_ITEM = payload.campoItem === undefined ? c.CAMPO_ITEM : (limparTexto(payload.campoItem, 60) || 'ITEM');
      c.ORDEM = payload.ordem === undefined ? toInt(c.ORDEM) : toInt(payload.ordem);
      c.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.CATEGORIAS, c._row, c);
      try {
        const shAba = getSpreadsheet().getSheetByName(c.NOME_ABA);
        if (shAba) {
          shAba.getRange(1, 1).setValue(nome);
          shAba.getRange(3, 4).setValue(c.CAMPO_ITEM || 'ITEM');
        }
      } catch (e) {}
      if (normalizarKey(antes) !== normalizarKey(nome)) {
        ctx.eqs.forEach(function (e) {
          if (String(e.CATEGORIA_ID) === String(c.ID)) {
            e.CATEGORIA_NOME = nome;
            e.ATUALIZADO_EM = nowStamp();
            updateObject(SHEET.EQUIPAMENTOS, e._row, e);
            ctx.loans.forEach(function (l) {
              if (String(l.EQUIPAMENTO_ID) === String(e.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO) {
                l.EQUIPAMENTO_NOME = nomeEquipamento(e, c);
                l.ATUALIZADO_EM = nowStamp();
                updateObject(SHEET.EMPRESTIMOS, l._row, l);
              }
            });
          }
        });
      }
      audit(session, 'EDITAR_CATEGORIA', 'CATEGORIA', c.ID, { antes: antes, depois: nome }, requestId);
      const ctx2 = contexto();
      return { categoria: categoriaView(porId(ctx2.cats, c.ID), ctx2) };
    });
  });
}

function inativarCategoria(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const c = exigirRegistro(porId(ctx.cats, id), 'CATEGORIA_NAO_ENCONTRADA', 'Categoria não encontrada.');
      const ativos = ctx.eqs.filter(function (e) { return String(e.CATEGORIA_ID) === String(c.ID) && String(e.STATUS) !== STATUS_EQ.INATIVO; });
      if (ativos.length) fail('CATEGORIA_COM_EQUIPAMENTOS', 'Não é possível inativar: existem equipamentos ativos nesta categoria.');
      c.ATIVO = 'NAO'; c.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.CATEGORIAS, c._row, c);
      audit(session, 'INATIVAR_CATEGORIA', 'CATEGORIA', c.ID, null, requestId);
      const ctx2 = contexto();
      return { categoria: categoriaView(porId(ctx2.cats, c.ID), ctx2) };
    });
  });
}

function reativarCategoria(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const c = exigirRegistro(porId(ctx.cats, id), 'CATEGORIA_NAO_ENCONTRADA', 'Categoria não encontrada.');
      c.ATIVO = 'SIM'; c.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.CATEGORIAS, c._row, c);
      audit(session, 'REATIVAR_CATEGORIA', 'CATEGORIA', c.ID, null, requestId);
      const ctx2 = contexto();
      return { categoria: categoriaView(porId(ctx2.cats, c.ID), ctx2) };
    });
  });
}

function excluirCategoria(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  const id = String((payload || {}).id || '').trim();
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const c = exigirRegistro(porId(ctx.cats, id), 'CATEGORIA_NAO_ENCONTRADA', 'Categoria não encontrada.');
      const temEq = ctx.eqs.some(function (e) { return String(e.CATEGORIA_ID) === String(c.ID); });
      if (temEq) fail('CATEGORIA_COM_EQUIPAMENTOS', 'Esta categoria possui equipamentos. Use a inativação.');
      deleteObject(SHEET.CATEGORIAS, c._row);
      audit(session, 'EXCLUIR_CATEGORIA', 'CATEGORIA', c.ID, { nome: c.NOME }, requestId);
      return { ok: true };
    });
  });
}

function acessoriosSolicitados(payload, eq, pend) {
  const acc = (payload && payload.acessorios && typeof payload.acessorios === 'object') ? payload.acessorios : {};
  const car = acc.CARREGADOR !== undefined ? toInt(acc.CARREGADOR) : toInt((payload || {}).carregadorQtd || 0);
  const bat = acc.BATERIA !== undefined ? toInt(acc.BATERIA) : toInt((payload || {}).bateriaQtd || 0);
  assert(car >= 0 && bat >= 0, 'ACESSORIO_INVALIDO', 'Quantidade de acessório inválida.');
  const pt = pendentesPorTipo(pend);
  const total = acessoriosTotais(eq);
  const out = [];
  total.forEach(function (a) {
    const pedido = a.tipo === 'CARREGADOR' ? car : bat;
    if (pedido <= 0) return;
    const disponivel = Math.max(0, a.qtd - (pt[a.tipo] || 0));
    assert(pedido <= disponivel, 'ACESSORIO_INDISPONIVEL', 'Só há ' + disponivel + ' ' + a.tipo.toLowerCase() + '(es) disponível(is) para entrega.');
    out.push({ tipo: a.tipo, codigo: a.codigo, codigos: a.codigos, qtd: pedido });
  });
  if (car > 0 && !out.some(function (a) { return a.tipo === 'CARREGADOR'; })) fail('ACESSORIO_INEXISTENTE', 'Este equipamento não possui carregador cadastrado.');
  if (bat > 0 && !out.some(function (a) { return a.tipo === 'BATERIA'; })) fail('ACESSORIO_INEXISTENTE', 'Este equipamento não possui bateria cadastrada.');
  return out;
}

function acessoriosDevolvidos(payload, loan) {
  const acc = (payload && payload.acessorios && typeof payload.acessorios === 'object') ? payload.acessorios : {};
  const car = acc.CARREGADOR !== undefined ? toInt(acc.CARREGADOR) : toInt((payload || {}).carregadorQtd || 0);
  const bat = acc.BATERIA !== undefined ? toInt(acc.BATERIA) : toInt((payload || {}).bateriaQtd || 0);
  assert(car >= 0 && bat >= 0, 'ACESSORIO_INVALIDO', 'Quantidade de acessório inválida.');
  const pend = jsonParseSafe(loan.ACESSORIOS_PENDENTES, []);
  const pt = pendentesPorTipo(pend);
  assert(car <= (pt.CARREGADOR || 0), 'DEVOLUCAO_INVALIDA', 'A quantidade de carregadores devolvida é maior que a pendente.');
  assert(bat <= (pt.BATERIA || 0), 'DEVOLUCAO_INVALIDA', 'A quantidade de baterias devolvida é maior que a pendente.');
  const devolvidos = [];
  pend.forEach(function (a) {
    const q = a.tipo === 'CARREGADOR' ? car : (a.tipo === 'BATERIA' ? bat : 0);
    if (q > 0) devolvidos.push({ tipo: a.tipo, codigo: a.codigo, codigos: a.codigos || [], qtd: q });
  });
  const restantes = removerAcessorios(pend, devolvidos);
  return { devolvidos: devolvidos, restantes: restantes };
}

function atualizarDerivados(eq, loans, mans) {
  if (String(eq.STATUS) === STATUS_EQ.INATIVO) return eq;
  const open = (loans || []).filter(function (l) { return String(l.EQUIPAMENTO_ID) === String(eq.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO; });
  const man = (mans || []).filter(function (m) { return String(m.EQUIPAMENTO_ID) === String(eq.ID) && (String(m.STATUS) === STATUS_MAN.ABERTA || String(m.STATUS) === STATUS_MAN.EM_ANDAMENTO); })[0];
  if (man) {
    eq.STATUS = STATUS_EQ.MANUTENCAO;
    eq.QUANTIDADE_DISPONIVEL = 0;
    eq.COLABORADOR_ATUAL_ID = '';
    eq.COLABORADOR_ATUAL_NOME = '';
    eq.DATA_ENTREGA_ATUAL = '';
    eq.ACESSORIOS_PENDENTES = '[]';
    return eq;
  }
  const comQtd = open.filter(function (l) { return toInt(l.QUANTIDADE) > 0; });
  const emUso = comQtd.reduce(function (s, l) { return s + toInt(l.QUANTIDADE); }, 0);
  const total = toNumber(eq.QUANTIDADE_TOTAL);
  const disp = Math.max(0, total - emUso);
  eq.QUANTIDADE_DISPONIVEL = disp;
  eq.STATUS = emUso <= 0 ? STATUS_EQ.DISPONIVEL : (disp > 0 ? STATUS_EQ.PARCIAL : STATUS_EQ.ENTREGUE);
  const nomes = {};
  comQtd.forEach(function (l) { if (l.COLABORADOR_NOME) nomes[l.COLABORADOR_NOME] = l.COLABORADOR_ID; });
  const chaves = Object.keys(nomes);
  if (chaves.length === 1) {
    eq.COLABORADOR_ATUAL_NOME = chaves[0];
    eq.COLABORADOR_ATUAL_ID = nomes[chaves[0]];
  } else if (chaves.length > 1) {
    eq.COLABORADOR_ATUAL_NOME = 'VÁRIOS';
    eq.COLABORADOR_ATUAL_ID = '';
  } else {
    eq.COLABORADOR_ATUAL_NOME = '';
    eq.COLABORADOR_ATUAL_ID = '';
  }
  const datas = comQtd.map(function (l) { return String(l.DATA_ENTREGA || ''); }).filter(Boolean).sort();
  eq.DATA_ENTREGA_ATUAL = datas.length ? datas[0] : '';
  let pend = [];
  open.forEach(function (l) { pend = pend.concat(jsonParseSafe(l.ACESSORIOS_PENDENTES, [])); });
  eq.ACESSORIOS_PENDENTES = jsonText(somarAcessorios(pend));
  return eq;
}

function resolverColaboradorOperacao(payload, cfg) {
  payload = payload || {};
  cfg = cfg || {};
  const nomeInformado = limparTexto(payload[cfg.campoNome], 120);
  const id = String(payload[cfg.campoId] || '').trim();
  const cols = lerTodosColaboradores();
  const base = id ? porId(cols, id) : null;
  const nome = nomeInformado || (base ? base.NOME : '');
  assert(nome.length >= 2, 'COLABORADOR_OBRIGATORIO', 'Informe o responsável.');
  const chave = normalizarKey(nome);
  let existente = null;
  if (base && normalizarKey(base.NOME) === chave) existente = base;
  if (!existente) {
    for (let i = 0; i < cols.length; i++) {
      if (normalizarKey(cols[i].NOME) === chave) { existente = cols[i]; break; }
    }
  }
  if (existente) {
    if (String(existente.ATIVO) !== 'SIM') {
      fail('COLABORADOR_INATIVO', 'O responsável "' + existente.NOME + '" está inativo. Reative o cadastro ou informe outro nome.');
    }
    return existente;
  }
  const agora = nowStamp();
  const origem = String(cfg.origem || 'OPERACAO');
  const novo = {
    ID: newId('COL'), NOME: nome, TIPO: 'NAO_INFORMADO', FUNCAO: '', TELEFONE: '', EMAIL: '',
    LOCAL_OBRA: '', SETOR: '', ATIVO: 'SIM',
    OBSERVACOES: 'Criado automaticamente ao registrar ' + origem.toLowerCase() + '. Não possui acesso ao sistema.',
    ORIGEM: 'AUTO_' + origem, CRIADO_EM: agora, ATUALIZADO_EM: agora
  };
  appendObject(SHEET.COLABORADORES, novo);
  audit(cfg.session, 'CRIAR_COLABORADOR_AUTO', 'COLABORADOR', novo.ID, { nome: nome, origem: origem }, cfg.requestId);
  return novo;
}

function registrarEntrega(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const eq = exigirRegistro(porId(ctx.eqs, payload.equipamentoId), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      const col = resolverColaboradorOperacao(payload, { campoNome: 'colaboradorNome', campoId: 'colaboradorId', origem: 'ENTREGA', session: session, requestId: requestId });
      if (String(eq.STATUS) === STATUS_EQ.INATIVO) fail('EQUIPAMENTO_INATIVO', 'Equipamento inativo não pode ser entregue.');
      if (String(eq.STATUS) === STATUS_EQ.MANUTENCAO) fail('EQUIPAMENTO_MANUTENCAO', 'Equipamento em manutenção não pode ser entregue.');
      const qtd = Math.max(1, toInt(payload.quantidade) || 1);
      const disp = toNumber(eq.QUANTIDADE_DISPONIVEL);
      assert(qtd <= disp, 'SALDO_INSUFICIENTE', 'Saldo insuficiente. Disponível: ' + disp + ' unidade(s).');
      const data = validarData(payload.data, true, 'a data de entrega');
      const conservacao = validarConservacao(payload.estadoConservacao, eq.ESTADO_CONSERVACAO);
      const pend = jsonParseSafe(eq.ACESSORIOS_PENDENTES, []);
      const acc = acessoriosSolicitados(payload, eq, pend);
      const cat = ctx.catMap[eq.CATEGORIA_ID] || null;
      const agora = nowStamp();
      const loanId = newId('EMP');
      const movId = newId('MOV');
      const loan = {
        ID: loanId, EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO, EQUIPAMENTO_NOME: nomeEquipamento(eq, cat),
        COLABORADOR_ID: col.ID, COLABORADOR_NOME: col.NOME, DATA_ENTREGA: data, QUANTIDADE: qtd,
        ESTADO_ENTREGA: conservacao, ACESSORIOS_ENTREGUES: jsonText(acc), ACESSORIOS_PENDENTES: jsonText(acc),
        EQUIPAMENTO_DEVOLVIDO: 'NAO', DATA_DEVOLUCAO_EQUIPAMENTO: '', STATUS: STATUS_LOAN.ABERTO,
        MOVIMENTO_ENTREGA_ID: movId, MOVIMENTO_ENCERRAMENTO_ID: '',
        OBSERVACOES: limparTexto(payload.observacoes, 2000), ORIGEM: 'APP', CRIADO_EM: agora, ATUALIZADO_EM: agora, USUARIO: session.email
      };
      appendObject(SHEET.EMPRESTIMOS, loan);
      appendObject(SHEET.MOVIMENTACOES, {
        ID: movId, DATA: data, TIPO: 'ENTREGA', EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO,
        CATEGORIA_NOME: cat ? cat.NOME : eq.CATEGORIA_NOME, QUANTIDADE: qtd,
        COLABORADOR_ORIGEM_ID: '', COLABORADOR_ORIGEM_NOME: '', COLABORADOR_DESTINO_ID: col.ID, COLABORADOR_DESTINO_NOME: col.NOME,
        ESTADO_CONSERVACAO: conservacao, ACESSORIOS_ENTREGUES: jsonText(acc), ACESSORIOS_DEVOLVIDOS: '[]', ACESSORIOS_PENDENTES: jsonText(acc),
        OBSERVACOES: limparTexto(payload.observacoes, 2000), EMPRESTIMO_ID: loanId, MANUTENCAO_ID: '', USUARIO_ID: session.id,
        USUARIO_EMAIL: session.email, ORIGEM: 'APP', REQUEST_ID: requestId, CRIADO_EM: agora
      });
      const eq2 = porId(lerTodosEquipamentos(), eq.ID);
      eq2.ESTADO_CONSERVACAO = conservacao;
      atualizarDerivados(eq2, lerTodosEmprestimos(), lerTodasManutencoes());
      eq2.ATUALIZADO_EM = agora; eq2.ATUALIZADO_POR = session.email;
      updateObject(SHEET.EQUIPAMENTOS, eq2._row, eq2);
      const sync = sincronizarEquipamentoSeguro(eq2, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Entrega salva no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      audit(session, 'REGISTRAR_ENTREGA', 'EMPRESTIMO', loanId, { equipamento: eq.CODIGO, colaborador: col.NOME, quantidade: qtd, acessorios: acc }, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), emprestimo: emprestimoView(porId(ctx2.loans, loanId), ctx2), avisos: avisos };
    });
  });
}

function registrarDevolucao(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const loan = exigirRegistro(porId(ctx.loans, payload.emprestimoId), 'EMPRESTIMO_NAO_ENCONTRADO', 'Empréstimo não encontrado.');
      if (String(loan.STATUS) !== STATUS_LOAN.ABERTO) fail('EMPRESTIMO_ENCERRADO', 'Este empréstimo não está aberto.');
      const eq = exigirRegistro(porId(ctx.eqs, loan.EQUIPAMENTO_ID), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      const data = validarData(payload.data, true, 'a data de devolução');
      const conservacao = validarConservacao(payload.estadoConservacao, eq.ESTADO_CONSERVACAO);
      const qtdDev = payload.quantidade === undefined ? toInt(loan.QUANTIDADE) : Math.max(0, toInt(payload.quantidade));
      assert(qtdDev <= toInt(loan.QUANTIDADE), 'DEVOLUCAO_INVALIDA', 'A quantidade devolvida é maior que a quantidade do empréstimo.');
      const acc = acessoriosDevolvidos(payload, loan);
      assert(qtdDev > 0 || acc.devolvidos.length > 0, 'DEVOLUCAO_VAZIA', 'Informe a devolução de pelo menos um equipamento ou acessório.');
      const novaQtd = Math.max(0, toInt(loan.QUANTIDADE) - qtdDev);
      const novoPend = acc.restantes;
      const encerrado = novaQtd === 0 && novoPend.length === 0;
      const agora = nowStamp();
      const movId = newId('MOV');
      loan.QUANTIDADE = novaQtd;
      loan.ACESSORIOS_PENDENTES = jsonText(novoPend);
      loan.EQUIPAMENTO_DEVOLVIDO = novaQtd === 0 ? 'SIM' : 'NAO';
      loan.DATA_DEVOLUCAO_EQUIPAMENTO = novaQtd === 0 ? data : '';
      loan.STATUS = encerrado ? STATUS_LOAN.ENCERRADO : STATUS_LOAN.ABERTO;
      loan.MOVIMENTO_ENCERRAMENTO_ID = encerrado ? movId : (loan.MOVIMENTO_ENCERRAMENTO_ID || '');
      loan.ATUALIZADO_EM = agora;
      if (payload.observacoes) loan.OBSERVACOES = normalizarTexto((loan.OBSERVACOES ? loan.OBSERVACOES + ' | ' : '') + 'Devolução ' + data + ': ' + limparTexto(payload.observacoes, 1000));
      updateObject(SHEET.EMPRESTIMOS, loan._row, loan);
      appendObject(SHEET.MOVIMENTACOES, {
        ID: movId, DATA: data, TIPO: 'DEVOLUCAO', EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO,
        CATEGORIA_NOME: (ctx.catMap[eq.CATEGORIA_ID] || {}).NOME || eq.CATEGORIA_NOME, QUANTIDADE: qtdDev,
        COLABORADOR_ORIGEM_ID: loan.COLABORADOR_ID, COLABORADOR_ORIGEM_NOME: loan.COLABORADOR_NOME, COLABORADOR_DESTINO_ID: '', COLABORADOR_DESTINO_NOME: '',
        ESTADO_CONSERVACAO: conservacao, ACESSORIOS_ENTREGUES: '[]', ACESSORIOS_DEVOLVIDOS: jsonText(acc.devolvidos), ACESSORIOS_PENDENTES: jsonText(novoPend),
        OBSERVACOES: limparTexto(payload.observacoes, 2000), EMPRESTIMO_ID: loan.ID, MANUTENCAO_ID: '', USUARIO_ID: session.id,
        USUARIO_EMAIL: session.email, ORIGEM: 'APP', REQUEST_ID: requestId, CRIADO_EM: agora
      });
      eq.ESTADO_CONSERVACAO = conservacao;
      eq.ATUALIZADO_EM = agora; eq.ATUALIZADO_POR = session.email;
      atualizarDerivados(eq, lerTodosEmprestimos(), lerTodasManutencoes());
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      const sync = sincronizarEquipamentoSeguro(eq, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Devolução salva no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      audit(session, 'REGISTRAR_DEVOLUCAO', 'EMPRESTIMO', loan.ID, { equipamento: eq.CODIGO, quantidade: qtdDev, acessorios: acc.devolvidos, encerrado: encerrado }, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), emprestimo: emprestimoView(porId(ctx2.loans, loan.ID), ctx2), avisos: avisos };
    });
  });
}

function registrarTransferencia(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const loan = exigirRegistro(porId(ctx.loans, payload.emprestimoId), 'EMPRESTIMO_NAO_ENCONTRADO', 'Empréstimo não encontrado.');
      if (String(loan.STATUS) !== STATUS_LOAN.ABERTO || toInt(loan.QUANTIDADE) <= 0) fail('TRANSFERENCIA_INVALIDA', 'Só é possível transferir um empréstimo aberto com equipamento em posse do colaborador.');
      const novo = resolverColaboradorOperacao(payload, { campoNome: 'novoColaboradorNome', campoId: 'novoColaboradorId', origem: 'TRANSFERENCIA', session: session, requestId: requestId });
      if (String(novo.ID) === String(loan.COLABORADOR_ID)) fail('TRANSFERENCIA_INVALIDA', 'O novo responsável é o mesmo colaborador atual.');
      const data = validarData(payload.data, true, 'a data da transferência');
      const eq = exigirRegistro(porId(ctx.eqs, loan.EQUIPAMENTO_ID), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      const agora = nowStamp();
      const novoLoanId = newId('EMP');
      const movId = newId('MOV');
      const transf = jsonParseSafe(loan.ACESSORIOS_PENDENTES, []);
      const oldColab = { id: loan.COLABORADOR_ID, nome: loan.COLABORADOR_NOME };
      loan.ACESSORIOS_PENDENTES = '[]';
      loan.STATUS = STATUS_LOAN.TRANSFERIDO;
      loan.EQUIPAMENTO_DEVOLVIDO = 'SIM';
      loan.DATA_DEVOLUCAO_EQUIPAMENTO = data;
      loan.MOVIMENTO_ENCERRAMENTO_ID = movId;
      loan.ATUALIZADO_EM = agora;
      updateObject(SHEET.EMPRESTIMOS, loan._row, loan);
      const novoLoan = {
        ID: novoLoanId, EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO,
        EQUIPAMENTO_NOME: nomeEquipamento(eq, ctx.catMap[eq.CATEGORIA_ID] || null),
        COLABORADOR_ID: novo.ID, COLABORADOR_NOME: novo.NOME, DATA_ENTREGA: data, QUANTIDADE: toInt(loan.QUANTIDADE),
        ESTADO_ENTREGA: eq.ESTADO_CONSERVACAO, ACESSORIOS_ENTREGUES: jsonText(transf), ACESSORIOS_PENDENTES: jsonText(transf),
        EQUIPAMENTO_DEVOLVIDO: 'NAO', DATA_DEVOLUCAO_EQUIPAMENTO: '', STATUS: STATUS_LOAN.ABERTO,
        MOVIMENTO_ENTREGA_ID: movId, MOVIMENTO_ENCERRAMENTO_ID: '',
        OBSERVACOES: 'Transferido de ' + oldColab.nome + '.' + (payload.observacoes ? ' ' + limparTexto(payload.observacoes, 1000) : ''),
        ORIGEM: 'TRANSFERENCIA', CRIADO_EM: agora, ATUALIZADO_EM: agora, USUARIO: session.email
      };
      appendObject(SHEET.EMPRESTIMOS, novoLoan);
      appendObject(SHEET.MOVIMENTACOES, {
        ID: movId, DATA: data, TIPO: 'TRANSFERENCIA', EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO,
        CATEGORIA_NOME: (ctx.catMap[eq.CATEGORIA_ID] || {}).NOME || eq.CATEGORIA_NOME, QUANTIDADE: toInt(loan.QUANTIDADE),
        COLABORADOR_ORIGEM_ID: oldColab.id, COLABORADOR_ORIGEM_NOME: oldColab.nome, COLABORADOR_DESTINO_ID: novo.ID, COLABORADOR_DESTINO_NOME: novo.NOME,
        ESTADO_CONSERVACAO: eq.ESTADO_CONSERVACAO, ACESSORIOS_ENTREGUES: '[]', ACESSORIOS_DEVOLVIDOS: '[]', ACESSORIOS_PENDENTES: jsonText(transf),
        OBSERVACOES: limparTexto(payload.observacoes, 2000), EMPRESTIMO_ID: novoLoanId, MANUTENCAO_ID: '', USUARIO_ID: session.id,
        USUARIO_EMAIL: session.email, ORIGEM: 'APP', REQUEST_ID: requestId, CRIADO_EM: agora
      });
      eq.ATUALIZADO_EM = agora; eq.ATUALIZADO_POR = session.email;
      atualizarDerivados(eq, lerTodosEmprestimos(), lerTodasManutencoes());
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      const sync = sincronizarEquipamentoSeguro(eq, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Transferência salva no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      audit(session, 'TRANSFERIR', 'EMPRESTIMO', loan.ID, { equipamento: eq.CODIGO, de: oldColab.nome, para: novo.NOME, acessorios: transf }, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), emprestimo: emprestimoView(porId(ctx2.loans, novoLoanId), ctx2), avisos: avisos };
    });
  });
}

function abrirManutencao(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const eq = exigirRegistro(porId(ctx.eqs, payload.equipamentoId), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      if (String(eq.STATUS) === STATUS_EQ.INATIVO) fail('EQUIPAMENTO_INATIVO', 'Equipamento inativo.');
      if (String(eq.STATUS) === STATUS_EQ.MANUTENCAO) fail('EQUIPAMENTO_MANUTENCAO', 'Equipamento já está em manutenção.');
      const openLoans = ctx.loans.filter(function (l) { return String(l.EQUIPAMENTO_ID) === String(eq.ID) && String(l.STATUS) === STATUS_LOAN.ABERTO; });
      if (openLoans.length) fail('EQUIPAMENTO_EM_USO', 'Registre a devolução completa antes de enviar para manutenção.');
      if (toNumber(eq.QUANTIDADE_DISPONIVEL) !== toNumber(eq.QUANTIDADE_TOTAL)) fail('EQUIPAMENTO_EM_USO', 'O equipamento não está totalmente disponível.');
      const data = validarData(payload.dataEnvio, true, 'a data de envio para manutenção');
      const previsao = validarData(payload.previsaoRetorno, false, 'a previsão de retorno');
      const custo = payload.custo === undefined || payload.custo === '' ? '' : Math.max(0, toNumber(payload.custo));
      const agora = nowStamp();
      const manId = newId('MAN');
      const movId = newId('MOV');
      const man = {
        ID: manId, EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO,
        CATEGORIA_NOME: (ctx.catMap[eq.CATEGORIA_ID] || {}).NOME || eq.CATEGORIA_NOME,
        DATA_ENVIO: data, DEFEITO: limparTexto(payload.defeito, 1000), RESPONSAVEL: limparTexto(payload.responsavel, 200),
        CELULAR_RESPONSAVEL: limparTexto(payload.celularResponsavel, 40),
        STATUS: STATUS_MAN.ABERTA, SERVICO: '', CUSTO: custo, PREVISAO_RETORNO: previsao, DATA_RETORNO: '', ESTADO_RETORNO: '',
        OBSERVACOES: limparTexto(payload.observacoes, 2000), ORIGEM: 'APP', USUARIO: session.email,
        CRIADO_EM: agora, ATUALIZADO_EM: agora, REVISAR: 'NAO', MOTIVO_REVISAO: ''
      };
      appendObject(SHEET.MANUTENCOES, man);
      eq.STATUS = STATUS_EQ.MANUTENCAO;
      eq.QUANTIDADE_DISPONIVEL = 0;
      eq.COLABORADOR_ATUAL_ID = '';
      eq.COLABORADOR_ATUAL_NOME = '';
      eq.DATA_ENTREGA_ATUAL = '';
      eq.ACESSORIOS_PENDENTES = '[]';
      eq.ATUALIZADO_EM = agora; eq.ATUALIZADO_POR = session.email;
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      const sync = sincronizarEquipamentoSeguro(eq, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Manutenção salva no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      appendObject(SHEET.MOVIMENTACOES, {
        ID: movId, DATA: data, TIPO: 'SAIDA_MANUTENCAO', EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO,
        CATEGORIA_NOME: man.CATEGORIA_NOME, QUANTIDADE: toNumber(eq.QUANTIDADE_TOTAL),
        COLABORADOR_ORIGEM_ID: '', COLABORADOR_ORIGEM_NOME: '', COLABORADOR_DESTINO_ID: '', COLABORADOR_DESTINO_NOME: '',
        ESTADO_CONSERVACAO: eq.ESTADO_CONSERVACAO, ACESSORIOS_ENTREGUES: '[]', ACESSORIOS_DEVOLVIDOS: '[]', ACESSORIOS_PENDENTES: '[]',
        OBSERVACOES: limparTexto(payload.defeito, 2000), EMPRESTIMO_ID: '', MANUTENCAO_ID: manId, USUARIO_ID: session.id,
        USUARIO_EMAIL: session.email, ORIGEM: 'APP', REQUEST_ID: requestId, CRIADO_EM: agora
      });
      audit(session, 'ABRIR_MANUTENCAO', 'MANUTENCAO', manId, { equipamento: eq.CODIGO, defeito: man.DEFEITO }, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), manutencao: manutencaoView(porId(ctx2.mans, manId), ctx2), avisos: avisos };
    });
  });
}

function atualizarManutencao(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const man = exigirRegistro(porId(lerTodasManutencoes(), payload.id), 'MANUTENCAO_NAO_ENCONTRADA', 'Manutenção não encontrada.');
      if (String(man.STATUS) !== STATUS_MAN.ABERTA && String(man.STATUS) !== STATUS_MAN.EM_ANDAMENTO) fail('MANUTENCAO_ENCERRADA', 'Esta manutenção não está aberta.');
      const status = payload.status === undefined ? man.STATUS : String(payload.status).toUpperCase();
      assert(status === STATUS_MAN.ABERTA || status === STATUS_MAN.EM_ANDAMENTO, 'STATUS_INVALIDO', 'Use a conclusão para encerrar a manutenção.');
      man.STATUS = status;
      man.DEFEITO = payload.defeito === undefined ? man.DEFEITO : limparTexto(payload.defeito, 1000);
      man.RESPONSAVEL = payload.responsavel === undefined ? man.RESPONSAVEL : limparTexto(payload.responsavel, 200);
      man.CELULAR_RESPONSAVEL = payload.celularResponsavel === undefined ? man.CELULAR_RESPONSAVEL : limparTexto(payload.celularResponsavel, 40);
      man.SERVICO = payload.servico === undefined ? man.SERVICO : limparTexto(payload.servico, 1000);
      man.CUSTO = payload.custo === undefined ? man.CUSTO : (payload.custo === '' ? '' : Math.max(0, toNumber(payload.custo)));
      man.PREVISAO_RETORNO = payload.previsaoRetorno === undefined ? man.PREVISAO_RETORNO : validarData(payload.previsaoRetorno, false, 'a previsão de retorno');
      man.OBSERVACOES = payload.observacoes === undefined ? man.OBSERVACOES : limparTexto(payload.observacoes, 2000);
      man.ATUALIZADO_EM = nowStamp();
      updateObject(SHEET.MANUTENCOES, man._row, man);
      audit(session, 'ATUALIZAR_MANUTENCAO', 'MANUTENCAO', man.ID, { status: status }, requestId);
      const ctx = contexto();
      return { manutencao: manutencaoView(porId(ctx.mans, man.ID), ctx) };
    });
  });
}

function concluirManutencao(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const man = exigirRegistro(porId(ctx.mans, payload.id), 'MANUTENCAO_NAO_ENCONTRADA', 'Manutenção não encontrada.');
      if (String(man.STATUS) !== STATUS_MAN.ABERTA && String(man.STATUS) !== STATUS_MAN.EM_ANDAMENTO) fail('MANUTENCAO_ENCERRADA', 'Esta manutenção não está aberta.');
      const eq = exigirRegistro(porId(ctx.eqs, man.EQUIPAMENTO_ID), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      const data = validarData(payload.dataRetorno, true, 'a data de retorno');
      const estado = payload.estadoRetorno === undefined || payload.estadoRetorno === '' ? (eq.ESTADO_CONSERVACAO || 'NAO_INFORMADO') : validarConservacao(payload.estadoRetorno, eq.ESTADO_CONSERVACAO);
      const agora = nowStamp();
      man.STATUS = STATUS_MAN.CONCLUIDA;
      man.CELULAR_RESPONSAVEL = payload.celularResponsavel === undefined ? man.CELULAR_RESPONSAVEL : limparTexto(payload.celularResponsavel, 40);
      man.SERVICO = payload.servico === undefined ? man.SERVICO : limparTexto(payload.servico, 1000);
      man.CUSTO = payload.custo === undefined ? man.CUSTO : (payload.custo === '' ? '' : Math.max(0, toNumber(payload.custo)));
      man.DATA_RETORNO = data;
      man.ESTADO_RETORNO = estado;
      man.OBSERVACOES = payload.observacoes === undefined ? man.OBSERVACOES : limparTexto(payload.observacoes, 2000);
      man.ATUALIZADO_EM = agora;
      updateObject(SHEET.MANUTENCOES, man._row, man);
      eq.STATUS = STATUS_EQ.DISPONIVEL;
      eq.QUANTIDADE_DISPONIVEL = toNumber(eq.QUANTIDADE_TOTAL);
      eq.ESTADO_CONSERVACAO = estado;
      eq.ATUALIZADO_EM = agora; eq.ATUALIZADO_POR = session.email;
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      const sync = sincronizarEquipamentoSeguro(eq, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Manutenção concluída no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      appendObject(SHEET.MOVIMENTACOES, {
        ID: newId('MOV'), DATA: data, TIPO: 'RETORNO_MANUTENCAO', EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO,
        CATEGORIA_NOME: man.CATEGORIA_NOME, QUANTIDADE: toNumber(eq.QUANTIDADE_TOTAL),
        COLABORADOR_ORIGEM_ID: '', COLABORADOR_ORIGEM_NOME: '', COLABORADOR_DESTINO_ID: '', COLABORADOR_DESTINO_NOME: '',
        ESTADO_CONSERVACAO: estado, ACESSORIOS_ENTREGUES: '[]', ACESSORIOS_DEVOLVIDOS: '[]', ACESSORIOS_PENDENTES: '[]',
        OBSERVACOES: 'Retorno da manutenção.' + (payload.observacoes ? ' ' + limparTexto(payload.observacoes, 1500) : ''), EMPRESTIMO_ID: '', MANUTENCAO_ID: man.ID,
        USUARIO_ID: session.id, USUARIO_EMAIL: session.email, ORIGEM: 'APP', REQUEST_ID: requestId, CRIADO_EM: agora
      });
      audit(session, 'CONCLUIR_MANUTENCAO', 'MANUTENCAO', man.ID, { equipamento: eq.CODIGO, data: data, estado: estado }, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), manutencao: manutencaoView(porId(ctx2.mans, man.ID), ctx2), avisos: avisos };
    });
  });
}

function cancelarManutencao(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  payload = payload || {};
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      const ctx = contexto();
      const man = exigirRegistro(porId(ctx.mans, payload.id), 'MANUTENCAO_NAO_ENCONTRADA', 'Manutenção não encontrada.');
      if (String(man.STATUS) !== STATUS_MAN.ABERTA && String(man.STATUS) !== STATUS_MAN.EM_ANDAMENTO) fail('MANUTENCAO_ENCERRADA', 'Esta manutenção não está aberta.');
      const eq = exigirRegistro(porId(ctx.eqs, man.EQUIPAMENTO_ID), 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado.');
      const data = validarData(payload.dataRetorno, false, 'a data de retorno') || todayIso();
      const motivo = limparTexto(payload.motivo, 1000);
      const agora = nowStamp();
      man.STATUS = STATUS_MAN.CANCELADA;
      man.DATA_RETORNO = data;
      man.OBSERVACOES = normalizarTexto((man.OBSERVACOES ? man.OBSERVACOES + ' | ' : '') + 'Manutenção cancelada em ' + data + (motivo ? ': ' + motivo : ''));
      man.ATUALIZADO_EM = agora;
      updateObject(SHEET.MANUTENCOES, man._row, man);
      eq.STATUS = STATUS_EQ.DISPONIVEL;
      eq.QUANTIDADE_DISPONIVEL = toNumber(eq.QUANTIDADE_TOTAL);
      eq.ATUALIZADO_EM = agora; eq.ATUALIZADO_POR = session.email;
      updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
      const sync = sincronizarEquipamentoSeguro(eq, { session: session, requestId: requestId });
      const avisos = sync.ok ? [] : ['Cancelamento salvo no sistema, mas a aba ' + (sync.aba || 'da categoria') + ' não foi sincronizada: ' + sync.erro + ' Use Sincronizar planilha.'];
      appendObject(SHEET.MOVIMENTACOES, {
        ID: newId('MOV'), DATA: data, TIPO: 'AJUSTE', EQUIPAMENTO_ID: eq.ID, EQUIPAMENTO_CODIGO: eq.CODIGO,
        CATEGORIA_NOME: man.CATEGORIA_NOME, QUANTIDADE: toNumber(eq.QUANTIDADE_TOTAL),
        COLABORADOR_ORIGEM_ID: '', COLABORADOR_ORIGEM_NOME: '', COLABORADOR_DESTINO_ID: '', COLABORADOR_DESTINO_NOME: '',
        ESTADO_CONSERVACAO: eq.ESTADO_CONSERVACAO, ACESSORIOS_ENTREGUES: '[]', ACESSORIOS_DEVOLVIDOS: '[]', ACESSORIOS_PENDENTES: '[]',
        OBSERVACOES: 'Manutenção cancelada.' + (motivo ? ' ' + motivo : ''), EMPRESTIMO_ID: '', MANUTENCAO_ID: man.ID,
        USUARIO_ID: session.id, USUARIO_EMAIL: session.email, ORIGEM: 'APP', REQUEST_ID: requestId, CRIADO_EM: agora
      });
      audit(session, 'CANCELAR_MANUTENCAO', 'MANUTENCAO', man.ID, { equipamento: eq.CODIGO, motivo: motivo }, requestId);
      const ctx2 = contexto();
      return { equipamento: equipamentoView(porId(ctx2.eqs, eq.ID), ctx2), manutencao: manutencaoView(porId(ctx2.mans, man.ID), ctx2), avisos: avisos };
    });
  });
}


/**
 * Sincronização das abas originais (PARAFUSADEIRA, MARTELETE etc.) com o
 * estado atual das abas do sistema, e criação de novas abas de categoria.
 *
 * A aba do sistema EQUIPAMENTOS continua sendo a fonte de verdade. As abas
 * originais são espelhos legíveis: responsável atual, datas, conservação,
 * acessórios e cor da linha. O histórico completo permanece em
 * MOVIMENTACOES/EMPRESTIMOS/MANUTENCOES.
 */

function sanitizarNomeAba(nome) {
  let s = normalizarTexto(nome);
  s = s.replace(/[:\\/?*\[\]]/g, '-').replace(/\s+/g, ' ').trim();
  s = s.replace(/^'+|'+$/g, '').trim();
  if (s.length > 90) s = s.slice(0, 90).trim();
  if (!s) fail('ABA_INVALIDA', 'O nome da aba não pode ficar vazio.');
  return s;
}

function criarAbaCategoria(nomeDesejado, campoItem, excetoCategoriaId) {
  const ss = getSpreadsheet();
  const nome = sanitizarNomeAba(nomeDesejado);
  const abas = ss.getSheets();
  for (let i = 0; i < abas.length; i++) {
    if (normalizarKey(abas[i].getName()) === normalizarKey(nome)) {
      fail('ABA_EM_USO', 'Já existe uma aba na planilha com o nome "' + nome + '". Escolha outro nome para a categoria.');
    }
  }
  const cats = lerTodasCategorias();
  for (let i = 0; i < cats.length; i++) {
    if (String(cats[i].ID) === String(excetoCategoriaId || '')) continue;
    if (String(cats[i].NOME_ABA || '').trim() && normalizarKey(cats[i].NOME_ABA) === normalizarKey(nome)) {
      fail('ABA_EM_USO', 'A aba "' + nome + '" já está vinculada a outra categoria.');
    }
  }
  let sh = null;
  try {
    sh = ss.insertSheet(nome);
    const titulo = sh.getRange(1, 1, 1, 12);
    titulo.merge();
    titulo.setValue(nome);
    titulo.setFontWeight('bold');
    titulo.setFontSize(14);
    titulo.setHorizontalAlignment('center');
    titulo.setVerticalAlignment('middle');
    titulo.setBackground('#0B1F3A');
    titulo.setFontColor('#FFFFFF');
    sh.setRowHeight(1, 34);
    sh.setRowHeight(2, 10);
    const headers = ['Nº', 'COLABORADOR', 'ESTADO', campoItem || nome, 'QT', 'CARREGADOR', 'QT', 'BATERIA', 'QT', 'ENTREGA', 'DEVOLUÇÃO', 'ASSINATURA'];
    const hr = sh.getRange(3, 1, 1, 12);
    hr.setValues([headers]);
    hr.setFontWeight('bold');
    hr.setBackground('#E8EEF7');
    hr.setFontColor('#0B1F3A');
    hr.setHorizontalAlignment('center');
    hr.setVerticalAlignment('middle');
    hr.setWrap(true);
    sh.setFrozenRows(3);
    const larguras = [70, 145, 85, 150, 45, 100, 45, 135, 45, 92, 92, 190];
    larguras.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
    const numeros = [];
    for (let i = 1; i <= 50; i++) numeros.push([String(i)]);
    const nr = sh.getRange(4, 1, 50, 1);
    nr.setValues(numeros);
    nr.setHorizontalAlignment('center');
    nr.setNumberFormat('@');
    sh.getRange(4, 4, 50, 1).setNumberFormat('@');
    sh.getRange(4, 6, 50, 1).setNumberFormat('@');
    sh.getRange(4, 8, 50, 1).setNumberFormat('@');
    sh.getRange(4, 10, 50, 2).setNumberFormat('dd/mm/yyyy');
    sh.getRange(4, 1, 50, 12).setVerticalAlignment('middle');
    sh.setTabColor('#1F5FA8');
    return { nome: nome, sheet: sh, criada: true };
  } catch (e) {
    if (sh) { try { ss.deleteSheet(sh); } catch (e2) {} }
    throw e;
  }
}

function garantirAbaCategoria(cat) {
  const ss = getSpreadsheet();
  const nomeAtual = String(cat.NOME_ABA || '').trim();
  if (nomeAtual) {
    const existente = ss.getSheetByName(nomeAtual);
    if (existente) return { nome: nomeAtual, sheet: existente, criada: false };
  }
  const aba = criarAbaCategoria(nomeAtual || cat.NOME, cat.CAMPO_ITEM || 'ITEM', cat.ID);
  cat.NOME_ABA = aba.nome;
  cat.ATUALIZADO_EM = nowStamp();
  if (cat._row) updateObject(SHEET.CATEGORIAS, cat._row, cat);
  return { nome: aba.nome, sheet: aba.sheet, criada: true };
}

function proximoNumeroAba(sh) {
  const last = Math.max(sh.getLastRow(), 4);
  const vals = sh.getRange(4, 1, last - 3, 1).getValues();
  let max = 0;
  vals.forEach(function (r) {
    const m = String(r[0] || '').trim().match(/^\d+$/);
    if (m) max = Math.max(max, Number(m[0]));
  });
  return String(max + 1);
}

function linhaAbaValida(sh, row, eq, eqs, catId) {
  if (!row || row < 4) return false;
  const last = Math.max(sh.getLastRow(), 4);
  if (row > last) return false;
  const vals = sh.getRange(row, 1, 1, 12).getValues()[0];
  if (normalizarKey(vals[1] || '').indexOf('OBS') === 0 && !String(vals[3] || '').trim()) return false;
  for (let i = 0; i < eqs.length; i++) {
    const e = eqs[i];
    if (String(e.ID) === String(eq.ID)) continue;
    if (String(e.CATEGORIA_ID) === String(catId) && toInt(e.ORIGEM_LINHA) === row) return false;
  }
  return true;
}

function alocarLinhaAba(sh, catId, eq, eqs) {
  const last = Math.max(sh.getLastRow(), 4);
  const vals = sh.getRange(4, 1, Math.max(1, last - 3), 12).getValues();
  const usadas = {};
  eqs.forEach(function (e) {
    if (String(e.CATEGORIA_ID) === String(catId) && String(e.ID) !== String(eq.ID) && toInt(e.ORIGEM_LINHA) > 0) {
      usadas[toInt(e.ORIGEM_LINHA)] = true;
    }
  });
  for (let i = 0; i < vals.length; i++) {
    const rowNumber = i + 4;
    if (usadas[rowNumber]) continue;
    const v = vals[i];
    const a = String(v[0] || '').trim();
    if (!a) continue;
    if (normalizarKey(v[1] || '').indexOf('OBS') === 0 && !String(v[3] || '').trim()) continue;
    let vazio = true;
    for (let c = 1; c < 12; c++) {
      if (String(v[c] === null || v[c] === undefined ? '' : v[c]).trim() !== '') { vazio = false; break; }
    }
    if (vazio) return { row: rowNumber, numero: a };
  }
  // usa uma linha sem numeração, antes do resumo se possível
  let resumoRow = 0;
  for (let i = 0; i < vals.length; i++) {
    const rowNumber = i + 4;
    if (usadas[rowNumber]) continue;
    const v = vals[i];
    if (normalizarKey(v[1] || '').indexOf('OBS') === 0) { resumoRow = rowNumber; break; }
    let vazio = true;
    for (let c = 0; c < 12; c++) {
      if (String(v[c] === null || v[c] === undefined ? '' : v[c]).trim() !== '') { vazio = false; break; }
    }
    if (vazio) return { row: rowNumber, numero: proximoNumeroAba(sh) };
  }
  const numero = proximoNumeroAba(sh);
  if (resumoRow > 0) {
    sh.insertRowBefore(resumoRow);
    return { row: resumoRow, numero: numero };
  }
  const row = Math.max(sh.getLastRow() + 1, 4);
  return { row: row, numero: numero };
}

function formatarLinhaAba(sh, row) {
  sh.getRange(row, 1).setNumberFormat('@');
  sh.getRange(row, 4).setNumberFormat('@');
  sh.getRange(row, 6).setNumberFormat('@');
  sh.getRange(row, 8).setNumberFormat('@');
  sh.getRange(row, 10, 1, 2).setNumberFormat('dd/mm/yyyy');
}

function corStatusAba(status) {
  if (status === STATUS_EQ.MANUTENCAO) return '#FF0000';
  if (status === STATUS_EQ.INATIVO) return '#D9D9D9';
  if (status === STATUS_EQ.DISPONIVEL) return '#92D050';
  return '#FFFF00';
}

function estadoAba(valor) {
  const s = String(valor || '').toUpperCase();
  if (s === 'NAO_INFORMADO') return '';
  return s;
}

function dataParaIso(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const s = String(v || '').trim();
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}

function isoParaData(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

function notaPendenciasAba(loans) {
  const partes = [];
  (loans || []).forEach(function (l) {
    if (String(l.STATUS) !== STATUS_LOAN.ABERTO) return;
    const p = jsonParseSafe(l.ACESSORIOS_PENDENTES, []);
    if (!p.length) return;
    const itens = p.map(function (a) {
      const q = toInt(a.qtd);
      if (a.tipo === 'BATERIA') return q + ' ' + (q === 1 ? 'bateria' : 'baterias');
      return q + ' ' + (q === 1 ? 'carregador' : 'carregadores');
    }).join(', ');
    partes.push((l.COLABORADOR_NOME || 'Colaborador') + ': ' + itens);
  });
  return partes.length ? 'Acessórios pendentes — ' + partes.join('; ') : '';
}

function dadosAbaEquipamento(eq, rowAtual, loans) {
  rowAtual = rowAtual || [];
  const abertos = (loans || []).filter(function (l) { return String(l.STATUS) === STATUS_LOAN.ABERTO && toInt(l.QUANTIDADE) > 0; });
  const entregas = (loans || []).map(function (l) { return dataParaIso(l.DATA_ENTREGA); }).filter(Boolean).sort();
  const devolvidas = (loans || []).filter(function (l) {
    return String(l.EQUIPAMENTO_DEVOLVIDO) === 'SIM' && String(l.STATUS) !== STATUS_LOAN.TRANSFERIDO;
  }).map(function (l) { return dataParaIso(l.DATA_DEVOLUCAO_EQUIPAMENTO); }).filter(Boolean).sort();
  let jIso = '';
  let kIso = '';
  if ((loans || []).length > 0) {
    if (abertos.length > 0) {
      const datasAbertas = abertos.map(function (l) { return dataParaIso(l.DATA_ENTREGA); }).filter(Boolean).sort();
      jIso = datasAbertas.length ? datasAbertas[0] : (entregas.length ? entregas[entregas.length - 1] : '');
      kIso = '';
    } else {
      jIso = entregas.length ? entregas[entregas.length - 1] : '';
      kIso = devolvidas.length ? devolvidas[devolvidas.length - 1] : '';
    }
  } else {
    jIso = dataParaIso(rowAtual[9]);
    kIso = dataParaIso(rowAtual[10]);
  }
  const status = String(eq.STATUS || '');
  const b = status === STATUS_EQ.MANUTENCAO ? 'MANUTENÇÃO' : (status === STATUS_EQ.INATIVO ? '' : String(eq.COLABORADOR_ATUAL_NOME || ''));
  const c = estadoAba(eq.ESTADO_CONSERVACAO);
  const d = String(eq.CODIGO_MODELO || eq.MODELO || '');
  const e = toNumber(eq.QUANTIDADE_TOTAL);
  const f = toInt(eq.CARREGADOR_QTD) > 0 ? String(eq.CARREGADOR_CODIGO || '') : '0';
  const g = toInt(eq.CARREGADOR_QTD);
  const h = toInt(eq.BATERIA_QTD) > 0 ? String(eq.BATERIA_CODIGO || '') : '0';
  const i = toInt(eq.BATERIA_QTD);
  const l = String(eq.OBSERVACOES || '');
  return {
    numero: String(eq.ORIGEM_NUMERO || rowAtual[0] || '').trim(),
    b: b, c: c, d: d, e: e, f: f, g: g, h: h, i: i,
    jIso: jIso, kIso: kIso, j: isoParaData(jIso), k: isoParaData(kIso), l: l,
    cor: corStatusAba(status), nota: notaPendenciasAba(loans)
  };
}

function sincronizarEquipamento(eqOrId, opts) {
  opts = opts || {};
  const eq = typeof eqOrId === 'string' ? porId(lerTodosEquipamentos(), eqOrId) : eqOrId;
  assert(eq, 'EQUIPAMENTO_NAO_ENCONTRADO', 'Equipamento não encontrado para sincronização.');
  const cats = lerTodasCategorias();
  const cat = porId(cats, eq.CATEGORIA_ID);
  assert(cat, 'CATEGORIA_NAO_ENCONTRADA', 'Categoria do equipamento não encontrada.');
  const abaInfo = garantirAbaCategoria(cat);
  const sh = abaInfo.sheet;
  const eqs = lerTodosEquipamentos();
  const last = Math.max(sh.getLastRow(), 4);
  let row = toInt(eq.ORIGEM_LINHA);
  let numero = String(eq.ORIGEM_NUMERO || '').trim();
  if (!linhaAbaValida(sh, row, eq, eqs, cat.ID)) row = 0;
  if (!row) {
    const aloc = alocarLinhaAba(sh, cat.ID, eq, eqs);
    row = aloc.row;
    numero = String(aloc.numero || '').trim() || String(sh.getRange(row, 1).getValue() || '').trim();
    eq.ORIGEM_ABA = abaInfo.nome;
    eq.ORIGEM_LINHA = row;
    eq.ORIGEM_NUMERO = numero;
    if (eq._row) updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
  } else {
    if (!numero) numero = String(sh.getRange(row, 1).getValue() || '').trim();
    if (String(eq.ORIGEM_ABA || '') !== abaInfo.nome || toInt(eq.ORIGEM_LINHA) !== row || String(eq.ORIGEM_NUMERO || '') !== numero) {
      eq.ORIGEM_ABA = abaInfo.nome;
      eq.ORIGEM_LINHA = row;
      eq.ORIGEM_NUMERO = numero;
      if (eq._row) updateObject(SHEET.EQUIPAMENTOS, eq._row, eq);
    }
  }
  const rowAtual = sh.getRange(row, 1, 1, 12).getValues()[0];
  const loans = lerTodosEmprestimos().filter(function (l) { return String(l.EQUIPAMENTO_ID) === String(eq.ID); });
  const abertos = loans.filter(function (l) { return String(l.STATUS) === STATUS_LOAN.ABERTO && toInt(l.QUANTIDADE) > 0; });
  const entregas = loans.map(function (l) { return dataParaIso(l.DATA_ENTREGA); }).filter(Boolean).sort();
  const devolvidas = loans.filter(function (l) {
    return String(l.EQUIPAMENTO_DEVOLVIDO) === 'SIM' && String(l.STATUS) !== STATUS_LOAN.TRANSFERIDO;
  }).map(function (l) { return dataParaIso(l.DATA_DEVOLUCAO_EQUIPAMENTO); }).filter(Boolean).sort();
  let jIso = '';
  let kIso = '';
  if (loans.length > 0) {
    if (abertos.length > 0) {
      const datasAbertas = abertos.map(function (l) { return dataParaIso(l.DATA_ENTREGA); }).filter(Boolean).sort();
      jIso = datasAbertas.length ? datasAbertas[0] : (entregas.length ? entregas[entregas.length - 1] : '');
      kIso = '';
    } else {
      jIso = entregas.length ? entregas[entregas.length - 1] : '';
      kIso = devolvidas.length ? devolvidas[devolvidas.length - 1] : '';
    }
  } else {
    // Equipamento importado sem empréstimo reconstruído: preserva as datas da origem.
    jIso = dataParaIso(rowAtual[9]);
    kIso = dataParaIso(rowAtual[10]);
  }
  const status = String(eq.STATUS || '');
  const b = status === STATUS_EQ.MANUTENCAO ? 'MANUTENÇÃO' : (status === STATUS_EQ.INATIVO ? '' : String(eq.COLABORADOR_ATUAL_NOME || ''));
  const c = estadoAba(eq.ESTADO_CONSERVACAO);
  const d = String(eq.CODIGO_MODELO || eq.MODELO || '');
  const e = toNumber(eq.QUANTIDADE_TOTAL);
  const f = toInt(eq.CARREGADOR_QTD) > 0 ? String(eq.CARREGADOR_CODIGO || '') : '0';
  const g = toInt(eq.CARREGADOR_QTD);
  const h = toInt(eq.BATERIA_QTD) > 0 ? String(eq.BATERIA_CODIGO || '') : '0';
  const i = toInt(eq.BATERIA_QTD);
  const j = isoParaData(jIso);
  const k = isoParaData(kIso);
  const l = String(eq.OBSERVACOES || '');
  if (!numero) numero = String(rowAtual[0] || '').trim();
  formatarLinhaAba(sh, row);
  sh.getRange(row, 1, 1, 12).setValues([[numero, b, c, d, e, f, g, h, i, j, k, l]]);
  const cor = corStatusAba(status);
  sh.getRange(row, 2).setBackground(cor);
  const nota = notaPendenciasAba(loans);
  if (nota) sh.getRange(row, 2).setNote(nota); else sh.getRange(row, 2).clearNote();
  // Confirma a persistência na aba original.
  const lidos = sh.getRange(row, 1, 1, 12).getValues()[0];
  const problemas = [];
  const cmp = function (campo, esperado, lido) {
    if (String(esperado === null || esperado === undefined ? '' : esperado) !== String(lido === null || lido === undefined ? '' : lido)) {
      problemas.push(campo);
    }
  };
  cmp('Nº', numero, String(lidos[0] || '').trim());
  cmp('COLABORADOR', b, String(lidos[1] || '').trim());
  cmp('ESTADO', c, String(lidos[2] || '').trim());
  cmp('ITEM', d, String(lidos[3] || '').trim());
  cmp('QT', e, toNumber(lidos[4]));
  cmp('CARREGADOR', f, String(lidos[5] || '').trim());
  cmp('QT CARREGADOR', g, toNumber(lidos[6]));
  cmp('BATERIA', h, String(lidos[7] || '').trim());
  cmp('QT BATERIA', i, toNumber(lidos[8]));
  cmp('ENTREGA', jIso, dataParaIso(lidos[9]));
  cmp('DEVOLUÇÃO', kIso, dataParaIso(lidos[10]));
  cmp('ASSINATURA', l, String(lidos[11] || '').trim());
  if (String(sh.getRange(row, 2).getBackground() || '').toLowerCase() !== cor.toLowerCase()) problemas.push('COR');
  if (problemas.length) {
    fail('SINCRONIZACAO_FALHOU', 'A aba "' + abaInfo.nome + '" não confirmou a gravação dos campos: ' + problemas.join(', ') + '.');
  }
  return { aba: abaInfo.nome, linha: row, numero: numero };
}

function sincronizarEquipamentoSeguro(eqOrId, opts) {
  opts = opts || {};
  let eq = typeof eqOrId === 'string' ? porId(lerTodosEquipamentos(), eqOrId) : eqOrId;
  try {
    return Object.assign({ ok: true }, sincronizarEquipamento(eq, opts));
  } catch (e) {
    const aba = (() => {
      try {
        const cats = lerTodasCategorias();
        const c = porId(cats, eq && eq.CATEGORIA_ID);
        return c ? String(c.NOME_ABA || c.NOME || '') : '';
      } catch (e2) { return ''; }
    })();
    try {
      audit(opts.session, 'SINCRONIZACAO_FALHOU', 'EQUIPAMENTO', eq ? eq.ID : '', { erro: e.message, aba: aba, codigo: eq ? eq.CODIGO : '' }, opts.requestId);
    } catch (e2) {}
    try { console.error('Falha ao sincronizar aba: ' + e.message); } catch (e2) {}
    return { ok: false, erro: e.message, aba: aba };
  }
}

function limparLinhaAba(aba, linha) {
  const row = toInt(linha);
  if (!aba || row < 4) return;
  const sh = getSpreadsheet().getSheetByName(aba);
  if (!sh) return;
  const vals = sh.getRange(row, 1, 1, 12).getValues()[0];
  if (normalizarKey(vals[1] || '').indexOf('OBS') === 0 && !String(vals[3] || '').trim()) return;
  sh.getRange(row, 2, 1, 11).clearContent();
  sh.getRange(row, 2).setBackground('#FFFFFF').clearNote();
}

function sincronizarGrupoAba(sh, cat, grupo, todosEquipamentos, todosEmprestimos, opts) {
  const last = Math.max(sh.getLastRow(), 4);
  const data = sh.getRange(4, 1, last - 3, 12).getValues();
  const bgs = sh.getRange(4, 2, last - 3, 1).getBackgrounds();
  const notes = sh.getRange(4, 2, last - 3, 1).getNotes();
  let writeLen = data.length;
  for (let i = 0; i < data.length; i++) {
    if (normalizarKey(data[i][1] || '').indexOf('OBS') === 0 && !String(data[i][3] || '').trim()) { writeLen = i; break; }
  }
  const owner = {};
  todosEquipamentos.forEach(function (e) {
    if (String(e.CATEGORIA_ID) === String(cat.ID) && toInt(e.ORIGEM_LINHA) > 0) owner[toInt(e.ORIGEM_LINHA)] = e.ID;
  });
  const usados = {};
  Object.keys(owner).forEach(function (r) { usados[Number(r)] = true; });
  const erros = [];
  let ok = 0;
  const mudou = [];
  const escritos = {};
  for (let n = 0; n < grupo.length; n++) {
    const eq = grupo[n];
    let rowNumber = toInt(eq.ORIGEM_LINHA);
    let idx = rowNumber - 4;
    let valido = idx >= 0 && idx < writeLen && (owner[rowNumber] === eq.ID || !owner[rowNumber]);
    if (valido) {
      const atual = data[idx] || [];
      if (normalizarKey(atual[1] || '').indexOf('OBS') === 0 && !String(atual[3] || '').trim()) valido = false;
    }
    if (!valido) {
      let achou = -1;
      for (let i = 0; i < writeLen; i++) {
        const rn = i + 4;
        if (usados[rn]) continue;
        const a = String(data[i][0] || '').trim();
        if (!a) continue;
        if (normalizarKey(data[i][1] || '').indexOf('OBS') === 0 && !String(data[i][3] || '').trim()) continue;
        let vazio = true;
        for (let c = 1; c < 12; c++) {
          if (String(data[i][c] === null || data[i][c] === undefined ? '' : data[i][c]).trim() !== '') { vazio = false; break; }
        }
        if (vazio) { achou = i; break; }
      }
      if (achou < 0) {
        const r = sincronizarEquipamentoSeguro(eq, opts);
        if (r.ok) ok++; else erros.push({ codigo: eq.CODIGO, erro: r.erro });
        continue;
      }
      idx = achou;
      rowNumber = idx + 4;
      eq.ORIGEM_ABA = cat.NOME_ABA;
      eq.ORIGEM_LINHA = rowNumber;
      eq.ORIGEM_NUMERO = String(data[idx][0] || '').trim();
      mudou.push(eq);
    }
    usados[rowNumber] = true;
    const d = dadosAbaEquipamento(eq, data[idx] || [], (todosEmprestimos || []).filter(function (l) { return String(l.EQUIPAMENTO_ID) === String(eq.ID); }));
    if (!d.numero) d.numero = String((data[idx] || [])[0] || '').trim();
    data[idx] = [d.numero, d.b, d.c, d.d, d.e, d.f, d.g, d.h, d.i, d.j, d.k, d.l];
    bgs[idx][0] = d.cor;
    notes[idx][0] = d.nota;
    escritos[rowNumber] = { eq: eq, d: d };
    ok++;
  }
  if (writeLen > 0) {
    sh.getRange(4, 1, writeLen, 12).setValues(data.slice(0, writeLen));
    sh.getRange(4, 2, writeLen, 1).setBackgrounds(bgs.slice(0, writeLen));
    sh.getRange(4, 2, writeLen, 1).setNotes(notes.slice(0, writeLen).map(function (x) { return [x[0]]; }));
    sh.getRange(4, 1, writeLen, 1).setNumberFormat('@');
    sh.getRange(4, 4, writeLen, 1).setNumberFormat('@');
    sh.getRange(4, 6, writeLen, 1).setNumberFormat('@');
    sh.getRange(4, 8, writeLen, 1).setNumberFormat('@');
    sh.getRange(4, 10, writeLen, 2).setNumberFormat('dd/mm/yyyy');
    const lidos = sh.getRange(4, 1, writeLen, 12).getValues();
    const lidosBg = sh.getRange(4, 2, writeLen, 1).getBackgrounds();
    Object.keys(escritos).forEach(function (rn) {
      const i = Number(rn) - 4;
      if (i < 0 || i >= writeLen) return;
      const e = escritos[rn];
      const l = lidos[i];
      const problemas = [];
      const cmp = function (nome, esperado, lido) {
        if (String(esperado === null || esperado === undefined ? '' : esperado) !== String(lido === null || lido === undefined ? '' : lido)) problemas.push(nome);
      };
      cmp('Nº', e.d.numero, String(l[0] || '').trim());
      cmp('COLABORADOR', e.d.b, String(l[1] || '').trim());
      cmp('ESTADO', e.d.c, String(l[2] || '').trim());
      cmp('ITEM', e.d.d, String(l[3] || '').trim());
      cmp('QT', e.d.e, toNumber(l[4]));
      cmp('CARREGADOR', e.d.f, String(l[5] || '').trim());
      cmp('QT CARREGADOR', e.d.g, toNumber(l[6]));
      cmp('BATERIA', e.d.h, String(l[7] || '').trim());
      cmp('QT BATERIA', e.d.i, toNumber(l[8]));
      cmp('ENTREGA', e.d.jIso, dataParaIso(l[9]));
      cmp('DEVOLUÇÃO', e.d.kIso, dataParaIso(l[10]));
      cmp('ASSINATURA', e.d.l, String(l[11] || '').trim());
      if (String(lidosBg[i][0] || '').toLowerCase() !== e.d.cor.toLowerCase()) problemas.push('COR');
      if (problemas.length) erros.push({ codigo: e.eq.CODIGO, erro: 'Aba "' + cat.NOME_ABA + '" linha ' + rn + ' não confirmou: ' + problemas.join(', ') });
    });
  }
  mudou.forEach(function (e) { if (e._row) updateObject(SHEET.EQUIPAMENTOS, e._row, e); });
  return { ok: ok, erros: erros };
}

function sincronizarTudoInterno(session, requestId) {
  const cats = lerTodasCategorias();
  const eqs = lerTodosEquipamentos();
  const todosEmprestimos = lerTodosEmprestimos();
  const erros = [];
  let abasCriadas = 0;
  let ok = 0;
  const porCategoria = {};
  eqs.forEach(function (e) { (porCategoria[e.CATEGORIA_ID] = porCategoria[e.CATEGORIA_ID] || []).push(e); });
  cats.forEach(function (cat) {
    try {
      const r = garantirAbaCategoria(cat);
      if (r.criada) abasCriadas++;
      const grupo = porCategoria[cat.ID] || [];
      if (grupo.length) {
        const g = sincronizarGrupoAba(r.sheet, cat, grupo, eqs, todosEmprestimos, { session: session, requestId: requestId });
        ok += g.ok;
        g.erros.forEach(function (e) { erros.push(e); });
      }
    } catch (e) {
      erros.push({ categoria: cat.NOME, erro: e.message });
    }
  });
  eqs.forEach(function (e) {
    if (!porId(cats, e.CATEGORIA_ID)) erros.push({ codigo: e.CODIGO, erro: 'Categoria não encontrada' });
  });
  configSet('ULTIMA_SINCRONIZACAO', nowStamp());
  if (!erros.length) configSet('SINCRONIZACAO_INICIAL', 'OK');
  audit(session, 'SINCRONIZAR_PLANILHA', 'PLANILHA', '', { equipamentos: ok, total: eqs.length, abasCriadas: abasCriadas, erros: erros.length }, requestId);
  return {
    equipamentosSincronizados: ok,
    total: eqs.length,
    abasCriadas: abasCriadas,
    erros: erros,
    quando: nowStamp()
  };
}

function sincronizarTudo(payload, session, requestId) {
  exigirAdmin(session);
  requireRequestId(requestId);
  return withIdempotencia(requestId, function () {
    return withLock(function () {
      return sincronizarTudoInterno(session, requestId);
    });
  });
}


/**
 * Diagnóstico e manutenção da estrutura. Execute pelo editor do Apps Script.
 */

function testarEstrutura() {
  const ss = getSpreadsheet();
  const problemas = [];
  Object.keys(SHEET).forEach(function (k) {
    const nome = SHEET[k];
    const sh = ss.getSheetByName(nome);
    if (!sh) { problemas.push('Aba ausente: ' + nome); return; }
    const esperado = HEADERS[nome] || [];
    const atual = sh.getRange(1, 1, 1, Math.max(1, esperado.length)).getValues()[0].map(function (x) { return String(x || '').trim(); });
    for (let i = 0; i < esperado.length; i++) {
      if (String(atual[i] || '') !== String(esperado[i] || '')) {
        problemas.push(nome + ' coluna ' + (i + 1) + ': esperado "' + esperado[i] + '", encontrado "' + atual[i] + '"');
      }
    }
  });
  const resumo = {
    equipamentos: lerTodosEquipamentos().length,
    colaboradores: lerTodosColaboradores().length,
    categorias: lerTodasCategorias().length,
    emprestimos: lerTodosEmprestimos().length,
    movimentacoes: lerTodosMovimentos().length,
    manutencoes: lerTodasManutencoes().length,
    usuarios: lerTodosUsuarios().length,
    sessoes: readObjects(SHEET.SESSOES).length,
    auditoria: readObjects(SHEET.AUDITORIA).length,
    configKeys: Object.keys(getConfigMap()).length
  };
  Logger.log('RESUMO: ' + JSON.stringify(resumo));
  if (problemas.length) Logger.log('PROBLEMAS:\n' + problemas.join('\n'));
  else Logger.log('Estrutura OK: todas as abas e cabeçalhos conferem.');
  return { resumo: resumo, problemas: problemas };
}

/**
 * Garante que as células de dados das abas do sistema sejam texto.
 * Isso evita que observações iniciadas por "=" virem fórmula e preserva códigos.
 */
function formatarAbasComoSistema() {
  const ss = getSpreadsheet();
  Object.keys(SHEET).forEach(function (k) {
    const nome = SHEET[k];
    const sh = ss.getSheetByName(nome);
    if (!sh) return;
    const ncol = Math.max(1, (HEADERS[nome] || []).length);
    sh.getRange(2, 1, Math.max(1, sh.getMaxRows() - 1), ncol).setNumberFormat('@');
    Logger.log('Formato texto aplicado em ' + nome);
  });
}

/**
 * Verifica se há administrador ativo e se o setup está habilitado.
 */
function diagnosticoSetup() {
  const st = setupStatus();
  const cfg = getConfigMap();
  Logger.log(JSON.stringify({
    setup: st,
    setupCriadoEm: cfg.SETUP_CRIADO_EM || '',
    setupUsadoEm: cfg.SETUP_USADO_EM || '',
    resetExpiraEm: cfg.RESET_EXPIRA_EM || '',
    importacao: cfg.IMPORTACAO_CONCLUIDA_EM || '',
    modo: cfg.IMPORTACAO_MODO || ''
  }, null, 2));
  return st;
}

/**
 * Executa a sincronização das abas originais pelo editor, sem precisar do app.
 * Use depois de uma manutenção manual na planilha.
 */
function sincronizarPlanilhaEditor() {
  const r = sincronizarTudoInterno(
    { id: 'EDITOR', email: 'EDITOR', perfil: PERFIL.ADMIN },
    'EDITOR-' + Date.now()
  );
  Logger.log(JSON.stringify(r, null, 2));
  return r;
}


/**
 * Roteador da API. Todas as operações de dados usam POST com corpo JSON.
 * O token de sessão vai no corpo, nunca na URL.
 */

const PUBLIC_ACTIONS = {
  status: function (payload, requestId) {
    return { app: APP_NOME, versao: API_VERSAO, status: 'online', hora: nowStamp() };
  },
  setupStatus: function () {
    return setupStatus();
  },
  setupAdmin: function (payload, requestId) {
    return setupAdmin(payload, requestId);
  },
  login: function (payload, requestId) {
    return login(payload, requestId);
  },
  autoCadastro: function (payload, requestId) {
    return autoCadastro(payload, requestId);
  },
  recuperarAdmin: function (payload, requestId) {
    return recuperarAdmin(payload, requestId);
  }
};

const AUTH_READ = {
  bootstrap: function (payload, session) { return dashboardData(session); },
  detalheEquipamento: function (payload, session) { return detalheEquipamento(payload, session); },
  listarMovimentacoes: function (payload, session) { return listarMovimentacoes(payload, session); },
  listarManutencoes: function (payload, session) { return listarManutencoes(payload, session); }
};

const AUTH_WRITE = {
  logout: function (payload, session, requestId) { return logout(session, requestId); },
  alterarMinhaSenha: function (payload, session, requestId) { return alterarMinhaSenha(payload, session, requestId); }
};

const ADMIN_READ = {
  listarUsuarios: function (payload, session) { return listarUsuarios(session, payload); },
  listarAuditoria: function (payload, session) { return listarAuditoria(payload, session); }
};

const ADMIN_WRITE = {
  criarEquipamento: criarEquipamento,
  editarEquipamento: editarEquipamento,
  marcarRevisadoEquipamento: marcarRevisadoEquipamento,
  inativarEquipamento: inativarEquipamento,
  reativarEquipamento: reativarEquipamento,
  excluirEquipamento: excluirEquipamento,
  criarColaborador: criarColaborador,
  editarColaborador: editarColaborador,
  inativarColaborador: inativarColaborador,
  reativarColaborador: reativarColaborador,
  excluirColaborador: excluirColaborador,
  criarCategoria: criarCategoria,
  editarCategoria: editarCategoria,
  inativarCategoria: inativarCategoria,
  reativarCategoria: reativarCategoria,
  excluirCategoria: excluirCategoria,
  registrarEntrega: registrarEntrega,
  registrarDevolucao: registrarDevolucao,
  registrarTransferencia: registrarTransferencia,
  abrirManutencao: abrirManutencao,
  atualizarManutencao: atualizarManutencao,
  concluirManutencao: concluirManutencao,
  cancelarManutencao: cancelarManutencao,
  criarUsuario: criarUsuario,
  editarUsuario: editarUsuario,
  resetarSenhaUsuario: resetarSenhaUsuario,
  bloquearUsuario: bloquearUsuario,
  desbloquearUsuario: desbloquearUsuario,
  aprovarUsuario: aprovarUsuario,
  sincronizarTudo: sincronizarTudo
};

function doGet(e) {
  return jsonOut({
    ok: true,
    data: {
      app: APP_NOME,
      versao: API_VERSAO,
      status: 'online',
      mensagem: 'API ativa. Use a interface publicada no GitHub Pages.',
      hora: nowStamp()
    }
  });
}

function doPost(e) {
  let body = null;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');
  } catch (err) {
    return jsonOut(respostaErro('JSON_INVALIDO', 'Corpo da requisição inválido.'));
  }
  try {
    const action = String((body && body.action) || '').trim();
    const payload = (body && body.payload && typeof body.payload === 'object') ? body.payload : {};
    const requestId = String((body && body.requestId) || '');
    if (!action) return jsonOut(respostaErro('ACAO_OBRIGATORIA', 'Informe a ação.'));

    if (PUBLIC_ACTIONS[action]) {
      return jsonOut({ ok: true, data: PUBLIC_ACTIONS[action](payload, requestId) });
    }

    const session = validarSessao(body.token);

    if (AUTH_READ[action]) {
      return jsonOut({ ok: true, data: AUTH_READ[action](payload, session) });
    }
    if (ADMIN_READ[action]) {
      exigirAdmin(session);
      return jsonOut({ ok: true, data: ADMIN_READ[action](payload, session) });
    }
    if (AUTH_WRITE[action]) {
      return jsonOut({ ok: true, data: AUTH_WRITE[action](payload, session, requestId) });
    }
    if (ADMIN_WRITE[action]) {
      exigirAdmin(session);
      const idReq = requireRequestId(requestId);
      const cached = cacheGet('idem_' + idReq);
      if (cached) {
        try { return jsonOut({ ok: true, data: JSON.parse(cached) }); } catch (e) {}
      }
      return jsonOut({ ok: true, data: ADMIN_WRITE[action](payload, session, requestId) });
    }
    return jsonOut(respostaErro('ACAO_INVALIDA', 'Ação não reconhecida.'));
  } catch (err) {
    if (err && err.code) {
      return jsonOut(respostaErro(err.code, err.message || 'Não foi possível concluir a operação.', err.details || null));
    }
    try { console.error(err && err.stack ? err.stack : String(err)); } catch (e) {}
    return jsonOut(respostaErro('ERRO_INTERNO', 'Não foi possível concluir a operação. Tente novamente.'));
  }
}

return { doGet: doGet, doPost: doPost };
})();
function maquinasApiGet_(e){return GVG_MAQUINAS_API_.doGet(e);}
function maquinasApiPost_(e){return GVG_MAQUINAS_API_.doPost(e);}
