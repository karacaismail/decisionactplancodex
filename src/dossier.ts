import { researchSummary, researchOptions, situation } from './research.ts'
import { calendar, cash, dateLabel, money, today, type Plan } from './domain.ts'
import {
  evaluate,
  access,
  scopeFields,
  foundation,
  type Criterion,
  type DecisionForm,
} from './readiness.ts'

import {
  validStudies,
  studyReport,
  scenarioStudy,
  scenarioAmounts,
  type Study,
} from './preparationMethods.ts'

export const briefLabels = {
  question: 'Stratejin karar sorusu',
  due: 'Önerilen karar tarihi',
  horizon: 'Uzun vadeli amaç',
  outside: 'Kapsam dışındaki işler',
  limits: 'Aşılmayacak sınırlar',
  unknown: 'Seçimi değiştirecek bilinmeyen',
  experiment: 'İki yolu ayıracak küçük deneme',
  assignee: 'Denemenin sorumlusu',
  deadline: 'Denemenin son tarihi',
  measure: 'Ortak ölçü ve önem sırası',
  measureAt: 'Ölçünün belirlendiği gün',
  omitted: 'Uygulanamayan üçüncü yol ve gerekçesi',
  axisA: 'Birinci belirsizlik',
  axisB: 'İkinci bağımsız belirsizlik',
} as const
export const routeLabels = {
  customer: 'Hedef müşteri',
  channel: 'Erişim yolu',
  difference: 'Müşteri neden bu yolu seçer?',
  payer: 'Kim öder veya bütçe ayırır?',
  profit: 'Kazanç kimde kalır?',
  skills: 'Gereken beceri',
  build: 'Kendimiz kurarsak',
  buy: 'Satın alırsak',
  partner: 'Ortakla çalışırsak',
  cost: 'Bedel aralığı, birimi ve dönemi',
  time: 'Gereken süre',
  tradeoff: 'Vazgeçilecek iş',
  reversal: 'Geri dönüş bedeli',
  failure: 'Başarısızlığın olası nedeni',
  reaction: 'Rakibin olası karşılığı',
  warning: 'Erken işaret',
  response: 'İlk önlem',
  reopen: 'Seçimi yeniden açacak bulgu',
  unitRevenue: 'Satış başına gelir (TL)',
  unitCost: 'Satış başına gider (TL)',
  fixedCost: 'Dönemin sabit gideri (TL)',
  period: 'Hesap dönemi',
  result: 'Ortak ölçüyle deneme sonucu',
  testProof: 'Denemenin tarihli kanıtı',
} as const
export const claimKinds = ['Gözlem', 'Hesap', 'Varsayım', 'Bilinmeyen'] as const
export const scenarioSides = [
  ['lowLow', 'düşük', 'düşük'],
  ['lowHigh', 'düşük', 'yüksek'],
  ['highLow', 'yüksek', 'düşük'],
  ['highHigh', 'yüksek', 'yüksek'],
] as const
export type RouteNotes = Partial<
  Record<keyof typeof routeLabels | 'testBasis', string>
>
export type Claim = {
  id: string
  text: string
  kind: (typeof claimKinds)[number]
  route: string
  group?: string
  period?: string
  criterion: Criterion | ''
  confidence: string
  why: string
  calculation: string
  support: string
  counter: string
}
export type Scenario = {
  signal?: string
  action?: string
  effects?: Record<string, string>
  units?: Record<string, string>
}
export type OpenDecision = {
  id: string
  question: string
  routes: string[]
  proof: string
  test: string
  owner: string
  due: string
  change: string
  reversal: string
}
export type Brief = Partial<Record<keyof typeof briefLabels, string>> & {
  routes?: Record<string, RouteNotes>
  claims?: Claim[]
  studies?: Study[]
  openDecisions?: OpenDecision[]
  scenarios?: Record<string, Scenario>
}
export type Route = { id: string; name: string; cost: string; source: string }
export const blank = 'Bilinmiyor'
const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const display = (v: unknown) =>
  typeof v === 'number' ? String(v) : clean(v) || blank
const norm = (v: unknown) =>
  clean(v).normalize('NFC').toLocaleLowerCase('tr').replace(/\s+/g, ' ')
