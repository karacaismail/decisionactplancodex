import {
  proofIssue,
  trialIssue,
  validReview,
  validSurprise,
} from './proofReview.ts'
import {
  compareReady,
  comparison,
  routes,
  validComparison,
  type ComparisonRow,
  criticalClaimsOK,
  dossierDoc,
  validBrief,
  type Brief,
} from './dossier.ts'
import {
  activeSteps,
  calendar,
  cash,
  complete,
  dateLabel,
  money,
  now,
  today,
  type Evidence,
  type Plan,
} from './domain.ts'
import { steps } from './data/steps.ts'
import type { EvidenceKind } from './operations.ts'

export const results = [
  'Henüz hazır değil',
  'Koşullu hazır',
  'Planlamaya hazır',
] as const
export type Result = (typeof results)[number]
export const scopeFields = [
  ['18.choice', 'Seçilen yol'],
  ['18.excluded', 'Vazgeçilen seçenek'],
  ['18.route', 'Yol seçimi ve gerekçesi'],
  ['19.goals', '90 günlük iş sırası'],
] as const
export const levels = [
  'Fikir',
  'Sınırlar yazıldı',
  'Sorun ölçüldü',
  'Erişim ve seçenekler gösterildi',
  'Talep davranışı görüldü',
  'Para ve risk hesabı dayanaklı',
]
export const criteria = [
  [
    'Z1',
    'Sınır ve sorumlu',
    '02',
    'Amaç, karar sahibi, kalan bütçe, zaman, deneme hakkı ve durma kuralını yazın.',
    '01 02 03',
  ],
  [
    'Z2',
    'Gerçek sorun',
    '07',
    'Bir müşteri grubunun kaybını ölçün. Görüşme ve ölçüm kaynağını bağlayın.',
    '05 06 07',
  ],
  [
    'Z3',
    'Müşteriye erişim',
    '08',
    'İlk grubu ve bu gruba nasıl ulaştığınızı gösterin.',
    '05 08',
  ],
  [
    'Z4',
    'Ulaşılabilir talep',
    '09',
    'Talep ve kapasiteyi aynı dönemin satış hedefiyle karşılaştırın.',
    '09 12 16',
  ],
  [
    'Z5',
    'Çözüm seçenekleri',
    '11',
    'Bugünkü yöntemle en az bir başka yolu karşılaştırın.',
    '09 11',
  ],
  [
    'Z6',
    'Müşteri davranışı',
    '15',
    'Denemeden önce eşiği yazın. Gerçek bir müşteri davranışını kaynağa bağlayın.',
    '13 14 15',
  ],
  [
    'Z7',
    'Para hesabı',
    '16',
    'Birim kazancı, sabit gideri ve ilk ödeme gününü belgeleyin.',
    '02 15 16',
  ],
  [
    'Z8',
    'Riskler ve varsayımlar',
    '17',
    'Kritik riski, sorumlusunu, durma kuralını ve açık varsayımı yazın.',
    '02 10 17',
  ],
  [
    'Z9',
    'Güvenli ve yetkili çalışma',
    '14',
    'Sıradaki işin iznini doğrulayın. Zarar veya durma işaretini inceleyin.',
    '02 04 12 14 17',
  ],
  [
    'D1',
    'Fiyat veya finansman',
    '15',
    'Fiyat denemesini veya ayrılan hizmet bütçesini belgeleyin.',
    '14 15 16',
  ],
  [
    'D2',
    'Rakip karşılaştırması',
    '09',
    'Rakibin bedelini, güçlü ve zayıf yanını kaynağıyla yazın.',
    '09 11',
  ],
  [
    'D3',
    'Erişim yolu denemesi',
    '08',
    'Aynı dönemde ulaşılan ve yanıt veren kişi sayısını kaydedin.',
    '08 09 15',
  ],
  [
    'D4',
    'Beceri ve kapasite',
    '12',
    'Hazır becerileri ve eksik beceriler için çözümü belgeleyin.',
    '03 12',
  ],
  [
    'D5',
    'Dış koşullar',
    '04',
    'İşi etkileyen dış koşulu ve tekrar bakılacak tarihi yazın.',
    '04 14',
  ],
  [
    'D6',
    'İkinci görüş',
    '17',
    'Başka bir kişi dayanakları okuyup tarihli görüşünü kaydetsin.',
    '03 17',
  ],
] as const
export type Criterion = (typeof criteria)[number][0]
export type EvidenceLink = {
  participants?: string[]
  side?: 'Müşteri' | 'Diğer taraf' | 'Eşleşme'
  criteria?: Criterion[]
  observed?: string
  stance?: 'Destek' | 'Karşı bulgu'
}
export type DecisionForm = {
  materialSupports?: Criterion[]
  supportReason?: string
  outcome: Result
  owner: string
  reason: string
  reviewed: boolean
  field: string
  question: string
  assignee: string
  due: string
  proof: string
}
export type Transition = DecisionForm & {
  id: string
  at: string
  signature: string
  dossier?: string
  comparison?: ComparisonRow[]
  document: string
  recommendation: Result
  revoked?: boolean
}
export const inputLabels = {
  trialPlace: 'Denemenin teklif yeri veya kanalı',
  trialPeriod: 'Denemenin dönemi veya vardiyası',
  trialStart: 'Denemenin başladığı gün',
  period: 'Talep ve satış hedefinin dönemi',
  capacityPeriod: 'Teslim kapasitesinin dönemi',
  costPeriod: 'Sabit giderin veya hizmet bütçesinin dönemi',
  monthlyOutflow: 'Aylık net nakit çıkışı (TL)',
  expectedSignal: 'Denemede aranan davranış',
  people: 'Hedef kişi sayısı',
  reach: 'Ulaşılan oran (%)',
  conversion: 'Alım veya katılım oranı (%)',
  frequency: 'Dönemde kişi başına sipariş',
  target: 'Aynı dönemin satış veya katılım hedefi',
  price: 'Denenen fiyat veya finansman tutarı (TL)',
  offered: 'Fiyat verilen kişi',
  accepted: 'Kabul eden',
  rejected: 'Reddeden',
  silent: 'Yanıt vermeyen',
  reached: 'Kanalda ulaşılan kişi',
  responded: 'Kanalda yanıt veren kişi',
  channelPeriod: 'Kanal denemesinin dönemi',
  advantage: 'Rakibin güçlü yanı',
  weakness: 'Rakibin zayıf yanı',
  skills: 'Gerekli beceriler ve açıkların çözümü',
  reviewer: 'İkinci görüşü veren kişi',
  reviewNote: 'İncelenen dayanak ve görüş',
  reviewVersion: 'İncelenen sürüm',
  assumption: 'Varsayımın durumu',
  assumptionEvidence: 'Varsayımın kanıtı',
  riskStop: 'Bu riskte ne zaman duracaksınız?',
  lossMeasure: 'Ölçülen kayıp ve birimi',
} as const
export type InputKey = keyof typeof inputLabels
export type Assumption = {
  route?: string
  question?: string
  commitment?: string
  exposure?: 'Araştırma' | 'Taahhüt'
  id: string
  claim: string
  impact: string
  refute: string
  status: 'Denenmedi' | 'Desteklendi' | 'Çürüdü'
  evidence: string
  critical: boolean
}
export type Foundation = {
  brief?: Brief
  assumptions?: Assumption[]
  version: 1
  inputs: Partial<Record<InputKey, string>>
  decisions: Transition[]
}
export function foundation(p: Plan): Foundation {
  return p.foundation ?? { version: 1, inputs: {}, decisions: [] }
}
export const meaningful = (v: unknown) => typeof v === 'string' && !!v.trim()
export function numberValue(v: unknown) {
  return (typeof v === 'number' || meaningful(v)) &&
    Number.isFinite(Number(v)) &&
    Number(v) >= 0
    ? Number(v)
    : null
}
export function market(p: Plan) {
  const x = foundation(p).inputs,
    values = [x.people, x.reach, x.conversion, x.frequency].map(numberValue)
  const [people, reach, convert, frequency] = values
  if (
    !x.period?.trim() ||
    people === null ||
    !Number.isInteger(people) ||
    reach === null ||
    reach > 100 ||
    convert === null ||
    convert > 100 ||
    !frequency
  )
    return null
  return Math.floor(people * (reach / 100) * (convert / 100) * frequency)
}
const behaviour: EvidenceKind[] = [
  'Kaynak ayrıldı',
  'Yazılı taahhüt',
  'Ödeme',
  'Teslim veya kullanım',
]
export function bound(e: Evidence, id: Criterion, day = today()) {
  const meta = criteria.find((c) => c[0] === id)!
  return (
    e.criteria?.includes(id) &&
    meta[4].split(' ').includes(e.step) &&
    meaningful(e.title) &&
    meaningful(e.source) &&
    calendar(e.observed) &&
    e.observed <= day
  )
}
export function usable(p: Plan, e: Evidence, id: Criterion, day = today()) {
  return (
    bound(e, id, day) &&
    !proofIssue(p, e, day) &&
    e.stance === 'Destek' &&
    !!e.kind &&
    (id === 'Z6'
      ? behaviour.includes(e.kind)
      : !(['Z2', 'Z4', 'Z7', 'D1', 'D3'].includes(id) && e.kind === 'Görüş'))
  )
}
function activeCounter(p: Plan, e: Evidence, id: Criterion, day: string) {
  if (!bound(e, id, day) || e.stance !== 'Karşı bulgu') return false
  if (
    e.criteria?.includes('Z6') &&
    (id === 'Z6' || id === 'D1') &&
    e.customerGroup &&
    e.period &&
    e.place &&
    trialIssue(p, e)
  )
    return false
  const r = e.review
  if (
    r?.replacement &&
    r.reason?.trim() &&
    proofIssue(p, e, day) &&
    p.evidence.some((x) => x.id === r.replacement && usable(p, x, id, day))
  )
    return false
  return true
}
export function demandParticipants(p: Plan, day = today()) {
  const g = foundation(p).inputs,
    free = p.answers['00']?.mode === 'Ücretsiz hizmet'
  const notes = p.evidence.filter((e) => usable(p, e, 'Z6', day))
  const expected: Record<string, EvidenceKind[]> = {
    Ödeme: ['Ödeme'],
    'Yazılı taahhüt': ['Yazılı taahhüt', 'Ödeme'],
    'Ayrılan kaynak': ['Kaynak ayrıldı', 'Ödeme'],
    'Fiilî kullanım': ['Teslim veya kullanım'],
  }
  const participants = (side: EvidenceLink['side'], kinds?: EvidenceKind[]) =>
    new Set(
      notes
        .filter((e) => e.side === side && (!kinds || kinds.includes(e.kind!)))
        .flatMap((e) => e.participants ?? [])
        .map((v) => v.trim().toLocaleLowerCase('tr'))
        .filter(Boolean),
    )
  const buyers = participants(
    'Müşteri',
    free
      ? ['Teslim veya kullanım']
      : Object.hasOwn(expected, g.expectedSignal ?? '')
        ? expected[g.expectedSignal!]
        : [],
  )
  return {
    buyers,
    others: participants('Diğer taraf'),
    matches: participants('Eşleşme'),
  }
}
export function demandProof(p: Plan, day = today()) {
  const t = p.answers['15'] ?? {},
    paired = p.answers['00']?.buyer === 'İki taraflı pazar'
  const { buyers, others, matches } = demandParticipants(p, day)
  const minimum = Number(t.threshold)
  if (
    !Number.isInteger(minimum) ||
    minimum <= 0 ||
    buyers.size < minimum ||
    buyers.size > Number(t.offered) ||
    buyers.size < Number(t.committed) ||
    p.evidence.some((e) => activeCounter(p, e, 'Z6', day))
  )
    return false
  if (!paired) return true
  const linked = [...matches].filter((pair) => {
    const [buyer, seller, extra] = pair.split('/')
    return !extra && buyers.has(buyer) && others.has(seller)
  })
  return (
    Number(t.otherCount) > 0 &&
    others.size >= Number(t.otherCount) &&
    Number(t.matches) > 0 &&
    linked.length >= Number(t.matches)
  )
}
function enough(p: Plan, id: string) {
  const s = steps.find((s) => s.id === id)!
  return complete(p, s, false)
}
const count = (v: unknown) =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
function testSignals(p: Plan, day: string): Record<Criterion, boolean> {
  const a = p.answers,
    b = a['02'] || {},
    t = a['15'] || {},
    m = a['16'] || {},
    g = foundation(p).inputs
  const free = a['00']?.mode === 'Ücretsiz hizmet',
    paired = a['00']?.buyer === 'İki taraflı pazar',
    active = activeSteps(p)
  const c = cash(p),
    estimated = market(p),
    target = numberValue(g.target),
    capacity = numberValue(a['09']?.capacity),
    signal = t.committed
  const profileOK = enough(p, '00'),
    limits =
      enough(p, '02') &&
      Number(b.budget) > Number(b.spent) &&
      [0, 1, 2, 3, 4].every(
        (stage) =>
          p.history.filter(
            (h) => h.stage === stage && h.outcome === 'Yeniden deneyin',
          ).length < Number(b.attempts),
      ) &&
      String(b.end) >= day
  const consent =
    enough(p, '14') &&
    a['14']?.authorization === 'Karşılandı' &&
    a['14']?.[free ? 'budgetAuthority' : 'billing'] === 'Karşılandı'
  const external = a['04'],
    freeFunds = numberValue(m.fund),
    cost = numberValue(m.serviceCost)
  const amounts = [g.offered, g.accepted, g.rejected, g.silent].map(numberValue)
  const [offers, accepted, rejected, silent] = amounts
  const reached = numberValue(g.reached),
    responded = numberValue(g.responded)
  const assumptionOK =
    !g.assumption ||
    g.assumption === 'Denenmedi' ||
    (g.assumption === 'Desteklendi' &&
      p.evidence.some(
        (e) =>
          e.id === g.assumptionEvidence &&
          e.stance === 'Destek' &&
          usable(p, e, 'Z8', day),
      ))
  return {
    Z1:
      profileOK &&
      enough(p, '01') &&
      limits &&
      (!active.includes('03') || enough(p, '03')),
    Z2:
      enough(p, '05') &&
      enough(p, '06') &&
      enough(p, '07') &&
      a['07'].loss === 'Karşılandı' &&
      meaningful(g.lossMeasure) &&
      /\d/.test(g.lossMeasure!),
    Z3: enough(p, '08') && meaningful(a['05']?.event),
    Z4:
      meaningful(g.period) &&
      g.period === g.capacityPeriod &&
      g.period === g.costPeriod &&
      estimated !== null &&
      target !== null &&
      target > 0 &&
      capacity !== null &&
      Math.min(estimated, capacity, Number(a['09']?.demand)) >= target &&
      (free || (c.breakEven !== null && target >= c.breakEven)) &&
      (!active.includes('12') ||
        (enough(p, '12') && a['12']?.ready === 'Karşılandı')),
    Z5: enough(p, '11') && compareReady(p, day),
    Z6:
      enough(p, '13') &&
      enough(p, '15') &&
      demandProof(p, day) &&
      count(signal) &&
      Number(signal) >= Number(t.threshold) &&
      Number(t.threshold) > 0 &&
      Number(t.offered) >= Number(signal) &&
      Number(t[free ? 'attended' : 'paid']) <= Number(t.offered) &&
      (g.expectedSignal !== 'Ödeme' ||
        (Number(t.paid) >= Number(t.threshold) &&
          p.evidence.some(
            (e) => usable(p, e, 'Z6', day) && e.kind === 'Ödeme',
          ))) &&
      (!free || Number(t.attended) >= Number(t.threshold)) &&
      (!paired ||
        (Number(t.otherCount) > 0 &&
          Number(t.matches) > 0 &&
          Number(t.matches) <=
            Math.min(Number(signal), Number(t.otherCount)))) &&
      (!p.evidence.some((e) => usable(p, e, 'Z6', day) && e.kind === 'Ödeme') ||
        Number(t.paid) > 0),
    Z7:
      enough(p, '16') &&
      c.gap === 0 &&
      (free
        ? freeFunds !== null &&
          freeFunds > 0 &&
          cost !== null &&
          freeFunds >= cost
        : c.breakEven !== null),
    Z8:
      enough(p, '17') &&
      enough(p, '10') &&
      meaningful(g.riskStop) &&
      assumptionOK &&
      (foundation(p).assumptions ?? []).every(
        (a) =>
          !a.critical ||
          a.status === 'Denenmedi' ||
          (a.status === 'Desteklendi' &&
            p.evidence.some(
              (e) => e.id === a.evidence && usable(p, e, 'Z8', day),
            )),
      ),
    Z9:
      limits &&
      consent &&
      a['00']?.permit !== 'Bilinmiyor' &&
      b.danger === 'Yok' &&
      !p.evidence.some(
        (e) => e.surprise?.danger && e.surprise.status !== 'Kapandı',
      ) &&
      b.stopHit === 'Hayır' &&
      b.clearance === 'Yetki var' &&
      (!active.includes('04') || enough(p, '04')) &&
      !p.changes?.some((c) => c.needsReview && !c.reviewer) &&
      !p.history.some(
        (h) =>
          !h.stale &&
          h.outcome === 'Durdurun' &&
          h.stage <= 4 &&
          p.history.findLast((k) => k.stage === h.stage && !k.stale)?.id ===
            h.id,
      ),
    D1:
      numberValue(g.price) !== null &&
      Number(g.price) > 0 &&
      (free
        ? consent
        : amounts.every((n) => n !== null && Number.isSafeInteger(n)) &&
          Number(offers) > 0 &&
          Number(accepted) > 0 &&
          Number(accepted) + Number(rejected) + Number(silent) === offers),
    D2: enough(p, '09') && meaningful(g.advantage) && meaningful(g.weakness),
    D3:
      meaningful(g.channelPeriod) &&
      reached !== null &&
      responded !== null &&
      reached > 0 &&
      Number.isSafeInteger(reached) &&
      Number.isSafeInteger(responded) &&
      responded <= reached,
    D4: meaningful(g.skills),
    D5: !!external && enough(p, '04'),
    D6:
      meaningful(g.reviewer) &&
      g.reviewer?.trim() !== String(a['01']?.owner ?? '').trim() &&
      meaningful(g.reviewNote) &&
      g.reviewVersion === reviewBasis(p),
  }
}
export function pendingCommitments(p: Plan) {
  return (foundation(p).assumptions ?? []).filter(
    (a) =>
      a.critical &&
      a.status === 'Denenmedi' &&
      (a.exposure !== 'Araştırma' ||
        !!a.commitment?.trim() ||
        !routes(p).some((r) => r.id === a.route) ||
        (a.question !== 'first' &&
          !(foundation(p).brief?.openDecisions ?? []).some(
            (q) => q.id === a.question && q.question.trim(),
          ))),
  )
}

