import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

test('Ekip üyesi kanıtı kendi adıyla inceler ve zarar kararını sahibine bırakır', async ({
  page,
  baseURL,
}) => {
  const { cafeExample } = await import('../../src/cafe')
  const p = cafeExample()
  const origin = new URL(baseURL!).origin
  const post = async (
    action: string,
    data: unknown,
    headers: Record<string, string> = {},
  ) => {
    const response = await page.request.post('/api/team/' + action, {
      data,
      headers: { origin, ...headers },
    })
    expect(response.ok()).toBe(true)
    return response.json()
  }
  const admin = await post('create', {
    workspace: 'Deneme ekibi',
    name: 'Ayşe',
    password: randomUUID(),
  })
  const headers = {
    'x-atlas-space': admin.workspace.id,
    'x-atlas-member': admin.user.id,
  }
  p.revision = 0
  const record = p.evidence.find((e) => e.criteria?.includes('Z6'))!
  p.evidence.push({
    id: randomUUID(),
    step: '17',
    at: new Date().toISOString(),
    title: 'Sahada zarar işareti',
    source: 'Görevli',
    place: 'Durak',
    observed: record.observed,
    kind: 'Gözlem',
    surprise: { status: 'Açık', danger: true },
  })
  p.evidence.push({
    id: randomUUID(),
    step: '17',
    at: new Date().toISOString(),
    observed: record.observed,
    title: 'Kapanmış olağan olay',
    source: 'Görevli',
    place: 'Durak',
    kind: 'Gözlem',
    surprise: {
      status: 'Kapandı',
      conclusion: 'Eski çalışma saati doğrulandı.',
      closedBy: 'Ayşe',
      closedOn: record.observed,
    },
  })
  await post('save', { plan: p }, headers)
  const invitation = await post('invite', { role: 'editor' }, headers)
  await post('join', {
    code: invitation.code,
    name: 'Ece',
    password: randomUUID(),
  })
  await page.goto('/#evidence')
  const row = (title: string) =>
    page.getByRole('row').filter({ hasText: title })
  await row(record.title).getByRole('button', { name: 'Kaydı incele' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Koşulu doğrulayan kişi')).toHaveValue('Ece')
  await expect(dialog.getByLabel('Koşulu doğrulayan kişi')).not.toBeEditable()
  await dialog.getByLabel('Kaynağı bugün yeniden inceledim').check()
  await dialog.getByRole('button', { name: 'Kanıtı kaydet' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  await expect(
    row('Sahada zarar işareti').getByRole('button', { name: /kaydını sil/ }),
  ).toBeDisabled()
  await row('Sahada zarar işareti')
    .getByRole('button', { name: 'Kaydı incele' })
    .click()
  await expect(dialog.getByLabel('Ciddi zarar işareti gördüm')).toBeDisabled()
  await dialog.getByText('İncelemeyi izle', { exact: true }).click()
  await expect(
    dialog.getByRole('combobox', { name: 'İnceleme sonucu' }),
  ).toBeDisabled()
  await dialog.getByRole('button', { name: 'Vazgeç' }).click()
  await row('Kapanmış olağan olay')
    .getByRole('button', { name: 'Kaydı incele' })
    .click()
  await dialog.getByLabel('Ciddi zarar işareti gördüm').check()
  await dialog.getByRole('button', { name: 'Gözlemi kaydet' }).click()
  await expect(row('Kapanmış olağan olay')).toContainText(
    'Beklenmeyen gözlem. Açık',
    { timeout: 3000 },
  )
  await page.goto('/#reports')
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  await expect(page.getByRole('article')).toContainText('İnceleyen: Ece')
  await expect(page.getByRole('article')).toContainText('Önceki kapanış')
  await expect(page.getByRole('article')).toContainText(
    'Eski çalışma saati doğrulandı.',
  )
})

test('Fiyat değişince eski ön sipariş yeniden onayla yeni fiyata taşınamaz', async ({
  page,
}) => {
  const { cafeExample } = await import('../../src/cafe')
  const p = cafeExample()
  p.foundation!.inputs.price = '100'
  const record = p.evidence.find((e) => e.criteria?.includes('Z6'))!
  await page.goto('/')
  await page.locator('#import-file').setInputFiles({
    name: 'fiyat.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(p)),
  })
  await expect(page.locator('.plan-picker')).toContainText('(kopya)')
  await page.goto('/#evidence')
  await page
    .getByRole('row')
    .filter({ hasText: record.title })
    .getByRole('button', { name: 'Kaydı incele' })
    .click()
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Kaynağı bugün yeniden inceledim').check()
  await modal.getByRole('button', { name: 'Kanıtı kaydet' }).click()
  await page.goto('/#gecis')
  await expect(
    page.getByRole('heading', { name: 'Henüz hazır değil', exact: true }),
  ).toBeVisible({ timeout: 3000 })
})

test('Telefonda beklenmeyen gözlem saklanır, izlenir ve devir raporuna iner', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await page.goto('/#evidence')
  const editorLoaded = () =>
    page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .some((r) => /SurpriseEditor[^/]*\.js(?:\?|$)/.test(r.name)),
    )
  expect(await editorLoaded()).toBe(false)
  await page
    .getByRole('button', { name: 'Bunu beklemiyorduk' })
    .click({ timeout: 4500 })
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect(await editorLoaded()).toBe(true)
  for (const [width, height] of [
    [320, 800],
    [360, 800],
    [375, 812],
    [390, 844],
    [844, 390],
    [820, 1000],
    [1366, 900],
  ]) {
    await page.setViewportSize({ width, height })
    const bounds = await dialog.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1)
    expect(
      await dialog
        .getByLabel('Ne oldu?')
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(14)
  }
  await page.setViewportSize({ width: 320, height: 800 })
  await dialog.getByLabel('Ne oldu?').focus()
  await page.keyboard.press('Tab')
  await expect(dialog.getByLabel('Nerede gözlediniz?')).toBeFocused()
  await page.screenshot({ path: info.outputPath('gozlem-form-320.png') })
  await dialog.getByLabel('Ne oldu?').fill('Durak bir anda boşaldı.')
  await dialog.getByLabel('Nerede gözlediniz?').fill('Kuzey durağı')
  await dialog.getByLabel('Gözlemin kaynağı').fill('Durak görevlisinin defteri')
  await dialog.getByRole('button', { name: 'Gözlemi kaydet' }).click()
  await expect(
    page.getByText('Durak bir anda boşaldı.', { exact: true }),
  ).toBeVisible()
  await page.reload()
  const row = page
    .getByRole('row')
    .filter({ hasText: 'Durak bir anda boşaldı.' })
  await row.getByRole('button', { name: 'Kaydı incele' }).click()
  await dialog.getByText('İncelemeyi izle', { exact: true }).click()
  await dialog.getByLabel('Henüz kimi dinlemediniz?').fill('Gece yolcuları')
  await dialog.getByLabel('İnceleyecek kişi').fill('Ayşe')
  await dialog.getByRole('button', { name: 'Gözlemi kaydet' }).click()
  await page.goto('/#reports')
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  await expect(page.getByRole('article')).toContainText('Gece yolcuları')
  const file = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Markdown indir' }).click()
  expect(await readFile((await (await file).path())!, 'utf8')).toContain(
    'Kuzey durağı',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  )
  await page.screenshot({ path: info.outputPath('gozlem-320.png') })
})

test('Eski talep kanıtı incelenip doğrulandığında geçiş önerisi düzelir', async ({
  page,
}) => {
  const { cafeExample } = await import('../../src/cafe')
  const p = cafeExample()
  const record = p.evidence.find((e) => e.criteria?.includes('Z6'))!
  delete record.review
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/')
  await page.locator('#import-file').setInputFiles({
    name: 'eski.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(p)),
  })
  await expect(page.locator('.plan-picker')).toContainText('(kopya)')
  await page.goto('/#gecis')
  await expect(
    page.getByRole('heading', { name: 'Henüz hazır değil', exact: true }),
  ).toBeVisible()
  await page.goto('/#evidence')
  await page
    .getByRole('row')
    .filter({ hasText: record.title })
    .getByRole('button', { name: 'Kaydı incele' })
    .click()
  const modal = page.getByRole('dialog')
  await modal
    .getByLabel('Hangi değişiklik bu kanıtı eskitebilir?')
    .fill('Teklif fiyatı değişirse tekrar incele.')
  await modal.getByLabel('Kaynağı bugün yeniden inceledim').check()
  await modal.getByRole('button', { name: 'Kanıtı kaydet' }).click()
  await expect(modal).toBeHidden()
  await page.goto('/#gecis')
  await expect(
    page.getByRole('heading', { name: 'Koşullu hazır', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText(/Tam geçiş için en az dört destek gerekir/),
  ).toBeVisible()
})
