import assert from 'node:assert/strict'
import test from 'node:test'
import { cafeExample } from '../src/cafe.ts'
import { today, validatePlan, applyEdit } from '../src/domain.ts'
import { evaluate, decide, access, allows } from '../src/readiness.ts'
import { dossierDoc } from '../src/dossier.ts'
import { researchResult } from '../src/research.ts'
import { offerBasis } from '../src/proofReview.ts'

const demand = (p) => p.evidence.find((e) => e.criteria?.includes('Z6'))
const ok = (p, id) => evaluate(p).rows.find((r) => r.id === id).ok
const input = () => ({
  owner: 'Ayşe',
  reason: 'Dosyayı okudum.',
  reviewed: true,
  outcome: 'Koşullu hazır',
  field: '18.choice',
  question: 'Sabah araç kiralansın mı?',
  assignee: 'Ayşe',
  due: today(),
  proof: 'Kira teklifi',
})
const addSupport = (p) => {
  p.foundation.inputs.skills = 'Bir barista çalışabilir.'
  p.evidence.push({
    ...p.evidence[0],
    id: 'staff',
    step: '12',
    criteria: ['D4'],
  })
}
test('Talep yalnız aynı grup, yer, dönem ve teklif için sayılır', () => {
  for (const patch of [
    { customerGroup: 'Konuklar' },
    { period: 'Gece' },
    { place: 'Başka durak' },
    { observed: '2000-01-01' },
  ]) {
    const p = cafeExample()
    Object.assign(demand(p), patch)
    assert.equal(ok(p, 'Z6'), false, JSON.stringify(patch))
    assert.ok(validatePlan(p))
  }
  const p = cafeExample()
  p.foundation.inputs.price = '100'
  assert.equal(ok(p, 'Z6'), false)
  assert.match(dossierDoc(p), /Kaydedilen sonuç: 14 teklif, 7 taahhüt, 0 ödeme/)
  assert.match(
    dossierDoc(p),
    /Bu denemede kanıtla doğrulanan müşteri sayısı: 0/,
  )
})
test('Eski kayıt okunur, geçerliliği ve kapsamı incelenene kadar izin vermez', () => {
  const p = cafeExample(),
    e = demand(p)
  delete e.review
  assert.ok(validatePlan(p))
  assert.equal(ok(p, 'Z6'), false)
  assert.match(dossierDoc(p), /incele/i)
})
test('Belge süresi ve koşul değişikliği eski kararı kapatır, eski rapor korunur', () => {
  const p = decide(cafeExample(), input()),
    snapshot = p.foundation.decisions[0].dossier
  const e = p.evidence.find((e) => e.criteria?.includes('Z9'))
  e.review = { ...e.review, until: '2000-01-01' }
  assert.equal(ok(p, 'Z9'), false)
  assert.equal(access(p).active, false)
  assert.equal(p.foundation.decisions[0].dossier, snapshot)
})
test('Kritik kira varsayımı karara bağlanır, araştırma açıkken taahhüt bekler', () => {
  const p = cafeExample()
  addSupport(p)
  p.foundation.assumptions = [
    {
      id: 'ask',
      claim: 'Ücretli satış yeter.',
      impact: 'Kira',
      refute: 'Gelir düşer',
      status: 'Denenmedi',
      critical: true,
      evidence: '',
      route: 'kafe-araba',
      question: 'Sabah araç kiralansın mı?',
      commitment: 'Yıllık kira',
    },
  ]
  assert.ok(validatePlan(p))
  assert.equal(evaluate(p).outcome, 'Koşullu hazır')
  assert.throws(() => decide(p, { ...input(), outcome: 'Planlamaya hazır' }))
  const q = decide(p, input())
  assert.ok(allows(q, '18', 'choice'))
  assert.equal(allows(q, '20', 'ready'), false)
  assert.match(dossierDoc(q).split('## Açık kararlar')[0], /Yıllık kira/)
})
test('Yol seçilmeden koşullu izin veya doğrudan kayıt 90 günlük işi açamaz', () => {
  const p = cafeExample()
  assert.throws(() => decide(p, { ...input(), field: '19.goals' }))
  const q = decide(p, input())
  assert.equal(applyEdit(q, '19', 'goals', []), q)
})
test('Koşullu kararla yol ve gerekçe tamamlanınca ayrı izin iş sırasını açar', () => {
  let p = decide(cafeExample(), { ...input(), field: '18.route' })
  assert.equal(allows(p, '19', 'goals'), false)
  for (const [field, value] of Object.entries({
    choice: 'Sabah kahve arabası',
    rationale: 'Talep durakta görüldü.',
    excluded: 'Büfe',
    reconsider: 'Durak taşınırsa.',
  }))
    p = applyEdit(p, '18', field, value)
  p = decide(p, {
    ...input(),
    field: '19.goals',
    question: 'Deneme işleri hangi sırayla yapılacak?',
  })
  assert.ok(allows(p, '19', 'goals'))
  assert.equal(allows(p, '20', 'ready'), false)
})
test('Eski karşı bulgu gerekçe ve yeni geçerli kaynağa bağlanınca geçmişte kalır', () => {
  const p = cafeExample(),
    fresh = demand(p)
  const old = structuredClone(fresh)
  old.id = 'eski-itiraz'
  old.stance = 'Karşı bulgu'
  p.evidence.push(old)
  p.foundation.inputs.price = '100'
  fresh.review.offer = offerBasis(p)
  assert.equal(ok(p, 'Z6'), false)
  old.review.replacement = fresh.id
  old.review.reason = 'Yeni fiyat için ayrı bir teklif yapıldı.'
  assert.ok(ok(p, 'Z6'))
  assert.match(dossierDoc(p), /Yeni fiyat için ayrı bir teklif yapıldı/)
  fresh.review.changed = true
  assert.equal(ok(p, 'Z6'), false)
})
test('Ortak bağımlılık bilinen yolları ve doğrulanmış bağımsız yolu ayırır', () => {
  const p = cafeExample()
  p.answers['11'].options.push({
    _id: 'bufe',
    Çözüm: 'Büfe',
    Bedel: 'Kira',
    Dayanak: 'Teklif',
  })
  const study = {
    id: 'alan',
    method: 'dependency',
    values: {
      name: 'Alan izni',
      routeIds: '["kafe-araba","bufe"]',
      unaffected: '["current"]',
      independent: p.evidence[1].id,
      proof: p.evidence[0].id,
      consequence: 'İki satış yeri kapanır.',
    },
  }
  p.foundation.brief.studies.push(study)
  const lines = researchResult(p, study).join('\n')
  assert.match(lines, /Büfe/)
  assert.match(lines, /Evde hazırlama/)
  assert.match(dossierDoc(p), /İki satış yeri kapanır/)
  assert.ok(validatePlan(p))
})
test('Beklenmeyen olay bir iddia gerektirmez; kaynak, izleme ve geçmiş korunur', () => {
  const p = cafeExample()
  p.evidence.push({
    id: 'surprise',
    step: '17',
    at: new Date().toISOString(),
    kind: 'Gözlem',
    observed: today(),
    title: 'Durak aniden boşaldı',
    source: 'Görevli',
    place: 'Durak',
    surprise: {
      status: 'Açık',
      missingGroup: 'Gece yolcuları',
      owner: 'Ayşe',
      due: today(),
      question: 'Diğer durakta ne oldu?',
    },
  })
  assert.ok(validatePlan(p))
  const doc = dossierDoc(p)
  for (const value of [
    'Durak aniden boşaldı',
    'Gece yolcuları',
    'Diğer durakta ne oldu?',
  ])
    assert.ok(doc.includes(value), value)
  p.evidence.at(-1).surprise.status = 'Kapandı'
  assert.equal(validatePlan(p), false)
})
test('Açık araştırma varsayımı taahhüt içermiyorsa tam izin mümkün kalır', () => {
  const p = cafeExample()
  addSupport(p)
  p.foundation.assumptions = [
    {
      id: 'a',
      claim: 'Öğle talebi',
      impact: 'Araştırma',
      refute: 'Sipariş yok',
      critical: true,
      status: 'Denenmedi',
      evidence: '',
      exposure: 'Araştırma',
      question: 'first',
      route: 'kafe-araba',
    },
  ]
  assert.equal(evaluate(p).outcome, 'Planlamaya hazır')
  const stale = structuredClone(p)
  stale.foundation.assumptions[0].route = 'kaldırıldı'
  assert.equal(evaluate(stale).outcome, 'Koşullu hazır')
  stale.foundation.assumptions[0].route = 'kafe-araba'
  stale.foundation.assumptions[0].question = 'kaldırıldı'
  assert.equal(evaluate(stale).outcome, 'Koşullu hazır')
  assert.throws(() =>
    decide(p, {
      ...input(),
      outcome: 'Planlamaya hazır',
      materialSupports: ['D6'],
    }),
  )
  const q = decide(p, {
    ...input(),
    outcome: 'Planlamaya hazır',
    materialSupports: ['D6'],
    supportReason: 'Kira kararı ikinci görüş bekler.',
  })
  assert.ok(validatePlan(q))
  assert.match(
    q.foundation.decisions[0].dossier,
    /Kira kararı ikinci görüş bekler/,
  )
})
test('Süre dolduğu günün ertesi günü imzalı karar yeni düzenlemeyi kapatır', () => {
  const p = cafeExample(),
    e = demand(p)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const day =
    tomorrow.getFullYear() +
    '-' +
    String(tomorrow.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(tomorrow.getDate()).padStart(2, '0')
  e.review.until = today()
  addSupport(p)
  const q = decide(p, { ...input(), outcome: 'Planlamaya hazır' })
  assert.equal(allows(q, '18', 'choice'), true)
  assert.equal(allows(q, '18', 'choice', day), false)
  assert.match(q.foundation.decisions[0].dossier, /Geçerliliği incelendi/)
})
test('Bağımsızlığı belgelenmemiş başka bir yol otomatik yedek sayılmaz', () => {
  const p = cafeExample()
  const s = {
    method: 'dependency',
    values: {
      name: 'Alan izni',
      routeIds: '["kafe-araba"]',
      unaffected: '["current"]',
      proof: p.evidence[0].id,
    },
  }
  assert.match(
    researchResult(p, s).join('\n'),
    /henüz doğrulanmayan yollar: Evde hazırlama/,
  )
  const group = {
    method: 'group',
    values: {
      parent: 'Ortak dağıtım',
      commonTerms: 'Haftada 10 teslim',
      internalCost: '100 TL',
      outsideCost: '120 TL',
      proof: p.evidence[0].id,
    },
  }
  assert.match(researchResult(p, group).join('\n'), /doğrulayın/)
  group.values.outsideProof = p.evidence[1].id
  assert.match(researchResult(p, group).join('\n'), /100 TL, 120 TL/)
})
