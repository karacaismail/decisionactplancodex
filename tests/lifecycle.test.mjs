import test from 'node:test'
import assert from 'node:assert/strict'
import { phases, phaseOf, reviewDestinations } from '../src/lifecycle.ts'
import { steps } from '../src/data/steps.ts'
import { cafeExample } from '../src/cafe.ts'
import {
  confirmStrategyChoice,
  currentStrategyChoice,
  openGaps,
  complete,
  applyEdit,
  recordDecision,
  recordCycleReview,
  validatePlan,
  report,
  today,
} from '../src/domain.ts'
import { allows, decide, access } from '../src/readiness.ts'

function prepared() {
  const p = cafeExample()
  p.foundation.inputs.skills = 'Barista hazır.'
  p.evidence.push({
    ...p.evidence[0],
    id: 'beceri',
    step: '12',
    criteria: ['D4'],
  })
  return decide(p, {
    outcome: 'Planlamaya hazır',
    owner: 'Ayşe',
    reason: 'Kaynakları inceledim.',
    reviewed: true,
    field: '',
    question: '',
    assignee: '',
    due: '',
    proof: '',
  })
}
function chosen(p) {
  for (const [k, v] of Object.entries({
    choice: 'Sabah kahve arabası',
    rationale: 'Bekleme kısa.',
    excluded: 'Büfe',
    actions: 'Menüyü daralt ve durakta hazırla.',
    comparison: 'Durakta erişim doğrulandı.',
    reconsider: 'İzin kalkarsa.',
  }))
    p = applyEdit(p, '18', k, v)
  return p
}
function funded() {
  let p = confirmStrategyChoice(chosen(prepared()), 'Ayşe')
  p = applyEdit(p, '19', 'goals', [
    {
      Görev: 'Teslim',
      Sorumlu: 'Ayşe',
      'Başlatacak olay': 'İzin çıktığında',
      'Kabul ölçüsü': 'Teslim fişi',
    },
  ])
  for (const [k, v] of Object.entries({
    authority: 'Ayşe',
    basis: 'İzin kaydı',
    resources: 'Bir gün, iki kişi, 500 TL',
    ready: 'Karşılandı',
  }))
    p = applyEdit(p, '20', k, v)
  return recordDecision(p, 4, {
    outcome: 'İlerleyin',
    owner: 'Ayşe',
    reason: 'Kaynak ayrıldı.',
  })
}
test('Beş ana küme mevcut her adımı bir kez kapsar ve hazırlık sonrası on işi tanımlar', () => {
  assert.equal(phases.length, 5)
  assert.deepEqual(
    phases.slice(1).map((x) => x.tasks.length),
    [3, 3, 2, 2],
  )
  for (const s of steps) assert.ok(phaseOf(s.id))
  assert.deepEqual(
    ['17', '18', '21', '22', '23', '26', '33'].map((id) => phaseOf(id).id),
    [1, 2, 3, 3, 4, 5, 5],
  )
})
test('Teslim ve ölçü kaynak kararından önce planlanabilir, uygulama dayanak bekler', () => {
  const p = funded()
  assert.ok(validatePlan(p))
  const q = { ...p, history: p.history.filter((h) => h.stage !== 4) }
  assert.ok(allows(q, '22', 'metrics'))
  assert.equal(allows(q, '23', 'problem'), false)
  assert.equal(allows(p, '23', 'problem'), false)
  p.answers['21'] = { scope: 'İlk teslim', accept: 'Fiş' }
  p.answers['22'] = {
    metrics: [
      {
        Ölçü: 'Süre',
        Birim: 'Dakika',
        'İlk ölçüm yolu': 'İlk teslimde saat tut',
        Eşik: '5',
      },
    ],
    benefit: 'Kısa bekleme',
    harm: 'Kaza',
    source: 'Teslim fişi',
    checkpoint: 'İlk vardiya sonunda',
  }
  assert.ok(
    complete(
      p,
      steps.find((x) => x.id === '22'),
    ),
  )
  const gapsPlan = structuredClone(p)
  delete gapsPlan.answers['19'].goals[0]['Başlatacak olay']
  delete gapsPlan.answers['22'].metrics[0]['İlk ölçüm yolu']
  assert.ok(
    openGaps(gapsPlan, 4).some(
      (g) => g.value === '19.goals' && g.label.includes('1.'),
    ),
  )
  assert.ok(
    openGaps(gapsPlan, 5).some(
      (g) => g.value === '22.metrics' && g.label.includes('1.'),
    ),
  )
  assert.ok(allows(p, '23', 'problem'))
  assert.ok(validatePlan(p))
})
const review = (action) => ({
  action,
  expected: 'Süre kısalır.',
  observed: 'Süre uzadı.',
  source: 'Vardiya defteri',
  reason: 'Araba geç açıldı.',
  owner: 'Ayşe',
  assignee: 'Ece',
  next: 'Sonraki vardiyada',
  missing: '',
})
test('Yeniden karar geçmişi korunur ve nedenine göre doğru işe döner', () => {
  for (const [act, target] of [
    ['Planı düzelt', '19'],
    ['Yolu yeniden seç', '18'],
    ['Hazırlığa dön', '17'],
    ['Durdur', '34'],
    ['Tamamla', '34'],
    ['Sürdür', '23'],
    ['Kanıt bekle', '25'],
  ]) {
    const p = funded()
    const v = {
      ...review(act),
      missing: act === 'Kanıt bekle' ? 'Teslim süresi' : '',
    }
    const q = recordCycleReview(p, v)
    assert.equal(reviewDestinations[act], target)
    assert.equal(q.cycleReviews.at(-1).action, act)
    assert.ok(validatePlan(q))
    assert.match(report(q, 'executive'), /Vardiya defteri/)
    assert.match(report(q, 'action'), /Araba geç açıldı/)
    if (target === '17') assert.equal(access(q).active, false)
    if (['19', '18'].includes(target))
      assert.equal(allows(q, '23', 'problem'), false)
    assert.throws(() => recordCycleReview(p, { ...v, owner: 'Başka kişi' }))
  }
})
test('İzin yokken yeni çalışma başlatılamaz, zarar hâlinde inceleme beklemez', () => {
  assert.throws(() => recordCycleReview(cafeExample(), review('Sürdür')))
  const p = funded()
  p.answers['02'].danger = 'Var'
  assert.throws(() => recordCycleReview(p, review('Sürdür')))
  const q = recordCycleReview(p, review('Durdur'))
  assert.equal(q.cycleReviews.at(-1).action, 'Durdur')
  assert.equal(q.cycleReviews.at(-1).source, 'Vardiya defteri')
})

