import {
  calendar,
  today,
  dateLabel,
  type Evidence,
  type Plan,
} from './domain.ts'

export interface ProofReview {
  owner: string
  rule: string
  checked: string
  observation: string
  until?: string
  changed?: boolean
  offer?: string
  replacement?: string
  reason?: string
}

export interface Surprise {
  status: 'Açık' | 'Varsayıma bağlandı' | 'Kapandı'
  missingGroup?: string
  question?: string
  owner?: string
  due?: string
  second?: string
  limit?: string
  stop?: string
  prior?: string
  assumption?: string
  conclusion?: string
  closedBy?: string
  closedOn?: string
  closures?: { reason: string; owner?: string; day?: string }[]
  danger?: boolean
}

const norm = (v: unknown) =>
  String(v ?? '')
    .trim()
    .normalize('NFC')
    .toLocaleLowerCase('tr')
    .replace(/\s+/g, ' ')
export function offerBasis(p: Plan) {
  return JSON.stringify(
    [
      p.answers['13']?.offer,
      p.answers['13']?.terms,
      p.foundation?.inputs.price,
      p.answers['16']?.price,
      p.foundation?.inputs.trialStart,
    ].map(norm),
  )
}
export function reviewIssue(p: Plan, e: Evidence, day = today()) {
  const review = e.review
  if (
    !review?.rule.trim() ||
    !review.owner.trim() ||
    !calendar(review.checked) ||
    review.checked > day ||
    !calendar(e.observed) ||
    review.checked < e.observed ||
    review.observation !== e.observed
  )
    return 'Kaydın bugün geçerli olduğunu kaynağından doğrulayın.'
  if (review.changed)
    return 'Geçerlilik koşulu değişti. Kaynağı yeniden inceleyin.'
  if (review.until && review.until < day)
    return 'Belgenin geçerlilik süresi doldu.'
  if (
    e.criteria?.some((id) => id === 'Z6' || id === 'D1') &&
    review.offer !== offerBasis(p)
  )
    return 'Teklif veya fiyat değişti. Yeni teklif için ayrı bir tarihli kanıt ekleyin.'
  return ''
}
export function trialIssue(p: Plan, e: Evidence) {
  const inputs = p.foundation?.inputs ?? {}
  const group =
    e.side === 'Diğer taraf' ? p.answers['08']?.other : p.answers['08']?.target
  if (!norm(group) || norm(group) !== norm(e.customerGroup))
    return 'Kanıtı 8. adımdaki doğru müşteri grubuyla eşleştirin.'
  if (!norm(inputs.trialPlace) || norm(inputs.trialPlace) !== norm(e.place))
    return 'Teklif yeri bu denemeyle eşleşmiyor.'
  if (!norm(inputs.trialPeriod) || norm(inputs.trialPeriod) !== norm(e.period))
    return 'Gözlem dönemi bu denemeyle eşleşmiyor.'
  if (
    !calendar(inputs.trialStart) ||
    !e.observed ||
    e.observed < inputs.trialStart
  )
    return 'Gözlem bu denemenin başlangıcından önce veya deneme tarihi eksik.'
  return ''
}
export function proofIssue(p: Plan, e: Evidence, day = today()) {
  return (
    reviewIssue(p, e, day) ||
    (e.criteria?.includes('Z6') ? trialIssue(p, e) : '')
  )
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
export function validReview(v: unknown) {
  return (
    v === undefined ||
    (record(v) &&
      ['owner', 'rule', 'observation', 'checked'].every(
        (k) => typeof v[k] === 'string',
      ) &&
      calendar(v.checked) &&
      calendar(v.observation) &&
      (v.until === undefined || v.until === '' || calendar(v.until)) &&
      (v.changed === undefined || typeof v.changed === 'boolean') &&
      (v.replacement === undefined || typeof v.replacement === 'string') &&
      (v.reason === undefined || typeof v.reason === 'string') &&
      (v.offer === undefined || typeof v.offer === 'string'))
  )
}
export function validSurprise(e: Record<string, unknown>) {
  const v = e.surprise
  if (v === undefined) return true
  if (
    !record(v) ||
    !calendar(e.observed) ||
    !norm(e.place) ||
    !['Açık', 'Varsayıma bağlandı', 'Kapandı'].includes(String(v.status))
  )
    return false
  return (
    [
      'missingGroup',
      'question',
      'owner',
      'due',
      'second',
      'limit',
      'stop',
      'prior',
      'assumption',
      'conclusion',
      'closedBy',
      'closedOn',
    ].every((k) => v[k] === undefined || typeof v[k] === 'string') &&
    (!v.due || calendar(v.due)) &&
    (!v.closedOn || calendar(v.closedOn)) &&
    (v.closures === undefined ||
      (Array.isArray(v.closures) &&
        v.closures.every(
          (c) =>
            record(c) &&
            typeof c.reason === 'string' &&
            !!c.reason.trim() &&
            (c.owner === undefined || typeof c.owner === 'string') &&
            (c.day === undefined || calendar(c.day)),
        ))) &&
    (v.danger === undefined || typeof v.danger === 'boolean') &&
    (v.status !== 'Kapandı' || !!norm(v.conclusion)) &&
    (v.status !== 'Varsayıma bağlandı' || !!norm(v.assumption)) &&
    (!v.prior || v.prior !== e.id)
  )
}
export function surpriseLines(p: Plan) {
  return p.evidence
    .filter((e) => e.surprise)
    .flatMap((e) => {
      const s = e.surprise!
      const assumption = p.foundation?.assumptions?.find(
        (a) => a.id === s.assumption,
      )
      return [
        e.title +
          ' (' +
          s.status +
          '). ' +
          [e.place, dateLabel(e.observed!), e.source].join(', ') +
          '.',
        ...[
          ['Henüz dinlenmeyen grup', s.missingGroup],
          ['Etkilenen karar', s.question],
          ['Sorumlu', s.owner],
          ['İnceleme günü', s.due && dateLabel(s.due)],
          ['İkinci gözlem', s.second],
          ['Kayıp sınırı', s.limit],
          ['Durma koşulu', s.stop],
          [
            'Önceki olay',
            s.prior &&
              (p.evidence.find((x) => x.id === s.prior)?.title ||
                'Kayıt kaldırıldı'),
          ],
          [
            'Bağlı varsayım',
            s.assumption && (assumption?.claim || 'Varsayım kaldırıldı'),
          ],
          ['Kapanış gerekçesi', s.conclusion],
          ['Kapanış kararını veren', s.closedBy],
          ['Kapanış günü', s.closedOn && dateLabel(s.closedOn)],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => k + ': ' + v),
        ...(s.danger ? ['Ciddi zarar işareti kaydedildi.'] : []),
        ...(s.closures ?? []).map(
          (c) =>
            'Önceki kapanış: ' +
            [c.reason, c.owner, c.day && dateLabel(c.day)]
              .filter(Boolean)
              .join(', '),
        ),
      ]
    })
}
