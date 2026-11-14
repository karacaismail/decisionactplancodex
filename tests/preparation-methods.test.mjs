import test from 'node:test'
import assert from 'node:assert/strict'
import { cafeExample } from '../src/cafe.ts'
import { createPlan, validatePlan, today } from '../src/domain.ts'
import { dossierDoc } from '../src/dossier.ts'
import { evaluate, decide, access } from '../src/readiness.ts'
import {
  methodsFor,
  studyResult,
  setStudyValue,
} from '../src/preparationMethods.ts'
const record = (method, values, criteria) => ({
  id: method,
  method,
  values,
  ...(criteria ? { criteria } : {}),
})
test('hazırlık yöntemleri bağlama göre önerilir ve 18. adıma taşınmaz', () => {
  const p = createPlan('Deneme')
  assert.deepEqual(methodsFor(p, '18'), [])
  assert.ok(!methodsFor(p, '08').some((m) => m.suggested))
  p.answers['00'] = { buyer: 'İşletme' }
  assert.ok(methodsFor(p, '08').some((m) => m.id === 'buyer' && m.suggested))
  const cafe = cafeExample()
  assert.ok(
    methodsFor(cafe, '16').some((m) => m.id === 'sensitivity' && m.suggested),
  )
})
test('devir altı yöntemi, tarihli kanıtı ve koşula göre satış eşiğini taşır', () => {
  const p = cafeExample(),
    outcome = evaluate(p).outcome
  const evidence = p.evidence.find((e) => e.step === '07')
  const studies = [
    record('cause', {
      first: 'Uzaklık',
      other: 'Bekleme',
      finding: 'Kuyrukta kaldı',
      proof: evidence.id,
    }),
    record('buyer', {
      user: 'Yolcu',
      approver: 'Bütçe sahibi',
      blocker: 'Satın alma',
    }),
    record('value', {
      activity: 'Aynı gün teslim',
      benefit: 'Zaman kazancı',
      expense: '25 TL',
      route: 'kafe-araba',
    }),
    record(
      'compare',
      {
        left: 'current',
        right: 'kafe-araba',
        metric: 'Sipariş',
        conditions: 'Aynı sabah',
        leftTotal: '10',
        leftHits: '2',
        rightTotal: '20',
        rightHits: '8',
      },
      [
        {
          id: 'c1',
          label: 'Hız',
          weight: '2',
          leftScore: '2',
          rightScore: '4',
        },
      ],
    ),
    record('sensitivity', {
      route: 'kafe-araba',
      condition: 'Çekirdek pahalanır',
      cost: '40',
      volume: '45',
      quadrant: 'lowLow',
    }),
    record('learning', {
      expected: 'Yoğun ilgi',
      observed: 'Sabah yoğun',
      revision: 'Öğle varsayımını incele',
      proof: evidence.id,
    }),
  ]
  Object.assign(p.foundation.brief, { axisA: 'Talep', axisB: 'Kira', studies })
  assert.equal(validatePlan(JSON.parse(JSON.stringify(p))), true)
  assert.equal(evaluate(p).outcome, outcome)
  const doc = dossierDoc(p)
  for (const s of [
    'Kuyrukta kaldı',
    'Bütçe sahibi',
    'Aynı gün teslim',
    'Aynı sabah',
    'Çekirdek pahalanır',
    'Öğle varsayımını incele',
    evidence.title,
    '40 satış',
    '50 satış',
    '200 TL açık',
    '%20',
    '%40',
    'Hız',
  ])
    assert.ok(doc.includes(s), s)
  const signed = decide(p, {
    outcome: 'Koşullu hazır',
    owner: 'Ayşe',
    reviewed: true,
    reason: 'Denemeyi incele',
    field: '18.choice',
    question: 'Hangi yol?',
    assignee: 'Ayşe',
    due: today(),
    proof: 'Sayım',
  })
  assert.ok(access(signed).active)
  assert.match(signed.foundation.decisions[0].dossier, /Çekirdek pahalanır/)
  const old = signed.foundation.decisions[0].dossier
  signed.foundation.brief.studies[4].values.cost = '60'
  assert.equal(access(signed).active, false)
  assert.equal(signed.foundation.decisions[0].dossier, old)
  p.evidence = p.evidence.filter((e) => e.id !== evidence.id)
  assert.match(dossierDoc(p), /Bağlı kanıt kaldırıldı/)
})
test('hesap kayıp girdiyi sıfır saymaz, zarar ve ücretsiz hizmet ayrı hesaplanır', () => {
  const p = cafeExample(),
    calc = (values) => studyResult(p, record('sensitivity', values)).join(' ')
  assert.match(
    calc({ route: 'kafe-araba', price: '30', cost: '30' }),
    /karşılayamaz/,
  )
  assert.match(calc({ route: 'kafe-araba', fixed: '0', cost: '0' }), /0 satış/)
  assert.match(calc({ route: 'kaldırıldı', price: '90' }), /Yol kaldırıldı/)
  assert.match(
    calc({ route: 'kafe-araba', cost: '40', volume: '0' }),
    /2000 TL açık/,
  )
  p.answers['00'].mode = 'Ücretsiz hizmet'
  Object.assign(p.answers['16'], { fund: 100, serviceCost: 80 })
  const free = calc({ fund: '70' })
  assert.match(free, /10 TL açık/)
  assert.doesNotMatch(free, /satış/)
})
test('karşılaştırma eksik veya çakışan veriyle puan üretmez', () => {
  const p = cafeExample(),
    root = {
      left: 'current',
      right: 'kafe-araba',
      leftTotal: '5',
      leftHits: '6',
    }
  const rows = [
    { id: 'c', label: 'Hız', weight: '3', leftScore: '5', rightScore: '' },
  ]
  const run = (v, cs = rows) =>
    studyResult(p, record('compare', v, cs)).join(' ')
  assert.match(run(root), /aşamaz/)
  assert.doesNotMatch(run(root), /Ağırlıklı sonuç/)
  assert.match(run({ ...root, right: 'current' }), /iki farklı yol/)
  assert.match(
    run({ ...root, leftHits: '0' }, [{ ...rows[0], rightScore: '2' }]),
    /Ağırlıklı sonuç/,
  )
  const changed = setStudyValue(
    record('compare', root, rows),
    'left',
    'kafe-araba',
  )
  assert.equal(changed.values.leftHits, undefined)
  assert.equal(changed.criteria[0].leftScore, '')
})
test('eski planlar okunur, bozuk yöntem kaydı kabul edilmez', () => {
  const p = cafeExample(),
    b = p.foundation.brief
  assert.ok(validatePlan(p))
  for (const invalid of [
    [record('fake', {})],
    [record('cause', { first: 5 })],
    [record('cause', {}), record('cause', {})],
    [record('sensitivity', { cost: '-4' })],
    [record('compare', {}, [{ id: 'bad' }])],
  ]) {
    b.studies = invalid
    assert.equal(validatePlan(p), false)
  }
})

