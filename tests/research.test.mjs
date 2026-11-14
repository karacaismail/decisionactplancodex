import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cafeExample } from '../src/cafe.ts'
import { createPlan, validatePlan } from '../src/domain.ts'
import { dossierDoc } from '../src/dossier.ts'
import { evaluate } from '../src/readiness.ts'
import { methodsFor, studyResult } from '../src/preparationMethods.ts'
const row = (method, values, id = method) => ({ method, id, values })
test('Güç süzgeci beş sonucu ayırır ve boş cevabı hayır saymaz', () => {
  const p = cafeExample()
  for (const [answers, expected] of [
    [['Hayır'], 'İşe katkı sağlamıyor'],
    [['Evet', 'Hayır'], 'Eşitlik'],
    [['Evet', 'Evet', 'Hayır'], 'Geçici üstünlük'],
    [['Evet', 'Evet', 'Evet', 'Hayır'], 'Kullanılmayan güç'],
    [['Evet', 'Evet', 'Evet', 'Evet'], 'Kalıcı üstünlük adayı'],
    [['Evet'], 'Cevap bekleniyor'],
  ]) {
    const values = Object.fromEntries(
      answers.map((v, i) => [
        ['valuable', 'rare', 'costly', 'organized'][i],
        v,
      ]),
    )
    assert.match(
      studyResult(p, row('strength', values)).join(' '),
      new RegExp(expected),
    )
  }
})
test('Aynı dönemin ödenmemiş taahhüdü bütçeden bir kez düşer', () => {
  const p = cafeExample()
  p.answers['02'].budget = 100000
  p.answers['02'].spent = 30000
  const values = {
    budgetScope: '02. adımdaki bütçe',
    currency: 'TL',
    period: 'Yıl',
    unpaid: '50000',
  }
  assert.match(studyResult(p, row('budget', values)).join(' '), /20.000 TL/)
  assert.doesNotMatch(
    studyResult(p, row('budget', { ...values, unpaid: '' })).join(' '),
    /20.000 TL|70.000 TL/,
  )
  assert.doesNotMatch(
    studyResult(p, row('budget', { ...values, currency: 'EUR' })).join(' '),
    /20.000/,
  )
})
test('Koşul, karşı bulgu ve sonradan seçilen sınır devirde görünür', () => {
  const p = cafeExample(),
    a = p.evidence[0],
    b = { ...a, id: 'counter', criteria: [], stance: 'Karşı bulgu' }
  p.evidence.push(b)
  const s = row('factor', {
    name: 'Uygun teklif',
    measureType: 'Oran',
    hits: '0',
    total: '20',
    period: 'Hafta',
    support: a.id,
    counter: b.id,
    started: '2026-10-01',
    thresholdDay: '2099-01-01',
  })
  p.foundation.brief.studies = [s]
  assert.ok(validatePlan(p))
  const report = dossierDoc(p)
  for (const x of [
    'Uygun teklif',
    '%0',
    'Bulgular çelişiyor',
    'Sonradan belirlendi',
  ])
    assert.ok(report.includes(x), x)
  assert.equal(evaluate(p).outcome, 'Koşullu hazır')
  p.evidence.pop()
  assert.match(dossierDoc(p), /Bağlı kanıt kaldırıldı/)
  assert.doesNotMatch(
    studyResult(p, { ...s, values: { ...s.values, total: '0' } }).join(' '),
    /%0/,
  )
})
test('Kurum ve iş türü yalnız açık seçimden sonra önerilir', () => {
  const p = createPlan('Yeni iş')
  const has = (step, id) => methodsFor(p, step).some((m) => m.id === id)
  assert.ok(!has('12', 'group'))
  assert.ok(!has('08', 'marketplace'))
  p.answers['11'] = { risk: 'Yüksek' }
  assert.ok(has('16', 'budget'))
  assert.ok(!has('12', 'group'))
  p.answers['00'] = { groupLink: 'Evet', buyer: 'İki taraflı pazar' }
  assert.ok(has('12', 'group'))
  assert.ok(has('08', 'marketplace'))
})
test('Hazırlıkta bağlı her yöntemin yerel kullanım yardımı var', () => {
  const json = (name) =>
    JSON.parse(readFileSync(new URL('../src/data/' + name, import.meta.url)))
  const catalog = json('models.json'),
    guide = json('methodHelp.json')
  const used = catalog.filter((m) => m.steps.some((id) => id <= '18'))
  for (const m of used) {
    assert.ok(guide[m.slug]?.steps.length >= 2, m.slug)
    assert.ok(guide[m.slug].example, m.slug)
  }
  const at = (slug, id) =>
    catalog.find((m) => m.slug === slug).steps.includes(id)
  assert.ok(at('ab-testi', '15'))
  assert.ok(!at('monte-carlo-simulasyonu', '17'))
  assert.ok(at('lean-canvas', '10'))
  assert.ok(at('swot-analizi', '18'))
})
test('Yüksek geri dönüş bedelinde 12. adım güç incelemesi ister, kapının dokuz ölçütü korunur', async () => {
  const { steps } = await import('../src/data/steps.ts'),
    { complete } = await import('../src/domain.ts')
  const p = cafeExample()
  p.answers['11'].risk = 'Yüksek'
  const step = steps.find((s) => s.id === '12')
  const record = row('strength', {
    name: 'Erken erişim',
    valuable: 'Evet',
    rare: 'Evet',
    costly: 'Evet',
    organized: 'Evet',
  })
  p.foundation.brief.studies = [record]
  assert.equal(complete(p, step), false)
  assert.equal(evaluate(p).rows.find((r) => r.id === 'Z4').ok, true)
  record.values.proof = p.evidence[0].id
  assert.equal(complete(p, step), true)
})
test('Durum özeti fırsatı tehditten ayırır ve karar günündeki dosyayı korur', async () => {
  const { situation } = await import('../src/research.ts'),
    { decide } = await import('../src/readiness.ts'),
    { today } = await import('../src/domain.ts')
  const p = cafeExample()
  p.answers['04'] = {
    external: [
      { Koşul: 'Yeni durak', Yön: 'Fırsat' },
      { Koşul: 'Kira artışı', Yön: 'Tehdit' },
      { Koşul: 'Sınıfsız' },
    ],
  }
  p.foundation.brief.studies.push(
    row('cross', {
      route: 'kafe-araba',
      origin: 'Hangi gücümüzle hangi fırsatı kullanabiliriz?',
      name: 'Sabah seferleri',
    }),
  )
  const groups = situation(p)
  assert.deepEqual(
    groups.find((g) => g.title === 'Fırsatlar').items.map((i) => i.text),
    ['Yeni durak'],
  )
  assert.ok(!groups.flatMap((g) => g.items).some((i) => i.text === 'Sınıfsız'))
  assert.ok(validatePlan(p))
  const signed = decide(structuredClone(p), {
    outcome: 'Koşullu hazır',
    owner: 'Ayşe',
    reviewed: true,
    reason: 'İki yol incelenecek.',
    field: '18.choice',
    question: 'Hangi yol?',
    assignee: 'Ayşe',
    due: today(),
    proof: 'Sayım',
  })
  const snapshot = signed.foundation.decisions.at(-1).dossier
  signed.answers['18'] = { chosenOrigin: 'Sonradan eklendi' }
  signed.foundation.brief.studies.at(-1).values.name = 'Başka sefer'
  assert.match(snapshot, /Sabah seferleri/)
  assert.doesNotMatch(snapshot, /Başka sefer/)
  assert.doesNotMatch(dossierDoc(signed), /Sonradan eklendi/)
  assert.ok(validatePlan(p))
})
test('Açık borçların toplamında eski elle yazılan tutar ikinci kez düşülmez', () => {
  const p = cafeExample()
  Object.assign(p.answers['02'], { budget: 100000, spent: 30000 })
  const s = {
    ...row('budget', {
      budgetScope: '02. adımdaki bütçe',
      currency: 'TL',
      period: 'Proje',
      unpaid: '50000',
    }),
    pledges: [
      {
        id: 'kira',
        name: 'Kira',
        amount: '20000',
        due: '',
        owner: 'Ayşe',
        proof: '',
      },
      {
        id: 'cihaz',
        name: 'Cihaz',
        amount: '30000',
        due: '',
        owner: '',
        proof: '',
      },
    ],
  }
  p.answers['02'].contract = 'Evet'
  p.foundation.brief.studies = [s]
  assert.ok(validatePlan(p))
  assert.match(studyResult(p, s).join(' '), /20.000 TL/)
  assert.match(dossierDoc(p), /Cihaz/)
  s.pledges[1].amount = ''
  assert.doesNotMatch(studyResult(p, s).join(' '), /20.000 TL|50.000 TL/)
  s.pledges[1].amount = '-10'
  assert.equal(validatePlan(p), false)
})
test('Kaynak miktarı aynı dönem ve birimde üst sınırdır. Silinen yol hesaplanmaz.', () => {
  const p = cafeExample(),
    s = row('capacity', {
      route: 'kafe-araba',
      quantity: '10',
      unit: 'adet',
      period: 'Gün',
    })
  assert.match(studyResult(p, s).join(' '), /10 adet.*eşiğinin altında/)
  s.values.unit = 'saat'
  assert.doesNotMatch(
    studyResult(p, s).join(' '),
    /tahminleri satış eşiğine yetiyor/,
  )
  p.answers['11'].options = []
  assert.match(studyResult(p, s).join(' '), /Yol kaldırıldı/)
  assert.doesNotMatch(studyResult(p, s).join(' '), /40 adet/)
})
test('Karşı bulgu, nadirlik iddiasını veya üstünlüğü desteklemez', () => {
  const p = cafeExample(),
    e = { ...p.evidence[0], id: 'aksi', criteria: [], stance: 'Karşı bulgu' }
  p.evidence.push(e)
  for (const s of [
    row('strength', { name: 'Tek araç', rare: 'Evet', proof: e.id }),
    row('fit', {
      edge: 'Evet',
      benefit: 'Hız',
      bar: 'İzin',
      independent: e.id,
    }),
  ]) {
    const v = studyResult(p, s).join(' ')
    assert.match(v, /Karşı bulgu/)
    assert.doesNotMatch(v, /iddiasının dayanağı var/)
  }
})
test('Başlangıç gözlemi daha eski olsa da eşik deneme gününe göre değerlendirilir', () => {
  const p = cafeExample()
  const proof = p.evidence[1]
  proof.observed = '2025-10-01'
  const s = {
    ...row('factor', {
      threshold: 'Beş teklif',
      thresholdDay: '2025-11-13',
      started: '2025-11-15',
      support: proof.id,
    }),
    thresholdRecorded: '2025-11-13',
  }
  const result = () => studyResult(p, s).join(' ')
  assert.match(result(), /önce kaydedildi/)
  s.thresholdRecorded = '2025-11-17'
  assert.match(result(), /Sonradan belirlendi/)
})
test('02 bütçesi bütün araştırma süresine aittir', () => {
  const p = cafeExample()
  Object.assign(p.answers['02'], { budget: 100000, spent: 30000 })
  const result = studyResult(
    p,
    row('budget', {
      budgetScope: '02. adımdaki bütçe',
      currency: 'TL',
      period: 'Hafta',
      unpaid: '50000',
    }),
  ).join(' ')
  assert.match(result, /Araştırmanın tamamı/)
  assert.doesNotMatch(result, /Hafta/)
  assert.match(result, /20.000 TL/)
})
test('Deneme başlangıcı sonuçtan sonraysa önceden konmuş eşik gösterilmez', () => {
  const p = cafeExample()
  p.foundation.brief.studies = [row('compare', { observedAt: '2025-11-10' })]
  const s = {
    ...row('factor', {
      threshold: '5 teklif',
      thresholdDay: '2025-11-12',
      started: '2025-11-15',
      test: 'compare',
    }),
    thresholdRecorded: '2025-11-12',
  }
  const result = studyResult(p, s).join(' ')
  assert.match(result, /tarihlerini inceleyin/)
  assert.doesNotMatch(result, /önce kaydedildi/)
})
