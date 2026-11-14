import { researchMethods, choices, type ResearchId } from './researchCatalog.ts'
import {
  eligible,
  ledgerTotals,
  budgetIdentityLocked,
  budgetPermits,
  suggestResearch,
  showResearchField,
  researchResult,
  researchValue,
  isResearchPick,
  selectedIds,
} from './research.ts'
import { applyEdit, calendar, dateLabel, today, type Plan } from './domain.ts'
import {
  routes,
  claimEvidence,
  scenarioSides,
  type RouteNotes,
  type Scenario,
} from './dossier.ts'

export type MethodId =
  | ResearchId
  | 'cause'
  | 'buyer'
  | 'value'
  | 'compare'
  | 'sensitivity'
  | 'learning'
export type FieldKind =
  | 'text'
  | 'amount'
  | 'count'
  | 'route'
  | 'proof'
  | 'date'
  | 'quadrant'
  | 'choice'
  | 'claim'
  | 'test'
  | 'barrier'
  | 'factor'
  | 'cause'
  | 'resource'
  | 'support'
  | 'counter'
  | 'routes'
export type Field = [key: string, label: string, kind?: FieldKind]
export type Method = {
  id: MethodId
  title: string
  book: string
  hint: string
  steps: string[]
  fields: Field[]
}
export type CriterionRow = {
  id: string
  label: string
  weight: string
  leftScore: string
  rightScore: string
}
export type Pledge = {
  kind?: 'reserve' | 'debt'
  permit?: string
  debtId?: string
  paidOn?: string
  id: string
  name: string
  amount: string
  due: string
  owner: string
  proof: string
}
export type Study = {
  pledges?: Pledge[]
  id: string
  method: MethodId
  values: Record<string, string>
  thresholdRecorded?: string
  criteria?: CriterionRow[]
}
export const methods: Method[] = [
  ...researchMethods,
  {
    id: 'cause',
    title: 'Sorunun nedenini araştır',
    book: '5 Neden',
    hint: 'İki olası neden yazın. Hangisini bir gözlemle ayırabilirsiniz?',
    steps: ['05', '06', '07'],
    fields: [
      ['first', 'İlk olası neden'],
      ['other', 'Diğer olası neden'],
      ['finding', 'İki nedeni ayıran gözlem'],
      ['meaning', 'Gözlem hangi açıklamayı güçlendirdi?'],
      ['route', 'Etkilenen yol', 'route'],
      ['proof', 'Gözlemin kaynağı', 'proof'],
    ],
  },
  {
    id: 'buyer',
    title: 'Alım kararını incele',
    book: 'Alıcı Karar Modeli',
    hint: 'Birden fazla kişi söz sahibiyse her kişinin yaptığı işi yazın.',
    steps: ['08', '14'],
    fields: [
      ['user', 'Kim kullanıyor?'],
      ['payer', 'Kim ödüyor veya kaynak sağlıyor?'],
      ['approver', 'Bütçeyi kim onaylıyor?'],
      ['blocker', 'Alımı kim, hangi durumda durdurabilir?'],
      ['behavior', 'Hangi kişi gerçekte ne yaptı?'],
      ['route', 'İlgili yol', 'route'],
      ['proof', 'Davranışın kaynağı', 'proof'],
    ],
  },
  {
    id: 'value',
    title: 'İşin değerini ve giderini incele',
    book: 'Değer Zinciri',
    hint: 'Bir iş seçin. O işin müşteriye yararını ve giderini karşılaştırın.',
    steps: ['09', '12', '13'],
    fields: [
      ['activity', 'İşin adı'],
      ['benefit', 'Müşteri bu işe neden değer veriyor?'],
      ['expense', 'İşin gideri ve dönemi'],
      ['finding', 'Yarar ile gider seçimi nasıl etkiliyor?'],
      ['route', 'İlgili yol', 'route'],
      ['proof', 'Hesabın veya gözlemin kaynağı', 'proof'],
    ],
  },
  {
    id: 'compare',
    title: 'İki yolu aynı koşullarda karşılaştır',
    book: 'Karar Matrisi ve A/B Testi',
    hint: 'Denemeden önce ölçüleri seçin. Her yolun sonucunu ayrı kaydedin.',
    steps: ['11', '15'],
    fields: [
      ['left', 'Birinci yol', 'route'],
      ['right', 'İkinci yol', 'route'],
      ['metric', 'Sayılan ortak davranış'],
      ['planned', 'Ölçülerin belirlendiği gün', 'date'],
      ['conditions', 'İki grup için ortak koşullar ve süre'],
      ['observedAt', 'Denemenin bittiği gün', 'date'],
      ['leftTotal', 'Birinci yolda denemeye katılan kişi', 'count'],
      ['leftHits', 'Birinci yolda davranışı gösteren kişi', 'count'],
      ['leftProof', 'Birinci yolun kanıtı', 'proof'],
      ['rightTotal', 'İkinci yolda denemeye katılan kişi', 'count'],
      ['rightHits', 'İkinci yolda davranışı gösteren kişi', 'count'],
      ['rightProof', 'İkinci yolun kanıtı', 'proof'],
      ['finding', 'Başka hangi fark sonucu açıklayabilir?'],
    ],
  },
  {
    id: 'sensitivity',
    title: 'Gideri karşılayan sınırı hesapla',
    book: 'Duyarlılık Analizi',
    hint: 'Değişebilecek tutarı yazın. Boş bıraktığınız tutarda kayıtlı hesap kullanılır.',
    steps: ['16', '17'],
    fields: [
      ['condition', 'Ne değişirse?'],
      ['route', 'Hesabın ait olduğu yol', 'route'],
      ['quadrant', '17. adımdaki koşulla eşleştir', 'quadrant'],
      ['price', 'Yeni satış fiyatı (TL)', 'amount'],
      ['cost', 'Yeni satış başına gider (TL)', 'amount'],
      ['fixed', 'Yeni sabit gider (TL)', 'amount'],
      ['volume', 'Bu dönemde beklenen satış adedi', 'count'],
      ['fund', 'Yeni hizmet bütçesi (TL)', 'amount'],
      ['serviceCost', 'Yeni dönem hizmet gideri (TL)', 'amount'],
      ['proof', 'Tutarın kaynağı', 'proof'],
    ],
  },
  {
    id: 'learning',
    title: 'Denemeden ne öğrendik?',
    book: 'Geri Bildirim Analizi ve Çift Döngülü Öğrenme',
    hint: 'Önce beklentiyi yazın. Denemeden sonra sonucu ve değişen fikri ekleyin.',
    steps: ['10', '15', '17'],
    fields: [
      ['expected', 'Denemeden önce ne bekliyordunuz?'],
      ['observed', 'Denemede ne gördünüz?'],
      ['reason', 'Aradaki farkı ne açıklayabilir?'],
      ['revision', 'Hangi varsayımı korudunuz veya değiştirdiniz?'],
      ['next', 'Sonraki denemede neyi sınayacaksınız?'],
      ['route', 'Etkilenen yol', 'route'],
      ['proof', 'Denemenin kaynağı', 'proof'],
    ],
  },
]
export function methodsFor(p: Plan, step: string) {
  const a = p.answers
  const suggested: Partial<Record<MethodId, boolean>> = {
    cause: !!a['05']?.event,
    buyer:
      ['İşletme', 'Kamu veya büyük kurum', 'İki taraflı pazar'].includes(
        String(a['00']?.buyer),
      ) || !!a['08']?.other,
    value:
      !!a['13']?.offer ||
      (Array.isArray(a['09']?.rivals) && !!a['09'].rivals.length),
    compare: routes(p).length >= 2,
    sensitivity:
      a['16']?.fixed != null ||
      a['16']?.fund != null ||
      !!p.foundation?.brief?.routes,
    learning: !!a['10']?.claim || !!a['15']?.signal,
  }
  return methods
    .filter((m) => m.steps.includes(step) && eligible(p, m.id))
    .map((m) => ({
      ...m,
      suggested:
        suggested[m.id] ||
        suggestResearch(p, m.id, step) ||
        !!p.foundation?.brief?.studies?.some((s) => s.method === m.id),
    }))
}
export function applicableFields(study: Study, free: boolean) {
  const method = methods.find((m) => m.id === study.method)!
  return method.fields
    .filter(([k]) => showResearchField(study, k))
    .filter(
      ([k]) =>
        method.id !== 'sensitivity' ||
        !(
          free
            ? ['route', 'quadrant', 'price', 'cost', 'fixed', 'volume']
            : ['fund', 'serviceCost']
        ).includes(k),
    )
}
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x)
const idOK = (x: unknown) =>
  typeof x === 'string' &&
  x.trim() !== '' &&
  !['__proto__', 'constructor', 'prototype'].includes(x)
