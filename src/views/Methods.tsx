import { useState } from 'react'
import { Input, Select, Collapse } from 'antd'
import { MagnifyingGlass } from '@phosphor-icons/react'
import models from '../data/models.json'
export default function Methods({ step }: { step?: string }) {
  const [query, setQuery] = useState(''),
    [section, setSection] = useState('')
  const filtered = models.filter(
    (m) =>
      (!step || m.steps.includes(step)) &&
      (!section || m.section === section) &&
      (m.title + ' ' + m.advice)
        .toLocaleLowerCase('tr')
        .includes(query.toLocaleLowerCase('tr')),
  )
  return (
    <section className="panel methods">
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
          items={filtered.map((m) => ({
            key: m.slug,
            label: m.title,
            children: (
              <>
                <b>{m.section}</b>
                <p>{m.advice}</p>
                {!!m.steps.length && (
                  <small>İlgili adımlar: {m.steps.join(', ')}</small>
                )}
              </>
            ),
          }))}
        />
      ) : (
        <p>Bu seçim için yöntem bulunamadı.</p>
      )}
    </section>
  )
}
