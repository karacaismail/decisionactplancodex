import test from 'node:test'
import assert from 'node:assert/strict'
import { cafeExample } from '../src/cafe.ts'
import { applyEdit, today, validatePlan } from '../src/domain.ts'
import { decide, evaluate } from '../src/readiness.ts'
import { dossierDoc } from '../src/dossier.ts'
import { situation } from '../src/research.ts'
import * as methods from '../src/preparationMethods.ts'
const study = (method, values) => ({ id: method, method, values })
const decision = {
  outcome: 'Koşullu hazır',
  owner: 'Ayşe',
  reviewed: true,
  reason: 'Sabah talebini sınayalım.',
  field: '18.choice',
  question: 'Hangi durakta satış denenebilir?',
  assignee: 'Deniz',
  due: today(),
  proof: 'Durak sayımı',
}
function claimFixture() {
  const p = cafeExample(),
    e = p.evidence.find((x) => x.step === '15')
  const against = {
    ...e,
    id: 'iptal',
    title: 'Yazılı sipariş iptal edildi',
    stance: 'Karşı bulgu',
  }
  p.evidence.push(against)
  p.foundation.brief.claims = [
    {
      id: 'iddia',
      text: 'Sipariş korunur',
      group: 'Yolcular',
      period: 'Sabah',
      kind: 'Gözlem',
      route: 'kafe-araba',
      criterion: '',
      confidence: 'Orta',
      why: 'Aynı deneme',
      calculation: '',
      support: e.id,
      counter: against.id,
    },
  ]
  const s = study('factor', {
    claim: 'iddia',
    name: 'Sipariş korunur',
    group: 'Yolcular',
    period: 'Sabah',
    support: e.id,
  })
  p.foundation.brief.studies.push(s)
  return { p, s, e }
}
test('Koşul aynı iddianın iki kanıtını taşır. Başka dönemi ve kopan bağı bildirir.', () => {
  const { p, s } = claimFixture()
  assert.ok(validatePlan(p))
  const result = () => methods.studyResult(p, s).join('\n')
  assert.match(result(), /Bulgular çelişiyor/)
  assert.match(result(), /Yazılı sipariş iptal edildi/)
  s.values.period = 'Öğlen'
  assert.doesNotMatch(result(), /Bulgular çelişiyor/)
  s.values.period = ''
  assert.match(result(), /grubunu ve dönemi inceleyin/i)
  s.values.period = 'Sabah'
  p.evidence.pop()
  assert.match(result(), /Bağlı kanıt kaldırıldı/)
})
test('Yalnız kapsamı doğrulanan ihtiyaç ve dayanaklı üstünlük özete girer.', () => {
  const p = cafeExample(),
    value = (name) =>
      situation(p)
        .find((x) => x.title === name)
        ?.items.map((r) => r.text)
        .join(' ')
  assert.doesNotMatch(value('Güçlü yönler'), /Güler yüz|Bir dakikada/)
  assert.match(value('Araştırılacak konular'), /Bir dakikada/)
  const a = p.answers['09']
  a.marketGap = 'Öğlen kahvesi'
  assert.doesNotMatch(value('Fırsatlar'), /Öğlen kahvesi/)
  assert.match(value('Araştırılacak konular'), /Öğlen kahvesi/)
  Object.assign(a, {
    gapGroup: 'Yolcular',
    gapPeriod: 'Öğlen',
    gapBehavior: 'Öğle ön siparişi',
    gapProof: p.evidence.find((x) => x.step === '15').id,
    gapAlternative: 'Evde hazırlama',
    gapCoverage: 'Kısmen karşılanıyor',
    gapChecked: today(),
    gapMatch: 'Aynı müşteri ve dönem',
  })
  assert.doesNotMatch(value('Fırsatlar'), /Öğlen kahvesi/)
  const midday = {
    ...p.evidence.find((x) => x.step === '15'),
    id: 'oglen',
    title: 'Öğle siparişi',
    customerGroup: 'Yolcular',
    period: 'Öğlen',
  }
  p.evidence.push(midday)
  a.gapProof = midday.id
  assert.match(value('Fırsatlar'), /Öğlen kahvesi/)
  const fresh = applyEdit(p, '09', 'marketGap', 'Akşam kahvesi')
  assert.doesNotMatch(
    situation(fresh)
      .find((x) => x.title === 'Fırsatlar')
      .items.map((x) => x.text)
      .join(),
    /Akşam/,
  )
})
test('İzin, bağımsız ayırma, borca bağlama ve ödeme aynı parayı iki kez düşürmez.', () => {
  let p = cafeExample()
  Object.assign(p.answers['02'], {
    budget: 100000,
    spent: 30000,
    contract: 'Evet',
  })
  p.history.push({
    id: 'izin',
    stage: 1,
    outcome: 'Koşullu ilerleyin',
    task: 'Kira',
    reason: 'Deneme',
    date: today(),
    at: new Date().toISOString(),
    owner: 'Ayşe',
    stale: false,
    limit: 12000,
  })
  const row = {
    id: 'borc',
    name: 'Kira',
    amount: '50000',
    owner: '',
    proof: '',
    due: '',
  }
  const s = {
    ...study('budget', { budgetScope: '02. adımdaki bütçe' }),
    pledges: [row],
  }
  p.foundation.brief.studies.push(s)
  const balance = () =>
    methods.studyResult(p, p.foundation.brief.studies.at(-1)).at(-1)
  assert.match(balance(), /20.000 TL/)
  s.pledges.push({
    ...row,
    id: 'ayir',
    kind: 'reserve',
    amount: '10000',
    permit: 'izin',
    debtId: '',
  })
  assert.match(balance(), /10.000 TL/)
  s.pledges[1].debtId = 'borc'
  assert.match(balance(), /20.000 TL/)
  assert.ok(validatePlan(p))
  p = methods.payBudgetItem(p, s.id, 'borc')
  assert.equal(p.answers['02'].spent, 80000)
  assert.equal(p.history.find((h) => h.id === 'izin').stale, true)
  assert.match(balance(), /20.000 TL/)
  assert.deepEqual(methods.payBudgetItem(p, s.id, 'borc'), p)
  assert.match(dossierDoc(p), /Ödendi/)
})
test('İlk iş yetkiye göre değişir. Öncelik, kanıt ve eski rapor korunur.', () => {
  const p = cafeExample(),
    e = p.evidence.find((x) => x.step === '15')
  p.foundation.brief.openDecisions = [
    {
      id: 'q',
      question: 'Öğlen teklifi denenmeli mi?',
      routes: ['current', 'kafe-araba'],
      proof: e.id,
      test: 'step-15',
      owner: 'Ayşe',
      due: today(),
      change: 'Öğlen satış sayımı',
      reversal: 'Bir günlük kira',
    },
  ]
  assert.ok(validatePlan(p))
  assert.match(dossierDoc(p), /Geçiş kararı bekleniyor/)
  assert.match(dossierDoc(p), /Öğlen teklifi denenmeli mi/)
  const signed = decide(p, decision)
  const opening = (x) => x.split('## Açık kararlar')[0]
  assert.match(opening(dossierDoc(signed)), /Yalnız izin verilen soru/)
  assert.match(opening(dossierDoc(signed)), /Durak sayımı/)
  const frozen = signed.foundation.decisions.at(-1).dossier
  signed.foundation.decisions.at(-1).due = '2020-01-01'
  assert.match(opening(dossierDoc(signed)), /süresi doldu/)
  assert.doesNotMatch(frozen, /süresi doldu/)
  signed.answers['18'] = { choice: 'Sonraki seçim' }
  assert.equal(evaluate(signed).outcome, evaluate(p).outcome)
})
test('İlk soruda eksik bulgu başka sorudan gelmez. Kanıtlar kendi kaydına açılır.', () => {
  const { p, s, e } = claimFixture()
  p.evidence.at(-1).criteria = []
  p.foundation.brief.openDecisions = [
    {
      id: 'ikinci',
      question: 'İkinci soru?',
      routes: [],
      proof: e.id,
      test: '',
      owner: 'Deniz',
      due: '2030-10-14',
      change: '',
      reversal: '',
    },
  ]
  const intro = dossierDoc(p).split('## Açık kararlar')[0]
  assert.match(intro, /Seçimi değiştirecek bulgu: Bilinmiyor/)
  assert.match(intro, /Deniz/)
  const same = { ...e, id: 'ayni-icerik' }
  p.evidence.push(same)
  s.values.support = same.id
  const links = methods
    .studyResult(p, s)
    .filter((line) => line.includes('[Kanıt kaydı]'))
  assert.equal(links.length, 3)
  assert.equal(new Set(links.map((l) => l.slice(l.lastIndexOf('(#')))).size, 3)
  assert.equal(
    methods.setStudyValue(s, 'group', 'Yeni grup').values.support,
    undefined,
  )
})
test('Ortak bütçe ikinci kez kullanılamaz ve ödenen kaydın dönemi değiştirilemez.', () => {
  const p = cafeExample()
  const first = study('budget', {
    budgetScope: '02. adımdaki bütçe',
    unpaid: '100',
  })
  const second = { ...first, id: 'ikinci' }
  p.foundation.brief.studies = [first, second]
  assert.match(
    methods.studyResult(p, first).join(' '),
    /ortak bütçe|aynı bütçe/i,
  )
  first.pledges = [
    {
      id: 'o',
      amount: '100',
      name: 'Yer',
      owner: '',
      proof: '',
      due: '',
      paidOn: today(),
    },
  ]
  assert.equal(methods.setStudyValue(first, 'budgetScope', 'Ayrı bütçe'), first)
})
test('Sabah gözlemi öğlen fırsatına dayanak olamaz. Eski doğrulama kayda dönmez.', () => {
  const p = cafeExample(),
    morning = p.evidence.find((e) => e.step === '15')
  Object.assign(morning, { customerGroup: 'Yolcular', period: 'Sabah' })
  Object.assign(p.answers['09'], {
    marketGap: 'Öğlen kahvesi',
    gapGroup: 'Yolcular',
    gapPeriod: 'Öğlen',
    gapBehavior: 'Kapora',
    gapProof: morning.id,
    gapAlternative: 'Market',
    gapCoverage: 'Kısmen karşılanıyor',
    gapChecked: today(),
    gapMatch: 'Aynı müşteri ve dönem',
  })
  const classified = () =>
    situation(p).find((s) => s.title === 'Fırsatlar').items
  assert.equal(classified().length, 0)
  p.answers['09'].gapPeriod = 'Sabah'
  assert.equal(classified().length, 1)
  const edited = applyEdit(p, '09', 'marketGap', 'Yeni ihtiyaç')
  assert.equal(edited.answers['09'].gapAlternative, 'Market')
  assert.equal(edited.answers['09'].gapMatch, undefined)
})
test('Tam izin ve hazırlığa dönüş için farklı ilk işler görünür.', () => {
  let p = cafeExample()
  p.evidence.push({
    ...p.evidence[0],
    id: 'kosul',
    criteria: ['D5'],
    title: 'Dış koşullar',
    step: '04',
  })
  p.answers['04'] = {
    external: [{ Koşul: 'İzin', İşaret: 'Bildirim', Sorumlu: 'Ayşe' }],
    review: today(),
  }
  const full = decide(p, { ...decision, outcome: 'Planlamaya hazır' })
  assert.match(dossierDoc(full), /Planlamaya hazır. Yolları karşılaştırın/)
  const refused = decide(p, {
    ...decision,
    outcome: 'Henüz hazır değil',
    reason: 'Yeri yeniden incele.',
  })
  assert.match(dossierDoc(refused), /Henüz hazır değil. Yeri yeniden incele/)
  assert.doesNotMatch(
    dossierDoc(refused),
    /Planlamaya hazır. Yolları karşılaştırın/,
  )
})
test('Ödeme yapılmadan da açık borç ve ayrılan tutar kendi para biriminde kalır.', () => {
  for (const kind of ['debt', 'reserve']) {
    const s = {
      ...study('budget', {
        budgetScope: 'Ayrı bütçe',
        currency: 'TL',
        period: 'Kasım',
      }),
      pledges: [
        {
          id: 't',
          kind,
          name: 'Yer',
          amount: '5000',
          due: '',
          owner: '',
          proof: '',
        },
      ],
    }
    assert.equal(methods.setStudyValue(s, 'currency', 'USD'), s)
    assert.equal(methods.setStudyValue(s, 'period', 'Aralık'), s)
    assert.equal(
      methods.setStudyValue(s, 'name', 'Deneme bütçesi').values.name,
      'Deneme bütçesi',
    )
  }
})
