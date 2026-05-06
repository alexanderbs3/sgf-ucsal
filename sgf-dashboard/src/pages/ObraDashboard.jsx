import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { getDashboard, getItens, getVistorias, getTimelineVistorias, atualizarStatusObra } from '../api/sgf'
import AdicionarItemModal from '../components/AdicionarItemModal'
import { useAuth } from '../context/AuthContext'
import {
  ClasseBadge, StatusBadge,
  Loading, ErrorMsg, Empty, SectionHeader, FilterBtn, ChartTooltip
} from '../components/ui'

const ABC_COLORS = ['#F87171', '#FBBF24', '#34D399']
const STATUS_COLORS = {
  APROVADO: '#34D399', REPROVADO: '#F87171', EM_VISTORIA: '#60A5FA', PENDENTE: '#6B7280'
}

// Máquina de estados espelhada do backend
const TRANSICOES = {
  PLANEJADA:    ['EM_ANDAMENTO'],
  EM_ANDAMENTO: ['PARALISADA', 'CONCLUIDA'],
  PARALISADA:   ['EM_ANDAMENTO'],
  CONCLUIDA:    [],
}
const STATUS_LABEL = {
  PLANEJADA:    'Planejada',
  EM_ANDAMENTO: 'Em andamento',
  PARALISADA:   'Paralisada',
  CONCLUIDA:    'Concluída',
}

