import { test, expect, type Page } from '@playwright/test'

async function go(page: Page, name: string) {
  const open = page.getByRole('button', { name: 'Menüyü aç' })
  if (await open.isVisible()) await open.click()
  await page
    .getByRole('navigation', { name: 'Ana menü' })
    .getByRole('button', { name, exact: true })
    .click()
}
async function create(page: Page, name: string) {
  await page.getByRole('button', { name: 'Yeni plan', exact: true }).click()
  await page.getByRole('textbox', { name: 'Plan adı', exact: true }).fill(name)
  await page.getByRole('button', { name: 'Planı oluştur' }).click()
  await expect(
    page.getByRole('heading', { name: 'Plan adımları', level: 1 }),
  ).toBeVisible()
}
test('320 pikselden başlayan görünüm ve gerçek üretim istekleri', async ({
  page,
}, info) => {
  for (const [w, h] of [
    [320, 720],
    [360, 780],
    [375, 812],
    [390, 844],
    [844, 390],
    [820, 1100],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'Kararı incele', exact: true }),
    ).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const data = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      resources: performance
        .getEntriesByType('resource')
        .map((r) => r.name.split('/').pop()),
      small: [...document.querySelectorAll('main *,header *,nav *')]
        .filter(
          (e) =>
            e instanceof HTMLElement &&
            e.getClientRects().length &&
            [...e.childNodes].some(
              (n) => n.nodeType === 3 && n.textContent?.trim(),
            ) &&
            parseFloat(getComputedStyle(e).fontSize) < 14,
        )
        .map((e) => e.tagName),
    }))
    expect(data.width).toBe(w)
    expect(data.small).toEqual([])
    expect(data.resources.join(' ')).toContain(
      w >= 1024 ? 'WideRail' : 'SmallNav',
    )
    expect(data.resources.join(' ')).not.toMatch(
      w >= 1024 ? /SmallNav/ : /WideRail/,
    )
    expect(data.resources.join(' ')).not.toMatch(
      /Insights-|Methods-|Reports-|Editor-/,
    )
    if (w === 320 || w === 1440) {
      await page.screenshot({
        path: info.outputPath('dashboard-' + w + '.png'),
      })
      await info.attach('network-' + w, {
        body: JSON.stringify(data),
        contentType: 'application/json',
      })
    }
  }
})
test('telefon formu, kayıt devamı, kanıt ve iki ayrı rapor', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Kararı incele', exact: true }),
  ).toBeVisible()
  await create(page, 'Semt kütüphanesi')
  await page
    .getByRole('radio', { name: 'Ücretsiz hizmet', exact: true })
    .check()
  await page
    .getByLabel('İşi kendi sözlerinizle anlatın', { exact: true })
    .fill('Komşular kitap ödünç alıyor.')
  await page.getByRole('button', { name: 'Sonraki adım' }).click()
  await expect(
    page.getByRole('heading', { name: 'Amaç ve gelecek' }),
  ).toBeFocused()
  await page
    .getByLabel('Beklenen sonuç', { exact: true })
    .fill('Daha çok kitap okunsun.')
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Beklenen sonuç', { exact: true })).toHaveValue(
    'Daha çok kitap okunsun.',
  )
  await go(page, 'Kanıt defteri')
  await page.getByRole('button', { name: 'Kanıt ekle', exact: true }).click()
  await page.getByLabel('Ne gözlediniz?').fill('Kitap teslim alındı.')
  await page
    .getByRole('textbox', { name: 'Kaynak', exact: true })
    .fill('Teslim defteri')
  await page.getByRole('button', { name: 'Kanıtı kaydet' }).click()
  await expect(
    page.getByRole('heading', { name: 'Kitap teslim alındı.' }),
  ).toBeVisible()
  await go(page, 'Raporlar')
  await expect(page.getByRole('article')).toContainText('Teslim defteri')
  await page.getByRole('tab', { name: 'Girişimci aksiyon planı' }).click()
  await expect(page.getByRole('article')).toContainText(/eylem planı/i)
  const file = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Markdown indir' }).click()
  expect((await file).suggestedFilename()).toContain('action')
  await go(page, 'Karar Kitabı')
  await page.getByLabel('Yöntem ara').fill('Eisenhower')
  await expect(page.getByText('1 yöntem', { exact: true })).toBeVisible()
  await go(page, 'Göstergeler')
  await expect(page.locator('.chart svg')).toBeVisible()
  await page.getByText('Grafik verisini oku').click()
  await expect(page.locator('details')).toContainText('Araştırma yetkisi')
})
test('iki sekmedeki çakışma başka bir planın kaydını engellemez', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Kararı incele', exact: true }),
  ).toBeVisible()
  const other = await context.newPage()
  await other.goto('/')
  await expect(
    other.getByRole('button', { name: 'Kararı incele', exact: true }),
  ).toBeVisible()
  for (const tab of [page, other])
    await tab
      .getByRole('button', { name: 'Kararı incele', exact: true })
      .click()
  await page
    .getByRole('spinbutton', { name: 'Ödeme günü kasadaki para' })
    .fill('73000')
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  await other
    .getByRole('spinbutton', { name: 'Ödeme günü kasadaki para' })
    .fill('76000')
  await expect(
    other.getByText(/Başka bir sekme bu planı değiştirdi/),
  ).toBeVisible()
  await create(other, 'İkinci plan')
  await other
    .getByLabel('İşi kendi sözlerinizle anlatın', { exact: true })
    .fill('İkinci taslak')
  await expect(
    other.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  const check = await context.newPage()
  await check.goto('/#editor')
  await expect(
    check.getByLabel('İşi kendi sözlerinizle anlatın', { exact: true }),
  ).toHaveValue('İkinci taslak')
  await other.getByRole('combobox', { name: 'Çalışılan plan' }).click()
  await other
    .getByText('Atölye kapasite yatırımı', { exact: true })
    .last()
    .click()
  await other
    .getByRole('button', { name: 'Kayıtlı sürümü aç', exact: true })
    .click()
  await other
    .getByRole('dialog')
    .getByRole('button', { name: 'Kayıtlı sürümü aç' })
    .click()
  await expect(
    other.getByRole('spinbutton', { name: 'Ödeme günü kasadaki para' }),
  ).toHaveValue('73000')
})
test('klavye odağı, iki yönlü hareket ve koyu tema', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Koyu temaya geç' })
  await expect(button).toBeVisible()
  await page.keyboard.press('Tab')
  await button.focus()
  const snapshot = () =>
    button.evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        outline: s.outlineStyle,
        shadow: s.boxShadow,
        time: s.transitionDuration,
        curve: s.transitionTimingFunction,
      }
    })
  expect((await snapshot()).outline).toBe('none')
  expect((await snapshot()).shadow).toContain('inset')
  for (const hover of [true, false]) {
    if (hover) await button.hover()
    else await page.mouse.move(0, 0)
    const style = await snapshot()
    expect(style.time.split(',').every((t) => parseFloat(t) > 0)).toBe(true)
    expect(style.curve).toContain('cubic-bezier(0.65, 0, 0.35, 1)')
  }
  await button.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(
    parseFloat(
      await page
        .getByRole('button', { name: 'Açık temaya geç' })
        .evaluate((el) => getComputedStyle(el).transitionDuration),
    ),
  ).toBeLessThan(0.01)
})

