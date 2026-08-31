import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // accessible depuis d'autres machines du réseau (VM Azure)
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
