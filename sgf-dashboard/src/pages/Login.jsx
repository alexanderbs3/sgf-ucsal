import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, erro, setErro } = useAuth()
  const [email,      setEmail]      = useState('')
  const [senha,      setSenha]      = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !senha) return
    setCarregando(true)
    setErro(null)
    try {
      await login(email.trim(), senha)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm fade-in" style={{ animationFillMode: 'forwards' }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
              boxShadow: '0 0 32px rgba(59,130,246,0.4)',
            }}
          >
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-xl tracking-tight" style={{ color: 'var(--text)' }}>
            SGF
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--muted)' }}>
            Sistema de Gestão de Fiscalização
          </p>
        </div>

        {/* Card de login */}
        <div
          className="rounded-2xl"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          }}
        >
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Acesso ao sistema
            </p>
            <p className="text-xs font-body mt-0.5" style={{ color: 'var(--muted)' }}>
              Use suas credenciais institucionais.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-body font-medium mb-1.5" style={{ color: 'var(--subtle)' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.gov.br"
                required
                autoComplete="email"
                className="input-base w-full"
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-body font-medium mb-1.5" style={{ color: 'var(--subtle)' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-base w-full pr-10"
                  style={{ fontSize: '0.8125rem' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  tabIndex={-1}
                >
                  {mostrarSenha
                    ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div
                className="p-3 rounded-lg flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <svg width="13" height="13" fill="none" stroke="#F87171" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-xs font-body" style={{ color: '#F87171' }}>{erro}</p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="w-full py-2.5 rounded-lg text-sm font-body font-medium transition-all"
              style={{
                background: carregando || !email || !senha
                  ? 'rgba(59,130,246,0.3)'
                  : 'rgba(59,130,246,0.9)',
                color: 'white',
                cursor: carregando || !email || !senha ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {carregando
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Autenticando...
                  </span>
                : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[10px] mt-6" style={{ color: 'var(--muted)' }}>
          PROVIC · UCSAL · SGF v5.0
        </p>
      </div>
    </div>
  )
}
