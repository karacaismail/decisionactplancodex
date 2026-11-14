import { useEffect, useState } from 'react'
import { Alert, Button, Input, Modal, Select } from 'antd'
import { Plus, Trash } from '@phosphor-icons/react'
import { steps } from '../data/steps'
import { evidenceKinds, type EvidenceKind } from '../operations'
import { criteria, type Criterion } from '../readiness'
import {
  calendar,
  today,
  dateLabel,
  now,
  type Evidence as Proof,
  type Plan,
} from '../domain'
export default function Evidence({
  p,
  change,
  readOnly,
  initialCriterion,
  recordId,
  clearRecord,
  closeContext,
}: {
  recordId?: string
  clearRecord: () => void
  initialCriterion?: Criterion
  closeContext: () => void
  readOnly: boolean
  p: Plan
  change: (fn: (p: Plan) => Plan) => void
}) {
  const [editing, setEditing] = useState(''),
    [links, setLinks] = useState<Criterion[]>([]),
    [observed, setObserved] = useState(''),
    [stance, setStance] = useState<'Destek' | 'Karşı bulgu'>('Destek')
  const [selectedRecord, setRecord] = useState(recordId)
  useEffect(() => {
    if (recordId) clearRecord()
  }, [recordId])
  const context = criteria.find((c) => c[0] === initialCriterion)
  const [kind, setKind] = useState<EvidenceKind>('Gözlem'),
    [filter, setFilter] = useState('Tümü'),
    [query, search] = useState('')
  const rows = p.evidence.filter(
    (e) =>
      (!selectedRecord || e.id === selectedRecord) &&
      (!context || context[4].split(' ').includes(e.step)) &&
      (filter === 'Tümü' || (e.kind || 'Sınıflandırılmadı') === filter) &&
      [e.title, e.source, e.step]
        .join(' ')
        .toLocaleLowerCase('tr')
        .includes(query.trim().toLocaleLowerCase('tr')),
  )
  const [customerGroup, setGroup] = useState(''),
    [period, setPeriod] = useState('')
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState(''),
    [source, setSource] = useState(''),
    [step, setStep] = useState('00'),
    [err, error] = useState(''),
    [remove, setRemove] = useState('')
  const [side, setSide] = useState<NonNullable<Proof['side']>>('Müşteri'),
    [codes, setCodes] = useState('')
  function start(existing?: Proof) {
    setSide(existing?.side ?? 'Müşteri')
    setCodes(existing?.participants?.join(', ') ?? '')
    setGroup(existing?.customerGroup ?? '')
    setPeriod(existing?.period ?? '')
    setEditing(existing?.id ?? '')
    setTitle(existing?.title ?? '')
    setSource(existing?.source ?? '')
    setKind(
      existing?.kind ??
        (initialCriterion === 'Z6' ? 'Yazılı taahhüt' : 'Gözlem'),
    )
    setObserved(existing ? (existing.observed ?? '') : today())
    setStance(existing?.stance ?? 'Destek')
    setStep(existing?.step ?? context?.[2] ?? '00')
    setLinks(
      existing
        ? Array.from(
            new Set([
              ...(existing.criteria ?? []),
              ...(initialCriterion ? [initialCriterion] : []),
            ]),
          )
        : initialCriterion
          ? [initialCriterion]
          : [],
    )
    error('')
    setOpen(true)
  }
  function add() {
    if (readOnly) return
    if (
      !title.trim() ||
      !source.trim() ||
      (links.length > 0 && (!calendar(observed) || observed > today()))
    ) {
      error('Gözlemi, kaynağı ve geçerli olay tarihini yazın.')
      return
    }
    change((prev) => {
      const old = prev.evidence.find((e) => e.id === editing)
      const item: Proof = {
        id: old?.id ?? crypto.randomUUID(),
        at: old?.at ?? now(),
        kind,
        step,
        title: title.trim(),
        source: source.trim(),
        criteria: links,
        ...(customerGroup.trim()
          ? { customerGroup: customerGroup.trim() }
          : {}),
        ...(period.trim() ? { period: period.trim() } : {}),
        ...(links.includes('Z6')
          ? {
              side,
              participants: Array.from(
                new Set(
                  codes
                    .split(/[,;\n]+/)
                    .map((v) => v.trim())
                    .filter(Boolean),
                ),
              ),
            }
          : {}),
        observed: observed || undefined,
        stance,
      }
      return {
        ...prev,
        evidence: old
          ? prev.evidence.map((e) => (e.id === old.id ? item : e))
          : [...prev.evidence, item],
        history: old
          ? prev.history.map((h) => ({ ...h, stale: true }))
          : prev.history,
      }
    })
    setOpen(false)
  }
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Gözlem kayıtları</h2>
          <p>{p.evidence.length} kayıt</p>
        </div>
        <Button
          disabled={readOnly}
          type="primary"
          icon={<Plus />}
          onClick={() => start()}
        >
          Kanıt ekle
        </Button>
      </div>
      {selectedRecord && (
        <Button onClick={() => setRecord(undefined)}>
          Tüm kanıtları göster
        </Button>
      )}
      {context && (
        <div className="step-help">
          <strong>{context[1]}</strong>
          <p>{context[3]}</p>
          <Button onClick={closeContext}>Tüm kayıtları göster</Button>
          <Button
            onClick={() => {
              location.hash = 'gecis'
            }}
          >
            Geçişe dön
          </Button>
        </div>
      )}
      <div className="evidence-filter ops-filters">
        <Input.Search
          aria-label="Kanıt veya kaynak ara"
          placeholder="Kanıt veya kaynak ara"
          value={query}
          onChange={(e) => search(e.target.value)}
        />
        <Select
          aria-label="Kanıt türüne göre süz"
          value={filter}
          onChange={setFilter}
          options={['Tümü', 'Sınıflandırılmadı', ...evidenceKinds].map((v) => ({
            value: v,
            label: v,
          }))}
        />
      </div>
      {rows.length ? (
        <div
          className="table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Kanıt kayıtları"
        >
          <table className="register-table" aria-label="Kanıt defteri">
            <thead>
              <tr>
                <th scope="col">Gözlem</th>
                <th scope="col">Kaynak</th>
                <th scope="col">Kanıt türü</th>
                <th scope="col">Plan adımı</th>
                <th scope="col">Kayıt tarihi</th>
                <th scope="col">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.toReversed().map((e) => (
                <tr key={e.id}>
                  <th scope="row">
                    <h3>{e.title}</h3>
                    {(e.customerGroup || e.period) && (
                      <p>
                        {[e.customerGroup, e.period].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </th>
                  <td>{e.source}</td>
                  <td>{e.kind || 'Sınıflandırılmadı'}</td>
                  <td>
                    {e.step}. {steps.find((s) => s.id === e.step)?.title}
                  </td>
                  <td>
                    {dateLabel(e.at)}
                    {e.observed && <p>Olay: {dateLabel(e.observed)}</p>}
                    {e.criteria?.length ? (
                      <p>
                        {e.stance} · {e.criteria.join(', ')}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <Button disabled={readOnly} onClick={() => start(e)}>
                      Kaydı incele
                    </Button>
                    <Button
                      disabled={readOnly}
                      type="text"
                      icon={<Trash />}
                      aria-label={e.title + ' kaydını sil'}
                      onClick={() => setRemove(e.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          {p.evidence.length
            ? 'Bu seçimde kayıt yok.'
            : 'Henüz gözlem kaydı yok.'}
        </p>
      )}
      <Modal
        title={editing ? 'Kanıtı güncelle' : 'Kanıt ekle'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={add}
        okText="Kanıtı kaydet"
        cancelText="Vazgeç"
      >
        <div className="fields">
          <label>
            <span>Plan adımı</span>
            <Select
              value={step}
              onChange={(v) => {
                setStep(v)
                setLinks(
                  links.filter((id) =>
                    criteria
                      .find((c) => c[0] === id)?.[4]
                      .split(' ')
                      .includes(v),
                  ),
                )
              }}
              options={steps.map((s) => ({
                value: s.id,
                label: s.id + '. ' + s.title,
              }))}
            />
          </label>
          <label>
            <span>Ne gözlediniz?</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            <span>Kaynak</span>
            <Input.TextArea
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
          <label>
            <span>Kanıt türü</span>
            <Select
              value={kind}
              onChange={setKind}
              options={evidenceKinds.map((v) => ({ value: v, label: v }))}
            />
          </label>
          <details className="step-help">
            <summary>Gözlemin kapsadığı müşteri ve dönem</summary>
            <div className="fields">
              <label>
                <span>Gözlenen müşteri grubu</span>
                <Input
                  value={customerGroup}
                  onChange={(e) => setGroup(e.target.value)}
                />
              </label>
              <label>
                <span>Gözlem dönemi</span>
                <Input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </label>
            </div>
          </details>
          <label>
            <span>Olay tarihi</span>
            <Input
              type="date"
              max={today()}
              value={observed}
              onChange={(e) => setObserved(e.target.value)}
            />
          </label>
          <label>
            <span>Bağlı ölçütler</span>
            <Select
              aria-label="Bağlı ölçütler"
              mode="multiple"
              value={links}
              onChange={setLinks}
              options={criteria
                .filter((c) => c[4].split(' ').includes(step))
                .map((c) => ({ value: c[0], label: c[1] }))}
            />
          </label>
          <label>
            <span>Kanıtın yönü</span>
            <Select
              aria-label="Kanıtın yönü"
              value={stance}
              onChange={setStance}
              options={['Destek', 'Karşı bulgu'].map((v) => ({
                value: v,
                label: v,
              }))}
            />
          </label>
          {links.includes('Z6') && (
            <>
              <label>
                <span>Davranış kime ait?</span>
                <Select
                  aria-label="Davranış kime ait?"
                  value={side}
                  onChange={setSide}
                  options={['Müşteri', 'Diğer taraf', 'Eşleşme'].map(
                    (value) => ({ value, label: value }),
                  )}
                />
              </label>
              <label>
                <span>
                  {side === 'Eşleşme'
                    ? 'Eşleşen kodlar. Örnek: K1/S1, K2/S2'
                    : 'Kişi veya kurum kodları. Örnek: K1, K2'}
                </span>
                <Input.TextArea
                  value={codes}
                  onChange={(e) => setCodes(e.target.value)}
                />
              </label>
              <p>Her alıcıya bir kod verin. Aynı kod bir kez sayılır.</p>
            </>
          )}
          {err && <Alert type="error" title={err} />}
        </div>
      </Modal>
      <Modal
        title="Kanıt kaydı silinsin mi?"
        open={!!remove}
        okText="Sil"
        cancelText="Vazgeç"
        onCancel={() => setRemove('')}
        onOk={() => {
          change((prev) => ({
            ...prev,
            evidence: prev.evidence.filter((e) => e.id !== remove),
            history: prev.history.map((h) => ({ ...h, stale: true })),
          }))
          setRemove('')
        }}
      >
        Bu kaydı kullanan kararları yeniden inceleyin.
      </Modal>
    </section>
  )
}
