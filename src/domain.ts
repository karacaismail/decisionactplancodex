import {
  reviewDestinations,
  validReviewInput,
  type CycleReview,
  type SavedReview,
} from './lifecycle.ts'
import {
  phaseMethodReport,
  observationOwners,
  validMatrixRows,
  cycleField,
  hasCycleData,
  validForecast,
} from './phaseMethods.ts'
import { crossQuestions } from './researchCatalog.ts'
import { strengthsComplete } from './research.ts'
import { compareReady, routes } from './dossier.ts'
import {
  access,
  allows,
  evaluate,
  demandProof,
  validFoundation,
  validLink,
  type Foundation,
  type EvidenceLink,
} from './readiness.ts'
import {
  activeWork,
  workLabel,
  workItems,
  validWork,
  evidenceKinds,
  type Work,
  type EvidenceKind,
  handoverChecks,
  type HandoverCheck,
} from './operations.ts'
import { steps, stages } from './data/steps.ts'
import type { Answers, Field, Step, Value } from './data/steps.ts'

import { strategyTrace, validRelationRows } from './strategyLinks.ts'

export const outcomes = [
  'Durdurun',
  'Bekletin',
  'Yeniden deneyin',
  'Yön değiştirin',
  'Koşullu ilerleyin',
  'İlerleyin',
] as const
export type Outcome = (typeof outcomes)[number]
export interface DecisionInput {
  outcome: Outcome
  reason: string
  owner: string
  task?: string
  date?: string
  proof?: string
  limit?: number
  gapKey?: string
}
export interface Decision extends DecisionInput {
  id: string
  stage: number
  at: string
  imported?: boolean
  stale: boolean
}
export interface Evidence extends EvidenceLink {
  review?: import('./proofReview.ts').ProofReview
  surprise?: import('./proofReview.ts').Surprise
  place?: string
  customerGroup?: string
  period?: string
  kind?: EvidenceKind
  id: string
  title: string
  source: string
  step: string
  at: string
}
export interface ReportPair {
  id: string
  revision: number
  at: string
  executive: string
  action: string
}
interface StrategyChoice {
  question: string
  id: string
  at: string
  owner: string
  choice: string
  basis: string
  transition: string
  revoked?: boolean
}
export interface Plan {
  importedOwner?: string
  strategyChoices?: StrategyChoice[]
  foundation?: Foundation
  handover?: Record<string, HandoverCheck>
  work?: Work[]
  observedChoices?: string[]
  cycleReviews?: SavedReview[]
  publications?: ReportPair[]
  schemaVersion: 1
  id: string
  name: string
  example: boolean
  revision: number
  updatedAt: string
  changes?: {
    id: string
    step: string
    key: string
    before: Value
    after: Value
    at: string
    needsReview: boolean
    reviewer?: string
  }[]
  answers: Record<string, Answers>
  history: Decision[]
  evidence: Evidence[]
}
export const now = () => new Date().toISOString()
export function today() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}
export function createPlan(name: string): Plan {
  if (!name.trim()) throw Error('Plan adını yazın.')
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: name.trim(),
    example: false,
    revision: 0,
    updatedAt: now(),
    answers: {},
    history: [],
    evidence: [],
    changes: [],
  }
}
export function activeSteps(p: Plan) {
  const profile = p.answers['00'] || {}
  return steps
    .filter((s) => {
      switch (s.id) {
        case '03':
          return profile.team === 'Ekip'
        case '04':
          return (
            profile.market === 'Yeni pazar' || profile.permit === 'Gerekiyor'
          )
        case '12':
          return (
            ['Fiziksel ürün', 'Donanım'].includes(String(profile.product)) ||
            profile.site === 'Evet'
          )
        case '30':
          return (
            p.answers['33']?.direction === 'Büyüt' ||
            p.answers['29']?.growth === 'Evet'
          )
        case '31':
          return (
            profile.permit === 'Gerekiyor' ||
            p.answers['29']?.contract === 'Evet'
          )
        case '32':
          return p.answers['29']?.defect === 'Evet'
        case '34':
          return (
            !!closingReview(p) ||
            ['Devret', 'Kapat'].includes(String(p.answers['33']?.direction)) ||
            profile.start === 'Devralınan iş'
          )
        default:
          return true
      }
    })
    .map((s) => s.id)
}
export function visibleFields(p: Plan, s: Step) {
  const branch = p.answers['00']?.mode === 'Ücretsiz hizmet' ? 'free' : 'paid'
  return s.fields.filter((f) => {
    if (s.id === '01' && ['publicBasis', 'publicDuty'].includes(f.key))
      return p.answers['00']?.planningContext === 'Türkiye kamu idaresi'
    if (s.id === '26' && f.key === 'patternSource')
      return !!String(p.answers['26']?.pattern || '').trim()
    if (s.id === '09' && f.key.startsWith('gap'))
      return !!String(p.answers['09']?.marketGap ?? '').trim()
    if (s.id === '18' && f.key === 'newComparison') {
      const choice = String(p.answers['18']?.choice ?? '')
        .trim()
        .toLocaleLowerCase('tr')
      return (
        !!p.foundation?.decisions.at(-1)?.dossier &&
        !!choice &&
        !routes(p).some((r) => r.name.trim().toLocaleLowerCase('tr') === choice)
      )
    }
    if (s.id === '18' && ['rationale', 'reconsider'].includes(f.key))
      return !!p.foundation?.decisions.at(-1)?.dossier

    if (s.id === '25' && ['nextObservation', 'actual'].includes(f.key)) {
      return (
        f.key ===
        (p.answers['25']?.benefit === 'Bilinmiyor'
          ? 'nextObservation'
          : 'actual')
      )
    }
    if (s.id === '19' && f.key === 'choiceBasis') return false
    if (f.branch && f.branch !== branch) return false
    if (f.key === 'fundingTerms')
      return p.answers['00']?.funding === 'Dış kaynak'
    if (['other', 'otherPeriod', 'otherCount', 'matches'].includes(f.key))
      return p.answers['00']?.buyer === 'İki taraflı pazar'
    if (s.id === '11' && ['review', 'exception'].includes(f.key)) {
      if (p.answers['11']?.risk !== 'Yüksek') return false
      return (
        f.key === 'review' ||
        (Array.isArray(p.answers['11']?.options) &&
          p.answers['11'].options.length === 1)
      )
    }
    return true
  })
}
export function calendar(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v
  )
}
export function present(v: unknown, f: Field): boolean {
  if (f.kind === 'list')
    return (
      Array.isArray(v) &&
      v.length > 0 &&
      v.every(
        (r) =>
          r && f.columns?.every((c) => typeof r[c] === 'string' && r[c].trim()),
      )
    )
  if (f.kind === 'date') return calendar(v)
  if (f.kind === 'number')
    return (
      (!['kişi', 'adet', 'iş'].includes(f.unit || '') || Number.isInteger(v)) &&
      typeof v === 'number' &&
      Number.isFinite(v) &&
      v >= (f.min ?? 0)
    )
  return (
    typeof v === 'string' && !!v.trim() && (!f.choices || f.choices.includes(v))
  )
}
function rowGap(p: Plan, s: Step) {
  const entry = (key: string, row: number, message: string) => ({
    value: s.id + '.' + key,
    step: s.id,
    label: s.id + '. adım, ' + (row + 1) + '. kayıt. ' + message,
  })
  if (s.id === '19' && p.foundation?.decisions.at(-1)?.dossier) {
    const rows = p.answers['19']?.goals
    if (Array.isArray(rows)) {
      const i = (rows as Record<string, string>[]).findIndex((r) =>
        r['Hedef tarih']?.trim()
          ? !calendar(r['Hedef tarih'])
          : !r['Başlatacak olay']?.trim(),
      )
      if (i >= 0)
        return entry(
          'goals',
          i,
          'Geçerli tarih veya başlatacak olay gerekiyor.',
        )
    }
  }
  if (s.id === '22') {
    const rows = p.answers['22']?.metrics
    if (Array.isArray(rows)) {
      const i = (rows as Record<string, string>[]).findIndex(
        (r) => !r['Başlangıç']?.trim() && !r['İlk ölçüm yolu']?.trim(),
      )
      if (i >= 0)
        return entry('metrics', i, 'Başlangıç veya ilk ölçüm yolu gerekiyor.')
    }
  }
}
export function complete(p: Plan, s: Step, checkStrengths = true) {
  if (
    checkStrengths &&
    s.id === '12' &&
    p.answers['11']?.risk === 'Yüksek' &&
    !strengthsComplete(p)
  )
    return false
  if (rowGap(p, s)) return false
  if (s.id === '19' && p.foundation?.decisions.at(-1)?.dossier) {
    if (p.answers['19']?.choiceBasis !== p.answers['18']?.choice) return false
  }
  if (s.id === '18' && p.foundation?.decisions.at(-1)?.dossier) {
    const choice = String(p.answers['18']?.choice ?? '')
      .trim()
      .toLocaleLowerCase('tr')
    if (
      [p.answers['05']?.group, p.answers['08']?.target].some(
        (v) =>
          String(v ?? '')
            .trim()
            .toLocaleLowerCase('tr') === choice,
      )
    )
      return false
  }
  return visibleFields(p, s).every(
    (f) => f.optional || present(p.answers[s.id]?.[f.key], f),
  )
}
export function applyEdit(
  p: Plan,
  step: string,
  key: string,
  value: Value,
): Plan {
  if (!allows(p, step, key)) return p
  if (JSON.stringify(p.answers[step]?.[key]) === JSON.stringify(value)) return p
  const row = { ...p.answers[step], [key]: value }
  if (
    cycleField(step, key) &&
    !p.answers[step]?.methodChoice &&
    !hasCycleData(p.answers[step], step)
  ) {
    const choice = currentStrategyChoice(p)?.id
    if (choice) row.methodChoice = choice
  }
  if (step === '09') {
    if (key === 'marketGap') {
      delete row.gapMatch
      delete row.gapChecked
    }
    if (['gapProof', 'gapBehavior', 'gapGroup', 'gapPeriod'].includes(key))
      delete row.gapMatch
    if (key === 'gapAlternative') {
      delete row.gapChecked
      delete row.gapCoverage
    }
  }
  if (step === '18' && key === 'choice') {
    delete row.newComparison
    delete row.chosenOrigin
  }
  if (step === '19' && key === 'goals' && p.answers['18']?.choice)
    row.choiceBasis = p.answers['18'].choice
  const next = { ...p, answers: { ...p.answers, [step]: row } }
  if (
    (step === '25' && key === 'actual') ||
    (step === '26' && key === 'observed')
  ) {
    if (step === '25')
      row.actualChoice = value ? currentStrategyChoice(p)?.id || '' : ''
    next.observedChoices = [
      ...new Set([...observationOwners(p), ...observationOwners(next)]),
    ]
  }
  const before = activeSteps(p),
    after = activeSteps(next)
  const stage = Math.min(
    ...steps
      .filter(
        (s) => s.id === step || before.includes(s.id) !== after.includes(s.id),
      )
      .map((s) => s.stage),
  )
  const old = p.answers[step]?.[key]
  if (
    old !== undefined &&
    old !== '' &&
    [
      'budget',
      'end',
      'attempts',
      'stop',
      'threshold',
      'harm',
      'benefit',
    ].includes(key)
  ) {
    const increase =
      key === 'budget' || key === 'attempts'
        ? Number(value) > Number(old)
        : key === 'end'
          ? String(value) > String(old)
          : true
    const changes = [...(p.changes || [])]
    const change = {
      id: crypto.randomUUID(),
      step,
      key,
      before: old,
      after: value,
      at: now(),
      needsReview: p.answers['00']?.team === 'Tek kurucu' && increase,
    }
    changes.push(change)
    Object.assign(next, { changes })
  }
  return {
    ...next,
    history: p.history.map((h) =>
      h.stage >= stage ? { ...h, stale: true } : h,
    ),
  }
}
function num(a: Answers | undefined, k: string) {
  const n = a?.[k]
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}
export function cash(p: Plan) {
  const a = p.answers['16'],
    balance = num(a, 'balance'),
    due = num(a, 'due'),
    price = num(a, 'price'),
    cost = num(a, 'cost'),
    fixed = num(a, 'fixed')
  const contribution =
    p.answers['00']?.mode !== 'Ücretsiz hizmet' &&
    price !== null &&
    cost !== null
      ? (Math.round(price * 100) - Math.round(cost * 100)) / 100
      : null
  return {
    gap:
      balance !== null && due !== null
        ? Math.max(0, Math.round(due * 100) - Math.round(balance * 100)) / 100
        : null,
    contribution,
    breakEven:
      contribution !== null && contribution > 0 && fixed !== null
        ? Math.ceil(Math.round(fixed * 100) / Math.round(contribution * 100))
        : null,
  }
}
export function currentStage(p: Plan) {
  const start = p.foundation?.decisions.length && access(p).active ? 4 : 0
  const index = stages.findIndex((_, i) => i >= start && !approved(p, i))
  return index < 0 ? 7 : index
}
export function approved(p: Plan, i: number) {
  const h = p.history.findLast((h) => h.stage === i)
  return !!h && !h.stale && h.outcome === 'İlerleyin'
}
export function effective(h: Decision): Outcome {
  return h.outcome === 'Koşullu ilerleyin' && (!h.date || h.date < today())
    ? 'Bekletin'
    : h.outcome
}
type Advice = { outcome: Outcome; reason: string; hard: boolean }
export function recommend(p: Plan, i: number): Advice {
  const a = p.answers,
    b = a['02'] || {}
  const hold = (reason: string, hard = true): Advice => ({
    outcome: 'Bekletin',
    reason,
    hard,
  })
  const change = (reason: string): Advice => ({
    outcome: 'Yön değiştirin',
    reason,
    hard: false,
  })
  const last = p.history.findLast((h) => h.stage === i && !h.stale)
  if (last?.outcome === 'Durdurun')
    return { outcome: 'Durdurun', reason: last.reason, hard: true }
  if (
    b.danger === 'Var' ||
    p.evidence.some(
      (e) => e.surprise?.danger && e.surprise.status !== 'Kapandı',
    ) ||
    b.stopHit === 'Evet'
  )
    return {
      outcome: 'Durdurun',
      reason: 'Zarar tehlikesini ve durma koşulunu inceleyin.',
      hard: true,
    }
  if (b.clearance !== 'Yetki var')
    return hold('Sıradaki iş için yetkiyi doğrulayın.')
  if (p.changes?.some((c) => c.needsReview && !c.reviewer))
    return hold('Değişen sınır için ikinci görüş kaydedin.')
  if (!calendar(b.end) || b.end < today())
    return hold('Araştırmanın geçerli bitiş tarihini yazın.')
  if (
    num(b, 'budget') === null ||
    num(b, 'spent') === null ||
    Number(b.spent) >= Number(b.budget)
  )
    return hold('Kalan bütçeyi doğrulayın.')
  const allowed = i === 5 ? Math.min(3, Number(b.attempts)) : Number(b.attempts)
  const remaining =
    allowed -
    p.history.filter((h) => h.stage === i && h.outcome === 'Yeniden deneyin')
      .length
  if (!Number.isFinite(remaining) || remaining <= 0)
    return hold('Kalan deneme hakkını kontrol edin.')
  if (i > currentStage(p)) return hold('Önce açık olan kararı tamamlayın.')
  const fields = steps.filter(
    (s) => s.stage === i && activeSteps(p).includes(s.id),
  )
  if (
    i === 3 &&
    (a['14']?.authorization !== 'Karşılandı' ||
      a['14']?.[
        a['00']?.mode === 'Ücretsiz hizmet' ? 'budgetAuthority' : 'billing'
      ] !== 'Karşılandı')
  )
    return hold('Ödeme veya bütçe düzenini ve uygulama yetkisini doğrulayın.')
  if (i === 4 && (cash(p).gap ?? 0) > 0)
    return hold('Ödeme gününde nakit açığı var.')
  if (
    i === 4 &&
    (a['00']?.mode === 'Ücretsiz hizmet'
      ? Number(a['16']?.fund) < Number(a['16']?.serviceCost)
      : (cash(p).contribution ?? 1) <= 0)
  )
    return hold('Teslimin gelirini ve giderini yeniden inceleyin.')
  if (
    i >= 4 &&
    (!access(p).active || access(p).last?.outcome !== 'Planlamaya hazır')
  )
    return hold('Önce stratejik planlamaya geçiş kararını inceleyin.')
  if (i === 4 && !currentStrategyChoice(p))
    return hold('Önce karar sahibi stratejik yolu seçmelidir.')
  if (i === 3 && !demandProof(p))
    return hold('Müşteri davranışını tarihli bir kanıta bağlayın.')
  if (fields.some((s) => !complete(p, s)))
    return hold('Açık alanları tamamlayın. Eksik kanıtı deftere yazın.', false)
  if (i === 1) {
    const values = ['repeat', 'effort', 'loss'].map((k) => a['07'][k])
    if (values.includes('Bilinmiyor'))
      return hold('Sorunun üç ölçüsü için kanıt toplayın.', false)
    const count = values.filter((v) => v === 'Karşılandı').length
    if (count === 2)
      return {
        outcome: 'Yeniden deneyin',
        reason: 'Eksik ölçü için ek görüşme yapın.',
        hard: false,
      }
    if (count === 0)
      return {
        outcome: 'Durdurun',
        reason: 'Geçerli ölçümde üç koşul da karşılanmadı.',
        hard: true,
      }
    if (count < 2) return change('Hedef grubu ve son olayı tekrar inceleyin.')
  }
  if (i === 2 && (Number(a['09'].capacity) <= 0 || Number(a['09'].demand) <= 0))
    return change('Erişilebilir bir grup ve uygulanabilir bir yol seçin.')
  if (i === 2 && !compareReady(p))
    return hold(
      'Farklı yolları karşılaştırın. Pahalı kararda denemeyi ve bağımsız görüşü kaydedin.',
    )
  if (
    i === 2 &&
    activeSteps(p).includes('12') &&
    a['12'].ready !== 'Karşılandı'
  )
    return hold('Teslim kapasitesi için dayanak bekleniyor.', false)
  if (
    i === 3 &&
    (Number(a['15'].committed) > Number(a['15'].offered) ||
      Number(a['15'].threshold) <= 0)
  )
    return hold('Teklif sayısını, taahhüdü ve yazılı eşiği düzeltin.')
  if (
    i === 3 &&
    Number(a['15'][a['00'].mode === 'Ücretsiz hizmet' ? 'attended' : 'paid']) >
      Number(a['15'].offered)
  )
    return hold('Katılan veya ödeyen kişi teklif sayısını aşamaz.')
  if (
    i === 3 &&
    a['00'].buyer === 'İki taraflı pazar' &&
    (Number(a['15'].otherCount) < 1 || Number(a['15'].matches) < 1)
  )
    return hold(
      'Her iki tarafın davranışını ve tamamlanan eşleşmeyi doğrulayın.',
    )
  if (
    i === 3 &&
    a['00'].mode === 'Ücretsiz hizmet' &&
    Number(a['15'].attended) < Number(a['15'].threshold)
  )
    return change('Fiilî katılım yazılı eşiğin altında.')
  if (
    i === 3 &&
    a['00'].mode === 'Ücretli satış' &&
    (a['00'].product === 'Hizmet' ||
      (a['00'].product === 'Dijital ürün' && a['00'].buyer === 'Tüketici')) &&
    Number(a['15'].paid) < Number(a['15'].threshold)
  )
    return change('Gerçek ödeme sayısı yazılı eşiğin altında.')
  if (i === 3 && Number(a['15'].committed) < Number(a['15'].threshold))
    return change('Geçerli taahhüt sayısı yazılı eşiğin altında.')
  if (i === 4 && a['20'].ready !== 'Karşılandı')
    return hold('Kaynak ve risk sınırını doğrulayın.')
  if (
    i === 5 &&
    (Number(a['23'].completed) > Number(a['23'].total) ||
      Number(a['23'].total) < 1)
  )
    return hold('Başlayan ve yardımsız bitiren kişi sayılarını doğrulayın.')
  if (i === 5 && a['25'].benefit === 'Karşılanmadı')
    return change('İlk teslim doğrudan fayda sağlamadı.')
  if (
    i === 5 &&
    [a['25'].operating, a['25'].benefit].some((v) => v !== 'Karşılandı')
  )
    return hold('Teslim ölçülerini ve faydayı doğrulayın.', false)
  if (
    i === 6 &&
    [a['28'].mature, a['29'].sustainable].some((v) => v !== 'Karşılandı')
  )
    return hold('Tam gözlem dönemini ve kaynak dengesini bekleyin.')
  if (i === 7 && a['33']?.direction === 'Kapat')
    return {
      outcome: 'Durdurun',
      reason: 'Açık siparişleri, ödemeleri ve bakım işlerini kapatın.',
      hard: true,
    }
  if (
    i === 7 &&
    activeSteps(p).includes('34') &&
    a['34']?.accepted !== 'Karşılandı'
  )
    return hold('Açık işler için yazılı kabul bekleniyor.')
  return {
    outcome: 'İlerleyin',
    reason: 'Alanlar tamamlandı. Yetkili kişi kanıtları inceleyebilir.',
    hard: false,
  }
}
export function openGaps(p: Plan, stage: number) {
  return steps
    .filter((s) => s.stage === stage && activeSteps(p).includes(s.id))
    .flatMap((s) => {
      const extra = rowGap(p, s)
      const missing = visibleFields(p, s)
        .filter((f) => !f.optional)
        .filter(
          (f) =>
            !present(p.answers[s.id]?.[f.key], f) ||
            p.answers[s.id]?.[f.key] === 'Bilinmiyor' ||
            p.answers[s.id]?.[f.key] === 'Karşılanmadı',
        )
        .map((f) => ({
          value: s.id + '.' + f.key,
          label: s.id + '. ' + f.label,
          step: s.id,
        }))
      return extra
        ? [...missing.filter((item) => item.value !== extra.value), extra]
        : missing
    })
}
export function recordDecision(
  p: Plan,
  stage: number,
  input: DecisionInput,
): Plan {
  if (
    (input.outcome === 'Koşullu ilerleyin' ||
      input.outcome === 'İlerleyin' ||
      input.outcome === 'Yeniden deneyin') &&
    stage > currentStage(p)
  )
    throw Error('Önce açık olan kararı tamamlayın.')
  if (
    stage === 4 &&
    input.outcome === 'İlerleyin' &&
    p.foundation?.decisions.at(-1)?.dossier &&
    input.owner.trim() !== String(p.answers['01']?.owner ?? '').trim()
  )
    throw Error('Kaynak kararını kayıtlı karar sahibi verir.')
  if (!input.reason.trim() || !input.owner.trim())
    throw Error('Gerekçeyi ve karar sahibini yazın.')
  const advice = recommend(p, stage)
  if (advice.outcome === 'Durdurun' && input.outcome !== 'Durdurun')
    throw Error(advice.reason)
  if (input.outcome === 'İlerleyin' && advice.outcome !== 'İlerleyin')
    throw Error(advice.reason)
  if (
    (input.outcome === 'Koşullu ilerleyin' ||
      input.outcome === 'Yeniden deneyin') &&
    advice.hard
  )
    throw Error(advice.reason)
  if (input.outcome === 'Koşullu ilerleyin') {
    if (
      !input.task?.trim() ||
      !input.proof?.trim() ||
      !calendar(input.date) ||
      input.date < today() ||
      input.date > String(p.answers['02'].end) ||
      input.limit === undefined ||
      !Number.isFinite(input.limit) ||
      input.limit < 0 ||
      input.limit >
        Number(p.answers['02'].budget) - Number(p.answers['02'].spent)
    )
      throw Error(
        'Kapsamı, geçerli tarihi, kalan bütçeyi ve kapanış kanıtını yazın.',
      )
    const gap = openGaps(p, stage).find((g) => g.value === input.gapKey)
    if (!gap) throw Error('Koşullu izin için açık bir kanıt alanı seçin.')
    if (
      p.history.some(
        (h) =>
          h.stage === stage &&
          h.outcome === input.outcome &&
          (!h.gapKey || h.gapKey === gap.step || h.gapKey === gap.value),
      )
    )
      throw Error('Bu eksik için koşullu izin daha önce kullanıldı.')
  }
  const history = p.history.map((h) =>
    h.stage > stage ? { ...h, stale: true } : h,
  )
  return {
    ...p,
    history: [
      ...history,
      { ...input, id: crypto.randomUUID(), stage, at: now(), stale: false },
    ],
  }
}
export function money(n: number | null) {
  return n === null
    ? 'Bilinmiyor'
    : new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
      }).format(n)
}
export function dateLabel(v: string) {
  const d = new Date(v.length === 10 ? v + 'T12:00:00' : v)
  return Number.isNaN(+d)
    ? 'Bilinmiyor'
    : d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      })
}
export function freezeReports(p: Plan): Plan {
  const pair = {
    id: crypto.randomUUID(),
    revision: p.revision,
    at: now(),
    executive: report(p, 'executive'),
    action: report(p, 'action'),
  }
  return { ...p, publications: [...(p.publications || []), pair] }
}
function choiceBasis(p: Plan) {
  const a = p.answers['18'] ?? {}
  return JSON.stringify(
    Object.keys(a)
      .sort()
      .map((k) => [k, a[k]]),
  )
}
export function currentStrategyChoice(p: Plan) {
  const choice = p.strategyChoices?.at(-1)
  if (!choice || choice.revoked || choice.basis !== choiceBasis(p))
    return undefined
  const original = p.foundation?.decisions.find(
    (d) => d.id === choice.transition,
  )
  const latest = p.foundation?.decisions.at(-1)
  return original &&
    !original.revoked &&
    latest &&
    !latest.revoked &&
    (latest.outcome !== 'Koşullu hazır' ||
      latest.field !== '18.route' ||
      choice.question === latest.question) &&
    original.signature === latest.signature
    ? choice
    : undefined
}
export function confirmStrategyChoice(p: Plan, owner: string): Plan {
  const permission = access(p),
    last = permission.last
  if (
    !permission.active ||
    !last ||
    (last.outcome === 'Koşullu hazır' && last.field !== '18.route')
  )
    throw Error('Yol seçimi için geçerli izin gerekiyor.')
  if (
    !owner.trim() ||
    owner.trim() !== String(p.answers['01']?.owner ?? '').trim()
  )
    throw Error('Yolu planın karar sahibi seçer.')
  const a = p.answers['18']
  if (
    !complete(
      p,
      steps.find((s) => s.id === '18')!,
    ) ||
    !String(a?.actions ?? '').trim() ||
    !String(a?.comparison ?? '').trim()
  )
    throw Error(
      'Seçimi, karşılaştırmayı, temel işleri ve yeniden bakma koşulunu tamamlayın.',
    )
  const question = String(
    last.outcome === 'Koşullu hazır'
      ? last.question
      : a?.question ||
          p.foundation?.brief?.openDecisions?.find((q) => q.question.trim())
            ?.question ||
          p.foundation?.brief?.question ||
          '',
  ).trim()
  if (!question) throw Error('Stratejin hangi soruyu yanıtladığını yazın.')
  if (currentStrategyChoice(p)) return p
  return {
    ...p,
    strategyChoices: [
      ...(p.strategyChoices ?? []),
      {
        question,
        id: crypto.randomUUID(),
        at: now(),
        owner: owner.trim(),
        choice: String(a.choice),
        basis: choiceBasis(p),
        transition: last.id,
      },
    ],
  }
}
export function copyPlan(p: Plan, team = false): Plan {
  return {
    ...p,
    id: crypto.randomUUID(),
    revision: 0,
    name: p.name + ' (kopya)',
    ...(team && {
      importedOwner: String(p.answers['01']?.owner || p.importedOwner || ''),
      answers: { ...p.answers, '01': { ...p.answers['01'], owner: '' } },
    }),
    ...(p.foundation && {
      foundation: {
        ...p.foundation,
        decisions: p.foundation.decisions.map((d) => ({ ...d, revoked: true })),
      },
    }),
    history: p.history.map((h) => ({ ...h, stale: true, imported: true })),
    ...(p.strategyChoices && {
      strategyChoices: p.strategyChoices.map((c) => ({ ...c, revoked: true })),
    }),
    ...(p.cycleReviews && {
      cycleReviews: p.cycleReviews.map((r) => ({ ...r, imported: true })),
    }),
  }
}
export function latestReview(p: Plan) {
  const r = p.cycleReviews?.at(-1)
  const grant = p.history.findLast(
    (h) => h.stage === 4 && h.outcome === 'İlerleyin' && !h.imported,
  )
  return r && !r.imported && grant && r.grant === grant.id ? r : undefined
}
export function closingReview(p: Plan) {
  const r = latestReview(p)
  return r && (r.action === 'Tamamla' || r.action === 'Durdur') ? r : undefined
}
export function reviewNext(p: Plan) {
  const r = latestReview(p)
  if (!r) return undefined
  const id = reviewDestinations[r.action]
  if ((id === '23' || id === '25') && !approved(p, 4)) return undefined
  if (id === '17' && access(p).active) return undefined
  if (id === '18' && currentStrategyChoice(p)) return undefined
  if (!['17', '34'].includes(id) && !access(p).active) return undefined
  return { id, action: r.action, reason: r.reason }
}
export function recordCycleReview(p: Plan, input: CycleReview): Plan {
  if (!validReviewInput(input))
    throw Error('Kararın dayanağını, gerekçesini ve izlenecek işi tamamlayın.')
  if (input.owner.trim() !== String(p.answers['01']?.owner ?? '').trim())
    throw Error('Bu kararı planın karar sahibi verir.')
  const grant = p.history.findLast(
    (h) => h.stage === 4 && h.outcome === 'İlerleyin' && !h.imported,
  )
  const stopOrReturn = ['Hazırlığa dön', 'Durdur', 'Tamamla'].includes(
    input.action,
  )
  if (
    !grant ||
    (!['Hazırlığa dön', 'Durdur'].includes(input.action) &&
      !allows(p, '33', 'direction'))
  )
    throw Error('Güncel kaynak iznini ve geçiş kararını inceleyin.')
  const saved: SavedReview = {
    ...input,
    owner: input.owner.trim(),
    choice: String(p.answers['18']?.choice ?? ''),
    choiceId: currentStrategyChoice(p)?.id,
    grant: grant.id,
    id: crypto.randomUUID(),
    at: now(),
  }
  const reopen =
    stopOrReturn ||
    input.action === 'Yolu yeniden seç' ||
    input.action === 'Planı düzelt'
  const f = p.foundation
  return {
    ...p,
    cycleReviews: [...(p.cycleReviews ?? []), saved],
    ...((stopOrReturn || input.action === 'Yolu yeniden seç') &&
    p.strategyChoices
      ? {
          strategyChoices: p.strategyChoices.map((c) => ({
            ...c,
            revoked: true,
          })),
        }
      : {}),
    ...(reopen
      ? {
          history: p.history.map((h) =>
            h.stage >= 4 ? { ...h, stale: true } : h,
          ),
        }
      : {}),
    ...(input.action === 'Yolu yeniden seç' && p.answers['19']
      ? {
          answers: {
            ...p.answers,
            '19': { ...p.answers['19'], choiceBasis: '' },
          },
        }
      : {}),
    ...(stopOrReturn && f
      ? {
          foundation: {
            ...f,
            decisions: f.decisions.map((d) => ({ ...d, revoked: true })),
          },
        }
      : {}),
  }
}
export function report(p: Plan, kind: 'executive' | 'action') {
  const stage = currentStage(p),
    advice = recommend(p, stage),
    c = cash(p)
  const head = [
    '# ' +
      (kind === 'executive' ? 'Yönetici raporu' : 'Girişimci aksiyon planı'),
    p.name + (p.example ? ' (örnek plan)' : ''),
    'Kayıt sürümü ' + p.revision + ' · ' + dateLabel(p.updatedAt),
  ]
  const readiness = evaluate(p),
    permission = access(p)
  const gap = readiness.rows.slice(0, 9).find((r) => !r.ok)
  head.push(
    '## Stratejik planlamaya hazırlık',
    'Bugünkü öneri: ' + readiness.outcome,
    permission.last
      ? 'Kayıtlı karar: ' + permission.last.outcome + '. ' + permission.reason
      : permission.reason,
    gap
      ? 'Sıradaki iş: ' + gap.hint
      : permission.active
        ? 'İzin verilen strateji çalışmasını açın.'
        : 'Karar sahibi dayanakları incelesin.',
  )
  if (permission.last?.outcome === 'Koşullu hazır')
    head.push(
      permission.last.question,
      permission.last.assignee + ' · ' + dateLabel(permission.last.due),
    )
  const follow = reviewNext(p)
  const reviews = p.cycleReviews ?? []
  if (reviews.length)
    head.push(
      '## Sonucu değerlendirme ve yeniden karar verme',
      ...reviews.map((r) =>
        [
          dateLabel(r.at),
          r.owner,
          r.action,
          'İncelenen yol: ' + (r.choice || 'Belirtilmedi'),
          'Beklenti: ' + (r.expected || 'Belirtilmedi'),
          'Gerçek sonuç: ' + (r.observed || 'Henüz bilinmiyor'),
          'Kaynak: ' + r.source,
          'Gerekçe: ' + r.reason,
          r.missing && 'Eksik gözlem: ' + r.missing,
          r.assignee && 'Sorumlu: ' + r.assignee,
          r.next && 'Sonraki kontrol: ' + r.next,
        ]
          .filter(Boolean)
          .join('. '),
      ),
    )
  const a = p.answers
  const detail = (step: string, key: string, title: string) => {
    const value = a[step]?.[key]
    return typeof value === 'string' && value.trim()
      ? [title + ': ' + value]
      : []
  }
  if (a['18']?.choice) {
    head.push(
      currentStrategyChoice(p) && permission.active
        ? '## Karar sahibinin seçtiği yol'
        : '## Stratejin önerdiği yol',
      String(a['18'].choice),
      ...(currentStrategyChoice(p) && permission.active
        ? ['Karar sorusu: ' + currentStrategyChoice(p)!.question]
        : detail('18', 'question', 'Karar sorusu')),
      ...detail('18', 'comparison', 'Seçimi ayıran bulgu'),
      ...detail('18', 'actions', 'Birlikte yapılacak işler'),
      ...detail('18', 'diagnosis', 'Temel güçlük'),
      ...detail('18', 'policy', 'Yön veren ilke'),
      'Gerekçe: ' + String(a['18'].rationale || 'Bilinmiyor'),
      'Vazgeçilen yol: ' + String(a['18'].excluded || 'Bilinmiyor'),
      'Seçimi değiştirecek bulgu: ' +
        String(a['18'].reconsider || 'Bilinmiyor'),
    )
  }
  const governance = [
    ...detail('01', 'mandate', 'Yetki dayanağı'),
    ...(a['00']?.planningContext === 'Türkiye kamu idaresi'
      ? [
          ...detail('01', 'publicBasis', 'Planlama kaynağı ve sürümü'),
          ...detail('01', 'publicDuty', 'Kamu görevi'),
        ]
      : []),
  ]
  if (governance.length)
    head.push('## Karar yetkisinin dayanağı', ...governance)
  const trace = strategyTrace(
    p,
    permission.active ? currentStrategyChoice(p)?.id : undefined,
  )
  head.push(
    ...phaseMethodReport(
      p,
      permission.active ? currentStrategyChoice(p)?.id : undefined,
    ),
  )
  if (trace.length) head.push('## Hedeflerin karar bağları', ...trace)
  const execution = [
    ...detail('20', 'resources', 'Ayrılan kaynak'),
    ...detail('21', 'scope', 'Planlanan teslim'),
    ...detail('21', 'accept', 'Kabul koşulu'),
    ...detail('22', 'benefit', 'Beklenen fayda'),
    ...detail('22', 'source', 'Ölçüm kaynağı'),
    ...detail('22', 'checkpoint', 'Kontrol zamanı'),
    ...detail('23', 'problem', 'Teslim veya engel'),
    ...detail('23', 'used', 'Kullanılan kaynak'),
    ...detail('23', 'source', 'Teslim kaynağı'),
    ...detail('25', 'group', 'Gözlenen grup'),
    ...detail('25', 'period', 'Gözlem dönemi'),
    ...(a['25']?.benefit !== 'Bilinmiyor'
      ? detail('25', 'actual', 'Gözlenen sonuç')
      : []),
    ...detail('25', 'evidence', 'Sonucun kaynağı'),
    ...detail('25', 'effects', 'Beklenmeyen etki'),
    ...(a['25']?.benefit === 'Bilinmiyor'
      ? detail('25', 'nextObservation', 'Sonraki gözlem')
      : []),
  ]
  if (execution.length) head.push('## Seçimden uygulamaya', ...execution)
  const val = (id: string, k: string) =>
    typeof a[id]?.[k] === 'string' || typeof a[id]?.[k] === 'number'
      ? String(a[id][k]) || 'Bilinmiyor'
      : 'Bilinmiyor'
  const rows = (id: string, k: string) =>
    Array.isArray(a[id]?.[k])
      ? (a[id][k] as Record<string, string>[])
          .map((row) =>
            Object.entries(row)
              .filter(([k, v]) => !k.startsWith('_') && v)
              .map(([, v]) => v)
              .join(' · '),
          )
          .filter(Boolean)
      : []
  const last = p.history.at(-1)
  const free = a['00']?.mode === 'Ücretsiz hizmet'
  const budget = num(a['02'], 'budget'),
    spent = num(a['02'], 'spent')
  if (kind === 'executive') {
    return [
      ...head,
      '## Karar özeti',
      stages[stage].question,
      follow
        ? 'Güncel sonuç kararı: ' + follow.action + '. ' + follow.reason
        : 'Öneri: ' + advice.outcome + '. ' + advice.reason,
      'Son kayıt: ' +
        (last
          ? effective(last) +
            '. ' +
            last.reason +
            (last.stale ? ' Yeniden inceleyin.' : '')
          : 'Henüz karar yok.'),
      '## Sorun ve talep',
      val('05', 'event'),
      'Teklif alan: ' +
        val('15', 'offered') +
        '. Taahhüt veren: ' +
        val('15', 'committed') +
        '. ' +
        (free
          ? 'Katılan: ' + val('15', 'attended')
          : 'Ödeyen: ' + val('15', 'paid')),
      '## Kaynaklar',
      'Kalan araştırma bütçesi: ' +
        money(budget !== null && spent !== null ? budget - spent : null),
      'İlk ödeme günü açığı: ' + money(c.gap),
      ...(free
        ? [
            'Hizmet bütçesi: ' + money(num(a['16'], 'fund')),
            'Hizmet gideri: ' + money(num(a['16'], 'serviceCost')),
          ]
        : [
            'Sipariş başına katkı: ' + money(c.contribution),
            'Başabaş noktası: ' + (c.breakEven ?? 'Bilinmiyor'),
          ]),
      '## Risk ve teslim',
      ...(rows('17', 'risks').length
        ? rows('17', 'risks')
        : ['Risk kaydı bekleniyor.']),
      'Doğrudan fayda: ' + val('25', 'benefit'),
      'Tekrar ölçümü: ' + val('28', 'mature'),
      '## İşin yönü',
      val('33', 'direction'),
      'Yeniden bakılacak olay: ' + val('33', 'reopen'),
      '## Karar geçmişi',
      ...p.history.map(
        (h) =>
          stages[h.stage].name +
          ' — ' +
          effective(h) +
          '. ' +
          h.reason +
          ' (' +
          h.owner +
          (h.stale ? ', yeniden incelenecek' : '') +
          ')',
      ),
      ...(!p.history.length ? ['Henüz karar kaydı yok.'] : []),
      '## Dayanaklar',
      ...(p.evidence.length
        ? p.evidence.map(
            (e) =>
              e.title + ' — ' + e.source + (e.kind ? ' (' + e.kind + ')' : ''),
          )
        : ['Henüz dayanak eklenmedi.']),
    ].join('\n\n')
  }
  const binding = p.history.findLast((h) => h.stage === stage && !h.stale)
  const result = binding ? effective(binding) : advice.outcome
  const taskMode =
    result === 'Durdurun'
      ? 'Açık yükümlülükleri kapatın.'
      : result === 'Bekletin'
        ? 'Engeli izleyin. Yeni harcamayı bekletin.'
        : advice.reason
  const actionable = activeWork(p).filter(
    (w) =>
      w.decision &&
      (result === 'Durdurun' || result === 'Bekletin'
        ? w.decision === binding?.id
        : true),
  )
  const goals = rows('19', 'goals')
  return [
    ...head,
    '## Sıradaki iş',
    follow
      ? follow.action +
        '. ' +
        follow.id +
        '. adımın kaydını açın. ' +
        follow.reason
      : taskMode,
    ...(binding && !follow
      ? ['Karar sahibinin gerekçesi: ' + binding.reason]
      : []),
    ...(a['18']?.choice
      ? [
          currentStrategyChoice(p) && permission.active
            ? '## Seçilen strateji'
            : '## Önerilen strateji',
          String(a['18'].choice),
          ...(currentStrategyChoice(p) && permission.active
            ? ['Karar sorusu: ' + currentStrategyChoice(p)!.question]
            : detail('18', 'question', 'Karar sorusu')),
          ...detail('18', 'comparison', 'Seçimi ayıran bulgu'),
          ...detail('18', 'actions', 'Birlikte yapılacak işler'),
          ...(a['18'].chosenOrigin
            ? ['Yolu doğuran soru: ' + a['18'].chosenOrigin]
            : []),
          ...crossQuestions.flatMap((q, i) =>
            a['18']['cross' + (i + 1)]
              ? [q + ' ' + a['18']['cross' + (i + 1)]]
              : [],
          ),
        ]
      : []),
    '## Karara bağlı işler',
    ...actionable.map(
      (w) =>
        w.title +
        ' · ' +
        w.owner +
        ' · ' +
        (w.due ? dateLabel(w.due) : 'Tarih belirlenmedi.'),
    ),
    ...(!actionable.length ? ['Henüz görev kaydı yok.'] : []),
    result === 'Durdurun' || result === 'Bekletin'
      ? '## Bekleyen eylem planı'
      : '## Stratejik eylem planı',
    ...(goals.length ? goals : ['İş sırasını 19. adımda yazın.']),
    ...(workItems(p).length
      ? [
          '## Görev takibi',
          ...workItems(p).map(
            (w) =>
              w.title +
              ' · ' +
              workLabel(p, w) +
              ' · ' +
              w.owner +
              (w.due ? ' · ' + dateLabel(w.due) : '') +
              (w.proof ? ' · ' + w.proof : ''),
          ),
        ]
      : []),
    '## Deneme ve teslim',
    'Yazılı eşik: ' + val('15', 'threshold'),
    'Deneme sınırı: ' + val('02', 'attempts'),
    'Teslim kapsamı: ' + val('21', 'scope'),
    'Kabul ölçüsü: ' + val('21', 'accept'),
    '## Sonraki kontrol',
    'Sorumlu: ' + val('01', 'owner'),
    'Kontrol olayı: ' + val('33', 'reopen'),
    ...(activeSteps(p).includes('34')
      ? ['## Devir ve açık sözler', ...rows('34', 'obligations')]
      : []),
    ...(p.answers['00']?.start === 'Devralınan iş'
      ? [
          '## Devir kontrolü',
          ...handoverChecks.map(
            ([id, label]) =>
              label +
              ' · ' +
              (p.handover?.[id]?.status || 'Bilinmiyor') +
              ' · ' +
              (p.handover?.[id]?.source || 'Dayanak bekleniyor.'),
          ),
        ]
      : []),
    '## Eksik adımlar',
    ...steps
      .filter((s) => activeSteps(p).includes(s.id) && !complete(p, s))
      .map((s) => s.id + '. ' + s.title),
  ].join('\n\n')
}
function object(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}
const iso = (v: unknown) =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v))
export function validatePlan(v: unknown): v is Plan {
  if (
    !object(v) ||
    v.schemaVersion !== 1 ||
    typeof v.id !== 'string' ||
    !v.id ||
    typeof v.name !== 'string' ||
    !v.name.trim() ||
    typeof v.example !== 'boolean' ||
    !Number.isSafeInteger(v.revision) ||
    Number(v.revision) < 0 ||
    !iso(v.updatedAt) ||
    !object(v.answers) ||
    !Array.isArray(v.history) ||
    !Array.isArray(v.evidence)
  )
    return false
  const answers = Object.entries(v.answers).every(([id, row]) => {
    const s = steps.find((s) => s.id === id)
    return (
      !!s &&
      object(row) &&
      Object.entries(row).every(([k, val]) => {
        const f = s.fields.find((f) => f.key === k)
        if (!f) return false
        if (val === '') return true
        if (f.kind === 'list')
          return (
            Array.isArray(val) &&
            validRelationRows(id, k, val) &&
            (id !== '18' || validMatrixRows(k, val)) &&
            (id !== '22' || k !== 'forecasts' || val.every(validForecast)) &&
            (id !== '11' ||
              k !== 'options' ||
              new Set(val.flatMap((r) => (r?._id ? [r._id] : []))).size ===
                val.filter((r) => r?._id).length) &&
            val.every(
              (r) =>
                object(r) &&
                Object.entries(r).every(
                  ([c, x]) =>
                    typeof x === 'string' &&
                    ((id === '19' &&
                      k === 'objectives' &&
                      ['_id', '_choice', '_risk'].includes(c)) ||
                      (id === '17' && k === 'risks' && c === '_id') ||
                      (((id === '19' && k === 'goals') ||
                        (id === '22' && k === 'metrics')) &&
                        c === '_objective') ||
                      f.columns?.includes(c) ||
                      f.optionalColumns?.includes(c) ||
                      f.listChoices?.[c]?.includes(x) ||
                      (x === '' && !!f.listChoices?.[c]) ||
                      (id === '11' &&
                        k === 'options' &&
                        c === '_id' &&
                        /^[a-z0-9%_-]+$/i.test(x) &&
                        ![
                          'current',
                          'constructor',
                          'prototype',
                          '__proto__',
                        ].includes(x))),
                ),
            )
          )
        if (f.kind === 'date') return calendar(val)
        return f.kind === 'number'
          ? present(val, f)
          : typeof val === 'string' && (!f.choices || f.choices.includes(val))
      })
    )
  })
  const changes =
    v.changes === undefined ||
    (Array.isArray(v.changes) &&
      v.changes.every(
        (c) =>
          object(c) &&
          typeof c.id === 'string' &&
          typeof c.key === 'string' &&
          steps.some((s) => s.id === c.step) &&
          ['string', 'number'].includes(typeof c.before) &&
          ['string', 'number'].includes(typeof c.after) &&
          typeof c.needsReview === 'boolean' &&
          (c.reviewer === undefined || typeof c.reviewer === 'string') &&
          iso(c.at),
      ))
  return (
    answers &&
    (v.observedChoices === undefined ||
      (Array.isArray(v.observedChoices) &&
        v.observedChoices.every((id) => typeof id === 'string') &&
        new Set(v.observedChoices).size === v.observedChoices.length)) &&
    (v.importedOwner === undefined || typeof v.importedOwner === 'string') &&
    validFoundation(v.foundation) &&
    (v.strategyChoices === undefined ||
      (Array.isArray(v.strategyChoices) &&
        v.strategyChoices.every(
          (c) =>
            object(c) &&
            iso(c.at) &&
            ['id', 'owner', 'choice', 'basis', 'transition', 'question'].every(
              (k) => typeof c[k] === 'string' && c[k].trim(),
            ) &&
            (c.revoked === undefined || typeof c.revoked === 'boolean'),
        ) &&
        new Set(v.strategyChoices.map((c) => c.id)).size ===
          v.strategyChoices.length)) &&
    (v.cycleReviews === undefined ||
      (Array.isArray(v.cycleReviews) &&
        v.cycleReviews.every(
          (r) =>
            object(r) &&
            validReviewInput(r) &&
            typeof r.id === 'string' &&
            !!r.id &&
            iso(r.at) &&
            typeof r.choice === 'string' &&
            (r.choiceId === undefined ||
              (typeof r.choiceId === 'string' && !!r.choiceId.trim())) &&
            typeof r.grant === 'string' &&
            (r.imported === undefined || typeof r.imported === 'boolean'),
        ) &&
        new Set(v.cycleReviews.map((r) => r.id)).size ===
          v.cycleReviews.length)) &&
    (v.handover === undefined ||
      (object(v.handover) &&
        Object.entries(v.handover).every(
          ([k, c]) =>
            handoverChecks.some(([id]) => id === k) &&
            object(c) &&
            ['Bilinmiyor', 'Kayıt var', 'Kayıt eksik'].includes(
              String(c.status),
            ) &&
            typeof c.source === 'string',
        ))) &&
    validWork(v.work, v.history as Decision[]) &&
    changes &&
    (v.publications === undefined ||
      (Array.isArray(v.publications) &&
        v.publications.every(
          (r) =>
            object(r) &&
            typeof r.id === 'string' &&
            Number.isSafeInteger(r.revision) &&
            Number(r.revision) >= 0 &&
            iso(r.at) &&
            typeof r.executive === 'string' &&
            typeof r.action === 'string',
        ))) &&
    v.history.every(
      (h) =>
        object(h) &&
        typeof h.id === 'string' &&
        Number.isInteger(h.stage) &&
        Number(h.stage) >= 0 &&
        Number(h.stage) < 8 &&
        outcomes.includes(h.outcome as Outcome) &&
        typeof h.reason === 'string' &&
        typeof h.owner === 'string' &&
        typeof h.stale === 'boolean' &&
        (h.imported === undefined || typeof h.imported === 'boolean') &&
        iso(h.at) &&
        ['task', 'date', 'proof'].every(
          (k) => h[k] === undefined || typeof h[k] === 'string',
        ) &&
        (!h.date || calendar(h.date)) &&
        (h.gapKey === undefined ||
          steps.some(
            (s) =>
              s.id === h.gapKey ||
              s.fields.some((f) => s.id + '.' + f.key === h.gapKey),
          )) &&
        (h.limit === undefined || typeof h.limit === 'number'),
    ) &&
    v.evidence.every(
      (e) =>
        object(e) &&
        validLink(e) &&
        typeof e.id === 'string' &&
        typeof e.title === 'string' &&
        typeof e.source === 'string' &&
        (e.kind === undefined ||
          evidenceKinds.includes(e.kind as EvidenceKind)) &&
        steps.some((s) => s.id === e.step) &&
        iso(e.at),
    )
  )
}
