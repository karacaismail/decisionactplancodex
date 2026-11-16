import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { cafeExample } from '../../src/cafe'
import { readFile } from 'node:fs/promises'

test('Altı yöntem beş fazda aynı plandan çalışır ve kayıtlı rapora geçer', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(120000)
  const p = cafeExample()
  p.foundation!.inputs.skills = 'Üretim ekibi hazır.'
  p.evidence.push({
    ...p.evidence[0],
    id: randomUUID(),
    step: '12',
    criteria: ['D4'],
  })
  p.answers['18'] = {
    choice: 'Sabah kahve arabası',
    rationale: 'Daha kısa sıra',
    excluded: 'Büfe',
    actions: 'Dar menü',
    comparison: 'Tarihli talep',
    reconsider: 'İzin kalkarsa',
  }
  p.answers['19'] = {
    choiceBasis: 'Sabah kahve arabası',
    goals: [
      {
        Görev: 'Teslim',
        Sorumlu: 'Ayşe',
        'Başlatacak olay': 'Vardiya açılışı',
        'Kabul ölçüsü': 'Fiş',
      },
    ],
  }
  p.answers['20'] = {
    authority: 'Ayşe',
    resources: 'Bir vardiya',
    basis: 'Yazılı izin',
    ready: 'Karşılandı',
  }
  p.answers['21'] = { scope: 'Sabah teslimi', accept: 'Fiş karşılığı' }
  p.answers['22'] = {
    source: 'Sayaç',
    checkpoint: 'Cuma',
    benefit: 'Bekleme azalır',
    harm: 'İade artar',
  }
  p.answers['25'] = {
    benefit: 'Karşılandı',
    actual: 'Beş dakika',
    evidence: 'Vardiya fişi',
  }
  const origin = new URL(baseURL!).origin
  const session = await page.request.post('/api/team/create', {
    headers: { origin },
    data: { workspace: 'Faz denemesi', name: 'Ayşe', password: randomUUID() },
  })
  const { workspace, user } = await session.json()
  const response = await page.request.post('/api/team/save', {
    headers: {
      origin,
      'x-atlas-space': workspace.id,
      'x-atlas-member': user.id,
    },
    data: { plan: p },
  })
  expect(response.ok()).toBeTruthy()
  await page.setViewportSize({ width: 320, height: 800 })
  const saved = () =>
    expect(
      page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
    ).toBeVisible()
  const button = (name: string) =>
    page.getByRole('button', { name, exact: true })
  const fill = (name: string, value: string) =>
    page.getByLabel(name, { exact: true }).fill(value)
  const open = async (slug: string, title: string) => {
    await page.goto('/#methods')
    await page.getByRole('button', { name: title, exact: true }).click()
    await button('Bu yöntemi ilgili adımda aç').click()
    await expect(page.locator('#active-question')).toBeVisible()
    await expect(
      page.locator('[data-phase-method="' + slug + '"]'),
    ).toBeVisible()
  }
  await open('karar-matrisi', 'Karar Matrisi (Ağırlıklı Puanlama)')
  await expect(button('Karşılaştırma ölçüsü ekle')).toBeDisabled()
  await open('bes-neden', '5 Neden (Kök Neden Analizi)')
  await fill('İlk olası neden', 'Kesim gecikmesi')
  await fill('Diğer olası neden', 'Dış taban gecikmesi')
  await fill('İki nedeni ayıran gözlem', 'Kesim zamanında bitti')
  await saved()
  await page.goto('/#gecis')
  await fill('Kararın gerekçesi', 'Dayanaklar ve açık sorular incelendi.')
  await page.getByLabel('Dayanakları inceledim').check()
  await button('Geçiş kararını kaydet').click()
  await expect(
    page.getByText('Kayıtlı karar: Planlamaya hazır', { exact: true }),
  ).toBeVisible()
  await button('Strateje devir raporunu aç').click()
  await expect(page.getByRole('article')).toContainText('Kesim zamanında bitti')
  await open('karar-matrisi', 'Karar Matrisi (Ağırlıklı Puanlama)')
  await button('Karşılaştırma ölçüsü ekle').click()
  await fill('Ölçünün adı', 'Teslim süresi')
  await fill('Önem ağırlığı', '60')
  await fill('Birinci yolun puanı', '2')
  await fill('İkinci yolun puanı', '5')
  await expect(
    page.locator('[data-phase-method="karar-matrisi"]'),
  ).toContainText('5 üzerinden')
  await button('Stratejik seçimi kaydet').click()
  await expect(page.getByText('Karar sahibi bu yolu seçti.')).toBeVisible()
  await saved()
  await open('hoshin-kanri', 'Hoshin Kanri (Strateji Açılımı)')
  await button('Stratejik hedefler için kayıt ekle').click()
  await fill('Hedef', 'Teslimi hızlandır')
  const objective = page.getByRole('group', {
    name: 'Stratejik hedefler',
    exact: true,
  })
  await objective.getByLabel('Sorumlu', { exact: true }).fill('Ayşe')
  await fill('Ekibin karşı önerisi', 'İki vardiya ayıralım')
  await fill('Karşı öneriye yanıt', 'Bakım sonrası başlat')
  await saved()
  await page.goto('/#asamalar?phase=3')
  await page.getByRole('button', { name: /^20\./ }).first().click()
  await button('Kararı incele').click()
  await fill('Kararın gerekçesi', 'Kaynak sınırı incelendi.')
  await button('Karar kaydını ekle').click()
  await saved()
  await open('kpi-tasarimi', 'KPI Tasarımı (Doğru Gösterge Seçimi)')
  await button('İşletme ölçüleri için kayıt ekle').click()
  await fill('Ölçü', 'Bekleme süresi')
  await fill('Birim', 'dakika')
  await fill('Eşik', '5')
  await fill('Başlangıç', '9')
  await fill('Karşı ölçü', 'Hatalı teslim oranı')
  await button('Beklentiyi tarihli kaydet').click()
  await expect(
    page.locator('[data-phase-method="kpi-tasarimi"]'),
  ).toContainText('Gözlem sırası bilinmiyor')
  await saved()
  await open('kanban', 'Kanban')
  await fill('Aynı anda yürütülebilecek iş sayısı', '2')
  await button('Kanban işleri için kayıt ekle').click()
  await fill('İş', 'Numune kesimi')
  await fill('Engel', 'Kalıp bekleniyor')
  await saved()
  for (const width of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 800 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
  }
  await page.setViewportSize({ width: 320, height: 800 })
  await page
    .locator('[data-phase-method="kanban"]')
    .screenshot({ path: info.outputPath('kanban-320.png') })
  await open('geri-bildirim-analizi', 'Geri Bildirim Analizi')
  await expect(
    page.locator('[data-phase-method="geri-bildirim-analizi"]'),
  ).toContainText('Tarihli beklenti:')
  await fill('Beklenti', 'Beş dakika')
  await fill('Gözlem', 'Sekiz dakika sürdü')
  await fill('Gözlemin dayanağı', 'Vardiya çizelgesi')
  await fill('Sonraki değişiklik', 'Kalıp sırasını değiştir')
  await saved()
  await page.goto('/#reports')
  await page.reload()
  for (const name of ['Yönetici raporu', 'Girişimci aksiyon planı']) {
    await page.getByRole('tab', { name, exact: true }).click()
    const article = page.getByRole('article')
    for (const v of [
      'Teslim süresi',
      'İki vardiya ayıralım',
      'Hatalı teslim oranı',
      'Kalıp bekleniyor',
      'Sekiz dakika sürdü',
      'Kalıp sırasını değiştir',
    ])
      await expect(article).toContainText(v)
  }
  const download = page.waitForEvent('download')
  await button('Markdown indir').click()
  expect(await readFile((await (await download).path())!, 'utf8')).toContain(
    'Kalıp bekleniyor',
  )
  await page.getByRole('tab', { name: 'Strateje devir raporu' }).click()
  await expect(page.getByRole('article')).toContainText('Kesim zamanında bitti')
  await expect(page.getByRole('article')).not.toContainText('Kalıp bekleniyor')
  await page.getByRole('combobox', { name: 'Rapor sürümü' }).click()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('Karar günündeki devir', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('article')).toContainText('Kesim zamanında bitti')
  await expect(page.getByRole('article')).not.toContainText('Vardiya çizelgesi')
  await expect(page.getByRole('article')).not.toContainText(
    'Hatalı teslim oranı',
  )
})

