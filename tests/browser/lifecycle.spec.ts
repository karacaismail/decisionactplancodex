import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
test('Beş ana aşama telefonda açılır ve planı doğru adıma götürür', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 780 })
  await page.goto('/#gecis')
  await page.getByRole('button', { name: 'Kafe örneğini aç' }).click()
  await page.goto('/#asamalar')
  await expect(
    page.getByRole('heading', { name: 'Strateji yönetimi', exact: true }),
  ).toBeVisible({ timeout: 3000 })
  await page
    .getByRole('button', {
      name: '3. Stratejik eylem planını hazırlama',
      exact: true,
    })
    .click()
  await expect(
    page.getByText('Başarı ölçüsünü belirleme', { exact: true }),
  ).toBeVisible()
  const toggle = page.getByRole('button', {
    name: '3. Stratejik eylem planını hazırlama',
    exact: true,
  })
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  const allControls = info.project.use.browserName === 'webkit' ? 'Alt+' : ''
  await page.keyboard.press(allControls + 'Tab')
  await expect(
    page.getByRole('button', { name: '4. Uygulama ve gözlem', exact: true }),
  ).toBeFocused()
  await page.keyboard.press(allControls + 'Shift+Tab')
  await expect(toggle).toBeFocused()
  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  for (const width of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 850 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    expect(
      await page
        .locator('.phase-plan')
        .evaluate((root) =>
          [...root.querySelectorAll('h2,h3,h4,p,button')]
            .filter((el) => el.getClientRects().length)
            .every((el) => parseFloat(getComputedStyle(el).fontSize) >= 14),
        ),
    ).toBe(true)
    if (width === 320 || width === 1440)
      await page.screenshot({
        path: info.outputPath('asamalar-' + width + '.png'),
      })
  }
  await page.getByRole('button', { name: '22. Ölçüm düzeni' }).click()
  await expect(page.locator('#active-question')).toHaveText('Ölçüm düzeni')
  await expect(page.getByLabel('Fayda eşiği', { exact: true })).toBeDisabled()
})

