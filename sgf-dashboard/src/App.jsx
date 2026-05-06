import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Obras from './pages/Obras'
import ObraDashboard from './pages/ObraDashboard'
import Vistorias from './pages/Vistorias'
import Analytics from './pages/Analytics'
import Usuarios from './pages/Usuarios'
import Configuracoes from './pages/Configuracoes'

function AppRoutes() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', boxShadow: '0 0 24px rgba(59,130,246,0.4)' }}>
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
            </svg>
          </div>
          <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>Carregando SGF...</p>
        </div>
      </div>
    )
  }

  // Não autenticado → tela de login
  if (!usuario) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Obras />} />
        <Route path="/obras/:id"     element={<ObraDashboard />} />
        <Route path="/relatorios"    element={<Vistorias />} />
        <Route path="/analytics"     element={<Analytics />} />
        <Route path="/usuarios"      element={<Usuarios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
