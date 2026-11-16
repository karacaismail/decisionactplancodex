import type { Plan } from './domain.ts'
import type { Field, Value } from './data/steps.ts'

type Row = Record<string, string>
type Option = { value: string; label: string }
export type RowRelation = {
  key: '_risk' | '_objective'
  label: string
  options: Option[]
}

function records(value: Value | undefined): Row[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is Row => typeof item === 'object' && item !== null,
  )
}

// A unique unchanged name lets an old risk be linked without rewriting a readiness decision.
function riskReferences(rows: Row[]) {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const name = r.Risk?.trim()
    if (name && !r._id) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return rows
    .map((row) => {
      const name = row.Risk?.trim() || ''
      const id =
        row._id ||
        (name && counts.get(name) === 1 && !/[\uD800-\uDFFF]/u.test(name)
          ? 'eski-' + encodeURIComponent(name)
          : '')
      return { id, name, row }
    })
    .filter((r) => r.name)
}

function distinctLabels(options: Option[]): Option[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const { label } of options) {
    if (seen.has(label)) repeated.add(label)
    seen.add(label)
  }
  return options.map((option, index) =>
    repeated.has(option.label)
      ? {
          ...option,
          label: option.label + ' (listedeki sıra ' + (index + 1) + ')',
        }
      : option,
  )
}

export function rowRelation(
  p: Plan,
  step: string,
  key: string,
  choice?: string,
): RowRelation | undefined {
  if (step === '19' && key === 'objectives')
    return {
      key: '_risk',
      label: 'Bağlı hazırlık riski',
      options: distinctLabels(
        riskReferences(records(p.answers['17']?.risks))
          .filter((r) => r.id)
          .map((r) => ({ value: r.id, label: r.name })),
      ),
    }
  if (
    (step === '19' && key === 'goals') ||
    (step === '22' && key === 'metrics')
  )
    return {
      key: '_objective',
      label: 'Bağlı hedef',
      options: distinctLabels(
        records(p.answers['19']?.objectives)
          .filter((r) => choice && r._choice === choice && r.Hedef?.trim())
          .map((r) => ({ value: r._id, label: r.Hedef.trim() })),
      ),
    }
}

export function freshRow(field: Field, choice?: string): Row {
  if (field.key === 'objectives')
    return { _id: crypto.randomUUID(), _choice: choice ?? '' }
  if (field.key === 'options' || field.key === 'risks')
    return { _id: crypto.randomUUID() }
  return {}
}

export function strategyTrace(p: Plan, choice?: string): string[] {
  const a = p.answers
  const goals = records(a['19']?.objectives)
  const tasks = records(a['19']?.goals).filter((r) => r.Görev?.trim())
  const measures = records(a['22']?.metrics).filter((r) => r.Ölçü?.trim())
  const risks = riskReferences(records(a['17']?.risks))
  const current = goals.filter(
    (r) => choice && r._choice === choice && r.Hedef?.trim(),
  )
  const lines: string[] = []
  const selected = String(a['18']?.choice || '').trim()
  if (selected && !String(a['18']?.excluded || '').trim())
    lines.push('18. adım. Seçimde hangi yoldan vazgeçildiği eksik.')
  for (const g of current) {
    const jobs = tasks.filter((r) => r._objective === g._id)
    const metrics = measures.filter((r) => r._objective === g._id)
    const risk = risks.find((r) => g._risk && r.id === g._risk)
    lines.push(
      'Hedef: ' + g.Hedef,
      g.Sorumlu?.trim()
        ? 'Hedef sorumlusu: ' + g.Sorumlu
        : '19. adım. Hedefin sorumlusu eksik.',
      g['Ayrılan kaynak']?.trim()
        ? 'Hedef için ayrılan kaynak: ' + g['Ayrılan kaynak']
        : '19. adım. Ayrılan kaynak eksik.',
    )
    if (g['Ekibin karşı önerisi']?.trim() || g['Karşı öneriye yanıt']?.trim())
      lines.push(
        'Yöntem: Hoshin Kanri',
        'Ekibin karşı önerisi: ' +
          (g['Ekibin karşı önerisi']?.trim() || 'Karşı öneri yazılmadı.'),
        'Yanıt: ' + (g['Karşı öneriye yanıt']?.trim() || 'Henüz verilmedi'),
      )
    if (g['Çalışma amacı']) lines.push('Çalışma amacı: ' + g['Çalışma amacı'])
    if (risk)
      lines.push(
        'Risk: ' + risk.name,
        'Önlem: ' + (risk.row.Önlem?.trim() || 'Henüz yazılmadı'),
      )
    else if (g._risk)
      lines.push(
        'Bağlı risk bulunamadı. 17. adımda riski inceleyin. 19. adımda hedefe bağlayın.',
      )
    for (const r of jobs) lines.push('İş: ' + r.Görev)
    for (const r of metrics) {
      lines.push('Ölçü: ' + r.Ölçü)
      if (r['Beklenen etki']?.trim())
        lines.push('Sınanacak varsayım: ' + r['Beklenen etki'])
    }
  }
  for (const g of goals.filter(
    (r) => r.Hedef?.trim() && (!choice || r._choice !== choice),
  ))
    lines.push(
      'Önceki seçime ait hedef: ' +
        g.Hedef +
        '. Güncel seçimle bağı doğrulanmalı.',
    )
  const linked = new Set(current.map((r) => r._id))
  for (const r of tasks.filter((r) => !linked.has(r._objective)))
    lines.push('19. adım. ' + r.Görev + ' işi için hedef bağlantısı eksik.')
  for (const r of measures.filter((r) => !linked.has(r._objective))) {
    lines.push('22. adım. ' + r.Ölçü + ' ölçüsü için hedef bağlantısı eksik.')
    if (r['Beklenen etki']?.trim())
      lines.push('Sınanacak varsayım: ' + r['Beklenen etki'])
  }
  if (choice || goals.length) {
    for (const r of risks.filter(
      (r) => !r.id || !current.some((g) => g._risk === r.id),
    ))
      lines.push(
        r.id
          ? '19. adım. ' + r.name + ' riski için etkilenen hedef belirtilmedi.'
          : r.name +
              ' riskini bağlamak için 17. adımda ayırt edici bir ad verin.',
      )
  }
  return lines
}

export function validRelationRows(
  step: string,
  key: string,
  rows: unknown[],
): boolean {
  const identity =
    (step === '19' && key === 'objectives') ||
    (step === '17' && key === 'risks')
  if (!identity) return true
  const seen = new Set<string>()
  return rows.every((r) => {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return false
    const row = r as Record<string, unknown>
    if (
      key === 'objectives' &&
      (typeof row._choice !== 'string' || !row._choice.trim() || !row._id)
    )
      return false
    if (row._id === undefined) return true
    if (
      typeof row._id !== 'string' ||
      !/^[a-z0-9_-]+$/i.test(row._id) ||
      row._id.startsWith('eski-') ||
      seen.has(row._id)
    )
      return false
    seen.add(row._id)
    return true
  })
}
