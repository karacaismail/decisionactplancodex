import { calendar, dateLabel, type Plan } from './domain.ts'
import type { Answers, Value } from './data/steps.ts'
import { claimEvidence, routes, type Route } from './dossier.ts'

export const phaseCards = [
  { slug: 'bes-neden', step: '07', title: '5 Neden' },
  { slug: 'karar-matrisi', step: '18', title: 'Karar Matrisi' },
  { slug: 'hoshin-kanri', step: '19', title: 'Hoshin Kanri' },
  { slug: 'kpi-tasarimi', step: '22', title: 'KPI Tasarımı' },
  { slug: 'kanban', step: '23', title: 'Kanban' },
  { slug: 'geri-bildirim-analizi', step: '26', title: 'Geri Bildirim Analizi' },
] as const

export function methodRows(v: Value | undefined): Record<string, string>[] {
  return Array.isArray(v)
    ? v.filter(
        (x): x is Record<string, string> => typeof x === 'object' && x !== null,
      )
    : []
}
export function methodSuggested(p: Plan, step: string) {
  const a = p.answers
  switch (step) {
    case '07':
      return (
        !!a['05']?.event ||
        !!p.foundation?.brief?.studies?.some((s) => s.method === 'cause')
      )
    case '18':
      return routes(p).length >= 2 || !!methodRows(a['18']?.matrixPair).length
    case '19':
      return (
        !!p.strategyChoices?.length || !!methodRows(a['19']?.objectives).length
      )
    case '22':
      return !!(
        a['21']?.scope ||
        a['22']?.benefit ||
        methodRows(a['22']?.metrics).length
      )
    case '23':
      return !!(
        a['23']?.problem ||
        a['23']?.wipLimit != null ||
        methodRows(a['23']?.board).length
      )
    case '26':
      return !!(
        a['22']?.benefit ||
        a['25']?.actual ||
        a['26']?.expected ||
        a['26']?.observed
      )
    default:
      return false
  }
}
type Row = Record<string, string>
function routeBasis(p: Plan, r: Route) {
  const notes = p.foundation?.brief?.routes?.[r.id]
  const proof = notes?.testProof
  return JSON.stringify([
    r.name,
    r.cost || '',
    r.source || '',
    notes?.difference || '',
    notes?.cost || '',
    notes?.result || '',
    proof || '',
    proof ? claimEvidence(p, proof) : '',
  ])
}
export function routeSources(p: Plan, r: Route) {
  const notes = p.foundation?.brief?.routes?.[r.id]
  return [
    r.name,
    r.source || 'Dayanak henüz yazılmadı.',
    notes?.difference,
    notes?.result,
    notes?.testProof && claimEvidence(p, notes.testProof),
  ]
    .filter(Boolean)
    .join(' · ')
}
export const pairFor = (p: Plan, left: Route, right: Route): Row => ({
  left: left.id,
  right: right.id,
  leftName: left.name,
  rightName: right.name,
  leftBasis: routeBasis(p, left),
  rightBasis: routeBasis(p, right),
})
export function pairCurrent(p: Plan, pair: Row, paths: Route[]) {
  const left = paths.find((r) => r.id === pair.left),
    right = paths.find((r) => r.id === pair.right)
  return !!(
    left &&
    right &&
    left.id !== right.id &&
    pair.leftBasis === routeBasis(p, left) &&
    pair.rightBasis === routeBasis(p, right)
  )
}
const inRange = (s: string, max: number) =>
  /^\d+$/.test(s) && Number(s) >= 1 && Number(s) <= max
export function validMatrixRows(key: string, rows: unknown[]) {
  if (key === 'matrixPair')
    return (
      rows.length <= 1 &&
      rows.every(
        (x) =>
          x &&
          [
            'left',
            'right',
            'leftName',
            'rightName',
            'leftBasis',
            'rightBasis',
          ].every(
            (k) => typeof (x as Row)[k] === 'string' && (x as Row)[k].trim(),
          ) &&
          (x as Row).left !== (x as Row).right,
      )
    )
  if (key !== 'matrixScores') return true
  return rows.every(
    (x) =>
      x &&
      ['Ağırlık', 'Birinci', 'İkinci'].every(
        (k) =>
          !(x as Row)[k] || inRange((x as Row)[k], k === 'Ağırlık' ? 100 : 5),
      ),
  )
}
const format = (n: number) =>
  n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
