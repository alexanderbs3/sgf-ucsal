import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/obras': 'http://localhost:8080',
      '/itens': 'http://localhost:8080',
      '/vistorias': 'http://localhost:8080',
      '/logs': 'http://localhost:8080',
    }
  }
})