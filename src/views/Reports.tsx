import { useEffect, useState } from 'react'
import { Button, Tabs, Select } from 'antd'
import {
  DownloadSimple,
  Printer,
  ListBullets,
  Files,
} from '@phosphor-icons/react'
import { foundation, foundationDoc } from '../readiness'
import { dateLabel, freezeReports, report, type Plan } from '../domain'
import './foundation.css'
import { download } from '../store'
export default function Reports({
  p,
  change,
  saved,
  initialFoundation,
  clearInitial,
}: {
  initialFoundation?: string
  clearInitial: () => void
  p: Plan
  change: (f: (p: Plan) => Plan) => void
  saved: boolean
}) {
  const [kind, setKind] = useState<'executive' | 'action' | 'foundation'>(
    initialFoundation !== undefined ? 'foundation' : 'executive',
  )
  useEffect(() => {
    if (initialFoundation !== undefined) clearInitial()
  }, [initialFoundation])
  const [selected, select] = useState(initialFoundation ?? '')
  const pair = p.publications?.find((r) => r.id === selected)
  const records = foundation(p).decisions
  const historic = records.find((d) => d.id === selected)
  const content =
    kind === 'foundation'
      ? (historic?.document ?? foundationDoc(p))
      : (pair?.[kind] ?? report(p, kind))
  const lines = content.split('\n\n')
  const outline = lines
    .map((text, index) => ({ text, index }))
    .filter((i) => i.text.startsWith('## '))
  function goToSection(index: number) {
    const h = document.getElementById('doc-section-' + index)
    h?.focus({ preventScroll: true })
    h?.scrollIntoView({ block: 'start' })
  }
  return (
    <section className="panel reports">
      <Tabs
        activeKey={kind}
        onChange={(v) => {
          setKind(v as typeof kind)
          select('')
        }}
        items={[
          { key: 'executive', label: 'Yönetici raporu' },
          { key: 'action', label: 'Girişimci aksiyon planı' },
          { key: 'foundation', label: 'Temel belgesi' },
        ]}
      />
      <div className="document-bar">
        <div className="report-version">
          <Select
            aria-label="Rapor sürümü"
            value={selected}
            onChange={select}
            options={[
              { value: '', label: 'Güncel taslak' },
              ...(kind === 'foundation'
                ? records.map((d) => ({
                    value: d.id,
                    label: dateLabel(d.at) + ' · ' + d.outcome,
                  }))
                : (p.publications || []).map((r) => ({
                    value: r.id,
                    label: 'Sabit sürüm ' + r.revision,
                  }))),
            ]}
          />
          {kind !== 'foundation' && (
            <Button
              disabled={!saved || !!pair}
              onClick={() => {
                const next = freezeReports(p)
                change(() => next)
                select(next.publications!.at(-1)!.id)
              }}
            >
              İki raporu sabitle
            </Button>
          )}
        </div>
        <div className="report-actions">
          <Button
            icon={<DownloadSimple />}
            onClick={() =>
              download(
                p.name +
                  '-' +
                  kind +
                  '-v' +
                  (historic?.id ?? pair?.revision ?? p.revision) +
                  '.md',
                content,
                'text/markdown;charset=utf-8',
              )
            }
          >
            Markdown indir
          </Button>
          <Button icon={<Printer />} onClick={() => window.print()}>
            Yazdır
          </Button>
        </div>
      </div>
      {outline.length > 0 && (
        <div className="report-jump">
          <ListBullets aria-hidden="true" size={18} />
          <Select<number>
            aria-label="Raporda bölüme git"
            placeholder="İçindekiler"
            value={undefined}
            onChange={(index) =>
              requestAnimationFrame(() => goToSection(index))
            }
            options={outline.map((o) => ({
              value: o.index,
              label: o.text.slice(3),
            }))}
          />
        </div>
      )}
      <div className="report-spread">
        <article
          className={
            kind === 'foundation'
              ? 'report-body foundation-document'
              : 'report-body'
          }
        >
          <header className="document-title">
            <Files size={26} />
            <div>
              <h2>{lines[0].replace(/^# /, '')}</h2>
              <p>{lines[1]}</p>
              <small>{lines[2]}</small>
            </div>
          </header>
          {lines.slice(3, outline[0]?.index ?? lines.length).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          {outline.map((section, i) => {
            const body = lines.slice(
              section.index + 1,
              outline[i + 1]?.index ?? lines.length,
            )
            return (
              <section
                className={
                  kind === 'foundation' && section.text === '## Ek belgeler'
                    ? 'report-section foundation-appendix'
                    : 'report-section'
                }
                key={section.index}
              >
                <h3 tabIndex={-1} id={'doc-section-' + section.index}>
                  {section.text.slice(3)}
                </h3>
                {kind === 'executive' && section.text === '## Kaynaklar' ? (
                  <dl className="report-balances">
                    {body.map((line, j) => {
                      const pivot = line.indexOf(': ')
                      return pivot < 0 ? (
                        <div key={j}>
                          <dt>{line}</dt>
                        </div>
                      ) : (
                        <div key={j}>
                          <dt>{line.slice(0, pivot)}</dt>
                          <dd>{line.slice(pivot + 2)}</dd>
                        </div>
                      )
                    })}
                  </dl>
                ) : (
                  body.map((line, j) => <p key={j}>{line}</p>)
                )}
              </section>
            )
          })}
        </article>
        <nav className="report-index" aria-label="Rapordaki bölümler">
          <h3>
            <ListBullets size={19} />
            İçindekiler
          </h3>
          {outline.map((item) => (
            <button key={item.index} onClick={() => goToSection(item.index)}>
              {item.text.slice(3)}
            </button>
          ))}
        </nav>
      </div>
    </section>
  )
}