test('Adım yöntemi istenene kadar çalışma paketi yüklenmez ve kitap okumak kayıt açmaz', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 800 })
  const requests: string[] = []
  page.on('request', (r) => requests.push(r.url()))
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await expect(page.getByText('Henüz karar kaydedilmedi.')).toBeVisible()
  await page.goto('/#asamalar?phase=2')
  await page
    .getByRole('button', { name: '18. Seçilen strateji', exact: true })
    .first()
    .click()
  const method = page.getByRole('button', {
    name: 'Karar Matrisi',
    exact: true,
  })
  await expect(method).toHaveAttribute('aria-expanded', 'false')
  const workRequests = () =>
    requests.filter((u) => /\/PhaseMethodWork-[^/]+\.js(?:$|\?)/.test(u))
  expect(workRequests()).toHaveLength(0)
  await method.focus()
  await page.keyboard.press('Enter')
  await expect(method).toHaveAttribute('aria-expanded', 'true')
  await expect(
    page.getByRole('button', { name: 'Karşılaştırma ölçüsü ekle' }),
  ).toBeDisabled()
  expect(workRequests()).toHaveLength(1)
  await info.attach('yontem-ag-istegi', {
    body: JSON.stringify(workRequests().map((u) => new URL(u).pathname)),
    contentType: 'application/json',
  })
  await page.keyboard.press('Space')
  await expect(method).toHaveAttribute('aria-expanded', 'false')
  await page.goto('/#reports')
  await expect(
    page.getByRole('article').getByRole('heading', { name: 'Karar Matrisi' }),
  ).toHaveCount(0)
})
