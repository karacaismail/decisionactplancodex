import { defineConfig } from 'vite'
import { localTeams } from './server/vite-plugin.mjs'
import react from '@vitejs/plugin-react'
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/decisionactplancodex/' : '/',
  build: { outDir: mode === 'pages' ? 'dist-pages' : 'dist' },
  plugins: mode === 'pages' ? [react()] : [react(), localTeams()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
}))