test('JSON dışa aktarma, kopya açma ve geçersiz dosyayı reddetme', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Kararı incele', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Dosya işlemleri' }).click()
  const download = page.waitForEvent('download')
  await page.getByText('Planı JSON indir', { exact: true }).click()
  const path = await (await download).path()
  await page.locator('#import-file').setInputFiles(path!)
  await expect(page.locator('.plan-picker')).toContainText(
    'Atölye kapasite yatırımı (kopya)',
  )
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  await page.locator('#import-file').setInputFiles({
    name: 'bozuk.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":1}'),
  })
  await expect(page.getByRole('alert')).toContainText(
    'geçerli bir Karar Atlası planı',
  )
})
test('dokunma, yön değişimi ve yeniden açılan seçim', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 720 },
    hasTouch: true,
  })
  const p = await context.newPage()
  await p.goto(String(test.info().project.use.baseURL))
  await p.getByRole('button', { name: 'Kararı incele', exact: true }).tap()
  await p
    .getByRole('spinbutton', { name: 'Ödeme günü kasadaki para' })
    .fill('75000')
  await p.setViewportSize({ width: 760, height: 320 })
  await expect(
    p.getByRole('spinbutton', { name: 'Ödeme günü kasadaki para' }),
  ).toHaveValue('75000')
  await expect(p.getByRole('button', { name: 'Menüyü aç' })).toBeVisible()
  await p.getByRole('button', { name: 'Menüyü aç' }).tap()
  await expect(p.getByRole('navigation', { name: 'Ana menü' })).toBeVisible()
  await context.close()
})