function numeric(v: unknown) {
  if (
    (typeof v !== 'string' && typeof v !== 'number') ||
    !/^\d+(?:[.,]\d+)?$/.test(String(v).trim())
  )
    return undefined
  const n = Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) && n <= Number.MAX_SAFE_INTEGER ? n : undefined
}
function validInput(kind: FieldKind | undefined, value: unknown) {
  if (typeof value !== 'string') return false
  if (!value) return true
  if (kind === 'date') return calendar(value)
  if (kind === 'quadrant') return scenarioSides.some(([k]) => k === value)
  if (kind === 'count') return Number.isSafeInteger(numeric(value))
  if (kind === 'amount')
    return numeric(value) !== undefined && /^\d+([.,]\d{1,2})?$/.test(value)
  return true
}
export function validStudies(v: unknown) {
  if (v === undefined) return true
  if (!Array.isArray(v)) return false
  const usedScenarios = new Set<string>()
  return (
    v.every((s) => {
      if (!object(s) || !idOK(s.id) || !object(s.values)) return false
      const m = methods.find((m) => m.id === s.method)
      if (
        !m ||
        !Object.entries(s.values).every(([key, value]) => {
          const f = m.fields.find(([k]) => k === key)
          if (!f || !validInput(f[2], value)) return false
          if (!value) return true
          if (f[2] === 'choice') return choices[key]?.includes(String(value))
          if (f[2] === 'routes') {
            const ids = selectedIds(String(value))
            return (
              JSON.stringify(ids) === value &&
              ids.every(idOK) &&
              new Set(ids).size === ids.length
            )
          }
          return true
        })
      )
        return false
      if (
        s.thresholdRecorded !== undefined &&
        (s.method !== 'factor' || !calendar(s.thresholdRecorded))
      )
        return false
      if (m.id === 'sensitivity' && s.values.quadrant) {
        if (!s.values.route) return false
        const pair = JSON.stringify([s.values.quadrant, s.values.route])
        if (usedScenarios.has(pair)) return false
        usedScenarios.add(pair)
      }
      if (s.pledges !== undefined) {
        if (
          m.id !== 'budget' ||
          !Array.isArray(s.pledges) ||
          !s.pledges.every(
            (r) =>
              object(r) &&
              idOK(r.id) &&
              ['name', 'amount', 'due', 'owner', 'proof'].every(
                (k) => typeof r[k] === 'string',
              ) &&
              (r.kind === undefined ||
                r.kind === 'reserve' ||
                r.kind === 'debt') &&
              (r.paidOn === undefined || calendar(r.paidOn)) &&
              ['debtId', 'permit'].every(
                (k) => r[k] === undefined || typeof r[k] === 'string',
              ) &&
              (!(r.debtId || r.permit) || r.kind === 'reserve') &&
              validInput('amount', r.amount) &&
              validInput('date', r.due),
          ) ||
          new Set(s.pledges.map((r) => r.id)).size !== s.pledges.length
        )
          return false
      }
      if (s.criteria === undefined) return true
      if (m.id !== 'compare' || !Array.isArray(s.criteria)) return false
      return (
        s.criteria.every(
          (c) =>
            object(c) &&
            idOK(c.id) &&
            typeof c.label === 'string' &&
            (['weight', 'leftScore', 'rightScore'] as const).every(
              (k) =>
                typeof c[k] === 'string' &&
                (c[k] === '' ||
                  (/^\d+$/.test(c[k]) &&
                    Number(c[k]) >= 1 &&
                    Number(c[k]) <= (k === 'weight' ? 100 : 5))),
            ),
        ) && new Set(s.criteria.map((c) => c.id)).size === s.criteria.length
      )
    }) && new Set(v.map((s) => s.id)).size === v.length
  )
}
export function setStudyValue(study: Study, key: string, value: string): Study {
  if (study.method === 'budget' && budgetIdentityLocked(study, key))
    return study
  const values = { ...study.values, [key]: value }
  if (
    study.method === 'factor' &&
    [
      'name',
      'claim',
      'group',
      'period',
      'outcome',
      'routeIds',
      'scope',
    ].includes(key) &&
    study.values[key] !== value
  ) {
    delete values.support
    delete values.counter
  }
  if (
    study.method === 'strength' &&
    key === 'name' &&
    value !== study.values.name
  )
    delete values.proof
  if (
    study.method === 'budget' &&
    key === 'budgetScope' &&
    value === '02. adımdaki bütçe'
  ) {
    values.currency = 'TL'
    delete values.period
    delete values.name
    delete values.approved
    delete values.spent
  }
  if (
    study.method === 'dissent' &&
    !['response', 'revision'].includes(key) &&
    study.values[key] !== value
  ) {
    delete values.response
    delete values.revision
  }
  if (
    study.method === 'factor' &&
    key !== 'interpretation' &&
    study.values[key] !== value
  )
    delete values.interpretation
  if (
    study.method === 'factor' &&
    [
      'threshold',
      'thresholdDay',
      'why',
      'metric',
      'measureType',
      'unit',
      'currency',
      'period',
    ].includes(key) &&
    value !== study.values[key] &&
    (values.threshold || values.thresholdDay)
  )
    return { ...study, values, thresholdRecorded: today() }
  if (
    study.method === 'sensitivity' &&
    key === 'route' &&
    value !== study.values.route
  )
    delete values.quadrant
  if (
    study.method === 'compare' &&
    (key === 'left' || key === 'right') &&
    study.values[key] !== value
  ) {
    for (const suffix of ['Total', 'Hits', 'Proof']) delete values[key + suffix]
    return {
      ...study,
      values,
      criteria: study.criteria?.map((c) => ({ ...c, [key + 'Score']: '' })),
    }
  }
  return { ...study, values }
}
export function scenarioStudy(p: Plan, quadrant: string, route: string) {
  return p.foundation?.brief?.studies?.find(
    (s) =>
      s.method === 'sensitivity' &&
      s.values.route === route &&
      s.values.quadrant === quadrant,
  )
}
export function scenarioAmounts(
  base: RouteNotes | undefined,
  s: Study | undefined,
) {
  return {
    ...base,
    unitRevenue: s?.values.price || base?.unitRevenue,
    unitCost: s?.values.cost || base?.unitCost,
    fixedCost: s?.values.fixed || base?.fixedCost,
  }
}
const format = (n: number) =>
  n.toLocaleString('tr-TR', { maximumFractionDigits: 2, useGrouping: false })
