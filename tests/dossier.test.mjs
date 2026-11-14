import test from 'node:test'
import assert from 'node:assert/strict'
import { cafeExample } from '../src/cafe.ts'
import { access, decide, evaluate, invalidate } from '../src/readiness.ts'
import { today, validatePlan } from '../src/domain.ts'
import * as dossier from '../src/dossier.ts'

const decision = {
  outcome: 'Koşullu hazır',
  owner: 'Ayşe',
  reviewed: true,
  reason: 'Satış yolunu karşılaştır.',
  field: '18.choice',
  question: 'Hangi durak?',
  assignee: 'Ayşe',
  due: today(),
  proof: 'Sayım',
}
test('devir özeti mevcut veriyi ve bilinmeyenleri ayırır', () => {
  const p = cafeExample()
  const doc = dossier.dossierDoc(p)
  for (const term of [
    'Strateje devir raporu',
    '14 teklif',
    '7 taahhüt',
    '0 ödeme',
    'Evde hazırlama',
    'Sabah kahve arabası',
    'Bilinmiyor',
    '40',
    'Duraktan geçen yolcular',
  ])
    assert.ok(doc.includes(term), term)
  assert.equal(p.answers['18'], undefined)
})
test('kayıtlı devir korunur ve sonradan değişen karşılaştırma izni kapatır', () => {
  const p = cafeExample()
  const signed = decide(p, decision)
  const old = signed.foundation.decisions[0].dossier
  assert.match(old, /Hangi durak/)
  const next = invalidate(signed, {
    ...signed,
    foundation: { ...signed.foundation, brief: { question: 'Başka kanal?' } },
  })
  assert.equal(access(next).active, false)
  assert.equal(next.foundation.decisions[0].dossier, old)
  assert.equal(validatePlan(JSON.parse(JSON.stringify(next))), true)
  assert.equal(
    validatePlan({
      ...next,
      foundation: { ...next.foundation, brief: { claims: 'yanlış' } },
    }),
    false,
  )
})
test('pahalı iki yol yalnız aynı ölçüyle belgelenmiş denemeyle yeterli olur', () => {
  const p = cafeExample()
  Object.assign(p.answers['11'], {
    risk: 'Yüksek',
    review: 'Bağımsız uzman kayıtları okudu.',
    options: [
      { _id: 'a', Çözüm: 'Araba', Bedel: 'Kira', Dayanak: 'Teklif' },
      { _id: 'b', Çözüm: 'Ofise teslim', Bedel: 'Taşıma', Dayanak: 'Rota' },
    ],
  })
  const ok = () => evaluate(p).rows.find((r) => r.id === 'Z5').ok
  assert.equal(ok(), false)
  const evidence = {
    ...p.evidence[0],
    id: 'araba-sayimi',
    step: '15',
    title: 'Araba satışı',
    kind: 'Ödeme',
  }
  p.evidence.push(evidence, {
    ...evidence,
    id: 'ofis-sayimi',
    title: 'Ofis satışı',
  })
  p.foundation.brief = {
    measure: 'Bir sabah içindeki ücretli satış',
    measureAt: today(),
    omitted: 'Sabit kafe bütçeyi aşıyor.',
    routes: {
      a: {
        difference: 'Durakta bardak satışı',
        result: '12 bardak',
        testProof: evidence.id,
        testBasis: JSON.stringify([
          'Bir sabah içindeki ücretli satış',
          today(),
        ]),
      },
      b: {
        difference: 'Ofise toplu teslim',
        result: '20 bardak',
        testProof: 'ofis-sayimi',
        testBasis: JSON.stringify([
          'Bir sabah içindeki ücretli satış',
          today(),
        ]),
      },
    },
  }
  assert.equal(ok(), true)
  p.evidence = p.evidence.filter((e) => e.id !== evidence.id)
  assert.equal(ok(), false)
})

