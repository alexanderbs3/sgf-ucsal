import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getObras } from '../api/sgf'

const routeTitles = {
  '/':              'Obras',
  '/relatorios':    'Vistorias',
  '/analytics':     'Analytics',
  '/usuarios':      'Usuários',
  '/configuracoes': 'Configurações',
}

function getPageTitle(pathname) {
  if (pathname.startsWith('/obras/')) return 'Dashboard da Obra'
  return routeTitles[pathname] || 'SGF'
}

const PAPEL_COLOR = {
  ADMIN:  '#F87171',
  GESTOR: '#A78BFA',
  FISCAL: '#60A5FA',
}
const PAPEL_LABEL = { ADMIN: 'Admin', GESTOR: 'Gestor', FISCAL: 'Fiscal' }

/** Lê preferência de notificações do localStorage (salvo em Configuracoes.jsx). */
function notificacoesAtivadas() {
  try {
    const prefs = JSON.parse(localStorage.getItem('sgf_prefs') || '{}')
    return prefs.notificacoes !== false  // padrão: true
  } catch { return true }
}

export default function Header() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { usuario, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [search,    setSearch]    = useState('')
  const [time,      setTime]      = useState(new Date())
  const [menuOpen,  setMenuOpen]  = useState(false)
  // Notificações dinâmicas: conta obras com itens REPROVADOS
  const [notifsCount, setNotifsCount] = useState(0)
  const [notifsAtivas, setNotifsAtivas] = useState(notificacoesAtivadas())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  // Atualiza preferência de notificações quando localStorage muda (usuário salva Configurações)
  useEffect(() => {
    const handler = () => setNotifsAtivas(notificacoesAtivadas())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Busca contagem real de obras EM_ANDAMENTO como proxy de "atenção necessária"
  useEffect(() => {
    if (!notifsAtivas || !usuario) return
    getObras()
      .then(obras => {
        const emAndamento = obras.filter(o => o.status === 'EM_ANDAMENTO').length
        setNotifsCount(emAndamento)
      })
      .catch(() => setNotifsCount(0))
  }, [notifsAtivas, usuario])

  useEffect(() => {
    if (location.pathname !== '/') setSearch('')
  }, [location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('header-search')?.focus()
      }
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSearch = useCallback((e) => {
    const val = e.target.value
    setSearch(val)
    if (location.pathname !== '/') navigate('/', { state: { search: val } })
  }, [location.pathname, navigate])

  const title        = getPageTitle(location.pathname)
  const formattedDate = time.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  const formattedTime = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const papelColor    = usuario ? (PAPEL_COLOR[usuario.papel] || '#60A5FA') : '#60A5FA'
  const papelLabel    = usuario ? (PAPEL_LABEL[usuario.papel] || usuario.papel) : '—'

  return (
    <header className="sticky top-0 z-30 glass"
      style={{ borderBottom: '1px solid var(--border)', height: '60px' }}>
      <div className="h-full px-8 flex items-center gap-4">

        {/* Page title */}
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-base tracking-tight truncate"
            style={{ color: 'var(--text)' }}>
            {title}
          </h2>
        </div>

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
            viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--muted)', zIndex: 1 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            id="header-search"
            type="text"
            placeholder="Buscar obra, código..."
            value={search}
            onChange={handleSearch}
            onKeyDown={e => { if (e.key === 'Enter' && location.pathname !== '/') navigate('/', { state: { search } }) }}
            className="input-base text-xs"
            style={{ width: '220px', paddingLeft: '34px', paddingRight: '52px' }}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] px-1.5 py-0.5 rounded pointer-events-none"
            style={{ background: 'var(--border)', color: 'var(--muted)' }}>
            ⌘K
          </kbd>
        </div>

        {/* Divider */}
        <div className="h-5 w-px" style={{ background: 'var(--border)' }} />

        {/* Date/time */}
        <div className="hidden lg:flex flex-col items-end">
          <span className="font-mono text-[11px] capitalize" style={{ color: 'var(--subtle)' }}>{formattedDate}</span>
          <span className="font-mono text-[10px]"            style={{ color: 'var(--muted)' }}>{formattedTime}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--subtle)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--subtle)' }}>
          {theme === 'dark' ? (
            /* Sol — tema claro */
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            /* Lua — tema escuro */
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        {/* Notifications — badge dinâmico baseado em obras EM_ANDAMENTO */}
        {notifsAtivas && (
          <button
            title={notifsCount > 0 ? `${notifsCount} obra(s) em andamento` : 'Sem notificações'}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--subtle)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            onClick={() => navigate('/')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {notifsCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold"
                style={{ background: '#3B82F6', color: 'white', boxShadow: '0 0 6px rgba(59,130,246,0.7)', padding: '0 3px' }}>
                {notifsCount > 9 ? '9+' : notifsCount}
              </span>
            )}
          </button>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors duration-150"
            style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-xs flex-shrink-0"
              style={{ background: `${papelColor}22`, color: papelColor, border: `1px solid ${papelColor}44` }}>
              {usuario?.nome?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="font-body text-xs font-medium" style={{ color: 'var(--text)' }}>
                {usuario?.nome?.split(' ')[0] || '—'}
              </span>
              <span className="font-mono text-[9px]" style={{ color: papelColor }}>
                {papelLabel}
              </span>
            </div>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              style={{ color: 'var(--muted)' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <>
              {/* Overlay para fechar */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl z-50 scale-in"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  animationFillMode: 'forwards',
                }}>
                {/* Info do usuário */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="font-body text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {usuario?.nome}
                  </p>
                  <p className="font-mono text-[10px] truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                    {usuario?.email}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1.5 font-mono text-[10px] px-2 py-0.5 rounded"
                    style={{ background: `${papelColor}18`, color: papelColor }}>
                    {papelLabel}
                  </span>
                </div>
                {/* Ações */}
                <div className="p-1.5">
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/usuarios') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-body text-left transition-colors"
                    style={{ color: 'var(--subtle)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--subtle)' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    Gerenciar usuários
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/configuracoes') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-body text-left transition-colors"
                    style={{ color: 'var(--subtle)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--subtle)' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                    Configurações
                  </button>
                </div>
                {/* Logout */}
                <div className="p-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { setMenuOpen(false); logout() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-body text-left transition-colors"
                    style={{ color: '#F87171' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
