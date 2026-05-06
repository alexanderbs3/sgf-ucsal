import axios from 'axios'

const SGF_TOKEN_KEY = 'sgf_token'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

// ── Interceptor de requisição: injeta o JWT em todas as chamadas ───────────
client.interceptors.request.use(config => {
  const token = localStorage.getItem(SGF_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Interceptor de resposta: extrai mensagem legível do backend ────────────
client.interceptors.response.use(
  res => res,
  err => {
    // 401 = token expirado ou inválido → limpa a sessão e força novo login
    if (err?.response?.status === 401) {
      localStorage.removeItem(SGF_TOKEN_KEY)
      sessionStorage.clear()
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }

    const msg =
      err?.response?.data?.mensagem ||
      err?.response?.data?.message  ||
      err?.message                  ||
      'Erro desconhecido'
    return Promise.reject(new Error(msg))
  }
)

export { SGF_TOKEN_KEY }
export default client
