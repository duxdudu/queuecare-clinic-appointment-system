import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev only: proxy /api to local backend so VITE_API_URL can stay empty locally
    ...(mode === 'development' && {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      }
    })
  }
}))