export function legacyId(row: Record<string, string>) {
  return (
    row._id ||
    'eski-' +
      Array.from(norm(row.Çözüm), (c) => c.codePointAt(0)!.toString(16)).join(
        '-',
      )
  )
}
export function routes(p: Plan): Route[] {
  const a = p.answers['11']
  const rows = Array.isArray(a?.options)
    ? (a.options as Record<string, string>[])
    : []
  return [
    ...(clean(a?.current)
      ? [{ id: 'current', name: String(a.current), cost: '', source: '' }]
      : []),
    ...rows
      .filter((o) => clean(o.Çözüm))
      .map((o) => ({
        id: legacyId(o),
        name: o.Çözüm,
        cost: o.Bedel,
        source: o.Dayanak,
      })),
  ]
}
const dictionary = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const fields = (v: unknown, keys: string[]) =>
  dictionary(v) &&
  Object.entries(v).every(([k, x]) => keys.includes(k) && typeof x === 'string')
const safeId = (id: string) =>
  !!id.trim() && !['__proto__', 'constructor', 'prototype'].includes(id)
const mapValid = (v: unknown, ok: (x: unknown) => boolean) =>
  dictionary(v) && Object.entries(v).every(([id, x]) => safeId(id) && ok(x))
export const compareColumns = [
  'customer',
  'channel',
  'difference',
  'cost',
  'tradeoff',
  'reopen',
] as const
export type ComparisonRow = {
  name: string
  values: Record<(typeof compareColumns)[number], string>
}
export function comparison(p: Plan): ComparisonRow[] {
  return routes(p).map((r) => ({
    name: r.name,
    values: Object.fromEntries(
      compareColumns.map((k) => [
        k,
        p.foundation?.brief?.routes?.[r.id]?.[k] ||
          (k === 'cost' ? r.cost : '') ||
          blank,
      ]),
    ) as ComparisonRow['values'],
  }))
}
export function validComparison(v: unknown) {
  return (
    Array.isArray(v) &&
    v.every(
      (r) =>
        dictionary(r) &&
        typeof r.name === 'string' &&
        dictionary(r.values) &&
        fields(r.values, [...compareColumns]) &&
        compareColumns.every(
          (k) => typeof (r.values as Record<string, unknown>)[k] === 'string',
        ),
    )
  )
}
export function validBrief(value: unknown): boolean {
  if (value === undefined) return true
  if (!dictionary(value)) return false
  const {
    routes: options,
    claims,
    scenarios,
    studies,
    openDecisions,
    ...general
  } = value
  return (
    validStudies(studies) &&
    (openDecisions === undefined ||
      (Array.isArray(openDecisions) &&
        openDecisions.every(
          (q) =>
            dictionary(q) &&
            typeof q.id === 'string' &&
            safeId(q.id) &&
            [
              'question',
              'proof',
              'test',
              'owner',
              'due',
              'change',
              'reversal',
            ].every((k) => typeof q[k] === 'string') &&
            (!q.due || calendar(q.due)) &&
            Array.isArray(q.routes) &&
            q.routes.every((id) => typeof id === 'string' && safeId(id)) &&
            new Set(q.routes).size === q.routes.length,
        ) &&
        new Set(openDecisions.map((q) => q.id)).size ===
          openDecisions.length)) &&
    fields(general, Object.keys(briefLabels)) &&
    ['due', 'deadline', 'measureAt'].every(
      (k) => !general[k] || calendar(general[k]),
    ) &&
    (options === undefined ||
      mapValid(options, (r) =>
        fields(r, [...Object.keys(routeLabels), 'testBasis']),
      )) &&
    (scenarios === undefined ||
      (dictionary(scenarios) &&
        Object.entries(scenarios).every(([k, s]) => {
          if (!scenarioSides.some(([side]) => side === k) || !dictionary(s))
            return false
          const { effects, units, ...rest } = s
          return (
            fields(rest, ['signal', 'action']) &&
            (effects === undefined ||
              mapValid(effects, (v) => typeof v === 'string')) &&
            (units === undefined ||
              mapValid(
                units,
                (v) =>
                  typeof v === 'string' && (v === '' || quantity(v) !== null),
              ))
          )
        }))) &&
    (claims === undefined ||
      (Array.isArray(claims) &&
        claims.every(
          (c) =>
            dictionary(c) &&
            [
              'id',
              'text',
              'kind',
              'route',
              'criterion',
              'confidence',
              'why',
              'calculation',
              'support',
              'counter',
            ].every((k) => typeof c[k] === 'string') &&
            [c.group, c.period].every(
              (x) => x === undefined || typeof x === 'string',
            ) &&
            safeId(String(c.id)) &&
            claimKinds.some((k) => k === c.kind) &&
            ['', 'Düşük', 'Orta', 'Yüksek'].includes(String(c.confidence)) &&
            /^(|Z[1-9]|D[1-6])$/.test(String(c.criterion)),
        ) &&
        new Set(claims.map((c) => c.id)).size === claims.length))
  )
}
function quantity(v: unknown) {
  if (typeof v !== 'string' || !/^\d+(?:[.,]\d+)?$/.test(v.trim())) return null
  const n = Number(v.trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
export function scenarioBudget(notes: RouteNotes | undefined, units?: string) {
  if (!notes?.period?.trim()) return blank
  const revenue = quantity(notes.unitRevenue),
    cost = quantity(notes.unitCost),
    fixed = quantity(notes.fixedCost),
    volume = quantity(units)
  if (revenue === null || cost === null || fixed === null || volume === null)
    return blank
  const balance = volume * (revenue - cost) - fixed
  if (!Number.isFinite(balance)) return blank
  const n = (v: number) =>
    v.toLocaleString('tr-TR', { maximumFractionDigits: 2, useGrouping: false })
  return (
    n(volume) +
    ' × (' +
    n(revenue) +
    ' − ' +
    n(cost) +
    ') − ' +
    n(fixed) +
    ' = ' +
    n(balance) +
    ' TL. ' +
    n(Math.abs(balance)) +
    ' TL ' +
    (balance < 0 ? 'açık' : balance > 0 ? 'fazla' : 'denge') +
    ' (' +
    notes.period +
    ').'
  )
}
export function scenarioVolume(p: Plan, key: string, route: string) {
  const study =
    p.answers['00']?.mode === 'Ücretsiz hizmet'
      ? undefined
      : scenarioStudy(p, key, route)
  return (
    study?.values.volume ||
    p.foundation?.brief?.scenarios?.[key]?.units?.[route] ||
    ''
  )
}
export function setScenarioVolume(
  b: Brief,
  key: string,
  route: string,
  volume: string,
  paid = true,
): Brief {
  const sc = b.scenarios?.[key]
  return {
    ...b,
    scenarios: {
      ...b.scenarios,
      [key]: { ...sc, units: { ...sc?.units, [route]: volume } },
    },
    ...(paid && b.studies
      ? {
          studies: b.studies.map((s) =>
            s.method === 'sensitivity' &&
            s.values.quadrant === key &&
            s.values.route === route
              ? { ...s, values: { ...s.values, volume } }
              : s,
          ),
        }
      : {}),
  }
}
export function scenarioBudgetFor(p: Plan, key: string, route: string) {
  const b = p.foundation?.brief
  const study =
    p.answers['00']?.mode === 'Ücretsiz hizmet'
      ? undefined
      : scenarioStudy(p, key, route)
  return scenarioBudget(
    scenarioAmounts(b?.routes?.[route], study),
    scenarioVolume(p, key, route),
  )
}
export function hasScenarios(b: Brief) {
  return !!norm(b.axisA) && !!norm(b.axisB) && norm(b.axisA) !== norm(b.axisB)
}
function datedProof(p: Plan, id: string | undefined, day: string) {
  return p.evidence.find(
    (e) =>
      e.id === id &&
      !!clean(e.source) &&
      calendar(e.observed) &&
      e.observed <= day,
  )
}
export function criticalClaimsOK(p: Plan, id: Criterion, day: string) {
  return (p.foundation?.brief?.claims ?? [])
    .filter((c) => c.criterion === id)
    .every((c) => {
      const proof = datedProof(p, c.support, day)
      return (
        !!clean(c.text) &&
        ['Gözlem', 'Hesap'].includes(c.kind) &&
        !!c.confidence &&
        !!clean(c.why) &&
        (c.kind !== 'Hesap' || !!clean(c.calculation)) &&
        proof?.stance === 'Destek' &&
        !!proof.criteria?.includes(id) &&
        (!c.route || routes(p).some((r) => r.id === c.route)) &&
        !c.counter
      )
    })
}
export function compareReady(p: Plan, day = today()) {
  const a = p.answers['11'],
    b = p.foundation?.brief ?? {},
    items = routes(p)
  if (!clean(a?.current)) return false
  const alternatives = items.filter((r) => r.id !== 'current')
  const names = new Set(items.map((r) => norm(r.name)))
  if (new Set(items.map((r) => r.id)).size !== items.length) return false
  if (!alternatives.length || names.size !== items.length) return false
  if (a.risk !== 'Yüksek') return true
  if (!clean(a.review)) return false
  if (alternatives.length === 1) return a.exception === 'Evet'
  if (alternatives.length === 2 && !clean(b.omitted)) return false
  if (!clean(b.measure) || !calendar(b.measureAt) || b.measureAt > day)
    return false
  const observations = alternatives.flatMap((r) => {
    const d = b.routes?.[r.id],
      proof = datedProof(p, d?.testProof, day)
    if (
      !d?.difference?.trim() ||
      !clean(d.result) ||
      d.testBasis !== testBasis(b) ||
      !routeProof(proof) ||
      proof!.observed! < b.measureAt!
    )
      return []
    return [
      {
        difference: [d.customer, d.channel, d.difference].map(norm).join('|'),
        id: proof!.id,
      },
    ]
  })
  return observations.some((v, i) =>
    observations
      .slice(i + 1)
      .some((w) => v.id !== w.id && v.difference !== w.difference),
  )
}
export function testBasis(b: Brief) {
  return JSON.stringify([clean(b.measure), b.measureAt || ''])
}
export function routeProof(e: Plan['evidence'][number] | undefined) {
  return (
    !!e &&
    ['11', '15'].includes(e.step) &&
    e.stance === 'Destek' &&
    !!e.observed &&
    ['Gözlem', 'Yazılı taahhüt', 'Ödeme', 'Teslim veya kullanım'].includes(
      e.kind || '',
    )
  )
}
export function evidenceAnchor(id: string) {
  return (
    'kanit-' + Array.from(id, (c) => c.codePointAt(0)!.toString(16)).join('-')
  )
}
export function sourceLine(p: Plan, id: string) {
  const text = claimEvidence(p, id)
  return id && p.evidence.some((e) => e.id === id && e.step <= '17')
    ? text + ' [Kanıt kaydı](#' + evidenceAnchor(id) + ')'
    : text
}
export function sourceLink(p: Plan, line: string) {
  const marker = ' [Kanıt kaydı](#'
  const at = line.lastIndexOf(marker)
  if (at < 0 || !line.endsWith(')')) return undefined
  const anchor = line.slice(at + marker.length, -1)
  const record = p.evidence.find(
    (e) => e.step <= '17' && evidenceAnchor(e.id) === anchor,
  )
  return record ? { id: record.id, text: line.slice(0, at) } : undefined
}
export function editClaim(c: Claim, patch: Partial<Claim>): Claim {
  const changed = ['text', 'group', 'period', 'route'].some(
    (k) =>
      Object.hasOwn(patch, k) &&
      c[k as keyof Claim] !== patch[k as keyof Claim],
  )
  return { ...c, ...(changed ? { support: '', counter: '' } : {}), ...patch }
}
export function claimEvidence(p: Plan, id: string) {
  const e = p.evidence.find((item) => item.id === id)
  return e
    ? [e.title, e.source, dateLabel(e.observed ?? ''), e.stance]
        .filter(Boolean)
        .join(' · ')
    : id
      ? 'Bağlı kanıt kaldırıldı'
      : blank
}
export function dossierDoc(p: Plan, decision?: DecisionForm, at?: string) {
  const a = p.answers,
    f = foundation(p),
    b = f.brief ?? {},
    g = f.inputs,
    paths = routes(p),
    c = cash(p)
  const get = (id: string, key: string) => display(a[id]?.[key])
  const rows = (id: string, key: string) => {
    const val = a[id]?.[key]
    return Array.isArray(val)
      ? (val as Record<string, string>[])
          .map((r) =>
            Object.entries(r)
              .filter(([k]) => k !== '_id')
              .map(([k, v]) => k + ' · ' + display(v))
              .join('. '),
          )
          .join('\n') || blank
      : blank
  }
  const free = a['00']?.mode === 'Ücretsiz hizmet'
  const live = evaluate(p)
  const permit = decision
    ? {
        active: decision.outcome !== 'Henüz hazır değil',
        reason: decision.reason,
        last: decision,
      }
    : access(p)
  const rec = permit.last
  const questions = (b.openDecisions ?? []).filter((q) => q.question.trim())
  const question =
    questions[0]?.question ||
    b.question?.trim() ||
    'Hangi müşteriye hangi yolla ulaşırız? Müşteri bizi neden seçer?'
  const conditional = permit.active && rec?.outcome === 'Koşullu hazır'
  const firstQuestion = conditional ? rec.question : question
  const missing = live.rows.find((r) => r.id.startsWith('Z') && !r.ok)
  const status = !rec
    ? 'Geçiş kararı bekleniyor. Yazılımın önerisi: ' + live.outcome + '.'
    : rec.outcome === 'Henüz hazır değil'
      ? 'Henüz hazır değil. ' + rec.reason
      : !permit.active
        ? permit.reason + ' Geçiş kararını yeniden inceleyin.'
        : conditional
          ? 'Yalnız izin verilen soru üzerinde çalışın.'
          : 'Planlamaya hazır. Yolları karşılaştırın. Seçiminizi ve vazgeçtiğiniz işi yazın.'
  const firstAction = conditional
    ? 'Beklenen kanıt: ' +
      rec.proof +
      '. Sorumlu: ' +
      rec.assignee +
      '. Son gün: ' +
      dateLabel(rec.due) +
      '.'
    : !permit.active && missing
      ? 'Eksik kanıt: ' +
        missing.title +
        '. ' +
        missing.hint +
        ' Takip edecek karar sahibi: ' +
        get('01', 'owner') +
        '.'
      : 'Seçimi değiştirecek bulgu: ' +
        display(
          questions.length ? questions[0].change : b.unknown || a['10']?.claim,
        ) +
        '.'
  const testOptions = researchOptions(p, 'test', 'test')
  const summary = [
    '# Strateje devir raporu',
    p.name + (p.example ? ' (örnek plan)' : ''),
    at
      ? 'Karar günündeki kopya · ' +
        dateLabel(at) +
        ' · Kaynak sürümü ' +
        p.revision
      : 'Güncel taslak · Kaynak sürümü ' + p.revision,
    '## Stratej hangi kararı verecek?',
    firstQuestion,
    status,
    firstAction.replace(/([?!.])\.$/, '$1'),
    'Karar sahibi: ' +
      get('01', 'owner') +
      (questions.length && !conditional
        ? '. Sorunun sorumlusu: ' + display(questions[0].owner)
        : '') +
      '. Önerilen karar tarihi: ' +
      dateLabel(
        conditional
          ? rec.due
          : questions.length
            ? questions[0].due
            : b.due || '',
      ) +
      '.',
    'Amaç: ' +
      get('01', 'goal') +
      '. Bütçe sınırı: ' +
      money(typeof a['02']?.budget === 'number' ? a['02'].budget : null) +
      '. Son gün: ' +
      dateLabel(String(a['02']?.end ?? '')) +
      '.',
    'Aday yollar: ' + (paths.map((r) => r.name).join(' veya ') || blank) + '.',
    get('15', 'offered') +
      ' teklif, ' +
      get('15', 'committed') +
      ' taahhüt, ' +
      (free
        ? get('15', 'attended') + ' katılım'
        : get('15', 'paid') + ' ödeme') +
      '. Sayılan davranış: ' +
      get('15', 'signal') +
      '.',
    'Seçimi değiştirecek bilinmeyen: ' +
      display(
        conditional
          ? rec.proof
          : questions.length
            ? questions[0].change
            : b.unknown || a['10']?.claim,
      ) +
      '.',
    'Yazılımın önerisi: ' +
      live.outcome +
      '. ' +
      (rec
        ? 'Karar: ' + rec.outcome + '. ' + rec.reason
        : 'Taslak geçiş izni vermez.'),
    ...(live.required < 9 &&
    live.rows.find((r) => r.id.startsWith('Z') && !r.ok)
      ? [
          'İlk engel: ' +
            live.rows.find((r) => r.id.startsWith('Z') && !r.ok)!.hint,
        ]
      : []),
    ...(conditional && rec
      ? [
          'İzin verilen konu: ' +
            (scopeFields.find(([id]) => id === rec.field)?.[1] || rec.field),
          rec.assignee + ' · ' + dateLabel(rec.due) + ' · ' + rec.proof,
        ]
      : []),
    ...(questions.length
      ? [
          '## Açık kararlar',
          ...questions.flatMap((q, i) => [
            i + 1 + '. ' + q.question,
            'Seçenekler: ' +
              (q.routes
                .map(
                  (id) =>
                    paths.find((r) => r.id === id)?.name || 'Yol kaldırıldı',
                )
                .join(' veya ') || blank),
            'Kararı değiştirecek bulgu: ' + display(q.change),
            'Dayanak: ' + sourceLine(p, q.proof),
            'Deneme: ' +
              (q.test
                ? testOptions.find((t) => t.value === q.test)?.label ||
                  'Deneme kaldırıldı'
                : blank),
            'Sorumlu: ' +
              display(q.owner) +
              '. Son gün: ' +
              dateLabel(q.due) +
              '.',
            'Geri dönüş bedeli: ' + display(q.reversal),
          ]),
        ]
      : []),
    ...researchSummary(p),
    '## Amaç ve sınırlar',
    'Uzun vadeli amaç: ' +
      display(b.horizon) +
      '. Kapsam dışı: ' +
      display(b.outside) +
      '. Aşılmayacak sınır: ' +
      display(b.limits) +
      '. Durma koşulu: ' +
      get('02', 'stop'),
    '## Sorun, müşteri ve pazar',
    get('05', 'event') +
      '. Ölçülen kayıp: ' +
      display(g.lossMeasure) +
      '. İlk müşteri: ' +
      get('08', 'target') +
      '. Erişim yolu: ' +
      get('08', 'access'),
    'Teklif: ' +
      get('13', 'offer') +
      '. Teslim koşulu: ' +
      get('13', 'terms') +
      '. Rakipler: ' +
      rows('09', 'rivals'),
    'Rakibin güçlü yanı: ' +
      display(g.advantage) +
      '. Zayıf yanı: ' +
      display(g.weakness),
    '## Kaynaklar ve para hesabı',
    'Dönem: ' +
      display(g.period) +
      '. Talep: ' +
      get('09', 'demand') +
      '. Kapasite: ' +
      get('09', 'capacity') +
      '.',
    free
      ? 'Finansman kaynağı: ' +
        get('00', 'funding') +
        '. Hizmet bütçesi: ' +
        get('16', 'fund') +
        ' TL. Hizmet gideri: ' +
        get('16', 'serviceCost') +
        ' TL.'
      : 'Birim gelir: ' +
        get('16', 'price') +
        ' TL. Değişken gider: ' +
        get('16', 'cost') +
        ' TL. Satış başına kalan: ' +
        money(c.contribution) +
        '. Sabit gider: ' +
        get('16', 'fixed') +
        ' TL. Gideri karşılayan satış: ' +
        display(c.breakEven) +
        '.',
    'Gerekli kaynaklar: ' +
      rows('12', 'resources') +
      '. Beceriler: ' +
      display(g.skills),
    '## Aday yolların karşılaştırması',
    'Ortak ölçü ve önem sırası: ' +
      display(b.measure) +
      '. Ölçünün belirlendiği gün: ' +
      dateLabel(b.measureAt || '') +
      '. Elenen yolun gerekçesi: ' +
      display(b.omitted),
  ]
  for (const r of paths) {
    const notes = b.routes?.[r.id] ?? {}
    summary.push(
      '## ' + (r.id === 'current' ? 'Bugünkü yöntem: ' : 'Aday yol: ') + r.name,
      'Kaydedilen bedel: ' +
        display(r.cost) +
        '. İlk dayanak: ' +
        display(r.source),
      ...(b.studies ?? [])
        .filter((s) => s.method === 'cross' && s.values.route === r.id)
        .map(
          (s) =>
            'Yolu doğuran soru: ' +
            display(s.values.origin) +
            '. ' +
            display(s.values.name),
        ),
      ...Object.entries(routeLabels).map(
        ([k, label]) =>
          label +
          ': ' +
          (k === 'testProof'
            ? claimEvidence(p, notes.testProof || '')
            : display(notes[k as keyof RouteNotes])),
      ),
    )
  }
  summary.push('## İddialar ve karşı bulgular')
  for (const claim of b.claims ?? []) {
    summary.push(
      display(claim.text) +
        ' · ' +
        claim.kind +
        '. Güven: ' +
        display(claim.confidence) +
        '. Gerekçe: ' +
        display(claim.why),
      'İlgili yol: ' +
        (paths.find((r) => r.id === claim.route)?.name ||
          (claim.route ? 'Yol kaldırıldı' : 'Tüm yollar')) +
        '. Hesap: ' +
        display(claim.calculation),
      'Destek: ' +
        claimEvidence(p, claim.support) +
        '. Karşı bulgu: ' +
        claimEvidence(p, claim.counter),
    )
  }
  if (!b.claims?.length) summary.push('Yola bağlı iddia henüz yazılmadı.')
  summary.push(
    '## Varsayımlar ve denemeler',
    get('10', 'claim') +
      '. Durum: ' +
      display(g.assumption) +
      '. Fikri değiştirecek bulgu: ' +
      get('10', 'refute'),
    ...(f.assumptions ?? []).map(
      (v) =>
        v.claim +
        ' · ' +
        v.status +
        '. ' +
        v.refute +
        '. Dayanak: ' +
        claimEvidence(p, v.evidence),
    ),
    '## Koşullar değişirse',
    'Dış koşullar: ' + rows('04', 'external'),
  )
  if (hasScenarios(b)) {
    for (const [key, left, right] of scenarioSides) {
      const item = b.scenarios?.[key]
      summary.push(
        b.axisA + ' ' + left + ', ' + b.axisB + ' ' + right,
        'Erken işaret: ' +
          display(item?.signal) +
          '. Önlem: ' +
          display(item?.action),
        ...paths.map(
          (r) =>
            r.name +
            ': ' +
            display(item?.effects?.[r.id]) +
            '. Dönem sonucu: ' +
            scenarioBudgetFor(p, key, r.id),
        ),
      )
    }
  } else
    summary.push(
      'Seçimi etkileyen koşul: ' +
        display(b.axisA || b.unknown || a['10']?.claim),
    )
  summary.push(
    '## Durum özeti',
    ...situation(p).flatMap((group) => [
      group.title,
      ...(group.items.length
        ? group.items.map((i) => i.step + '. adım: ' + i.text)
        : ['Kayıt bekleniyor. Kaynak adım: ' + group.steps.join(', ') + '.']),
    ]),
    ...studyReport(p),
    '## Riskler ve sonraki deneme',
    rows('17', 'risks'),
    'Durma kuralı: ' + display(g.riskStop),
    'En küçük deneme: ' +
      display(b.experiment) +
      '. Sorumlu: ' +
      display(b.assignee) +
      '. Tarih: ' +
      dateLabel(b.deadline || ''),
    '## Kararlar ve dayanaklar',
    'İkinci görüş: ' +
      display(g.reviewNote) +
      '. Görüşü veren: ' +
      display(g.reviewer),
    ...p.history
      .filter((h) => h.stage <= 3)
      .map(
        (h) =>
          h.owner +
          ' · ' +
          dateLabel(h.at) +
          ' · ' +
          h.outcome +
          '. ' +
          h.reason +
          (h.stale ? ' (Yeniden incelenecek)' : ''),
      ),
    ...p.evidence
      .filter((e) => e.step <= '17')
      .map(
        (e) =>
          '<a id="' +
          evidenceAnchor(e.id) +
          '"></a>Adım ' +
          e.step +
          ' · ' +
          claimEvidence(p, e.id),
      ),
  )
  return summary.join('\n\n')
}
