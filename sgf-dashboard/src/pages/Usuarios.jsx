import { useEffect, useState, useCallback } from 'react'
import { getUsuarios, criarUsuario, atualizarUsuario, deletarUsuario } from '../api/sgf'
import { useAuth } from '../context/AuthContext'

// ── Constantes ────────────────────────────────────────────────────────────────
const PAPEL_LABEL = { FISCAL: 'Fiscal', GESTOR: 'Gestor', ADMIN: 'Admin' }
const PAPEL_STYLE = {
  FISCAL: { bg:'rgba(59,130,246,0.1)',   text:'#60A5FA', border:'rgba(59,130,246,0.25)' },
  GESTOR: { bg:'rgba(139,92,246,0.1)',   text:'#A78BFA', border:'rgba(139,92,246,0.25)' },
  ADMIN:  { bg:'rgba(239,68,68,0.1)',    text:'#F87171', border:'rgba(239,68,68,0.25)' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function PapelBadge({ papel }) {
  const s = PAPEL_STYLE[papel] || PAPEL_STYLE.FISCAL
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      {PAPEL_LABEL[papel] || papel}
    </span>
  )
}

function Avatar({ nome, papel }) {
  const s = PAPEL_STYLE[papel] || PAPEL_STYLE.FISCAL
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs flex-shrink-0"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {nome?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function UsuarioModal({ usuario, onClose, onSaved }) {
  const editando = !!usuario
  const [form, setForm] = useState({
    nome:  usuario?.nome  || '',
    email: usuario?.email || '',
    papel: usuario?.papel || 'FISCAL',
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleSubmit = async () => {
    if (!form.nome.trim())  { setErr('Nome é obrigatório.'); return }
    if (!form.email.trim()) { setErr('E-mail é obrigatório.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErr('E-mail inválido.'); return
    }
    setSaving(true)
    setErr(null)
    try {
      if (editando) {
        await atualizarUsuario(usuario.id, form)
      } else {
        await criarUsuario(form)
      }
      onSaved()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl scale-in"
        style={{ background:'var(--card)', border:'1px solid var(--border-light)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.5)', animationFillMode:'forwards' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom:'1px solid var(--border)' }}>
          <div>
            <h2 className="font-display font-bold text-base" style={{ color:'var(--text)' }}>
              {editando ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <p className="text-xs font-body mt-0.5" style={{ color:'var(--muted)' }}>
              {editando ? `Editando: ${usuario.email}` : 'Preencha os dados para cadastrar.'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background:'var(--border)', color:'var(--subtle)' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--border)'}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {err && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs"
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#F87171' }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {err}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider mb-1.5"
              style={{ color:'var(--muted)' }}>Nome completo *</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Carlos Andrade"
              className="input-base w-full text-xs" />
          </div>

          {/* Email */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider mb-1.5"
              style={{ color:'var(--muted)' }}>E-mail *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="usuario@ucsal.br"
              className="input-base w-full text-xs" />
          </div>

          {/* Papel */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider mb-2"
              style={{ color:'var(--muted)' }}>Papel *</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PAPEL_LABEL).map(([val, label]) => {
                const s   = PAPEL_STYLE[val]
                const sel = form.papel === val
                return (
                  <button key={val} onClick={() => set('papel', val)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{
                      background: sel ? s.bg : 'var(--surface)',
                      border:     `1px solid ${sel ? s.border : 'var(--border)'}`,
                      color:      sel ? s.text : 'var(--muted)',
                    }}
                    onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.color='var(--subtle)' }}}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)' }}}>
                    {val === 'FISCAL' && (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="2"/>
                        <path d="M9 12h6M9 16h4"/>
                      </svg>
                    )}
                    {val === 'GESTOR' && (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                    )}
                    {val === 'ADMIN' && (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    )}
                    <span className="font-body text-xs font-medium">{label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] font-body mt-2" style={{ color:'var(--muted)' }}>
              {form.papel === 'FISCAL'  && 'Fiscal: realiza vistorias e registra logs de fiscalização.'}
              {form.papel === 'GESTOR'  && 'Gestor: supervisiona obras e aprova relatórios.'}
              {form.papel === 'ADMIN'   && 'Admin: acesso completo ao sistema.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop:'1px solid var(--border)' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-body transition-colors"
            style={{ background:'transparent', color:'var(--subtle)', border:'1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-body font-medium transition-all"
            style={{
              background: saving ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.15)',
              color:'#60A5FA', border:'1px solid rgba(59,130,246,0.3)',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background='rgba(59,130,246,0.25)' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background='rgba(59,130,246,0.15)' }}>
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Salvando...
              </span>
            ) : editando ? 'Salvar alterações' : 'Cadastrar usuário'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirmar exclusão ────────────────────────────────────────────────────────
function ConfirmDeleteModal({ usuario, onClose, onConfirm }) {
  const { pode } = useAuth()
  const [deleting,      setDeleting]      = useState(false)
  const [err,           setErr]           = useState(null)
  const [mostrarForcar, setMostrarForcar] = useState(false)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleDelete = async (forcar = false) => {
    setDeleting(true)
    setErr(null)
    try {
      await deletarUsuario(usuario.id, forcar)
      onConfirm()
    } catch (e) {
      setErr(e.message)
      // Só revela o botão de remoção forçada se for Admin e o erro for de vistorias vinculadas
      if (pode('gerenciar_usuarios')) {
        setMostrarForcar(true)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl scale-in"
        style={{ background:'var(--card)', border:'1px solid rgba(239,68,68,0.3)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.5)', animationFillMode:'forwards' }}>
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <svg width="16" height="16" fill="none" stroke="#F87171" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-sm" style={{ color:'var(--text)' }}>Remover usuário</p>
              <p className="text-xs font-body mt-0.5" style={{ color:'var(--muted)' }}>Esta ação não pode ser desfeita.</p>
            </div>
          </div>
          <p className="text-sm font-body mb-1" style={{ color:'var(--subtle)' }}>
            Tem certeza que deseja remover <strong style={{ color:'var(--text)' }}>{usuario.nome}</strong>?
          </p>
          <p className="font-mono text-xs" style={{ color:'var(--muted)' }}>{usuario.email}</p>

          {/* Erro normal */}
          {err && (
            <div className="mt-3 p-3 rounded-lg" style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.25)' }}>
              <div className="flex items-start gap-2">
                <svg width="13" height="13" fill="none" stroke="#FBBF24" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p className="text-xs font-body font-medium" style={{ color:'#FBBF24' }}>Não foi possível remover</p>
                  <p className="text-xs font-body mt-0.5" style={{ color:'var(--subtle)' }}>{err}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bloco de remoção forçada — visível apenas para Admin após erro de vistorias vinculadas */}
          {mostrarForcar && pode('gerenciar_usuarios') && (
            <div className="mt-3 p-3 rounded-lg" style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-body font-medium mb-1" style={{ color:'#F87171' }}>
                Remoção forçada (Admin)
              </p>
              <p className="text-xs font-body" style={{ color:'var(--subtle)' }}>
                As vistorias vinculadas a este usuário serão mantidas no histórico, mas o vínculo com o fiscal será removido. Esta ação é irreversível.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop:'1px solid var(--border)' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-body transition-colors"
            style={{ background:'transparent', color:'var(--subtle)', border:'1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
            Cancelar
          </button>

          {/* Botão de remoção forçada — apenas para Admin após erro */}
          {mostrarForcar && pode('gerenciar_usuarios') && (
            <button
              onClick={() => handleDelete(true)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-xs font-body font-medium transition-all"
              style={{ background:'rgba(239,68,68,0.20)', color:'#F87171',
                border:'1px solid rgba(239,68,68,0.4)', cursor: deleting ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!deleting) e.currentTarget.style.background='rgba(239,68,68,0.32)' }}
              onMouseLeave={e => { if (!deleting) e.currentTarget.style.background='rgba(239,68,68,0.20)' }}>
              {deleting ? 'Removendo...' : 'Forçar remoção (Admin)'}
            </button>
          )}

          {/* Botão de remoção normal */}
          {!mostrarForcar && (
            <button onClick={() => handleDelete(false)} disabled={deleting}
              className="px-4 py-2 rounded-lg text-xs font-body font-medium transition-all"
              style={{ background:'rgba(239,68,68,0.12)', color:'#F87171',
                border:'1px solid rgba(239,68,68,0.3)', cursor: deleting ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!deleting) e.currentTarget.style.background='rgba(239,68,68,0.22)' }}
              onMouseLeave={e => { if (!deleting) e.currentTarget.style.background='rgba(239,68,68,0.12)' }}>
              {deleting ? 'Removendo...' : 'Sim, remover'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const { pode } = useAuth()
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [filtroP,  setFiltroP]  = useState('')
  const [modal,    setModal]    = useState(null)   // null | 'criar' | Usuario (editar)
  const [deleting, setDeleting] = useState(null)   // null | Usuario

  const carregar = useCallback(() => {
    setLoading(true)
    setError(null)
    getUsuarios()
      .then(setUsuarios)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const filtrados = usuarios.filter(u => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q
      || u.nome?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
    const matchPapel = !filtroP || u.papel === filtroP
    return matchSearch && matchPapel
  })

  // Contadores por papel
  const counts = usuarios.reduce((acc, u) => {
    acc[u.papel] = (acc[u.papel] || 0) + 1
    return acc
  }, {})

  return (
    <>
      {/* Modal criar/editar */}
      {modal !== null && (
        <UsuarioModal
          usuario={modal === 'criar' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); carregar() }}
        />
      )}
      {/* Modal confirmar exclusão */}
      {deleting && (
        <ConfirmDeleteModal
          usuario={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => { setDeleting(null); carregar() }}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="fade-up" style={{ animationFillMode:'forwards' }}>
          {!pode('gerenciar_usuarios') && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)' }}>
              <svg width="14" height="14" fill="none" stroke="#FBBF24" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-xs font-body" style={{ color:'#FBBF24' }}>
                Você está em modo de <strong>somente leitura</strong>. Apenas administradores podem criar, editar ou remover usuários.
              </p>
            </div>
          )}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color:'var(--text)' }}>
                Usuários
              </h1>
              <p className="text-sm font-body mt-0.5" style={{ color:'var(--subtle)' }}>
                {pode('gerenciar_usuarios')
                  ? 'Gerencie fiscais, gestores e administradores do sistema.'
                  : 'Visualização dos usuários cadastrados no sistema.'}
              </p>
            </div>
            {pode('gerenciar_usuarios') && (
              <button onClick={() => setModal('criar')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all"
                style={{ background:'rgba(59,130,246,0.12)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(59,130,246,0.12)'}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Novo usuário
              </button>
            )}
          </div>
        </div>

        {/* KPI pills */}
        <div className="flex items-center gap-3 flex-wrap fade-up" style={{ animationDelay:'60ms', animationFillMode:'forwards' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
            <span className="font-mono text-[11px]" style={{ color:'var(--muted)' }}>Total</span>
            <span className="font-display font-bold text-sm" style={{ color:'var(--text)' }}>{usuarios.length}</span>
          </div>
          {Object.entries(PAPEL_LABEL).map(([papel, label]) => {
            const s = PAPEL_STYLE[papel]
            return (
              <div key={papel} className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: s.bg, border:`1px solid ${s.border}` }}>
                <span className="font-mono text-[11px]" style={{ color: s.text }}>{label}</span>
                <span className="font-display font-bold text-sm" style={{ color: s.text }}>
                  {counts[papel] || 0}
                </span>
              </div>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 fade-up" style={{ animationDelay:'120ms', animationFillMode:'forwards' }}>
          <div className="relative flex-1 min-w-48">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color:'var(--muted)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Buscar por nome ou e-mail..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-base w-full text-xs" style={{ paddingLeft:'32px' }} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color:'var(--muted)' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {[{v:'',l:'Todos'},{v:'FISCAL',l:'Fiscal'},{v:'GESTOR',l:'Gestor'},{v:'ADMIN',l:'Admin'}].map(f => (
              <button key={f.v} onClick={() => setFiltroP(f.v)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150"
                style={filtroP === f.v ? {
                  background:'rgba(59,130,246,0.12)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.3)'
                } : {
                  background:'var(--card)', color:'var(--muted)', border:'1px solid var(--border)'
                }}>
                {f.l}
              </button>
            ))}
          </div>
          <span className="font-mono text-[11px]" style={{ color:'var(--muted)' }}>
            {filtrados.length} de {usuarios.length}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl fade-in"
            style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
            <svg width="16" height="16" fill="none" stroke="#F87171" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p className="text-sm font-medium" style={{ color:'#F87171' }}>Erro ao carregar usuários</p>
              <p className="font-mono text-xs mt-0.5" style={{ color:'rgba(248,113,113,0.6)' }}>{error}</p>
              <button onClick={carregar}
                className="text-xs font-mono mt-2 px-2.5 py-1 rounded-lg"
                style={{ background:'rgba(239,68,68,0.12)', color:'#F87171', border:'1px solid rgba(239,68,68,0.2)' }}>
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl overflow-hidden fade-up"
          style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'180ms', animationFillMode:'forwards' }}>

          {/* Header */}
          <div className="flex items-center px-5 py-3 gap-4"
            style={{ borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
            <span className="font-mono text-[10px] uppercase tracking-wider flex-1" style={{ color:'var(--muted)' }}>Usuário</span>
            <span className="font-mono text-[10px] uppercase tracking-wider flex-shrink-0" style={{ width:'160px', color:'var(--muted)' }}>E-mail</span>
            <span className="font-mono text-[10px] uppercase tracking-wider flex-shrink-0" style={{ width:'120px', color:'var(--muted)' }}>Papel</span>
            <span className="font-mono text-[10px] uppercase tracking-wider flex-shrink-0" style={{ width:'140px', color:'var(--muted)' }}>Desde</span>
            <span className="font-mono text-[10px] uppercase tracking-wider flex-shrink-0" style={{ width:'90px', color:'var(--muted)' }}>Ações</span>
          </div>

          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center px-5 py-4 gap-4"
                style={{ borderBottom:'1px solid var(--border)' }}>
                <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                <div className="skeleton h-3 w-32 rounded flex-1" />
                <div className="skeleton h-3 w-40 rounded flex-shrink-0" style={{ width:'160px' }} />
                <div className="skeleton h-5 w-20 rounded-full flex-shrink-0" style={{ width:'120px' }} />
                <div className="skeleton h-3 w-24 rounded flex-shrink-0" style={{ width:'140px' }} />
                <div className="skeleton h-7 w-16 rounded-lg flex-shrink-0" style={{ width:'90px' }} />
              </div>
            ))
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
                style={{ color:'var(--muted)' }}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <p className="font-body text-sm" style={{ color:'var(--muted)' }}>
                {usuarios.length === 0
                  ? 'Nenhum usuário cadastrado.'
                  : 'Nenhum usuário encontrado com os filtros aplicados.'}
              </p>
              {(search || filtroP) && (
                <button onClick={() => { setSearch(''); setFiltroP('') }}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg"
                  style={{ background:'var(--surface)', color:'var(--subtle)', border:'1px solid var(--border)' }}>
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div>
              {filtrados.map((u, i) => (
                <div key={u.id}
                  className="flex items-center px-5 py-3.5 gap-4 transition-colors duration-100"
                  style={{ borderBottom: i < filtrados.length-1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                  {/* Avatar + nome */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar nome={u.nome} papel={u.papel} />
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium truncate" style={{ color:'var(--text)' }}>
                        {u.nome}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex-shrink-0 min-w-0" style={{ width:'160px' }}>
                    <p className="font-mono text-[11px] truncate" style={{ color:'var(--subtle)' }}>{u.email}</p>
                  </div>

                  {/* Papel */}
                  <div className="flex-shrink-0" style={{ width:'120px' }}>
                    <PapelBadge papel={u.papel} />
                  </div>

                  {/* Criado em */}
                  <div className="flex-shrink-0" style={{ width:'140px' }}>
                    <span className="font-mono text-[11px]" style={{ color:'var(--muted)' }}>
                      {u.criadoEm
                        ? new Date(u.criadoEm).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })
                        : '—'}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ width:'90px' }}>
                    {pode('gerenciar_usuarios') ? (
                      <>
                        <button
                          onClick={() => setModal(u)}
                          title="Editar usuário"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ background:'var(--border)', color:'var(--subtle)', border:'1px solid transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(59,130,246,0.12)'; e.currentTarget.style.color='#60A5FA'; e.currentTarget.style.border='1px solid rgba(59,130,246,0.25)' }}
                          onMouseLeave={e => { e.currentTarget.style.background='var(--border)'; e.currentTarget.style.color='var(--subtle)'; e.currentTarget.style.border='1px solid transparent' }}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleting(u)}
                          title="Remover usuário"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ background:'var(--border)', color:'var(--subtle)', border:'1px solid transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.12)'; e.currentTarget.style.color='#F87171'; e.currentTarget.style.border='1px solid rgba(239,68,68,0.25)' }}
                          onMouseLeave={e => { e.currentTarget.style.background='var(--border)'; e.currentTarget.style.color='var(--subtle)'; e.currentTarget.style.border='1px solid transparent' }}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded"
                        style={{ background:'var(--border)', color:'var(--muted)' }}>
                        só leitura
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
