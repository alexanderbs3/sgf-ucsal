import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, me as apiMe } from '../api/sgf'
import { SGF_TOKEN_KEY } from '../api/client'

/**
 * Definição de permissões por papel.
 *
 * ADMIN  : acesso total, incluindo gestão de usuários
 * GESTOR : cadastra/edita obras, gerencia itens, acompanha andamento
 * FISCAL : visualiza obras, atualiza status, insere registros de vistoria
 */
export const PERMISSOES = {
  ADMIN: {
    label:    'Administrador',
    descricao: 'Acesso total ao sistema, incluindo criação e gestão de usuários.',
    pode: [
      'gerenciar_usuarios',
      'criar_obra',
      'editar_obra',
      'deletar_obra',
      'alterar_status_obra',
      'adicionar_item',
      'editar_item',
      'deletar_item',
      'ver_dashboard',
      'ver_relatorios',
      'ver_analytics',
      'exportar',
    ],
  },
  GESTOR: {
    label:    'Gestor',
    descricao: 'Cadastra e edita obras, gerencia itens e acompanha o andamento geral.',
    pode: [
      'criar_obra',
      'editar_obra',
      'alterar_status_obra',
      'adicionar_item',
      'editar_item',
      'ver_dashboard',
      'ver_relatorios',
      'ver_analytics',
      'exportar',
    ],
  },
  FISCAL: {
    label:    'Fiscal',
    descricao: 'Visualiza obras vinculadas, atualiza status de execução e insere registros de vistoria.',
    pode: [
      'ver_dashboard',
      'ver_relatorios',
      'alterar_status_obra',
      'adicionar_item',
      'exportar',
    ],
  },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario,    setUsuario]    = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro,       setErro]       = useState(null)

  // ── Restaurar sessão do localStorage na inicialização ──────────────────
  useEffect(() => {
    const token = localStorage.getItem(SGF_TOKEN_KEY)
    if (!token) {
      setCarregando(false)
      return
    }
    // Token existe: busca dados frescos do backend (/auth/me)
    apiMe()
      .then(u => setUsuario(u))
      .catch(() => {
        // Token inválido ou expirado: limpa tudo
        localStorage.removeItem(SGF_TOKEN_KEY)
      })
      .finally(() => setCarregando(false))
  }, [])

  // ── Login com email + senha ────────────────────────────────────────────
  const login = useCallback(async (email, senha) => {
    setErro(null)
    const data = await apiLogin(email, senha)
    localStorage.setItem(SGF_TOKEN_KEY, data.token)
    // Usa os dados retornados pelo login para popular o contexto imediatamente
    setUsuario({
      id:    data.id,
      nome:  data.nome,
      email: data.email,
      papel: data.papel,
    })
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(SGF_TOKEN_KEY)
    setUsuario(null)
    setErro(null)
  }, [])

  /**
   * Verifica se o usuário logado tem a permissão informada.
   * Retorna false se não houver usuário logado.
   */
  const pode = useCallback((permissao) => {
    if (!usuario) return false
    return PERMISSOES[usuario.papel]?.pode.includes(permissao) ?? false
  }, [usuario])

  return (
    <AuthContext.Provider value={{ usuario, carregando, erro, setErro, login, logout, pode, PERMISSOES }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
