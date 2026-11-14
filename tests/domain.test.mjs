import { confirmStrategyChoice } from '../src/domain.ts'
import { cafeExample } from '../src/cafe.ts'
import { decide } from '../src/readiness.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createPlan,
  activeSteps,
  cash,
  recommend,
  recordDecision,
  report,
  validatePlan,
  applyEdit,
} from '../src/domain.ts'

test('yeni işte bilinmeyen para sıfır sayılmaz, ilk karar açıktır', () => {
  const p = createPlan('Atölye')
  assert.equal(cash(p).gap, null)
  assert.equal(recommend(p, 0).outcome, 'Bekletin')
})
test('ücretsiz ve ekip koşulları etkin yolu değiştirir', () => {
  const p = createPlan('Kütüphane')
  p.answers['00'] = {
    team: 'Ekip',
    mode: 'Ücretsiz hizmet',
    market: 'Yeni pazar',
    product: 'Hizmet',
  }
  assert.ok(activeSteps(p).includes('03'))
  assert.ok(activeSteps(p).includes('04'))
  assert.ok(!activeSteps(p).includes('12'))
})
test('ilk ödeme gününde nakit açığı varsa yatırım bekler', () => {
  const p = createPlan('Atölye')
  p.answers['16'] = {
    balance: 20000,
    due: 30000,
    price: 1000,
    cost: 700,
    fixed: 30000,
  }
  assert.deepEqual(cash(p), { gap: 10000, contribution: 300, breakEven: 100 })
  assert.equal(recommend(p, 4).outcome, 'Bekletin')
})
test('zarar ve eksik izin ilerleme kararından önce gelir', () => {
  const p = createPlan('İş')
  p.answers['02'] = { danger: 'Var' }
  assert.equal(recommend(p, 3).outcome, 'Durdurun')
  assert.throws(() =>
    recordDecision(p, 3, {
      outcome: 'İlerleyin',
      reason: 'istek',
      owner: 'Kurucu',
    }),
  )
})
test('sonuç ve çıktı aynı sürümün kayıtlarını kullanır', () => {
  const p = createPlan('Kütüphane')
  const q = recordDecision(p, 0, {
    outcome: 'Bekletin',
    reason: 'Ödenek bekleniyor',
    owner: 'Sorumlu',
    task: 'Ödeneği doğrula',
  })
  assert.equal(q.history.length, 1)
  assert.match(report(q, 'executive'), /Ödenek bekleniyor/)
  assert.match(report(q, 'action'), /Ödeneği doğrula/)
  assert.ok(validatePlan(q))
  assert.ok(!validatePlan({ name: 'X' }))
})
test('yanıt düzeltmesi eski onayın yeniden incelenmesini gerektirir', () => {
  const p = createPlan('İş')
  const q = recordDecision(p, 0, {
    outcome: 'Bekletin',
    reason: 'Bekle',
    owner: 'Kurucu',
  })
  const edited = applyEdit(q, '00', 'market', 'Yeni pazar')
  assert.equal(edited.history[0].reason, 'Bekle')
  assert.equal(edited.history[0].stale, true)
})

test('kanıttan önceki kararın iptali tüm sonraki kararları yeniden açar', () => {
  const p = createPlan('Kamu')
  p.history = [
    {
      id: 'a',
      stage: 1,
      stale: false,
      outcome: 'İlerleyin',
      reason: 'Kanıt',
      owner: 'Kurucu',
      at: new Date().toISOString(),
    },
  ]
  const q = recordDecision(p, 0, {
    outcome: 'Durdurun',
    reason: 'Kapsam kapandı',
    owner: 'Kurucu',
  })
  assert.equal(recommend(q, 0).outcome, 'Durdurun')
  assert.equal(q.history[0].stale, true)
})
test('erken büyüme seçimi önceki kaynak kararını yeniden açar', () => {
  const cafe = cafeExample()
  cafe.foundation.inputs.skills = 'İki barista ve kira sözleşmesi'
  cafe.evidence.push({
    ...cafe.evidence[0],
    id: 'beceri',
    step: '12',
    criteria: ['D4'],
  })
  let p = decide(cafe, {
    outcome: 'Planlamaya hazır',
    owner: 'Ayşe',
    reason: 'İncelendi',
    reviewed: true,
    field: '',
    due: '',
    question: '',
    assignee: '',
    proof: '',
  })
  p.answers['18'] = {
    choice: 'Sabah kahve arabası',
    rationale: 'Sabah talebi',
    excluded: 'Kafe kiralama',
    reconsider: 'İzin biterse',
  }
  p.answers['18'].actions = 'Durakta teslim et.'
  p.answers['18'].comparison = 'Durakta talep var.'
  p = confirmStrategyChoice(p, 'Ayşe')
  p.answers['19'] = {
    choiceBasis: 'Sabah kahve arabası',
    goals: [
      {
        Görev: 'İlk satışı gözle',
        Sorumlu: 'Ayşe',
        'Hedef tarih': '2026-11-16',
        'Kabul ölçüsü': 'Satış sayımı',
      },
    ],
  }
  p.answers['20'] = {
    ready: 'Karşılandı',
    authority: 'Ayşe',
    basis: 'Dayanak',
    resources: 'Bir vardiya',
  }
  p.history = [
    {
      id: 'strateji',
      stage: 4,
      outcome: 'İlerleyin',
      owner: 'Ayşe',
      reason: 'İzin',
      at: new Date().toISOString(),
      stale: false,
    },
    {
      id: 'a',
      stage: 6,
      stale: false,
      outcome: 'İlerleyin',
      reason: 'Kanıt',
      owner: 'Kurucu',
      at: new Date().toISOString(),
    },
  ]
  const q = applyEdit(p, '33', 'direction', 'Büyüt')
  assert.equal(q.history.find((h) => h.stage === 6).stale, true)
  assert.equal(q.history.find((h) => h.stage === 4).stale, false)
})
test('ücretsiz işte kişi başına gelir yerine hizmet kaynağı rapora girer', () => {
  const p = createPlan('Kamu')
  p.answers['00'] = { mode: 'Ücretsiz hizmet' }
  p.answers['16'] = { fund: 100, serviceCost: 10, price: 6000, cost: 50 }
  assert.match(report(p, 'executive'), /Hizmet bütçesi/)
  assert.doesNotMatch(report(p, 'executive'), /Sipariş başına katkı/)
})

