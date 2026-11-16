import { isDeepStrictEqual as equal } from 'node:util'
import { currentStrategyChoice, today } from '../src/domain.ts'
import { allows } from '../src/readiness.ts'
import {
  cycleField,
  forecastRecord,
  observationOwners,
  hasCycleData,
  methodRows,
  resetForChoice,
} from '../src/phaseMethods.ts'

function deny(message) {
  throw Object.assign(new Error(message), { status: 403 })
}

export function validateMethodUpdate(old, next) {
  // A newly imported copy has no active grants. Its archived records are readable.
  if (!old) return
  const before = old.answers,
    after = next.answers
  const choice = currentStrategyChoice(next)?.id
  const fields = {
    18: ['matrixPair', 'matrixScores'],
    22: ['forecasts'],
    23: ['board', 'wipLimit'],
    26: ['feedbackSource'],
  }
  const oldOwners = observationOwners(old)
  const newOwners = observationOwners(next)
  if ([...oldOwners].some((id) => !newOwners.has(id)))
    deny('Önceki gözlem kaydını koruyun.')
  if (
    before['25']?.actualChoice !== after['25']?.actualChoice &&
    (!allows(old, '25', 'actual') ||
      (after['25']?.actual && after['25'].actualChoice !== choice))
  )
    deny('Gözlemin seçim kaydı geçersiz.')
  const oldPredictions = methodRows(before['22']?.forecasts)
  const predictions = methodRows(after['22']?.forecasts)
  if (!equal(oldPredictions, predictions.slice(0, oldPredictions.length)))
    deny('Önceki tarihli beklentiler korunmalıdır.')
  for (const row of predictions.slice(oldPredictions.length)) {
    const expected = forecastRecord(next, choice, today())
    if (!choice || !equal(row, expected))
      deny('Tarihli beklenti güncel seçime ve gözlem zamanına uymuyor.')
  }
  for (const [step, keys] of Object.entries(fields)) {
    let basis = old
    if (['23', '26'].includes(step)) {
      const prev = before[step] ?? {},
        row = after[step] ?? {}
      const historyChanged = !equal(
        prev.methodHistory ?? [],
        row.methodHistory ?? [],
      )
      if (prev.methodChoice !== row.methodChoice || historyChanged) {
        if (
          !choice ||
          row.methodChoice !== choice ||
          !allows(old, step, 'methodChoice')
        )
          deny('Yeni yöntem çalışması için kayıtlı izin gerekir.')
        const expected = resetForChoice(old, step, choice)
        if (!equal(expected.methodHistory, row.methodHistory ?? []))
          deny('Önceki yöntem sonucunu koruyun.')
        if (prev.methodChoice === choice && historyChanged)
          deny('Güncel yöntem geçmişi değiştirilemez.')
        basis = {
          ...old,
          answers: { ...before, [step]: { ...prev, methodChoice: choice } },
        }
      }
      if (
        step === '26' &&
        (row.methodChoice || prev.methodChoice || historyChanged)
      )
        keys.push(
          ...Object.keys({ ...prev, ...row }).filter(
            (k) => cycleField(step, k) && !keys.includes(k),
          ),
        )
      if (
        !row.methodChoice &&
        !hasCycleData(prev, step) &&
        (step === '23' ? hasCycleData(row, step) : row.feedbackSource)
      )
        deny('Bu yöntem için güncel seçime bağlı izin gerekir.')
    }
    for (const key of keys) {
      if (
        !equal(before[step]?.[key], after[step]?.[key]) &&
        !allows(basis, step, key)
      )
        deny('Bu yöntem alanı için kayıtlı izin gerekir.')
    }
  }
  const counters = (a) =>
    methodRows(a['22']?.metrics)
      .map((r) => r['Karşı ölçü'] || '')
      .filter(Boolean)
  if (
    !equal(counters(before), counters(after)) &&
    !allows(old, '22', 'metrics')
  )
    deny('Bu ölçü için kayıtlı izin gerekir.')
}
