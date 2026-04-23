import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io', '.localtunnel.me'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/stats': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/usuarios': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/productos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/clientes': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/pedidos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/tiendas': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/metricas': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/tienda': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/wompi': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