test('nakit açığı, geçerli araştırma yetkisi ve dört onay varken yatırımı duraklatır', () => {
  const p = createPlan('Atölye')
  p.answers['02'] = {
    clearance: 'Yetki var',
    budget: 5000,
    spent: 100,
    attempts: 2,
    end: '2099-10-10',
  }
  p.history = [0, 1, 2, 3].map((stage) => ({
    stage,
    id: String(stage),
    outcome: 'İlerleyin',
    owner: 'Kurucu',
    reason: 'Kanıt',
    at: new Date().toISOString(),
    stale: false,
  }))
  p.answers['16'] = { balance: 20000, due: 30000 }
  assert.match(recommend(p, 4).reason, /nakit açığı/)
})
test('tek kurucunun sınır artışında eski değer ve ikinci görüş saklanır', () => {
  let p = createPlan('Kütüphane')
  p.answers['00'] = { team: 'Tek kurucu' }
  p.answers['02'] = {
    budget: 500,
    spent: 100,
    attempts: 2,
    end: '2099-10-10',
    clearance: 'Yetki var',
  }
  p = applyEdit(p, '02', 'budget', 800)
  assert.equal(p.changes.at(-1).before, 500)
  assert.match(recommend(p, 0).reason, /ikinci görüş/i)
})

test('geçersiz takvim günü ve kesirli kişi sayısı içe alınmaz', () => {
  const p = createPlan('Örnek')
  p.answers['02'] = { end: '2030-02-30' }
  assert.equal(validatePlan(p), false)
  p.answers = { 15: { offered: 1.5 } }
  assert.equal(validatePlan(p), false)
})
test('yazılı durdurma kararı yatırım önerisinden önce gelir', () => {
  let p = createPlan('Atölye')
  p.answers['00'] = {
    buyer: 'İşletme',
    product: 'Hizmet',
    permit: 'Gerekmiyor',
    team: 'Tek kurucu',
    funding: 'Kendi kaynağımız',
    market: 'Mevcut pazar',
    start: 'Yeni iş',
    mode: 'Ücretli satış',
    site: 'Hayır',
    description: 'Atölye',
  }
  p.answers['01'] = { owner: 'Kurucu', goal: 'Hızlı teslim' }
  p.answers['02'] = {
    budget: 20000,
    spent: 1000,
    attempts: 3,
    end: '2099-01-01',
    stop: 'Zarar',
    danger: 'Yok',
    stopHit: 'Hayır',
    clearance: 'Yetki var',
  }
  assert.equal(recommend(p, 0).outcome, 'İlerleyin')
  p = recordDecision(p, 0, {
    outcome: 'Durdurun',
    reason: 'İş kapandı',
    owner: 'Kurucu',
    task: 'Siparişleri kapat',
  })
  assert.match(report(p, 'action'), /Açık yükümlülükleri kapatın/)
  assert.match(report(p, 'action'), /Siparişleri kapat/)
})

test('iki rapor aynı sürüme sabitlenir ve sonraki düzenleme eski çıktıyı değiştirmez', async () => {
  const { freezeReports } = await import('../src/domain.ts')
  const p = createPlan('Atölye')
  p.revision = 4
  const q = freezeReports(p),
    pair = q.publications.at(-1)
  assert.equal(pair.revision, 4)
  assert.match(pair.executive, /Kayıt sürümü 4/)
  assert.match(pair.action, /Kayıt sürümü 4/)
  const other = applyEdit(q, '01', 'owner', 'Yeni sorumlu')
  assert.equal(other.publications[0].action, pair.action)
  assert.ok(validatePlan(other))
})

test('koşullu izin aynı eksik alanı iki kez kullanamaz, başka eksik incelenebilir', () => {
  let p = createPlan('Atölye')
  p.answers['02'] = {
    budget: 500,
    spent: 10,
    end: '2099-10-10',
    attempts: 2,
    clearance: 'Yetki var',
    danger: 'Yok',
    stopHit: 'Hayır',
  }
  const input = {
    outcome: 'Koşullu ilerleyin',
    owner: 'Kurucu',
    reason: 'Sınırlı araştırma',
    task: 'Kapsamı incele',
    proof: 'Gözlem belgesi',
    date: '2099-10-01',
    limit: 10,
    gapKey: '01.goal',
  }
  p = recordDecision(p, 0, input)
  assert.throws(() => recordDecision(p, 0, input), /daha önce/)
  const q = recordDecision(p, 0, { ...input, gapKey: '01.owner' })
  assert.ok(validatePlan(q))
  assert.equal(q.history.length, 2)
})
