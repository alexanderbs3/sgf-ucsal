import { useEffect, useState } from 'react'
import { getClassificacoes, criarItem } from '../api/sgf'

/**
 * Modal para adicionar um novo item a uma obra.
 * Props:
 *   obraId   — UUID da obra
 *   onClose  — fecha o modal
 *   onSaved  — chamado após salvar com sucesso (dispara recarga)
 */
export default function AdicionarItemModal({ obraId, onClose, onSaved }) {
  const [classificacoes, setClassificacoes] = useState([])
  const [loadingClass,   setLoadingClass]   = useState(true)
  const [form, setForm] = useState({
    descricao:       '',
    classificacaoId: '',
    status:          'PENDENTE',
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Fechar com Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // Carregar classificações ABC do backend
  useEffect(() => {
    getClassificacoes()
      .then(list => {
        // Ordenar A → B → C
        const ordered = [...list].sort((a, b) =>
          String(a.tipo).localeCompare(String(b.tipo))
        )
        setClassificacoes(ordered)
        if (ordered.length > 0) set('classificacaoId', ordered[0].id)
      })
      .catch(() => setErr('Erro ao carregar classificações.'))
      .finally(() => setLoadingClass(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.descricao.trim()) { setErr('Descrição é obrigatória.'); return }
    if (!form.classificacaoId)  { setErr('Selecione uma classificação.'); return }
    setSaving(true)
    setErr(null)
    try {
      await criarItem({
        obraId:          obraId,
        classificacaoId: form.classificacaoId,
        descricao:       form.descricao.trim(),
        status:          form.status,
      })
      onSaved()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const CLASSE_STYLE = {
    A: { bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.3)', text:'#F87171', label:'Alto impacto' },
    B: { bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.3)',  text:'#FBBF24', label:'Impacto médio' },
    C: { bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.3)',  text:'#34D399', label:'Baixo impacto' },
  }

  const STATUS_OPTIONS = [
    { value:'PENDENTE',    label:'Pendente',    color:'#94A3B8' },
    { value:'EM_VISTORIA', label:'Em vistoria', color:'#60A5FA' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl scale-in"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          animationFillMode: 'forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>
              Adicionar Item
            </h2>
            <p className="text-xs font-body mt-0.5" style={{ color: 'var(--muted)' }}>
              O item será vinculado a esta obra com status inicial.
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--border)', color: 'var(--subtle)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {err && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {err}
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--muted)' }}>
              Descrição *
            </label>
            <textarea
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              placeholder="Ex: Fundação e estrutura de concreto..."
              rows={3}
              className="input-base w-full text-xs resize-none"
              autoFocus
            />
          </div>

          {/* Classificação */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider mb-2"
              style={{ color: 'var(--muted)' }}>
              Classificação ABC *
            </label>
            {loadingClass ? (
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton flex-1 h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {classificacoes.map(c => {
                  const tipo = String(c.tipo)
                  const s    = CLASSE_STYLE[tipo] || CLASSE_STYLE.C
                  const sel  = form.classificacaoId === c.id
                  return (
                    <button key={c.id} onClick={() => set('classificacaoId', c.id)}
                      className="flex flex-col gap-1 px-3 py-3 rounded-xl text-left transition-all"
                      style={{
                        background: sel ? s.bg      : 'var(--surface)',
                        border:     `1px solid ${sel ? s.border : 'var(--border)'}`,
                        color:      sel ? s.text    : 'var(--muted)',
                      }}
                      onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--subtle)' }}}
                      onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = 'var(--border)';       e.currentTarget.style.color = 'var(--muted)'  }}}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center font-display font-bold text-[11px] flex-shrink-0"
                          style={{ background: sel ? `${s.text}22` : 'var(--border)', color: sel ? s.text : 'var(--subtle)' }}>
                          {tipo}
                        </span>
                        <span className="font-display font-bold text-sm">{`Classe ${tipo}`}</span>
                        {sel && (
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5"
                            viewBox="0 0 24 24" className="ml-auto flex-shrink-0">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <p className="font-body text-[10px] leading-tight" style={{ color: sel ? s.text : 'var(--muted)', opacity: 0.8 }}>
                        {s.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
            {/* Critério da classificação selecionada */}
            {form.classificacaoId && (() => {
              const c = classificacoes.find(x => x.id === form.classificacaoId)
              if (!c) return null
              const tipo = String(c.tipo)
              const s    = CLASSE_STYLE[tipo] || CLASSE_STYLE.C
              return (
                <p className="text-[11px] font-body mt-2 px-1" style={{ color: 'var(--muted)' }}>
                  <span style={{ color: s.text }}>Critério: </span>{c.criterio}
                </p>
              )
            })()}
          </div>

          {/* Status inicial */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider mb-2"
              style={{ color: 'var(--muted)' }}>
              Status inicial
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => {
                const sel = form.status === opt.value
                return (
                  <button key={opt.value} onClick={() => set('status', opt.value)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-body transition-all"
                    style={{
                      background: sel ? `${opt.color}15` : 'var(--surface)',
                      border:     `1px solid ${sel ? `${opt.color}40` : 'var(--border)'}`,
                      color:      sel ? opt.color : 'var(--muted)',
                    }}
                    onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--subtle)' }}}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = 'var(--border)';       e.currentTarget.style.color = 'var(--muted)'  }}}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />
                    {opt.label}
                    {sel && (
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-body transition-colors"
            style={{ background: 'transparent', color: 'var(--subtle)', border: '1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving || loadingClass}
            className="px-4 py-2 rounded-lg text-xs font-body font-medium transition-all"
            style={{
              background: (saving || loadingClass) ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.15)',
              color: '#60A5FA',
              border: '1px solid rgba(59,130,246,0.3)',
              cursor: (saving || loadingClass) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!saving && !loadingClass) e.currentTarget.style.background = 'rgba(59,130,246,0.25)' }}
            onMouseLeave={e => { if (!saving && !loadingClass) e.currentTarget.style.background = 'rgba(59,130,246,0.15)' }}>
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Adicionando...
              </span>
            ) : 'Adicionar item'}
          </button>
        </div>
      </div>
    </div>
  )
}
