import { lazy, Suspense, useState } from 'react'
import { Button, Input, Radio, Select } from 'antd'
import {
  BookOpen,
  CaretDown,
  ChartBar,
  ClipboardText,
  Fingerprint,
  MagnifyingGlass,
  Scales,
  ShieldCheck,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { catalog, groups, type ModuleId, type Scope } from './catalog'
import { useModulePlan } from './useModulePlan'
import './module-plan.css'

const Guide = lazy(() => import('./ModuleGuide'))
const icons = {
  plan: ClipboardText,
  karar: Scales,
  rapor: ChartBar,
  erisim: Fingerprint,
  denetim: ShieldCheck,
  esitleme: ArrowsClockwise,
}
const metrics = [
  [catalog.modules.length, 'Ana modül'],
  [
    catalog.modules.reduce((n, m) => n + m.records.length, 0),
    'Planlanan kayıt türü',
  ],
  [
    catalog.modules
      .flatMap((m) => m.features)
      .filter((f) => f.state === 'Koşullu ek').length,
    'Koşullu ek',
  ],
] as const

export default function ModulePlanView() {
  const vm = useModulePlan()
  const [guide, setGuide] = useState(false)
  function showModule(id: ModuleId) {
    setGuide(false)
    vm.reveal(id)
  }
  return (
    <div className="module-plan">
      <div className="module-overview">
        <dl>
          {metrics.map(([n, label]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{n}</dd>
            </div>
          ))}
        </dl>
        <Button
          icon={<BookOpen aria-hidden="true" size={18} />}
          aria-expanded={guide}
          aria-controls="module-guide"
          onClick={() => setGuide(!guide)}
        >
          Mimari rehberi {guide ? 'kapat' : 'aç'}
        </Button>
      </div>
      <div id="module-guide">
        {guide && (
          <Suspense fallback={<p role="status">Rehber açılıyor.</p>}>
            <Guide reveal={showModule} />
          </Suspense>
        )}
      </div>
      <div className="module-directory">
        <div className="module-filters">
          <Input
            type="search"
            prefix={<MagnifyingGlass aria-hidden="true" />}
            aria-label="Modül veya özellik ara"
            placeholder="Modül veya özellik ara"
            allowClear
            value={vm.query}
            onChange={(e) => vm.setQuery(e.target.value)}
          />
          <Select
            aria-label="Modül kategorisi"
            value={vm.group}
            onChange={vm.setGroup}
            options={[
              { value: '', label: 'Tüm kategoriler' },
              ...groups.map((value) => ({ value, label: value })),
            ]}
          />
          <Radio.Group
            aria-label="Özellik kapsamı"
            optionType="button"
            value={vm.scope}
            onChange={(e) => vm.setScope(e.target.value as Scope)}
            options={[
              { value: 'tumu', label: 'Tümü' },
              { value: 'temel', label: 'Temel' },
              { value: 'kosullu', label: 'Koşullu' },
            ]}
          />
        </div>
        <div className="module-count" role="status">
          {vm.matches.length} modül listeleniyor.
        </div>
        {vm.matches.length === 0 && (
          <div className="module-empty">
            <p>Eşleşen özellik bulunamadı.</p>
            <Button onClick={vm.reset}>Filtreleri temizle</Button>
          </div>
        )}
        {groups.map((group) => {
          const items = vm.matches.filter((m) => m.group === group)
          if (!items.length) return null
          return (
            <section key={group} className="module-group" aria-label={group}>
              <h2>{group}</h2>
              {items.map((m) => {
                const Icon = icons[m.id]
                const open = vm.expanded === m.id
                return (
                  <details key={m.id} data-module={m.id} open={open}>
                    <summary
                      id={'module-' + m.id}
                      aria-expanded={open}
                      onClick={(e) => {
                        e.preventDefault()
                        vm.toggle(m.id)
                      }}
                    >
                      <span className="module-icon">
                        <Icon aria-hidden="true" size={23} weight="duotone" />
                      </span>
                      <span className="module-title">
                        <strong>{m.title}</strong>
                        <span>{m.purpose}</span>
                      </span>
                      <CaretDown
                        className="module-caret"
                        aria-hidden="true"
                        size={18}
                      />
                    </summary>
                    <div className="module-content">
                      <section>
                        <h3>Modülün özellikleri</h3>
                        <ul className="module-features">
                          {m.features.map((f) => (
                            <li key={f.id}>
                              <div>
                                <strong>{f.title}</strong>
                                <span
                                  className={
                                    'module-state' +
                                    (f.state === 'Ön yüzde var'
                                      ? ' present'
                                      : '')
                                  }
                                >
                                  {f.state}
                                </span>
                              </div>
                              <p>{f.detail}</p>
                            </li>
                          ))}
                        </ul>
                      </section>
                      <aside>
                        <h3>Planlanan kayıt türleri</h3>
                        <ul className="module-records">
                          {m.records.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                        <h3>Diğer modüllerle bağlantı</h3>
                        <ul className="module-contracts">
                          {m.contracts.map((c) => (
                            <li key={c.other}>
                              <strong>
                                {
                                  catalog.modules.find((o) => o.id === c.other)!
                                    .title
                                }
                              </strong>
                              <p>{c.use}</p>
                            </li>
                          ))}
                        </ul>
                      </aside>
                    </div>
                  </details>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
