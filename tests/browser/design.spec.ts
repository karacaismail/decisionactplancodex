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

test('bölüm bul klavyeyle çalışır, yalnız uygun görsel yüklenir', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Kararı incele', exact: true }),
  ).toBeVisible()
  await page
    .locator('.atlas-relief img')
    .evaluate(async (el: HTMLImageElement) => el.decode())
  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((r) => r.name)
      .join(' '),
  )
  expect(resources).toContain('atlas-relief-small')
  expect(resources).not.toContain('atlas-relief-wide')
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
  ).toHaveCSS('color', 'rgb(16, 45, 40)')
  await page
    .getByRole('navigation', { name: 'Rapordaki bölümler' })
    .getByRole('button', { name: 'Kaynaklar' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Kaynaklar', exact: true }),
  ).toBeFocused()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.report-index')).not.toBeVisible()
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