export function evaluate(p: Plan, day = today()) {
  const signals = testSignals(p, day)
  const rows = criteria.map(([id, title, step, hint]) => {
    const evidence = p.evidence.filter((e) => bound(e, id, day)),
      against = evidence.some((e) => activeCounter(p, e, id, day))
    return {
      id,
      title,
      step,
      hint,
      evidence,
      against,
      ok:
        signals[id] &&
        criticalClaimsOK(p, id, day) &&
        !against &&
        evidence.some((e) => usable(p, e, id, day)),
    }
  })
  const ok = (id: Criterion) => rows.find((r) => r.id === id)!.ok
  const required = rows.slice(0, 9).filter((r) => r.ok).length,
    support = rows.slice(9).filter((r) => r.ok).length
  const outcome: Result =
    required < 9
      ? results[0]
      : support < 4 || pendingCommitments(p).length
        ? results[1]
        : results[2]
  const levelsMet = [
    ok('Z1'),
    ok('Z2'),
    ok('Z3') && ok('Z5'),
    ok('Z6'),
    ok('Z4') && ok('Z7') && ok('Z8'),
  ]
  const missing = levelsMet.indexOf(false)
  return { rows, required, support, outcome, level: missing < 0 ? 5 : missing }
}
function stable(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stable)
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([k, value]) => [k, stable(value)]),
    )
  return v
}
export function reviewBasis(p: Plan) {
  const f = foundation(p)
  const { reviewVersion, ...inputs } = f.inputs
  return signature(
    {
      ...p,
      foundation: { ...f, inputs },
      evidence: p.evidence.filter((e) => e.criteria?.some((id) => id !== 'D6')),
    },
    !!f.brief,
  )
}
function signature(p: Plan, withBrief = true) {
  const inputs = Object.fromEntries(
    Object.entries(p.answers).filter(
      ([k]) =>
        Number(k) <= 17 &&
        (activeSteps(p).includes(k) ||
          p.evidence.some((e) => e.step === k && e.criteria?.length)),
    ),
  )
  return JSON.stringify(
    stable([
      1,
      p.id,
      inputs,
      foundation(p).inputs,
      foundation(p).assumptions ?? [],
      p.evidence
        .filter((e) => e.criteria?.length)
        .map((e) => [
          e.id,
          e.step,
          e.kind,
          e.observed,
          e.title,
          e.source,
          e.stance,
          e.criteria,
          e.side,
          e.participants,
          ...(e.place || e.review || e.surprise
            ? [e.place, e.review, e.surprise]
            : []),
          ...(e.customerGroup || e.period
            ? [e.customerGroup ?? '', e.period ?? '']
            : []),
        ])
        .sort(([a], [b]) => String(a).localeCompare(String(b), 'en')),
      ...(p.evidence.some((e) => e.surprise)
        ? [
            p.evidence
              .filter((e) => e.surprise)
              .map((e) => [
                e.id,
                e.title,
                e.source,
                e.observed,
                e.place,
                e.surprise,
              ]),
          ]
        : []),
      ...(withBrief
        ? [
            foundation(p).brief ?? {},
            p.evidence
              .filter((e) => e.step <= '17' && !e.criteria?.length)
              .map((e) => [
                e.id,
                e.title,
                e.source,
                e.observed,
                e.stance,
                e.kind,
                e.step,
                ...(e.place || e.review || e.surprise
                  ? [e.place, e.review, e.surprise]
                  : []),
                ...(e.customerGroup || e.period
                  ? [e.customerGroup ?? '', e.period ?? '']
                  : []),
              ]),
            p.history.filter((h) => h.stage <= 3),
            p.answers['04'] ?? {},
            p.answers['12'] ?? {},
          ]
        : []),
    ]),
  )
}
export function access(p: Plan, day = today()) {
  const last = foundation(p).decisions.at(-1)
  if (!last) return { active: false, reason: 'Henüz karar kaydedilmedi.', last }
  if (last.outcome === results[0])
    return { active: false, reason: last.reason, last }
  if (last.outcome === results[1] && last.due < day)
    return { active: false, reason: 'Koşullu kararın süresi doldu.', last }
  if (
    last.revoked ||
    (!last.dossier && p.foundation?.brief !== undefined) ||
    last.signature !== signature(p, !!last.dossier) ||
    results.indexOf(evaluate(p, day).outcome) < results.indexOf(last.outcome)
  )
    return {
      active: false,
      reason: 'Dayanaklar değişti. Kararı yeniden inceleyin.',
      last,
    }
  return { active: true, reason: last.reason, last }
}
export function allows(p: Plan, step: string, key: string, day = today()) {
  if (step < '18') return true
  const { active, last } = access(p, day)
  if (!active || !last) return false
  if (step >= '19' && !enough(p, '18')) return false
  if (last.outcome === results[1]) {
    if (last.field === '18.route')
      return (
        step === '18' &&
        [
          'choice',
          'rationale',
          'excluded',
          'reconsider',
          'newComparison',
        ].includes(key)
      )
    return step + '.' + key === last.field
  }
  if (last.dossier && step >= '20' && !enough(p, '19')) return false
  if (step > '20') {
    const gate = p.history.findLast((h) => h.stage === 4)
    return (
      !!gate &&
      !gate.stale &&
      gate.outcome === 'İlerleyin' &&
      enough(p, '20') &&
      aReady(p)
    )
  }
  return true
}
function aReady(p: Plan) {
  return p.answers['20']?.ready === 'Karşılandı'
}
export function invalidate(previous: Plan, next: Plan) {
  const state = foundation(next),
    last = state.decisions.at(-1)
  if (
    !last ||
    last.revoked ||
    previous.foundation?.decisions.at(-1)?.id !== last.id ||
    ((!!last.dossier || next.foundation?.brief === undefined) &&
      last.signature === signature(next, !!last.dossier))
  )
    return next
  return {
    ...next,
    foundation: {
      ...state,
      decisions: state.decisions.map((d) =>
        d.id === last.id ? { ...d, revoked: true } : d,
      ),
    },
  }
}
const word = (v: unknown) =>
  typeof v === 'number' || meaningful(v) ? String(v) : 'Bilinmiyor'
