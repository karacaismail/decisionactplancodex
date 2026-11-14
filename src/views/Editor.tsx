import { personalOnly, storagePrefix } from '../hosting'
import type { Session } from '../team'
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
  CheckCircle,
  Circle,
  Stamp,
  ArrowRight,
  BookOpenText,
  ListBullets,
  NotePencil,
} from '@phosphor-icons/react'
import { steps, type Value } from '../data/steps'
import {
  activeSteps,
  complete,
  applyEdit,
  currentStage,
  outcomes,
  openGaps,
  recommend,
  recordDecision,
  today,
  visibleFields,
  type Plan,
  confirmStrategyChoice,
  currentStrategyChoice,
  type DecisionInput,
} from '../domain'
import guide from '../data/guide.json'
import stepHelp from '../data/stepHelp.json'
import { access, allows, foundationDoc, scopeFields } from '../readiness'
import { behaviorProof, strengthsComplete } from '../research'
import PreparationTools from './PreparationTools'
import FoundationInputs from './FoundationInputs'
import DecisionDesk from './DecisionDesk'
import FieldInput from './Fields'
import { phases, phaseOf } from '../lifecycle'
import StepSummary from './StepSummary'
import { routes } from '../dossier'
const TeamOwner = personalOnly ? null : lazy(() => import('./TeamOwner'))
const Situation = lazy(() => import('./Situation'))
const BriefEditor = lazy(() => import('./BriefEditor'))
const Takeover = lazy(() => import('./Takeover'))
const Methods = lazy(() => import('./Methods'))
export default function Editor({
  p,
  session,
  change,
  stage,
  setStage,
  readOnly,
  openTransition,
  openEvaluation,
  savedTransition,
  openDossier,
  visitStep,
  actor,
  openProof,
}: {
  visitStep: (id: string) => void
  openDossier: (id?: string) => void
  openTransition: () => void
  openEvaluation: () => void
  openProof: (id: string) => void
  session?: Session
  actor?: string
  savedTransition?: string
  readOnly: boolean
  p: Plan
  change: (f: (p: Plan) => Plan) => void
  stage: number
  setStage: (n: number) => void
}) {
  const [reviewer, setReviewer] = useState('')
  const [selected, setSelected] = useState(() => {
      try {
        return (
          localStorage.getItem(
            storagePrefix + 'atlas-step-' + p.id + '-' + stage,
          ) || ''
        )
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
    items = steps.filter(
      (s) =>
        s.stage === stage &&
        (route.includes(s.id) ||
          (s.id === selected && ['03', '04', '12'].includes(s.id)) ||
          (s.id === '03' && p.answers['00']?.groupLink === 'Evet') ||
          (s.id === '12' &&
            (p.answers['11']?.risk === 'Yüksek' ||
              p.answers['00']?.groupLink === 'Evet'))),
    ),
    step = items.find((x) => x.id === selected) ?? items[0],
    index = items.indexOf(step)
  const missingIndex = items.findIndex((s) => !complete(p, s))
  const grant = access(p),
    persisted = !!grant.last && savedTransition === grant.last.id
  const editable = (key: string) =>
    !readOnly && (step.id < '18' || (persisted && allows(p, step.id, key)))
  const fields = visibleFields(p, step)
  const fieldGroups =
    step.id === '16'
      ? [
          {
            label: 'Ödeme günü',
            fields: fields.filter(
              (f) => f.key === 'balance' || f.key === 'due',
            ),
          },
          {
            label:
              p.answers['00']?.mode === 'Ücretsiz hizmet'
                ? 'Hizmet bütçesi'
                : 'Sipariş hesabı',
            fields: fields.filter(
              (f) => f.key !== 'balance' && f.key !== 'due',
            ),
          },
        ]
      : [{ label: '', fields }]
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
    if (editable(key)) change((prev) => applyEdit(prev, step.id, key, val))
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
      if (
        stage === 4 &&
        form.outcome === 'İlerleyin' &&
        actor &&
        actor !== String(p.answers['01']?.owner || '')
      )
        throw Error('Kaynak kararını kayıtlı karar sahibi verir.')
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
        localStorage.getItem(
          storagePrefix + 'atlas-step-' + p.id + '-' + stage,
        ) || '',
      )
    } catch {}
  }, [stage, p.id])
  function remember(id: string) {
    try {
      localStorage.setItem(
        storagePrefix + 'atlas-step-' + p.id + '-' + stage,
        id,
      )
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
        nextMissing={missingIndex >= 0 ? () => choose(missingIndex) : undefined}
        setStage={(n) => {
          setStage(n)
          setSelected('')
          setMode('step')
          setNotice('')
          error('')
        }}
        indexPanel={
          <nav className="case-index" aria-label="Kararın adımları">
            <div className="case-index-head">
              <ListBullets size={19} />
              <h3>Adım dizini</h3>
            </div>
            <p>
              {items.filter((s) => complete(p, s)).length} / {items.length} adım
              tamamlandı
            </p>
            <div>
              {phases.map((phase) => {
                const group = phase.title
                const inGroup = (id: string) => phaseOf(id).id === phase.id
                if (!items.some((s) => inGroup(s.id))) return null
                return (
                  <div key={group}>
                    <h4>{group}</h4>
                    <ol>
                      {items.map(
                        (s, i) =>
                          inGroup(s.id) && (
                            <li key={s.id}>
                              <button
                                aria-label={
                                  s.id +
                                  '. ' +
                                  s.title +
                                  (complete(p, s) ? ', tamamlandı' : '')
                                }
                                aria-current={
                                  mode === 'step' && s.id === step.id
                                    ? 'step'
                                    : undefined
                                }
                                onClick={() => choose(i)}
                              >
                                <span>{s.id}</span>
                                <b>{s.title}</b>
                                {complete(p, s) ? (
                                  <CheckCircle size={16} />
                                ) : (
                                  <Circle size={13} />
                                )}
                              </button>
                            </li>
                          ),
                      )}
                    </ol>
                  </div>
                )
              })}
            </div>
            <button
              className="index-decision"
              aria-pressed={mode === 'decision'}
              onClick={review}
            >
              <Stamp size={18} />
              Karar kaydı
            </button>
          </nav>
        }
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
      >
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
                    storagePrefix + 'atlas-step-' + p.id + '-' + dest.stage,
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
        <section className="panel editor-panel">
          <div className="step-selector">
            <label htmlFor="file-step">
              <ListBullets size={20} /> Plan adımı
            </label>
            <Select
              id="file-step"
              value={mode === 'step' ? step.id : 'decision'}
              onChange={(v) => {
                if (v === 'decision') review()
                else choose(items.findIndex((s) => s.id === v))
              }}
              options={[
                ...items.map((s) => ({
                  value: s.id,
                  label: s.id + '. ' + s.title,
                })),
                { value: 'decision', label: 'Kararı kaydet' },
              ]}
            />
          </div>
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
          {notice && <Alert title={notice} type="success" showIcon />}
          {mode === 'step' ? (
            <>
              <div className="form-heading">
                <div className="eyeline">
                  <NotePencil size={17} /> {phaseOf(step.id).title} · Adım{' '}
                  {step.id}
                </div>
                <h3 id="active-question" tabIndex={-1}>
                  {step.title}
                </h3>
                <p>{step.help}</p>
              </div>
              {step.id === '00' &&
                p.answers['00']?.start === 'Devralınan iş' && (
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
              {step.id >= '18' && (
                <div className="step-help">
                  <p>
                    {step.id === '34' &&
                    editable('obligations') &&
                    !grant.active
                      ? 'Karar sahibi işi kapattı. Açık sözleri kaydedebilirsiniz.'
                      : grant.active && persisted
                        ? grant.last?.outcome === 'Koşullu hazır'
                          ? 'Yalnız seçilen alan açık: ' +
                            scopeFields.find(
                              ([key]) => key === grant.last?.field,
                            )?.[1]
                          : step.id > '20' && !allows(p, step.id, '')
                            ? 'Uygulama için strateji dosyasını tamamlayın ve kaynak kararını kaydedin.'
                            : 'Geçiş kararı kaydedildi.'
                        : grant.reason}
                  </p>
                  <Button onClick={openTransition}>
                    Geçiş kararını incele
                  </Button>
                </div>
              )}
              {step.id === '18' && (
                <details className="step-help">
                  <summary>Planlamanın dayanakları</summary>
                  <p style={{ whiteSpace: 'pre-line' }}>
                    {grant.last?.document ?? foundationDoc(p)}
                  </p>
                </details>
              )}
              {['17', '18', '19', '20'].includes(step.id) && (
                <div className="step-help">
                  <Button
                    onClick={() =>
                      openDossier(step.id === '17' ? undefined : grant.last?.id)
                    }
                  >
                    Strateje devir raporunu aç
                  </Button>
                  {step.id > '18' && p.answers['18']?.choice && (
                    <p>Önerilen yol: {String(p.answers['18'].choice)}</p>
                  )}
                </div>
              )}
              {step.id === '18' && (
                <Suspense fallback={<p>Durum özeti açılıyor.</p>}>
                  <Situation
                    p={p}
                    visit={(id) => {
                      const i = items.findIndex((s) => s.id === id)
                      if (i >= 0) choose(i)
                      else visitStep(id)
                    }}
                  />
                </Suspense>
              )}
              {step.id === '18' && editable('choice') && (
                <div className="fields">
                  <label>
                    <span>Hazırlıkta incelenen yolu kullan</span>
                    <Select
                      aria-label="Hazırlıkta incelenen yolu kullan"
                      placeholder="Aday yolları inceleyin"
                      value={undefined}
                      options={routes(p).map((r) => ({
                        value: r.id,
                        label: r.name,
                      }))}
                      onChange={(v) => {
                        const r = routes(p).find((item) => item.id === v)
                        if (r) edit('choice', r.name)
                      }}
                    />
                  </label>
                  <p>
                    Bir aday seçebilir veya yeni bir yol önerebilirsiniz. Son
                    kararı {String(p.answers['01']?.owner || 'karar sahibi')}{' '}
                    verir.
                  </p>
                </div>
              )}
              {step.id === '18' && (
                <details className="step-help">
                  <summary>Yolun hangi sorudan çıktığını kaydedin</summary>
                  <div className="fields">
                    {fields
                      .filter(
                        (f) =>
                          f.key.startsWith('cross') || f.key === 'chosenOrigin',
                      )
                      .map((f) => (
                        <label key={f.key}>
                          <span>{f.label}</span>
                          <ConfigProvider componentDisabled={!editable(f.key)}>
                            <FieldInput
                              id={'field-' + f.key}
                              f={f}
                              v={p.answers['18']?.[f.key]}
                              onChange={(v) => edit(f.key, v)}
                            />
                          </ConfigProvider>
                        </label>
                      ))}
                  </div>
                </details>
              )}
              {step.id === '19' &&
                grant.last?.dossier &&
                allows(p, '19', 'goals') &&
                Array.isArray(p.answers['19']?.goals) &&
                p.answers['19']?.choiceBasis !== p.answers['18']?.choice && (
                  <div className="step-help">
                    <p>Seçilen yol değişti. Önceki işleri yeniden inceleyin.</p>
                    <Button
                      disabled={!editable('goals')}
                      onClick={() =>
                        change((prev) =>
                          applyEdit(
                            prev,
                            '19',
                            'choiceBasis',
                            String(prev.answers['18']?.choice || ''),
                          ),
                        )
                      }
                    >
                      İşleri bu yol için inceledim
                    </Button>
                  </div>
                )}
              {grant.last?.dossier &&
                grant.active &&
                grant.last.outcome === 'Planlamaya hazır' &&
                ((step.id === '19' && !allows(p, '19', 'goals')) ||
                  (step.id === '20' && !allows(p, '20', 'ready'))) && (
                  <p role="status">
                    {step.id === '19'
                      ? 'Önce karar sahibi 18. adımda stratejik seçimi kaydetmelidir.'
                      : 'Önce 18. adımı ve iş sırasını tamamlayın.'}
                  </p>
                )}
              <ConfigProvider componentDisabled={readOnly}>
                {fieldGroups.map((group) => (
                  <fieldset
                    key={group.label}
                    disabled={readOnly}
                    className={
                      'fields read-fields' + (group.label ? ' money-group' : '')
                    }
                  >
                    {group.label && <legend>{group.label}</legend>}
                    {group.fields
                      .filter(
                        (f) =>
                          step.id !== '18' ||
                          (!f.key.startsWith('cross') &&
                            f.key !== 'chosenOrigin'),
                      )
                      .map((f) => (
                        <div className="field" data-kind={f.kind} key={f.key}>
                          <label htmlFor={'field-' + f.key}>{f.label}</label>
                          <ConfigProvider componentDisabled={!editable(f.key)}>
                            {TeamOwner &&
                            session &&
                            step.id === '01' &&
                            f.key === 'owner' ? (
                              <Suspense fallback={<p>Üyeler açılıyor.</p>}>
                                <TeamOwner
                                  session={session}
                                  p={p}
                                  readOnly={readOnly}
                                  select={(v) => edit('owner', v)}
                                />
                              </Suspense>
                            ) : f.key === 'gapProof' ? (
                              <>
                                <Select
                                  id="field-gapProof"
                                  aria-label={f.label}
                                  allowClear
                                  value={p.answers['09']?.gapProof || undefined}
                                  options={p.evidence
                                    .filter((e) => !!behaviorProof(p, e.id))
                                    .map((e) => ({
                                      value: e.id,
                                      label: e.title,
                                    }))}
                                  onChange={(v) => edit(f.key, v || '')}
                                />
                                <p>
                                  Kanıtta müşteri grubu ve dönem yazmalı. İkisi
                                  de bu ihtiyaçla eşleşmeli.
                                </p>
                                {p.evidence.some(
                                  (e) => e.id === p.answers['09']?.gapProof,
                                ) && (
                                  <Button
                                    type="link"
                                    onClick={() =>
                                      openProof(
                                        String(p.answers['09'].gapProof),
                                      )
                                    }
                                  >
                                    Seçilen kanıtı incele
                                  </Button>
                                )}
                              </>
                            ) : (
                              <FieldInput
                                f={f}
                                v={
                                  step.id === '18' &&
                                  f.key === 'question' &&
                                  grant.last?.outcome === 'Koşullu hazır'
                                    ? grant.last.question
                                    : p.answers[step.id]?.[f.key]
                                }
                                id={'field-' + f.key}
                                onChange={(v) => edit(f.key, v)}
                              />
                            )}
                          </ConfigProvider>
                        </div>
                      ))}
                  </fieldset>
                ))}
              </ConfigProvider>
              {['01', '11', '17'].includes(step.id) && (
                <Suspense fallback={<p>Devir alanları açılıyor.</p>}>
                  <BriefEditor
                    actor={actor}
                    key={step.id}
                    step={step.id}
                    p={p}
                    change={change}
                    disabled={readOnly}
                  />
                </Suspense>
              )}
              <FoundationInputs
                actor={actor}
                id={step.id}
                p={p}
                change={change}
                disabled={readOnly}
              />
              {step.id === '12' &&
                p.answers['11']?.risk === 'Yüksek' &&
                !strengthsComplete(p) && (
                  <p>
                    Bu adımı tamamlamak için her gücün dört sorusunu cevaplayın.
                    Nadir bir güç için tarihli dayanak seçin.
                  </p>
                )}
              <PreparationTools
                openProof={openProof}
                actor={actor}
                key={p.id + step.id}
                p={p}
                step={step.id}
                change={change}
                disabled={readOnly}
              />
              {step.id === '19' && (
                <p>Tarih bilinmiyorsa işi başlatacak olayı yazın.</p>
              )}
              {step.id === '22' && (
                <p>Başlangıç değeri bilinmiyorsa ilk ölçüm yolunu yazın.</p>
              )}
              {step.id === '18' && (
                <div className="step-help">
                  <p>
                    {currentStrategyChoice(p) && grant.active
                      ? 'Karar sahibi bu yolu seçti.'
                      : 'Karar sahibi seçimini kaydedince eylem planı açılır.'}
                  </p>
                  <Button
                    disabled={
                      !editable('choice') ||
                      !allows(p, '18', 'rationale') ||
                      (!!actor && actor !== p.answers['01']?.owner) ||
                      !!currentStrategyChoice(p)
                    }
                    onClick={() => {
                      try {
                        change((plan) =>
                          confirmStrategyChoice(
                            plan,
                            actor ?? String(plan.answers['01']?.owner ?? ''),
                          ),
                        )
                        error('')
                      } catch (e) {
                        error((e as Error).message)
                      }
                    }}
                  >
                    Stratejik seçimi kaydet
                  </Button>
                </div>
              )}
              {['25', '26', '33'].includes(step.id) && (
                <Button onClick={openEvaluation}>
                  Sonucu ve sonraki kararı incele
                </Button>
              )}
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
                    step.id === '17'
                      ? openTransition()
                      : index < items.length - 1
                        ? choose(index + 1)
                        : review()
                  }
                >
                  {step.id === '17'
                    ? 'Geçişi incele'
                    : index < items.length - 1
                      ? 'Sonraki adım'
                      : 'Kararı incele'}{' '}
                  <ArrowRight />
                </Button>
              </div>
              <Button
                type="link"
                icon={<BookOpenText />}
                onClick={() => methods(!showMethods)}
              >
                {showMethods
                  ? 'Yöntemleri kapat'
                  : 'Bu adımla ilgili yöntemler'}
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
      </DecisionDesk>
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
