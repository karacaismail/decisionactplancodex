import { test, expect } from '@playwright/test'

test('Modül planı boş çalışma alanında açılır ve özelliğin sahibini gösterir', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 760 })
  const requests: string[] = []
  page.on('request', (req) => requests.push(req.url()))
  await page.goto('/')
  await page.getByRole('button', { name: 'Menüyü aç' }).click()
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Modül planı' })
    .click({ timeout: 3000 })
  await expect(
    page.getByRole('heading', { name: 'Modül planı', exact: true }),
  ).toBeVisible()
  const rows = page.locator('details[data-module]')
  await expect(rows).toHaveCount(6)
  expect(requests.some((u) => u.includes('ModuleGuide-'))).toBe(false)
  const search = page.getByRole('searchbox', { name: 'Modül veya özellik ara' })
  await search.fill('SQLite')
  await expect(rows).toHaveCount(1)
  await rows.locator('summary').click()
  await expect(
    rows.getByText('Mobilde kesinti kaydı', { exact: true }),
  ).toBeVisible()
  await search.fill('bulunmayan özellik')
  await expect(page.getByText('Eşleşen özellik bulunamadı.')).toBeVisible()
  await page.getByRole('button', { name: 'Filtreleri temizle' }).click()
  await page.getByText('Koşullu', { exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Koşullu' })).toBeChecked()
  await expect(rows).toHaveCount(3)
  await page.getByRole('button', { name: 'Mimari rehberi aç' }).click()
  await page
    .getByRole('button', { name: 'Geçiş kararını kim kaydeder?' })
    .click()
  await expect(
    page.getByRole('region', { name: 'Rehber yanıtı' }),
  ).toContainText('Karar')
  await page.getByRole('button', { name: 'Karar modülünü göster' }).click()
  await expect(page.locator('details[data-module="karar"]')).toHaveAttribute(
    'open',
    '',
  )
  await expect(page.getByText('Geçiş kararı', { exact: true })).toBeVisible()
  for (const width of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 900 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(width)
  }
  await expect(
    page
      .getByRole('navigation', { name: 'Ana menü' })
      .getByRole('button', { name: 'Modül planı' }),
  ).toHaveAttribute('aria-current', 'page')
  const align = async () => {
    await page.locator('#module-karar').evaluate(async (el) => {
      await document.fonts.ready
      el.scrollIntoView({ block: 'start', behavior: 'instant' })
      await new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      )
    })
  }
  await align()
  await page.screenshot({
    path: info.outputPath('modul-genis.png'),
    animations: 'disabled',
  })
  await page.setViewportSize({ width: 320, height: 760 })
  await expect(page.getByRole('button', { name: 'Menüyü aç' })).toBeVisible()
  await align()
  await page.screenshot({
    path: info.outputPath('modul-320.png'),
    animations: 'disabled',
  })
  expect(requests.some((u) => u.includes('ModuleGuide-'))).toBe(true)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Modül planı', exact: true }),
  ).toBeVisible()
})

test('Kategori, klavye ve rehber kurum oturumunda plan açmadan çalışır', async ({
  page,
  baseURL,
}) => {
  const auth = await page.request.post('/api/team/create', {
    headers: { origin: new URL(baseURL!).origin },
    data: {
      workspace: 'Modül test kurumu',
      name: 'Yönetici',
      password: crypto.randomUUID(),
    },
  })
  expect(auth.ok()).toBe(true)
  const calls: string[] = []
  const errors: string[] = []
  page.on('request', (r) => {
    const path = new URL(r.url()).pathname
    if (r.method() !== 'GET' || path === '/api/team/list') calls.push(path)
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#moduller')
  await expect(
    page.getByText(/Modül test kurumu.*Yönetici/).first(),
  ).toBeVisible()
  const category = page.getByRole('combobox', { name: 'Modül kategorisi' })
  await category.click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText('Kurum yönetimi', { exact: true })
    .click()
  await expect(page.locator('details[data-module]')).toHaveCount(2)
  const disclosure = page.locator('#module-erisim')
  await disclosure.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(disclosure).toBeFocused()
  await expect(disclosure).not.toHaveCSS('box-shadow', 'none')
  await page.keyboard.press('Enter')
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Space')
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('button', { name: 'Mimari rehberi aç' }).click()
  await page
    .getByRole('button', { name: 'Kesintide kayıt ne olur?' })
    .press('Enter')
  await expect(
    page.getByRole('region', { name: 'Rehber yanıtı' }),
  ).toContainText('SQLite')
  await page.getByRole('button', { name: 'Eşitleme modülünü göster' }).click()
  await expect(page.locator('#module-esitleme')).toBeFocused()
  await expect(page.locator('details[data-module]')).toHaveCount(6)
  expect(calls).toEqual([])
  const listed = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/api/team/list' && r.ok(),
  )
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Karar panosu' })
    .click()
  await listed
  expect(errors).toEqual([])
})

test('Katalog kişisel örnek oluşturmaz, plan ekranına dönünce dosyalar açılır', async ({
  page,
}) => {
  await page.goto('/#moduller')
  await expect(page.locator('details[data-module]')).toHaveCount(6)
  const dbNames = () =>
    page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name))
  expect(await dbNames()).not.toContain('karar-atlasi')
  await page.goto('/#dashboard')
  await expect.poll(dbNames).toContain('karar-atlasi')
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }).first(),
  ).toBeVisible()
})
