import { useState } from 'react'
import { Alert, Button, Input, Modal, Select } from 'antd'
import { Plus, Trash } from '@phosphor-icons/react'
import { steps } from '../data/steps'
import { evidenceKinds, type EvidenceKind } from '../operations'
import { dateLabel, now, type Plan } from '../domain'
export default function Evidence({
  p,
  change,
  readOnly,
}: {
  readOnly: boolean
  p: Plan
  change: (fn: (p: Plan) => Plan) => void
}) {
  const [kind, setKind] = useState<EvidenceKind>('Gözlem'),
    [filter, setFilter] = useState('Tümü'),
    [query, search] = useState('')
  const rows = p.evidence.filter(
    (e) =>
      (filter === 'Tümü' || (e.kind || 'Sınıflandırılmadı') === filter) &&
      [e.title, e.source, e.step]
        .join(' ')
        .toLocaleLowerCase('tr')
        .includes(query.trim().toLocaleLowerCase('tr')),
  )
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState(''),
    [source, setSource] = useState(''),
    [step, setStep] = useState('00'),
    [err, error] = useState(''),
    [remove, setRemove] = useState('')
  function add() {
    if (!title.trim() || !source.trim()) {
      error('Gözlemi ve kaynağını yazın.')
      return
    }
    change((prev) => ({
      ...prev,
      evidence: [
        ...prev.evidence,
        {
          id: crypto.randomUUID(),
          kind,
          title: title.trim(),
          source: source.trim(),
          step,
          at: now(),
        },
      ],
    }))
    setOpen(false)
    setTitle('')
    setSource('')
    error('')
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
          onClick={() => setOpen(true)}
        >
          Kanıt ekle
        </Button>
      </div>
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
                  </th>
                  <td>{e.source}</td>
                  <td>{e.kind || 'Sınıflandırılmadı'}</td>
                  <td>
                    {e.step}. {steps.find((s) => s.id === e.step)?.title}
                  </td>
                  <td>{dateLabel(e.at)}</td>
                  <td>
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
        title="Kanıt ekle"
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
              onChange={setStep}
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
