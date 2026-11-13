import { createServer } from 'node:http'
import { accessSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sirv from 'sirv'
import { localApi } from './local.mjs'
const dir = fileURLToPath(new URL('../dist/', import.meta.url))
accessSync(new URL('../dist/index.html', import.meta.url))
const api = localApi()
const assets = sirv(dir, {
  etag: true,
  setHeaders(res, path) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'same-origin')
    res.setHeader(
      'Cache-Control',
      path.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    )
  },
})
const port = Number(process.env.ATLAS_PORT || 4177)
const server = createServer((req, res) => api(req, res, () => assets(req, res)))
server.listen(port, '127.0.0.1', () =>
  console.log('Karar Atlası http://127.0.0.1:' + port + '/'),
)
server.once('close', api.close)
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => server.close())
