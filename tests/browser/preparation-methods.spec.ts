import { test, expect } from '@playwright/test'

test('hazırlık yöntemi istek üzerine açılır, kayıt güncel raporda ve indirmede görünür', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 800 })
  const requests: string[] = []
  page.on('request', (req) => requests.push(req.url()))
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  await page
    .getByRole('button', { name: '17. adımın kaydını aç' })
    .first()
    .click()
  const trigger = page.getByRole('button', {
    name: 'Gideri karşılayan sınırı hesapla',
    exact: true,
  })
  await expect(trigger).toBeVisible({ timeout: 3500 })
  await expect(page.getByLabel('Ne değişirse?', { exact: true })).toHaveCount(0)
  expect(requests.some((u) => /StudyForm-[^/]+\.js/.test(u))).toBe(false)
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Ne değişirse?', { exact: true })).toBeVisible()
  expect(requests.some((u) => /StudyForm-[^/]+\.js/.test(u))).toBe(true)
  await page
    .getByLabel('Ne değişirse?', { exact: true })
    .fill('Çekirdeğin fiyatı artarsa')
  await page
    .getByLabel('Yeni satış başına gider (TL)', { exact: true })
    .fill('40')
  await page
    .getByLabel('Bu dönemde beklenen satış adedi', { exact: true })
    .fill('45')
  const amount = page.getByLabel('Bu dönemde beklenen satış adedi', {
    exact: true,
  })
  const border = () =>
    amount.evaluate(
      (input) =>
        getComputedStyle(input.closest('.ant-input-number')!).borderTopColor,
    )
  await page.keyboard.press('Tab')
  const unfocused = await border()
  await page.keyboard.press('Shift+Tab')
  await expect(amount).toBeFocused()
  expect(await border()).toBe(unfocused)
  await expect
    .poll(() => amount.evaluate((el) => getComputedStyle(el).boxShadow))
    .toContain('inset')
  const result = page.getByRole('region', { name: 'Hesap sonucu' })
  await expect(result).toContainText('50 satış')
  await expect(result).toContainText('200 TL açık')
  for (const width of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 800 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    await expect(page.getByLabel('Ne değişirse?', { exact: true })).toHaveValue(
      'Çekirdeğin fiyatı artarsa',
    )
    if (width === 320 || width === 1440)
      await page
        .locator('.method-work')
        .screenshot({ path: info.outputPath('hazirlik-' + width + '.png') })
  }
  await page.getByRole('button', { name: 'Strateje devir raporunu aç' }).click()
  await expect(page.getByRole('article')).toContainText(
    'Çekirdeğin fiyatı artarsa',
  )
  await expect(page.getByRole('article')).toContainText('50 satış')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Markdown indir' }).click()
  const { readFile } = await import('node:fs/promises')
  expect(await readFile((await (await download).path())!, 'utf8')).toContain(
    '200 TL açık',
  )
  await page.reload()
  await page.goto('/#reports')
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  await expect(page.getByRole('article')).toContainText(
    'Çekirdeğin fiyatı artarsa',
  )
})

test('stratej beş yöntemin gözlemini, dayanağını ve iki yolun puanını okur', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await expect(
    page.getByRole('heading', { name: 'Koşullu hazır', exact: true }),
  ).toBeVisible()
  const report = async () => {
    await page.goto('/#reports')
    await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  }
  async function step(id: string, name: string) {
    await report()
    await page
      .getByRole('button', { name: id + '. adımın kaydını aç', exact: true })
      .first()
      .click()
    const trigger = page.getByRole('button', { name, exact: true })
    await expect(
      page.getByRole('region', { name: 'Hazırlık yöntemleri' }),
    ).toBeVisible()
    if (!(await trigger.count()))
      await page
        .getByRole('button', { name: 'Bu adıma uygun diğer yöntemler' })
        .click()
    await trigger.click()
  }
  const field = (label: string) => page.getByLabel(label, { exact: true })
  async function pick(label: string, option: string) {
    await field(label).click()
    const list = await field(label).getAttribute('aria-controls')
    await page
      .locator('[id=' + JSON.stringify(list) + ']')
      .getByRole('option', { name: new RegExp(option) })
      .click()
  }
  await step('05', 'Sorunun nedenini araştır')
  await field('İlk olası neden').fill('Durakta sıra var')
  await field('Diğer olası neden').fill('Kafe uzakta')
  await field('İki nedeni ayıran gözlem').fill('Üç kişi sıradan ayrıldı')
  await pick('Gözlemin kaynağı', 'Sabah görüşme çizelgesi')
  await page.getByRole('button', { name: 'Yeni kayıt aç', exact: true }).click()
  await expect(field('İlk olası neden')).toBeFocused()
  await field('İlk olası neden').fill('İkinci gözlem kaydı')
  await step('08', 'Alım kararını incele')
  await field('Bütçeyi kim onaylıyor?').fill('Şube müdürü')
  await field('Hangi kişi gerçekte ne yaptı?').fill('Müdür bütçe ayırdı')
  await step('09', 'İşin değerini ve giderini incele')
  await field('İşin adı').fill('Durakta teslim')
  await field('İşin gideri ve dönemi').fill('Günde 120 TL')
  await step('11', 'İki yolu aynı koşullarda karşılaştır')
  await pick('Birinci yol', 'Evde hazırlama')
  await pick('İkinci yol', 'Sabah kahve arabası')
  await field('Sayılan ortak davranış').fill('Sipariş')
  await field('İki grup için ortak koşullar ve süre').fill(
    'İki sabah aynı saat',
  )
  await field('Ölçülerin belirlendiği gün').fill('2026-10-01')
  await field('Denemenin bittiği gün').fill('2026-10-03')
  for (const [label, value] of [
    ['Birinci yolda denemeye katılan kişi', '20'],
    ['Birinci yolda davranışı gösteren kişi', '4'],
    ['İkinci yolda denemeye katılan kişi', '20'],
    ['İkinci yolda davranışı gösteren kişi', '8'],
  ])
    await field(label).fill(value)
  await page.getByRole('button', { name: 'Ölçü ekle' }).click()
  for (const [label, value] of [
    ['Ölçünün adı', 'Teslim hızı'],
    ['Önem ağırlığı', '3'],
    ['Birinci yolun puanı', '2'],
    ['İkinci yolun puanı', '4'],
  ])
    await field(label).fill(value)
  await expect(
    page.getByRole('region', { name: 'Hesap sonucu' }),
  ).toContainText('Sabah kahve arabası 4')
  await step('10', 'Denemeden ne öğrendik?')
  await field('Denemeden önce ne bekliyordunuz?').fill('Öğle talebi')
  await field('Denemede ne gördünüz?').fill('Sabah siparişleri')
  await field('Hangi varsayımı korudunuz veya değiştirdiniz?').fill(
    'Öğle talebi belirsiz',
  )
  await report()
  const article = page.getByRole('article')
  for (const result of [
    'Üç kişi sıradan ayrıldı',
    'İkinci gözlem kaydı',
    'Müdür bütçe ayırdı',
    'Durakta teslim',
    'İki sabah aynı saat',
    'Teslim hızı',
    'Öğle talebi belirsiz',
    '%20',
    '%40',
  ])
    await expect(article).toContainText(result)
  await expect(
    article.getByText(/Gözlemin kaynağı: Sabah görüşme çizelgesi/),
  ).toBeAttached()
})
