import { useEffect, useState } from 'react'
import { getObras, getVistorias } from '../api/sgf'
import { StatusBadge } from '../components/ui'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom:'1px solid var(--border)' }}>
      <div className="skeleton h-3 w-28 rounded flex-shrink-0" style={{ width:'160px' }} />
      <div className="skeleton h-3 w-36 rounded flex-1" />
      <div className="skeleton h-5 w-28 rounded-full flex-shrink-0" />
      <div className="skeleton h-3 w-36 rounded flex-shrink-0" />
    </div>
  )
}

export default function Vistorias() {
  const [obras,      setObras]      = useState([])
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [search,     setSearch]     = useState('')
  const [obraFiltro, setObraFiltro] = useState('')

  useEffect(() => {
    setLoading(true)
    getObras()
      .then(async (lista) => {
        setObras(lista)
        const results = await Promise.allSettled(
          lista.map(o =>
            getVistorias(o.id).then(vs => vs.map(v => ({ vistoria: v, obra: o })))
          )
        )
        const todas = results
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => r.value)
          .sort((a, b) => new Date(b.vistoria.dataHora) - new Date(a.vistoria.dataHora))
        setRows(todas)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtradas = rows.filter(r => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q
      || r.obra.codigo?.toLowerCase().includes(q)
      || r.obra.descricao?.toLowerCase().includes(q)
      || r.vistoria.usuarioNome?.toLowerCase().includes(q)
    const matchObra = !obraFiltro || r.obra.id === obraFiltro
    return matchSearch && matchObra
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="fade-up" style={{ animationFillMode:'forwards' }}>
        <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color:'var(--text)' }}>
          Histórico de Vistorias
        </h1>
        <p className="text-sm font-body mt-0.5" style={{ color:'var(--subtle)' }}>
          Todas as vistorias registradas, ordenadas por data.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 fade-up"
        style={{ animationDelay:'80ms', animationFillMode:'forwards' }}>
        <div className="relative flex-1 min-w-48">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color:'var(--muted)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por obra ou fiscal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base w-full text-xs"
            style={{ paddingLeft:'32px' }}
          />
        </div>
        <select
          value={obraFiltro}
          onChange={e => setObraFiltro(e.target.value)}
          className="input-base text-xs px-3 py-1.5"
          style={{ background:'var(--card)', color:'var(--subtle)', border:'1px solid var(--border)', maxWidth:'340px' }}>
          <option value="">Todas as obras</option>
          {obras.map(o => (
            <option key={o.id} value={o.id}>{o.codigo} — {o.descricao}</option>
          ))}
        </select>
        <span className="font-mono text-[11px] flex-shrink-0" style={{ color:'var(--muted)' }}>
          {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
          <svg width="16" height="16" fill="none" stroke="#F87171" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm" style={{ color:'#F87171' }}>{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden fade-up"
        style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'160ms', animationFillMode:'forwards' }}>

        {/* Header — usando flex em vez de grid para evitar overflow de colunas */}
        <div className="flex items-center px-5 py-3 gap-4"
          style={{ borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
          <span className="font-mono text-[10px] uppercase tracking-wider flex-shrink-0"
            style={{ width:'180px', color:'var(--muted)' }}>Obra</span>
          <span className="font-mono text-[10px] uppercase tracking-wider flex-1"
            style={{ color:'var(--muted)' }}>Fiscal</span>
          <span className="font-mono text-[10px] uppercase tracking-wider flex-shrink-0"
            style={{ width:'140px', color:'var(--muted)' }}>Status Obra</span>
          <span className="font-mono text-[10px] uppercase tracking-wider flex-shrink-0"
            style={{ width:'160px', color:'var(--muted)' }}>Data</span>
        </div>

        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
              style={{ color:'var(--muted)' }}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="2"/>
            </svg>
            <p className="font-body text-sm" style={{ color:'var(--muted)' }}>Nenhuma vistoria encontrada.</p>
          </div>
        ) : (
          <div>
            {filtradas.map(({ vistoria: v, obra }, i) => (
              <div
                key={v.id}
                className="flex items-center px-5 py-3.5 gap-4 transition-colors duration-100"
                style={{ borderBottom: i < filtradas.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Obra — largura fixa, truncate garantido */}
                <div className="flex-shrink-0 min-w-0" style={{ width:'180px' }}>
                  <p className="font-mono text-[11px] truncate" style={{ color:'var(--subtle)' }}>
                    {obra.codigo}
                  </p>
                  <p className="font-body text-xs truncate" style={{ color:'var(--muted)' }}>
                    {obra.descricao}
                  </p>
                </div>

                {/* Fiscal */}
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  {v.usuarioNome && v.usuarioNome !== '[Usuário removido]' ? (
                    // Fiscal ativo — exibição normal
                    <>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-[10px] flex-shrink-0"
                        style={{ background:'rgba(59,130,246,0.15)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.2)' }}
                      >
                        {v.usuarioNome[0].toUpperCase()}
                      </div>
                      <span className="font-body text-sm truncate" style={{ color:'var(--text)' }}>
                        {v.usuarioNome}
                      </span>
                    </>
                  ) : (
                    // Fiscal removido — exibição amigável
                    <>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background:'rgba(107,114,128,0.12)', border:'1px dashed rgba(107,114,128,0.35)' }}
                        title="Este fiscal foi removido do sistema"
                      >
                        <svg width="11" height="11" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <span className="font-body text-xs italic truncate" style={{ color:'var(--muted)' }}>
                        Fiscal desvinculado
                      </span>
                      <span
                        className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background:'rgba(107,114,128,0.12)', color:'var(--muted)', border:'1px solid rgba(107,114,128,0.2)', letterSpacing:'0.04em' }}
                        title="O fiscal foi removido do sistema, mas o registro da vistoria foi preservado"
                      >
                        removido
                      </span>
                    </>
                  )}
                </div>

                {/* Status — largura fixa */}
                <div className="flex-shrink-0" style={{ width:'140px' }}>
                  <StatusBadge status={obra.status} />
                </div>

                {/* Data — largura fixa */}
                <div className="flex-shrink-0" style={{ width:'160px' }}>
                  <span className="font-mono text-[11px]" style={{ color:'var(--muted)' }}>
                    {new Date(v.dataHora).toLocaleString('pt-BR', {
                      day:'2-digit', month:'short', year:'numeric',
                      hour:'2-digit', minute:'2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
