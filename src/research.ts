import { reviewIssue } from './proofReview.ts'
import { calendar, today, dateLabel, type Plan } from './domain.ts'
import { routes, claimEvidence, sourceLine, routeLabels } from './dossier.ts'
import type { FieldKind, MethodId, Study } from './preparationMethods.ts'
import { choices, researchMethods } from './researchCatalog.ts'

const books = (p: Plan) => p.foundation?.brief?.studies ?? []
const numbered = (n: number) =>
  n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
function amount(v: unknown) {
  if (
    (typeof v !== 'string' && typeof v !== 'number') ||
    String(v).trim() === ''
  )
    return undefined
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}
export function eligible(p: Plan, id: MethodId) {
  const profile = p.answers['00'] ?? {}
  switch (id) {
    case 'dependency':
      return (
        routes(p).length > 1 || books(p).some((s) => s.method === 'dependency')
      )
    case 'group':
      return profile.groupLink === 'Evet'
    case 'budget':
      return (
        p.answers['11']?.risk === 'Yüksek' ||
        p.answers['02']?.contract === 'Evet' ||
        books(p).some((s) => s.method === 'budget') ||
        p.history.some(
          (h) =>
            h.stage <= 3 &&
            h.outcome === 'Koşullu ilerleyin' &&
            h.limit !== undefined,
        )
      )
    case 'marketplace':
      return profile.buyer === 'İki taraflı pazar'
    case 'inherited':
      return profile.start === 'Devralınan iş'
    case 'service':
      return profile.mode === 'Ücretsiz hizmet'
    default:
      return true
  }
}
export function suggestResearch(p: Plan, id: MethodId, step: string) {
  const a = p.answers
  switch (id) {
    case 'barrier':
      return !!(a['07']?.source || p.foundation?.inputs.lossMeasure)
    case 'factor':
      return !!a['10']?.claim && routes(p).length > 0
    case 'strength':
      return (
        (step === '12' || step === '16') &&
        (!!a['12']?.resources || a['11']?.risk === 'Yüksek')
      )
    case 'fit':
    case 'cross':
      return routes(p).length > 1 && step === '11'
    case 'dependency':
      return (
        routes(p).length > 1 &&
        (a['11']?.risk === 'Yüksek' ||
          !!a['12']?.resources ||
          a['00']?.permit === 'Gerekiyor')
      )
    case 'capacity':
      return !!a['12']?.resources
    case 'alternative': {
      const paths = routes(p)
      const benefits = paths
        .map((r) =>
          p.foundation?.brief?.routes?.[r.id]?.difference
            ?.trim()
            .toLocaleLowerCase('tr'),
        )
        .filter(Boolean)
      return benefits.length > 1 && new Set(benefits).size < benefits.length
    }
    case 'experiment':
      return !!a['15']?.signal
    case 'dissent':
      return !!p.foundation?.inputs.reviewNote
    case 'group':
    case 'marketplace':
    case 'inherited':
    case 'budget':
    case 'service':
      return eligible(p, id)
    default:
      return false
  }
}
export function ownerField(method: MethodId, key: string) {
  return (
    (method === 'dissent' && ['response', 'revision'].includes(key)) ||
    (method === 'factor' && key === 'interpretation')
  )
}
export function showResearchField(s: Study, k: string) {
  const v = s.values
  if (s.method === 'strength' && k === 'ends')
    return strengthClass(v) === 'Geçici üstünlük'
  if (s.method === 'factor') {
    if (k === 'routeIds') return v.scope === 'Seçili yollar'
    if (k === 'currency') return v.measureType === 'Tutar'
    if (k === 'hits' || k === 'total') return v.measureType === 'Oran'
    if (k === 'event') return v.measureType === 'Gözlenen olay'
    if (k === 'baseline' || k === 'unit')
      return ['Sayı', 'Tutar'].includes(v.measureType)
  }
  if (
    s.method === 'budget' &&
    v.budgetScope === '02. adımdaki bütçe' &&
    ['name', 'period', 'currency'].includes(k)
  )
    return false
  if (
    s.method === 'budget' &&
    s.pledges?.some((r) => r.kind !== 'reserve') &&
    ['unpaid', 'obligations', 'due', 'owner'].includes(k)
  )
    return false
  if (s.method === 'budget' && ['approved', 'spent'].includes(k))
    return v.budgetScope === 'Ayrı bütçe'
  if (s.method === 'fit' && ['benefit', 'bar', 'independent'].includes(k))
    return v.edge === 'Evet'
  return true
}
export function selectedIds(v: string | undefined): string[] {
  if (!v) return []
  try {
    const x: unknown = JSON.parse(v)
    return Array.isArray(x) && x.every((i) => typeof i === 'string') ? x : []
  } catch {
    return []
  }
}
export const datedProof = (p: Plan, id: string, stance?: string) =>
  p.evidence.find(
    (e) =>
      e.id === id &&
      e.step <= '17' &&
      ((!e.review && !e.criteria?.length) || !reviewIssue(p, e)) &&
      e.source.trim() &&
      calendar(e.observed) &&
      e.observed <= today() &&
      (!stance || e.stance === stance),
  )
