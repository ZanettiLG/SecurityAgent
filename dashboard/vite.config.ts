import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cameras': { target: 'http://localhost:5174', proxyTimeout: 10000, timeout: 10000 },
      '/api': 'http://localhost:5174',
      '/health': 'http://localhost:5174',
      '/ws': { target: 'ws://localhost:5174', ws: true },
    },
  },
})
