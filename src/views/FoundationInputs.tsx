import { Button, Input, Select } from 'antd'
import {
  foundation,
  inputLabels,
  market,
  reviewBasis,
  type InputKey,
} from '../readiness'
import { type Plan } from '../domain'

const groups: Record<string, InputKey[]> = {
  '02': ['monthlyOutflow'],
  '07': ['lossMeasure'],
  '08': ['channelPeriod', 'reached', 'responded'],
  '09': [
    'period',
    'capacityPeriod',
    'people',
    'reach',
    'conversion',
    'frequency',
    'target',
    'advantage',
    'weakness',
  ],
  '10': ['assumption', 'assumptionEvidence'],
  '12': ['skills'],
  '16': ['costPeriod'],
  '15': [
    'expectedSignal',
    'price',
    'offered',
    'accepted',
    'rejected',
    'silent',
  ],
  '17': ['riskStop', 'reviewer', 'reviewNote'],
}
export default function FoundationInputs({
  p,
  id,
  change,
  disabled,
  actor,
}: {
  p: Plan
  id: string
  change: (f: (p: Plan) => Plan) => void
  actor?: string
  disabled: boolean
}) {
  const keys = groups[id]
  if (!keys?.length) return null
  const data = foundation(p).inputs
  function set(k: InputKey, v: string) {
    change((prev) => {
      const f = foundation(prev)
      return { ...prev, foundation: { ...f, inputs: { ...f.inputs, [k]: v } } }
    })
  }
  const digits = [
    'monthlyOutflow',
    'reached',
    'responded',
    'people',
    'reach',
    'conversion',
    'frequency',
    'target',
    'price',
    'offered',
    'accepted',
    'rejected',
    'silent',
  ]
  return (
    <details className="step-help foundation-inputs">
      <summary>
        {id === '09'
          ? 'Pazar hesabı ve rakip karşılaştırması'
          : id === '10'
            ? 'Varsayımın sonucu'
            : 'Geçiş kararının dayanakları'}
      </summary>
      <div className="fields">
        {keys
          .filter(
            (k) =>
              k !== 'assumptionEvidence' ||
              (data.assumption && data.assumption !== 'Denenmedi'),
          )
          .map((k) => (
            <label key={k}>
              <span>{inputLabels[k]}</span>
              {[
                'period',
                'capacityPeriod',
                'costPeriod',
                'expectedSignal',
              ].includes(k) ? (
                <Select
                  aria-label={inputLabels[k]}
                  value={data[k] || undefined}
                  disabled={disabled}
                  onChange={(v) => set(k, v)}
                  options={(k === 'expectedSignal'
                    ? [
                        'Yazılı taahhüt',
                        'Ayrılan kaynak',
                        'Ödeme',
                        'Fiilî kullanım',
                      ]
                    : ['Gün', 'Hafta', 'Ay', 'Yıl']
                  ).map((v) => ({ value: v, label: v }))}
                />
              ) : k === 'assumption' || k === 'assumptionEvidence' ? (
                <Select
                  aria-label={inputLabels[k]}
                  value={data[k] || undefined}
                  disabled={disabled}
                  onChange={(v) => set(k, v)}
                  options={
                    k === 'assumption'
                      ? ['Denenmedi', 'Desteklendi', 'Çürüdü'].map((v) => ({
                          value: v,
                          label: v,
                        }))
                      : p.evidence
                          .filter((e) => e.criteria?.includes('Z8'))
                          .map((e) => ({ value: e.id, label: e.title }))
                  }
                />
              ) : (
                <Input
                  aria-label={inputLabels[k]}
                  type={digits.includes(k) ? 'number' : 'text'}
                  min={digits.includes(k) ? 0 : undefined}
                  disabled={disabled}
                  value={data[k] || ''}
                  onChange={(e) => set(k, e.target.value)}
                />
              )}
            </label>
          ))}
        {id === '17' && (
          <>
            <p>
              {data.reviewVersion && data.reviewVersion === reviewBasis(p)
                ? 'İkinci görüş bu dayanaklara bağlı.'
                : 'Güncel dayanaklar için ikinci görüş bekleniyor.'}
            </p>
            <Button
              disabled={
                disabled ||
                !data.reviewer?.trim() ||
                data.reviewer.trim() ===
                  String(p.answers['01']?.owner ?? '').trim() ||
                (!!actor && actor !== data.reviewer.trim()) ||
                !data.reviewNote?.trim()
              }
              onClick={() =>
                change((prev) => {
                  const f = foundation(prev)
                  return {
                    ...prev,
                    foundation: {
                      ...f,
                      inputs: { ...f.inputs, reviewVersion: reviewBasis(prev) },
                    },
                  }
                })
              }
            >
              İkinci görüşü bu sürüme bağla
            </Button>
          </>
        )}
        {id === '09' && (
          <div>
            <output>
              Hesaplanan talep: {market(p) ?? 'Bilinmiyor'}. Teslim kapasitesi:{' '}
              {p.answers['09']?.capacity?.toString() || 'Bilinmiyor'}.
            </output>
            <p>
              <a href="#insights?pazar">Pazar hesabını grafikte aç</a>
            </p>
          </div>
        )}
      </div>
    </details>
  )
}
