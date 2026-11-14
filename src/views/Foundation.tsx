import { proofIssue } from '../proofReview'
import { useState } from 'react'
import { Alert, Button, Checkbox, Collapse, Input, Select, Tabs } from 'antd'
import {
  access,
  decide,
  evaluate,
  foundation,
  levels,
  results,
  scopeFields,
  pendingCommitments,
  type Criterion,
  type DecisionForm,
} from '../readiness'
import {
  activeSteps,
  complete,
  currentStrategyChoice,
  dateLabel,
  today,
  type Plan,
} from '../domain'
import { steps } from '../data/steps'
import Assumptions from './Assumptions'
import './foundation.css'

const stones = [
  ['Kurucu niyeti', '01', 'Z1'],
  ['Kaynak sınırı', '02', 'Z1'],
  ['Durma kuralları', '02', 'Z1'],
  ['Karar hakkı', '03', 'Z1'],
  ['Dış koşullar ve izin', '04', 'Z9'],
  ['Sorunun tanımı', '05', 'Z2'],
  ['Ölçülen kayıp', '07', 'Z2'],
  ['İlk müşteri grubu', '08', 'Z3'],
  ['Ulaşılabilir pazar', '09', 'Z4'],
  ['Rakip ve bugünkü yöntem', '09', 'D2'],
  ['Çözüm seçenekleri', '11', 'Z5'],
  ['Yapılabilirlik', '12', 'Z4'],
  ['Teklif', '13', 'Z6'],
  ['Müşterinin somut adımı', '15', 'Z6'],
  ['Fiyat kanıtı', '15', 'D1'],
  ['İlk para hesabı', '16', 'Z7'],
  ['Nakit durumu', '16', 'Z7'],
  ['Açık varsayım', '10', 'Z8'],
  ['Risk ve durma koşulu', '17', 'Z8'],
  ['Kanıt ve karar kaydı', '17', 'Z9'],
] as const
type Props = {
  p: Plan
  change: (fn: (p: Plan) => Plan) => void
  readOnly: boolean
  actor?: string
  saved: boolean
  visit: (id: string) => void
  proof: (id: Criterion) => void
  example: () => void
  openDossier: (id?: string) => void
  reports: (id?: string) => void
}
export default function Foundation({
  p,
  change,
  readOnly,
  actor,
  saved,
  visit,
  proof,
  example,
  reports,
  openDossier,
}: Props) {
  const r = evaluate(p),
    permission = access(p),
    data = foundation(p),
    owner = String(p.answers['01']?.owner ?? '')
  const [material, setMaterial] = useState<Criterion[]>([]),
    [supportReason, setSupportReason] = useState('')
  const missingSupports = r.rows.filter(
    (row) => row.id.startsWith('D') && !row.ok,
  )
  const affected = material.filter((id) =>
    missingSupports.some((row) => row.id === id),
  )
  const [selected, select] = useState(''),
    [reason, setReason] = useState(''),
    [checked, check] = useState(false),
    [err, error] = useState(''),
    [filter, setFilter] = useState('Tümü')
  const [form, setForm] = useState({
    field: '18.choice',
    question: '',
    assignee: '',
    due: '',
    proof: '',
  })
  const result =
    results.find(
      (x) => x === selected && results.indexOf(x) <= results.indexOf(r.outcome),
    ) ?? r.outcome
  const canSign = !readOnly && (!actor || actor === owner)
  const [tab, setTab] = useState('decision')
  const decisionDisabled = !canSign || !saved
  const update = (key: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }))
  function record() {
    try {
      if (decisionDisabled)
        throw Error(
          'Kararı kaydetmek için yetkili hesabı ve güncel kaydı bekleyin.',
        )
      const input: DecisionForm = {
        ...form,
        materialSupports: affected,
        supportReason: affected.length ? supportReason : undefined,
        owner,
        reason,
        reviewed: checked,
        outcome: result,
      }
      change((prev) => decide(prev, input))
      error('')
      check(false)
      setReason('')
    } catch (e) {
      error((e as Error).message)
    }
  }
  const counts =
    r.required +
    ' / 9 zorunlu ölçüt. ' +
    r.support +
    ' / 6 destekleyici ölçüt. Tam geçiş için en az dört destek gerekir.'
  const rows = (mandatory: boolean) =>
    r.rows
      .filter((x) => x.id.startsWith(mandatory ? 'Z' : 'D'))
      .map((x) => ({
        key: x.id,
        label: (
          <span>
            {x.title}{' '}
            <b>{x.against ? 'Karşı bulgu var' : x.ok ? 'Tamam' : 'Eksik'}</b>
          </span>
        ),
        children: (
          <>
            <p>{x.hint}</p>
            {x.evidence.map((e) => (
              <p key={e.id}>
                <strong>{e.title}</strong>
                <br />
                {e.source} · {dateLabel(e.observed!)} · {e.stance}
                {proofIssue(p, e) && <strong> {proofIssue(p, e)}</strong>}
              </p>
            ))}
            <div className="foundation-actions">
              <Button onClick={() => visit(x.step)}>İlgili adımı aç</Button>
              {x.id === 'Z4' && (
                <Button onClick={() => visit('16')}>
                  Gider dönemini incele
                </Button>
              )}
              <Button onClick={() => proof(x.id)}>Kanıtları aç</Button>
            </div>
          </>
        ),
      }))
  function displayCriterion(item: ReturnType<typeof rows>[number]) {
    return (
      <>
        <span id={'proof-' + item.key}>{item.label}</span>
        <details>
          <summary>Dayanağı incele</summary>
          {item.children}
        </details>
      </>
    )
  }
  const wide = window.matchMedia(
    '(min-width:64rem) and (min-height:35rem)',
  ).matches
  function list(required: boolean) {
    const entries = rows(required)
    if (!wide) return <Collapse items={entries} />
    return (
      <table className="foundation-table">
        <caption>
          {required
            ? 'Zorunlu ölçütlerin dayanakları'
            : 'Destekleyici ölçütlerin dayanakları'}
        </caption>
        <tbody>
          {entries.map((item) => (
            <tr key={item.key}>
              <th scope="row">{item.key}</th>
              <td>{displayCriterion(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
  const firstGap = r.rows.find((x) => !x.ok)
  return (
    <section className="foundation-page">
      <div className="panel">
        <p>Hazırlık · 00 ile 17 arasındaki adımlar</p>
        <h2>{r.outcome}</h2>
        <p>Yazılımın bugünkü önerisi</p>
        <p>{counts}</p>
        <p>
          Doğrulama düzeyi {r.level} / 5. {levels[r.level]}.
        </p>
        {permission.last && (
          <strong>
            {saved ? 'Kayıtlı karar' : 'Kaydedilmesi beklenen karar'}:{' '}
            {permission.last.outcome}
          </strong>
        )}
        <p role="status">{permission.reason}</p>
        {permission.last?.outcome === results[1] && (
          <p>
            {permission.active ? 'Açık konu' : 'Önceki konu'}:{' '}
            {scopeFields.find(([key]) => key === permission.last?.field)?.[1]}.
            Sorumlu: {permission.last.assignee}. Son tarih:{' '}
            {dateLabel(permission.last.due)}.
          </p>
        )}
        {permission.last && !permission.active && (
          <p>Strateji yazımı kapalı.</p>
        )}
        <div className="foundation-actions">
          {permission.active && saved ? (
            <Button
              type="primary"
              onClick={() =>
                visit(
                  permission.last!.outcome === results[1]
                    ? permission.last!.field.slice(0, 2)
                    : '18',
                )
              }
            >
              İzin verilen çalışmayı aç
            </Button>
          ) : firstGap && r.required < 9 ? (
            <Button type="primary" onClick={() => proof(firstGap.id)}>
              Eksik dayanağı incele
            </Button>
          ) : (
            <Button
              onClick={() => {
                setTab('decision')
                requestAnimationFrame(() =>
                  document.getElementById('transition-decision')?.focus(),
                )
              }}
            >
              Karar kaydına git
            </Button>
          )}
          <Button
            onClick={() =>
              openDossier(permission.active ? permission.last?.id : undefined)
            }
          >
            Strateje devir raporunu aç
          </Button>
          <Button onClick={() => reports()}>Temel belgesini aç</Button>
          {!readOnly && <Button onClick={example}>Kafe örneğini aç</Button>}
        </div>
      </div>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'decision', label: 'Geçiş kararı' },
          { key: 'stones', label: '20 hazırlık işi' },
          { key: 'assumptions', label: 'Varsayımlar' },
          { key: 'history', label: 'Geçmiş kararlar' },
        ]}
      />
      {tab === 'decision' && (
        <div className="foundation-layout">
          <section className="panel">
            <h3>Zorunlu ölçütler</h3>
            {list(true)}
            <h3>Destekleyici ölçütler</h3>
            {list(false)}
          </section>
          <section className="panel fields">
            <h3 id="transition-decision" tabIndex={-1}>
              Karar sahibinin kaydı
            </h3>
            <p>Karar sahibi: {owner || 'Henüz yazılmadı'}</p>
            <label>
              <span>Geçiş sonucu</span>
              <Select
                disabled={!canSign}
                aria-label="Geçiş sonucu"
                value={result}
                onChange={select}
                options={results.map((v, i) => ({
                  label: v,
                  value: v,
                  disabled: i > results.indexOf(r.outcome),
                }))}
              />
            </label>
            <label>
              <span>Kararın gerekçesi</span>
              <Input.TextArea
                disabled={!canSign}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {pendingCommitments(p).map((a) => (
              <p key={a.id}>
                Kanıt bekleyen taahhüt: {a.commitment || a.impact}. Araştırma
                sorusu açık kalır.
              </p>
            ))}
            {result !== results[0] && !!missingSupports.length && (
              <label>
                <span>
                  Eksik desteklerden hangileri seçilecek yolu etkiliyor?
                </span>
                <Select
                  mode="multiple"
                  aria-label="Yolu etkileyen eksik destekler"
                  value={affected}
                  disabled={!canSign}
                  options={missingSupports.map((row) => ({
                    value: row.id,
                    label: row.title,
                  }))}
                  onChange={setMaterial}
                />
              </label>
            )}
            {affected.length > 0 && result !== results[0] && (
              <label>
                <span>Bu eksikler seçilecek yolu nasıl etkiler?</span>
                <Input.TextArea
                  disabled={!canSign}
                  value={supportReason}
                  onChange={(e) => setSupportReason(e.target.value)}
                />
              </label>
            )}
            {result === results[1] && (
              <>
                <p>
                  Koşullu izin yalnız açık soruyu kapsar. Yol kaydedilince iş
                  sırası için ayrı izin verilebilir. Seçimi tamamlamak için “Yol
                  seçimi ve gerekçesi” konusunu kullanın.
                </p>
                <label>
                  <span>Planlanacak konu</span>
                  <Select
                    disabled={!canSign}
                    aria-label="Planlanacak konu"
                    value={form.field}
                    onChange={(v) => update('field', v)}
                    options={scopeFields.map(([v, label]) => ({
                      value: v,
                      label,
                      disabled: v === '19.goals' && !currentStrategyChoice(p),
                    }))}
                  />
                </label>
                {(
                  [
                    ['question', 'Açık soru'],
                    ['assignee', 'İşi kim yapacak?'],
                    ['due', 'Son tarih'],
                    ['proof', 'Kapanış kanıtı'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k}>
                    <span>{label}</span>
                    <Input
                      disabled={!canSign}
                      type={k === 'due' ? 'date' : 'text'}
                      min={k === 'due' ? today() : undefined}
                      value={form[k]}
                      onChange={(e) => update(k, e.target.value)}
                    />
                  </label>
                ))}
              </>
            )}
            <Checkbox
              disabled={!canSign}
              checked={checked}
              onChange={(e) => check(e.target.checked)}
            >
              Dayanakları inceledim
            </Checkbox>
            {!canSign && <p>Bu kararı planın karar sahibi kaydedebilir.</p>}
            {err && <Alert role="alert" type="error" title={err} />}
            <Button
              disabled={decisionDisabled || !checked || !reason.trim()}
              onClick={record}
            >
              Geçiş kararını kaydet
            </Button>
          </section>
        </div>
      )}
      {tab === 'stones' && (
        <section className="panel">
          <h3>Hazırlık işleri</h3>
          <Select
            aria-label="Hazırlık işlerini süz"
            value={filter}
            onChange={setFilter}
            options={['Tümü', 'Eksikler', 'Karşı bulgu var'].map((value) => ({
              value,
              label: value,
            }))}
          />
          <ol className="foundation-list">
            {stones.map(([name, id, key], i) => {
              const row = r.rows.find((x) => x.id === key)!,
                active = activeSteps(p).includes(id),
                filled = complete(
                  p,
                  steps.find((s) => s.id === id)!,
                )
              const ok =
                i === 19
                  ? !!permission.last && permission.active
                  : row.ok && filled
              if (
                (filter === 'Eksikler' && (!active || ok)) ||
                (filter === 'Karşı bulgu var' && !row.against)
              )
                return null
              return (
                <li key={name}>
                  <div>
                    <strong>{name}</strong>
                    <p>
                      {!active
                        ? 'Bu profil için isteğe bağlı'
                        : row.against
                          ? 'Karşı bulgu var'
                          : ok
                            ? 'Tamam'
                            : 'İnceleme gerekiyor'}
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      i === 19
                        ? setTab('history')
                        : ['04', '12'].includes(id) || active
                          ? visit(id)
                          : proof(key)
                    }
                  >
                    İncele
                  </Button>
                </li>
              )
            })}
          </ol>
        </section>
      )}
      {tab === 'assumptions' && (
        <section className="panel">
          <h3>Varsayım defteri</h3>
          <h4>
            {String(p.answers['10']?.claim || 'Henüz varsayım yazılmadı.')}
          </h4>
          <p>{data.inputs.assumption || 'Denenmedi'}</p>
          <p>
            Bu tahmini çürütecek bulgu:{' '}
            {String(p.answers['10']?.refute || 'Bilinmiyor')}
          </p>
          <p>
            Bağlı kaynak:{' '}
            {p.evidence.find((e) => e.id === data.inputs.assumptionEvidence)
              ?.source || 'Henüz bağlanmadı'}
          </p>
          <Button onClick={() => visit('10')}>Varsayımı incele</Button>
          <Assumptions p={p} change={change} readOnly={readOnly} />
        </section>
      )}
      {tab === 'history' && (
        <section className="panel">
          <h3>Geçiş geçmişi</h3>
          {data.decisions.length === 0 && <p>Henüz karar yok.</p>}
          {data.decisions.toReversed().map((d) => (
            <details key={d.id} className="step-help">
              <summary>
                {d.outcome} · {dateLabel(d.at)}
              </summary>
              <p>
                {d.owner}. {d.reason}
              </p>
              <p>Karar günündeki öneri: {d.recommendation}</p>
              <p>{d.outcome === 'Koşullu hazır' ? d.question : ''}</p>
              {d.dossier && (
                <Button onClick={() => openDossier(d.id)}>
                  Karar günündeki devir raporunu aç
                </Button>
              )}
              <Button onClick={() => reports(d.id)}>
                Karar günündeki belgeyi aç
              </Button>
            </details>
          ))}
        </section>
      )}
    </section>
  )
}
