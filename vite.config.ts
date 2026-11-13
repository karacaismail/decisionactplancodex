import { defineConfig } from 'vite'
import { localTeams } from './server/vite-plugin.mjs'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react(), localTeams()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
})