export function foundationDoc(p: Plan, decision?: DecisionForm, at?: string) {
  const a = p.answers,
    g = foundation(p).inputs,
    c = cash(p),
    r = evaluate(p),
    latest = access(p)
  const rows = (id: string, k: string) =>
    Array.isArray(a[id]?.[k])
      ? (a[id][k] as Record<string, string>[])
          .map((row) => Object.values(row).join(', '))
          .join('. ')
      : 'Bilinmiyor'
  const line = (label: string, v: unknown) => label + ': ' + word(v)
  const sections: [string, string[], Criterion[]][] = [
    [
      'Kim, hangi sorunu yaşıyor?',
      [
        word(a['05']?.group),
        word(a['05']?.event),
        line('Ölçülen kayıp', g.lossMeasure),
      ],
      ['Z2', 'Z3'],
    ],
    [
      'Müşteri hangi somut adımı attı?',
      [
        word(a['15']?.signal),
        line('Teklif', a['15']?.offered),
        line('Davranış', a['15']?.committed),
        line('Eşik', a['15']?.threshold),
        a['00']?.mode === 'Ücretsiz hizmet'
          ? line('Katılım', a['15']?.attended)
          : line('Ödeme', a['15']?.paid),
      ],
      ['Z6', 'D1'],
    ],
    [
      'Hangi yollar açık?',
      [word(a['11']?.current), rows('11', 'options')],
      ['Z5', 'D2'],
    ],
    [
      'Hesap hangi koşulda tutuyor?',
      [
        line('Dönem', g.period),
        line('Talep tahmini', market(p)),
        line('Kapasite', a['09']?.capacity),
        line(
          'Nakit süresi (ay)',
          numberValue(g.monthlyOutflow) && typeof a['16']?.balance === 'number'
            ? Math.floor(a['16'].balance / Number(g.monthlyOutflow))
            : null,
        ),
        ...(a['00']?.mode === 'Ücretsiz hizmet'
          ? [
              line('Bütçe', a['16']?.fund),
              line('Hizmet gideri', a['16']?.serviceCost),
            ]
          : [
              line('Birim katkı', money(c.contribution)),
              line('Gereken satış', c.breakEven),
            ]),
        line('Nakit açığı', money(c.gap)),
      ],
      ['Z4', 'Z7'],
    ],
    [
      'Hangi soru hâlâ açık?',
      [
        word(a['10']?.claim),
        g.assumption || 'Denenmedi',
        ...(foundation(p).assumptions ?? []).map(
          (a) => a.claim + ' (' + a.status + ')',
        ),
        rows('17', 'risks'),
        line('Durma kuralı', g.riskStop),
      ],
      ['Z8', 'Z9'],
    ],
    [
      'Kararı kim verecek?',
      [
        word(a['01']?.owner),
        line(
          'Kalan bütçe',
          typeof a['02']?.budget === 'number' &&
            typeof a['02']?.spent === 'number'
            ? money(a['02'].budget - a['02'].spent)
            : null,
        ),
        line(
          'Bitiş',
          calendar(a['02']?.end) ? dateLabel(String(a['02'].end)) : null,
        ),
      ],
      ['Z1', 'D6'],
    ],
  ]
  const appendix: string[] = []
  function brief(text: string, max = 195) {
    if (text.length <= max) return text
    appendix.push(text)
    const excerpt = text.slice(0, max).replace(/\s+\S*$/, '')
    return excerpt + '… [' + appendix.length + ']'
  }
  const docs = sections.flatMap(([heading, lines, ids]) => {
    const refs = p.evidence.filter((e) => ids.some((id) => bound(e, id)))
    const sources = refs
      .map(
        (e) => e.source + ' (' + dateLabel(e.observed!) + ', ' + e.stance + ')',
      )
      .join('. ')
    return [
      '## ' + heading,
      brief(lines.join('. ')),
      sources ? brief(sources, 100) : 'Bağlı kaynak bekleniyor.',
    ]
  })
  const record = decision || latest.last
  return [
    '# Stratejik planlama temel belgesi',
    brief(p.name, 80),
    at ? dateLabel(at) : 'Güncel taslak',
    ...docs,
    '## Geçiş kararı',
    'Öneri: ' + r.outcome,
    record
      ? brief(record.outcome + '. ' + record.reason + ' · ' + record.owner)
      : 'Henüz karar kaydedilmedi.',
    ...(!decision && latest.last ? [brief(latest.reason)] : []),
    ...(record?.outcome === results[1]
      ? [
          'Planlanacak konu: ' +
            scopeFields.find(([key]) => key === record.field)?.[1],
          brief(record.question, 80),
          record.assignee + ' · ' + dateLabel(record.due),
          brief(record.proof, 80),
        ]
      : []),
    ...(appendix.length
      ? ['## Ek belgeler', ...appendix.map((v, i) => '[' + (i + 1) + '] ' + v)]
      : []),
  ].join('\n\n')
}
export function decide(p: Plan, input: DecisionForm) {
  const state = foundation(p),
    r = evaluate(p),
    owner = String(p.answers['01']?.owner ?? '').trim()
  if (
    !input.reviewed ||
    !owner ||
    input.owner.trim() !== owner ||
    !meaningful(input.reason)
  )
    throw Error('Karar sahibini, gerekçeyi ve inceleme onayını doğrulayın.')
  if (
    !results.includes(input.outcome) ||
    results.indexOf(input.outcome) > results.indexOf(r.outcome)
  )
    throw Error('Dayanaklar bu kapsamı açmıyor.')
  if (
    input.outcome !== results[0] &&
    input.materialSupports?.length &&
    (!meaningful(input.supportReason) ||
      input.materialSupports.some(
        (id) =>
          !r.rows.some((row) => row.id === id && id.startsWith('D') && !row.ok),
      ))
  )
    throw Error('Eksik desteğin seçilecek yolu nasıl etkilediğini açıklayın.')
  if (input.outcome === results[1]) {
    if (input.field === '19.goals' && !enough(p, '18'))
      throw Error('Önce 18. adımda yolu ve gerekçesini kaydedin.')
    if (
      !scopeFields.some(([field]) => field === input.field) ||
      ![input.question, input.assignee, input.proof].every(meaningful) ||
      !calendar(input.due) ||
      input.due < today() ||
      input.due > String(p.answers['02']?.end)
    )
      throw Error(
        'Konuyu, soruyu, sorumluyu, geçerli tarihi ve kapanış kanıtını yazın.',
      )
    if (
      state.decisions.some(
        (d) =>
          d.outcome === results[1] &&
          d.question.trim().toLocaleLowerCase('tr') ===
            input.question.trim().toLocaleLowerCase('tr'),
      )
    )
      throw Error('Aynı açık soru için ikinci koşullu izin verilemez.')
  }
  const previous = state.decisions.at(-1)
  if (
    input.outcome !== 'Koşullu hazır' &&
    previous &&
    !previous.revoked &&
    previous.signature === signature(p) &&
    previous.outcome === input.outcome &&
    previous.owner === input.owner &&
    previous.reason === input.reason &&
    JSON.stringify(previous.materialSupports ?? []) ===
      JSON.stringify(input.materialSupports ?? []) &&
    previous.supportReason === input.supportReason
  )
    return p
  const at = now(),
    decision: Transition = {
      ...input,
      id: crypto.randomUUID(),
      at,
      signature: signature(p),
      recommendation: r.outcome,
      document: foundationDoc(p, input, at),
      dossier: dossierDoc(p, input, at),
      comparison: comparison(p),
    }
  const next = {
    ...p,
    foundation: { ...state, decisions: [...state.decisions, decision] },
  }
  if (input.outcome !== results[1]) return next
  return {
    ...next,
    work: [
      ...(p.work || []),
      {
        id: 'gecis:' + decision.id,
        title: input.question,
        owner: input.assignee,
        stage: 4,
        due: input.due,
        status: 'Açık' as const,
        proof: '',
        updated: at,
      },
    ],
  }
}
export function validFoundation(v: unknown) {
  if (v === undefined) return true
  if (!v || typeof v !== 'object') return false
  const f = v as Foundation
  return (
    f.version === 1 &&
    validBrief(f.brief) &&
    !!f.inputs &&
    typeof f.inputs === 'object' &&
    !Array.isArray(f.inputs) &&
    Object.entries(f.inputs).every(
      ([k, val]) => Object.hasOwn(inputLabels, k) && typeof val === 'string',
    ) &&
    (f.assumptions === undefined ||
      (Array.isArray(f.assumptions) &&
        f.assumptions.every(
          (a) =>
            a &&
            meaningful(a.id) &&
            meaningful(a.claim) &&
            typeof a.critical === 'boolean' &&
            ['route', 'question', 'commitment'].every(
              (k) =>
                a[k as keyof Assumption] === undefined ||
                typeof a[k as keyof Assumption] === 'string',
            ) &&
            (a.exposure === undefined ||
              ['Araştırma', 'Taahhüt'].includes(a.exposure)) &&
            ['impact', 'refute', 'evidence'].every(
              (k) => typeof a[k as keyof Assumption] === 'string',
            ) &&
            ['Denenmedi', 'Desteklendi', 'Çürüdü'].includes(a.status),
        ) &&
        new Set(f.assumptions.map((a) => a.id)).size ===
          f.assumptions.length)) &&
    Array.isArray(f.decisions) &&
    f.decisions.every(
      (d) =>
        d &&
        results.includes(d.outcome) &&
        (d.materialSupports === undefined ||
          (Array.isArray(d.materialSupports) &&
            d.materialSupports.every((id) =>
              criteria.slice(9).some((c) => c[0] === id),
            ))) &&
        (d.supportReason === undefined ||
          typeof d.supportReason === 'string') &&
        results.includes(d.recommendation) &&
        (d.dossier === undefined || meaningful(d.dossier)) &&
        (d.comparison === undefined || validComparison(d.comparison)) &&
        ['owner', 'at', 'id', 'signature', 'document', 'reason'].every((k) =>
          meaningful(d[k as keyof Transition]),
        ) &&
        Number.isFinite(Date.parse(d.at)) &&
        d.reviewed === true &&
        (d.revoked === undefined || typeof d.revoked === 'boolean') &&
        ['field', 'question', 'due', 'assignee', 'proof'].every(
          (k) => typeof d[k as keyof Transition] === 'string',
        ) &&
        (d.outcome !== results[1] ||
          (calendar(d.due) &&
            scopeFields.some(([field]) => field === d.field) &&
            [d.question, d.proof, d.assignee].every(meaningful))),
    ) &&
    new Set(f.decisions.map((d) => d.id)).size === f.decisions.length
  )
}
export function validLink(e: Record<string, unknown>) {
  return (
    (e.criteria === undefined ||
      (Array.isArray(e.criteria) &&
        e.criteria.every((id) =>
          criteria.some(
            (c) => c[0] === id && c[4].split(' ').includes(String(e.step)),
          ),
        ))) &&
    (e.side === undefined ||
      ['Müşteri', 'Diğer taraf', 'Eşleşme'].includes(String(e.side))) &&
    (e.participants === undefined ||
      (Array.isArray(e.participants) && e.participants.every(meaningful))) &&
    validSurprise(e) &&
    validReview(e.review) &&
    (e.place === undefined || typeof e.place === 'string') &&
    (e.customerGroup === undefined || typeof e.customerGroup === 'string') &&
    (e.period === undefined || typeof e.period === 'string') &&
    (e.observed === undefined || calendar(e.observed)) &&
    (e.stance === undefined ||
      ['Destek', 'Karşı bulgu'].includes(String(e.stance)))
  )
}
