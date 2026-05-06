import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts'
import { getObras } from '../api/sgf'
import { ChartTooltip } from '../components/ui'

const STATUS_COLORS = {
  EM_ANDAMENTO:'#60A5FA',
  CONCLUIDA:   '#34D399',
  PARALISADA:  '#FBBF24',
  PLANEJADA:   '#94A3B8',
}
const STATUS_LABELS = {
  EM_ANDAMENTO:'Em andamento',
  CONCLUIDA:   'Concluída',
  PARALISADA:  'Paralisada',
  PLANEJADA:   'Planejada',
}

export default function Analytics() {
  const [obras,   setObras]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    getObras()
      .then(setObras)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Distribuição por status
  const statusDist = Object.entries(
    obras.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})
  ).map(([status, value]) => ({ name: STATUS_LABELS[status] || status, value, status }))

  // Obras por mês de início
  const porMes = obras
    .filter(o => o.dataInicio)
    .reduce((acc, o) => {
      const mes = new Date(o.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { month:'short', year:'2-digit' })
      acc[mes] = (acc[mes] || 0) + 1
      return acc
    }, {})
  const mesData = Object.entries(porMes).map(([mes, total]) => ({ mes, total }))

  const total      = obras.length
  const andamento  = obras.filter(o => o.status === 'EM_ANDAMENTO').length
  const concluidas = obras.filter(o => o.status === 'CONCLUIDA').length
  const paralisadas= obras.filter(o => o.status === 'PARALISADA').length

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="fade-up" style={{ animationFillMode:'forwards' }}>
        <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color:'var(--text)' }}>Analytics</h1>
        <p className="text-sm font-body mt-0.5" style={{ color:'var(--subtle)' }}>
          Visão consolidada do portfólio de obras.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm"
          style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#F87171' }}>
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total de obras',  value: total,       color:'#3B82F6' },
          { label:'Em andamento',    value: andamento,   color:'#60A5FA' },
          { label:'Concluídas',      value: concluidas,  color:'#34D399' },
          { label:'Paralisadas',     value: paralisadas, color:'#FBBF24' },
        ].map((k, i) => (
          <div key={k.label} className="rounded-xl p-5 fade-up"
            style={{ background:'var(--card)', border:'1px solid var(--border)',
              animationDelay:`${i*60}ms`, animationFillMode:'forwards' }}>
            {loading
              ? <><div className="skeleton h-8 w-12 mb-2 rounded"/><div className="skeleton h-3 w-24 rounded"/></>
              : <>
                  <p className="font-display font-bold text-3xl" style={{ color: k.color }}>{k.value}</p>
                  <p className="text-xs font-body uppercase tracking-wider mt-1" style={{ color:'var(--muted)' }}>{k.label}</p>
                </>
            }
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Status pie */}
        <div className="rounded-xl p-6 fade-up"
          style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'240ms', animationFillMode:'forwards' }}>
          <p className="font-display font-semibold text-sm mb-0.5" style={{ color:'var(--text)' }}>Distribuição por Status</p>
          <p className="text-xs font-body mb-4" style={{ color:'var(--muted)' }}>Proporção de obras por estado atual</p>
          {loading ? (
            <div className="skeleton h-52 w-full rounded-lg" />
          ) : statusDist.length === 0 ? (
            <p className="text-xs text-center py-16" style={{ color:'var(--muted)' }}>Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {statusDist.map(d => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status] || '#6B7280'} opacity={0.85}/>
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />}/>
                <Legend
                  formatter={v => <span style={{ color:'var(--subtle)', fontSize:11 }}>{v}</span>}
                  iconSize={8}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Obras por mês */}
        <div className="rounded-xl p-6 fade-up"
          style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'300ms', animationFillMode:'forwards' }}>
          <p className="font-display font-semibold text-sm mb-0.5" style={{ color:'var(--text)' }}>Obras por Mês de Início</p>
          <p className="text-xs font-body mb-4" style={{ color:'var(--muted)' }}>Volume de obras iniciadas por período</p>
          {loading ? (
            <div className="skeleton h-52 w-full rounded-lg" />
          ) : mesData.length === 0 ? (
            <p className="text-xs text-center py-16" style={{ color:'var(--muted)' }}>Sem dados de data de início</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={mesData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="mes" tick={{ fill:'var(--muted)', fontSize:10, fontFamily:'JetBrains Mono' }}
                  axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} width={24}
                  allowDecimals={false}/>
                <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                <Bar dataKey="total" name="Obras" fill="#3B82F6" opacity={0.85} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Taxa de conclusão */}
      {!loading && total > 0 && (
        <div className="rounded-xl p-6 fade-up"
          style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:'360ms', animationFillMode:'forwards' }}>
          <p className="font-display font-semibold text-sm mb-4" style={{ color:'var(--text)' }}>Taxa de Conclusão por Status</p>
          <div className="space-y-3">
            {[
              { label:'Concluídas',    val: concluidas,  color:'#34D399' },
              { label:'Em andamento',  val: andamento,   color:'#60A5FA' },
              { label:'Paralisadas',   val: paralisadas, color:'#FBBF24' },
              { label:'Planejadas',    val: obras.filter(o=>o.status==='PLANEJADA').length, color:'#94A3B8' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between mb-1">
                  <span className="font-body text-xs" style={{ color:'var(--subtle)' }}>{r.label}</span>
                  <span className="font-mono text-xs" style={{ color:'var(--muted)' }}>
                    {r.val} ({Math.round((r.val/total)*100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ background:'var(--border)' }}>
                  <div className="h-2 rounded-full transition-all duration-700"
                    style={{ width:`${(r.val/total)*100}%`, background:r.color, boxShadow:`0 0 8px ${r.color}40` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
