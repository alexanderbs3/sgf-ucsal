import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  {
    group: 'Principal',
    links: [
      {
        to: '/', label: 'Obras', exact: true,
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
      },
    ],
  },
  {
    group: 'Relatórios',
    links: [
      {
        to: '/relatorios', label: 'Vistorias',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>,
      },
      {
        to: '/analytics', label: 'Analytics',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
      },
    ],
  },
  {
    group: 'Gestão',
    links: [
      {
        to: '/usuarios', label: 'Usuários',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
      },
    ],
  },
  {
    group: 'Sistema',
    links: [
      {
        to: '/configuracoes', label: 'Configurações',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
      },
    ],
  },
]

export default function Sidebar() {
  const { pode, usuario, logout, PERMISSOES } = useAuth()
  const itensVisiveis = navItems.filter(group => {
    if (group.group === 'Gestão') return pode('gerenciar_usuarios')
    return true
  })

  // Inicial do avatar: primeira letra do nome
  const inicial = usuario?.nome?.charAt(0)?.toUpperCase() ?? '?'
  // Label do papel
  const papelLabel = usuario ? (PERMISSOES[usuario.papel]?.label ?? usuario.papel) : ''

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-40 slide-left"
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        animationDelay: '0ms',
        animationFillMode: 'forwards',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
              boxShadow: '0 0 16px rgba(59,130,246,0.35)',
            }}
          >
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>SGF</p>
            <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Fiscalização</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {itensVisiveis.map((group) => (
          <div key={group.group}>
            <p className="font-mono text-[10px] uppercase tracking-widest px-3 mb-2"
              style={{ color: 'var(--muted)' }}>
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-150"
                  style={({ isActive }) => isActive
                    ? { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA' }
                    : { background: 'transparent', border: '1px solid transparent', color: 'var(--subtle)' }
                  }
                  onMouseEnter={e => {
                    if (!e.currentTarget.style.background.includes('59,130,246')) {
                      e.currentTarget.style.background = 'var(--card)'
                      e.currentTarget.style.color = 'var(--text)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.style.background.includes('59,130,246')) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--subtle)'
                    }
                  }}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer — dinâmico com dados do usuário autenticado */}
      <div className="px-3 py-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Info do usuário */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-xs"
            style={{ background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)', color: 'white' }}
          >
            {inicial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-body font-medium truncate" style={{ color: 'var(--text)' }}>
              {usuario?.nome ?? '—'}
            </p>
            <p className="font-mono text-[9px] truncate" style={{ color: 'var(--muted)' }}>
              {papelLabel} · SGF
            </p>
          </div>
        </div>

        {/* Botão de logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-body transition-colors duration-150"
          style={{ background: 'transparent', color: 'var(--subtle)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.color = '#F87171'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--subtle)'
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair do sistema
        </button>
      </div>
    </aside>
  )
}
