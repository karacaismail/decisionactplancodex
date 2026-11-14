import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
test('Stratej telefonda engeli ve dayanağı kaydeder, güncel raporu indirir', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  await page
    .getByRole('button', { name: '17. adımın kaydını aç' })
    .first()
    .click()
  const trigger = page.getByRole('button', {
    name: 'Asıl engeli incele',
    exact: true,
  })
  await expect(page.getByLabel('Girişimin önündeki asıl engel')).toHaveCount(0)
  await trigger.focus()
  await page.keyboard.press('Enter')
  await page
    .getByLabel('Girişimin önündeki asıl engel')
    .fill('Sabah satışındaki belirsizlik')
  await page
    .getByLabel('Hangi bilgi kararı değiştirir?')
    .fill('Saat sekizde kaç yolcu sipariş veriyor?')
  const proof = page.getByRole('combobox', {
    name: 'Destekleyen kanıt',
    exact: true,
  })
  await proof.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('.method-form')).toContainText(
    /Ayşe’nin bütçe|Sabah görüşme/,
  )
  for (const width of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 800 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    expect(
      await page
        .getByLabel('Girişimin önündeki asıl engel')
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(14)
  }
  await page.setViewportSize({ width: 320, height: 800 })
  await page
    .locator('.method-form')
    .screenshot({ path: info.outputPath('engel-320.png') })
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  const article = page.getByRole('article')
  await expect(article).toContainText('Stratejin önce inceleyeceği konu')
  await expect(article).toContainText('Sabah satışındaki belirsizlik')
  const event = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Markdown indir' }).click()
  expect(await readFile((await (await event).path())!, 'utf8')).toContain(
    'Saat sekizde kaç yolcu sipariş veriyor?',
  )
  await page.reload()
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  await expect(article).toContainText('Sabah satışındaki belirsizlik')
})
test('Kitap yardımı seçilince iner ve klavyeyle kapanır', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 800 })
  const assets: string[] = []
  page.on('request', (r) => assets.push(r.url()))
  await page.goto('/#methods')
  await page.getByRole('textbox', { name: 'Yöntem ara' }).fill('VRIO')
  const button = page.getByRole('button', { name: 'VRIO Analizi' })
  await expect(button).toBeVisible()
  expect(assets.some((url) => /MethodHelp-.*\.js/.test(url))).toBe(false)
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Nasıl uygulanır?' }),
  ).toBeVisible()
  expect(assets.some((url) => /MethodHelp-.*\.js/.test(url))).toBe(true)
  await expect(page.getByRole('heading', { name: 'İpucu' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  )
  await page
    .locator('.book-help')
    .screenshot({ path: info.outputPath('kitap-320.png') })
  await page.keyboard.press('Escape')
  await expect(button).toBeFocused()
  await expect(button).toHaveAttribute('aria-expanded', 'false')
})

test('Güç süzgeci ve durum özeti aynı kaydı 320 pikselde gösterir', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 810 })
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  await page
    .getByRole('button', { name: '12. adımın kaydını aç', exact: true })
    .first()
    .click()
  await page
    .getByRole('button', { name: 'Güçlü yönleri sına', exact: true })
    .click()
  const form = page.locator('.method-form')
  await expect(form).toContainText('Eşitlik')
  await page.getByRole('button', { name: 'Yeni kayıt aç', exact: true }).click()
  await page
    .getByLabel('Gücün adı', { exact: true })
    .fill('Günün ilk servis saati')
  async function pick(label: string, value: string) {
    const f = page.getByRole('combobox', { name: label, exact: true })
    await f.click()
    const id = await f.getAttribute('aria-controls')
    await page
      .locator('[id=' + JSON.stringify(id) + ']')
      .getByRole('option', { name: value, exact: true })
      .click()
  }
  await pick('Bu güç müşteriye yarar sağlıyor mu?', 'Evet')
  await pick('Bu güç rakiplerin çoğunda eksik mi?', 'Hayır')
  await expect(form).toContainText('Eşitlik')
  const skip = page.locator('a.skip')
  expect(
    await skip.evaluate(
      (x) =>
        x !== document.activeElement && getComputedStyle(x).clipPath !== 'none',
    ),
  ).toBe(true)
  await page.goto('/#reports')
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  await expect(page.getByRole('article')).toContainText(
    'Günün ilk servis saati (Eşitlik.',
  )
  await page
    .getByRole('button', { name: '17. adımın kaydını aç', exact: true })
    .first()
    .click()
  const stepPicker = page.getByRole('combobox', {
    name: 'Plan adımı',
    exact: true,
  })
  await stepPicker.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('#active-question')).toHaveText('Seçilen strateji')
  const situation = page.getByRole('region', { name: 'Durum özeti' })
  await expect(situation).toContainText('Günün ilk servis saati')
  await expect(page.getByLabel('Seçilen yol', { exact: true })).toBeDisabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  )
  await situation.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('durum-320.png') })
  await situation
    .getByRole('button', { name: '12. adımdaki kaynağı aç' })
    .first()
    .click()
  await expect(page.locator('#active-question')).toHaveText('Yapılabilirlik')
})
