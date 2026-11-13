import { Button } from 'antd'
import {
  ArrowRight,
  ArrowUpRight,
  Flag,
  Path,
  Notebook,
  ClipboardText,
  ClockCounterClockwise,
  Files,
  BookOpenText,
} from '@phosphor-icons/react'
import {
  activeSteps,
  approved,
  complete,
  currentStage,
  dateLabel,
  effective,
  type Plan,
} from '../domain'
import { activeWork } from '../operations'
import { steps, stages } from '../data/steps'
import Relief from '../ui/Relief'
import type { Page } from '../ui/navigation'

export default function Dashboard({
  p,
  go,
  openStage,
}: {
  p: Plan
  go: (v: Page) => void
  openStage: (n: number) => void
}) {
  const stage = currentStage(p),
    active = activeSteps(p),
    approvedCount = stages.filter((_, i) => approved(p, i)).length
  const done = steps.filter(
    (s) => active.includes(s.id) && complete(p, s),
  ).length
  const metrics = [
    {
      label: 'Onaylı karar',
      value: approvedCount,
      unit: '/ 8',
      icon: Flag,
      page: 'editor',
    },
    {
      label: 'Tamamlanan adım',
      value: done,
      unit: '/ ' + active.length,
      icon: Path,
      page: 'editor',
    },
    {
      label: 'Kanıt kaydı',
      value: p.evidence.length,
      unit: '',
      icon: Notebook,
      page: 'evidence',
    },
    {
      label: 'Açık görev',
      value: activeWork(p).length,
      unit: '',
      icon: ClipboardText,
      page: 'work',
    },
  ] as const
  return (
    <>
      <div className="dashboard-hero atlas-cover">
        <Relief />
        <div className="atlas-cover-copy">
          <div className="cover-kicker">
            <i />
            {approvedCount === 8 ? 'Son karar' : 'Açık karar'}
            <span>{String(stage + 1).padStart(2, '0')} / 08</span>
          </div>
          <h2>{stages[stage].name}</h2>
          <p>{stages[stage].question}</p>
          <Button className="cover-action" onClick={() => openStage(stage)}>
            Kararı incele <ArrowRight size={18} />
          </Button>
        </div>
      </div>
      <section className="metric-band" aria-label="Plan göstergeleri">
        {metrics.map(({ label, value, unit, icon: Icon, page }) => (
          <button key={label} onClick={() => go(page)}>
            <span>
              <Icon size={17} />
              {label}
            </span>
            <strong>
              {value} <small>{unit}</small>
            </strong>
          </button>
        ))}
      </section>
      <div className="overview-columns">
        <section className="panel decision-register">
          <div className="surface-title">
            <h2>Karar rotası</h2>
            <span>{approvedCount} / 8 onay</span>
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
                  <th scope="col">Adımlar</th>
                  <th scope="col">Durum</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s, i) => {
                  const related = steps.filter(
                      (x) => x.stage === i && active.includes(x.id),
                    ),
                    count = related.filter((x) => complete(p, x)).length,
                    pass = approved(p, i),
                    current = i === stage && !pass,
                    last = p.history.findLast((h) => h.stage === i)
                  return (
                    <tr key={s.name} className={current ? 'row-current' : ''}>
                      <th scope="row">
                        <button onClick={() => openStage(i)}>
                          <span className="row-index">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {s.name}
                        </button>
                      </th>
                      <td>
                        {count} / {related.length}
                      </td>
                      <td>
                        <span
                          className={
                            'status-text ' +
                            (pass ? 'positive' : current ? 'live' : '')
                          }
                        >
                          <i />
                          {pass
                            ? 'Onaylandı'
                            : last?.stale
                              ? 'İncelenecek'
                              : last
                                ? effective(last)
                                : current
                                  ? 'Açık'
                                  : 'Sırada'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
        <div className="aside-stack">
          <section className="panel event-register">
            <div className="surface-title">
              <h2>Son kararlar</h2>
              <ClockCounterClockwise size={21} />
            </div>
            {p.history.length ? (
              <ol>
                {p.history
                  .slice(-3)
                  .reverse()
                  .map((h) => (
                    <li key={h.id}>
                      <span
                        className={'event-mark ' + (h.stale ? 'archived' : '')}
                      >
                        <Flag size={17} />
                      </span>
                      <div>
                        <b>{stages[h.stage].name}</b>
                        <p>
                          {effective(h)}
                          {h.stale ? ' · İnceleme bekliyor' : ''}
                        </p>
                        <small>{dateLabel(h.at)}</small>
                      </div>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="empty-entry">Henüz karar kaydı yok.</p>
            )}
          </section>
          <div className="desk-links">
            <button onClick={() => go('reports')}>
              <Files />
              Plan raporları
              <ArrowUpRight />
            </button>
            <button onClick={() => go('methods')}>
              <BookOpenText />
              Karar Kitabı
              <ArrowUpRight />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