test('Yazılan yol tek başına seçim sayılmaz. Karar sahibi değişen yolu yeniden seçer.', () => {
  const p = chosen(prepared())
  assert.equal(allows(p, '19', 'goals'), false)
  assert.throws(() => confirmStrategyChoice(p, 'Ece'))
  const q = confirmStrategyChoice(p, 'Ayşe')
  assert.ok(currentStrategyChoice(q))
  assert.ok(allows(q, '19', 'goals'))
  const changed = applyEdit(q, '18', 'rationale', 'Yeni gerekçe')
  assert.equal(allows(changed, '19', 'goals'), false)
  assert.match(q.strategyChoices[0].choice, /Sabah/)
})

test('Koşullu karar yalnız izin verilen soruyu seçime taşır', () => {
  let p = cafeExample()
  p = decide(p, {
    outcome: 'Koşullu hazır',
    owner: 'Ayşe',
    reason: 'Küçük deneme',
    reviewed: true,
    field: '18.route',
    question: 'Durakta hangi yolu deneyelim?',
    assignee: 'Ayşe',
    due: p.answers['02'].end,
    proof: 'Teslim kaydı',
  })
  p = chosen(p)
  assert.equal(allows(p, '18', 'question'), false)
  p.answers['18'].question = 'Başka iş açalım mı?'
  assert.equal(
    confirmStrategyChoice(p, 'Ayşe').strategyChoices.at(-1).question,
    'Durakta hangi yolu deneyelim?',
  )
})
test('Ölçülen değer ve gözlem bekleme koşulu ayrı saklanır', () => {
  const p = funded(),
    step = steps.find((s) => s.id === '25')
  p.answers['25'] = {
    operating: 'Karşılandı',
    benefit: 'Karşılandı',
    group: 'Yolcular',
    period: 'İlk hafta',
    evidence: 'Süre kaydı',
  }
  assert.equal(complete(p, step), false)
  p.answers['25'].actual = 'Bekleme 12 dakikadan 8 dakikaya indi.'
  assert.ok(complete(p, step))
  assert.match(report(p, 'executive'), /12 dakikadan 8 dakikaya/)
  p.answers['25'].benefit = 'Bilinmiyor'
  assert.equal(complete(p, step), false)
  p.answers['25'].nextObservation = 'Sonraki vardiyada'
  assert.ok(complete(p, step))
})
test('Kapanış açık taahhütleri korur. İçe aktarılan eski izin yeni iş açmaz.', async () => {
  const d = await import('../src/domain.ts')
  for (const act of ['Durdur', 'Tamamla']) {
    const q = recordCycleReview(funded(), review(act))
    assert.ok(d.activeSteps(q).includes('34'))
    assert.ok(allows(q, '34', 'obligations'))
    assert.equal(allows(q, '23', 'problem'), false)
    assert.equal(allows(q, '20', 'resources'), false)
    const copy = d.copyPlan(q)
    assert.equal(allows(copy, '34', 'obligations'), false)
    assert.throws(() => recordCycleReview(copy, review('Durdur')))
    assert.equal(copy.cycleReviews.length, 1)
  }
  const teamCopy = d.copyPlan(funded(), true)
  assert.equal(teamCopy.answers['01'].owner, '')
  assert.equal(teamCopy.importedOwner, 'Ayşe')
  let p = d.copyPlan(funded())
  p = decide(p, {
    outcome: 'Planlamaya hazır',
    owner: 'Ayşe',
    reason: 'Yeni kopyayı inceledim.',
    reviewed: true,
    field: '',
    question: '',
    assignee: '',
    due: '',
    proof: '',
  })
  p = confirmStrategyChoice(p, 'Ayşe')
  assert.equal(allows(p, '25', 'evidence'), false)
})
