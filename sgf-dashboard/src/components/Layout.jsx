import Sidebar from './Sidebar'
import Header  from './Header'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1" style={{ marginLeft: 'var(--sidebar-w)' }}>
        <Header />
        <main className="flex-1 px-8 py-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
