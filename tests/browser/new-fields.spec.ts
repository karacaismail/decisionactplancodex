import { expect, test } from '@playwright/test'

test('Yeni alan etiketi yalnız ilgili alanda görünür ve hareket durdurulabilir', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Yeni plan', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Plan adı', exact: true })
    .fill('Etiket denemesi')
  await page.getByRole('button', { name: 'Planı oluştur' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  const field = page.locator('label[for="field-planningContext"]')
  await field.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('alan-320.png') })
  const badge = field.getByText('new', { exact: true })
  await expect(badge).toBeVisible({ timeout: 2000 })
  await expect(
    page.locator('label[for="field-description"]').getByText('new'),
  ).toHaveCount(0)
  const dot = badge.locator('.new-field-dot')
  await expect(dot).toHaveCSS('animation-name', 'new-field-pulse')
  await expect(dot).toHaveCSS('animation-iteration-count', 'infinite')
  await expect(badge).toHaveCSS('opacity', '1')
  await page
    .getByRole('button', { name: 'Yeni alanların hareketini durdur' })
    .click()
  await expect(dot).toHaveCSS('animation-name', 'none')
  await page.reload()
  await expect(dot).toHaveCSS('animation-name', 'none')
  await page
    .getByRole('button', { name: 'Yeni alanların hareketini başlat' })
    .click()
  await expect(dot).toHaveCSS('animation-name', 'new-field-pulse')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(dot).toHaveCSS('animation-name', 'none')
  await expect(badge).toBeVisible()
  for (const [width, height] of [
    [320, 740],
    [360, 740],
    [375, 812],
    [390, 844],
    [844, 390],
    [820, 1100],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    if (width === 1440) {
      await field.scrollIntoViewIfNeeded()
      await page.screenshot({ path: info.outputPath('alan-1440.png') })
    }
    expect(
      await badge.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(14)
  }
  await page.setViewportSize({ width: 320, height: 740 })
  await page.getByRole('button', { name: 'Koyu temaya geç' }).click()
  await field.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('alan-koyu-320.png') })
})
