import { Alert, Progress, Tag } from 'antd'
import { cash, money, type Plan } from '../domain'

const number = (x: unknown) => (typeof x === 'number' ? x : null)
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}
export default function StepSummary({ p, id }: { p: Plan; id: string }) {
  const a = p.answers[id] || {},
    profile = p.answers['00'] || {},
    free = profile.mode === 'Ücretsiz hizmet',
    c = cash(p)
  if (id === '06' || id === '15') {
    const interview = id === '06',
      market = profile.buyer === 'İki taraflı pazar',
      service = profile.product === 'Hizmet'
    const targets: Record<string, number> = {
      Tüketici: 15,
      İşletme: 10,
      'Kamu veya büyük kurum': 6,
      'İki taraflı pazar': 10,
    }
    const observed = Array.isArray(a.interviews)
      ? new Set(
          (a.interviews as Record<string, string>[])
            .map((row) => row['Kişi veya kod']?.trim().toLocaleLowerCase('tr'))
            .filter(Boolean),
        ).size
      : 0
    const target = interview
      ? Math.max(targets[String(profile.buyer)] || 0, service ? 10 : 0)
      : number(a.threshold)
    const total = interview ? observed : number(a.committed)
    const demand = free
      ? 'Katılım eşiğini ve bütçe dayanağını önceden yazın.'
      : profile.product === 'Fiziksel ürün'
        ? 'Başlangıç önerisi en az 5 ön sipariş veya depozitodur.'
        : profile.product === 'Donanım'
          ? 'Başlangıç önerisi en az 2 niyet mektubudur.'
          : service
            ? 'Başlangıç önerisi en az 3 ödeyen müşteridir.'
            : market
              ? 'İlk tarafta 10 kayıt, diğer tarafta 3 ödeme izleyin.'
              : profile.buyer === 'Tüketici'
                ? '100 ziyaretçide 3 ön kayıt ve en az 3 ön ödeme izleyin.'
                : profile.buyer === 'İşletme'
                  ? 'En az 3 yetkili niyet mektubu veya ücretli deneme arayın.'
                  : 'En az 1 imzalı kurum denemesi arayın.'
    return (
      <aside className="step-summary">
        <h3>{interview ? 'Görüşme ilerlemesi' : 'Yazılı taahhüt eşiği'}</h3>
        <p>
          {interview
            ? market
              ? 'Her tarafta en az 10 farklı kişiyle başlayın.'
              : 'Başlangıç sayısını seçtiğiniz müşteri grubu belirler.'
            : demand}
        </p>
        {target !== null && target > 0 && total !== null ? (
          <>
            <b>
              {total} / {target} kişi
            </b>
            <Progress
              percent={Math.min(100, Math.round((100 * total) / target))}
              showInfo={false}
            />
          </>
        ) : (
          <small>Ölçüm için sayı bekleniyor.</small>
        )}
      </aside>
    )
  }
  if (id === '16')
    return (
      <aside className="step-summary">
        <h3>Ödeme günü hesabı</h3>
        <div className="live-stats">
          <Stat label="Nakit açığı" value={money(c.gap)} />
          {free ? (
            <Stat label="Hizmet kaynağı" value={money(number(a.fund))} />
          ) : (
            <>
              <Stat label="Sipariş katkısı" value={money(c.contribution)} />
              <Stat
                label="Başabaş noktası"
                value={
                  c.breakEven === null ? 'Bilinmiyor' : c.breakEven + ' sipariş'
                }
              />
            </>
          )}
        </div>
      </aside>
    )
  if (id === '10' && a.impact && a.strength)
    return (
      <Alert
        type={
          Number(a.impact) >= 4 && Number(a.strength) <= 2 ? 'warning' : 'info'
        }
        title={
          Number(a.impact) >= 4 && Number(a.strength) <= 2
            ? 'Bu varsayımı önce sınayın.'
            : 'Varsayım kayda alındı.'
        }
        description={
          'Etki ' + a.impact + ' / 5. Kanıt gücü ' + a.strength + ' / 5.'
        }
      />
    )
  if (id === '07')
    return (
      <aside className="step-summary">
        <h3>Sorunun üç kanıtı</h3>
        <div className="proof-tags">
          {[
            ['repeat', 'Tekrar'],
            ['effort', 'Çaba'],
            ['loss', 'Kayıp'],
          ].map(([k, label]) => (
            <Tag key={k}>
              {label}: {String(a[k] || 'Bilinmiyor')}
            </Tag>
          ))}
        </div>
      </aside>
    )
  if (id === '29') {
    const spend = number(a[free ? 'serviceSpend' : 'spend']),
      qty = number(a[free ? 'served' : 'newCustomers'])
    return (
      <aside className="step-summary">
        <Stat
          label={
            free ? 'Hizmet alan kişi başına gider' : 'Yeni müşteri başına gider'
          }
          value={
            qty === 0
              ? 'Hesaplanamaz'
              : money(spend !== null && qty !== null ? spend / qty : null)
          }
        />
      </aside>
    )
  }
  if (id === '13' && a.offer)
    return (
      <blockquote className="step-summary">
        <small>Teklif önizlemesi</small>
        <p>{String(a.offer)}</p>
      </blockquote>
    )
  return null
}
