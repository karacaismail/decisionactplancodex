import { localApi } from './local.mjs'
export function localTeams() {
  function install(server) {
    const api = localApi()
    server.middlewares.use(api)
    server.httpServer?.once('close', api.close)
  }
  return {
    name: 'atlas-local-teams',
    configureServer: install,
    configurePreviewServer: install,
  }
}
