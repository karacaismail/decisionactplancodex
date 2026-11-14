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
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  await expect(page.locator('.dossier-intro h2')).toHaveText(
    'Sabah hangi satış yolu çalışır?',
  )
  await expect(page.getByRole('article')).toContainText(
    'İzin verilen konu: Seçilen yol',
  )
  await page.getByText('Yolları yan yana incele', { exact: true }).click()
  await expect(page.locator('.dossier-grid')).toContainText(
    'Sabah kahve arabası',
  )
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
  await expect(
    page.getByRole('heading', { name: 'Koşullu hazır', exact: true }),
  ).toBeVisible()
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

test('stratej telefonda aday yolları inceler ve devir raporunu indirir', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await expect(
    page.getByRole('heading', { name: 'Koşullu hazır', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Strateje devir raporunu aç' })
    .click({ timeout: 4000 })
  const article = page.getByRole('article')
  await expect(article).toContainText('14 teklif')
  await expect(article).toContainText('Sabah kahve arabası')
  await expect(article).toContainText('0 ödeme')
  await expect(article).toContainText('Evde hazırlama')
  const question = page.locator('.dossier-intro h2')
  await expect(question).toContainText('Durakta kahve')
  const rect = await question.boundingBox()
  expect(rect!.y + rect!.height).toBeLessThan(740)
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('article')).toBeVisible()
  await expect(page.locator('.report-types')).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
  const transfer = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Markdown indir' }).click()
  expect((await transfer).suggestedFilename()).toMatch(/\.md$/)
  for (const width of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 820 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    if ([320, 1440].includes(width))
      await page.screenshot({
        path: info.outputPath('strateje-devir-' + width + '.png'),
      })
  }
})

test('kullanıcı 17. adımda senaryo yazar, taslak ve kaynak aynı kaydı açar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  await page
    .getByRole('button', { name: '17. adımın kaydını aç' })
    .first()
    .click()
  await page
    .getByText('Strateje devir için açık sorular ve dayanaklar', {
      exact: true,
    })
    .click()
  await page
    .getByLabel('Stratejin karar sorusu', { exact: true })
    .fill('Hangi sabah yolunu deneyelim?')
  await page.getByLabel('Birinci belirsizlik').fill('Talep')
  await page.getByLabel('İkinci bağımsız belirsizlik').fill('Kira')
  await page.getByText('Talep düşük, Kira düşük', { exact: true }).click()
  await page
    .getByLabel('Sabah kahve arabası için dönemde satış adedi')
    .first()
    .fill('20')
  await expect(
    page.getByText(/Dönem sonucu:.*1000 TL açık/).first(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  await expect(page.locator('.dossier-intro h2')).toHaveText(
    'Hangi sabah yolunu deneyelim?',
  )
  await expect(page.getByRole('article')).toContainText('1000 TL açık')
})