export function behaviorProof(p: Plan, id: string) {
  const e = datedProof(p, id, 'Destek')
  return e &&
    ['Gözlem', 'Yazılı taahhüt', 'Ödeme', 'Teslim veya kullanım'].includes(
      e.kind || '',
    )
    ? e
    : undefined
}
const linkKinds = [
  'claim',
  'test',
  'barrier',
  'factor',
  'cause',
  'resource',
  'choice',
  'support',
  'counter',
  'routes',
] as const
export function isResearchPick(k?: FieldKind) {
  return linkKinds.some((v) => v === k)
}
const studyName = (s: Study) =>
  s.values.name ||
  s.values.expected ||
  s.values.first ||
  s.values.metric ||
  'Adsız çalışma'
export function researchOptions(p: Plan, key: string, kind?: FieldKind) {
  const pick = (value: string, label = value) => ({ value, label })
  if (kind === 'choice') return (choices[key] ?? []).map((v) => pick(v))
  if (kind === 'routes') return routes(p).map((r) => pick(r.id, r.name))
  if (kind === 'claim')
    return (p.foundation?.assumptions ?? [])
      .map((a) => pick('assumption:' + a.id, a.claim))
      .concat(
        (p.foundation?.brief?.claims ?? []).map((c) =>
          pick(c.id, c.text || 'Adsız iddia'),
        ),
      )
      .concat(
        p.answers['10']?.claim
          ? [pick('step-10', String(p.answers['10'].claim))]
          : [],
      )
  if (kind === 'resource') {
    const rows = p.answers['12']?.resources
    return Array.isArray(rows)
      ? [
          ...new Set(
            (rows as Record<string, string>[])
              .map((r) => r.Kaynak)
              .filter(Boolean),
          ),
        ].map((v) => pick(v))
      : []
  }
  if (kind === 'support' || kind === 'counter')
    return p.evidence
      .filter((e) =>
        datedProof(p, e.id, kind === 'support' ? 'Destek' : 'Karşı bulgu'),
      )
      .map((e) => pick(e.id, e.title + ' (' + dateLabel(e.observed!) + ')'))
  const refs = books(p)
    .filter((s) =>
      kind === 'test'
        ? ['learning', 'compare'].includes(s.method)
        : s.method === kind,
    )
    .map((s) => pick(s.id, studyName(s)))
  if (kind === 'test' && p.answers['15']?.signal)
    refs.unshift(pick('step-15', String(p.answers['15'].signal)))
  return refs
}
export function researchValue(p: Plan, s: Study, k: string, kind?: FieldKind) {
  const v = s.values[k]
  if (kind === 'support' || kind === 'counter')
    return datedProof(p, v, kind === 'support' ? 'Destek' : 'Karşı bulgu')
      ? claimEvidence(p, v)
      : p.evidence.some((e) => e.id === v)
        ? 'Kanıtın tarihi veya yönü değişti.'
        : 'Bağlı kanıt kaldırıldı'
  const opts = researchOptions(p, k, kind)
  if (kind === 'routes')
    return selectedIds(v)
      .map((id) => opts.find((o) => o.value === id)?.label ?? 'Yol kaldırıldı')
      .join(', ')
  if (kind === 'test' && v === 'step-15')
    return opts.find((o) => o.value === v)?.label ?? 'Deneme kaldırıldı'
  return opts.find((o) => o.value === v)?.label ?? 'Bağlı kayıt kaldırıldı'
}
export function strengthsComplete(p: Plan) {
  const records = books(p).filter((s) => s.method === 'strength')
  return (
    !!records.length &&
    records.every(
      ({ values: v }) =>
        !!v.name?.trim() &&
        ['valuable', 'rare', 'costly', 'organized'].every((k) =>
          ['Evet', 'Hayır'].includes(v[k]),
        ) &&
        (v.rare !== 'Evet' || !!datedProof(p, v.proof, 'Destek')),
    )
  )
}
export function strengthClass(v: Study['values']) {
  const stops = [
    'İşe katkı sağlamıyor',
    'Eşitlik',
    'Geçici üstünlük',
    'Kullanılmayan güç',
  ]
  for (const [i, k] of ['valuable', 'rare', 'costly', 'organized'].entries()) {
    if (v[k] === 'Hayır') return stops[i]
    if (v[k] !== 'Evet') return 'Cevap bekleniyor'
  }
  return 'Kalıcı üstünlük adayı'
}
function ratio(h: unknown, t: unknown, period: string) {
  const n = amount(h),
    d = amount(t)
  if (n === undefined || d === undefined || !period?.trim())
    return 'Oran için gözlem sayısı ve dönem gerekir.'
  if (!d) return 'Geçerli gözlem sayısı sıfır. Oran hesaplanamaz.'
  if (n > d)
    return 'Gerçekleşen olay sayısı toplamı aşıyor. Sayıları inceleyin.'
  return (
    period +
    ' döneminde ' +
    n +
    ' / ' +
    d +
    ' (%' +
    numbered((100 * n) / d) +
    ').'
  )
}
const normalized = (v: unknown) =>
  typeof v === 'string'
    ? v.trim().normalize('NFC').toLocaleLowerCase('tr').replace(/\s+/g, ' ')
    : ''
