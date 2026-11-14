import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cafeExample } from '../src/cafe.ts'
import {
  evaluate,
  decide,
  access,
  allows,
  foundationDoc,
} from '../src/readiness.ts'
import {
  createPlan,
  validatePlan,
  applyEdit,
  recordDecision,
  today,
} from '../src/domain.ts'

const form = (p, outcome = 'Koşullu hazır') => ({
  outcome,
  owner: p.answers['01'].owner,
  reason: 'Dayanaklar incelendi.',
  reviewed: true,
  field: '18.choice',
  question: 'Sabah hangi satış yolu daha iyi?',
  assignee: 'Ayşe',
  due: today(),
  proof: 'Kanal deneme kaydı',
})
test('boş ve eski planda strateji kapalıdır', () => {
  const p = createPlan('Yeni iş')
  assert.equal(evaluate(p).outcome, 'Henüz hazır değil')
  assert.equal(allows(p, '18', 'choice'), false)
  assert.equal(validatePlan(p), true)
})
test('ödemesiz geçiş üç destekle sınırlıdır. Kaynak değişirse izin kapanır', () => {
  let p = cafeExample()
  assert.equal(p.answers['18'], undefined)
  assert.equal(p.answers['15'].paid, 0)
  assert.equal(evaluate(p).required, 9)
  assert.equal(evaluate(p).support, 3)
  assert.throws(() => decide(p, form(p, 'Planlamaya hazır')))
  p = decide(p, form(p))
  assert.ok(validatePlan(JSON.parse(JSON.stringify(p))))
  assert.ok(allows(p, '18', 'choice'))
  assert.ok(!allows(p, '18', 'excluded'))
  assert.ok(!allows(p, '19', 'goals'))
  const saved = p.foundation.decisions[0].document
  const without = {
    ...p,
    evidence: p.evidence.filter((e) => !e.criteria?.includes('Z6')),
  }
  assert.equal(access(without).active, false)
  assert.equal(without.foundation.decisions[0].document, saved)
  assert.equal(applyEdit(without, '18', 'choice', 'Kira'), without)
  assert.equal(access(p, '2099-01-02').active, false)
  assert.throws(() => decide(p, form(p)))
})
test('dört destek tam geçişi açar. Durma kuralı ve karşı kanıt geçişi geri alır', () => {
  let p = cafeExample()
  const d = {
    ...p.evidence[0],
    id: 'dis-kosul',
    criteria: ['D5'],
    title: 'Dış koşul incelendi',
    step: '04',
  }
  p.evidence.push(d)
  p.answers['04'] = {
    external: [{ Koşul: 'İzin', İşaret: 'Bildirim', Sorumlu: 'Ayşe' }],
    review: today(),
  }
  assert.equal(evaluate(p).outcome, 'Planlamaya hazır')
  p = decide(p, form(p, 'Planlamaya hazır'))
  assert.ok(allows(p, '18', 'choice'))
  assert.ok(!allows(p, '19', 'goals'))
  assert.ok(!allows(p, '20', 'ready'))
  assert.ok(!allows(p, '21', 'anything'))
  assert.equal(
    access({
      ...p,
      answers: { ...p.answers, '02': { ...p.answers['02'], stopHit: 'Evet' } },
    }).active,
    false,
  )
  const counter = {
    ...d,
    id: 'itiraz',
    criteria: ['Z2'],
    stance: 'Karşı bulgu',
  }
  assert.equal(
    access({ ...p, evidence: [...p.evidence, counter] }).active,
    false,
  )
  assert.match(foundationDoc(p), /Müşteri hangi somut adımı attı/)
  assert.throws(() => decide(p, { ...form(p), owner: 'Başka kişi' }))
})
test('boş kanıt defteri talep aşamasına yeni onay vermez', () => {
  const p = cafeExample()
  p.evidence = []
  assert.throws(() =>
    recordDecision(p, 3, {
      outcome: 'İlerleyin',
      owner: 'Ayşe',
      reason: 'Görüştüm',
    }),
  )
})
test('geçersiz içe alma ve ilgisiz not ayırt edilir', () => {
  const p = decide(cafeExample(), form(cafeExample()))
  assert.ok(access({ ...p, name: 'Yeni ad' }).active)
  assert.ok(
    !validatePlan({ ...p, foundation: { ...p.foundation, version: 42 } }),
  )
  assert.ok(
    !validatePlan({ ...p, foundation: { ...p.foundation, decisions: [{}] } }),
  )
})

test('farklı hesap dönemi, tüketilen hak ve çelişen müşteri kaydı ilerletmez', () => {
  const p = cafeExample()
  const period = {
    ...p,
    foundation: {
      ...p.foundation,
      inputs: { ...p.foundation.inputs, costPeriod: 'Ay' },
    },
  }
  assert.equal(evaluate(period).required < 9, true)
  const spent = {
    ...p,
    history: Array.from({ length: 3 }, (_, i) => ({
      id: String(i),
      stage: 3,
      outcome: 'Yeniden deneyin',
      stale: false,
      reason: 'Deneme',
      owner: 'Ayşe',
      at: p.updatedAt,
    })),
  }
  assert.equal(evaluate(spent).outcome, 'Henüz hazır değil')
  const e = p.evidence.find((e) => e.criteria.includes('Z6'))
  const other = {
    ...p,
    evidence: [...p.evidence, { ...e, id: 'karşı', stance: 'Karşı bulgu' }],
    history: [0, 1, 2].map((stage) => ({
      stage,
      stale: false,
      outcome: 'İlerleyin',
    })),
  }
  assert.throws(() =>
    recordDecision(other, 3, {
      outcome: 'İlerleyin',
      reason: 'İncelendi',
      owner: 'Ayşe',
    }),
  )
})