function balanceLabel(n: number) {
  return (
    format(Math.abs(n)) + ' TL ' + (n < 0 ? 'açık' : n > 0 ? 'fazla' : 'denge')
  )
}
export function scopeName(p: Plan, key: string) {
  if (!key) return 'Bilinmiyor'
  return routes(p).find((r) => r.id === key)?.name || 'Yol kaldırıldı'
}
function sensitivityResult(p: Plan, s: Study) {
  const v = s.values,
    a = p.answers['16'] ?? {},
    f = p.foundation
  if (
    p.answers['00']?.mode !== 'Ücretsiz hizmet' &&
    v.route &&
    scopeName(p, v.route) === 'Yol kaldırıldı'
  )
    return ['Yol kaldırıldı. Hesabın ait olduğu yolu yeniden seçin.']
  const overall = !v.route
  const notes = overall ? undefined : f?.brief?.routes?.[v.route]
  const period = overall ? f?.inputs.costPeriod : notes?.period
  if (p.answers['00']?.mode === 'Ücretsiz hizmet') {
    const records = [
      ['Kayıtlı hesap', numeric(a.fund), numeric(a.serviceCost)],
      [
        'Bu koşul',
        numeric(v.fund || a.fund),
        numeric(v.serviceCost || a.serviceCost),
      ],
    ] as const
    return records.map(([label, fund, cost]) =>
      fund === undefined || cost === undefined || !f?.inputs.costPeriod
        ? label + ': Hizmet bütçesi, gider veya dönem eksik.'
        : label +
          ' (' +
          f.inputs.costPeriod +
          '). Hizmet bütçesi ' +
          format(fund) +
          ' TL. Hizmet gideri ' +
          format(cost) +
          ' TL. Sonuç: ' +
          balanceLabel(fund - cost) +
          '.',
    )
  }
  const price = numeric(overall ? a.price : notes?.unitRevenue),
    cost = numeric(overall ? a.cost : notes?.unitCost),
    fixed = numeric(overall ? a.fixed : notes?.fixedCost)
  const sc: Scenario | undefined = v.quadrant
    ? f?.brief?.scenarios?.[v.quadrant]
    : undefined
  const volume = numeric(v.volume || sc?.units?.[v.route])
  const lines: string[] = []
  for (const [label, pr, co, fi] of [
    ['Kayıtlı hesap', price, cost, fixed],
    [
      'Bu koşul',
      v.price ? numeric(v.price) : price,
      v.cost ? numeric(v.cost) : cost,
      v.fixed ? numeric(v.fixed) : fixed,
    ],
  ] as const) {
    if (pr === undefined || co === undefined || fi === undefined || !period) {
      lines.push(label + ': Fiyat, gider veya hesap dönemi eksik.')
      continue
    }
    const margin = Math.round(pr * 100) - Math.round(co * 100)
    const threshold =
      margin > 0 ? Math.ceil(Math.round(fi * 100) / margin) : undefined
    const prefix =
      label +
      ' (' +
      period +
      '). Fiyat ' +
      format(pr) +
      ' TL, satış başına gider ' +
      format(co) +
      ' TL, sabit gider ' +
      format(fi) +
      ' TL.'
    lines.push(
      prefix +
        ' ' +
        (threshold !== undefined
          ? 'Gideri karşılayan alt sınır ' + format(threshold) + ' satış.'
          : fi === 0
            ? 'Sabit gider yok. Satış başına kalan ' +
              format(margin / 100) +
              ' TL.'
            : 'Satışlar sabit gideri karşılayamaz.'),
    )
    if (label === 'Bu koşul' && volume !== undefined)
      lines.push(
        format(volume) +
          ' satışta ' +
          balanceLabel((volume * margin - Math.round(fi * 100)) / 100) +
          '.',
      )
  }
  return lines
}
function compareResult(p: Plan, s: Study) {
  const v = s.values,
    c = s.criteria ?? []
  if (
    !v.left ||
    !v.right ||
    v.left === v.right ||
    [v.left, v.right].some((id) => !routes(p).some((r) => r.id === id))
  )
    return ['Karşılaştırmak için iki farklı yol seçin.']
  const lines: string[] = []
  for (const side of ['left', 'right']) {
    const total = numeric(v[side + 'Total']),
      hits = numeric(v[side + 'Hits']),
      name = scopeName(p, v[side])
    if (total === undefined || hits === undefined) continue
    if (hits > total) {
      lines.push(name + ' için davranış sayısı katılan kişi sayısını aşamaz.')
      continue
    }
    lines.push(
      total
        ? name +
            ': ' +
            hits +
            ' / ' +
            total +
            ' kişi (%' +
            format((hits * 100) / total) +
            ').'
        : name + ' için katılan kişi yok.',
    )
  }
  if (
    !v.metric?.trim() ||
    !v.conditions?.trim() ||
    !v.planned ||
    !v.observedAt ||
    v.planned > v.observedAt
  )
    lines.push(
      'Denemeleri karşılaştırmak için ortak ölçüyü, koşulları ve tarih sırasını doğrulayın.',
    )
  if (
    c.length &&
    c.every(
      (row) =>
        row.label.trim() && row.weight && row.leftScore && row.rightScore,
    )
  ) {
    const total = c.reduce((a, b) => a + Number(b.weight), 0)
    const average = (side: 'leftScore' | 'rightScore') =>
      format(
        c.reduce((a, b) => a + Number(b.weight) * Number(b[side]), 0) / total,
      )
    lines.push(
      'Ağırlıklı sonuç (5 üzerinden): ' +
        scopeName(p, v.left) +
        ' ' +
        average('leftScore') +
        ', ' +
        scopeName(p, v.right) +
        ' ' +
        average('rightScore') +
        '.',
    )
  }
  return lines
}
export function payBudgetItem(p: Plan, studyId: string, rowId: string): Plan {
  const f = p.foundation,
    b = f?.brief
  const s = b?.studies?.find((x) => x.method === 'budget' && x.id === studyId)
  const row = s?.pledges?.find((x) => x.id === rowId)
  if (
    !f ||
    !b ||
    !s ||
    !row ||
    row.paidOn ||
    row.debtId ||
    !s.values.budgetScope ||
    ledgerTotals(p, s).issue
  )
    return p
  const common = s.values.budgetScope === '02. adımdaki bütçe'
  const spent = numeric(common ? p.answers['02']?.spent : s.values.spent),
    value = numeric(row.amount)
  if (spent === undefined || value === undefined || value === 0) return p
  if (
    !common &&
    (!s.values.name?.trim() ||
      !s.values.period?.trim() ||
      !s.values.currency?.trim())
  )
    return p
  const totalMinor = Math.round(spent * 100) + Math.round(value * 100)
  if (!Number.isSafeInteger(totalMinor)) return p
  const total = totalMinor / 100
  const updated = {
    ...s,
    values: common ? s.values : { ...s.values, spent: String(total) },
    pledges: s.pledges!.map((r) =>
      r.id === rowId || r.debtId === rowId ? { ...r, paidOn: today() } : r,
    ),
  }
  return {
    ...(common ? applyEdit(p, '02', 'spent', total) : p),
    foundation: {
      ...f,
      brief: {
        ...b,
        studies: b.studies!.map((x) => (x.id === s.id ? updated : x)),
      },
    },
  }
}
export function studyResult(p: Plan, study: Study) {
  if (study.method === 'sensitivity') return sensitivityResult(p, study)
  if (study.method === 'compare') return compareResult(p, study)
  return researchResult(p, study)
}
export function studyReport(p: Plan) {
  const output: string[] = []
  for (const m of methods) {
    if (!eligible(p, m.id)) continue
    const studies = (p.foundation?.brief?.studies ?? []).filter(
      (s) =>
        s.method === m.id &&
        (Object.values(s.values).some((v) => v.trim()) ||
          s.pledges?.length ||
          s.criteria?.some(
            (c) => c.label || c.weight || c.leftScore || c.rightScore,
          )),
    )
    if (!studies.length) continue
    output.push('## ' + m.title)
    for (const [i, s] of studies.entries()) {
      output.push(m.book + ' · ' + (i + 1) + '. kayıt')
      const free = p.answers['00']?.mode === 'Ücretsiz hizmet'
      for (const [k, label, kind] of applicableFields(s, free)) {
        const v = s.values[k]
        if (!v?.trim()) continue
        let text = isResearchPick(kind) ? researchValue(p, s, k, kind) : v
        if (kind === 'proof') text = claimEvidence(p, v)
        if (kind === 'date') text = dateLabel(v)
        if (kind === 'route') text = scopeName(p, v)
        if (kind === 'quadrant') {
          const q = scenarioSides.find(([key]) => key === v)
          text = q
            ? [
                (p.foundation?.brief?.axisA || 'Birinci koşul') + ' ' + q[1],
                (p.foundation?.brief?.axisB || 'İkinci koşul') + ' ' + q[2],
              ].join(', ')
            : 'Bilinmiyor'
        }
        output.push(label + ': ' + text)
      }
      for (const item of s.pledges ?? []) {
        output.push(
          (item.kind === 'reserve' ? 'Ayrılan para: ' : 'Ödeme: ') +
            (item.name || 'Adı bekleniyor') +
            (item.permit
              ? '. Harcama izni: ' +
                (budgetPermits(p).find((h) => h.id === item.permit)?.task ||
                  'İzin kaydı bulunamadı')
              : '') +
            (item.debtId
              ? '. Bağlı borç: ' +
                (s.pledges?.find((r) => r.id === item.debtId)?.name ||
                  'Borç bulunamadı')
              : '') +
            (item.paidOn
              ? '. Ödendi. ' + dateLabel(item.paidOn) + '. Tutar: '
              : item.kind === 'reserve'
                ? '. Ayrılan tutar: '
                : '. Ödenmemiş tutar: ') +
            (item.amount || 'Bilinmiyor') +
            ' ' +
            (s.values.budgetScope === '02. adımdaki bütçe'
              ? 'TL'
              : s.values.currency || '') +
            '. Vade: ' +
            dateLabel(item.due) +
            '. Onay sahibi: ' +
            (item.owner || 'Bilinmiyor') +
            '. Dayanak: ' +
            claimEvidence(p, item.proof),
        )
      }
      if (s.thresholdRecorded)
        output.push('Sınırın son kayıt günü: ' + dateLabel(s.thresholdRecorded))
      if (m.id === 'sensitivity' && !s.values.route)
        output.push('Hesabın kapsamı: Planın genel hesabı.')
      if (
        m.fields.some((f) => f[2] === 'proof') &&
        !s.pledges?.some((r) => r.proof) &&
        !m.fields.some(([k, , kind]) => kind === 'proof' && s.values[k])
      )
        output.push('Bu kayıt için kanıt seçilmedi.')
      for (const c of s.criteria ?? [])
        output.push(
          'Ölçü: ' +
            (c.label || 'Bilinmiyor') +
            '. Ağırlık: ' +
            (c.weight || 'Bilinmiyor') +
            '. Birinci puan: ' +
            (c.leftScore || 'Bilinmiyor') +
            '. İkinci puan: ' +
            (c.rightScore || 'Bilinmiyor') +
            '.',
        )
      output.push(...studyResult(p, s))
    }
  }
  return output
}
