import { test, expect } from '@playwright/test'

test('ilk para alanı telefonda görünür ve masaüstü belge düzeninde yer alır', async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 740],
    [1440, 960],
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto('/#editor')
    const field = page.getByRole('spinbutton', {
      name: 'Ödeme günü kasadaki para',
    })
    await expect(field).toBeVisible()
    const rect = await field.boundingBox()
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(height)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
  }
})
test('karar rotası veri tablosunda sekiz kararı gösterir', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')
  const table = page.getByRole('table', { name: 'Karar rotası' })
  await expect(table).toBeVisible()
  await expect(table.getByRole('row')).toHaveCount(9)
  await table.getByRole('button', { name: /Strateji ve kaynak/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Plan adımları', level: 1 }),
  ).toBeVisible()
})

test('bölüm bul klavyeyle çalışır, pano yalnız gerekli kaynakları yükler', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Kararı incele', exact: true }),
  ).toBeVisible()
  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((r) => r.name)
      .join(' '),
  )
  expect(resources).toContain('SmallNav-')
  expect(resources).not.toMatch(/WideRail-|atlas-relief|Insights-/)
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.keyboard.press('Control+k')
  await page.getByRole('textbox', { name: 'Bölüm adı' }).fill('Rapor')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Raporlar' })
    .focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Raporlar', level: 1 }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Koyu temaya geç' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(
    page.getByRole('button', { name: 'Yeni plan', exact: true }),
  ).toHaveCSS('color', 'rgb(27, 32, 64)')
  await page
    .getByRole('navigation', { name: 'Rapordaki bölümler' })
    .getByRole('button', { name: 'Kaynaklar' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Kaynaklar', exact: true }),
  ).toBeFocused()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.report-index')).not.toBeVisible()
  await expect(page.locator('.report-balances')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
    { timeout: 1200 },
  )
  await expect(page.locator('.report-body h2')).toHaveCSS(
    'color',
    'rgb(16, 28, 24)',
  )
})

test('telefon formunun klavye sırası ve rapor içindekiler menüsü', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#editor')
  await page.getByRole('button', { name: 'Karar haritasını aç' }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('combobox', { name: 'Plan adımı' })).toBeFocused()
  await page.goto('/#reports')
  const picker = page.getByRole('combobox', { name: 'Raporda bölüme git' })
  await expect(picker).toBeVisible()
  await picker.click()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('.report-body h3:focus')).toHaveCount(1)
})

test('karar panosunda kanıt dağılımı ve karar süzgeci aynı plana bağlıdır', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Kanıt dağılımı', exact: true })
    .click({ timeout: 3500 })
  await page
    .getByRole('button', { name: /^4\. Talep ve taahhüt.*1 kanıt/ })
    .click()
  await expect(
    page.getByRole('region', { name: 'Seçili karar' }),
  ).toContainText('Talep ve taahhüt')
  await page
    .getByRole('button', { name: 'Karara git: Talep ve taahhüt' })
    .click({ timeout: 1500 })
  await expect(
    page.getByRole('heading', { name: 'Talep ve taahhüt', exact: true }),
  ).toBeVisible()
  await page.goto('/')
  await page.getByRole('button', { name: 'Onaylananları göster' }).click()
  await expect(
    page.getByRole('table', { name: 'Karar rotası' }).getByRole('row'),
  ).toHaveCount(5)
})

test('geniş ekranda adım dizini çalışır ve üst çubuk yüksek kontrastlıdır', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/#editor')
  const index = page.getByRole('navigation', { name: 'Kararın adımları' })
  await expect(index).toBeVisible()
  await index.getByRole('button', { name: /17. Risk ve önlem/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Risk ve önlem', exact: true }),
  ).toBeFocused()
  await page.setViewportSize({ width: 320, height: 740 })
  await expect(index).not.toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Plan adımı' })).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 960 })
  await expect(page.locator('.topbar')).toHaveCSS(
    'background-color',
    'rgb(21, 26, 48)',
  )
})

test('telefonda güncel karar özeti göstergelerden önce gelir ve planın ilerlemesini gösterir', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/')
  const decision = page.getByRole('region', { name: 'Seçili karar' })
  const action = decision.getByRole('button', { name: 'Kararı incele' })
  await expect(action).toBeVisible()
  const box = await action.boundingBox()
  const metrics = await page
    .getByRole('region', { name: 'Plan göstergeleri' })
    .boundingBox()
  expect(box!.y + box!.height).toBeLessThan(metrics!.y)
  expect(box!.y + box!.height).toBeLessThan(640)
  await expect(
    decision.getByRole('progressbar', { name: 'Tamamlanan plan adımları' }),
  ).toHaveAttribute('aria-valuenow', '16')
  await action.click()
  await expect(
    page.getByRole('heading', { name: 'Para ve iş planı', exact: true }),
  ).toBeVisible()
})

test('karar dosyası ilk eksik soruya götürür', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#editor')
  await page
    .getByRole('button', { name: 'İlk eksik adımı aç' })
    .click({ timeout: 2500 })
  await expect(
    page.getByRole('heading', { name: 'Risk ve önlem', exact: true }),
  ).toBeFocused()
})
