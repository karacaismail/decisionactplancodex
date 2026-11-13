import { useState } from 'react'
import { Button, Drawer, Progress } from 'antd'
import {
  Path,
  ArrowRight,
  Wallet,
  CalendarBlank,
  ArrowsClockwise,
  Notebook,
  CheckCircle,
  Compass,
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
}: {
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
      <section className="desk-banner">
        <div className="desk-intro">
          <div className="office-kicker">
            <Compass size={18} /> Karar dosyası{' '}
            <span>{String(stage + 1).padStart(2, '0')} / 08</span>
          </div>
          <h2>{stages[stage].name}</h2>
          <p>{stages[stage].summary}</p>
          <button
            className="resume-step"
            onClick={() => {
              const el = document.getElementById('active-question')
              el?.focus({ preventScroll: true })
              el?.scrollIntoView({ block: 'start' })
            }}
          >
            Adıma devam et <ArrowRight size={17} />
          </button>
        </div>
        <div className="desk-map">
          <div className="mini-route" aria-label="Sekiz karar">
            {stages.map((s, i) => (
              <button
                aria-label={i + 1 + '. kararı aç: ' + s.name}
                title={s.name}
                aria-current={i === stage ? 'step' : undefined}
                className={approved(p, i) ? 'complete' : ''}
                key={s.name}
                onClick={() => setStage(i)}
              >
                {approved(p, i) ? <CheckCircle size={17} /> : i + 1}
              </button>
            ))}
          </div>
          <button className="map-link" onClick={() => show('map')}>
            <Path size={17} /> Karar haritasını aç <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <aside className="desk-side">
        <button className="limits-toggle" onClick={() => show('limits')}>
          <Wallet size={18} /> Kaynak sınırları{' '}
          <b>{allowance === null ? 'Yazılmadı' : money(allowance)}</b>
          <ArrowRight size={16} />
        </button>
        <div className="limits-strip">
          {[
            {
              icon: Wallet,
              label: 'Kalan bütçe',
              value: allowance === null ? 'Yazılmadı' : money(allowance),
            },
            {
              icon: ArrowsClockwise,
              label: 'Kalan deneme',
              value:
                typeof attempts === 'number'
                  ? String(
                      Math.max(
                        0,
                        (stage === 5 ? Math.min(3, attempts) : attempts) - used,
                      ),
                    )
                  : 'Yazılmadı',
            },
            {
              icon: CalendarBlank,
              label: 'Bitiş tarihi',
              value:
                typeof end === 'string' && end ? dateLabel(end) : 'Yazılmadı',
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <Icon size={19} />
              <span>
                <small>{label}</small>
                <b>{value}</b>
              </span>
            </div>
          ))}
        </div>
        <div className="desk-review">
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
