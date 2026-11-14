import { useState, useEffect } from 'react'
import { Alert, Button, Input, Select } from 'antd'
import { CaretDown, ArrowRight } from '@phosphor-icons/react'
import {
  phases,
  reviewDestinations,
  type CycleReview,
  type ReviewAction,
} from '../lifecycle'
import { access, allows } from '../readiness'
import {
  dateLabel,
  latestReview,
  recordCycleReview,
  type Plan,
} from '../domain'
import { steps } from '../data/steps'
import './lifecycle.css'

type Props = {
  p: Plan
  visit: (id: string) => void
  transition: () => void
  dossier: () => void
  actor?: string
  readOnly: boolean
  confirmed: boolean
  change: (fn: (p: Plan) => Plan) => void
}
function ReviewForm({ p, actor, readOnly, confirmed, change }: Props) {
  const owner = String(p.answers['01']?.owner ?? '')
  const initial = (): CycleReview => ({
    action: 'Sürdür',
    owner,
    assignee: '',
    next: '',
    missing: '',
    expected: String(
      p.answers['26']?.expected || p.answers['22']?.benefit || '',
    ),
    observed: String(
      (p.answers['25']?.benefit !== 'Bilinmiyor' && p.answers['25']?.actual) ||
        p.answers['26']?.observed ||
        '',
    ),
    source: String(p.answers['25']?.evidence ?? ''),
    reason: String(p.answers['26']?.why ?? ''),
  })
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const canWrite = !readOnly && (!actor || actor === owner)
  const normal = allows(p, '33', 'direction')
  const grant = p.history.findLast(
    (h) => h.stage === 4 && h.outcome === 'İlerleyin' && !h.imported,
  )
  const [editing, setEditing] = useState(false)
  if (!grant)
    return (
      <p>
        Karar sahibi, kaynak kararı verildikten sonra sonucu burada
        değerlendirebilir.
      </p>
    )
  if (!editing)
    return (
      <Button
        disabled={!canWrite || !confirmed}
        onClick={() => {
          setForm({
            ...initial(),
            action: normal ? 'Sürdür' : 'Hazırlığa dön',
          })
          setEditing(true)
        }}
      >
        Sonucu değerlendir
      </Button>
    )
  const fields: ReadonlyArray<
    readonly [keyof Omit<CycleReview, 'action' | 'owner'>, string]
  > = [
    ['expected', 'Hangi sonucu bekliyordunuz?'],
    ['observed', 'Gerçekte ne gördünüz?'],
    ['source', 'Kararın dayandığı kaynak'],
    ['reason', 'Kararı neden veriyorsunuz?'],
    ...(form.action === 'Kanıt bekle'
      ? [['missing', 'Hangi gözlem eksik?'] as const]
      : []),
    ['assignee', 'Sonraki işin sorumlusu'],
    ['next', 'Sonraki kontrol günü veya olayı'],
  ]
  return (
    <form
      className="fields cycle-review"
      onSubmit={(e) => {
        e.preventDefault()
        if (!confirmed || !canWrite) return
        try {
          change((plan) =>
            recordCycleReview(plan, { ...form, owner: actor ?? owner }),
          )
          setEditing(false)
          setForm((f) => ({
            ...f,
            reason: '',
            missing: '',
            assignee: '',
            next: '',
          }))
          setError('')
        } catch (e) {
          setError((e as Error).message)
        }
      }}
    >
      <p>Karar sahibi: {owner || 'Belirtilmedi'}</p>
      <label>
        <span>Sonraki karar</span>
        <Select
          aria-label="Sonraki karar"
          virtual={false}
          value={form.action}
          options={(Object.keys(reviewDestinations) as ReviewAction[]).map(
            (v) => ({
              value: v,
              label: v,
              disabled: !normal && !['Hazırlığa dön', 'Durdur'].includes(v),
            }),
          )}
          onChange={(v) => setForm((f) => ({ ...f, action: v }))}
        />
      </label>
      {fields.map(([key, label]) => (
        <label key={key}>
          <span>{label}</span>
          <Input.TextArea
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            autoSize={{ minRows: 1, maxRows: 5 }}
          />
        </label>
      ))}
      {error && <Alert role="alert" type="error" title={error} />}
      <div className="phase-links">
        <Button
          type="primary"
          htmlType="submit"
          disabled={!confirmed || !canWrite}
        >
          Sonuç kararını kaydet
        </Button>
        <Button onClick={() => setEditing(false)}>Vazgeç</Button>
      </div>
    </form>
  )
}
export default function Lifecycle(props: Props) {
  const { p, visit, transition, dossier } = props
  const readPhase = () => {
    const n = Number(
      new URLSearchParams(location.hash.split('?')[1]).get('phase'),
    )
    return phases.some((x) => x.id === n) ? n : 1
  }
  const [selected, setSelected] = useState(readPhase)
  useEffect(() => {
    const sync = () => setSelected(readPhase())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const grant = access(p)
  const history = p.cycleReviews ?? []
  const latest = latestReview(p)
  const goNext = (id: string) => (id === '17' ? transition() : visit(id))
  return (
    <div className="panel phase-plan">
      <div className="phase-heading">
        <h2>Çalışmanın ana aşamaları</h2>
        <p>{p.name} için çalışmak istediğiniz aşamayı açın.</p>
      </div>
      {phases.map((phase) => {
        const open = phase.id === selected
        return (
          <section className="phase-section" key={phase.id}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                tabIndex={0}
                aria-controls={'phase-' + phase.id}
                className="phase-toggle"
                onClick={() => {
                  setSelected(open ? 0 : phase.id)
                  window.history.replaceState(
                    null,
                    '',
                    open ? '#asamalar' : '#asamalar?phase=' + phase.id,
                  )
                }}
              >
                <span>
                  {phase.id}. {phase.title}
                </span>
                <CaretDown aria-hidden="true" />
              </button>
            </h3>
            <div id={'phase-' + phase.id} hidden={!open}>
              {open && (
                <div className="phase-detail">
                  <strong>{phase.question}</strong>
                  <p>{phase.handoff}</p>
                  {phase.id === 1 && (
                    <>
                      <p>
                        {grant.active
                          ? 'Kayıtlı izin: ' + grant.last?.outcome
                          : grant.reason}
                      </p>
                      <div className="phase-links">
                        <Button onClick={transition}>
                          17. adımın kararını incele
                        </Button>
                        <Button onClick={dossier}>
                          Strateje devir raporunu aç
                        </Button>
                      </div>
                    </>
                  )}
                  {phase.id > 1 && (
                    <ol className="phase-tasks">
                      {phase.tasks.map((task) => (
                        <li key={task.name}>
                          <h4>{task.name}</h4>
                          <p>{task.work}</p>
                          <div className="phase-links">
                            {task.steps.map((id) => (
                              <Button key={id} onClick={() => visit(id)}>
                                {id}. {steps.find((s) => s.id === id)?.title}
                              </Button>
                            ))}
                            {task === phase.tasks[0] && phase.id === 2 && (
                              <Button onClick={dossier}>
                                Devirdeki soruyu incele
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                  {phase.id === 2 && p.answers['00']?.groupLink === 'Evet' && (
                    <p>
                      Kurum genelinde stratej, ortak kaynağın hangi işe
                      ayrılacağını karşılaştırır. İş biriminde müşteri veya
                      yararlanıcı için yol seçilir.
                    </p>
                  )}
                  {phase.id === 5 && (
                    <>
                      <ReviewForm
                        key={[
                          p.history.findLast((h) => h.stage === 4)?.id,
                          p.strategyChoices?.at(-1)?.id,
                          grant.last?.id,
                        ].join('/')}
                        {...props}
                      />
                      {history.length > 0 && (
                        <details open>
                          <summary>Sonuç kararlarının geçmişi</summary>
                          <ol>
                            {history.toReversed().map((r) => (
                              <li key={r.id}>
                                <b>{r.action}</b> · {dateLabel(r.at)}
                                <p>
                                  {r.choice}. {r.owner}. {r.reason}
                                </p>
                                <p>Kaynak: {r.source}</p>
                                {r.next && <p>Sonraki kontrol: {r.next}</p>}
                              </li>
                            ))}
                          </ol>
                        </details>
                      )}
                      {latest && (
                        <Button
                          onClick={() =>
                            goNext(reviewDestinations[latest.action])
                          }
                          icon={<ArrowRight />}
                        >
                          {reviewDestinations[latest.action]}. adımın kaydını aç
                        </Button>
                      )}
                    </>
                  )}
                  <details className="step-help">
                    <summary>Bu aşama neden gerekli?</summary>
                    <p>{phase.missing}</p>
                  </details>
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