test('alan değişikliği aynı koşulu uzatmaz. İçe alınan kopya eski yetkiyi kullanmaz', () => {
  const p = cafeExample(),
    q = decide(p, form(p))
  assert.throws(() => decide(q, { ...form(p), field: '19.goals' }))
  assert.equal(access({ ...q, id: 'kurum-kopyasi' }).active, false)
  assert.equal(access(q).active, true)
  assert.match(q.foundation.decisions[0].document, /Seçilen yol/)
})

test('aynı alıcı iki kez sayılmaz. Ödeme ve iki taraflı deneme ayrı kanıt ister', () => {
  const p = cafeExample()
  const proof = p.evidence.find((e) => e.criteria.includes('Z6'))
  const first = {
    ...p,
    evidence: p.evidence.map((e) =>
      e === proof ? { ...e, participants: ['K1', 'K1'] } : e,
    ),
  }
  const valid = (q) => evaluate(q).rows.find((r) => r.id === 'Z6').ok
  assert.equal(valid(first), false)
  const pay = {
    ...p,
    foundation: {
      ...p.foundation,
      inputs: { ...p.foundation.inputs, expectedSignal: 'Ödeme' },
    },
  }
  assert.equal(valid(pay), false)
  p.answers['00'].buyer = 'İki taraflı pazar'
  Object.assign(p.answers['08'], { other: 'Kahve sağlayanlar' })
  Object.assign(p.answers['15'], { otherCount: 1, matches: 1 })
  assert.equal(valid(p), false)
  p.evidence.push(
    {
      ...proof,
      id: 'ikinci',
      customerGroup: 'Kahve sağlayanlar',
      side: 'Diğer taraf',
      participants: ['S1'],
    },
    { ...proof, id: 'eşleşme', side: 'Eşleşme', participants: ['K1/S1'] },
  )
  assert.equal(valid(p), true)
})
test('tam geçişten sonra 90 günlük dosya kendi kaynak kararıyla uygulamayı açar', () => {
  const sample = cafeExample()
  sample.foundation.inputs.skills = 'Gezici hizmeti sunabilecek ekip var.'
  sample.evidence.push({
    ...sample.evidence[0],
    id: 'beceri',
    criteria: ['D4'],
    step: '12',
  })
  let p = decide(sample, form(sample, 'Planlamaya hazır'))
  p = applyEdit(p, '18', 'choice', 'Sabah kahve arabası')
  p = applyEdit(p, '18', 'rationale', 'Sabah erişimi durakta doğrulandı.')
  p = applyEdit(p, '18', 'reconsider', 'Durak izni sona ererse.')
  p = applyEdit(p, '18', 'excluded', 'Büyük kafe')
  p = applyEdit(p, '19', 'goals', [
    {
      Görev: 'Sınırlı deneme',
      Sorumlu: 'Ayşe',
      'Hedef tarih': today(),
      'Kabul ölçüsü': 'İzin ve bütçe',
    },
  ])
  for (const [key, value] of Object.entries({
    authority: 'Ayşe',
    basis: 'Onaylı kaynak',
    ready: 'Karşılandı',
  }))
    p = applyEdit(p, '20', key, value)
  p = recordDecision(p, 4, {
    outcome: 'İlerleyin',
    owner: 'Ayşe',
    reason: 'Kapsam ve kaynak onaylandı.',
  })
  assert.equal(allows(p, '21', 'scope'), true)
})

test('ücretsiz hizmette katılım ve bütçe gerekir. Ödeme gerekmez', () => {
  const p = cafeExample()
  Object.assign(p.answers['00'], { mode: 'Ücretsiz hizmet' })
  Object.assign(p.answers['14'], { budgetAuthority: 'Karşılandı' })
  Object.assign(p.answers['15'], { attended: 7 })
  Object.assign(p.answers['16'], { fund: 10000, serviceCost: 8000 })
  p.evidence.find((e) => e.criteria.includes('Z6')).kind =
    'Teslim veya kullanım'
  assert.equal(evaluate(p).required, 9)
  p.answers['16'].fund = 7999
  assert.equal(evaluate(p).outcome, 'Henüz hazır değil')
  p.answers['16'].fund = 10000
  p.answers['15'].attended = 4
  assert.equal(evaluate(p).outcome, 'Henüz hazır değil')
})
test('belirtilmeyen talep türü ve eski ikinci görüş yeni geçişe yetmez', async () => {
  const { reviewBasis } = await import('../src/readiness.ts')
  const p = cafeExample()
  delete p.foundation.inputs.expectedSignal
  assert.equal(evaluate(p).rows.find((r) => r.id === 'Z6').ok, false)
  p.foundation.inputs.expectedSignal = 'Yazılı taahhüt'
  Object.assign(p.foundation.inputs, {
    reviewer: 'İkinci kişi',
    reviewNote: 'Bütçeyi ve kaynakları okudum.',
  })
  p.evidence.push({
    ...p.evidence[0],
    id: 'ikinci',
    criteria: ['D6'],
    step: '17',
  })
  p.foundation.inputs.reviewVersion = reviewBasis(p)
  assert.equal(evaluate(p).support, 4)
  p.answers['02'].budget += 10
  assert.equal(evaluate(p).support, 3)
})
