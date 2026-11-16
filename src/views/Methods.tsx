import { useState, lazy, Suspense } from 'react'
import { Input, Select, Collapse, Button } from 'antd'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { phaseCards } from '../phaseMethods'
import models from '../data/models.json'
const Help = lazy(() => import('./MethodHelp'))
export default function Methods({
  step,
  start,
}: {
  step?: string
  start?: (step: string) => void
}) {
  const [query, setQuery] = useState(''),
    [section, setSection] = useState(''),
    [opened, setOpened] = useState<string[]>([])
  const filtered = models.filter(
    (m) =>
      (!step || m.steps.includes(step)) &&
      (!section || m.section === section) &&
      (m.title + ' ' + m.advice)
        .toLocaleLowerCase('tr')
        .includes(query.toLocaleLowerCase('tr')),
  )
  return (
    <section
      className="panel methods"
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        const header = (e.target as HTMLElement)
          .closest('.ant-collapse-item')
          ?.querySelector<HTMLElement>('[aria-expanded="true"]')
        if (!header) return
        header.click()
        header.focus()
        e.stopPropagation()
      }}
    >
      <div className="filter-bar">
        <Input
          aria-label="Yöntem ara"
          allowClear
          prefix={<MagnifyingGlass />}
          placeholder="Yöntem ara"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          aria-label="Yöntem bölümü"
          value={section}
          onChange={setSection}
          options={['', ...new Set(models.map((m) => m.section))].map((v) => ({
            value: v,
            label: v || 'Tüm bölümler',
          }))}
        />
      </div>
      <p className="muted">{filtered.length} yöntem</p>
      {filtered.length ? (
        <Collapse
          activeKey={opened}
          onChange={(keys) =>
            setOpened((Array.isArray(keys) ? keys : [keys]).map(String))
          }
          items={filtered.map((m) => {
            const card = phaseCards.find(
              (c) => c.slug === m.slug && (!step || c.step === step),
            )
            return {
              key: m.slug,
              label: m.title,
              children: (
                <>
                  <b>{m.section}</b>
                  <p>{m.advice}</p>
                  {card && start && (
                    <Button onClick={() => start(card.step)}>
                      Bu yöntemi ilgili adımda aç
                    </Button>
                  )}
                  {m.hasGuide && opened.includes(m.slug) && (
                    <Suspense fallback={<p>Yardım açılıyor.</p>}>
                      <Help slug={m.slug} />
                    </Suspense>
                  )}
                  {!!m.steps.length && (
                    <small>İlgili adımlar: {m.steps.join(', ')}</small>
                  )}
                </>
              ),
            }
          })}
        />
      ) : (
        <p>Bu seçim için yöntem bulunamadı.</p>
      )}
    </section>
  )
}
