import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { once } from 'node:events'
import { chromium, expect } from '@playwright/test'
import sirv from 'sirv'

test('GitHub Pages üzerinde kişisel plan açılır ve strateje devir raporu iner', async (t) => {
  const prefix = '/decisionactplancodex/'
  let address = process.env.ATLAS_PAGES_URL
  if (!address) {
    const serve = sirv(process.env.ATLAS_PAGES_DIR || 'dist-pages')
    const server = createServer((req, res) => {
      if (!req.url.startsWith(prefix)) return res.writeHead(404).end()
      req.url = req.url.slice(prefix.length - 1)
      serve(req, res)
    })
    server.listen(0, '127.0.0.1')
    t.after(() => server.close())
    await once(server, 'listening')
    address = 'http://127.0.0.1:' + server.address().port + prefix
  }
  const browser = await chromium.launch({ channel: 'chrome' })
  t.after(() => browser.close())
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol === 'blob:' || url.protocol === 'data:') return
    if (
      url.origin !== new URL(address).origin ||
      !url.pathname.startsWith(prefix) ||
      url.pathname.includes('/api/')
    )
      errors.push(url.pathname)
  })
  page.on('response', (response) => {
    if (!response.ok() && response.status() >= 400)
      errors.push(response.status() + ' ' + response.url())
  })
  const home = await page.goto(address + '#gecis')
  assert.equal(home.status(), 200)
  assert.deepEqual(errors, [])
  await page
    .getByRole('button', { name: 'Kafe örneğini aç' })
    .click({ timeout: 20000 })
  await expect(
    page.getByRole('heading', { name: 'Koşullu hazır', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  await expect(page.locator('.dossier-intro')).toContainText('Durakta kahve')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Markdown indir' }).click()
  const file = await download
  assert.match(file.suggestedFilename(), /\.md$/)
  const report = await readFile(await file.path(), 'utf8')
  assert.match(report, /Araştırılacak konular/)
  assert.match(report, /Sabah kahve arabası/)
  assert.match(report, /Bu denemede kanıtla doğrulanan müşteri sayısı: 7/)
  await page.goto(address + '#evidence')
  await page.getByRole('button', { name: 'Bunu beklemiyorduk' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Ne oldu?').fill('Durak boşaldı.')
  await dialog.getByLabel('Nerede gözlediniz?').fill('Kuzey çıkışı')
  await dialog.getByLabel('Gözlemin kaynağı').fill('Görevli')
  await dialog.getByRole('button', { name: 'Gözlemi kaydet' }).click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  await page.goto(address + '#reports')
  await page.reload()
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  await expect(page.locator('.dossier-intro')).toContainText('Durakta kahve')
  await expect(page.getByRole('article')).toContainText('Kuzey çıkışı')
  const lifecycleLoaded = () =>
    page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .some((r) => r.name.includes('/Lifecycle-') && r.name.includes('.js')),
    )
  assert.equal(await lifecycleLoaded(), false)
  await page.goto(address + '#asamalar?phase=5')
  await expect(
    page.getByRole('heading', {
      name: 'Beklenenle gerçekleşeni karşılaştırma',
    }),
  ).toBeVisible()
  assert.equal(await lifecycleLoaded(), true)
  await expect(
    page.getByRole('button', { name: 'Sonucu değerlendir', exact: true }),
  ).toHaveCount(0)
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto(address + '#team')
  await expect(
    page
      .getByRole('navigation', { name: 'Ana menü' })
      .getByRole('button', { name: 'Karar panosu', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  assert.equal(
    await page
      .getByRole('button', { name: 'Kurum alanı', exact: true })
      .count(),
    0,
  )
  assert.deepEqual(errors, [])
})
