import client from './client'

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Autentica com email + senha e retorna { token, id, nome, email, papel }.
 */
export const login = (email, senha) =>
  client.post('/auth/login', { email, senha }).then(r => r.data)

/**
 * Define a senha inicial de um usuário seed (sem autenticação).
 * @param {string} id UUID do usuário
 * @param {string} senha nova senha (min 6 chars)
 */
export const definirSenha = (id, senha) =>
  client.post(`/auth/definir-senha/${id}`, { senha }).then(r => r.data)

/**
 * Retorna os dados do usuário autenticado (exige JWT no header).
 */
export const me = () =>
  client.get('/auth/me').then(r => r.data)

// ── Obras ─────────────────────────────────────────────────────────────────────

/** Lista todas as obras sem filtro (compatibilidade com Obras.jsx) */
export const getObras = () =>
  client.get('/obras').then(r => r.data)

/**
 * Busca obras com filtros opcionais.
 * @param {string|null} q      texto livre (código ou descrição)
 * @param {string|null} status StatusObra: PLANEJADA | EM_ANDAMENTO | PARALISADA | CONCLUIDA
 */
export const buscarObras = (q, status) => {
  const params = {}
  if (q)      params.q      = q
  if (status) params.status = status
  return client.get('/obras/buscar', { params }).then(r => r.data)
}

export const getObra = (id) =>
  client.get(`/obras/${id}`).then(r => r.data)

export const getDashboard = (id) =>
  client.get(`/obras/${id}/dashboard`).then(r => r.data)

/** Timeline de vistorias agrupada por dia — para o gráfico de linha */
export const getTimelineVistorias = (id) =>
  client.get(`/obras/${id}/timeline`).then(r => r.data)

export const criarObra = (dto) =>
  client.post('/obras', dto).then(r => r.data)

/**
 * Atualiza código, descrição e datas de uma obra existente.
 * Para alterar status use atualizarStatusObra.
 */
export const atualizarObra = (id, dto) =>
  client.put(`/obras/${id}`, dto).then(r => r.data)

/**
 * Atualiza o status de uma obra.
 * @param {string} id
 * @param {string} status StatusObra
 */
export const atualizarStatusObra = (id, status) =>
  client.patch(`/obras/${id}/status`, { status }).then(r => r.data)

export const deletarObra = (id) =>
  client.delete(`/obras/${id}`).then(r => r.data)

// ── Itens ─────────────────────────────────────────────────────────────────────

/** Lista simples por obra + classe opcional (compatibilidade) */
export const getItens = (obraId, classificacao) => {
  const params = { obraId }
  if (classificacao) params.classificacao = classificacao
  return client.get('/itens', { params }).then(r => r.data)
}

/**
 * Busca de itens com filtros compostos e ordenação dinâmica.
 * @param {string}      obraId   obrigatório
 * @param {string|null} tipo     A | B | C
 * @param {string|null} status   PENDENTE | EM_VISTORIA | APROVADO | REPROVADO
 * @param {string|null} q        busca por descrição
 * @param {string}      sortBy   descricao | status | classificacaoTipo
 * @param {string}      sortDir  asc | desc
 */
export const buscarItens = (obraId, { tipo, status, q, sortBy = 'descricao', sortDir = 'asc' } = {}) => {
  const params = { obraId, sortBy, sortDir }
  if (tipo)   params.tipo   = tipo
  if (status) params.status = status
  if (q)      params.q      = q
  return client.get('/itens/buscar', { params }).then(r => r.data)
}

export const getItem = (id) =>
  client.get(`/itens/${id}`).then(r => r.data)

export const criarItem = (dto) =>
  client.post('/itens', dto).then(r => r.data)

/**
 * Atualiza classificação e descrição de um item.
 * @param {string} id
 * @param {{ classificacaoId: string, descricao: string }} dto
 */
export const atualizarItem = (id, dto) =>
  client.put(`/itens/${id}`, dto).then(r => r.data)

/**
 * Atualiza o status de um item com validação de transição.
 * @param {string} id
 * @param {string} status StatusItem
 */
export const atualizarStatusItem = (id, status) =>
  client.patch(`/itens/${id}/status`, { status }).then(r => r.data)

export const deletarItem = (id) =>
  client.delete(`/itens/${id}`).then(r => r.data)

// ── Vistorias ─────────────────────────────────────────────────────────────────

export const getVistorias = (obraId) =>
  client.get('/vistorias', { params: { obraId } }).then(r => r.data)

export const getVistoria = (id) =>
  client.get(`/vistorias/${id}`).then(r => r.data)

export const criarVistoria = (dto) =>
  client.post('/vistorias', dto).then(r => r.data)

// ── Logs de Fiscalização ──────────────────────────────────────────────────────

export const getLogs = (vistoriaId) =>
  client.get('/logs', { params: { vistoriaId } }).then(r => r.data)

export const getLogsPorItem = (itemId) =>
  client.get('/logs', { params: { itemId } }).then(r => r.data)

export const criarLog = (dto) =>
  client.post('/logs', dto).then(r => r.data)

// ── Lookups ───────────────────────────────────────────────────────────────────

/** Retorna as 3 classificações ABC para popular selects */
export const getClassificacoes = () =>
  client.get('/classificacoes').then(r => r.data)

/** Retorna usuários (fiscais/gestores) para popular selects */
export const getUsuarios = () =>
  client.get('/usuarios').then(r => r.data)

/** Retorna origens de dado para popular selects no log de fiscalização */
export const getOrigensDado = () =>
  client.get('/origens-dado').then(r => r.data)

// ── Usuários CRUD ─────────────────────────────────────────────────────────────

export const getUsuario = (id) =>
  client.get(`/usuarios/${id}`).then(r => r.data)

/** Lista os papéis disponíveis: ['FISCAL', 'GESTOR', 'ADMIN'] */
export const getPapeis = () =>
  client.get('/usuarios/papeis').then(r => r.data)

export const criarUsuario = (dto) =>
  client.post('/usuarios', dto).then(r => r.data)

export const atualizarUsuario = (id, dto) =>
  client.put(`/usuarios/${id}`, dto).then(r => r.data)

export const atualizarPapelUsuario = (id, papel) =>
  client.patch(`/usuarios/${id}/papel`, { papel }).then(r => r.data)

/**
 * Remove um usuário pelo id.
 * @param {string}  id     UUID do usuário
 * @param {boolean} forcar Quando true, desvincula as vistorias e força a exclusão
 *                         mesmo que o usuário possua vistorias registradas.
 *                         Exclusivo para Administradores — o controle de acesso
 *                         é feito no frontend (AuthContext) antes de chamar esta função.
 */
export const deletarUsuario = (id, forcar = false) =>
  client.delete(`/usuarios/${id}`, { params: { forcar } }).then(r => r.data)
