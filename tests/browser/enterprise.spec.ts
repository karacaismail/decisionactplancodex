import { test, expect, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
async function nav(p: Page, name: string) {
  const menu = p.getByRole('button', { name: 'Menüyü aç' })
  if (await menu.isVisible()) await menu.click()
  await p
    .getByRole('navigation', { name: 'Ana menü' })
    .getByRole('button', { name, exact: true })
    .click()
}
test('iki ayrı üyeyle kurum incelemesi ve sabit raporlar', async ({
  page,
  browser,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#team')
  await page.getByRole('tab', { name: 'Kurum aç' }).click()
  await page.getByLabel('Kurum adı', { exact: true }).fill('Test atölyesi')
  await page.getByLabel('Kullanıcı adı', { exact: true }).fill('Ada')
  await page.getByLabel('Parola', { exact: true }).fill(randomUUID())
  await page.getByRole('button', { name: 'Kurum alanını oluştur' }).click()
  await expect(
    page.getByRole('heading', { name: 'Test atölyesi' }),
  ).toBeVisible()
  await page.screenshot({ path: info.outputPath('team-320.png') })
  await page.getByRole('combobox', { name: 'Davet yetkisi' }).click()
  await page.getByText('İnceleyen', { exact: true }).last().click()
  await page.getByRole('button', { name: 'Davet oluştur' }).click()
  const invitation = await page
    .locator('.key-box')
    .filter({ hasText: 'Tek kullanımlık davet kodu' })
    .locator('code')
    .innerText()
  await page.getByRole('button', { name: 'Yeni plan', exact: true }).click()
  await page.getByLabel('Plan adı', { exact: true }).fill('Bölge mağazası')
  await page.getByRole('radio', { name: 'Bir işi devralıyorum' }).check()
  await page.getByRole('button', { name: 'Planı oluştur' }).click()
  await expect(
    page.getByText('Son olayın kaydı', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('Son olayın kaydı dayanağı').fill('Görüşme dökümü')
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  await nav(page, 'Kurum alanı')
  await page
    .getByRole('button', { name: 'Seçili planı incelemeye gönder' })
    .click()
  await page
    .getByLabel('İnceleme nedeni')
    .fill('Devir kayıtlarını karşılaştırın.')
  await page.getByRole('button', { name: 'İsteği kaydet' }).click()
  await expect(
    page.getByText('İnceleme bekliyor', { exact: true }),
  ).toBeVisible()
  const profile = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  try {
    const second = await profile.newPage()
    await second.goto(String(info.project.use.baseURL) + '/#team')
    await second.getByRole('tab', { name: 'Davetle katıl' }).click()
    await second.getByLabel('Davet kodu', { exact: true }).fill(invitation)
    await second.getByLabel('Kullanıcı adı', { exact: true }).fill('Mert')
    await second.getByLabel('Parola', { exact: true }).fill(randomUUID())
    await second.getByRole('button', { name: 'Daveti kabul et' }).click()
    await second.getByRole('button', { name: 'Dosyayı aç' }).click()
    await expect(second.locator('.packet-text')).toContainText('Bölge mağazası')
    await second.setViewportSize({ width: 320, height: 740 })
    await second.screenshot({ path: info.outputPath('review-320.png') })
    await second
      .getByLabel('İnceleme gerekçesi')
      .fill('Dayanağı kontrol ettim.')
    await second.getByRole('button', { name: 'Sürümü onayla' }).click()
    await expect(second.getByText('Onaylandı', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Kuyruğu yenile' }).click()
    await expect(page.getByText('Onaylandı', { exact: true })).toBeVisible()
    await expect(
      second.getByRole('button', { name: 'Yeni plan', exact: true }),
    ).toBeDisabled()
  } finally {
    await profile.close()
  }
})
test('görev kapanışı, portföy ve karar masası mobil ve geniş düzen', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#work')
  await page.getByRole('button', { name: 'Görev ekle' }).click()
  await page.getByLabel('Görevin adı').fill('Tezgâh teslimini doğrula')
  await page.getByLabel('Sorumlu kişi').fill('Saha ekibi')
  await page.getByRole('button', { name: 'Görevi kaydet' }).click()
  await page.getByRole('button', { name: 'Açık', exact: true }).click()
  await page.getByRole('combobox', { name: 'Görevin durumu' }).click()
  await page.getByText('Tamamlandı', { exact: true }).last().click()
  await page.getByRole('button', { name: 'Görevi kaydet' }).click()
  await expect(page.getByRole('alert')).toContainText('Kapanış kanıtını')
  await page.getByLabel('Kapanış kanıtı').fill('İmzalı teslim belgesi')
  await page.getByRole('button', { name: 'Görevi kaydet' }).click()
  await page.reload()
  await expect(page.getByText(/İmzalı teslim belgesi/)).toBeVisible()
  await nav(page, 'Plan portföyü')
  await page.getByRole('checkbox', { name: /karşılaştır/ }).check()
  await expect(
    page.getByRole('heading', { name: 'Plan karşılaştırması' }),
  ).toBeVisible()
  await nav(page, 'Plan adımları')
  await page.getByRole('button', { name: /Kaynak sınırları/ }).click()
  await expect(
    page.getByText('Kalan bütçe', { exact: true }).last(),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  for (const w of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({
      width: w,
      height: w === 844 ? 390 : w === 1440 ? 1000 : 800,
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(w)
    if (w === 320 || w === 1440) {
      await expect(
        w === 1440
          ? page.getByRole('navigation', { name: 'Ana menü' })
          : page.getByRole('button', { name: 'Menüyü aç' }),
      ).toBeVisible()
      if (w === 1440) {
        for (const zoom of [1, 1.25]) {
          await page.evaluate((z) => {
            document.documentElement.style.zoom = String(z)
          }, zoom)
          const spacing = await page.evaluate(
            () =>
              document.querySelector('.desk-review')!.getBoundingClientRect()
                .top -
              document.querySelector('.limits-strip')!.getBoundingClientRect()
                .bottom,
          )
          expect(spacing).toBeGreaterThanOrEqual(8)
        }
        await page.evaluate(() => {
          document.documentElement.style.zoom = '1'
        })
      }
      await page.screenshot({ path: info.outputPath('desk-' + w + '.png') })
    }
  }
  await page.getByRole('button', { name: /Dayanaklar/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Açık alanlar' }),
  ).toBeVisible()
  const gap = page.locator('.gap-button').first()
  await gap.click()
  await expect(
    page.getByRole('heading', { name: 'Risk ve önlem', exact: true }),
  ).toBeVisible()
  await nav(page, 'Raporlar')
  await page.getByRole('tab', { name: 'Girişimci aksiyon planı' }).click()
  await expect(page.getByRole('article')).toContainText('İmzalı teslim belgesi')
})

test('geç gelen portföy listesi yeni düzenlemeyi korur', async ({ page }) => {
  await page.goto('/#team')
  await page.getByRole('tab', { name: 'Kurum aç' }).click()
  await page.getByLabel('Kurum adı', { exact: true }).fill('Liste kontrolü')
  await page.getByLabel('Kullanıcı adı', { exact: true }).fill('Sorumlu')
  await page.getByLabel('Parola', { exact: true }).fill(randomUUID())
  await page.getByRole('button', { name: 'Kurum alanını oluştur' }).click()
  await expect(
    page.getByRole('heading', { name: 'Liste kontrolü' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Yeni plan', exact: true }).click()
  await page.getByLabel('Plan adı', { exact: true }).fill('Parça üretimi')
  await page.getByRole('button', { name: 'Planı oluştur' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  await nav(page, 'Plan portföyü')
  let arrived!: () => void, release!: () => void
  const started = new Promise<void>((r) => {
      arrived = r
    }),
    unblock = new Promise<void>((r) => {
      release = r
    })
  await page.route(
    '**/api/team/list',
    async (route) => {
      const snapshot = await route.fetch()
      arrived()
      await unblock
      await route.fulfill({ response: snapshot })
    },
    { times: 1 },
  )
  await page.getByRole('button', { name: 'Listeyi yenile' }).click()
  await started
  try {
    await nav(page, 'Plan adımları')
    await page
      .getByLabel('İşi kendi sözlerinizle anlatın')
      .fill('Yeni kayıt korunmalı.')
    await expect(
      page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
    ).toBeVisible()
  } finally {
    release()
  }
  await page.waitForLoadState('networkidle')
  await expect(page.getByLabel('İşi kendi sözlerinizle anlatın')).toHaveValue(
    'Yeni kayıt korunmalı.',
  )
})
