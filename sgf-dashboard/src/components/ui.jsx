// ─── ClasseBadge ────────────────────────────────────────────────────────────
export function ClasseBadge({ tipo }) {
  const map = {
    A: { label:'Classe A', bg:'rgba(239,68,68,0.1)',   text:'#F87171', border:'rgba(239,68,68,0.25)' },
    B: { label:'Classe B', bg:'rgba(245,158,11,0.1)',  text:'#FBBF24', border:'rgba(245,158,11,0.25)' },
    C: { label:'Classe C', bg:'rgba(16,185,129,0.1)',  text:'#34D399', border:'rgba(16,185,129,0.25)' },
  }
  const s = map[tipo] || map.C
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.text }} />
      {s.label}
    </span>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  EM_ANDAMENTO: { label:'Em andamento', bg:'rgba(59,130,246,0.1)',   text:'#60A5FA', border:'rgba(59,130,246,0.25)' },
  PLANEJADA:    { label:'Planejada',    bg:'rgba(100,116,139,0.1)',  text:'#94A3B8', border:'rgba(100,116,139,0.25)' },
  PARALISADA:   { label:'Paralisada',   bg:'rgba(245,158,11,0.1)',   text:'#FBBF24', border:'rgba(245,158,11,0.25)' },
  CONCLUIDA:    { label:'Concluída',    bg:'rgba(16,185,129,0.1)',   text:'#34D399', border:'rgba(16,185,129,0.25)' },
  PENDENTE:     { label:'Pendente',     bg:'rgba(100,116,139,0.1)',  text:'#94A3B8', border:'rgba(100,116,139,0.25)' },
  EM_VISTORIA:  { label:'Em vistoria',  bg:'rgba(59,130,246,0.1)',   text:'#60A5FA', border:'rgba(59,130,246,0.25)' },
  APROVADO:     { label:'Aprovado',     bg:'rgba(16,185,129,0.1)',   text:'#34D399', border:'rgba(16,185,129,0.25)' },
  REPROVADO:    { label:'Reprovado',    bg:'rgba(239,68,68,0.1)',    text:'#F87171', border:'rgba(239,68,68,0.25)' },
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg:'rgba(100,116,139,0.1)', text:'#94A3B8', border:'rgba(100,116,139,0.25)' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      {s.label}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', delay = 0, hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl fade-up ${className} ${hover ? 'cursor-pointer' : ''}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
        transition: hover ? 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease' : undefined,
      }}
      onMouseEnter={hover ? e => {
        e.currentTarget.style.background = 'var(--card-hover)'
        e.currentTarget.style.borderColor = 'var(--border-light)'
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
      } : undefined}
      onMouseLeave={hover ? e => {
        e.currentTarget.style.background = 'var(--card)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      } : undefined}
    >
      {children}
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
export function MetricCard({ label, value, subtitle, color, icon, trend, delay = 0 }) {
  const trendPositive = trend && parseFloat(trend) > 0
  const trendNegative = trend && parseFloat(trend) < 0

  return (
    <Card delay={delay} className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: color ? `${color}18` : 'var(--border)' }}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-full
            ${trendPositive ? 'text-emerald-400' : trendNegative ? 'text-red-400' : 'text-slate-400'}`}
            style={{
              background: trendPositive ? 'rgba(16,185,129,0.1)' : trendNegative ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
              border: `1px solid ${trendPositive ? 'rgba(16,185,129,0.2)' : trendNegative ? 'rgba(239,68,68,0.2)' : 'rgba(100,116,139,0.2)'}`
            }}>
            {trendPositive ? '↑' : trendNegative ? '↓' : '—'} {Math.abs(parseFloat(trend))}%
          </span>
        )}
      </div>
      <p className="font-display font-bold text-3xl mb-1" style={{ color: color || 'var(--text)' }}>
        {value}
      </p>
      <p className="text-xs font-body uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</p>
      {subtitle && (
        <p className="text-xs font-body mt-1.5" style={{ color: 'var(--subtle)' }}>{subtitle}</p>
      )}
    </Card>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
export function Loading() {
  return (
    <div className="space-y-4 fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_,i) => (
          <div key={i} className="rounded-xl p-5" style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
            <div className="skeleton w-8 h-8 mb-4 rounded-lg" />
            <div className="skeleton h-8 w-20 mb-2" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_,i) => (
          <div key={i} className="rounded-xl p-6" style={{ background:'var(--card)', border:'1px solid var(--border)', height:'280px' }}>
            <div className="skeleton h-4 w-36 mb-2" />
            <div className="skeleton h-3 w-48 mb-6" />
            <div className="skeleton h-40 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ text = 'Nenhum dado encontrado.', icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 fade-in">
      {icon || (
        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
          style={{ color: 'var(--muted)' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
        </svg>
      )}
      <p className="text-sm font-body" style={{ color: 'var(--muted)' }}>{text}</p>
    </div>
  )
}

// ─── Error ────────────────────────────────────────────────────────────────────
export function ErrorMsg({ message }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl fade-in"
      style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
      <svg width="16" height="16" fill="none" stroke="#F87171" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div>
        <p className="text-sm font-body font-medium" style={{ color:'#F87171' }}>Erro ao carregar dados</p>
        {message && <p className="font-mono text-xs mt-0.5" style={{ color:'rgba(248,113,113,0.6)' }}>{message}</p>}
      </div>
    </div>
  )
}

// ─── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="font-display font-semibold text-sm" style={{ color:'var(--text)' }}>{title}</p>
        {subtitle && <p className="text-xs font-body mt-0.5" style={{ color:'var(--muted)' }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── Filter button ────────────────────────────────────────────────────────────
export function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-lg text-xs font-mono transition-all duration-150"
      style={active ? {
        background:'rgba(59,130,246,0.12)',
        color:'#60A5FA',
        border:'1px solid rgba(59,130,246,0.3)',
      } : {
        background:'transparent',
        color:'var(--muted)',
        border:'1px solid var(--border)',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--subtle)' }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}}
    >
      {children}
    </button>
  )
}

// ─── Tooltip for Recharts ─────────────────────────────────────────────────────
export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2.5 rounded-xl scale-in"
      style={{
        background:'var(--surface)',
        border:'1px solid var(--border-light)',
        boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
        minWidth: '120px',
      }}>
      {label && <p className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color:'var(--muted)' }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-xs font-body" style={{ color:'var(--subtle)' }}>{p.name}</span>
          </div>
          <span className="font-mono text-xs font-semibold" style={{ color:'var(--text)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}
