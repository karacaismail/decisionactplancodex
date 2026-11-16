import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { cafeExample } from '../src/cafe.ts'
import { createPlan, applyEdit, report, validatePlan } from '../src/domain.ts'
import { dossierDoc, routes } from '../src/dossier.ts'

const six = {
  'bes-neden': '07',
  'karar-matrisi': '18',
  'hoshin-kanri': '19',
  'kpi-tasarimi': '22',
  kanban: '23',
  'geri-bildirim-analizi': '26',
}
test('Altı kart ilgili adımda yerel uygulama rehberini açabilir', () => {
  const read = (name) =>
    JSON.parse(readFileSync(new URL('../src/data/' + name, import.meta.url)))
  const catalog = read('models.json'),
    help = read('methodHelp.json')
  assert.deepEqual(
    catalog
      .filter((m) => m.hasGuide)
      .map((m) => m.slug)
      .sort(),
    Object.keys(help).sort(),
  )
  for (const [slug, step] of Object.entries(six)) {
    assert.ok(catalog.find((m) => m.slug === slug)?.steps.includes(step), slug)
    assert.ok(help[slug]?.steps.length >= 2, slug)
  }
})
test('Yöntemler isteğe bağlıdır ve operasyon sonuçları hazırlığa sızmaz', () => {
  const p = createPlan('Boş plan')
  for (const kind of ['executive', 'action'])
    assert.doesNotMatch(report(p, kind), /## Kanban|## Karar Matrisi/)
  assert.equal(applyEdit(p, '23', 'wipLimit', 2), p)
  p.answers['23'] = {
    wipLimit: 1,
    board: [
      { İş: 'Kesim', Durum: 'Sürüyor' },
      { İş: 'Baskı', Durum: 'Engellendi', Engel: 'Malzeme yok' },
    ],
  }
  p.answers['26'] = {
    expected: 'İki vardiya',
    observed: 'Üç vardiya',
    next: 'Tedarik gününü değiştir',
    feedbackSource: 'Haftalık sayım',
  }
  p.answers['22'] = {
    metrics: [
      {
        Ölçü: 'Teslim süresi',
        Birim: 'gün',
        Eşik: '2',
        Başlangıç: '3',
        'Karşı ölçü': 'İade oranı',
      },
    ],
  }
  assert.ok(validatePlan(p))
  for (const kind of ['executive', 'action']) {
    const doc = report(p, kind)
    for (const value of [
      'Kanban',
      'Malzeme yok',
      'KPI Tasarımı',
      'İade oranı',
      'Geri Bildirim Analizi',
      'Üç vardiya',
      'Haftalık sayım',
    ])
      assert.ok(doc.includes(value), value)
  }
  assert.doesNotMatch(dossierDoc(p), /Malzeme yok|Haftalık sayım/)
})
test('Karar matrisi ağırlığı, değişim sınırını ve değişen adayı ayırır', async () => {
  const { matrixSummary, pairFor } = await import('../src/phaseMethods.ts')
  const p = cafeExample(),
    [left, right] = routes(p)
  p.answers['18'] = {
    matrixPair: [pairFor(p, left, right)],
    matrixScores: [
      { Ölçü: 'Süre', Ağırlık: '55', Birinci: '5', İkinci: '1' },
      { Ölçü: 'Bedel', Ağırlık: '45', Birinci: '1', İkinci: '5' },
    ],
  }
  assert.match(matrixSummary(p).join(' '), /3,2/)
  assert.match(matrixSummary(p).join(' '), /45/)
  for (const kind of ['executive', 'action'])
    assert.match(report(p, kind), /Karar Matrisi/)
  p.answers['11'].options[0].Çözüm = 'Başka yol'
  assert.match(matrixSummary(p).join(' '), /değişti/)
  assert.doesNotMatch(matrixSummary(p).join(' '), /3,2/)
  p.answers['18'].matrixScores[0].Ağırlık = '-1'
  assert.equal(validatePlan(p), false)
})

test('17. adımda dar izin yalnız izin verilen alanı açar ve devir raporunu korur', async () => {
  const { decide, allows, access } = await import('../src/readiness.ts')
  const { pairFor } = await import('../src/phaseMethods.ts')
  for (const field of ['18.choice', '18.route']) {
    const p = cafeExample()
    const grant = decide(p, {
      outcome: 'Koşullu hazır',
      owner: 'Ayşe',
      reason: 'Sadece izinli soruyu çalış.',
      reviewed: true,
      field,
      question: 'Hangi yolu incelemeli?',
      assignee: 'Ayşe',
      due: p.answers['02'].end,
      proof: 'Yol deneme sonucu',
    })
    assert.equal(allows(grant, '18', 'matrixScores'), field === '18.route')
    assert.equal(allows(grant, '23', 'board'), false)
    const pair = pairFor(grant, ...routes(grant))
    const next = applyEdit(grant, '18', 'matrixPair', [pair])
    assert.equal(next === grant, field === '18.choice')
    assert.equal(access(next).active, true)
    assert.equal(
      next.foundation.decisions.at(-1).dossier,
      grant.foundation.decisions.at(-1).dossier,
    )
  }
})
test('26. adım tarihli beklentiyi ve sonradan yazılmış tahmini ayırır', async () => {
  const { forecastLines } = await import('../src/phaseMethods.ts')
  const p = createPlan('Üretim')
  p.answers['22'] = {
    forecasts: [
      {
        Seçim: 's1',
        Beklenti: 'Beş gün',
        Kaynak: 'İş emri',
        Tarih: '2026-11-16',
        Zaman: 'Gözlem kaydından önce',
      },
    ],
  }
  assert.match(forecastLines(p, 's1').join(' '), /Beş gün/)
  assert.deepEqual(forecastLines(p, 's2'), [])
  p.answers['26'] = { observed: 'Altı gün' }
  assert.equal(validatePlan(p), true)
  assert.doesNotMatch(dossierDoc(p), /İş emri/)
})

test('Başka gözlemin kaynağı ve sonradan yazılan beklenti yeni bulguyu doğrulamaz', async () => {
  const { phaseMethodReport } = await import('../src/phaseMethods.ts')
  const p = createPlan('Atölye')
  p.answers['25'] = {
    actual: 'Erken geldi',
    benefit: 'Karşılandı',
    evidence: 'Başka vardiya fişi',
  }
  p.answers['26'] = {
    methodChoice: 's1',
    observed: 'Geç geldi',
    expected: 'Beş gün',
  }
  p.answers['22'] = {
    forecasts: [
      {
        Seçim: 's1',
        Beklenti: 'Altı gün',
        Kaynak: 'İlk fiş',
        Tarih: '2026-11-16',
        Zaman: 'Gözlem kaydından önce',
      },
      {
        Seçim: 's1',
        Beklenti: 'Beş gün',
        Kaynak: 'Son fiş',
        Tarih: '2026-11-16',
        Zaman: 'Gözlem kaydından sonra',
      },
    ],
  }
  const section = () =>
    phaseMethodReport(p, 's1').join('\n').split('## Geri Bildirim Analizi')[1]
  assert.doesNotMatch(section(), /Başka vardiya fişi/)
  assert.match(section(), /kaynağı eksik/)
  assert.match(section(), /önce yazıldığı doğrulanmadı/)
  for (const kind of ['executive', 'action'])
    assert.match(
      report(p, kind).split('## Önceki seçimin gözlemi')[1].split('##')[0],
      /kaynağı eksik/,
    )
  p.answers['22'].forecasts[0].Beklenti = 'Beş gün'
  assert.doesNotMatch(section(), /önce yazıldığı doğrulanmadı/)
})

test('Yeni seçim önceki iş ve gözlemi kendi sonucu olarak kullanmaz', async () => {
  const { phaseMethodReport, resetForChoice } =
    await import('../src/phaseMethods.ts')
  const p = createPlan('Vardiya')
  p.answers['23'] = {
    methodChoice: 'a',
    board: [{ İş: 'Eski teslim', Durum: 'Sürüyor' }],
  }
  p.answers['26'] = {
    methodChoice: 'a',
    observed: 'A yolunda gecikme',
    feedbackSource: 'Vardiya A',
  }
  p.answers['22'] = {
    forecasts: [
      {
        Seçim: 'b',
        Beklenti: 'B yolu beklentisi',
        Kaynak: 'B planı',
        Tarih: '2026-11-16',
        Zaman: 'Gözlem kaydından önce',
      },
    ],
  }
  const all = phaseMethodReport(p, 'b').join('\n')
  assert.match(all, /Önceki seçimin Kanban kaydı/)
  assert.match(all, /Önceki seçimin gözlemi/)
  assert.doesNotMatch(
    all.split('Önceki seçimin gözlemi').at(-1),
    /B yolu beklentisi/,
  )
  const draft = resetForChoice(p, '26', 'b')
  assert.equal(draft.observed, undefined)
  assert.equal(draft.methodChoice, 'b')
  assert.match(draft.methodHistory[0].Özet, /A yolunda gecikme/)
})

test('Yeni çalışma yalnız davranış örüntüsü içeren eski kaydı da saklar', async () => {
  const { resetForChoice, phaseMethodReport } =
    await import('../src/phaseMethods.ts')
  const p = createPlan('Atölye')
  p.answers['26'] = {
    pattern: 'Gece vardiyasında teslim uzadı',
    patternSource: 'Gece çizelgesi',
  }
  p.answers['26'] = resetForChoice(p, '26', 'yeni')
  for (const detail of ['Gece vardiyasında teslim uzadı', 'Gece çizelgesi']) {
    assert.ok(p.answers['26'].methodHistory[0]?.Özet.includes(detail), detail)
    assert.ok(phaseMethodReport(p, 'yeni').join(' ').includes(detail), detail)
  }
})

test('Beklentinin zamanı aynı seçimin kalıcı gözlemine göre belirlenir', async () => {
  const { forecastRecord } = await import('../src/phaseMethods.ts')
  const p = createPlan('Vardiya')
  const timing = () => forecastRecord(p, 'b', '2026-11-16').Zaman
  p.answers['26'] = { methodChoice: 'a', observed: 'Eski gözlem' }
  assert.equal(timing(), 'Gözlem kaydından önce')
  p.cycleReviews = [
    { choice: 'İkinci vardiya', choiceId: 'b', observed: 'Kayda geçen gözlem' },
  ]
  assert.equal(timing(), 'Gözlem kaydından sonra')
  p.cycleReviews = []
  p.answers['25'] = { actual: 'Seçimi bilinmeyen eski gözlem' }
  assert.equal(timing(), 'Gözlem sırası bilinmiyor')
  p.answers['25'] = {}
  p.observedChoices = ['b']
  assert.equal(timing(), 'Gözlem kaydından sonra')
  const { validateMethodUpdate } = await import('../server/method-update.mjs')
  assert.throws(
    () => validateMethodUpdate(p, { ...p, observedChoices: [] }),
    /koru/,
  )
})

test('Kurum kayıt denetimi yöntem iznini ve önceki beklentiyi korur', async () => {
  const { validateMethodUpdate } = await import('../server/method-update.mjs')
  const p = createPlan('Atölye')
  const q = structuredClone(p)
  q.answers['23'] = { wipLimit: 2 }
  assert.throws(() => validateMethodUpdate(p, q), /izin/)
  q.answers = {}
  assert.doesNotThrow(() => validateMethodUpdate(p, q))
  p.answers['22'] = {
    forecasts: [
      {
        Seçim: 's1',
        Beklenti: 'Bir gün',
        Kaynak: 'Sipariş',
        Tarih: '2026-11-16',
        Zaman: 'Gözlem kaydından önce',
      },
    ],
  }
  q.answers['22'] = { forecasts: [] }
  assert.throws(() => validateMethodUpdate(p, q), /beklenti/)
})
