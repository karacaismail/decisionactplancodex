import { defineConfig } from '@playwright/test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mkdtempSync } from 'node:fs'
const testPort = 4187
const baseURL = 'http://127.0.0.1:' + testPort
export default defineConfig({
  testDir: './tests/browser',
  timeout: 40000,
  fullyParallel: true,
  workers: 3,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'Chrome', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'WebKit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm start',
    env: {
      ATLAS_PORT: String(testPort),
      ATLAS_DATA_DIR: mkdtempSync(join(tmpdir(), 'atlas-qa-')),
    },
    url: baseURL,
    reuseExistingServer: false,
  },
})
