import { useState } from 'react'
import { Button, Tabs, Select } from 'antd'
import { DownloadSimple, Printer } from '@phosphor-icons/react'
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
      <article className="report-body">
        {content
          .split('\n\n')
          .map((line, i) =>
            line.startsWith('## ') ? (
              <h3 key={i}>{line.slice(3)}</h3>
            ) : line.startsWith('# ') ? (
              <h2 key={i}>{line.slice(2)}</h2>
            ) : (
              <p key={i}>{line}</p>
            ),
          )}
      </article>
    </section>
  )
}
