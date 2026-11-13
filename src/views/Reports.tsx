import { useState } from 'react'
import { Button, Tabs, Select } from 'antd'
import {
  DownloadSimple,
  Printer,
  ListBullets,
  Files,
} from '@phosphor-icons/react'
import { freezeReports, report, type Plan } from '../domain'
import { download } from '../store'
export default function Reports({
  p,
  change,
  saved,
}: {
  p: Plan
  change: (f: (p: Plan) => Plan) => void
  saved: boolean
}) {
  const [kind, setKind] = useState<'executive' | 'action'>('executive')
  const [selected, select] = useState('')
  const pair = p.publications?.find((r) => r.id === selected)
  const content = pair?.[kind] ?? report(p, kind)
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
      <div className="report-version">
        <Select
          aria-label="Rapor sürümü"
          value={selected}
          onChange={select}
          options={[
            { value: '', label: 'Güncel taslak' },
            ...(p.publications || []).map((r) => ({
              value: r.id,
              label: 'Sabit sürüm ' + r.revision,
            })),
          ]}
        />
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
      </div>
      <Tabs
        activeKey={kind}
        onChange={(v) => setKind(v as typeof kind)}
        items={[
          { key: 'executive', label: 'Yönetici raporu' },
          { key: 'action', label: 'Girişimci aksiyon planı' },
        ]}
      />
      <div className="report-actions">
        <Button
          icon={<DownloadSimple />}
          onClick={() =>
            download(
              p.name +
                '-' +
                kind +
                '-v' +
                (pair?.revision ?? p.revision) +
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
        <article className="report-body">
          <header className="document-title">
            <Files size={26} />
            <div>
              <h2>{lines[0].replace(/^# /, '')}</h2>
              <p>{lines[1]}</p>
              <small>{lines[2]}</small>
            </div>
          </header>
          {lines.slice(3).map((line, i) =>
            line.startsWith('## ') ? (
              <h3 tabIndex={-1} id={'doc-section-' + (i + 3)} key={i}>
                {line.slice(3)}
              </h3>
            ) : (
              <p key={i}>{line}</p>
            ),
          )}
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
