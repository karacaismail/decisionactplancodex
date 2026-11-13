import { Button } from 'antd'
import {
  Buildings,
  ClipboardText,
  Briefcase,
  ArrowRight,
  ArrowUpRight,
  Check,
  Flag,
  Path,
  Stack,
  Notebook,
  Files,
  MapTrifold,
  ClockCounterClockwise,
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
import { steps, stages } from '../data/steps'
import CompassArt from '../ui/CompassArt'
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
    done = steps.filter((s) => active.includes(s.id) && complete(p, s)).length
  const approvedCount = stages.filter((_, i) => approved(p, i)).length
  return (
    <>
      <div className="dashboard-hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="signal" />{' '}
            {approvedCount === 8 ? 'Son karar' : 'Açık karar'}
            <span className="hero-divider" />{' '}
            {String(stage + 1).padStart(2, '0')} / 08
          </div>
          <h2>{stages[stage].name}</h2>
          <p>{stages[stage].question}</p>
          <Button onClick={() => openStage(stage)} className="hero-button">
            Kararı incele <ArrowRight size={17} />
          </Button>
        </div>
        <CompassArt stage={stage} />
      </div>
      <div className="stat-grid">
        {[
          {
            title: 'Karar ilerlemesi',
            value: String(approvedCount),
            unit: '/ 8',
            note: 'Onaylanan karar',
            icon: Flag,
            tone: 'orange',
            page: 'editor',
          },
          {
            title: 'Plan adımları',
            value: String(done),
            unit: '/ ' + active.length,
            note: 'Tamamlanan adım',
            icon: Path,
            tone: 'teal',
            page: 'editor',
          },
          {
            title: 'Kanıt defteri',
            value: String(p.evidence.length),
            unit: 'kayıt',
            note: 'Kaynağı yazılan kanıt',
            icon: Notebook,
            tone: 'purple',
            page: 'evidence',
          },
        ].map(({ title, value, unit, note, icon: Icon, tone, page }) => (
          <button className="stat" key={title} onClick={() => go(page as Page)}>
            <span className={'icon-tile ' + tone}>
              <Icon size={21} />
            </span>
            <span className="stat-label">{title}</span>
            <div className="stat-number">
              {value}
              <span>{unit}</span>
            </div>
            <small>{note}</small>
          </button>
        ))}
      </div>
      <div className="workspace-launch">
        {[
          {
            page: 'portfolio',
            title: 'Plan portföyü',
            detail: 'Planları karşılaştır',
            icon: Briefcase,
          },
          {
            page: 'work',
            title: 'Görevler',
            detail: 'Sorumluları ve teslimleri izle',
            icon: ClipboardText,
          },
          {
            page: 'team',
            title: 'Kurum alanı',
            detail: 'Üyeleri ve yetkileri yönet',
            icon: Buildings,
          },
        ].map(({ page, title, detail, icon: Icon }) => (
          <button key={page} onClick={() => go(page as Page)}>
            <span className="icon-tile teal">
              <Icon size={20} />
            </span>
            <span>
              <b>{title}</b>
              <small>{detail}</small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel route-panel">
          <div className="section-head">
            <div>
              <h2>Karar rotası</h2>
              <p>Kararları sırayla inceleyin.</p>
            </div>
            <MapTrifold size={24} />
          </div>
          <ol className="stage-list">
            {stages.map((s, i) => {
              const passed = approved(p, i),
                here = i === stage && !passed
              return (
                <li
                  key={s.name}
                  className={passed ? 'done' : here ? 'current' : ''}
                >
                  <button onClick={() => openStage(i)}>
                    <span className="stage-dot">
                      {passed ? (
                        <Check size={15} weight="bold" />
                      ) : (
                        String(i + 1).padStart(2, '0')
                      )}
                    </span>
                    <span className="stage-name">
                      {s.name}
                      {here && <small className="inline-state">Açık</small>}
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
        <div className="aside-stack">
          <section className="panel">
            <div className="section-head">
              <h2>Son kararlar</h2>
              <ClockCounterClockwise size={23} />
            </div>
            {p.history.length ? (
              <ul className="activity">
                {p.history
                  .slice(-3)
                  .reverse()
                  .map((h) => (
                    <li key={h.id}>
                      <span className="activity-glyph">
                        <Check size={15} />
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
              </ul>
            ) : (
              <p>İlk karar kaydedilince burada görünür.</p>
            )}
          </section>
          <button className="report-shortcut" onClick={() => go('reports')}>
            <span className="icon-tile teal">
              <Files size={24} />
            </span>
            <span>
              <b>Plan raporları</b>
              <small>Yönetici özeti ve iş listesi</small>
            </span>
            <ArrowRight size={20} />
          </button>
          <button className="text-link" onClick={() => go('methods')}>
            <Stack size={17} /> Karar Kitabı’nı aç <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </>
  )
}