export function matrixSummary(p: Plan) {
  const a = p.answers['18'],
    pair = methodRows(a?.matrixPair)[0],
    rules = methodRows(a?.matrixScores)
  if (!pair || !rules.some((r) => Object.values(r).some((v) => v.trim())))
    return []
  const lines = [pair.leftName + ' ve ' + pair.rightName]
  if (!pairCurrent(p, pair, routes(p)))
    return [...lines, 'Aday veya dayanağı değişti. Puanları yeniden inceleyin.']
  for (const r of routes(p).filter(
    (r) => r.id === pair.left || r.id === pair.right,
  ))
    lines.push(routeSources(p, r))
  if (
    !rules.length ||
    rules.some(
      (r) =>
        !r.Ölçü?.trim() ||
        !inRange(r.Ağırlık, 100) ||
        !inRange(r.Birinci, 5) ||
        !inRange(r.İkinci, 5),
    )
  )
    return [
      ...lines,
      'Puanlama eksik. Her ölçünün adını, ağırlığını ve iki puanını tamamlayın.',
    ]
  let total = 0,
    left = 0,
    right = 0
  for (const row of rules) {
    const w = Number(row.Ağırlık)
    total += w
    left += w * Number(row.Birinci)
    right += w * Number(row.İkinci)
    lines.push(
      row.Ölçü +
        ' · Ağırlık ' +
        w +
        ' · Puanlar ' +
        row.Birinci +
        ' ve ' +
        row.İkinci,
    )
  }
  lines.push(
    'Ağırlıklı sonuç (5 üzerinden): ' +
      pair.leftName +
      ' ' +
      format(left / total) +
      ', ' +
      pair.rightName +
      ' ' +
      format(right / total) +
      '.',
  )
  if (left === right) lines.push('İki yol aynı puanı aldı.')
  else
    for (const row of rules) {
      const delta = Number(row.Birinci) - Number(row.İkinci)
      if (!delta) continue
      const boundary = Number(row.Ağırlık) - (left - right) / delta
      if (boundary >= 1 && boundary <= 100)
        lines.push(
          'Diğer ağırlıklar sabitken ' +
            row.Ölçü +
            ' ağırlığı yaklaşık ' +
            format(boundary) +
            ' olursa iki yol eşitlenir.',
        )
    }
  return lines
}
export function forecastLines(p: Plan, choice?: string) {
  if (!choice) return []
  return methodRows(p.answers['22']?.forecasts)
    .filter((r) => r.Seçim === choice)
    .map((r) => [dateLabel(r.Tarih), r.Zaman, r.Beklenti, r.Kaynak].join(' · '))
}

// An empty owner marks an observation from an older plan with no choice reference.
export function observationOwners(p: Plan) {
  const owners = new Set(p.observedChoices ?? [])
  const delivery = p.answers['25'],
    feedback = p.answers['26']
  if (delivery?.actual) owners.add(String(delivery.actualChoice || ''))
  if (feedback?.observed) owners.add(String(feedback.methodChoice || ''))
  for (const review of p.cycleReviews ?? []) {
    if (review.observed?.trim()) owners.add(review.choiceId || '')
  }
  for (const row of methodRows(feedback?.methodHistory)) {
    if (row.Özet?.split('\n').some((line) => line.startsWith('Gözlem: ')))
      owners.add(row.Seçim || '')
  }
  return owners
}

export function forecastRecord(
  p: Plan,
  choice: string | undefined,
  day: string,
) {
  const owners = observationOwners(p)
  return {
    Seçim: choice ?? '',
    Beklenti: String(p.answers['22']?.benefit || '').trim(),
    Kaynak: String(p.answers['22']?.source || '').trim(),
    Tarih: day,
    Zaman:
      choice && owners.has(choice)
        ? 'Gözlem kaydından sonra'
        : owners.has('')
          ? 'Gözlem sırası bilinmiyor'
          : 'Gözlem kaydından önce',
  }
}

export function validForecast(value: unknown) {
  if (!value || typeof value !== 'object') return false
  const row = value as Row
  return (
    [row.Seçim, row.Beklenti, row.Kaynak].every(
      (v) => typeof v === 'string' && v.trim(),
    ) &&
    calendar(row.Tarih) &&
    [
      'Gözlem kaydından önce',
      'Gözlem kaydından sonra',
      'Gözlem sırası bilinmiyor',
    ].includes(row.Zaman)
  )
}
export function openJobs(rows: Row[]) {
  return rows.filter((r) => r.Durum === 'Sürüyor' || r.Durum === 'Engellendi')
    .length
}

