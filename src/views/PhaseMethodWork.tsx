import { Button, ConfigProvider, Input, InputNumber, Select } from 'antd'
import { useState } from 'react'
import { applyEdit, currentStrategyChoice, today, type Plan } from '../domain'
import { routes } from '../dossier'
import {
  methodRows,
  forecastLines,
  forecastRecord,
  resetForChoice,
  hasCycleData,
  openJobs,
  matrixSummary,
  pairCurrent,
  routeSources,
  pairFor,
} from '../phaseMethods'
import { studyResult } from '../preparationMethods'
import { steps } from '../data/steps'
import FieldInput from './Fields'
import { NewFieldLabel } from '../ui/NewFieldLabel'

type Props = {
  p: Plan
  step: string
  editable: (key: string) => boolean
  change: (fn: (p: Plan) => Plan) => void
}
type Row = Record<string, string>
const keys = [
  ['Ölçü', 'Ölçünün adı'],
  ['Ağırlık', 'Önem ağırlığı'],
  ['Birinci', 'Birinci yolun puanı'],
  ['İkinci', 'İkinci yolun puanı'],
] as const

function Matrix({ p, change, editable }: Props) {
  const paths = routes(p),
    a = p.answers['18']
  const stored = methodRows(a?.matrixPair)[0]
  const scores = methodRows(a?.matrixScores)
  const [draft, setDraft] = useState<[string, string]>(() => [
    stored?.left ?? paths[0]?.id ?? '',
    stored?.right ?? paths[1]?.id ?? '',
  ])
  const left = paths.find((r) => r.id === draft[0]),
    right = paths.find((r) => r.id === draft[1])
  const pair =
    left && right && right.id !== left.id ? pairFor(p, left, right) : undefined
  const changed =
    !!stored &&
    (!pairCurrent(p, stored, paths) ||
      stored.left !== draft[0] ||
      stored.right !== draft[1])
  const writable = editable('matrixScores') && editable('matrixPair')
  const ready = writable && !!pair && !changed
  const results = matrixSummary(p)
  const previous = (p.foundation?.brief?.studies ?? []).filter(
    (s) => s.method === 'compare',
  )
  function save(rows: Row[]) {
    if (!writable || !pair) return
    change((prev) =>
      applyEdit(
        applyEdit(prev, '18', 'matrixPair', [pair]),
        '18',
        'matrixScores',
        rows,
      ),
    )
  }
  return (
    <div className="fields method-form">
      {previous.map((s, i) => (
        <details className="step-help" key={s.id}>
          <summary>Hazırlıktaki karşılaştırma {i + 1}</summary>
          {studyResult(p, s).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          <p>{s.values.finding}</p>
          {ready &&
            left?.id === s.values.left &&
            right?.id === s.values.right &&
            !scores.length &&
            !!s.criteria?.length && (
              <Button
                onClick={() =>
                  save(
                    s.criteria!.map((r) => ({
                      Ölçü: r.label,
                      Ağırlık: r.weight,
                      Birinci: '',
                      İkinci: '',
                    })),
                  )
                }
              >
                Ölçü ve ağırlıkları al. Puanları yeniden ver.
              </Button>
            )}
        </details>
      ))}
      {paths.length < 2 && (
        <p>Karşılaştırma için 11. adımda iki ayrı aday gerekir.</p>
      )}
      {['Birinci aday', 'İkinci aday'].map((label, i) => (
        <label key={label}>
          <span>{label}</span>
          <Select
            aria-label={label}
            value={paths.some((r) => r.id === draft[i]) ? draft[i] : undefined}
            disabled={!writable}
            options={paths.map((r) => ({
              value: r.id,
              label: r.name,
              disabled: r.id === draft[1 - i],
            }))}
            onChange={(v) => setDraft(i === 0 ? [v, draft[1]] : [draft[0], v])}
          />
        </label>
      ))}
      {[left, right].map((r) => r && <p key={r.id}>{routeSources(p, r)}</p>)}
      {changed && (
        <div role="status">
          <p>
            Aday veya dayanağı değişti. Yeni karşılaştırmada ölçüler korunur.
            Puanları yeniden verin.
          </p>
          <Button
            disabled={!writable || !pair}
            onClick={() =>
              save(scores.map((r) => ({ ...r, Birinci: '', İkinci: '' })))
            }
          >
            Bu adaylar için puanlamayı yenile
          </Button>
        </div>
      )}
      <p>
        Ağırlığı 1 ile 100 arasında belirleyin. Sonra her yola 1 ile 5 arasında
        puan verin.
      </p>
      {scores.map((row, i) => (
        <fieldset className="fields" key={i}>
          <legend>{i + 1}. ölçü</legend>
          {keys.map(([key, label]) => (
            <label key={key}>
              <span>
                <NewFieldLabel text={label} marked />
              </span>
              {key === 'Ölçü' ? (
                <Input
                  aria-label={label}
                  disabled={!ready}
                  value={row[key] ?? ''}
                  onChange={(e) =>
                    save(
                      scores.map((r, n) =>
                        n === i ? { ...r, [key]: e.target.value } : r,
                      ),
                    )
                  }
                />
              ) : (
                <InputNumber
                  aria-label={label}
                  disabled={!ready}
                  min={1}
                  max={key === 'Ağırlık' ? 100 : 5}
                  precision={0}
                  controls={false}
                  value={row[key] ? Number(row[key]) : null}
                  onChange={(v) =>
                    save(
                      scores.map((r, n) =>
                        n === i
                          ? { ...r, [key]: v == null ? '' : String(v) }
                          : r,
                      ),
                    )
                  }
                />
              )}
            </label>
          ))}
          <Button
            disabled={!ready}
            onClick={() => save(scores.filter((_, n) => n !== i))}
          >
            Bu ölçüyü kaldır
          </Button>
        </fieldset>
      ))}
      <Button disabled={!ready} onClick={() => save([...scores, {}])}>
        Karşılaştırma ölçüsü ekle
      </Button>
      {!changed && results.length > 0 && (
        <div className="method-result" aria-live="polite">
          {results.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}
const focusField = (key: string) => {
  const target = document.getElementById('field-' + key)
  if (!target) return
  const input = target.matches('input,textarea,button')
    ? target
    : (target.querySelector<HTMLElement>(
        'input:not(:disabled),textarea:not(:disabled)',
      ) ?? target.querySelector<HTMLElement>('button:not(:disabled)'))
  ;(input ?? target).focus()
  target.scrollIntoView({ block: 'center' })
}
export default function PhaseMethodWork(props: Props) {
  const { p, step, editable, change } = props
  if (step === '18') return <Matrix {...props} />
  const choice = currentStrategyChoice(p)?.id
  const origin = p.answers[step]?.methodChoice
  const previous = !!origin && origin !== choice
  const needsNewCycle =
    (step === '23' || step === '26') &&
    (previous || (!origin && hasCycleData(p.answers[step], step)))
  const cycleNotice = needsNewCycle && (
    <div className="method-result">
      <p>
        {previous
          ? 'Bu kayıt önceki seçime ait.'
          : 'Bu kaydın hangi seçime ait olduğu bilinmiyor.'}
      </p>
      <Button
        disabled={!choice || !editable('methodChoice')}
        onClick={() =>
          change((prev) => {
            const current = currentStrategyChoice(prev)?.id
            if (!current || !editable('methodChoice')) return prev
            const row = resetForChoice(prev, step, current)
            return { ...prev, answers: { ...prev.answers, [step]: row } }
          })
        }
      >
        Önceki kaydı sakla ve yeni çalışmayı aç
      </Button>
    </div>
  )
  if (step === '23')
    return (
      <div className="fields method-form">
        {cycleNotice}
        <p>
          Engellenmiş işi açık iş sayısına katın. Teslim kaynağını adımın kendi
          alanına yazın.
        </p>
        {steps
          .find((s) => s.id === '23')!
          .fields.filter((f) => ['wipLimit', 'board'].includes(f.key))
          .map((f) => (
            <ConfigProvider key={f.key} componentDisabled={!editable(f.key)}>
              <div className="field">
                <label htmlFor={'field-' + f.key}>
                  <NewFieldLabel text={f.label} marked />
                </label>
                <FieldInput
                  f={f}
                  id={'field-' + f.key}
                  v={p.answers[step]?.[f.key]}
                  onChange={(v) => {
                    if (editable(f.key))
                      change((prev) => applyEdit(prev, step, f.key, v))
                  }}
                />
              </div>
            </ConfigProvider>
          ))}
        <p>
          Başlanmış açık iş: {openJobs(methodRows(p.answers[step]?.board))}.
        </p>
      </div>
    )
  const predictions = needsNewCycle ? [] : forecastLines(p, choice)
  const prediction = forecastRecord(p, choice, today())
  const target =
    step === '19' ? 'objectives' : step === '22' ? 'metrics' : 'expected'
  return (
    <div className="method-form">
      {cycleNotice}
      <p>
        {step === '19'
          ? 'Hedefi açın. Ekibin süre veya kaynak önerisini ve yöneticinin yanıtını aynı hedefe yazın.'
          : step === '22'
            ? 'Başlangıcı, birimi ve eşiği belirleyin. Zarar riskini karşı ölçüyle izleyin.'
            : 'Beklentiyi, gözlemi ve görülen farkı karşılaştırın. Dayanağı ve sonraki değişikliği kaydedin.'}
      </p>
      {['22', '26'].includes(step) &&
        predictions.map((line, i) => <p key={i}>Tarihli beklenti: {line}</p>)}
      {step === '22' && (
        <Button
          disabled={
            !editable('forecasts') ||
            !choice ||
            !prediction.Beklenti ||
            !prediction.Kaynak ||
            methodRows(p.answers['22']?.forecasts).some((r) =>
              Object.entries(prediction).every(([k, v]) => r[k] === v),
            )
          }
          onClick={() =>
            change((prev) =>
              applyEdit(prev, '22', 'forecasts', [
                ...methodRows(prev.answers['22']?.forecasts),
                prediction,
              ]),
            )
          }
        >
          Beklentiyi tarihli kaydet
        </Button>
      )}
      {step === '26' && !needsNewCycle && (
        <>
          <p>
            Ölçüm planındaki beklenti:{' '}
            {String(
              p.answers['22']?.benefit || 'Önceden yazılmış beklenti yok.',
            )}
          </p>
          {choice &&
            p.answers['25']?.actualChoice === choice &&
            p.answers['25']?.benefit !== 'Bilinmiyor' &&
            p.answers['25']?.actual && (
              <p>25. adımdaki gözlem: {String(p.answers['25'].actual)}</p>
            )}
        </>
      )}
      <Button onClick={() => focusField(target)}>
        {step === '19'
          ? 'Hedef ve karşı öneri alanına git'
          : step === '22'
            ? 'Ölçü kaydına git'
            : 'Beklenti ve gözlem alanına git'}
      </Button>
    </div>
  )
}
