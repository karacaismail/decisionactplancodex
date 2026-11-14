import { test, expect } from '@playwright/test'

test('telefonda koşullu karar, kayıt, kapsam ve tarihli belge', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#gecis')
  await expect(
    page.getByRole('heading', {
      name: 'Planlamaya geçiş',
      exact: true,
      level: 1,
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await expect(
    page.getByRole('heading', { name: 'Koşullu hazır', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Henüz karar kaydedilmedi.')).toBeVisible()
  await page
    .getByLabel('Kararın gerekçesi')
    .fill('Üç kanıt var. Satış yolu denenebilir.')
  await page.getByLabel('Açık soru').fill('Sabah hangi satış yolu çalışır?')
  await page.getByLabel('İşi kim yapacak?').fill('Ayşe')
  const day = new Date()
  day.setDate(day.getDate() + 3)
  await page.getByLabel('Son tarih').fill(day.toISOString().slice(0, 10))
  await page.getByLabel('Kapanış kanıtı').fill('Kanal denemesi')
  await page.getByLabel('Dayanakları inceledim').check()
  await page.getByRole('button', { name: 'Geçiş kararını kaydet' }).click()
  await expect(
    page.getByText('Kayıtlı karar: Koşullu hazır', { exact: true }),
  ).toBeVisible()
  await page.goto('/#dashboard')
  await page
    .getByRole('button', { name: 'Strateji çalışmasını aç', exact: true })
    .click()
  await expect(page.getByLabel('Seçilen yol', { exact: true })).toBeEnabled()
  await page.goto('/#gecis')
  await page.reload()
  await page.getByRole('button', { name: 'İzin verilen çalışmayı aç' }).click()
  await expect(page.getByLabel('Seçilen yol', { exact: true })).toBeEnabled()
  await expect(
    page.getByLabel('Vazgeçilen seçenek', { exact: true }),
  ).toBeDisabled()
  await page.goto('/#reports')
  await page.getByRole('tab', { name: 'Temel belgesi' }).click()
  await expect(
    page.getByRole('heading', { name: 'Müşteri hangi somut adımı attı?' }),
  ).toBeVisible()
  if (info.project.name === 'Chrome') {
    await page.emulateMedia({ media: 'print' })
    await page.pdf({
      path: info.outputPath('temel.pdf'),
      format: 'A4',
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    })
    await page.emulateMedia({ media: 'screen' })
  }
  await page.goto('/#gecis')
  await expect(
    page.getByText('Kayıtlı karar: Koşullu hazır', { exact: true }),
  ).toBeVisible()
  for (const width of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 850 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    if (width === 1440)
      await expect(
        page.getByRole('navigation', { name: 'Ana menü' }),
      ).toBeVisible()
    if (width === 320 || width === 1440)
      await page.screenshot({
        path: info.outputPath('gecis-' + width + '.png'),
      })
  }
})

test('kritik kanıt silinince strateji kapanır ve önceki belge korunur', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 950 })
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await page.getByLabel('Kararın gerekçesi').fill('Satış yolunu incele.')
  await page.getByLabel('Açık soru').fill('Hangi durak?')
  await page.getByLabel('İşi kim yapacak?').fill('Ayşe')
  const date = new Date()
  date.setDate(date.getDate() + 1)
  await page.getByLabel('Son tarih').fill(date.toISOString().slice(0, 10))
  await page.getByLabel('Kapanış kanıtı').fill('Deneme sonucu')
  await page.getByLabel('Dayanakları inceledim').check()
  await page.getByRole('button', { name: 'Geçiş kararını kaydet' }).click()
  await page.getByRole('button', { name: 'İzin verilen çalışmayı aç' }).click()
  await page.goto('/#evidence')
  await page
    .getByRole('button', { name: /yedi yazılı ön sipariş kaydını sil/ })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Sil', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: /yedi yazılı ön sipariş kaydını sil/ }),
  ).toHaveCount(0)
  await page.goto('/#editor')
  await expect(page.getByLabel('Seçilen yol', { exact: true })).toBeDisabled()
  await page.goto('/#gecis')
  await expect(
    page.getByRole('heading', { name: 'Henüz hazır değil' }),
  ).toBeVisible()
  await page.getByRole('tab', { name: 'Geçmiş kararlar' }).click()
  await page.locator('summary').filter({ hasText: 'Koşullu hazır' }).click()
  await page.getByRole('button', { name: 'Karar günündeki belgeyi aç' }).click()
  await expect(page.getByRole('article')).toContainText(
    'yedi yazılı ön sipariş',
  )
  await expect(page.getByRole('article')).toContainText('Satış yolunu incele.')
})
