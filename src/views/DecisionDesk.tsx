import { useState, type ReactNode } from 'react'
import { Button, Drawer, Progress } from 'antd'
import {
  Path,
  ArrowRight,
  Wallet,
  CalendarBlank,
  ArrowsClockwise,
  Notebook,
  Flag,
} from '@phosphor-icons/react'
import {
  activeSteps,
  complete,
  approved,
  dateLabel,
  money,
  openGaps,
  recommend,
  type Plan,
} from '../domain'
import { stages, steps } from '../data/steps'
import './office.css'
export default function DecisionDesk({
  p,
  stage,
  setStage,
  review,
  openGap,
  children,
  indexPanel,
}: {
  indexPanel: ReactNode
  children: ReactNode
  p: Plan
  stage: number
  setStage: (s: number) => void
  review: () => void
  openGap: (step: string, key: string) => void
}) {
  const [drawer, show] = useState<'map' | 'evidence' | 'limits' | ''>('')
  const a = p.answers['02'],
    budget = a?.budget,
    spent = a?.spent,
    attempts = a?.attempts,
    end = a?.end
  const allowance =
    typeof budget === 'number' && typeof spent === 'number'
      ? budget - spent
      : null
  const budgetUsed =
    typeof spent === 'number' && typeof budget === 'number' && budget > 0
      ? Math.round((spent * 100) / budget)
      : null
  const used = p.history.filter(
    (h) => h.stage === stage && h.outcome === 'Yeniden deneyin',
  ).length
  const active = steps.filter(
      (s) => activeSteps(p).includes(s.id) && s.stage === stage,
    ),
    filled = active.filter((s) => complete(p, s)).length
  const advice = recommend(p, stage),
    gaps = openGaps(p, stage),
    evidence = p.evidence.filter(
      (e) => steps.find((s) => s.id === e.step)?.stage === stage,
    )
  return (
    <>
      <section className="case-mast">
        <div className="case-id">
          <Flag size={17} />
          <span>Karar {String(stage + 1).padStart(2, '0')} / 08</span>
        </div>
        <div>
          <h2>{stages[stage].name}</h2>
          <p>{stages[stage].question}</p>
        </div>
        <button
          className="case-map"
          aria-label="Karar haritasını aç"
          onClick={() => show('map')}
        >
          <Path size={18} />
          <span className="long-map-label">Karar haritasını aç</span>
          <span className="short-map-label">Harita</span>
          <ArrowRight size={16} />
        </button>
      </section>
      {indexPanel}
      {children}
      <aside className="desk-side">
        <button className="limits-toggle" onClick={() => show('limits')}>
          <Wallet size={18} /> Kaynak sınırları{' '}
          <b>{allowance === null ? 'Yazılmadı' : money(allowance)}</b>
          <ArrowRight size={16} />
        </button>
        <div className="limits-strip">
          <div className="budget-face">
            <div>
              <Wallet size={18} />
              <span>Kalan bütçe</span>
            </div>
            <strong>{money(allowance)}</strong>
            {budgetUsed !== null && (
              <>
                <div className="budget-track" aria-hidden="true">
                  <i
                    style={{
                      width: Math.min(100, Math.max(0, budgetUsed)) + '%',
                    }}
                  />
                </div>
                <small>%{budgetUsed} kullanıldı</small>
              </>
            )}
          </div>
          <dl className="resource-ledger">
            <div>
              <dt>
                <ArrowsClockwise size={16} /> Kalan deneme
              </dt>
              <dd>
                {typeof attempts === 'number'
                  ? Math.max(
                      0,
                      (stage === 5 ? Math.min(3, attempts) : attempts) - used,
                    )
                  : 'Yazılmadı'}
              </dd>
            </div>
            <div>
              <dt>
                <CalendarBlank size={16} /> Bitiş tarihi
              </dt>
              <dd>
                {typeof end === 'string' && end ? dateLabel(end) : 'Yazılmadı'}
              </dd>
            </div>
          </dl>
        </div>
        <div className="desk-review">
          <h3>Karar önerisi</h3>
          <div>
            <Flag size={19} />
            <strong>{advice.outcome}</strong>
          </div>
          <p>{advice.reason}</p>
          <Button onClick={review}>Kararı değerlendir</Button>
          <Button
            type="text"
            icon={<Notebook />}
            onClick={() => show('evidence')}
          >
            Dayanaklar ({evidence.length})
          </Button>
        </div>
      </aside>
      <Drawer
        open={!!drawer}
        title={
          drawer === 'map'
            ? 'Karar haritası'
            : drawer === 'limits'
              ? 'Kaynak sınırları'
              : 'Kararın dayanakları'
        }
        size="min(100vw, 480px)"
        onClose={() => show('')}
      >
        {drawer === 'limits' ? (
          <dl className="ops-dl">
            <dt>Kalan bütçe</dt>
            <dd>{money(allowance)}</dd>
            <dt>Kalan deneme</dt>
            <dd>
              {typeof attempts === 'number'
                ? Math.max(
                    0,
                    (stage === 5 ? Math.min(3, attempts) : attempts) - used,
                  )
                : 'Yazılmadı'}
            </dd>
            <dt>Bitiş tarihi</dt>
            <dd>
              {typeof end === 'string' && end ? dateLabel(end) : 'Yazılmadı'}
            </dd>
          </dl>
        ) : drawer === 'map' ? (
          <ol className="map-list">
            {stages.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => {
                    setStage(i)
                    show('')
                  }}
                >
                  <b>
                    {i + 1}. {s.name}
                  </b>
                  <small>
                    {approved(p, i)
                      ? 'Onaylandı'
                      : i === stage
                        ? 'Seçili karar'
                        : 'İncele'}
                  </small>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <h3>Adım ilerlemesi</h3>
            <Progress
              percent={
                active.length ? Math.round((100 * filled) / active.length) : 0
              }
            />
            <p>
              {filled} / {active.length} adım tamamlandı.
            </p>
            <h3 className="inspect-title">Bağlı kanıtlar</h3>
            {evidence.length ? (
              evidence.map((e) => (
                <p className="audit-row" key={e.id}>
                  <b>{e.title}</b>
                  <br />
                  {e.source}
                </p>
              ))
            ) : (
              <p>Bu kararda kayıtlı kanıt yok.</p>
            )}
            <h3 className="inspect-title">Açık alanlar</h3>
            {gaps.length ? (
              gaps.map((g) => (
                <button
                  className="gap-button"
                  key={g.value}
                  onClick={() => {
                    show('')
                    openGap(g.step, g.value.split('.')[1])
                  }}
                >
                  {g.label}
                  <ArrowRight />
                </button>
              ))
            ) : (
              <p>Açık alan yok.</p>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}
