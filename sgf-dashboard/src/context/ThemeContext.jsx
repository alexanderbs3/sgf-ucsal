import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY  = 'sgf_theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Preferência salva pelo usuário
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    // 2. Preferência do sistema operacional
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
    return 'dark'
  })

  // Aplica o atributo no <html> sempre que o tema mudar
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme fora do ThemeProvider')
  return ctx
}
