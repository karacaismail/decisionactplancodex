import { lazy, Suspense, useState } from 'react'
import { Button, Input, Select } from 'antd'
import { dateLabel, type Plan } from '../domain'
import { foundation, criteria } from '../readiness'
import {
  briefLabels,
  claimKinds,
  editClaim,
  routeLabels,
  routeProof,
  testBasis,
  routes,
  scenarioBudgetFor,
  scenarioVolume,
  setScenarioVolume,
  hasScenarios,
  scenarioSides,
  type Brief,
  type Claim,
  type RouteNotes,
} from '../dossier'
import './foundation.css'

const OpenDecisions = lazy(() => import('./OpenDecisions'))
type Props = {
  actor?: string
  p: Plan
  change: (fn: (p: Plan) => Plan) => void
  disabled: boolean
  step: string
}
type General = keyof typeof briefLabels
const dates: General[] = ['due', 'deadline', 'measureAt']
function Note({
  label,
  value,
  change,
  disabled,
  date = false,
}: {
  label: string
  value?: string
  change: (v: string) => void
  disabled: boolean
  date?: boolean
}) {
  return (
    <label>
      <span>{label}</span>
      <Input
        aria-label={label}
        type={date ? 'date' : 'text'}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => change(e.target.value)}
      />
    </label>
  )
}
export default function BriefEditor({
  p,
  change,
  disabled,
  step,
  actor,
}: Props) {
  const b = foundation(p).brief ?? {},
    paths = routes(p)
  const [selected, select] = useState('current')
  const [opened, setOpened] = useState(false)
  const selectedRoute = paths.find((r) => r.id === selected) ?? paths[0]
  const sources = p.evidence
    .filter((e) => e.step <= '17' && e.observed)
    .map((e) => ({
      value: e.id,
      label: e.title + ' · ' + dateLabel(e.observed!),
    }))
  function edit(fn: (current: Brief) => Brief) {
    if (disabled) return
    change((prev) => {
      const f = foundation(prev)
      return { ...prev, foundation: { ...f, brief: fn(f.brief ?? {}) } }
    })
  }
  const general = (keys: General[]) =>
    keys.map((k) => (
      <Note
        key={k}
        label={briefLabels[k]}
        disabled={disabled}
        value={b[k]}
        date={dates.includes(k)}
        change={(v) => edit((old) => ({ ...old, [k]: v }))}
      />
    ))
  function routeField(k: keyof RouteNotes, v: string) {
    if (!selectedRoute) return
    const id = selectedRoute.id
    edit((old) => ({
      ...old,
      routes: {
        ...old.routes,
        [id]: {
          ...old.routes?.[id],
          [k]: v,
          ...(['result', 'testProof'].includes(k)
            ? { testBasis: testBasis(old) }
            : {}),
        },
      },
    }))
  }
  const routeOptions = paths.map((r) => ({ label: r.name, value: r.id }))
  const updateClaim = (id: string, patch: Partial<Claim>) =>
    edit((old) => ({
      ...old,
      claims: old.claims?.map((c) => (c.id === id ? editClaim(c, patch) : c)),
    }))
  return (
    <details
      className="step-help brief-editor"
      onToggle={(e) => {
        if (e.target === e.currentTarget) setOpened(e.currentTarget.open)
      }}
    >
      <summary>
        {step === '01'
          ? 'Uzun vadeli amaç ve sınırlar'
          : step === '11'
            ? 'Yolları aynı ölçüyle karşılaştır'
            : 'Strateje devir için açık sorular ve dayanaklar'}
      </summary>
      {step === '01' ? (
        <div className="fields">
          {general(['horizon', 'outside', 'limits'])}
        </div>
      ) : (
        <>
          {step === '17' && (
            <>
              {opened && (
                <Suspense fallback={<p>Karar soruları açılıyor.</p>}>
                  <OpenDecisions
                    p={p}
                    disabled={disabled}
                    canPrioritize={
                      !actor ||
                      actor.trim() ===
                        String(p.answers['01']?.owner ?? '').trim()
                    }
                    update={(fn) =>
                      edit((old) => ({
                        ...old,
                        openDecisions: fn(old.openDecisions ?? []),
                      }))
                    }
                  />
                </Suspense>
              )}
              <h4>Stratej hangi kararı verecek?</h4>
              <div className="fields">
                {general([
                  'question',
                  'due',
                  'unknown',
                  'experiment',
                  'assignee',
                  'deadline',
                ])}
              </div>
            </>
          )}
          <h4>Yolların dayanakları</h4>
          <p>
            Her yolu aynı ölçüyle inceleyin. Eksik bilgileri boş
            bırakabilirsiniz.
          </p>
          {p.answers['11']?.risk === 'Yüksek' && (
            <div className="fields">
              {general(['measure', 'measureAt', 'omitted'])}
              <p>İki yol kalırsa her iki denemeyi tarihli kanıta bağlayın.</p>
            </div>
          )}
          {selectedRoute ? (
            <div className="fields">
              <label>
                <span>İncelenen yol</span>
                <Select
                  aria-label="İncelenen yol"
                  value={selectedRoute.id}
                  options={routeOptions}
                  onChange={select}
                />
              </label>
              <p>
                İlk dayanak: {selectedRoute.source || 'Bilinmiyor'}. Kayıtlı
                bedel: {selectedRoute.cost || 'Bilinmiyor'}.
              </p>
              {(
                [
                  [
                    'Müşteri ve tercih',
                    ['customer', 'channel', 'difference', 'payer', 'profit'],
                  ],
                  [
                    'Beceri, bedel ve süre',
                    [
                      'skills',
                      'build',
                      'buy',
                      'partner',
                      'cost',
                      'unitRevenue',
                      'unitCost',
                      'fixedCost',
                      'period',
                      'time',
                      'tradeoff',
                      'reversal',
                    ],
                  ],
                  [
                    'Risk ve yanıt',
                    ['failure', 'reaction', 'warning', 'response', 'reopen'],
                  ],
                  ['Deneme ve kanıt', ['result', 'testProof']],
                ] as const
              ).map(([title, keys]) => (
                <details className="step-help" key={title}>
                  <summary>{title}</summary>
                  <div className="fields">
                    {keys.map((k) =>
                      k === 'testProof' ? (
                        <label key={k}>
                          <span>{routeLabels[k]}</span>
                          <Select
                            aria-label={routeLabels[k]}
                            disabled={disabled}
                            allowClear
                            value={
                              b.routes?.[selectedRoute.id]?.[k] || undefined
                            }
                            options={sources.filter((item) =>
                              routeProof(
                                p.evidence.find((e) => e.id === item.value),
                              ),
                            )}
                            onChange={(v) => routeField(k, v ?? '')}
                          />
                        </label>
                      ) : (
                        <Note
                          key={k}
                          label={routeLabels[k]}
                          disabled={disabled}
                          value={b.routes?.[selectedRoute.id]?.[k]}
                          change={(v) => routeField(k, v)}
                        />
                      ),
                    )}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p>Önce 11. adımda bugünkü yöntemi ve çözüm yollarını yazın.</p>
          )}
          {step === '17' && (
            <>
              <h4>İddia ve kaynak</h4>
              {(b.claims ?? []).map((c, i) => (
                <details key={c.id} className="step-help">
                  <summary>{c.text || 'Yeni iddia ' + (i + 1)}</summary>
                  <div className="fields">
                    <Note
                      label="İddia"
                      value={c.text}
                      change={(v) => updateClaim(c.id, { text: v })}
                      disabled={disabled}
                    />
                    {(
                      [
                        [
                          'kind',
                          'Bilgi türü',
                          claimKinds.map((value) => ({ value, label: value })),
                        ],
                        ['route', 'İlgili yol', routeOptions],
                        [
                          'criterion',
                          'Geçiş için kritik ölçüt',
                          criteria.map(([value, label]) => ({ value, label })),
                        ],
                        [
                          'confidence',
                          'Güven düzeyi',
                          ['Düşük', 'Orta', 'Yüksek'].map((value) => ({
                            value,
                            label: value,
                          })),
                        ],
                        [
                          'support',
                          'Destekleyen kanıt',
                          sources.filter(
                            (o) =>
                              p.evidence.find((e) => e.id === o.value)
                                ?.stance === 'Destek',
                          ),
                        ],
                        [
                          'counter',
                          'Karşı bulgu',
                          sources.filter(
                            (o) =>
                              p.evidence.find((e) => e.id === o.value)
                                ?.stance === 'Karşı bulgu',
                          ),
                        ],
                      ] as const
                    ).map(([k, label, options]) => (
                      <label key={k}>
                        <span>{label}</span>
                        <Select
                          aria-label={label}
                          disabled={disabled}
                          value={c[k] || undefined}
                          allowClear={k !== 'kind'}
                          options={options}
                          onChange={(v) => updateClaim(c.id, { [k]: v ?? '' })}
                        />
                      </label>
                    ))}
                    <Note
                      label="İddianın müşteri grubu"
                      value={c.group}
                      disabled={disabled}
                      change={(group) => updateClaim(c.id, { group })}
                    />
                    <Note
                      label="İddianın deneme dönemi"
                      value={c.period}
                      disabled={disabled}
                      change={(period) => updateClaim(c.id, { period })}
                    />
                    <Note
                      label="Güven gerekçesi"
                      disabled={disabled}
                      value={c.why}
                      change={(v) => updateClaim(c.id, { why: v })}
                    />
                    {c.kind === 'Hesap' && (
                      <Note
                        label="Değerler, dönem ve hesap işlemi"
                        value={c.calculation}
                        disabled={disabled}
                        change={(v) => updateClaim(c.id, { calculation: v })}
                      />
                    )}
                    <Button
                      disabled={disabled}
                      onClick={() =>
                        edit((old) => ({
                          ...old,
                          claims: old.claims?.filter(
                            (item) => item.id !== c.id,
                          ),
                        }))
                      }
                    >
                      Bu iddiayı kaldır
                    </Button>
                  </div>
                </details>
              ))}
              <Button
                disabled={disabled}
                onClick={() =>
                  edit((old) => ({
                    ...old,
                    claims: [
                      ...(old.claims ?? []),
                      {
                        id: crypto.randomUUID(),
                        text: '',
                        kind: 'Bilinmeyen',
                        route: '',
                        criterion: '',
                        confidence: '',
                        why: '',
                        calculation: '',
                        support: '',
                        counter: '',
                      },
                    ],
                  }))
                }
              >
                İddia ekle
              </Button>
              <h4>Koşullar değişirse</h4>
              <p>
                Seçimi değiştirecek iki bağımsız koşul yazarsanız dört olasılığı
                inceleyebilirsiniz.
              </p>
              <div className="fields">{general(['axisA', 'axisB'])}</div>
              {hasScenarios(b) &&
                scenarioSides.map(([key, left, right]) => {
                  const sc = b.scenarios?.[key] ?? {}
                  return (
                    <details className="step-help" key={key}>
                      <summary>
                        {b.axisA} {left}, {b.axisB} {right}
                      </summary>
                      <div className="fields">
                        {(['signal', 'action'] as const).map((k) => (
                          <Note
                            key={k}
                            disabled={disabled}
                            label={
                              k === 'signal' ? 'Erken işaret' : 'Alınacak önlem'
                            }
                            value={sc[k]}
                            change={(v) =>
                              edit((old) => ({
                                ...old,
                                scenarios: {
                                  ...old.scenarios,
                                  [key]: { ...old.scenarios?.[key], [k]: v },
                                },
                              }))
                            }
                          />
                        ))}
                        {paths.map((r) => (
                          <div key={r.id} className="fields">
                            <Note
                              disabled={disabled}
                              label={r.name + ' için sonuç'}
                              value={sc.effects?.[r.id]}
                              change={(v) =>
                                edit((old) => ({
                                  ...old,
                                  scenarios: {
                                    ...old.scenarios,
                                    [key]: {
                                      ...old.scenarios?.[key],
                                      effects: {
                                        ...old.scenarios?.[key]?.effects,
                                        [r.id]: v,
                                      },
                                    },
                                  },
                                }))
                              }
                            />
                            <label>
                              <span>{r.name} için dönemde satış adedi</span>
                              <Input
                                type="number"
                                min="0"
                                disabled={disabled}
                                value={scenarioVolume(p, key, r.id)}
                                onChange={(e) => {
                                  const v = e.target.value
                                  if (
                                    v &&
                                    (!Number.isSafeInteger(Number(v)) ||
                                      Number(v) < 0)
                                  )
                                    return
                                  edit((old) =>
                                    setScenarioVolume(
                                      old,
                                      key,
                                      r.id,
                                      v,
                                      p.answers['00']?.mode !==
                                        'Ücretsiz hizmet',
                                    ),
                                  )
                                }}
                              />
                            </label>
                            <output>
                              Dönem sonucu: {scenarioBudgetFor(p, key, r.id)}
                            </output>
                          </div>
                        ))}
                      </div>
                    </details>
                  )
                })}
            </>
          )}
        </>
      )}
    </details>
  )
}
