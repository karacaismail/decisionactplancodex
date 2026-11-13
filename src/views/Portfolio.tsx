import { useState } from 'react'
import { Button, Checkbox, Input, Select } from 'antd'
import {
  ArrowRight,
  Briefcase,
  Scales,
  FunnelSimple,
  Stack,
} from '@phosphor-icons/react'
import {
  cash,
  currentStage,
  money,
  recommend,
  approved,
  type Plan,
} from '../domain'
import { stages } from '../data/steps'
import { activeWork } from '../operations'
import './office.css'
export default function Portfolio({
  plans,
  open,
  canRefresh,
  refresh,
}: {
  plans: Plan[]
  canRefresh: boolean
  refresh: () => Promise<void>
  open: (p: Plan) => void
}) {
  const [notice, notify] = useState('')
  const [q, search] = useState(''),
    [scope, setScope] = useState('all'),
    [ids, choose] = useState<string[]>([])
  const rows = plans.map((p) => ({
      p,
      stage: currentStage(p),
      tasks: activeWork(p).length,
      advice: recommend(p, currentStage(p)),
    })),
    shown = rows.filter(
      (r) =>
        r.p.name.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')) &&
        (scope === 'all' ||
          (scope === 'real' ? !r.p.example : r.advice.outcome === scope)),
    ),
    comparison = rows.filter((r) => ids.includes(r.p.id))
  return (
    <>
      <section className="portfolio-metrics" aria-label="Portföy özeti">
        {[
          {
            label: 'Gerçek plan',
            value: rows.filter((r) => !r.p.example).length,
            icon: Briefcase,
          },
          {
            label: 'Örnek plan',
            value: rows.filter((r) => r.p.example).length,
            icon: Stack,
          },
          {
            label: 'Gerçek planlarda açık görev',
            value: rows.reduce((n, r) => n + (r.p.example ? 0 : r.tasks), 0),
            icon: Scales,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <span>
              <Icon size={17} />
              {label}
            </span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Plan listesi</h2>
            <p>Karşılaştırmak için iki plan seçin.</p>
          </div>
          <Button
            disabled={!canRefresh}
            onClick={async () => {
              try {
                await refresh()
                notify('Liste güncellendi.')
              } catch (e) {
                notify((e as Error).message)
              }
            }}
          >
            Listeyi yenile
          </Button>
        </div>
        {notice && <p role="status">{notice}</p>}
        <div className="ops-filters">
          <Input.Search
            placeholder="Plan adı ara"
            aria-label="Plan adı ara"
            value={q}
            onChange={(e) => search(e.target.value)}
          />
          <Select
            aria-label="Planları süz"
            value={scope}
            onChange={setScope}
            options={[
              ['all', 'Bütün planlar'],
              ['real', 'Gerçek planlar'],
              ['Bekletin', 'Bekletme önerisi'],
              ['Durdurun', 'Durdurma önerisi'],
            ].map(([value, label]) => ({ value, label }))}
          />
        </div>
        {shown.map(({ p, stage, advice }) => (
          <div className="portfolio-row" key={p.id}>
            <Checkbox
              aria-label={p.name + ' karşılaştır'}
              checked={ids.includes(p.id)}
              disabled={ids.length >= 2 && !ids.includes(p.id)}
              onChange={(e) =>
                choose(
                  e.target.checked
                    ? [...ids, p.id]
                    : ids.filter((v) => v !== p.id),
                )
              }
            />
            <div>
              <h3>{p.name}</h3>
              <small>
                {p.example ? 'Örnek plan · ' : ''}
                {stages[stage].name}
              </small>
            </div>
            <span
              className="office-chip"
              data-tone={
                advice.outcome === 'Durdurun'
                  ? 'negative'
                  : advice.outcome === 'Bekletin'
                    ? 'warning'
                    : advice.outcome === 'İlerleyin'
                      ? 'positive'
                      : undefined
              }
            >
              {advice.outcome}
            </span>
            <Button onClick={() => open(p)}>
              Planı aç <ArrowRight />
            </Button>
          </div>
        ))}
        {!shown.length && (
          <div className="office-empty">
            <FunnelSimple size={26} />
            <p>Bu seçimde plan yok.</p>
          </div>
        )}
      </section>
      {comparison.length > 0 && (
        <section className="panel compare">
          <div className="office-heading">
            <Scales size={24} />
            <h2>Plan karşılaştırması</h2>
          </div>
          <div className="compare-grid">
            {comparison.map(({ p, tasks, advice }) => (
              <article key={p.id}>
                <h3>{p.name}</h3>
                <dl className="ops-dl">
                  <dt>Onaylanan karar</dt>
                  <dd>{stages.filter((_, i) => approved(p, i)).length} / 8</dd>
                  <dt>Nakit açığı</dt>
                  <dd>{money(cash(p).gap)}</dd>
                  <dt>Açık görev</dt>
                  <dd>{tasks}</dd>
                  <dt>Önerinin dayanağı</dt>
                  <dd>{advice.reason}</dd>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
