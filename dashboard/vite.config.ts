import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_PORT = process.env.DASHBOARD_PORT ?? '5174';
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const BACKEND_WS = `ws://localhost:${BACKEND_PORT}`;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cameras': { target: BACKEND_URL, proxyTimeout: 10000, timeout: 10000 },
      '/api': BACKEND_URL,
      '/health': BACKEND_URL,
      '/ws': { target: BACKEND_WS, ws: true },
    },
  },
})
