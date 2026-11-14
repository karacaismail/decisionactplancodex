import { methods } from '../preparationMethods'
import {
  sourceLink,
  dossierDoc,
  comparison,
  compareColumns,
  routeLabels,
} from '../dossier'
import { useEffect, useState } from 'react'
import { Button, Select } from 'antd'
import {
  DownloadSimple,
  Printer,
  ListBullets,
  Files,
} from '@phosphor-icons/react'
import { access, foundation, foundationDoc } from '../readiness'
import { dateLabel, freezeReports, report, type Plan } from '../domain'
import './foundation.css'
import { download } from '../store'
const reportTypes = [
  ['executive', 'Yönetici raporu'],
  ['action', 'Girişimci aksiyon planı'],
  ['foundation', 'Temel belgesi'],
  ['dossier', 'Strateje devir raporu'],
] as const
export default function Reports({
  p,
  change,
  saved,
  initialFoundation,
  initialDossier,
  visit,
  openProof,
  clearInitial,
}: {
  initialFoundation?: string
  initialDossier?: string
  visit: (id: string) => void
  openProof: (id: string) => void
  clearInitial: () => void
  p: Plan
  change: (f: (p: Plan) => Plan) => void
  saved: boolean
}) {
  const [kind, setKind] = useState<
    'executive' | 'action' | 'foundation' | 'dossier'
  >(
    initialDossier !== undefined
      ? 'dossier'
      : initialFoundation !== undefined
        ? 'foundation'
        : 'executive',
  )
  useEffect(() => {
    if (initialFoundation !== undefined || initialDossier !== undefined)
      clearInitial()
  }, [initialFoundation, initialDossier])
  const [selected, select] = useState(initialDossier ?? initialFoundation ?? '')
  const pair = p.publications?.find((r) => r.id === selected)
  const records = foundation(p).decisions
  const historic = records.find((d) => d.id === selected)
  const content =
    kind === 'dossier'
      ? historic
        ? (historic.dossier ??
          '# Strateje devir raporu\n\n' +
            p.name +
            '\n\nBu eski kararda devir raporu saklanmadı.')
        : dossierDoc(p)
      : kind === 'foundation'
        ? (historic?.document ?? foundationDoc(p))
        : (pair?.[kind] ?? report(p, kind))
  const sourceSteps: Record<string, string[]> = {
    ...Object.fromEntries(methods.map((m) => [m.title, m.steps])),
    'Stratej hangi kararı verecek?': ['17', '15'],
    'Açık kararlar': ['17', '11'],
    'Durum özeti': ['04', '09', '12', '16', '17'],
    'Stratejin önce inceleyeceği konu': ['07', '10', '15', '17'],
    'Amaç ve sınırlar': ['01', '02'],
    'Sorun, müşteri ve pazar': ['05', '08', '09', '13'],
    'Kaynaklar ve para hesabı': ['12', '16'],
    'Aday yolların karşılaştırması': ['11'],
    'İddialar ve karşı bulgular': ['17'],
    'Varsayımlar ve denemeler': ['10', '15', '17'],
    'Koşullar değişirse': ['04', '17'],
    'Riskler ve sonraki deneme': ['17'],
    'Kararlar ve dayanaklar': ['17'],
  }
  const paths =
    kind === 'dossier'
      ? historic
        ? (historic.comparison ?? [])
        : comparison(p)
      : []
  const permission = kind === 'dossier' && historic ? access(p) : undefined
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
      {kind === 'dossier' && (
        <div className="dossier-intro">
          <small>
            {historic ? 'Karar günündeki devir' : 'Strateje devir taslağı'}
          </small>
          <h2>{lines[4] || 'Bu karar için kayıtlı devir sorusu yok.'}</h2>
          {historic && (
            <p>
              {permission?.last?.id === historic.id
                ? permission.reason
                : 'Bu karar geçmişte kaldı.'}
            </p>
          )}
          {lines[5] && <p>{lines[5]}</p>}
          {lines[6] && <p>{lines[6]}</p>}
          {lines
            .slice(7, outline[1]?.index)
            .filter((line) => line.startsWith('Kanıt bekleyen taahhüt:'))
            .map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          {lines[5]?.startsWith('Geçiş kararı bekleniyor') &&
            lines[7]?.startsWith('Karar sahibi:') && <p>{lines[7]}</p>}
        </div>
      )}
      <div className="report-types" role="tablist" aria-label="Rapor türü">
        {reportTypes.map(([key, label], i) => (
          <Button
            key={key}
            id={'report-tab-' + key}
            role="tab"
            aria-controls="report-document"
            aria-selected={kind === key}
            tabIndex={kind === key ? 0 : -1}
            type={kind === key ? 'primary' : 'default'}
            onClick={() => {
              setKind(key)
              select('')
            }}
            onKeyDown={(e) => {
              const next = (
                {
                  ArrowLeft: (i + 3) % 4,
                  ArrowRight: (i + 1) % 4,
                  Home: 0,
                  End: 3,
                } as Record<string, number>
              )[e.key]
              if (next === undefined) return
              e.preventDefault()
              const value = reportTypes[next][0]
              setKind(value)
              select('')
              document.getElementById('report-tab-' + value)?.focus()
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="document-bar">
        <div className="report-version">
          <Select
            aria-label="Rapor sürümü"
            value={selected}
            onChange={select}
            options={[
              { value: '', label: 'Güncel taslak' },
              ...(kind === 'foundation' || kind === 'dossier'
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
          {kind !== 'foundation' && kind !== 'dossier' && (
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
      {kind === 'dossier' && paths.length > 0 && (
        <details className="step-help dossier-compare">
          <summary>Yolları yan yana incele</summary>
          <div className="dossier-grid">
            {paths.map((r, i) => (
              <section key={i}>
                <h3>{r.name}</h3>
                <dl>
                  {compareColumns.map((k) => (
                    <div key={k}>
                      <dt>{routeLabels[k]}</dt>
                      <dd>{r.values[k]}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </details>
      )}
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
      <div
        className="report-spread"
        id="report-document"
        role="tabpanel"
        aria-labelledby={'report-tab-' + kind}
      >
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
                {kind === 'dossier' && !historic && (
                  <div className="dossier-source-links">
                    {(sourceSteps[section.text.slice(3)] ?? ['11']).map(
                      (id) => (
                        <Button
                          size="small"
                          type="link"
                          key={id}
                          onClick={() => visit(id)}
                        >
                          {id}. adımın kaydını aç
                        </Button>
                      ),
                    )}
                  </div>
                )}
                {kind === 'dossier' &&
                  !historic &&
                  section.text === '## İddialar ve karşı bulgular' && (
                    <div className="dossier-source-links">
                      {p.foundation?.brief?.claims?.flatMap((c) =>
                        [c.support, c.counter]
                          .filter(
                            (id) => id && p.evidence.some((e) => e.id === id),
                          )
                          .map((id) => (
                            <Button
                              key={c.id + id}
                              onClick={() => openProof(id)}
                            >
                              {c.text || 'İddia'} ·{' '}
                              {p.evidence.find((e) => e.id === id)?.title}
                            </Button>
                          )),
                      )}
                    </div>
                  )}
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
                  body.map((line, j) => {
                    const link =
                      kind === 'dossier' ? sourceLink(p, line) : undefined
                    const text =
                      kind === 'dossier'
                        ? line
                            .replace(/^<a id="kanit-[0-9a-f-]+"><\/a>/, '')
                            .replace(
                              / \[Kanıt kaydı\]\(#kanit-[0-9a-f-]+\)$/,
                              '',
                            )
                        : line
                    return (
                      <p key={j}>
                        {text}
                        {link && !historic && (
                          <Button
                            type="link"
                            onClick={() => openProof(link.id)}
                          >
                            Kanıt kaydını aç
                          </Button>
                        )}
                      </p>
                    )
                  })
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
