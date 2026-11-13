import { useState } from 'react'
import { Button, Collapse, Input, Select } from 'antd'
import { ArrowRight } from '@phosphor-icons/react'
import { steps } from '../data/steps'
import { handoverChecks, type HandoverCheck } from '../operations'
import type { Plan } from '../domain'
export default function Takeover({
  p,
  change,
  readOnly,
  visit,
}: {
  p: Plan
  change: (f: (p: Plan) => Plan) => void
  readOnly: boolean
  visit: (id: string) => void
}) {
  const [expanded, expand] = useState(true)
  function edit(id: string, v: Partial<HandoverCheck>) {
    change((prev) => ({
      ...prev,
      handover: {
        ...prev.handover,
        [id]: {
          status: 'Bilinmiyor',
          source: '',
          ...prev.handover?.[id],
          ...v,
        },
      },
    }))
  }
  return (
    <Collapse
      activeKey={expanded ? ['takeover'] : []}
      onChange={() => expand(!expanded)}
      items={[
        {
          key: 'takeover',
          label: 'Devir incelemesi',
          children: (
            <>
              <p>
                Önceki ekibin sözlerini son teslim ve ödeme kayıtlarıyla
                karşılaştırın.
              </p>
              <div className="handover-list">
                {handoverChecks.map(([id, title, target]) => (
                  <div key={id}>
                    <b>{title}</b>
                    <Select
                      disabled={readOnly}
                      aria-label={title + ' durumu'}
                      value={p.handover?.[id]?.status || 'Bilinmiyor'}
                      onChange={(status) => edit(id, { status })}
                      options={['Bilinmiyor', 'Kayıt var', 'Kayıt eksik'].map(
                        (v) => ({ label: v, value: v }),
                      )}
                    />
                    <Input
                      readOnly={readOnly}
                      aria-label={title + ' dayanağı'}
                      placeholder="Belgeyi veya gözlemi yazın"
                      value={p.handover?.[id]?.source || ''}
                      onChange={(e) => edit(id, { source: e.target.value })}
                    />
                    <Button type="link" onClick={() => visit(target)}>
                      {target}. {steps.find((s) => s.id === target)?.title}{' '}
                      <ArrowRight />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ),
        },
      ]}
    />
  )
}