const cycleKeys: Record<string, string[]> = {
  '23': ['board', 'wipLimit'],
  '26': [
    'expected',
    'observed',
    'next',
    'why',
    'feedbackSource',
    'pattern',
    'patternSource',
  ],
}
export function cycleField(step: string, key: string) {
  return cycleKeys[step]?.includes(key) ?? false
}
export function hasCycleData(a: Answers | undefined, step: string) {
  return (cycleKeys[step] ?? []).some((k) => {
    const v = a?.[k]
    return (
      typeof v === 'number' ||
      (typeof v === 'string' ? !!v.trim() : Array.isArray(v) && v.length > 0)
    )
  })
}
export function resetForChoice(p: Plan, step: string, choice: string): Answers {
  const old = p.answers[step] ?? {}
  const previous = methodRows(old.methodHistory)
  const summary = cycleLines(
    p,
    step,
    typeof old.methodChoice === 'string' ? old.methodChoice : undefined,
  ).slice(1)
  return {
    ...Object.fromEntries(
      Object.entries(old).filter(([k]) => !cycleField(step, k)),
    ),
    methodChoice: choice,
    methodHistory: summary.length
      ? [
          ...previous,
          { Seçim: String(old.methodChoice || ''), Özet: summary.join('\n') },
        ]
      : previous,
  }
}
export function phaseMethodReport(p: Plan, choice?: string) {
  const a = p.answers,
    output: string[] = []
  const matrix = matrixSummary(p)
  if (matrix.length) output.push('## Karar Matrisi', ...matrix)
  const measures = methodRows(a['22']?.metrics).filter((r) => r.Ölçü?.trim())
  const predictions = forecastLines(p, choice)
  if (measures.length || predictions.length) {
    output.push(
      '## KPI Tasarımı',
      ...predictions.map((line) => 'Tarihli beklenti: ' + line),
    )
    for (const r of measures) {
      const metric = [
        r.Ölçü,
        ...['Birim', 'Eşik', 'Başlangıç', 'İlk ölçüm yolu', 'Karşı ölçü']
          .filter((k) => r[k]?.trim())
          .map((k) => k + ': ' + r[k]),
      ]
      if (
        r._objective &&
        !methodRows(a['19']?.objectives).some(
          (g) => g._id === r._objective && g._choice === choice,
        )
      )
        metric.push('Bu ölçünün güncel hedefle bağı doğrulanmalı.')
      output.push(metric.join(' · '))
    }
  }
  for (const step of ['23', '26']) {
    const records = methodRows(a[step]?.methodHistory)
    if (records.length)
      output.push(
        step === '23'
          ? '## Önceki Kanban kayıtları'
          : '## Önceki geri bildirim kayıtları',
        ...records.map((r) => r.Özet),
      )
    output.push(...cycleLines(p, step, choice))
  }
  return output
}
function cycleLines(p: Plan, step: string, choice?: string) {
  const a = p.answers,
    output: string[] = []
  const owner = a[step]?.methodChoice
  const same = !!choice && owner === choice
  if (step === '23') {
    const board = methodRows(a['23']?.board).filter((r) =>
      Object.values(r).some((v) => v.trim()),
    )
    const limit = a['23']?.wipLimit
    if (board.length || typeof limit === 'number') {
      output.push(
        owner && !same ? '## Önceki seçimin Kanban kaydı' : '## Kanban',
      )
      if (!owner) output.push('Bu kaydın hangi seçime ait olduğu bilinmiyor.')
      const active = openJobs(board)
      output.push(
        'Başlanmış açık iş: ' +
          active +
          '. İş sınırı: ' +
          (limit ?? 'Belirtilmedi') +
          '.',
      )
      if (typeof limit === 'number' && active > limit)
        output.push('Aynı anda yürüyen iş sayısı sınırı aştı.')
      for (const row of board)
        output.push(
          [
            'İş',
            'Durum',
            'Sorumlu',
            'Engel',
            'Bekleme başlangıcı',
            'Sonraki iş',
          ]
            .filter((k) => row[k]?.trim())
            .map((k) => k + ': ' + row[k])
            .join(' · '),
        )
    }
    return output
  }
  const predictions = same ? forecastLines(p, choice) : []
  const feedback = a['26']
  if (feedback && hasCycleData(feedback, step)) {
    output.push(
      owner && !same ? '## Önceki seçimin gözlemi' : '## Geri Bildirim Analizi',
      ...(!owner ? ['Bu gözlemin hangi seçime ait olduğu bilinmiyor.'] : []),
      ...predictions.map(
        (line) => 'Ölçüm planındaki tarihli beklenti: ' + line,
      ),
    )
    for (const [key, label] of [
      ['expected', 'Beklenti'],
      ['observed', 'Gözlem'],
      ['why', 'Farkın açıklaması'],
      ['next', 'Sonraki değişiklik'],
      ['feedbackSource', 'Gözlemin dayanağı'],
      ['pattern', 'Tekrarlanan davranış'],
      ['patternSource', 'Davranış gözleminin kaynağı'],
    ]) {
      if (feedback[key]) output.push(label + ': ' + feedback[key])
    }
    if (feedback.pattern && !String(feedback.patternSource || '').trim())
      output.push('Gözlemin kaynağı eksik.')
    if (feedback.observed && !String(feedback.feedbackSource || '').trim())
      output.push('Gözlemin kaynağı eksik.')
    const prior = methodRows(a['22']?.forecasts).some(
      (r) =>
        same &&
        r.Seçim === choice &&
        r.Zaman === 'Gözlem kaydından önce' &&
        r.Beklenti.trim() === String(feedback.expected || '').trim(),
    )
    if (feedback.expected && !prior)
      output.push('Bu beklentinin gözlemden önce yazıldığı doğrulanmadı.')
  }
  return output
}
