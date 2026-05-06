import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { getObras, criarObra, getClassificacoes } from '../api/sgf'
import { StatusBadge, ErrorMsg } from '../components/ui'

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ObraCardSkeleton({ i }) {
  return (
    <div className="rounded-xl p-5 fade-up"
      style={{ background:'var(--card)', border:'1px solid var(--border)',
        animationDelay:`${i*60}ms`, animationFillMode:'forwards' }}>
      <div className="flex justify-between items-start mb-3">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-5 w-24 rounded-full" />
      </div>
      <div className="skeleton h-4 w-4/5 mb-2 rounded" />
      <div className="skeleton h-4 w-3/5 mb-4 rounded" />
      <div className="flex gap-4">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    </div>
  )
}

// ── Modal Nova Obra ───────────────────────────────────────────────────────────
function NovaObraModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    codigo: '', descricao: '', dataInicio: '', dataPrevisaoConclusao: '', status: 'PLANEJADA'
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.codigo.trim() || !form.descricao.trim() || !form.dataInicio) {
      setErr('Preencha os campos obrigatórios: Código, Descrição e Data de Início.')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const payload = {
        codigo:               form.codigo.trim(),
        descricao:            form.descricao.trim(),
        dataInicio:           form.dataInicio,
        dataPrevisaoConclusao: form.dataPrevisaoConclusao || null,
        status:               form.status,
      }
      await criarObra(payload)
      onSaved()
    } catch(e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Fechar com Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl scale-in"
        style={{ background:'var(--card)', border:'1px solid var(--border-light)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.5)', animationFillMode:'forwards' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom:'1px solid var(--border)' }}>
          <div>
            <h2 className="font-display font-bold text-base" style={{ color:'var(--text)' }}>Nova Obra</h2>
            <p className="text-xs font-body mt-0.5" style={{ color:'var(--muted)' }}>Preencha os dados para cadastrar.</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background:'var(--border)', color:'var(--subtle)' }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--border-light)' }}
            onMouseLeave={e => { e.currentTarget.style.background='var(--border)' }}>
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
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {err}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color:'var(--muted)' }}>Código *</label>
              <input value={form.codigo} onChange={e => set('codigo', e.target.value)}
                placeholder="OBR-2024-001"
                className="input-base w-full text-xs" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color:'var(--muted)' }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="input-base w-full text-xs"
                style={{ background:'var(--card)' }}>
                <option value="PLANEJADA">Planejada</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="PARALISADA">Paralisada</option>
                <option value="CONCLUIDA">Concluída</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider mb-1.5"
              style={{ color:'var(--muted)' }}>Descrição *</label>
            <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
              placeholder="Descreva a obra..."
              rows={3}
              className="input-base w-full text-xs resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color:'var(--muted)' }}>Data de Início *</label>
              <input type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)}
                className="input-base w-full text-xs"
                style={{ colorScheme:'dark' }} />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color:'var(--muted)' }}>Previsão de Conclusão</label>
              <input type="date" value={form.dataPrevisaoConclusao}
                onChange={e => set('dataPrevisaoConclusao', e.target.value)}
                className="input-base w-full text-xs"
                style={{ colorScheme:'dark' }} />
            </div>
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
            style={{ background: saving ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.15)',
              color:'#60A5FA', border:'1px solid rgba(59,130,246,0.3)',
              cursor: saving ? 'not-allowed' : 'pointer' }}
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
            ) : 'Cadastrar obra'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Obras() {
  const location = useLocation()

  const [obras,   setObras]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState(location.state?.search || '')
  const [filtro,  setFiltro]  = useState('')
  const [sort,    setSort]    = useState('codigo')
  const [modal,   setModal]   = useState(false)
  const { pode } = useAuth()

  const carregar = useCallback(() => {
    setLoading(true)
    setError(null)
    getObras()
      .then(setObras)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Quando o Header navega para '/' com state.search, sincroniza
  useEffect(() => {
    if (location.state?.search !== undefined) {
      setSearch(location.state.search)
    }
  }, [location.state])

  const filtered = obras
    .filter(o => {
      const q = search.trim().toLowerCase()
      const matchSearch = !q
        || o.codigo?.toLowerCase().includes(q)
        || o.descricao?.toLowerCase().includes(q)
      const matchFiltro = !filtro || o.status === filtro
      return matchSearch && matchFiltro
    })
    .sort((a, b) => {
      if (sort === 'codigo') return (a.codigo || '').localeCompare(b.codigo || '')
      if (sort === 'status') return (a.status || '').localeCompare(b.status || '')
      if (sort === 'data')   return new Date(a.dataInicio || 0) - new Date(b.dataInicio || 0)
      return 0
    })

  const counts = obras.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const statCards = [
    { label:'Total',        value: obras.length,               color:'#3B82F6' },
    { label:'Em andamento', value: counts['EM_ANDAMENTO'] || 0, color:'#60A5FA' },
    { label:'Concluídas',   value: counts['CONCLUIDA']    || 0, color:'#34D399' },
    { label:'Paralisadas',  value: counts['PARALISADA']   || 0, color:'#FBBF24' },
  ]

  return (
    <>
      {modal && (
        <NovaObraModal
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); carregar() }}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page header */}
        <div className="fade-up" style={{ animationDelay:'0ms', animationFillMode:'forwards' }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color:'var(--text)' }}>
                Obras Cadastradas
              </h1>
              <p className="text-sm font-body mt-0.5" style={{ color:'var(--subtle)' }}>
                {obras.length > 0
                  ? `${obras.length} obra${obras.length !== 1 ? 's' : ''} cadastrada${obras.length !== 1 ? 's' : ''}.`
                  : 'Selecione uma obra para acessar o dashboard de fiscalização.'}
              </p>
            </div>
            {pode('criar_obra') && (
              <button
                onClick={() => setModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all"
                style={{ background:'rgba(59,130,246,0.12)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(59,130,246,0.12)'}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nova obra
              </button>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s, i) => {
            const icons = [
              <path key="h" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>,
              <polyline key="p" points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
              <polyline key="c" points="20 6 9 17 4 12"/>,
              <><circle key="ci" cx="12" cy="12" r="10"/><line key="l1" x1="10" y1="15" x2="10" y2="9"/><line key="l2" x1="14" y1="15" x2="14" y2="9"/></>,
            ]
            return (
              <div key={s.label} className="rounded-xl p-4 fade-up"
                style={{ background:'var(--card)', border:'1px solid var(--border)',
                  animationDelay:`${i*60}ms`, animationFillMode:'forwards' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg" style={{ background:`${s.color}18` }}>
                    <svg width="16" height="16" fill="none" stroke={s.color} strokeWidth="1.7" viewBox="0 0 24 24">
                      {icons[i]}
                    </svg>
                  </div>
                </div>
                <p className="font-display font-bold text-2xl" style={{ color:s.color }}>{s.value}</p>
                <p className="text-xs font-body uppercase tracking-wider mt-0.5" style={{ color:'var(--muted)' }}>{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 fade-up"
          style={{ animationDelay:'200ms', animationFillMode:'forwards' }}>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color:'var(--muted)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Filtrar por código ou descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-base w-full text-xs"
              style={{ paddingLeft:'32px' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color:'var(--muted)' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { v:'',            l:'Todos' },
              { v:'EM_ANDAMENTO',l:'Em andamento' },
              { v:'CONCLUIDA',   l:'Concluídas' },
              { v:'PARALISADA',  l:'Paralisadas' },
              { v:'PLANEJADA',   l:'Planejadas' },
            ].map(f => (
              <button key={f.v} onClick={() => setFiltro(f.v)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150"
                style={filtro === f.v ? {
                  background:'rgba(59,130,246,0.12)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.3)'
                } : {
                  background:'var(--card)', color:'var(--muted)', border:'1px solid var(--border)'
                }}>
                {f.l}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="input-base text-xs px-3 py-1.5"
            style={{ background:'var(--card)', color:'var(--subtle)', border:'1px solid var(--border)' }}>
            <option value="codigo">Ordenar: Código</option>
            <option value="status">Ordenar: Status</option>
            <option value="data">Ordenar: Data</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl fade-in"
            style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
            <svg width="16" height="16" fill="none" stroke="#F87171" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p className="text-sm font-medium" style={{ color:'#F87171' }}>Erro ao carregar obras</p>
              <p className="font-mono text-xs mt-0.5" style={{ color:'rgba(248,113,113,0.6)' }}>{error}</p>
              <button onClick={carregar}
                className="text-xs font-mono mt-2 px-2.5 py-1 rounded-lg"
                style={{ background:'rgba(239,68,68,0.12)', color:'#F87171', border:'1px solid rgba(239,68,68,0.2)' }}>
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_,i) => <ObraCardSkeleton key={i} i={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 fade-in">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24"
              style={{ color:'var(--muted)' }}>
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
            </svg>
            <p className="font-body text-sm" style={{ color:'var(--muted)' }}>
              {obras.length === 0
                ? 'Nenhuma obra cadastrada ainda.'
                : `Nenhuma obra encontrada${search ? ` para "${search}"` : ''}.`}
            </p>
            {(search || filtro) && (
              <button onClick={() => { setSearch(''); setFiltro('') }}
                className="text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
                style={{ background:'var(--card)', color:'var(--subtle)', border:'1px solid var(--border)' }}>
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((obra, i) => (
              <Link key={obra.id} to={`/obras/${obra.id}`} className="block group">
                <div
                  className="rounded-xl p-5 fade-up cursor-pointer"
                  style={{
                    background:'var(--card)', border:'1px solid var(--border)',
                    animationDelay:`${i*60}ms`, animationFillMode:'forwards',
                    transition:'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background    = 'var(--card-hover)'
                    e.currentTarget.style.borderColor   = 'var(--border-light)'
                    e.currentTarget.style.transform     = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow     = '0 8px 32px rgba(0,0,0,0.35)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background    = 'var(--card)'
                    e.currentTarget.style.borderColor   = 'var(--border)'
                    e.currentTarget.style.transform     = 'translateY(0)'
                    e.currentTarget.style.boxShadow     = 'none'
                  }}>

                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded"
                      style={{ background:'var(--border)', color:'var(--subtle)' }}>
                      {obra.codigo}
                    </span>
                    <StatusBadge status={obra.status} />
                  </div>

                  <h2 className="font-display font-semibold text-sm leading-snug mb-3"
                    style={{ color:'var(--text)' }}>
                    {obra.descricao}
                  </h2>

                  <div className="flex items-center gap-4 text-xs font-body" style={{ color:'var(--muted)' }}>
                    {obra.dataInicio && (
                      <span className="flex items-center gap-1.5">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {new Date(obra.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {obra.dataPrevisaoConclusao && (
                      <span className="flex items-center gap-1.5">
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {new Date(obra.dataPrevisaoConclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between"
                    style={{ borderTop:'1px solid var(--border)' }}>
                    <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color:'var(--muted)' }}>
                      Ver dashboard
                    </span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      className="transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color:'var(--muted)' }}>
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
