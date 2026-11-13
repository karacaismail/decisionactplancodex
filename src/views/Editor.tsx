import { useState, useEffect, lazy, Suspense } from 'react'
import {
  ConfigProvider,
  Alert,
  Button,
  Collapse,
  Input,
  InputNumber,
  Select,
} from 'antd'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  BookOpenText,
  Flag,
  NotePencil,
} from '@phosphor-icons/react'
import { steps, stages, type Value } from '../data/steps'
import {
  activeSteps,
  applyEdit,
  complete,
  currentStage,
  outcomes,
  openGaps,
  recommend,
  recordDecision,
  today,
  visibleFields,
  type Plan,
  type DecisionInput,
} from '../domain'
import guide from '../data/guide.json'
import stepHelp from '../data/stepHelp.json'
import DecisionDesk from './DecisionDesk'
import FieldInput from './Fields'
import StepSummary from './StepSummary'
const Takeover = lazy(() => import('./Takeover'))
const Methods = lazy(() => import('./Methods'))
export default function Editor({
  p,
  change,
  stage,
  setStage,
  readOnly,
}: {
  readOnly: boolean
  p: Plan
  change: (f: (p: Plan) => Plan) => void
  stage: number
  setStage: (n: number) => void
}) {
  const [reviewer, setReviewer] = useState('')
  const [selected, setSelected] = useState(() => {
      try {
        return localStorage.getItem('atlas-step-' + p.id + '-' + stage) || ''
      } catch {
        return ''
      }
    }),
    [mode, setMode] = useState<'step' | 'decision'>('step'),
    [showMethods, methods] = useState(false)
  const [err, error] = useState(''),
    [notice, setNotice] = useState('')
  const [form, setForm] = useState<DecisionInput>({
    outcome: 'Bekletin',
    reason: '',
    owner: '',
  })
  const route = activeSteps(p),
    items = steps.filter((s) => s.stage === stage && route.includes(s.id)),
    step = items.find((x) => x.id === selected) ?? items[0],
    index = items.indexOf(step)
  const advice = recommend(p, stage)
  function focusQuestion() {
    requestAnimationFrame(() => {
      const heading = document.getElementById('active-question')
      heading?.focus({ preventScroll: true })
      heading?.scrollIntoView({ block: 'start' })
    })
  }
  function choose(i: number) {
    focusQuestion()
    setSelected(i >= 0 ? items[i].id : '')
    remember(i >= 0 ? items[i].id : '')
    setMode('step')
    methods(false)
    setNotice('')
    error('')
  }
  function edit(key: string, val: Value) {
    change((prev) => applyEdit(prev, step.id, key, val))
  }
  function review() {
    focusQuestion()
    setMode('decision')
    setForm({
      outcome: advice.outcome,
      reason: '',
      owner: String(p.answers['01']?.owner ?? ''),
    })
    error('')
    setNotice('')
  }
  function record() {
    try {
      const next = recordDecision(p, stage, form)
      change(() => next)
      setNotice('Karar kayda eklendi.')
      error('')
      if (form.outcome === 'İlerleyin' && stage < 7) {
        setStage(currentStage(next))
        setSelected('')
        setMode('step')
      }
    } catch (e) {
      error((e as Error).message)
    }
  }
  useEffect(() => {
    try {
      setSelected(
        localStorage.getItem('atlas-step-' + p.id + '-' + stage) || '',
      )
    } catch {}
  }, [stage, p.id])
  function remember(id: string) {
    try {
      localStorage.setItem('atlas-step-' + p.id + '-' + stage, id)
    } catch {}
  }
  const field = (
    k: 'reason' | 'owner' | 'task' | 'date' | 'proof',
    label: string,
  ) => (
    <label>
      <span>{label}</span>
      <Input
        type={k === 'date' ? 'date' : 'text'}
        min={k === 'date' ? today() : undefined}
        value={form[k] ?? ''}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      />
    </label>
  )
  return (
    <div
      className={
        'editor-wrap' +
        (p.answers['00']?.start === 'Devralınan iş' && stage === 0
          ? ' has-handover'
          : '')
      }
    >
      <DecisionDesk
        p={p}
        stage={stage}
        setStage={(n) => {
          setStage(n)
          setSelected('')
          setMode('step')
          setNotice('')
          error('')
        }}
        review={review}
        openGap={(id, key) => {
          const i = items.findIndex((s) => s.id === id)
          if (i >= 0) {
            choose(i)
            requestAnimationFrame(() =>
              document.getElementById('field-' + key)?.focus(),
            )
          }
        }}
      />
      {p.answers['00']?.start === 'Devralınan iş' && stage === 0 && (
        <Suspense fallback={<p>Devir kaydı açılıyor.</p>}>
          <Takeover
            p={p}
            change={change}
            readOnly={readOnly}
            visit={(id) => {
              const dest = steps.find((s) => s.id === id)!
              try {
                localStorage.setItem(
                  'atlas-step-' + p.id + '-' + dest.stage,
                  id,
                )
              } catch {}
              setStage(dest.stage)
              setSelected(id)
              setMode('step')
              focusQuestion()
            }}
          />
        </Suspense>
      )}
      <div className="stage-switch">
        <label htmlFor="stage-select">Kararı seçin</label>
        <Select
          id="stage-select"
          value={stage}
          options={stages.map((s, i) => ({
            label: i + 1 + '. ' + s.name,
            value: i,
          }))}
          onChange={(i) => {
            setStage(i)
            setMode('step')
            setSelected('')
            methods(false)
            error('')
            setNotice('')
          }}
        />
      </div>
      <section className="panel editor-panel">
        <div className="eyeline">
          <Flag size={18} /> Karar {stage + 1} / 8
        </div>
        <h2>{stages[stage].question}</h2>
        <p className="muted">
          {items.filter((s) => complete(p, s)).length} / {items.length} adım
          tamamlandı.
        </p>
        {(p.changes || []).some((c) => c.needsReview && !c.reviewer) && (
          <section className="review-note">
            <h3>İkinci görüş</h3>
            <p>Değişen sınırı inceleyen kişinin adını yazın.</p>
            <ul>
              {p.changes
                ?.filter((c) => c.needsReview && !c.reviewer)
                .map((c) => (
                  <li key={c.id}>
                    {
                      steps
                        .find((s) => s.id === c.step)
                        ?.fields.find((f) => f.key === c.key)?.label
                    }
                    : {String(c.before)} yerine {String(c.after)}
                  </li>
                ))}
            </ul>
            <Input
              disabled={readOnly}
              aria-label="İkinci görüş sahibi"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
            />
            <Button
              disabled={
                readOnly ||
                !reviewer.trim() ||
                reviewer.trim() === p.answers['01']?.owner
              }
              onClick={() => {
                change((prev) => ({
                  ...prev,
                  changes: prev.changes?.map((c) =>
                    c.needsReview && !c.reviewer
                      ? { ...c, reviewer: reviewer.trim() }
                      : c,
                  ),
                }))
                setReviewer('')
              }}
            >
              Görüşü kaydet
            </Button>
          </section>
        )}
        <div className="step-tabs" aria-label="Adım seçimi">
          {items.map((s, i) => (
            <button
              key={s.id}
              aria-pressed={mode === 'step' && s === step}
              onClick={() => choose(i)}
            >
              {complete(p, s) && <CheckCircle />}
              {s.id}. {s.title}
            </button>
          ))}
          <button aria-pressed={mode === 'decision'} onClick={review}>
            Kararı kaydet
          </button>
        </div>
        {notice && <Alert title={notice} type="success" showIcon />}
        {mode === 'step' ? (
          <>
            <div className="form-heading">
              <div className="eyeline">
                <NotePencil size={17} /> Adım {step.id}
              </div>
              <h3 id="active-question" tabIndex={-1}>
                {step.title}
              </h3>
              <p>{step.help}</p>
            </div>
            {step.id === '00' && p.answers['00']?.start === 'Devralınan iş' && (
              <Alert
                type="info"
                showIcon
                title="Son üç ayın ödemelerini, kayıplarını ve açık teslimlerini inceleyin."
              />
            )}
            <details className="step-help">
              <summary>Örnek ve uygulama rehberi</summary>
              {(stepHelp[step.id as keyof typeof stepHelp] || []).map(
                (note, i) => (
                  <p key={i}>{note}</p>
                ),
              )}
            </details>
            <ConfigProvider componentDisabled={readOnly}>
              <fieldset disabled={readOnly} className="fields read-fields">
                {visibleFields(p, step).map((f) => (
                  <div className="field" key={f.key}>
                    <label htmlFor={'field-' + f.key}>{f.label}</label>
                    <FieldInput
                      f={f}
                      v={p.answers[step.id]?.[f.key]}
                      id={'field-' + f.key}
                      onChange={(v) => edit(f.key, v)}
                    />
                  </div>
                ))}
              </fieldset>
            </ConfigProvider>
            <StepSummary id={step.id} p={p} />
            <div className="editor-controls">
              <Button
                disabled={!index}
                icon={<ArrowLeft />}
                onClick={() => choose(index - 1)}
              >
                Önceki
              </Button>
              <Button
                type="primary"
                onClick={() =>
                  index < items.length - 1 ? choose(index + 1) : review()
                }
              >
                {index < items.length - 1 ? 'Sonraki adım' : 'Kararı incele'}{' '}
                <ArrowRight />
              </Button>
            </div>
            <Button
              type="link"
              icon={<BookOpenText />}
              onClick={() => methods(!showMethods)}
            >
              {showMethods ? 'Yöntemleri kapat' : 'Bu adımla ilgili yöntemler'}
            </Button>
            {showMethods && (
              <Suspense fallback={<p>Yöntemler açılıyor.</p>}>
                <Methods step={step.id} />
              </Suspense>
            )}
          </>
        ) : (
          <>
            <div className="form-heading">
              <h3 id="active-question" tabIndex={-1}>
                Karar kaydı
              </h3>
              <p>
                Öneriyi ve dayanakları inceleyin. Sonucu karar sahibi seçer.
              </p>
            </div>
            <Alert
              type={advice.outcome === 'İlerleyin' ? 'success' : 'warning'}
              showIcon
              title={advice.outcome}
              description={advice.reason}
            />
            <div className="fields">
              <label>
                <span>Karar sonucu</span>
                <Select
                  value={form.outcome}
                  onChange={(outcome) => setForm({ ...form, outcome })}
                  options={outcomes.map((v) => ({ value: v, label: v }))}
                />
              </label>
              {field('reason', 'Kararın gerekçesi')}
              {field('owner', 'Karar sahibi')}
              {field('task', 'Sonraki iş veya sınırlı kapsam')}
              {field('date', 'Kontrol veya bitiş tarihi')}
              {field('proof', 'Kapanış kanıtı')}
              {form.outcome === 'Koşullu ilerleyin' && (
                <label>
                  <span>Eksik kanıt alanı</span>
                  <Select
                    value={form.gapKey}
                    onChange={(gapKey) => setForm({ ...form, gapKey })}
                    options={openGaps(p, stage)}
                  />
                </label>
              )}
              {form.outcome === 'Koşullu ilerleyin' && (
                <label>
                  <span>Harcama sınırı (TL)</span>
                  <InputNumber
                    min={0}
                    value={form.limit}
                    onChange={(n) =>
                      setForm({ ...form, limit: n ?? undefined })
                    }
                  />
                </label>
              )}
            </div>
            {err && <Alert type="error" title={err} showIcon />}
            <Button disabled={readOnly} type="primary" onClick={record}>
              Karar kaydını ekle
            </Button>
          </>
        )}
      </section>
      <Collapse
        items={[
          {
            key: 'rules',
            label: 'Karar koşulları ve örnekler',
            children: (
              <div className="guide-list">
                {guide[stage].rows.map(([when, then]) => (
                  <div key={when}>
                    <b>{when}</b>
                    <p>{then}</p>
                  </div>
                ))}
                {guide[stage].notes.map((n, i) => (
                  <div key={i}>
                    {n.includes('|') ? (
                      n
                        .split('\n')
                        .filter((l) => !l.includes('---'))
                        .map((row, j) => (
                          <p key={j}>
                            {row
                              .split('|')
                              .filter((x) => x.trim())
                              .join(' · ')}
                          </p>
                        ))
                    ) : (
                      <p>{n}</p>
                    )}
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
