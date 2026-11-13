import { mkdirSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { teamApi } from './team.mjs'
export function localApi() {
  const dir =
    process.env.ATLAS_DATA_DIR ||
    join(homedir(), 'Library', 'Application Support', 'Karar Atlasi')
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  const file = join(dir, 'workspace.sqlite')
  const api = teamApi(file)
  chmodSync(file, 0o600)
  return api
}