test('kafe senaryolarında dönem ve maliyet üzerinden açık veya fazla hesaplanır', () => {
  const p = cafeExample()
  p.foundation.brief = {
    axisA: 'Talep',
    axisB: 'Kira',
    scenarios: {
      lowLow: {
        units: { current: '20' },
        effects: { current: 'Hizmet sürer' },
      },
    },
    routes: {
      current: {
        unitRevenue: '80',
        unitCost: '30',
        fixedCost: '2000',
        period: 'Gün',
      },
    },
  }
  assert.match(dossier.dossierDoc(p), /= -1000 TL[.] 1000 TL açık/)
  delete p.foundation.brief.routes.current.fixedCost
  assert.doesNotMatch(dossier.dossierDoc(p), /1000 TL açık/)
  assert.ok(validatePlan(p))
})
test('yeni öneri karar günündeki dosyaya yazılmaz ve hedef grup tek başına strateji olamaz', async () => {
  const { complete, applyEdit } = await import('../src/domain.ts')
  const { steps } = await import('../src/data/steps.ts')
  const p = cafeExample()
  p.foundation.inputs.skills = 'Kiralık araç'
  p.evidence.push({
    ...p.evidence[0],
    id: 'beceri',
    step: '12',
    criteria: ['D4'],
  })
  let q = decide(p, { ...decision, outcome: 'Planlamaya hazır' })
  const saved = q.foundation.decisions[0].dossier
  const step = steps.find((s) => s.id === '18')
  for (const [k, v] of Object.entries({
    choice: q.answers['08'].target,
    excluded: 'Sabit yer',
    rationale: 'Erişim',
    reconsider: 'İzin kaybı',
  }))
    q = applyEdit(q, '18', k, v)
  assert.equal(complete(q, step), false)
  q = applyEdit(q, '18', 'choice', 'Ofislere götürme')
  assert.equal(complete(q, step), false)
  q = applyEdit(q, '18', 'newComparison', [
    {
      Müşteri: 'Ofis ekipleri',
      'Erişim yolu': 'Toplu sipariş',
      'Tercih nedeni': 'Zaman kazancı',
      'Bedel ve süre': 'Tek sabah, 500 TL',
      'Vazgeçilecek iş': 'Sokak satışı',
      Dayanak: 'Teklif',
    },
  ])
  assert.equal(complete(q, step), true)
  assert.ok(validatePlan(q))
  assert.ok(access(q).active)
  assert.equal(q.foundation.decisions[0].dossier, saved)
})

test('eski onay okunur, kritik iddia ve kanıt sonradan değişirse izin kapanır', () => {
  const p = cafeExample()
  delete p.foundation.brief
  const q = decide(p, decision)
  const historical = structuredClone(q)
  const h = historical.foundation.decisions[0]
  delete h.dossier
  h.signature = JSON.stringify(JSON.parse(h.signature).slice(0, 6))
  assert.ok(validatePlan(historical))
  assert.ok(access(historical).active)
  const e = q.evidence.find((e) => e.criteria.includes('Z5'))
  const claim = {
    id: 'c',
    kind: 'Gözlem',
    text: 'Kira teklifi var',
    route: '',
    criterion: 'Z5',
    confidence: 'Orta',
    why: 'Yazılı teklif',
    support: e.id,
    counter: '',
    calculation: '',
  }
  p.foundation.brief = { claims: [claim] }
  assert.ok(evaluate(p).rows.find((r) => r.id === 'Z5').ok)
  claim.kind = 'Varsayım'
  assert.equal(evaluate(p).rows.find((r) => r.id === 'Z5').ok, false)
  assert.equal(
    access({
      ...historical,
      foundation: {
        ...historical.foundation,
        brief: { question: 'Yeni soru' },
      },
    }).active,
    false,
  )
})

test('deneme ilgisiz kanıtı, tekrar kullanılan sonucu ve değişmiş ölçüyü reddeder', () => {
  const p = cafeExample()
  p.answers['11'].risk = 'Yüksek'
  p.answers['11'].review = 'İkinci kişi inceledi'
  p.answers['11'].options = ['a', 'b'].map((id) => ({
    _id: id,
    Çözüm: id,
    Bedel: id,
    Dayanak: id,
  }))
  const [first] = p.evidence
  const b = (p.foundation.brief = {
    omitted: 'Kapalı yer',
    measure: 'Bardak',
    measureAt: today(),
    routes: {},
  })
  for (const id of ['a', 'b'])
    b.routes[id] = {
      difference: id,
      result: '12',
      testProof: first.id,
      testBasis: JSON.stringify([b.measure, b.measureAt]),
    }
  assert.equal(dossier.compareReady(p), false)
  for (const id of ['a', 'b']) {
    p.evidence.push({
      ...first,
      id: 'test-' + id,
      step: '15',
      kind: 'Gözlem',
      title: 'Yol denemesi ' + id,
    })
    b.routes[id].testProof = 'test-' + id
  }
  assert.equal(dossier.compareReady(p), true)
  b.routes.b.testProof = b.routes.a.testProof
  assert.equal(dossier.compareReady(p), false)
  b.routes.b.testProof = 'test-b'
  b.measure = 'Haftalık ciro'
  assert.equal(dossier.compareReady(p), false)
})
