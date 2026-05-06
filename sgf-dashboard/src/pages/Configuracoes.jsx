import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

// ── Chave de persistência no localStorage ─────────────────────────────────────
const PREFS_KEY = 'sgf_prefs'

function lerPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function salvarPrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-xl fade-up" style={{ background:'var(--card)', border:'1px solid var(--border)', animationFillMode:'forwards' }}>
      <div className="px-6 py-4" style={{ borderBottom:'1px solid var(--border)' }}>
        <p className="font-display font-semibold text-sm" style={{ color:'var(--text)' }}>{title}</p>
        {subtitle && <p className="text-xs font-body mt-0.5" style={{ color:'var(--muted)' }}>{subtitle}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body" style={{ color:'var(--text)' }}>{label}</p>
        {hint && <p className="text-xs font-body mt-0.5" style={{ color:'var(--muted)' }}>{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5 rounded-full transition-colors duration-200"
      style={{ background: checked ? 'rgba(59,130,246,0.6)' : 'var(--border)', border: `1px solid ${checked ? 'rgba(59,130,246,0.8)' : 'var(--border-light)'}` }}>
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
        style={{
          background: checked ? '#60A5FA' : 'var(--muted)',
          transform: checked ? 'translateX(20px)' : 'translateX(1px)',
          boxShadow: checked ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
        }}/>
    </button>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Configuracoes() {
  const { theme, toggleTheme } = useTheme()
  const { usuario, PERMISSOES } = useAuth()

  // Inicializa do localStorage, com fallbacks sensatos
  const prefs = lerPrefs()
  const [notificacoes, setNotificacoes] = useState(prefs.notificacoes  ?? true)
  const [animacoes,    setAnimacoes]    = useState(prefs.animacoes     ?? true)
  const [formatoData,  setFormatoData]  = useState(prefs.formatoData   ?? 'pt-BR')
  const [saved,        setSaved]        = useState(false)

  // Aplica animações globalmente quando a preferência muda
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--animation-duration',
      animacoes ? '0.4s' : '0s'
    )
  }, [animacoes])

  const handleSave = () => {
    // Persiste tudo no localStorage — sobrevive ao reload
    salvarPrefs({ notificacoes, animacoes, formatoData })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const papelLabel = usuario ? (PERMISSOES[usuario.papel]?.label ?? usuario.papel) : '—'

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="fade-up" style={{ animationFillMode:'forwards' }}>
        <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color:'var(--text)' }}>Configurações</h1>
        <p className="text-sm font-body mt-0.5" style={{ color:'var(--subtle)' }}>Preferências do sistema persistidas no navegador.</p>
      </div>

      {/* Conta */}
      <Section title="Conta" subtitle="Informações do usuário autenticado.">
        {[
          { label:'Nome',  value: usuario?.nome  ?? '—' },
          { label:'Email', value: usuario?.email ?? '—' },
          { label:'Papel', value: papelLabel },
        ].map(item => (
          <Field key={item.label} label={item.label}>
            <span className="font-mono text-xs px-2.5 py-1 rounded"
              style={{ background:'var(--border)', color:'var(--subtle)' }}>
              {item.value}
            </span>
          </Field>
        ))}
      </Section>

      {/* Interface */}
      <Section title="Interface" subtitle="Preferências visuais e de comportamento.">
        <Field label="Tema" hint="Alterna entre modo escuro e modo claro. Salvo automaticamente.">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]" style={{ color: theme === 'dark' ? 'var(--accent)' : 'var(--muted)' }}>Escuro</span>
            <Toggle checked={theme === 'light'} onChange={toggleTheme} />
            <span className="font-mono text-[10px]" style={{ color: theme === 'light' ? 'var(--accent)' : 'var(--muted)' }}>Claro</span>
          </div>
        </Field>
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
          <Field label="Animações" hint="Transições e efeitos de entrada dos componentes.">
            <Toggle checked={animacoes} onChange={setAnimacoes} />
          </Field>
        </div>
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
          <Field label="Notificações" hint="Exibir indicador de notificações no header.">
            <Toggle checked={notificacoes} onChange={setNotificacoes} />
          </Field>
        </div>
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
          <Field label="Formato de data" hint="Localização usada para exibição de datas.">
            <select value={formatoData} onChange={e => setFormatoData(e.target.value)}
              className="input-base text-xs"
              style={{ background:'var(--card)', width:'150px' }}>
              <option value="pt-BR">pt-BR (DD/MM/AAAA)</option>
              <option value="en-US">en-US (MM/DD/YYYY)</option>
              <option value="ISO">ISO 8601 (AAAA-MM-DD)</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Sistema */}
      <Section title="Sistema" subtitle="Informações da versão atual.">
        {[
          { label:'Versão',      value:'v5.0.0' },
          { label:'Framework',   value:'React 18 + Vite' },
          { label:'Estilo',      value:'Tailwind CSS v3' },
          { label:'Backend',     value:'Spring Boot 3.4 + JWT' },
        ].map(item => (
          <Field key={item.label} label={item.label}>
            <span className="font-mono text-xs px-2.5 py-1 rounded"
              style={{ background:'var(--border)', color:'var(--subtle)' }}>
              {item.value}
            </span>
          </Field>
        ))}
      </Section>

      {/* Salvar */}
      <div className="flex justify-end fade-up" style={{ animationDelay:'240ms', animationFillMode:'forwards' }}>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-body font-medium transition-all"
          style={{
            background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.12)',
            color:      saved ? '#34D399' : '#60A5FA',
            border: `1px solid ${saved ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`,
          }}>
          {saved ? (
            <>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Salvo no navegador!
            </>
          ) : (
            <>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Salvar preferências
            </>
          )}
        </button>
      </div>
    </div>
  )
}
