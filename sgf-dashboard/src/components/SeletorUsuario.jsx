import { useState } from 'react'
import { useAuth, PERMISSOES } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const PAPEL_COLOR = {
  ADMIN:  { bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.3)',   text:'#F87171',  glow:'rgba(239,68,68,0.2)'  },
  GESTOR: { bg:'rgba(139,92,246,0.1)',  border:'rgba(139,92,246,0.3)',  text:'#A78BFA',  glow:'rgba(139,92,246,0.2)' },
  FISCAL: { bg:'rgba(59,130,246,0.1)',  border:'rgba(59,130,246,0.3)',  text:'#60A5FA',  glow:'rgba(59,130,246,0.2)' },
}

const PAPEL_ICON = {
  ADMIN: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  GESTOR: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  FISCAL: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="2"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  ),
}

export default function SeletorUsuario() {
  const { usuarios, carregando, login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [selecionado, setSelecionado] = useState(null)
  const [search, setSearch] = useState('')

  const filtrados = usuarios.filter(u => {
    const q = search.trim().toLowerCase()
    return !q || u.nome.toLowerCase().includes(q) || u.papel.toLowerCase().includes(q)
  })

  // Agrupar por papel: ADMIN → GESTOR → FISCAL
  const ordem = ['ADMIN', 'GESTOR', 'FISCAL']
  const grupos = ordem.reduce((acc, p) => {
    const lista = filtrados.filter(u => u.papel === p)
    if (lista.length > 0) acc[p] = lista
    return acc
  }, {})

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-lg">
        {/* Theme toggle no topo direito */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
            style={{ background:'var(--card)', border:'1px solid var(--border)', color:'var(--subtle)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.color='var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--subtle)' }}>
            {theme === 'dark' ? (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
            <span className="font-mono text-[10px]">
              {theme === 'dark' ? 'Claro' : 'Escuro'}
            </span>
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-10 fade-up" style={{ animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
              boxShadow: '0 0 32px rgba(59,130,246,0.4)',
            }}>
            <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: 'var(--text)' }}>
            SGF
          </h1>
          <p className="font-mono text-xs mt-1 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Sistema de Gestão de Fiscalização
          </p>
          <p className="text-sm font-body mt-3" style={{ color: 'var(--subtle)' }}>
            Selecione seu usuário para continuar
          </p>
        </div>

        {/* Card principal */}
        <div className="rounded-2xl fade-up"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            animationDelay: '80ms',
            animationFillMode: 'forwards',
          }}>

          {/* Search */}
          <div className="px-5 pt-5 pb-3">
            <div className="relative">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--muted)' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar usuário..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-base w-full text-xs"
                style={{ paddingLeft: '32px' }}
                autoFocus
              />
            </div>
          </div>

          {/* Lista de usuários */}
          <div className="px-3 pb-3 max-h-72 overflow-y-auto">
            {carregando ? (
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                    <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="skeleton h-3 w-28 mb-1.5 rounded" />
                      <div className="skeleton h-2.5 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-body" style={{ color: 'var(--muted)' }}>
                  Nenhum usuário encontrado.
                </p>
              </div>
            ) : (
              Object.entries(grupos).map(([papel, lista]) => {
                const c = PAPEL_COLOR[papel] || PAPEL_COLOR.FISCAL
                return (
                  <div key={papel} className="mb-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5"
                      style={{ color: 'var(--muted)' }}>
                      {PERMISSOES[papel]?.label || papel}
                    </p>
                    {lista.map(u => {
                      const sel = selecionado?.id === u.id
                      return (
                        <button
                          key={u.id}
                          onClick={() => setSelecionado(u)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-0.5"
                          style={{
                            background: sel ? c.bg : 'transparent',
                            border: `1px solid ${sel ? c.border : 'transparent'}`,
                          }}
                          onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--surface)' }}
                          onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
                            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                            {u.nome[0].toUpperCase()}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm font-medium truncate"
                              style={{ color: sel ? c.text : 'var(--text)' }}>
                              {u.nome}
                            </p>
                            <p className="font-mono text-[10px] truncate" style={{ color: 'var(--muted)' }}>
                              {u.email}
                            </p>
                          </div>
                          {/* Papel icon */}
                          <span style={{ color: sel ? c.text : 'var(--muted)' }}>
                            {PAPEL_ICON[u.papel]}
                          </span>
                          {/* Check */}
                          {sel && (
                            <svg width="14" height="14" fill="none" stroke={c.text} strokeWidth="2.5" viewBox="0 0 24 24" className="flex-shrink-0">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          {/* Permissões do selecionado */}
          {selecionado && (() => {
            const c = PAPEL_COLOR[selecionado.papel] || PAPEL_COLOR.FISCAL
            const perms = PERMISSOES[selecionado.papel]
            return (
              <div className="mx-3 mb-3 p-3 rounded-xl"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <p className="font-mono text-[10px] uppercase tracking-wider mb-2"
                  style={{ color: c.text }}>
                  Permissões — {perms?.label}
                </p>
                <p className="text-xs font-body mb-2" style={{ color: 'var(--subtle)' }}>
                  {perms?.descricao}
                </p>
                <div className="flex flex-wrap gap-1">
                  {perms?.pode.map(p => (
                    <span key={p}
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: `${c.text}18`, color: c.text }}>
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Botão entrar */}
          <div className="px-5 pb-5">
            <button
              onClick={() => selecionado && login(selecionado)}
              disabled={!selecionado}
              className="w-full py-3 rounded-xl font-body font-medium text-sm transition-all"
              style={{
                background: selecionado ? 'rgba(59,130,246,0.15)' : 'var(--surface)',
                color: selecionado ? '#60A5FA' : 'var(--muted)',
                border: `1px solid ${selecionado ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                cursor: selecionado ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={e => { if (selecionado) e.currentTarget.style.background = 'rgba(59,130,246,0.25)' }}
              onMouseLeave={e => { if (selecionado) e.currentTarget.style.background = 'rgba(59,130,246,0.15)' }}>
              {selecionado
                ? `Entrar como ${selecionado.nome}`
                : 'Selecione um usuário acima'}
            </button>
          </div>
        </div>

        <p className="text-center font-mono text-[10px] mt-4" style={{ color: 'var(--muted)' }}>
          PROVIC · UCSAL · SGF v1.0
        </p>
      </div>
    </div>
  )
}