test('aynı senaryo ve yol tek hesap kullanır, adedi iki ekranda aynı kalır', async () => {
  const { scenarioBudgetFor, scenarioVolume, setScenarioVolume } =
    await import('../src/dossier.ts')
  const p = cafeExample(),
    b = p.foundation.brief
  const s = record('sensitivity', {
    route: 'kafe-araba',
    quadrant: 'lowLow',
    volume: '45',
    cost: '40',
  })
  Object.assign(b, {
    axisA: 'Talep',
    axisB: 'Kira',
    studies: [s],
    scenarios: { lowLow: { units: { 'kafe-araba': '20' } } },
  })
  assert.equal(scenarioVolume(p, 'lowLow', 'kafe-araba'), '45')
  p.foundation.brief = setScenarioVolume(b, 'lowLow', 'kafe-araba', '60')
  assert.match(scenarioBudgetFor(p, 'lowLow', 'kafe-araba'), /400 TL fazla/)
  assert.match(
    studyResult(p, p.foundation.brief.studies[0]).join(' '),
    /60 satışta 400 TL fazla/,
  )
  const renamed = setStudyValue(s, 'route', 'current')
  assert.equal(renamed.values.quadrant, undefined)
  p.foundation.brief.studies.push({ ...s, id: 'ikinci' })
  assert.equal(validatePlan(p), false)
})
