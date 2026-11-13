import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Select } from 'antd'
import { init, use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { cash, money, activeSteps, complete, type Plan } from '../domain'
import { steps, stages } from '../data/steps'
use([BarChart, GridComponent, SVGRenderer])
const DataTable = lazy(() => import('./DataTable'))
type Bar = { label: string; short: string; value: number | null }
type ChartData = { title: string; unit: string; bars: Bar[] }
function charts(p: Plan): ChartData[] {
  const route = activeSteps(p),
    a = p.answers,
    free = a['00']?.mode === 'Ücretsiz hizmet'
  const value = (id: string, k: string) =>
    typeof a[id]?.[k] === 'number' ? (a[id][k] as number) : null
  const data = (id: string, fields: string[][]) =>
    fields.map(([key, label, short]) => ({
      label,
      short,
      value: value(id, key),
    }))
  return [
    {
      title: 'Karar başına tamamlanan adım',
      unit: 'adım',
      bars: stages.map((s, i) => ({
        label: s.name,
        short: String(i + 1),
        value: steps.filter(
          (step) =>
            step.stage === i && route.includes(step.id) && complete(p, step),
        ).length,
      })),
    },
    {
      title: 'Talep ve teslim kapasitesi',
      unit: 'adet',
      bars: data('09', [
        ['demand', 'Ulaşılabilir talep', 'Talep'],
        ['capacity', 'Teslim kapasitesi', 'Kapasite'],
      ]),
    },
    {
      title: 'Teklif ve gerçek davranış',
      unit: 'kişi',
      bars: data('15', [
        ['offered', 'Ulaşılan kişi', 'Teklif'],
        ['committed', 'Taahhüt veren', 'Taahhüt'],
        free
          ? ['attended', 'Hizmete katılan', 'Katılım']
          : ['paid', 'Ödeme yapan', 'Ödeme'],
      ]),
    },
    {
      title: 'Ödeme günü nakit durumu',
      unit: 'TL',
      bars: data('16', [
        ['balance', 'Ödeme günü kasadaki para', 'Kasa'],
        ['due', 'O gün ödenecek tutar', 'Ödeme'],
      ]),
    },
    {
      title: 'İlk teslimin sonucu',
      unit: 'kişi',
      bars: data('23', [
        ['total', 'Başlayan kişi', 'Başlayan'],
        ['completed', 'Yardımsız bitiren kişi', 'Bitiren'],
      ]),
    },
  ]
}
export default function Insights({ p, dark }: { p: Plan; dark: boolean }) {
  const [tableOpen, setTableOpen] = useState(false)
  const canvas = useRef<HTMLDivElement>(null),
    [index, setIndex] = useState(0)
  const datasets = useMemo(() => charts(p), [p]),
    chart = datasets[index],
    c = cash(p)
  const free = p.answers['00']?.mode === 'Ücretsiz hizmet',
    exists = chart.bars.some((b) => b.value !== null)
  useEffect(() => {
    const el = canvas.current
    if (!el || !exists) return
    const ch = init(el, undefined, { renderer: 'svg' }),
      css = getComputedStyle(el),
      ink = css.getPropertyValue('--muted').trim(),
      accent = css.getPropertyValue('--accent').trim()
    ch.setOption({
      animation: false,
      textStyle: { fontFamily: 'Outfit Variable, sans-serif', fontSize: 14 },
      grid: { top: 22, bottom: 35, left: 55, right: 12 },
      xAxis: {
        type: 'category',
        data: chart.bars.map((b) => b.short),
        axisLabel: { color: ink, fontSize: 14, interval: 0 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: ink, fontSize: 14 },
      },
      series: [
        {
          name: chart.unit,
          type: 'bar',
          data: chart.bars.map((b) => b.value),
          itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 44,
        },
      ],
    })
    const obs = new ResizeObserver(() => ch.resize())
    obs.observe(el)
    return () => {
      obs.disconnect()
      ch.dispose()
    }
  }, [chart, dark, exists])
  const stats = free
    ? [
        ['Ödeme günü açığı', money(c.gap)],
        [
          'Hizmet bütçesi',
          money(
            typeof p.answers['16']?.fund === 'number'
              ? p.answers['16'].fund
              : null,
          ),
        ],
        [
          'Hizmet gideri',
          money(
            typeof p.answers['16']?.serviceCost === 'number'
              ? p.answers['16'].serviceCost
              : null,
          ),
        ],
      ]
    : [
        ['Ödeme günü açığı', money(c.gap)],
        ['Sipariş katkısı', money(c.contribution)],
        [
          'Başabaş noktası',
          c.breakEven === null ? 'Bilinmiyor' : c.breakEven + ' sipariş',
        ],
      ]
  return (
    <>
      <div className="stat-grid">
        {stats.map(([label, value]) => (
          <div className="panel" key={label}>
            <small>{label}</small>
            <h2>{value}</h2>
          </div>
        ))}
      </div>
      <section className="panel">
        <label className="chart-select">
          <span>Gösterge seçin</span>
          <Select
            aria-label="Gösterge seçin"
            value={index}
            onChange={setIndex}
            options={datasets.map((d, i) => ({ label: d.title, value: i }))}
          />
        </label>
        <h2>{chart.title}</h2>
        {exists ? (
          <div className="chart" ref={canvas} aria-hidden="true" />
        ) : (
          <p className="empty-chart">Bu gösterge için ölçüm bekleniyor.</p>
        )}
        <details onToggle={(e) => setTableOpen(e.currentTarget.open)}>
          <summary>Grafik verisini oku</summary>
          {tableOpen && (
            <Suspense fallback={<p>Tablo açılıyor.</p>}>
              <DataTable bars={chart.bars} unit={chart.unit} />
            </Suspense>
          )}
        </details>
      </section>
    </>
  )
}
