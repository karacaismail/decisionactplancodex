import { lazy, Suspense } from 'react'
import {
  researchOptions,
  isResearchPick,
  selectedIds,
  ownerField,
  budgetPermits,
  ledgerTotals,
  budgetIdentityLocked,
} from '../research'
import { useState, useRef } from 'react'
import { Button, Input, InputNumber, Select } from 'antd'
import { applyEdit, dateLabel, today, type Plan } from '../domain'
import { foundation } from '../readiness'
import {
  sourceLink,
  hasScenarios,
  routes,
  scenarioSides,
  setScenarioVolume,
} from '../dossier'
import {
  methods,
  applicableFields,
  scopeName,
  studyResult,
  payBudgetItem,
  setStudyValue,
  type Study,
  type CriterionRow,
} from '../preparationMethods'
const Pledges = lazy(() => import('./Pledges'))
type Props = {
  p: Plan
  method: (typeof methods)[number]
  change: (fn: (p: Plan) => Plan) => void
  openProof: (id: string) => void
  actor?: string
  disabled: boolean
}
const criterionFields = [
  ['label', 'Ölçünün adı'],
  ['weight', 'Önem ağırlığı'],
  ['leftScore', 'Birinci yolun puanı'],
  ['rightScore', 'İkinci yolun puanı'],
] as const
export default function StudyForm({
  p,
  method,
  change,
  disabled,
  actor,
  openProof,
}: Props) {
  const brief = foundation(p).brief
  const studies = brief?.studies ?? []
  const entries = studies.filter((s) => s.method === method.id)
  const [current, select] = useState(
    () => entries[0]?.id ?? crypto.randomUUID(),
  )
  const study: Study = entries.find((s) => s.id === current) ?? {
    id: current,
    method: method.id,
    values: {} as Record<string, string>,
  }
  const paths = routes(p)
  const free = p.answers['00']?.mode === 'Ücretsiz hizmet'
  const fields = applicableFields(study, free)
  const calculated = studyResult(p, study)
  const firstField = useRef<HTMLLabelElement>(null)
  const focusFirst = () =>
    requestAnimationFrame(() =>
      firstField.current?.querySelector('input')?.focus(),
    )
  const otherEditor =
    !!actor && actor.trim() !== String(p.answers['01']?.owner || '').trim()
  const ownerResponse =
    (method.id === 'dissent' &&
      !!(study.values.response || study.values.revision)) ||
    (method.id === 'factor' && !!study.values.interpretation)
  const ownerLocked = otherEditor && ownerResponse
  const paidHistory = study.pledges?.some((row) => row.paidOn)
  const [confirm, confirmRemove] = useState(false)
  function update(fn: (s: Study) => Study, syncVolume = false) {
    if (disabled || ownerLocked) return
    change((prev) => {
      const f = foundation(prev),
        b = f.brief ?? {},
        all = b.studies ?? []
      const old = all.find((s) => s.id === current)
      const next = fn(old ?? { id: current, method: method.id, values: {} })
      const edited = {
        ...b,
        studies: old
          ? all.map((s) => (s.id === current ? next : s))
          : [...all, next],
      }
      const values = next.values
      const synchronized =
        syncVolume && values.route && values.quadrant
          ? setScenarioVolume(
              edited,
              values.quadrant,
              values.route,
              values.volume ?? '',
            )
          : edited
      return { ...prev, foundation: { ...f, brief: synchronized } }
    })
  }
  function field(key: string, value: string) {
    if (otherEditor && ownerField(method.id, key)) return
    update(
      (s) => setStudyValue(s, key, value),
      method.id === 'sensitivity' && key === 'volume',
    )
  }
  function choose(id: string) {
    confirmRemove(false)
    select(id)
    focusFirst()
  }
  function remove() {
    if (disabled || ownerLocked || paidHistory || !confirm) return
    change((prev) => {
      const f = foundation(prev),
        b = f.brief ?? {}
      return {
        ...prev,
        foundation: {
          ...f,
          brief: {
            ...b,
            studies: (b.studies ?? []).filter((s) => s.id !== current),
          },
        },
      }
    })
    choose(entries.find((s) => s.id !== current)?.id ?? crypto.randomUUID())
  }
  const proofs = p.evidence
    .filter(
      (e) =>
        e.step <= '17' &&
        e.source?.trim() &&
        e.observed &&
        e.observed <= today(),
    )
    .map((e) => ({
      value: e.id,
      label: e.title + ' (' + dateLabel(e.observed!) + ')',
    }))
  const quadrants = hasScenarios(brief ?? {})
    ? scenarioSides.map(([key, a, b]) => ({
        value: key,
        label: brief!.axisA + ' ' + a + ', ' + brief!.axisB + ' ' + b,
      }))
    : []
  function patchCriterion(id: string, key: keyof CriterionRow, value: string) {
    update((s) => ({
      ...s,
      criteria: s.criteria?.map((c) =>
        c.id === id ? { ...c, [key]: value } : c,
      ),
    }))
  }
  return (
    <div className="fields method-form">
      <p className="muted">{method.book}</p>
      {['factor', 'dissent'].includes(method.id) && (
        <p>
          {actor
            ? 'Karar sahibinin görüşünü yalnız kayıtlı karar sahibi yazabilir.'
            : 'Karar sahibinin görüşü kişisel planda beyan olarak saklanır.'}
        </p>
      )}
      {method.id === 'budget' &&
        study.values.budgetScope === '02. adımdaki bütçe' && (
          <p>
            Hesap 02. adımdaki TL bütçesini ve bütün araştırma süresini
            kullanır.
          </p>
        )}
      {method.id === 'budget' && budgetIdentityLocked(study, 'budgetScope') && (
        <p>
          Bu hesaba tutar yazıldı. Başka dönem veya para birimi için yeni hesap
          açın.
        </p>
      )}
      {entries.length > 0 && (
        <div className="method-actions">
          <label>
            <span>Yöntem kaydı</span>
            <Select
              aria-label="Yöntem kaydı"
              value={current}
              onChange={choose}
              options={[
                ...entries.map((s, i) => ({
                  value: s.id,
                  label:
                    i +
                    1 +
                    '. kayıt' +
                    (s.values[fields[0][0]]
                      ? ' · ' +
                        (fields[0][2] === 'route'
                          ? scopeName(p, s.values[fields[0][0]])
                          : s.values[fields[0][0]])
                      : ''),
                })),
                ...(!entries.some((s) => s.id === current)
                  ? [{ value: current, label: 'Yeni kayıt' }]
                  : []),
              ]}
            />
          </label>
          {entries.some((s) => s.id === current) && (
            <Button
              disabled={disabled}
              onClick={() => choose(crypto.randomUUID())}
            >
              Yeni kayıt aç
            </Button>
          )}
        </div>
      )}
      {fields.map(([key, label, kind]) => {
        const fieldDisabled =
          disabled ||
          ownerLocked ||
          (method.id === 'budget' && budgetIdentityLocked(study, key)) ||
          (otherEditor && ownerField(method.id, key))
        const v =
          study.values[key] ||
          (key === 'volume' && study.values.quadrant
            ? brief?.scenarios?.[study.values.quadrant]?.units?.[
                study.values.route
              ]
            : '') ||
          ''
        if (
          kind === 'quadrant' &&
          (!study.values.route || !quadrants.length) &&
          !v
        )
          return null
        const pick =
          isResearchPick(kind) ||
          kind === 'route' ||
          kind === 'proof' ||
          kind === 'quadrant'
        let options = isResearchPick(kind)
          ? researchOptions(p, key, kind)
          : kind === 'route'
            ? paths.map((r) => ({ value: r.id, label: r.name }))
            : kind === 'proof'
              ? proofs
              : quadrants
        if (
          key === 'budgetScope' &&
          entries.some(
            (other) =>
              other.id !== study.id &&
              other.values.budgetScope === '02. adımdaki bütçe',
          ) &&
          v !== '02. adımdaki bütçe'
        )
          options = options.filter((o) => o.value !== '02. adımdaki bütçe')
        if (kind === 'quadrant')
          options = options.map((o) => ({
            ...o,
            disabled: studies.some(
              (s) =>
                s.id !== current &&
                s.method === 'sensitivity' &&
                s.values.quadrant === o.value &&
                s.values.route === study.values.route,
            ),
          }))
        if (kind === 'routes')
          for (const id of selectedIds(v))
            if (!options.some((o) => o.value === id))
              options.push({ value: id, label: 'Yol kaldırıldı' })
        if (
          v &&
          pick &&
          kind !== 'routes' &&
          !options.some((o) => o.value === v)
        )
          options = [
            ...options,
            {
              value: v,
              label:
                kind === 'route'
                  ? 'Yol kaldırıldı'
                  : kind === 'proof'
                    ? 'Bağlı kanıt kaldırıldı'
                    : kind === 'quadrant'
                      ? 'Koşul artık tanımlı değil'
                      : 'Bağlı kayıt değişti veya kaldırıldı',
            },
          ]
        return (
          <label key={key} ref={key === fields[0][0] ? firstField : undefined}>
            <span>{label}</span>
            {pick ? (
              <Select
                aria-label={label}
                allowClear
                virtual={false}
                disabled={fieldDisabled}
                options={options}
                mode={kind === 'routes' ? 'multiple' : undefined}
                value={kind === 'routes' ? selectedIds(v) : v || undefined}
                placeholder={
                  kind === 'route' && method.id === 'sensitivity'
                    ? 'Planın genel hesabı'
                    : 'Seçin'
                }
                notFoundContent={
                  kind === 'proof'
                    ? 'Önce tarihli bir kanıt ekleyin.'
                    : kind === 'route'
                      ? 'Önce 11. adımda bir yol yazın.'
                      : 'Koşul bulunamadı.'
                }
                onChange={(value) =>
                  field(
                    key,
                    Array.isArray(value)
                      ? JSON.stringify(value)
                      : (value ?? ''),
                  )
                }
              />
            ) : kind === 'count' || kind === 'amount' ? (
              <InputNumber
                aria-label={label}
                disabled={fieldDisabled}
                min={0}
                max={Number.MAX_SAFE_INTEGER}
                precision={kind === 'count' ? 0 : 2}
                controls={false}
                value={v ? Number(v.replace(',', '.')) : null}
                onChange={(n) => field(key, n === null ? '' : String(n))}
              />
            ) : method.id === 'budget' &&
              ['currency', 'period', 'name'].includes(key) &&
              (study.pledges?.some((r) => r.amount.trim()) ||
                study.values.unpaid?.trim()) ? (
              <Input
                key={study.id + key + v}
                aria-label={label}
                disabled={fieldDisabled}
                defaultValue={v}
                onBlur={(e) => {
                  if (e.target.value !== v) field(key, e.target.value.trim())
                }}
              />
            ) : (
              <Input
                aria-label={label}
                disabled={fieldDisabled}
                type={kind === 'date' ? 'date' : 'text'}
                value={v}
                onChange={(e) => field(key, e.target.value)}
              />
            )}
          </label>
        )
      })}
      {method.id === 'budget' && (
        <Suspense fallback={<p>Ödeme listesi açılıyor.</p>}>
          <Pledges
            disabled={disabled}
            proofs={proofs}
            rows={study.pledges ?? []}
            permits={budgetPermits(p).map((h) => ({
              value: h.id,
              label: (h.task || h.reason) + ' (' + h.limit + ' TL)',
              disabled:
                h.stale ||
                !h.date ||
                h.date < today() ||
                !(
                  study.values.budgetScope === '02. adımdaki bütçe' ||
                  study.values.currency?.trim().toUpperCase() === 'TL'
                ),
            }))}
            canPay={
              !!study.values.budgetScope &&
              (study.values.budgetScope === '02. adımdaki bütçe'
                ? p.answers['02']?.spent != null
                : !!study.values.spent?.trim() &&
                  !!study.values.name?.trim() &&
                  !!study.values.period?.trim() &&
                  !!study.values.currency?.trim()) &&
              !ledgerTotals(p, study).issue
            }
            pay={(id) => {
              if (!disabled) change((prev) => payBudgetItem(prev, study.id, id))
            }}
            update={(fn) =>
              update((s) => {
                const values = { ...s.values }
                const pledges = fn(s.pledges ?? [])
                const firstDebt = pledges.find((r) => r.kind !== 'reserve')
                if (
                  !s.pledges?.some((r) => r.kind !== 'reserve') &&
                  firstDebt &&
                  values.unpaid
                ) {
                  Object.assign(firstDebt, {
                    name: values.obligations || 'Önceki açık ödeme toplamı',
                    amount: values.unpaid,
                    owner: values.owner || '',
                    due: values.due || '',
                    proof: values.proof || '',
                  })
                }
                if (firstDebt || s.pledges?.some((r) => r.kind !== 'reserve'))
                  delete values.unpaid
                return { ...s, values, pledges }
              })
            }
          />
        </Suspense>
      )}
      {method.id === 'alternative' && (
        <Button
          disabled={
            disabled ||
            !study.values.name?.trim() ||
            paths.some(
              (r) =>
                r.name.trim().toLocaleLowerCase('tr') ===
                study.values.name.trim().toLocaleLowerCase('tr'),
            )
          }
          onClick={() =>
            change((prev) => {
              const v = study.values,
                old = prev.answers['11']?.options
              if (
                routes(prev).some(
                  (r) =>
                    r.name.trim().toLocaleLowerCase('tr') ===
                    v.name.trim().toLocaleLowerCase('tr'),
                )
              )
                return prev
              return applyEdit(prev, '11', 'options', [
                ...(Array.isArray(old)
                  ? (old as Record<string, string>[])
                  : []),
                {
                  _id: crypto.randomUUID(),
                  Çözüm: v.name.trim(),
                  Bedel: v.cost || '',
                  Dayanak: v.basis || '',
                },
              ])
            })
          }
        >
          11. adımdaki adaylara ekle
        </Button>
      )}
      {method.id === 'compare' && (
        <section className="fields">
          <h4>Hangi ölçü daha önemli?</h4>
          <p>
            Önemi 1 ile 100 arasında yazın. Her yola 1 ile 5 arasında puan
            verin.
          </p>
          {(study.criteria ?? []).map((c, i) => (
            <fieldset className="fields" key={c.id}>
              <legend>{i + 1}. ölçü</legend>
              {criterionFields.map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  {key === 'label' ? (
                    <Input
                      value={c.label}
                      disabled={disabled}
                      onChange={(e) =>
                        patchCriterion(c.id, key, e.target.value)
                      }
                    />
                  ) : (
                    <InputNumber
                      min={1}
                      max={key === 'weight' ? 100 : 5}
                      precision={0}
                      controls={false}
                      value={c[key] ? Number(c[key]) : null}
                      disabled={disabled}
                      onChange={(n) =>
                        patchCriterion(c.id, key, n == null ? '' : String(n))
                      }
                    />
                  )}
                </label>
              ))}
              <Button
                disabled={disabled}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    criteria: s.criteria?.filter((item) => item.id !== c.id),
                  }))
                }
              >
                Bu ölçüyü kaldır
              </Button>
            </fieldset>
          ))}
          <Button
            disabled={disabled}
            onClick={() =>
              update((s) => ({
                ...s,
                criteria: [
                  ...(s.criteria ?? []),
                  {
                    id: crypto.randomUUID(),
                    label: '',
                    weight: '',
                    leftScore: '',
                    rightScore: '',
                  },
                ],
              }))
            }
          >
            Ölçü ekle
          </Button>
        </section>
      )}
      {calculated.length > 0 && (
        <section className="method-result" aria-label="Hesap sonucu">
          <h4>
            {[
              'strength',
              'factor',
              'fit',
              'experiment',
              'barrier',
              'cross',
              'inherited',
              'dependency',
              'group',
              'dissent',
            ].includes(method.id)
              ? 'İnceleme sonucu'
              : 'Hesap sonucu'}
          </h4>
          {calculated.map((line, i) => {
            const proof = sourceLink(p, line)
            return (
              <p key={i}>
                {proof?.text ?? line}
                {proof && (
                  <Button type="link" onClick={() => openProof(proof.id)}>
                    Kanıt kaydını aç
                  </Button>
                )}
              </p>
            )
          })}
        </section>
      )}
      {entries.some((s) => s.id === current) && (
        <div className="method-actions">
          {confirm ? (
            <>
              <p>Bu yöntem kaydını kaldırmak istiyor musunuz?</p>
              <Button
                disabled={disabled || ownerLocked || paidHistory}
                onClick={remove}
              >
                Kaydı kaldır
              </Button>
              <Button onClick={() => confirmRemove(false)}>Vazgeç</Button>
            </>
          ) : (
            <Button
              disabled={disabled || ownerLocked}
              type="text"
              hidden={!!paidHistory}
              onClick={() => confirmRemove(true)}
            >
              Bu kaydı kaldır
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