// ── Progress Ring ─────────────────────────────────────────────────────────────
function ProgressRing({ value, max, color, size = 100, label }) {
  const pct  = max ? Math.round((value / max) * 100) : 0
  const r    = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="6"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round"
            style={{ transition:'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono font-bold text-sm" style={{ color }}>{pct}%</span>
        </div>
      </div>
      {label && <span className="font-mono text-[10px]" style={{ color:'var(--muted)' }}>{label}</span>}
    </div>
  )
}

// ── Sortable TH ───────────────────────────────────────────────────────────────
function ThSort({ children, field, current, onSort }) {
  const active = current.field === field
  return (
    <button onClick={() => onSort(field)}
      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition-colors"
      style={{ color: active ? 'var(--subtle)' : 'var(--muted)' }}>
      {children}
      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        style={{ opacity: active ? 1 : 0.4,
          transform: active && current.dir === 'desc' ? 'rotate(180deg)' : 'none',
          transition:'transform 0.2s' }}>
        <path d="M6 9l6-6 6 6M6 15l6 6 6-6"/>
      </svg>
    </button>
  )
}

// ── Modal Alterar Status ──────────────────────────────────────────────────────
function AlterarStatusModal({ statusAtual, obraId, onClose, onSaved }) {
  const proximos   = TRANSICOES[statusAtual] || []
  const [novoStatus, setNovoStatus] = useState(proximos[0] || '')
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState(null)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleConfirm = async () => {
    if (!novoStatus) return
    setSaving(true)
    setErr(null)
    try {
      await atualizarStatusObra(obraId, novoStatus)
      onSaved(novoStatus)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const statusColorMap = {
    EM_ANDAMENTO: { bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.25)',  text:'#60A5FA' },
    PARALISADA:   { bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.25)',  text:'#FBBF24' },
    CONCLUIDA:    { bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.25)',  text:'#34D399' },
    PLANEJADA:    { bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.25)', text:'#94A3B8' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl scale-in"
        style={{ background:'var(--card)', border:'1px solid var(--border-light)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.5)', animationFillMode:'forwards' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom:'1px solid var(--border)' }}>
          <div>
            <h2 className="font-display font-bold text-sm" style={{ color:'var(--text)' }}>
              Alterar Status da Obra
            </h2>
            <p className="text-xs font-body mt-0.5" style={{ color:'var(--muted)' }}>
              Status atual:&nbsp;
              <span style={{ color:'var(--subtle)' }}>{STATUS_LABEL[statusAtual]}</span>
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
        <div className="px-6 py-5">
          {proximos.length === 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)' }}>
              <svg width="14" height="14" fill="none" stroke="#34D399" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="text-sm font-body" style={{ color:'#34D399' }}>
                Esta obra está <strong>Concluída</strong> — nenhuma transição disponível.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-body mb-3" style={{ color:'var(--subtle)' }}>
                Selecione o próximo status:
              </p>
              <div className="space-y-2">
                {proximos.map(s => {
                  const c = statusColorMap[s] || statusColorMap.PLANEJADA
                  return (
                    <button key={s} onClick={() => setNovoStatus(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                      style={{
                        background:   novoStatus === s ? c.bg : 'var(--surface)',
                        border:       `1px solid ${novoStatus === s ? c.border : 'var(--border)'}`,
                        color:        novoStatus === s ? c.text : 'var(--subtle)',
                      }}
                      onMouseEnter={e => { if (novoStatus !== s) { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.color='var(--text)' }}}
                      onMouseLeave={e => { if (novoStatus !== s) { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--subtle)' }}}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.text }}/>
                      <span className="font-body text-sm font-medium">{STATUS_LABEL[s]}</span>
                      {novoStatus === s && (
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"
                          viewBox="0 0 24 24" className="ml-auto">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>

              {err && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#F87171' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {err}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {proximos.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-6 py-4"
            style={{ borderTop:'1px solid var(--border)' }}>
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-body transition-colors"
              style={{ background:'transparent', color:'var(--subtle)', border:'1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-light)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
              Cancelar
            </button>
            <button onClick={handleConfirm} disabled={saving || !novoStatus}
              className="px-4 py-2 rounded-lg text-xs font-body font-medium transition-all"
              style={{
                background: saving ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.15)',
                color: '#60A5FA', border:'1px solid rgba(59,130,246,0.3)',
                cursor: saving || !novoStatus ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!saving && novoStatus) e.currentTarget.style.background='rgba(59,130,246,0.25)' }}
              onMouseLeave={e => { if (!saving && novoStatus) e.currentTarget.style.background='rgba(59,130,246,0.15)' }}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Salvando...
                </span>
              ) : 'Confirmar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Exportar CSV ──────────────────────────────────────────────────────────────
// ATENÇÃO: esta função é declarada no escopo do módulo (fora do componente),
// portanto não tem acesso ao state `statusAtual`. O status é lido de `dash.statusObra`
// ou `dash.status` — os mesmos dados retornados pelo backend no objeto dashboard.
function exportarCSV(dash, itens, vistorias) {
  // CORREÇÃO: `statusAtual` era um state do componente, inacessível aqui.
  // Usamos `dash.statusObra ?? dash.status` que carrega o mesmo valor.
  const statusDaObra = dash.statusObra || dash.status || ''

  const linhas = [
    // Seção 1: resumo da obra
    ['=== RESUMO DA OBRA ==='],
    ['Campo', 'Valor'],
    ['Código',             dash.codigo],
    ['Descrição',          dash.descricao],
    ['Status',             STATUS_LABEL[statusDaObra] || statusDaObra],
    ['Início',             dash.dataInicio || '-'],
    ['Previsão conclusão', dash.dataPrevisaoConclusao || '-'],
    [],
    // Seção 2: KPIs
    ['=== MÉTRICAS ==='],
    ['Total de itens',  dash.totalItens],
    ['Aprovados',       dash.aprovados],
    ['Reprovados',      dash.reprovados],
    ['Em vistoria',     dash.emVistoria],
    ['Pendentes',       dash.pendentes],
    ['% Aprovação',     `${dash.percentualAprovacao ?? 0}%`],
    ['Classe A',        dash.itensClasseA],
    ['Classe B',        dash.itensClasseB],
    ['Classe C',        dash.itensClasseC],
    [],
    // Seção 3: itens
    ['=== ITENS FISCALIZADOS ==='],
    ['Descrição', 'Classificação', 'Status'],
    ...itens.map(i => [i.descricao, `Classe ${i.classificacaoTipo}`, i.status]),
    [],
    // Seção 4: vistorias
    ['=== HISTÓRICO DE VISTORIAS ==='],
    ['Fiscal', 'Data/Hora', 'Observações'],
    ...vistorias.map(v => [
      v.usuarioNome && v.usuarioNome !== '[Usuário removido]'
        ? v.usuarioNome
        : 'Fiscal desvinculado',
      new Date(v.dataHora).toLocaleString('pt-BR'),
      v.observacoes || '-',
    ]),
  ]

  const csv = linhas
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `sgf_${dash.codigo}_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ObraDashboard() {
  const { id } = useParams()

  const [dash,         setDash]         = useState(null)
  const [itens,        setItens]        = useState([])
  const [vistorias,    setVistorias]    = useState([])
  const [timeline,     setTimeline]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [modalStatus,  setModalStatus]  = useState(false)
  const [modalItem,    setModalItem]    = useState(false)
  const [itemDetalhe,  setItemDetalhe]  = useState(null)  // item selecionado para ver logs
  const { pode } = useAuth()
  const [statusAtual,  setStatusAtual]  = useState(null)

  // Filtros locais da tabela de itens
  const [filtroABC,  setFiltroABC]  = useState('')
  const [filtroSt,   setFiltroSt]   = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [sort,       setSort]       = useState({ field:'descricao', dir:'asc' })
  const [activeTab,  setActiveTab]  = useState('itens')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    // Endpoints críticos — todos devem resolver para montar o dashboard
    const core = Promise.all([
      getDashboard(id),
      getItens(id),
      getVistorias(id),
    ])

    // Timeline é opcional — falha silenciosa retorna lista vazia
    const timelineReq = getTimelineVistorias(id).catch(() => [])

    Promise.all([core, timelineReq])
      .then(([[d, i, v], t]) => {
        if (cancelled) return
        setDash(d)
        // Compatibilidade: backend original usa `status`, v2+ usa `statusObra`
        setStatusAtual(d.statusObra || d.status || null)
        setItens(i)
        setVistorias(v)
        setTimeline(Array.isArray(t) ? t.map(row => ({
          date:  row.data || row.date || '',
          total: Number(row.total ?? 0),
        })) : [])
      })
      .catch(e => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  const carregar = useCallback(() => {
    setDash(null)
    setItens([])
    setVistorias([])
    setTimeline([])
    setError(null)
    setLoading(true)
    // Re-trigger via key change or manual call — forces useEffect re-run
    // This is a manual reload: reset state then re-fetch
    Promise.all([
      getDashboard(id),
      getItens(id),
      getVistorias(id),
    ]).then(([d, i, v]) => {
      setDash(d)
      setStatusAtual(d.statusObra || d.status || null)
      setItens(i)
      setVistorias(v)
      getTimelineVistorias(id).catch(() => []).then(t => {
        setTimeline(Array.isArray(t) ? t.map(row => ({
          date:  row.data || row.date || '',
          total: Number(row.total ?? 0),
        })) : [])
      })
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loading />
  if (error) return (
    <div className="max-w-7xl mx-auto space-y-4">
      <ErrorMsg message={error} />
      <button onClick={carregar}
        className="text-xs font-mono px-3 py-1.5 rounded-lg"
        style={{ background:'var(--card)', color:'var(--subtle)', border:'1px solid var(--border)' }}>
        Tentar novamente
      </button>
    </div>
  )
  if (!dash) return null

  const abcData = [
    { name:'Classe A', value: dash.itensClasseA || 0 },
    { name:'Classe B', value: dash.itensClasseB || 0 },
    { name:'Classe C', value: dash.itensClasseC || 0 },
  ]
  const statusData = [
    { name:'Aprovado',    value: dash.aprovados  || 0, fill: STATUS_COLORS.APROVADO },
    { name:'Reprovado',   value: dash.reprovados || 0, fill: STATUS_COLORS.REPROVADO },
    { name:'Em vistoria', value: dash.emVistoria || 0, fill: STATUS_COLORS.EM_VISTORIA },
    { name:'Pendente',    value: dash.pendentes  || 0, fill: STATUS_COLORS.PENDENTE },
  ]

  const itensFiltrados = itens
    .filter(item =>
      (!filtroABC  || String(item.classificacaoTipo) === filtroABC) &&
      (!filtroSt   || item.status === filtroSt) &&
      (!itemSearch || item.descricao?.toLowerCase().includes(itemSearch.toLowerCase()))
    )
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      const av = sort.field === 'classificacaoTipo'
        ? String(a.classificacaoTipo || '')
        : String(a[sort.field] || '')
      const bv = sort.field === 'classificacaoTipo'
        ? String(b.classificacaoTipo || '')
        : String(b[sort.field] || '')
      return av.localeCompare(bv) * dir
    })

  const handleSort = (field) =>
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))

  const pctAprovados = dash.totalItens
    ? Math.round((dash.aprovados / dash.totalItens) * 100)
    : 0

  const temTransicao = (TRANSICOES[statusAtual] || []).length > 0

  return (
    <>
      {modalItem && (
        <AdicionarItemModal
          obraId={id}
          onClose={() => setModalItem(false)}
          onSaved={() => { setModalItem(false); carregar() }}
        />
      )}

      {modalStatus && (
        <AlterarStatusModal
          statusAtual={statusAtual}
          obraId={id}
          onClose={() => setModalStatus(false)}
          onSaved={(novoStatus) => {
            setStatusAtual(novoStatus)
            setDash(prev => ({ ...prev, statusObra: novoStatus }))
            setModalStatus(false)
          }}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Breadcrumb + header */}
        <div className="fade-up" style={{ animationDelay:'0ms', animationFillMode:'forwards' }}>
          <Link to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono mb-3 transition-colors"
            style={{ color:'var(--muted)' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--subtle)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--muted)'}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Obras
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded"
                  style={{ background:'var(--border)', color:'var(--subtle)' }}>
                  {dash.codigo}
                </span>
                {/* Badge de status clicável — abre o modal de transição */}
                <button
                  onClick={() => temTransicao && pode('alterar_status_obra') && setModalStatus(true)}
                  className="flex items-center gap-1.5 transition-all"
                  title={temTransicao && pode('alterar_status_obra') ? 'Clique para alterar o status' : 'Sem permissão ou status terminal'}
                  style={{ cursor: temTransicao && pode('alterar_status_obra') ? 'pointer' : 'default' }}>
                  <StatusBadge status={statusAtual} />
                  {temTransicao && (
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"
                      viewBox="0 0 24 24" style={{ color:'var(--muted)' }}>
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  )}
                </button>
              </div>
              <h1 className="font-display font-bold text-xl tracking-tight leading-tight"
                style={{ color:'var(--text)' }}>
                {dash.descricao}
              </h1>
              {(dash.dataInicio || dash.dataPrevisaoConclusao) && (
                <div className="flex items-center gap-4 mt-1">
                  {dash.dataInicio && (
                    <span className="flex items-center gap-1 font-mono text-[11px]" style={{ color:'var(--muted)' }}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Início: {new Date(dash.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {dash.dataPrevisaoConclusao && (
                    <span className="flex items-center gap-1 font-mono text-[11px]" style={{ color:'var(--muted)' }}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Previsão: {new Date(dash.dataPrevisaoConclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {temTransicao && pode('alterar_status_obra') && (
                <button
                  onClick={() => setModalStatus(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-body font-medium transition-all"
                  style={{ background:'rgba(59,130,246,0.1)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.25)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(59,130,246,0.1)'}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Alterar status
                </button>
              )}
              <button
                onClick={() => exportarCSV(dash, itens, vistorias)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all"
                style={{ background:'var(--card)', color:'var(--subtle)', border:'1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.color='var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--subtle)' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:'Total de itens', value: dash.totalItens,  color:'#3B82F6', delay:40 },
            { label:'Aprovados',      value: dash.aprovados,   color:'#34D399', delay:100, badge:`${pctAprovados}%` },
            { label:'Em vistoria',    value: dash.emVistoria,  color:'#60A5FA', delay:160 },
            { label:'Pendentes',      value: dash.pendentes,   color:'#94A3B8', delay:220 },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-5 fade-up"
              style={{ background:'var(--card)', border:'1px solid var(--border)',
                animationDelay:`${m.delay}ms`, animationFillMode:'forwards' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-2 h-2 rounded-full mt-1"
                  style={{ background: m.color, boxShadow:`0 0 6px ${m.color}80` }} />
                {m.badge && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background:'rgba(52,211,153,0.1)', color:'#34D399', border:'1px solid rgba(52,211,153,0.2)' }}>
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="font-display font-bold text-3xl" style={{ color: m.color }}>{m.value ?? '—'}</p>
              <p className="text-xs font-body uppercase tracking-widest mt-1" style={{ color:'var(--muted)' }}>
                {m.label}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ABC Donut */}
          <div className="rounded-xl p-6 fade-up"
            style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'280ms', animationFillMode:'forwards' }}>
            <SectionHeader title="Classificação ABC" subtitle="Distribuição por criticidade" />
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={abcData} cx="50%" cy="50%" innerRadius={48} outerRadius={76}
                    dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {abcData.map((_, i) => <Cell key={i} fill={ABC_COLORS[i]} opacity={0.88}/>)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {abcData.map((d, i) => (
                  <div key={d.name} className="flex flex-col items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: ABC_COLORS[i] }} />
                    <span className="font-mono text-[10px] text-center" style={{ color:'var(--muted)' }}>{d.name}</span>
                    <span className="font-display font-bold text-sm" style={{ color: ABC_COLORS[i] }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="rounded-xl p-6 fade-up"
            style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'340ms', animationFillMode:'forwards' }}>
            <SectionHeader title="Status dos Itens" subtitle="Quantidade por estado atual" />
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:10, fontFamily:'JetBrains Mono' }}
                    axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} width={24}/>
                  <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress rings */}
          <div className="rounded-xl p-6 fade-up"
            style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'400ms', animationFillMode:'forwards' }}>
            <SectionHeader title="Taxa de Aprovação" subtitle="Progresso geral da fiscalização" />
            <div className="mt-4 flex flex-col items-center gap-4">
              <ProgressRing value={dash.aprovados || 0} max={dash.totalItens || 1}
                color="#34D399" size={100} label="Aprovação" />
              <div className="w-full space-y-2 mt-1">
                {[
                  { label:'Aprovados',   val: dash.aprovados  || 0, color:'#34D399' },
                  { label:'Em vistoria', val: dash.emVistoria || 0, color:'#60A5FA' },
                  { label:'Reprovados',  val: dash.reprovados || 0, color:'#F87171' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-xs" style={{ color:'var(--subtle)' }}>{r.label}</span>
                      <span className="font-mono text-xs" style={{ color:'var(--muted)' }}>{r.val}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background:'var(--border)' }}>
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{
                          width:`${dash.totalItens ? (r.val/dash.totalItens)*100 : 0}%`,
                          background: r.color,
                          boxShadow:`0 0 8px ${r.color}50`,
                        }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {timeline.length > 1 && (
          <div className="rounded-xl p-6 fade-up"
            style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'460ms', animationFillMode:'forwards' }}>
            <SectionHeader title="Vistorias por Data" subtitle="Frequência de vistorias registradas" />
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#3B82F6" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10, fontFamily:'JetBrains Mono' }}
                    axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} width={24}/>
                  <Tooltip content={<ChartTooltip />}/>
                  <Area type="monotone" dataKey="total" name="Vistorias"
                    stroke="#3B82F6" fill="url(#vGrad)" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="fade-up" style={{ animationDelay:'500ms', animationFillMode:'forwards' }}>
          <div className="flex items-center gap-1 p-1 rounded-xl mb-4 w-fit"
            style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
            {[
              { id:'itens',     label:'Itens Fiscalizados',     count: itens.length },
              { id:'vistorias', label:'Histórico de Vistorias',  count: vistorias.length },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="px-4 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-200"
                style={activeTab === tab.id ? {
                  background:'var(--card)', color:'var(--text)',
                  border:'1px solid var(--border-light)', boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
                } : {
                  background:'transparent', color:'var(--muted)', border:'1px solid transparent',
                }}>
                {tab.label}
                <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background:'var(--border)', color:'var(--muted)' }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Itens tab */}
          {activeTab === 'itens' && (
            <>
            <div className="rounded-xl overflow-hidden scale-in"
              style={{ background:'var(--card)', border:'1px solid var(--border)', animationFillMode:'forwards' }}>
              <div className="px-5 py-4 flex flex-wrap items-center gap-3"
                style={{ borderBottom:'1px solid var(--border)' }}>
                <div className="relative flex-1 min-w-40">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color:'var(--muted)' }}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input type="text" placeholder="Buscar item..." value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="input-base w-full text-xs"
                    style={{ paddingLeft:'32px' }} />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[{v:'',l:'Todos'},{v:'A',l:'A'},{v:'B',l:'B'},{v:'C',l:'C'}].map(f => (
                    <FilterBtn key={f.v} active={filtroABC===f.v} onClick={() => setFiltroABC(f.v)}>
                      {f.v ? `Classe ${f.l}` : f.l}
                    </FilterBtn>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    {v:'',          l:'Todos'},
                    {v:'APROVADO',  l:'Aprovado'},
                    {v:'REPROVADO', l:'Reprovado'},
                    {v:'EM_VISTORIA',l:'Vistoria'},
                    {v:'PENDENTE',  l:'Pendente'},
                  ].map(f => (
                    <FilterBtn key={f.v} active={filtroSt===f.v} onClick={() => setFiltroSt(f.v)}>
                      {f.l}
                    </FilterBtn>
                  ))}
                </div>
                <button
                  onClick={() => setModalItem(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ml-auto"
                  style={{ display: pode('adicionar_item') ? 'flex' : 'none', background:'rgba(59,130,246,0.1)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.25)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(59,130,246,0.1)'}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Adicionar item
                </button>
                <span className="font-mono text-[11px]" style={{ color:'var(--muted)' }}>
                  {itensFiltrados.length} de {itens.length}
                </span>
              </div>

              <div className="grid px-5 py-2.5"
                style={{ gridTemplateColumns:'130px 1fr 160px 110px', borderBottom:'1px solid var(--border)' }}>
                <ThSort field="classificacaoTipo" current={sort} onSort={handleSort}>Classe</ThSort>
                <ThSort field="descricao"         current={sort} onSort={handleSort}>Descrição</ThSort>
                <ThSort field="status"            current={sort} onSort={handleSort}>Status</ThSort>
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color:'var(--muted)' }}>
                  Ações
                </span>
              </div>

              {itensFiltrados.length === 0 ? (
                <Empty text="Nenhum item encontrado com os filtros aplicados." />
              ) : (
                <div>
                  {itensFiltrados.map((item, i) => (
                    <div key={item.id}
                      className="grid px-5 py-3.5 transition-colors duration-100"
                      style={{
                        gridTemplateColumns:'130px 1fr 160px 110px',
                        borderBottom: i < itensFiltrados.length-1 ? '1px solid var(--border)' : 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div className="flex items-center">
                        <ClasseBadge tipo={String(item.classificacaoTipo)} />
                      </div>
                      <div className="flex items-center pr-4 min-w-0 overflow-hidden">
                        <span className="font-body text-sm truncate" style={{ color:'var(--text)' }}>
                          {item.descricao}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => setItemDetalhe(itemDetalhe?.id === item.id ? null : item)}
                          className="font-mono text-[10px] px-2.5 py-1 rounded-lg transition-all"
                          style={{
                            background: itemDetalhe?.id === item.id ? 'rgba(59,130,246,0.18)' : 'var(--border)',
                            color:      itemDetalhe?.id === item.id ? '#60A5FA' : 'var(--subtle)',
                            border:     itemDetalhe?.id === item.id ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
                          }}
                          onMouseEnter={e => { if (itemDetalhe?.id !== item.id) { e.currentTarget.style.background='rgba(59,130,246,0.12)'; e.currentTarget.style.color='#60A5FA'; e.currentTarget.style.border='1px solid rgba(59,130,246,0.25)' }}}
                          onMouseLeave={e => { if (itemDetalhe?.id !== item.id) { e.currentTarget.style.background='var(--border)'; e.currentTarget.style.color='var(--subtle)'; e.currentTarget.style.border='1px solid transparent' }}}>
                          {itemDetalhe?.id === item.id ? 'Fechar' : 'Detalhe'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Painel de detalhe do item — abre abaixo da tabela quando Detalhe é clicado */}
            {itemDetalhe && (
              <div className="rounded-xl fade-in"
                style={{ background:'var(--surface)', border:'1px solid rgba(59,130,246,0.25)', animationFillMode:'forwards' }}>
                <div className="px-5 py-4 flex items-start justify-between" style={{ borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <p className="font-display font-semibold text-sm" style={{ color:'var(--text)' }}>
                      {itemDetalhe.descricao}
                    </p>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color:'var(--muted)' }}>
                      Classe {itemDetalhe.classificacaoTipo} · {itemDetalhe.status}
                    </p>
                  </div>
                  <button onClick={() => setItemDetalhe(null)}
                    style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--muted)', padding:4 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="px-5 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider mb-3" style={{ color:'var(--muted)' }}>
                    Informações do item
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label:'ID',           value: itemDetalhe.id?.slice(0,8) + '...' },
                      { label:'Obra',         value: dash?.codigo ?? '—' },
                      { label:'Classificação',value: `Classe ${itemDetalhe.classificacaoTipo}` },
                      { label:'Status atual', value: itemDetalhe.status },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-lg" style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
                        <p className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color:'var(--muted)' }}>{label}</p>
                        <p className="font-body text-xs font-medium" style={{ color:'var(--text)' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] mt-4" style={{ color:'var(--muted)' }}>
                    Para ver o histórico completo de logs deste item, acesse a aba{' '}
                    <button onClick={() => { setActiveTab('vistorias'); setItemDetalhe(null) }}
                      style={{ background:'transparent', border:'none', cursor:'pointer', color:'#60A5FA', fontFamily:'inherit', fontSize:'inherit', padding:0 }}>
                      Vistorias
                    </button>.
                  </p>
                </div>
              </div>
            )}
            </>
          )}

          {/* Vistorias tab */}
          {activeTab === 'vistorias' && (
            <div className="rounded-xl overflow-hidden scale-in"
              style={{ background:'var(--card)', border:'1px solid var(--border)', animationFillMode:'forwards' }}>
              <div className="px-5 py-4" style={{ borderBottom:'1px solid var(--border)' }}>
                <SectionHeader
                  title="Histórico de Vistorias"
                  subtitle={`${vistorias.length} vistoria${vistorias.length !== 1 ? 's' : ''} registrada${vistorias.length !== 1 ? 's' : ''} para esta obra`}
                />
              </div>
              {vistorias.length === 0 ? (
                <Empty text="Nenhuma vistoria registrada para esta obra." />
              ) : (
                <div>
                  {vistorias.map((v, i) => (
                    <div key={v.id}
                      className="px-5 py-4 transition-colors duration-100"
                      style={{ borderBottom: i < vistorias.length-1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div className="flex items-start gap-3">
                        {v.usuarioNome && v.usuarioNome !== '[Usuário removido]' ? (
                          <div
                            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-display font-bold text-xs mt-0.5"
                            style={{ background:'rgba(59,130,246,0.15)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.2)' }}>
                            {v.usuarioNome[0].toUpperCase()}
                          </div>
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                            style={{ background:'rgba(107,114,128,0.1)', border:'1px dashed rgba(107,114,128,0.35)' }}
                            title="Fiscal removido do sistema">
                            <svg width="12" height="12" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {v.usuarioNome && v.usuarioNome !== '[Usuário removido]' ? (
                                <p className="font-body text-sm font-medium" style={{ color:'var(--text)' }}>
                                  {v.usuarioNome}
                                </p>
                              ) : (
                                <>
                                  <p className="font-body text-sm italic" style={{ color:'var(--muted)' }}>
                                    Fiscal desvinculado
                                  </p>
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                                    style={{ background:'rgba(107,114,128,0.12)', color:'var(--muted)', border:'1px solid rgba(107,114,128,0.2)' }}>
                                    removido
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="font-mono text-[11px] flex-shrink-0" style={{ color:'var(--muted)' }}>
                              {new Date(v.dataHora).toLocaleString('pt-BR', {
                                day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit',
                              })}
                            </span>
                          </div>
                          {v.observacoes ? (
                            <p className="text-xs font-body mt-1 leading-relaxed"
                              style={{ color:'var(--subtle)' }}>
                              {v.observacoes}
                            </p>
                          ) : (
                            <p className="text-xs font-mono mt-1 italic"
                              style={{ color:'var(--muted)' }}>
                              Sem observações registradas.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