test('Karar sahibi yolu ve kaynağı onaylar, gözlemi inceleyip işi yeniden planlar', async ({
  page,
  baseURL,
}) => {
  const { cafeExample } = await import('../../src/cafe')
  const { decide } = await import('../../src/readiness')
  let p = cafeExample()
  p.foundation!.inputs.skills = 'Barista hazır.'
  p.evidence.push({
    ...p.evidence[0],
    id: randomUUID(),
    step: '12',
    criteria: ['D4'],
  })
  p = decide(p, {
    outcome: 'Planlamaya hazır',
    owner: 'Ayşe',
    reason: 'Hazırlığı inceledim.',
    reviewed: true,
    field: '',
    question: '',
    assignee: '',
    due: '',
    proof: '',
  })
  p.answers['18'] = {
    choice: 'Sabah kahve arabası',
    rationale: 'Durakta yer var.',
    excluded: 'Büfe',
    actions: 'Dar menü ve erken vardiya',
    comparison: 'Yazılı teklif',
    reconsider: 'İzin kalkarsa',
  }
  p.answers['19'] = {
    goals: [
      {
        Görev: 'Sabah teslimi',
        Sorumlu: 'Ayşe',
        'Başlatacak olay': 'Vardiya açılışı',
        'Kabul ölçüsü': 'Teslim fişi',
      },
    ],
    choiceBasis: 'Sabah kahve arabası',
  }
  p.answers['20'] = {
    authority: 'Ayşe',
    resources: 'Bir gün, iki kişi, 500 TL',
    basis: 'İzin kaydı',
    ready: 'Karşılandı',
  }
  p.answers['22'] = { benefit: 'Bekleme beş dakika olsun.' }
  p.answers['25'] = {
    benefit: 'Karşılanmadı',
    evidence: 'Vardiya defteri',
  }
  const origin = new URL(baseURL!).origin
  const session = await page.request.post('/api/team/create', {
    headers: { origin },
    data: { workspace: 'Karar sınaması', name: 'Ayşe', password: randomUUID() },
  })
  expect(session.ok()).toBeTruthy()
  const { workspace, user } = await session.json()
  const headers = {
    origin,
    'x-atlas-space': workspace.id,
    'x-atlas-member': user.id,
  }
  const saved = await page.request.post('/api/team/save', {
    headers,
    data: { plan: p },
  })
  expect(saved.ok()).toBeTruthy()
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/#asamalar?phase=2')
  await page
    .getByRole('button', { name: '18. Seçilen strateji', exact: true })
    .first()
    .click()
  await page.getByRole('button', { name: 'Stratejik seçimi kaydet' }).click()
  await expect(page.getByText('Karar sahibi bu yolu seçti.')).toBeVisible()
  const savedStatus = page.getByRole('status').filter({ hasText: 'Kaydedildi' })
  await expect(savedStatus).toBeVisible()
  await page.goto('/#asamalar?phase=3')
  await page.getByRole('button', { name: /^20\./ }).first().click()
  await page.getByRole('button', { name: 'Kararı incele', exact: true }).click()
  await page
    .getByLabel('Kararın gerekçesi')
    .fill('İlk vardiyanın kaynağı ayrıldı.')
  await page.getByRole('button', { name: 'Karar kaydını ekle' }).click()
  await expect(savedStatus).toBeVisible()
  await page.goto('/#asamalar?phase=4')
  await page
    .getByRole('button', { name: '25. Teslim kararı', exact: true })
    .click()
  await page
    .getByLabel('Gözlenen değer veya sonuç')
    .fill('Müşteri sekiz dakika bekledi.')
  await expect(savedStatus).toBeVisible()
  await page.goto('/#asamalar?phase=5')
  await page
    .getByRole('button', { name: 'Sonucu değerlendir', exact: true })
    .click()
  await expect(page.getByLabel('Gerçekte ne gördünüz?')).toHaveValue(
    'Müşteri sekiz dakika bekledi.',
  )
  await page.getByRole('combobox', { name: 'Sonraki karar' }).click()
  await page.getByRole('option', { name: 'Planı düzelt', exact: true }).click()
  await page
    .getByLabel('Kararı neden veriyorsunuz?')
    .fill('Kahve arabası geç açıldı.')
  await page.getByLabel('Sonraki işin sorumlusu').fill('Ayşe')
  await page.getByLabel('Sonraki kontrol günü veya olayı').fill('Yeni vardiya')
  await page.getByRole('button', { name: 'Sonuç kararını kaydet' }).click()
  await expect(page.getByText('Sonuç kararlarının geçmişi')).toBeVisible()
  await expect(savedStatus).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: '19. adımın kaydını aç' }).click()
  await expect(page.locator('#active-question')).toHaveText(/eylem planı/i)
  await page.goto('/#reports')
  for (const title of ['Yönetici raporu', 'Girişimci aksiyon planı']) {
    await page.getByRole('tab', { name: title, exact: true }).click()
    await expect(page.getByRole('article')).toContainText(
      'Kahve arabası geç açıldı.',
    )
    await expect(page.getByRole('article')).toContainText(
      'Müşteri sekiz dakika bekledi.',
    )
  }
})

test('Kurum yeni plana ve içe alınan kopyaya etkin üye atar', async ({
  page,
  baseURL,
}) => {
  const { cafeExample } = await import('../../src/cafe')
  const origin = new URL(baseURL!).origin
  await page.request.post('/api/team/create', {
    headers: { origin },
    data: { workspace: 'Bölge ekibi', name: 'Deniz', password: randomUUID() },
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Yeni plan', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Plan adı', exact: true })
    .fill('Yeni kurum planı')
  await page.getByRole('button', { name: 'Planı oluştur' }).click()
  await page.getByRole('button', { name: 'Sonraki adım' }).click()
  const assign = async () => {
    await page
      .getByRole('combobox', { name: 'Karar sahibi', exact: true })
      .click()
    await page.getByRole('option', { name: 'Deniz', exact: true }).click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
    ).toBeVisible()
  }
  await assign()
  const source = cafeExample()
  await page.locator('#import-file').setInputFiles({
    name: 'ornek.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(source)),
  })
  await expect(page.locator('main h1')).toContainText('(kopya)')
  await page.getByRole('button', { name: 'Hazırlığa başla' }).click()
  await page.getByRole('button', { name: 'Sonraki adım' }).click()
  await expect(page.getByText('Önceki planın karar sahibi: Ayşe')).toBeVisible()
  await assign()
  await page.reload()
  await expect(
    page.locator('.ant-select').filter({ has: page.locator('#field-owner') }),
  ).toContainText('Deniz')
})
