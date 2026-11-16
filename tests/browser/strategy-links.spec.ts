import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { cafeExample } from '../../src/cafe'
import { decide } from '../../src/readiness'
import { confirmStrategyChoice } from '../../src/domain'

test('Stratej telefonda hedefi işe bağlar ve raporda aynı kararı bulur', async ({
  page,
  baseURL,
}, info) => {
  let p = cafeExample()
  p.foundation!.inputs.skills = 'Ekip hazır.'
  p.evidence.push({
    ...p.evidence[0],
    id: randomUUID(),
    step: '12',
    criteria: ['D4'],
  })
  p = decide(p, {
    outcome: 'Planlamaya hazır',
    owner: 'Ayşe',
    reason: 'Belgeler incelendi.',
    reviewed: true,
    field: '',
    question: '',
    assignee: '',
    due: '',
    proof: '',
  })
  p.answers['18'] = {
    choice: 'Sabah kahve arabası',
    rationale: 'Kısa sıra',
    excluded: 'Büfe',
    actions: 'Sırayı kısalt',
    comparison: 'Talep görüldü.',
    reconsider: 'İzin kalkarsa',
  }
  p = confirmStrategyChoice(p, 'Ayşe')
  const origin = new URL(baseURL!).origin
  const session = await page.request.post('/api/team/create', {
    headers: { origin },
    data: { workspace: 'Test alanı', name: 'Ayşe', password: randomUUID() },
  })
  const { workspace, user } = await session.json()
  const save = await page.request.post('/api/team/save', {
    headers: {
      origin,
      'x-atlas-space': workspace.id,
      'x-atlas-member': user.id,
    },
    data: { plan: p },
  })
  expect(save.ok()).toBeTruthy()
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto('/#asamalar?phase=3')
  await page.getByRole('button', { name: /^19\./ }).first().click()
  const add = page.getByRole('button', {
    name: 'Stratejik hedefler için kayıt ekle',
  })
  await expect(add).toBeVisible({ timeout: 3000 })
  await expect(
    page.getByRole('group', { name: 'Stratejik hedefler', exact: true }),
  ).toHaveAccessibleDescription('Bu sürümde eklendi veya güncellendi.')
  await add.click()
  const objectives = page.locator('.field').filter({ has: add })
  await expect(
    objectives
      .locator('label')
      .filter({ hasText: 'Ekibin karşı önerisi' })
      .getByText('new', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('Hedef', { exact: true }).fill('Teslim süresini kısalt')
  await page.getByRole('button', { name: 'İş sırası için kayıt ekle' }).click()
  await page.getByLabel('Görev', { exact: true }).last().fill('Yeni vardiya')
  const sel = page.getByRole('combobox', { name: 'Bağlı hedef' }).last()
  const task = sel.locator(
    'xpath=ancestor::div[contains(@class,"repeat-row")][1]',
  )
  await expect(
    task
      .locator('label')
      .filter({ hasText: 'Bağlı hedef' })
      .getByText('new', { exact: true }),
  ).toBeVisible()
  await expect(
    task
      .locator('label')
      .filter({ hasText: 'Görev' })
      .getByText('new', { exact: true }),
  ).toHaveCount(0)
  await sel.click()
  await page.getByRole('option', { name: 'Teslim süresini kısalt' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Kaydedildi' }),
  ).toBeVisible()
  await page.goto('/#reports')
  await page.reload()
  const report = page.getByRole('article')
  await expect(
    report
      .getByRole('heading', { name: 'Hedeflerin karar bağları', exact: true })
      .getByText('new', { exact: true }),
  ).toBeVisible()
  await expect(report).toContainText('Hedef: Teslim süresini kısalt')
  await expect(report).toContainText('İş: Yeni vardiya')
  await expect(report).toContainText('Ayrılan kaynak eksik')
  for (const width of [320, 360, 375, 390, 844, 820, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 820 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
  }
  await page.setViewportSize({ width: 320, height: 760 })
  await report
    .getByRole('heading', { name: 'Hedeflerin karar bağları' })
    .scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('hedef-baglari-320.png') })
})
