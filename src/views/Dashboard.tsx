import { useState } from 'react'
import { Select } from 'antd'
import {
  ArrowRight,
  ArrowUpRight,
  ChartBar,
  CheckCircle,
  ClipboardText,
  Files,
  Flag,
  HourglassMedium,
  Notebook,
  Wallet,
} from '@phosphor-icons/react'
import {
  activeSteps,
  approved,
  complete,
  currentStage,
  dateLabel,
  effective,
  money,
  openGaps,
  reviewNext,
  recommend,
  type Plan,
} from '../domain'
import { access, evaluate, levels } from '../readiness'
import { activeWork } from '../operations'
import { steps, stages } from '../data/steps'
import type { Page } from '../ui/navigation'

type Filter = 'all' | 'approved' | 'waiting'
export default function Dashboard({
  p,
  go,
  openStage,
  visit,
  proof,
  confirmed,
}: {
  confirmed: boolean
  visit: (id: string) => void
  proof: (id: import('../readiness').Criterion) => void
  p: Plan
  go: (v: Page) => void
  openStage: (n: number) => void
}) {
  const prep = evaluate(p),
    permission = access(p)
  const current = currentStage(p)
  const [selection, setSelection] = useState<number | null>(null),
    [filter, setFilter] = useState<Filter>('all'),
    [measure, setMeasure] = useState<'steps' | 'evidence'>('steps')
  const selected = selection ?? current
  const active = activeSteps(p)
  const rows = stages.map((s, i) => {
    const entries = steps.filter((x) => x.stage === i && active.includes(x.id)),
      total = entries.length,
      done = entries.filter((x) => complete(p, x)).length
    const latest = p.history.findLast((h) => h.stage === i),
      pass = approved(p, i),
      open = i === current && !pass
    const status = pass
      ? 'Onaylandı'
      : latest?.stale
        ? 'Yeniden incele'
        : latest
          ? effective(latest)
          : open
            ? 'Açık'
            : 'Sırada'
    return {
      ...s,
      i,
      total,
      done,
      status,
      pass,
      open,
      latest,
      evidence: p.evidence.filter(
        (e) => steps.find((x) => x.id === e.step)?.stage === i,
      ).length,
    }
  })
  const done = rows.reduce((n, r) => n + r.done, 0),
    passed = rows.filter((r) => r.pass).length,
    work = activeWork(p).length
  const budget = p.answers['02']?.budget,
    spent = p.answers['02']?.spent
  const balance =
    typeof budget === 'number' && typeof spent === 'number'
      ? budget - spent
      : null
  const usage =
    typeof budget === 'number' && budget > 0 && typeof spent === 'number'
      ? Math.round((spent / budget) * 100)
      : null
  const row = rows[selected],
    advice = recommend(p, selected),
    gaps = openGaps(p, selected)
  const max =
    measure === 'steps'
      ? Math.max(1, ...rows.map((r) => r.total))
      : Math.max(1, ...rows.map((r) => r.evidence))
  const filtered = rows.filter(
    (r) => filter === 'all' || (filter === 'approved' ? r.pass : !r.pass),
  )
  const selectRow = (i: number) => setSelection(i)
  const source = row.latest
  const showReadiness = selection === null
  const gap = prep.rows.find((r) => !r.ok),
    newPlan = !p.answers['01']?.owner
  const canStart = permission.active && confirmed
  const follow = reviewNext(p)
  const nextLabel = follow
    ? follow.id + '. adımın kaydını aç'
    : canStart
      ? 'Strateji çalışmasını aç'
      : newPlan
        ? 'Hazırlığa başla'
        : prep.required === 9 || permission.last
          ? 'Geçişi incele'
          : 'Eksik dayanağı incele'
  function nextAction() {
    if (follow) {
      if (follow.id === '17') go('gecis')
      else visit(follow.id)
      return
    }
    if (canStart)
      visit(
        permission.last?.outcome === 'Koşullu hazır'
          ? permission.last.field.slice(0, 2)
          : '18',
      )
    else if (newPlan) visit('00')
    else if (gap && prep.required < 9 && !permission.last) proof(gap.id)
    else go('gecis')
  }
  return (
    <div className="council">
      <div className="plan-overview">
        <section className="decision-brief" aria-label="Seçili karar">
          <div className="brief-content">
            <div className="brief-label">
              <span className="signal-dot" />
              {showReadiness
                ? 'Planlamaya hazırlık'
                : row.open
                  ? 'Açık karar'
                  : 'Seçili karar'}
              <span className="brief-number">
                {String(selected + 1).padStart(2, '0')} / 08
              </span>
            </div>
            <h2>
              {showReadiness ? (follow?.action ?? prep.outcome) : row.name}
            </h2>
            <p>
              {showReadiness && follow
                ? follow.reason
                : selected === current
                  ? 'İş fikrinizi sınayın. Ardından planlamaya geçişi değerlendirin.'
                  : row.question}
            </p>
            {showReadiness && (
              <button className="brief-open" onClick={nextAction}>
                {nextLabel} <ArrowRight size={18} />
              </button>
            )}
            <button
              className={showReadiness ? 'brief-secondary' : 'brief-open'}
              onClick={() => openStage(selected)}
            >
              Kararı incele <ArrowRight size={18} />
            </button>
          </div>
          <div
            className="completion-dial"
            role="progressbar"
            aria-label="Tamamlanan plan adımları"
            aria-valuemin={0}
            aria-valuemax={active.length}
            aria-valuenow={done}
            aria-valuetext={done + ' / ' + active.length + ' adım'}
          >
            <div className="dial-face" aria-hidden="true">
              {Array.from({ length: active.length }, (_, i) => (
                <i
                  key={i}
                  className={i < done ? 'done' : undefined}
                  style={{
                    transform: 'rotate(' + (i * 360) / active.length + 'deg)',
                  }}
                />
              ))}
              <strong>%{Math.round((done * 100) / active.length)}</strong>
              <span>
                {done} / {active.length} adım
              </span>
            </div>
          </div>
          <div className="brief-decision">
            <div>
              <span className="verdict-label">
                <HourglassMedium size={16} />
                {showReadiness
                  ? permission.last
                    ? 'Kayıtlı karar'
                    : 'Geçiş önerisi'
                  : row.pass
                    ? 'Kayıtlı karar'
                    : 'Öneri'}
              </span>
              <b>
                {showReadiness
                  ? (permission.last?.outcome ?? prep.outcome)
                  : row.pass
                    ? row.status
                    : advice.outcome}
              </b>
            </div>
            <p>
              {showReadiness
                ? permission.last
                  ? permission.reason
                  : (gap?.hint ?? 'Dayanakları inceleyin.')
                : row.pass
                  ? source?.reason
                  : advice.reason}
            </p>
            <small>
              {row.pass
                ? source?.owner
                : gaps.length + ' açık alan, ' + row.evidence + ' bağlı kanıt'}
            </small>
          </div>
        </section>
        <section className="balance-summary" aria-label="Plan göstergeleri">
          <div className="balance-metric">
            <span>
              <Wallet />
              Kalan bütçe
            </span>
            <strong>{money(balance)}</strong>
            <small>
              {usage !== null
                ? 'Bütçenin %' + usage + ' kadarı kullanıldı'
                : 'Harcama sınırı bekleniyor'}
            </small>
            <div className="budget-scale" aria-hidden="true">
              <i
                style={{
                  width:
                    usage === null
                      ? '0%'
                      : Math.max(0, Math.min(100, usage)) + '%',
                }}
              />
            </div>
          </div>
          <button className="book-metric" onClick={() => openStage(current)}>
            <span>
              <Flag />
              Onaylı karar
            </span>
            <strong>
              {passed}
              <em>/ 8</em>
            </strong>
            <span className="mini-ticks" aria-hidden="true">
              {rows.map((r) => (
                <i key={r.i} className={r.pass ? 'filled' : ''} />
              ))}
            </span>
          </button>
          <button className="book-metric" onClick={() => go('evidence')}>
            <span>
              <Notebook />
              Kanıt kaydı
            </span>
            <strong>{p.evidence.length}</strong>
            <small>
              Kanıt defteri <ArrowUpRight />
            </small>
          </button>
          <button className="book-metric" onClick={() => go('work')}>
            <span>
              <ClipboardText />
              Açık görev
            </span>
            <strong>{work}</strong>
            <small>
              Görevleri gör <ArrowUpRight />
            </small>
          </button>
        </section>
      </div>
      <section className="panel">
        <h2>Stratejik planlamaya hazırlık</h2>
        <button className="case-map" onClick={() => go('asamalar')}>
          Beş ana aşamayı incele
        </button>
        <p>
          Öneri: {prep.outcome}. {prep.required} / 9 zorunlu ölçüt.
        </p>
        <p>
          Doğrulama düzeyi {prep.level} / 5. {levels[prep.level]}.
        </p>
        <p>
          {permission.last
            ? 'Kayıtlı karar: ' + permission.last.outcome + '. '
            : ''}
          {permission.reason}
        </p>
        <button className="case-map" onClick={() => go('gecis')}>
          Planlamaya geçişi incele
        </button>
      </section>
      <div className="analysis-split">
        <section className="coverage-sheet" aria-label="Aşama analizi">
          <div className="sheet-heading">
            <div>
              <span className="section-key">
                <ChartBar size={18} />
                Aşama analizi
              </span>
              <h2>{measure === 'steps' ? 'Adım kapsamı' : 'Kanıt dağılımı'}</h2>
            </div>
            <div
              className="choice-switch"
              role="group"
              aria-label="Grafik ölçüsü"
            >
              <button
                aria-label="Adım kapsamı"
                aria-pressed={measure === 'steps'}
                onClick={() => setMeasure('steps')}
              >
                Adımlar
              </button>
              <button
                aria-label="Kanıt dağılımı"
                aria-pressed={measure === 'evidence'}
                onClick={() => setMeasure('evidence')}
              >
                Kanıtlar
              </button>
            </div>
          </div>
          <label className="plot-picker">
            <span>Aşama seç</span>
            <Select
              aria-label="Grafikte aşama seç"
              value={selected}
              onChange={selectRow}
              options={rows.map((r) => ({
                value: r.i,
                label: String(r.i + 1).padStart(2, '0') + '. ' + r.name,
              }))}
            />
          </label>
          <div className="coverage-plot">
            <div className="plot-axis" aria-hidden="true">
              <span>{max}</span>
              <span>0</span>
            </div>
            <div className="plot-series">
              {rows.map((r) => {
                const amount = measure === 'steps' ? r.done : r.evidence,
                  capacity = measure === 'steps' ? r.total : r.evidence
                return (
                  <button
                    key={r.i}
                    aria-pressed={selected === r.i}
                    aria-label={
                      r.i +
                      1 +
                      '. ' +
                      r.name +
                      ', ' +
                      (measure === 'steps'
                        ? r.done + ' / ' + r.total + ' adım'
                        : amount + ' kanıt')
                    }
                    title={
                      r.name +
                      ' · ' +
                      (measure === 'steps' ? r.done + ' / ' + r.total : amount)
                    }
                    onClick={() => selectRow(r.i)}
                  >
                    <span className="plot-lane">
                      <span
                        className="plot-column"
                        style={{ height: (capacity / max) * 100 + '%' }}
                      >
                        <span
                          style={{
                            height:
                              (capacity ? (amount / capacity) * 100 : 0) + '%',
                          }}
                        />
                      </span>
                    </span>
                    <span className="axis-number">
                      {String(r.i + 1).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true" className="axis-label">
                      {
                        [
                          'Yetki',
                          'Sorun',
                          'Erişim',
                          'Taahhüt',
                          'Kaynak',
                          'Fayda',
                          'Tekrar',
                          'Gelecek',
                        ][r.i]
                      }
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="plot-readout" aria-live="polite" aria-atomic="true">
            <span>
              {String(selected + 1).padStart(2, '0')}. {row.name}
            </span>
            <button
              className="plot-open"
              onClick={() => openStage(selected)}
              aria-label={'Karara git: ' + row.name}
            >
              Karara git <ArrowUpRight size={16} />
            </button>
            <b>
              {measure === 'steps'
                ? row.done + ' / ' + row.total + ' adım'
                : row.evidence + ' kanıt'}
            </b>
          </div>
          <div className="plot-caption">
            <span>
              <i />
              {measure === 'steps' ? 'Tamamlanan' : 'Kanıt kaydı'}
            </span>
            <span className="key-selected">
              <i />
              Seçili karar
            </span>
            {measure === 'steps' && (
              <span className="key-remaining">
                <i />
                Kalan adım
              </span>
            )}
            <b>
              {measure === 'steps'
                ? done + ' / ' + active.length + ' adım'
                : p.evidence.length + ' kayıt'}
            </b>
          </div>
        </section>
        <section className="decision-feed">
          <div className="book-toolbar">
            <h2>Son kararlar</h2>
            <button onClick={() => go('reports')}>
              <Files size={17} />
              Raporlar
              <ArrowUpRight size={15} />
            </button>
          </div>
          {p.history.length ? (
            <ol>
              {p.history
                .slice(-3)
                .reverse()
                .map((h) => (
                  <li key={h.id}>
                    <b>{stages[h.stage].name}</b>
                    <span>
                      {effective(h)}
                      {h.stale ? ' · Yeniden incele' : ''}
                    </span>
                    <small>{dateLabel(h.at)}</small>
                    <p>{h.reason}</p>
                  </li>
                ))}
            </ol>
          ) : (
            <p>Henüz karar kaydı yok.</p>
          )}
        </section>
      </div>
      <section className="decision-book">
        <div className="book-toolbar">
          <h2>Karar rotası</h2>
          <div
            className="choice-switch"
            role="group"
            aria-label="Karar süzgeci"
          >
            {(
              [
                { value: 'all', label: 'Tümü', name: 'Tüm kararları göster' },
                {
                  value: 'approved',
                  label: 'Onaylı',
                  name: 'Onaylananları göster',
                },
                {
                  value: 'waiting',
                  label: 'Onaysız',
                  name: 'Onaylanmamış kararları göster',
                },
              ] as const
            ).map((f) => (
              <button
                key={f.value}
                aria-label={f.name}
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Karar listesi"
          tabIndex={0}
        >
          <table aria-label="Karar rotası">
            <thead>
              <tr>
                <th scope="col">Karar</th>
                <th scope="col">Durum</th>
                <th scope="col">Tamamlanan adım</th>
                <th scope="col">Kanıt</th>
                <th scope="col">Son karar sahibi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.i} data-current={r.open || undefined}>
                  <th scope="row">
                    <button onClick={() => openStage(r.i)}>
                      <span>{String(r.i + 1).padStart(2, '0')}</span>
                      {r.name}
                      <ArrowUpRight size={15} />
                    </button>
                  </th>
                  <td>
                    <span
                      className="ledger-status"
                      data-tone={r.pass ? 'good' : r.open ? 'open' : 'idle'}
                    >
                      {r.pass ? <CheckCircle size={14} /> : <i />}
                      {r.status}
                    </span>
                  </td>
                  <td className="numeric">
                    {r.done} / {r.total}
                  </td>
                  <td className="numeric">{r.evidence}</td>
                  <td>{r.latest?.owner || 'Kayıt yok'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <p className="empty-entry">Bu seçimde karar yok.</p>
        )}
      </section>
    </div>
  )
}