export function factorEvidence(p: Plan, s: Study) {
  const v = s.values
  const claim = p.foundation?.brief?.claims?.find((c) => c.id === v.claim)
  const assumption = p.foundation?.assumptions?.find(
    (c) => 'assumption:' + c.id === v.claim,
  )
  const comparable =
    !!claim &&
    ['group', 'period'].every((key) => {
      const a = normalized(claim[key as 'group' | 'period'])
      return !!a && a === normalized(v[key])
    })
  const links: {
    id: string
    stance: 'Destek' | 'Karşı bulgu'
    inherited: boolean
  }[] = []
  function add(
    id: string | undefined,
    stance: 'Destek' | 'Karşı bulgu',
    inherited: boolean,
  ) {
    if (id && !links.some((l) => l.id === id && l.stance === stance))
      links.push({ id, stance, inherited })
  }
  add(v.support, 'Destek', false)
  add(v.counter, 'Karşı bulgu', false)
  add(claim?.support, 'Destek', true)
  add(claim?.counter, 'Karşı bulgu', true)
  const records = links.map((l) => {
    const proof = datedProof(p, l.id, l.stance)
    const scopeMismatch =
      !!proof &&
      ((!!proof.customerGroup &&
        normalized(proof.customerGroup) !== normalized(v.group)) ||
        (!!proof.period && normalized(proof.period) !== normalized(v.period)))
    return {
      ...l,
      proof,
      pending: scopeMismatch || (l.inherited && !comparable),
    }
  })
  const missingClaim =
    !!v.claim &&
    !claim &&
    !assumption &&
    !(v.claim === 'step-10' && p.answers['10']?.claim)
  return { records, missingClaim }
}
function factorResult(p: Plan, s: Study) {
  const v = s.values
  const { records, missingClaim } = factorEvidence(p, s)
  const confirmed = records.filter((r) => r.proof && !r.pending)
  const support = confirmed.find((r) => r.stance === 'Destek')?.proof
  const against = confirmed.find((r) => r.stance === 'Karşı bulgu')?.proof
  const lines = [
    support && against
      ? 'Bulgular çelişiyor'
      : support
        ? 'Destek var'
        : against
          ? 'Karşı bulgu var'
          : 'Sınanmadı',
  ]
  if (
    records.some((r) => r.pending) &&
    !against &&
    records.some((r) => r.pending && r.stance === 'Karşı bulgu')
  ) {
    lines[0] = 'Karşı bulgunun kapsamı incelenmeli'
  }
  if (missingClaim) lines.push('Bağlı iddia kaldırıldı.')
  for (const r of records) {
    const source = r.proof
      ? sourceLine(p, r.id)
      : p.evidence.some((e) => e.id === r.id)
        ? 'Kanıtın tarihi veya yönü değişti.'
        : 'Bağlı kanıt kaldırıldı'
    lines.push(
      r.stance + (r.pending ? ' (bağ incelenmeli)' : '') + ': ' + source,
    )
  }
  if (records.some((r) => r.pending))
    lines.push('İddianın müşteri grubunu ve dönemi inceleyin.')
  if (v.measureType === 'Oran') lines.push(ratio(v.hits, v.total, v.period))
  if (['Sayı', 'Tutar'].includes(v.measureType))
    lines.push(
      'Başlangıç değeri: ' +
        (v.baseline?.trim()
          ? v.baseline +
            ' ' +
            (v.measureType === 'Tutar'
              ? v.currency || '(para birimi eksik)'
              : v.unit || '(birim eksik)')
          : 'Bilinmiyor'),
    )
  const linked = books(p).find(
    (x) => x.id === v.test && ['compare', 'learning'].includes(x.method),
  )
  const start = calendar(v.started) ? v.started : undefined
  const end = linked?.values.observedAt
  const proofEnd =
    v.test === 'step-15'
      ? [support, against]
          .filter((e) => e?.step === '15')
          .map((e) => e!.observed!)
          .sort()[0]
      : undefined
  if (start && [end, proofEnd].some((day) => day && day < start))
    return [...lines, 'Denemenin başlangıç ve sonuç tarihlerini inceleyin.']
  const boundary = start || end || proofEnd
  if (v.threshold || v.thresholdDay) {
    if (
      boundary &&
      [v.thresholdDay, s.thresholdRecorded].some((d) => d && d > boundary)
    )
      lines.push('Sonradan belirlendi')
    else if (
      start &&
      v.thresholdDay &&
      s.thresholdRecorded &&
      v.thresholdDay < start &&
      s.thresholdRecorded < start
    )
      lines.push('Sınır denemeden önce kaydedildi.')
    else lines.push('Deneme öncesi zaman sırası doğrulanmadı.')
  }
  return lines
}
export function budgetPermits(p: Plan) {
  return p.history.filter(
    (h) =>
      h.stage <= 3 &&
      h.outcome === 'Koşullu ilerleyin' &&
      h.limit !== undefined,
  )
}
export function budgetIdentityLocked(s: Study, key: string) {
  return (
    ['budgetScope', 'currency', 'period', 'name'].includes(key) &&
    !!s.values[key]?.trim() &&
    (!!s.pledges?.some((r) => r.amount.trim()) || !!s.values.unpaid?.trim())
  )
}
export function ledgerTotals(p: Plan, s: Study) {
  if (
    s.values.budgetScope === '02. adımdaki bütçe' &&
    books(p).some(
      (x) =>
        x.method === 'budget' &&
        x.id !== s.id &&
        x.values.budgetScope === s.values.budgetScope,
    )
  ) {
    return {
      issue:
        'Aynı bütçe için birden fazla hesap var. Kayıtları tek hesapta inceleyin.',
    }
  }
  const rows = s.pledges ?? [],
    debts = rows.filter((r) => r.kind !== 'reserve'),
    reserves = rows.filter((r) => r.kind === 'reserve' && !r.paidOn)
  const minor = (v: unknown) => {
    const a = amount(v)
    return a === undefined ? undefined : Math.round(a * 100)
  }
  const sums = new Map<string, number>()
  const permits = budgetPermits(p)
  const currency =
    s.values.budgetScope === '02. adımdaki bütçe'
      ? 'TL'
      : s.values.currency?.trim().toUpperCase()
  let debt = debts.length ? 0 : minor(s.values.unpaid),
    reserved = 0
  for (const d of debts.filter((r) => !r.paidOn)) {
    const n = minor(d.amount)
    if (n === undefined) return { issue: 'Açık borcun tutarı bilinmiyor.' }
    debt = (debt ?? 0) + n
  }
  for (const r of reserves) {
    const n = minor(r.amount)
    if (n === undefined) return { issue: 'Ayrılan tutar bilinmiyor.' }
    if (r.permit) {
      const h = permits.find((x) => x.id === r.permit)
      if (!h || currency !== 'TL')
        return { issue: 'Bağlı izni ve para birimini inceleyin.' }
      const otherStudies = books(p).filter(
        (x) => x.method === 'budget' && x.id !== s.id,
      )
      const used = [
        ...rows,
        ...otherStudies.flatMap((x) => x.pledges ?? []),
      ].filter((x) => x.kind === 'reserve' && x.permit === h.id)
      if (
        used.some((x) => minor(x.amount) === undefined) ||
        used.reduce((sum, x) => sum + minor(x.amount)!, 0) >
          Math.round(h.limit! * 100)
      )
        return { issue: 'Ayrılan tutarlar izin tavanını aşıyor veya eksik.' }
    }
    if (r.debtId) {
      if (!debts.some((d) => d.id === r.debtId && !d.paidOn))
        return { issue: 'Ayrılan paranın bağlı olduğu açık borcu inceleyin.' }
      sums.set(r.debtId, (sums.get(r.debtId) ?? 0) + n)
    } else reserved += n
  }
  // A reservation and its debt describe the same payment.
  for (const [id, n] of sums) {
    if (n > minor(debts.find((d) => d.id === id)!.amount)!)
      return { issue: 'Borca bağlanan para kalan borcu aşıyor.' }
  }
  return {
    debt: debt === undefined ? undefined : debt / 100,
    reserved: reserved / 100,
  }
}
function budgetResult(p: Plan, s: Study) {
  const v = s.values
  const common = v.budgetScope === '02. adımdaki bütçe'
  const currency = (v.currency?.trim() || (common ? 'TL' : '')).toUpperCase()
  const budgetEnd = p.answers['02']?.end
  const period = common
    ? calendar(budgetEnd)
      ? 'Araştırmanın tamamı, ' + dateLabel(budgetEnd) + ' gününe kadar'
      : ''
    : v.period?.trim()
  if (common && currency !== 'TL')
    return ['02. adım TL kullanır. Aynı para birimini seçin.']
  const a = amount(common ? p.answers['02']?.budget : v.approved),
    b = amount(common ? p.answers['02']?.spent : v.spent),
    ledger = ledgerTotals(p, s),
    c = ledger.debt
  if (ledger.issue) return ['Serbest bütçe bilinmiyor. ' + ledger.issue]
  if (
    !v.budgetScope ||
    !period ||
    !currency ||
    (!common && !v.name?.trim()) ||
    a === undefined ||
    b === undefined ||
    c === undefined
  )
    return [
      'Serbest bütçe bilinmiyor. Kapsam, dönem, para birimi ve üç tutar gerekir.',
    ]
  const total =
    (Math.round(a * 100) -
      Math.round(b * 100) -
      Math.round(c * 100) -
      Math.round((ledger.reserved ?? 0) * 100)) /
    100
  return [
    'Onaylı bütçe ' +
      numbered(a) +
      ' ' +
      currency +
      '. Gerçekleşen harcama ' +
      numbered(b) +
      ' ' +
      currency +
      '. Ödenmemiş taahhüt ' +
      numbered(c) +
      ' ' +
      currency +
      '.',
    'Borç dışında ayrılan para: ' +
      numbered(ledger.reserved ?? 0) +
      ' ' +
      currency +
      '.',
    'Serbest bütçe (' + period + '): ' + numbered(total) + ' ' + currency + '.',
  ]
}
function capacityResult(p: Plan, v: Study['values']) {
  const inputs = p.foundation?.inputs ?? {},
    a = p.answers,
    lines: string[] = []
  const period = inputs.period,
    capPeriod = inputs.capacityPeriod
  if (a['09']?.demand != null)
    lines.push(
      'Ulaşılabilir talep tahmini: ' +
        a['09'].demand +
        ' adet (' +
        (period || 'dönem bilinmiyor') +
        ').',
    )
  if (a['09']?.capacity != null)
    lines.push(
      'Teslim kapasitesi: ' +
        a['09'].capacity +
        ' adet (' +
        (capPeriod || 'dönem bilinmiyor') +
        ').',
    )
  if (a['00']?.mode === 'Ücretsiz hizmet') return lines
  if (v.route && !routes(p).some((r) => r.id === v.route))
    return [...lines, 'Yol kaldırıldı. Yeni bir hesap için aday yolu seçin.']
  const notes = p.foundation?.brief?.routes?.[v.route]
  const pr = amount(v.route ? notes?.unitRevenue : a['16']?.price),
    co = amount(v.route ? notes?.unitCost : a['16']?.cost),
    fi = amount(v.route ? notes?.fixedCost : a['16']?.fixed)
  const costPeriod = v.route ? notes?.period : inputs.costPeriod
  if (
    pr === undefined ||
    co === undefined ||
    fi === undefined ||
    pr <= co ||
    !costPeriod
  )
    return lines
  const margin = Math.round(pr * 100) - Math.round(co * 100)
  if (margin <= 0) return lines
  const breakeven = Math.ceil(Math.round(fi * 100) / margin)
  lines.push(
    'Gideri karşılayan satış: ' + breakeven + ' adet (' + costPeriod + ').',
  )
  const demand = amount(a['09']?.demand),
    cap = amount(a['09']?.capacity)
  if (
    costPeriod === period &&
    period === capPeriod &&
    demand !== undefined &&
    cap !== undefined
  ) {
    const limit = amount(v.quantity)
    if (
      limit !== undefined &&
      (v.period !== period || v.unit?.trim().toLocaleLowerCase('tr') !== 'adet')
    )
      return [
        ...lines,
        'Kaynak sınırının dönemi veya birimi satış hesabından farklı.',
      ]
    if (limit !== undefined && Math.min(demand, cap, limit) < breakeven)
      lines.push(
        'Kaynak sınırı ' +
          numbered(limit) +
          ' adet. Ulaşılabilecek satış gider eşiğinin altında.',
      )
    else
      lines.push(
        Math.min(demand, cap) >= breakeven
          ? 'Talep ve kapasite tahminleri satış eşiğine yetiyor.'
          : 'Talep veya kapasite tahmini satış eşiğinin altında.',
      )
  } else
    lines.push(
      'Karşılaştırma için talep, kapasite ve gider dönemlerini eşleştirin.',
    )
  return lines
}
export function researchResult(p: Plan, s: Study): string[] {
  const v = s.values
  switch (s.method) {
    case 'dependency': {
      const affected = selectedIds(v.routeIds)
      const hasIndependentProof = !!datedProof(p, v.independent, 'Destek')
      const independent = selectedIds(v.unaffected).filter(
        (id) => !affected.includes(id),
      )
      const paths = routes(p)
      const names = (ids: string[]) =>
        ids
          .map((id) => paths.find((r) => r.id === id)?.name || 'Kaldırılan yol')
          .join(', ') || 'Belirlenmedi'
      return [
        'Ortak bağımlılık: ' + (v.name || 'İsim bekleniyor'),
        'Etkilenen yollar: ' + names(affected),
        'Beklenen sonuç: ' + (v.consequence || 'İncelenmedi'),
        'Bağımsızlığı belgelenen yollar: ' +
          names(hasIndependentProof ? independent : []),
        'Bağımsızlığı henüz doğrulanmayan yollar: ' +
          names(
            paths
              .filter(
                (r) =>
                  !affected.includes(r.id) &&
                  !(hasIndependentProof && independent.includes(r.id)),
              )
              .map((r) => r.id),
          ),
      ]
    }
    case 'group':
      return [
        'Grubun katkısı: ' + (v.parent || 'Bilinmiyor'),
        'Müşterinin yararı: ' + (v.customer || 'Bilinmiyor'),
        'Bağımsız alım karşılaştırması: ' +
          (v.commonTerms &&
          v.internalCost &&
          v.outsideCost &&
          datedProof(p, v.outsideProof, 'Destek') &&
          datedProof(p, v.proof, 'Destek')
            ? [v.commonTerms, v.internalCost, v.outsideCost].join(', ')
            : 'Aynı kapsamı, iki bedeli ve kaynaklarını doğrulayın.'),
      ]
    case 'experiment': {
      const related = books(p).find(
        (r) => r.id === v.test && ['compare', 'learning'].includes(r.method),
      )
      if (v.test === 'step-15' && p.answers['15']?.signal) {
        const a = p.answers['15']
        return [
          '15. adımdaki ölçü: ' + a.signal,
          'Teklif sayısı: ' +
            (a.offered ?? 'Bilinmiyor') +
            '. Taahhüt sayısı: ' +
            (a.committed ?? 'Bilinmiyor') +
            '.',
        ]
      }
      if (!related) return []
      return [
        ['metric', 'Ortak ölçü'],
        ['observedAt', 'Deneme sonucu günü'],
        ['expected', 'Deneme beklentisi'],
        ['observed', 'Gözlem'],
        ['revision', 'Değişen varsayım'],
        ['proof', 'Kanıt'],
        ['leftProof', 'Birinci yolun kanıtı'],
        ['rightProof', 'İkinci yolun kanıtı'],
      ].flatMap(([key, label]) => {
        const raw = related.values[key]
        if (!raw) return []
        const value = key.toLowerCase().endsWith('proof')
          ? claimEvidence(p, raw)
          : key === 'observedAt'
            ? dateLabel(raw)
            : raw
        return [label + ': ' + value]
      })
    }
    case 'barrier': {
      const cause = books(p).find(
        (r) => r.method === 'cause' && r.id === v.cause,
      )
      const lines: string[] = []
      if (cause?.values.finding)
        lines.push('Neden çalışmasındaki gözlem: ' + cause.values.finding)
      if (cause?.values.proof)
        lines.push('Gözlemin dayanağı: ' + claimEvidence(p, cause.values.proof))
      const linkedClaim = p.foundation?.brief?.claims?.find(
        (c) => c.id === v.claim,
      )
      if (linkedClaim?.support)
        lines.push('İddianın desteği: ' + claimEvidence(p, linkedClaim.support))
      if (linkedClaim?.counter)
        lines.push(
          'İddiaya karşı bulgu: ' + claimEvidence(p, linkedClaim.counter),
        )
      return lines
    }
    case 'strength':
      return [
        strengthClass(v),
        datedProof(p, v.proof, 'Karşı bulgu')
          ? 'Karşı bulgu var. Güç iddiası yeniden incelenmeli.'
          : datedProof(p, v.proof, 'Destek')
            ? 'Tarihli dayanak: ' + claimEvidence(p, v.proof)
            : v.rare === 'Evet'
              ? 'Varsayım. Nadirlik iddiası için tarihli dayanak seçin.'
              : 'Varsayım. Tarihli dayanak bekleniyor.',
      ]
    case 'factor':
      return factorResult(p, s)
    case 'budget':
      return budgetResult(p, s)
    case 'capacity':
      return capacityResult(p, v)
    case 'fit': {
      const notes = p.foundation?.brief?.routes?.[v.route]
      const result =
        notes && routes(p).some((r) => r.id === v.route)
          ? (
              [
                'customer',
                'channel',
                'difference',
                'skills',
                'cost',
              ] as (keyof typeof routeLabels)[]
            )
              .filter((k) => notes[k])
              .map((k) => routeLabels[k] + ': ' + notes[k])
          : []
      if (v.route && !routes(p).some((r) => r.id === v.route))
        return ['Yol kaldırıldı. Bağlantıyı yeniden inceleyin.']
      if (v.edge === 'Evet')
        result.push(
          datedProof(p, v.independent, 'Karşı bulgu')
            ? 'Karşı bulgu var. Üstünlük iddiası yeniden incelenmeli.'
            : datedProof(p, v.independent, 'Destek') &&
                v.bar?.trim() &&
                v.benefit?.trim()
              ? 'Üstünlük iddiasının dayanağı var.'
              : 'Üstünlük iddiası varsayım olarak duruyor.',
        )
      return result
    }
    case 'marketplace':
      return [
        ...(p.answers['15']?.matches !== undefined
          ? [
              '15. adımın genel kaydında tamamlanan eşleşme: ' +
                p.answers['15'].matches +
                '.',
            ]
          : []),
        ratio(v.hits, v.total, v.period),
        ...(amount(v.completed)! > amount(v.matches)!
          ? ['Tamamlanan işlem sayısı eşleşmeleri aşıyor. Sayıları inceleyin.']
          : []),
      ]
    case 'service': {
      const served = amount(v.served),
        cost = amount(v.cost),
        joined = amount(v.joined)
      if (joined !== undefined && served !== undefined && served > joined)
        return ['Fayda gören kişi sayısı katılan kişi sayısını aşıyor.']
      return [
        served && cost !== undefined && v.currency?.trim() && v.period?.trim()
          ? 'Fayda gören kişi başına gider: ' +
            numbered(cost / served) +
            ' ' +
            v.currency +
            ' (' +
            v.period +
            ').'
          : 'Kişi başına gider bilinmiyor.',
      ]
    }
    default:
      return []
  }
}
export function researchSummary(p: Plan) {
  const all = books(p).filter(
    (s) =>
      eligible(p, s.method) && Object.values(s.values).some((x) => x.trim()),
  )
  const lines: string[] = []
  for (const s of all
    .filter(
      (x) =>
        x.method === 'barrier' ||
        x.method === 'factor' ||
        x.method === 'dissent' ||
        x.method === 'experiment',
    )
    .sort(
      (a, b) =>
        Number(b.values.priority === 'Seçimi değiştirebilir') -
        Number(a.values.priority === 'Seçimi değiştirebilir'),
    )) {
    const v = s.values
    lines.push(
      (researchMethods.find((m) => m.id === s.method)?.title ?? '') +
        ': ' +
        (v.name || 'Açıklama bekleniyor'),
    )
    if (s.method === 'factor' || s.method === 'barrier')
      lines.push(...researchResult(p, s))
    if (v.route)
      lines.push(
        'Etkilenen yol: ' +
          (routes(p).find((r) => r.id === v.route)?.name || 'Yol kaldırıldı'),
      )
    if (v.scope === 'Bütün aday yollar') lines.push(v.scope)
    if (v.scope === 'Seçili yollar' && v.routeIds)
      lines.push(
        'Etkilenen yollar: ' + researchValue(p, s, 'routeIds', 'routes'),
      )
    for (const [key, label] of [
      ['question', 'Açık soru'],
      ['alternative', 'Diğer açıklama'],
      ['contrary', 'Ters sonuçta yapılacak iş'],
      ['interpretation', 'Karar sahibinin yorumu'],
      ['revision', 'Değişen iddia'],
      ['owner', 'Sorumlu'],
    ])
      if (v[key]) lines.push(label + ': ' + v[key])
    if (v.due) lines.push('İnceleme günü: ' + dateLabel(v.due))
    if (v.response) lines.push(v.response)
    for (const k of ['support', 'counter'] as const)
      if (v[k])
        lines.push(
          (k === 'support' ? 'Destek: ' : 'Karşı bulgu: ') +
            researchValue(p, s, k, k),
        )
    if (s.method === 'dissent' && v.proof) lines.push(claimEvidence(p, v.proof))
  }
  return lines.length ? ['## Stratejin önce inceleyeceği konu', ...lines] : []
}
export function situation(p: Plan) {
  const a = p.answers
  const records = (step: string, k: string) =>
    Array.isArray(a[step]?.[k]) ? (a[step][k] as Record<string, string>[]) : []
  const list = (step: string, values: (string | undefined)[]) =>
    values
      .filter((v): v is string => !!v?.trim())
      .map((text) => ({ step, text }))
  const ext = (kind: string) =>
    records('04', 'external')
      .filter((r) => r.Yön === kind)
      .map((r) => r.Koşul)
  const strengths = books(p).filter(
    (s) => s.method === 'strength' && s.values.name?.trim(),
  )
  const classified = strengths.map((s) => {
    const v = s.values,
      level = strengthClass(v)
    const proved = !!datedProof(p, v.proof, 'Destek')
    let group = 'Araştırılacak konular'
    if (level === 'Eşitlik') group = 'Rakiplerle ortak özellikler'
    else if (proved && level === 'Kullanılmayan güç')
      group = 'Henüz kullanılamayan güçler'
    else if (proved && level === 'İşe katkı sağlamıyor') group = 'Zayıf yönler'
    else if (
      proved &&
      (level === 'Kalıcı üstünlük adayı' ||
        (level === 'Geçici üstünlük' && v.ends?.trim()))
    )
      group = 'Güçlü yönler'
    const end =
      level === 'Geçici üstünlük'
        ? '. Bitiş koşulu: ' + (v.ends?.trim() || 'Bilinmiyor')
        : ''
    return {
      group,
      step: '12',
      text: v.name + ' (' + researchResult(p, s).join('. ') + end + ')',
    }
  })
  const strengthItems = (group: string) =>
    classified.filter((x) => x.group === group)
  const market = a['09'] ?? {}
  const need = String(market.marketGap ?? '').trim()
  const observed = behaviorProof(p, String(market.gapProof ?? ''))
  const checked = calendar(market.gapChecked) && market.gapChecked <= today()
  const qualifies =
    observed &&
    !!normalized(observed.customerGroup) &&
    normalized(observed.customerGroup) === normalized(market.gapGroup) &&
    !!normalized(observed.period) &&
    normalized(observed.period) === normalized(market.gapPeriod) &&
    market.gapMatch === 'Aynı müşteri ve dönem' &&
    !!String(market.gapBehavior ?? '').trim() &&
    checked &&
    !!String(market.gapAlternative ?? '').trim() &&
    ['Karşılanmıyor', 'Kısmen karşılanıyor'].includes(
      String(market.gapCoverage),
    )
  const gapText = need
    ? [
        need,
        market.gapGroup,
        market.gapPeriod,
        market.gapBehavior,
        market.gapAlternative,
        market.gapCoverage,
        checked ? dateLabel(String(market.gapChecked)) : '',
        market.gapProof ? claimEvidence(p, String(market.gapProof)) : '',
      ]
        .filter(Boolean)
        .join('. ')
    : ''
  return [
    {
      title: 'Güçlü yönler',
      steps: ['12'],
      items: strengthItems('Güçlü yönler'),
    },
    {
      title: 'Zayıf yönler',
      steps: ['12', '16'],
      items: [
        ...strengthItems('Zayıf yönler'),
        ...list('12', [p.foundation?.inputs.skills]),
        ...list('16', [String(a['16']?.fragile ?? '')]),
      ],
    },
    {
      title: 'Fırsatlar',
      steps: ['09', '04'],
      items: [
        ...list('09', [qualifies ? gapText : '']),
        ...list('04', ext('Fırsat')),
      ],
    },
    {
      title: 'Araştırılacak konular',
      steps: ['09', '12'],
      items: [
        ...list('09', [
          !qualifies && !(checked && market.gapCoverage === 'Tam karşılanıyor')
            ? gapText
            : '',
        ]),
        ...strengthItems('Araştırılacak konular'),
      ],
    },
    {
      title: 'Karşılanan ihtiyaçlar',
      steps: ['09'],
      items: list('09', [
        checked && market.gapCoverage === 'Tam karşılanıyor' ? gapText : '',
      ]),
    },
    ...['Rakiplerle ortak özellikler', 'Henüz kullanılamayan güçler'].map(
      (title) => ({ title, steps: ['12'], items: strengthItems(title) }),
    ),
    {
      title: 'Tehditler',
      steps: ['04', '17'],
      items: [
        ...list('04', ext('Tehdit')),
        ...list(
          '17',
          records('17', 'risks').map((r) => r.Risk),
        ),
      ],
    },
  ]
}
