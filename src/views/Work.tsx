import { useState } from 'react'
import { Alert, Button, Drawer, Input, Select } from 'antd'
import {
  ClipboardText,
  Plus,
  CalendarBlank,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react'
import { today, dateLabel, type Plan } from '../domain'
import { stages } from '../data/steps'
import {
  activeWork,
  workLabel,
  retired,
  newWork,
  updateWork,
  workContext,
  workItems,
  states,
  type WorkState,
} from '../operations'
import './office.css'
export default function Work({
  p,
  change,
  readOnly,
  openStage,
}: {
  p: Plan
  change: (fn: (p: Plan) => Plan) => void
  readOnly: boolean
  openStage: (n: number) => void
}) {
  const [filter, setFilter] = useState('Tümü'),
    [query, setQuery] = useState(''),
    [editing, setEditing] = useState(''),
    [title, setTitle] = useState(''),
    [owner, setOwner] = useState(''),
    [due, setDue] = useState(''),
    [stage, setStage] = useState(0),
    [status, setStatus] = useState<WorkState>('Açık'),
    [proof, setProof] = useState(''),
    [error, setError] = useState('')
  const items = workItems(p),
    selected = items.find((w) => w.id === editing)
  const rows = items.filter(
    (w) =>
      (filter === 'Tümü' || workLabel(p, w) === filter) &&
      [w.title, w.owner]
        .join(' ')
        .toLocaleLowerCase('tr')
        .includes(query.toLocaleLowerCase('tr')),
  )
  function start(id: string) {
    const w = items.find((i) => i.id === id)
    setTitle(w?.title || '')
    setOwner(w?.owner || '')
    setStage(w?.stage ?? 0)
    setDue(w?.due || '')
    setStatus(w?.status || 'Açık')
    setProof(w?.proof || '')
    setError('')
    setEditing(id)
  }
  function save() {
    try {
      const next = selected
        ? updateWork(p, selected.id, status, proof)
        : newWork(p, { title, owner, stage, due })
      change(() => next)
      setEditing('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Görev defteri</h2>
          <p>
            {activeWork(p).length} açık iş ·{' '}
            {items.filter((w) => w.status === 'Tamamlandı').length} tamamlandı
          </p>
        </div>
        {!readOnly && (
          <Button type="primary" icon={<Plus />} onClick={() => start('new')}>
            Görev ekle
          </Button>
        )}
      </div>
      <div className="ops-filters">
        <Input.Search
          aria-label="Görev veya kişi ara"
          placeholder="Görev veya kişi ara"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          aria-label="Görev durumu filtresi"
          value={filter}
          onChange={setFilter}
          options={['Tümü', ...states, 'Geçmiş kayıt'].map((s) => ({
            label: s,
            value: s,
          }))}
        />
      </div>
      {rows.map((w) => (
        <article className="task-row" key={w.id}>
          <span className="icon-tile teal">
            {w.status === 'Tamamlandı' ? (
              <CheckCircle size={21} />
            ) : (
              <ClipboardText size={21} />
            )}
          </span>
          <div>
            <small>
              {stages[w.stage].name} · {workContext(p, w)}
            </small>
            <h3>{w.title}</h3>
            <p>
              {w.owner}
              {w.due ? ' · ' + dateLabel(w.due) : ''}
            </p>
            {w.proof && <p>Kapanış kanıtı: {w.proof}</p>}
          </div>
          <Button onClick={() => start(w.id)}>
            {workLabel(p, w)}
            <ArrowRight />
          </Button>
        </article>
      ))}
      {!rows.length && (
        <div className="office-empty">
          <ClipboardText size={32} />
          <h3>
            {items.length
              ? 'Bu seçimde görev yok.'
              : 'İlk görev burada başlar.'}
          </h3>
          <p>
            {items.length
              ? 'Aramayı veya durumu değiştirin.'
              : 'Karar kaydında yazdığınız sonraki iş buraya gelir.'}
          </p>
        </div>
      )}
      <Drawer
        title={selected ? 'Görev ayrıntısı' : 'Yeni görev'}
        open={!!editing}
        size="min(100vw, 500px)"
        onClose={() => setEditing('')}
      >
        <div className="fields">
          {selected ? (
            <>
              <h2>{selected.title}</h2>
              <p>
                {selected.owner} · {workContext(p, selected)}
              </p>
              <Button
                onClick={() => {
                  setEditing('')
                  openStage(selected.stage)
                }}
              >
                Bağlı kararı aç
              </Button>
              <label>
                <span>Görevin durumu</span>
                <Select
                  aria-label="Görevin durumu"
                  disabled={readOnly || retired(p, selected)}
                  value={status}
                  onChange={setStatus}
                  options={states.map((v) => ({ label: v, value: v }))}
                />
              </label>
              <label>
                <span>Kapanış kanıtı</span>
                <Input.TextArea
                  readOnly={readOnly}
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <label>
                <span>Görevin adı</span>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                <span>Sorumlu kişi</span>
                <Input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </label>
              <label>
                <span>Bağlı karar</span>
                <Select
                  value={stage}
                  onChange={setStage}
                  options={stages.map((s, i) => ({ label: s.name, value: i }))}
                />
              </label>
              <label>
                <span>Hedef tarih</span>
                <Input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </label>
            </>
          )}
          {selected?.due &&
            selected.status !== 'Tamamlandı' &&
            selected.due < today() && (
              <p>
                <CalendarBlank /> Hedef tarih geçti.
              </p>
            )}
          {error && <Alert title={error} type="error" />}
          {!readOnly && (!selected || !retired(p, selected)) && (
            <Button type="primary" onClick={save}>
              Görevi kaydet
            </Button>
          )}
        </div>
      </Drawer>
    </section>
  )
}
