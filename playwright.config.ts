import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  timeout: 40000,
  fullyParallel: true,
  workers: 3,
  use: {
    baseURL: 'http://127.0.0.1:4177',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'Chrome', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'WebKit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4177 --strictPort',
    url: 'http://127.0.0.1:4177',
    reuseExistingServer: true,
  },
})
