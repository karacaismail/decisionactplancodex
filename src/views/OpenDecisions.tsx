import { Button, Input, Select } from 'antd'
import { type Plan, dateLabel } from '../domain'
import { routes, type OpenDecision } from '../dossier'
import { datedProof, researchOptions } from '../research'

type Props = {
  p: Plan
  disabled: boolean
  canPrioritize: boolean
  update: (fn: (questions: OpenDecision[]) => OpenDecision[]) => void
}
export default function OpenDecisions({
  p,
  disabled,
  canPrioritize,
  update,
}: Props) {
  const questions = p.foundation?.brief?.openDecisions ?? []
  const paths = routes(p).map((r) => ({ value: r.id, label: r.name }))
  const proofs = p.evidence
    .filter((e) => datedProof(p, e.id))
    .map((e) => ({
      value: e.id,
      label: e.title + ' (' + dateLabel(e.observed!) + ')',
    }))
  const tests = researchOptions(p, 'test', 'test')
  const withMissing = (options: typeof paths, ids: string[], label: string) => [
    ...options,
    ...ids
      .filter((id) => id && !options.some((o) => o.value === id))
      .map((value) => ({ value, label })),
  ]
  function patch(id: string, values: Partial<OpenDecision>) {
    if (disabled) return
    update((list) => list.map((q) => (q.id === id ? { ...q, ...values } : q)))
  }
  return (
    <section className="fields">
      <h4>Açık kararlar</h4>
      <p>
        İlk sıradaki soru devir raporunu açar. Koşullu izinde önce izin verilen
        soru görünür.
      </p>
      {questions.map((q, i) => (
        <fieldset key={q.id} className="fields">
          <legend>{i + 1}. karar sorusu</legend>
          {(
            [
              ['question', 'Karar sorusu'],
              ['change', 'Hangi bulgu bu kararı değiştirir?'],
              ['owner', 'Sorunun sorumlusu'],
              ['due', 'Karar için son gün'],
              ['reversal', 'Kararı geri almanın bedeli'],
            ] as const
          ).map(([k, label]) => (
            <label key={k}>
              <span>{label}</span>
              <Input
                disabled={disabled}
                type={k === 'due' ? 'date' : 'text'}
                value={q[k]}
                onChange={(e) => patch(q.id, { [k]: e.target.value })}
              />
            </label>
          ))}
          <label>
            <span>Karşılaştırılacak yollar</span>
            <Select
              mode="multiple"
              aria-label="Karşılaştırılacak yollar"
              disabled={disabled}
              options={withMissing(paths, q.routes, 'Yol kaldırıldı')}
              value={q.routes}
              onChange={(v) => patch(q.id, { routes: v })}
            />
          </label>
          {(
            [
              ['proof', 'Kararın dayanağı', proofs, 'Kanıt kaldırıldı'],
              ['test', 'Karara bağlı deneme', tests, 'Deneme kaldırıldı'],
            ] as const
          ).map(([k, label, options, missing]) => (
            <label key={k}>
              <span>{label}</span>
              <Select
                aria-label={label}
                allowClear
                disabled={disabled}
                value={q[k] || undefined}
                options={withMissing(options, [q[k]], missing)}
                onChange={(v) => patch(q.id, { [k]: v ?? '' })}
              />
            </label>
          ))}
          {i > 0 && (
            <Button
              disabled={disabled || !canPrioritize}
              onClick={() =>
                update((list) => {
                  const first = list.find((item) => item.id === q.id)
                  return first
                    ? [first, ...list.filter((item) => item.id !== q.id)]
                    : list
                })
              }
            >
              Bu soruyu ilk sıraya al
            </Button>
          )}
          <Button
            disabled={disabled || !canPrioritize}
            onClick={() =>
              update((list) => list.filter((item) => item.id !== q.id))
            }
          >
            Bu soruyu kaldır
          </Button>
        </fieldset>
      ))}
      <Button
        disabled={disabled}
        onClick={() =>
          update((list) => [
            ...list,
            {
              id: crypto.randomUUID(),
              question: '',
              routes: [],
              change: '',
              proof: '',
              test: '',
              owner: '',
              due: '',
              reversal: '',
            },
          ])
        }
      >
        Karar sorusu ekle
      </Button>
    </section>
  )
}
