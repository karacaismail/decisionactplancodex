import test from 'node:test'
import assert from 'node:assert/strict'
import { cafeExample } from '../src/cafe.ts'
import {
  applyEdit,
  confirmStrategyChoice,
  freezeReports,
  report,
  validatePlan,
} from '../src/domain.ts'
import { decide, access } from '../src/readiness.ts'
import { dossierDoc } from '../src/dossier.ts'

function prepared() {
  let p = cafeExample()
  p.foundation.inputs.skills = 'Ekip hazır.'
  p.evidence.push({
    ...p.evidence[0],
    id: 'yetkinlik',
    step: '12',
    criteria: ['D4'],
  })
  p = applyEdit(p, '01', 'mandate', 'Yönetim kurulu kararı 8')
  return decide(p, {
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
}

function chosen() {
  let p = prepared()
  for (const [key, v] of Object.entries({
    choice: 'Sabah kahve arabası',
    rationale: 'Kısa bekleme',
    excluded: 'Büfe',
    actions: 'Sırayı kısalt',
    comparison: 'Talep gözlendi.',
    reconsider: 'İzin kalkarsa',
    diagnosis: 'Teslim sırası yavaş',
    policy: 'Beklemeyi teslimden önce azalt',
  }))
    p = applyEdit(p, '18', key, v)
  return confirmStrategyChoice(p, 'Ayşe')
}

test('Yetki belgesi geçişte saklanır, sonraki stratejik teşhis geçmiş devir dosyasına girmez', () => {
  const p = chosen()
  assert.ok(validatePlan(p))
  assert.ok(access(p).active)
  const frozen = p.foundation.decisions.at(-1).dossier
  assert.match(frozen, /Yönetim kurulu kararı 8/)
  assert.doesNotMatch(frozen, /Teslim sırası yavaş/)
  assert.match(report(p, 'executive'), /Beklemeyi teslimden önce azalt/)
  assert.doesNotMatch(dossierDoc(p), /Teslim sırası yavaş/)
})

test('Rapor kaydedilen seçime bağlı hedefin işini, ölçüsünü ve riskini ayrı bulur', () => {
  let p = chosen()
  const decision = p.strategyChoices.at(-1).id
  const risk = p.answers['17'].risks[0].Risk
  p = applyEdit(p, '19', 'objectives', [
    {
      _id: 'goal-a',
      _choice: decision,
      Hedef: 'Beklemeyi azalt',
      Sorumlu: 'Ayşe',
      'Ayrılan kaynak': 'İki vardiya',
      _risk: 'eski-' + encodeURIComponent(risk),
    },
  ])
  p = applyEdit(p, '19', 'goals', [
    {
      Görev: 'Sırayı düzenle',
      Sorumlu: 'Ayşe',
      'Kabul ölçüsü': 'Teslim fişi',
      'Başlatacak olay': 'Açılış',
      _objective: 'goal-a',
    },
  ])
  p = applyEdit(p, '22', 'metrics', [
    {
      Ölçü: 'Bekleme',
      Birim: 'Dakika',
      Eşik: '5',
      Başlangıç: '8',
      _objective: 'goal-a',
      'Beklenen etki': 'Erken hazırlık süreyi kısaltır',
    },
  ])
  assert.ok(validatePlan(JSON.parse(JSON.stringify(p))))
  for (const kind of ['action', 'executive']) {
    const text = report(p, kind)
    assert.ok(text.includes('Hedef: Beklemeyi azalt'))
    assert.ok(text.includes('İş: Sırayı düzenle'))
    assert.ok(text.includes('Ölçü: Bekleme'))
    assert.ok(text.includes('Risk: ' + risk))
    assert.ok(text.includes('Erken hazırlık süreyi kısaltır'))
    assert.doesNotMatch(text, /goal-a|_objective/)
  }
  const frozen = freezeReports(p)
  const removed = applyEdit(frozen, '19', 'objectives', [])
  assert.match(report(removed, 'executive'), /hedef bağlantısı eksik/i)
  assert.match(removed.publications.at(-1).executive, /Hedef: Beklemeyi azalt/)
  const stale = applyEdit(p, '18', 'policy', 'Başka bir ilke')
  assert.match(report(stale, 'action'), /Önceki seçime ait hedef/)
  assert.doesNotMatch(report(stale, 'executive'), /Hedef: Beklemeyi azalt/)
  const duplicate = structuredClone(p)
  duplicate.answers['19'].objectives.push({
    ...duplicate.answers['19'].objectives[0],
  })
  assert.equal(validatePlan(duplicate), false)
})

test('Plan dışı gelişme eski planı değiştirmeden kaynağıyla iki rapora girer', () => {
  const p = cafeExample()
  p.answers['26'] = {
    pattern: 'Müşteri teslimi kendisi üstlendi.',
    patternSource: 'Teslim kayıtları 7 ve 9',
  }
  assert.ok(validatePlan(p))
  for (const k of ['action', 'executive']) {
    assert.match(report(p, k), /Müşteri teslimi kendisi üstlendi/)
    assert.match(report(p, k), /Teslim kayıtları 7 ve 9/)
  }
  delete p.answers['26'].patternSource
  assert.match(report(p, 'executive'), /Gözlemin kaynağı eksik/)
})

test('Türkiye kamu planı yalnız açık seçimle görünür ve karşı teklif hedefle raporlanır', async () => {
  const { visibleFields } = await import('../src/domain.ts')
  const { steps } = await import('../src/data/steps.ts')
  const p = cafeExample()
  p.answers['00'].buyer = 'Kamu veya büyük kurum'
  const step = steps.find((s) => s.id === '01')
  const keys = () => visibleFields(p, step).map((f) => f.key)
  assert.ok(!keys().includes('publicBasis'))
  p.answers['00'].planningContext = 'Türkiye kamu idaresi'
  assert.ok(keys().includes('publicBasis'))
  p.answers['01'].publicBasis = 'Kuruma uygulanan planlama dayanağı, sürüm 3.1'
  assert.match(dossierDoc(p), /sürüm 3\.1/)
  p.answers['00'].planningContext = 'Kurum içi çalışma'
  assert.doesNotMatch(dossierDoc(p), /sürüm 3\.1/)
  const q = chosen()
  q.answers['19'] = {
    objectives: [
      {
        _id: 'hedef-1',
        _choice: q.strategyChoices.at(-1).id,
        Hedef: 'Zamanında teslim',
        'Ekibin karşı önerisi': 'Önce iki vardiyada deneyelim',
      },
    ],
  }
  assert.match(report(q, 'action'), /Önce iki vardiyada deneyelim/)
})

test('Hedefsiz ölçünün varsayımı ve tek başına yazılan ekip yanıtı iki raporda da korunur', () => {
  const p = chosen()
  p.answers['19'] = {
    objectives: [
      {
        _id: 'g1',
        _choice: p.strategyChoices.at(-1).id,
        Hedef: 'Teslim',
        'Karşı öneriye yanıt': 'Bir vardiya ayırdık.',
      },
    ],
  }
  p.answers['22'] = {
    metrics: [
      { Ölçü: 'İade', 'Beklenen etki': 'Erken kontrol iadeyi azaltır.' },
    ],
  }
  const copy = JSON.parse(JSON.stringify(p))
  assert.ok(validatePlan(copy))
  for (const kind of ['action', 'executive']) {
    const doc = report(copy, kind)
    assert.match(doc, /İade ölçüsü için hedef bağlantısı eksik/)
    assert.match(doc, /Sınanacak varsayım: Erken kontrol iadeyi azaltır/)
    assert.match(doc, /Karşı öneri yazılmadı/)
    assert.match(doc, /Yanıt: Bir vardiya ayırdık/)
  }
})

test('Aynı adlı hedef ve riskler ayırt edilir, eski belirsiz riskin çözümü görünür', async () => {
  const { rowRelation, strategyTrace } = await import('../src/strategyLinks.ts')
  const p = chosen()
  const choice = p.strategyChoices.at(-1).id
  p.answers['19'] = {
    objectives: ['g1', 'g2'].map((_id) => ({
      _id,
      _choice: choice,
      Hedef: 'Teslim',
      Sorumlu: 'Ali',
    })),
  }
  p.answers['17'].risks = [
    { Risk: 'Kur', _id: 'r1' },
    { Risk: 'Kur', _id: 'r2' },
    { Risk: 'Eski' },
    { Risk: 'Eski' },
  ]
  for (const [step, key] of [
    ['19', 'goals'],
    ['19', 'objectives'],
  ]) {
    const options = rowRelation(p, step, key, choice).options
    assert.equal(options.length, 2)
    assert.equal(new Set(options.map((v) => v.label)).size, 2)
  }
  assert.ok(
    strategyTrace(p, choice).some(
      (s) => s.includes('17. adımda') && s.includes('Eski'),
    ),
  )
})
