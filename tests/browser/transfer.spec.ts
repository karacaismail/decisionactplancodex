import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
async function report(page: Page) {
  await page.goto('/#reports')
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
}
async function visit(page: Page, step: string) {
  await report(page)
  await page
    .getByRole('button', { name: step + '. adımın kaydını aç', exact: true })
    .first()
    .click()
}
test('Stratej telefonda ihtiyaç adayını ve ilk kararı aynı raporda görür', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 810 })
  const assets: string[] = []
  page.on('request', (r) => assets.push(r.url()))
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await visit(page, '09')
  await expect(
    page.getByLabel('Talebi hangi müşteri davranışı gösteriyor?'),
  ).toHaveCount(0)
  await page
    .getByLabel('Hangi müşteri ihtiyacı karşılanmıyor?')
    .fill('Öğlen kahve')
  await expect(
    page.getByLabel('Talebi hangi müşteri davranışı gösteriyor?'),
  ).toBeVisible()
  await visit(page, '17')
  expect(assets.some((x) => /OpenDecisions-.*js/.test(x))).toBe(false)
  await page
    .getByText('Strateje devir için açık sorular ve dayanaklar', {
      exact: true,
    })
    .click()
  await page.getByRole('button', { name: 'Karar sorusu ekle' }).click()
  await page
    .getByRole('textbox', { name: 'Karar sorusu', exact: true })
    .fill('Hangi durak seçilmeli?')
  await page
    .getByLabel('Hangi bulgu bu kararı değiştirir?')
    .fill('Ücretli sipariş sayısı')
  await page.getByRole('button', { name: 'Karar sorusu ekle' }).click()
  await page
    .getByRole('textbox', { name: 'Karar sorusu', exact: true })
    .nth(1)
    .fill('Öğlen satış denenmeli mi?')
  await page.getByRole('button', { name: 'Bu soruyu ilk sıraya al' }).click()
  await report(page)
  const intro = page.locator('.dossier-intro')
  await expect(intro).toContainText('Öğlen satış denenmeli mi?')
  await expect(intro).toContainText('Geçiş kararı bekleniyor')
  const article = page.getByRole('article')
  await expect(article).toContainText('Araştırılacak konular')
  await expect(article).toContainText('Öğlen kahve')
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.allSettled(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished),
    )
  })
  await page.screenshot({ path: info.outputPath('ilk-karar-320.png') })
  const file = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Markdown indir' }).click()
  const content = await readFile((await (await file).path())!, 'utf8')
  expect(content).toContain('1. Öğlen satış denenmeli mi?')
  expect(content).toContain('2. Hangi durak seçilmeli?')
  await page.reload()
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  await expect(intro).toContainText('Öğlen satış denenmeli mi?')
  for (const [width, height] of [
    [320, 810],
    [360, 800],
    [375, 810],
    [390, 840],
    [810, 390],
    [768, 1024],
    [1366, 900],
  ]) {
    await page.setViewportSize({ width, height })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    expect(
      await intro
        .locator('p')
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(14)
  }
})

test('Telefonda ayrılan para borca bağlanır ve ödeme harcamaya bir kez geçer', async ({
  page,
}) => {
  const { cafeExample } = await import('../../src/cafe')
  const p = cafeExample()
  Object.assign(p.answers['02'], {
    budget: 100000,
    spent: 30000,
    contract: 'Evet',
  })
  p.foundation!.brief!.studies!.push({
    id: 'hesap',
    method: 'budget',
    values: { budgetScope: '02. adımdaki bütçe' },
    pledges: [
      {
        id: 'borc',
        name: 'Kira',
        amount: '50000',
        owner: 'Ayşe',
        due: '',
        proof: '',
      },
    ],
  })
  await page.setViewportSize({ width: 320, height: 810 })
  await page.goto('/')
  await page.locator('#import-file').setInputFiles({
    name: 'ornek.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(p)),
  })
  await expect(page.locator('.plan-picker')).toContainText('(kopya)')
  await visit(page, '16')
  await page
    .getByRole('button', { name: 'Serbest bütçeyi hesapla', exact: true })
    .click()
  const panel = page.locator('.method-form'),
    result = panel.locator('.method-result')
  await expect(result).toContainText('20.000 TL')
  await panel.getByRole('button', { name: 'Ayrılan para ekle' }).click()
  await panel.getByRole('spinbutton', { name: 'Ayrılan tutar' }).fill('10000')
  await expect(result).toContainText('10.000 TL')
  const select = panel.getByRole('combobox', {
    name: 'Aynı ödeme için kayıtlı borç',
  })
  await select.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(result).toContainText('20.000 TL')
  await panel.getByRole('button', { name: 'Ödemeyi harcamaya geçir' }).click()
  await expect(result).toContainText('Gerçekleşen harcama 80.000 TL')
  await expect(result).toContainText('20.000 TL')
  await expect(
    panel.getByRole('button', { name: 'Ödemeyi harcamaya geçir' }),
  ).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  )
  await report(page)
  await expect(page.getByRole('article')).toContainText('Ödendi.')
})
test('Stratej koşulun rapor satırından iptalin kendi kaydını açar', async ({
  page,
}) => {
  const { cafeExample } = await import('../../src/cafe')
  const p = cafeExample(),
    e = p.evidence.find((x) => x.step === '15')!
  const counter = {
    ...e,
    id: 'iptal',
    stance: 'Karşı bulgu' as const,
    title: 'Sipariş iptali',
    criteria: [],
  }
  p.evidence.push(counter)
  p.foundation!.brief!.claims = [
    {
      id: 'iddia',
      text: 'Sabah siparişi',
      group: 'Yolcular',
      period: 'Sabah',
      kind: 'Gözlem',
      route: 'kafe-araba',
      criterion: '',
      confidence: 'Orta',
      why: '',
      calculation: '',
      support: e.id,
      counter: counter.id,
    },
  ]
  p.foundation!.brief!.studies!.push({
    id: 'kosul',
    method: 'factor',
    values: {
      name: 'Sipariş korunur',
      claim: 'iddia',
      group: 'Yolcular',
      period: 'Sabah',
    },
  })
  await page.setViewportSize({ width: 320, height: 810 })
  await page.goto('/')
  await page.locator('#import-file').setInputFiles({
    name: 'deneme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(p)),
  })
  await expect(page.locator('.plan-picker')).toContainText('(kopya)')
  await report(page)
  const part = page
    .getByRole('heading', { name: 'Başarı neye bağlı?', exact: true })
    .locator('..')
  await expect(part).toContainText('Bulgular çelişiyor')
  await part
    .locator('p')
    .filter({ hasText: 'Karşı bulgu: Sipariş iptali' })
    .getByRole('button', { name: 'Kanıt kaydını aç' })
    .click()
  await expect(
    page.getByRole('button', { name: 'Tüm kanıtları göster' }),
  ).toBeVisible()
  await expect(page.getByText('Sipariş iptali', { exact: true })).toBeVisible()
})
