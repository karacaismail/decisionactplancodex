import { useState } from 'react'
import { Alert, Button, Checkbox, Input, Modal, Select } from 'antd'
import { foundation, bound, type Assumption } from '../readiness'
import { routes } from '../dossier'
import { proofIssue } from '../proofReview'
import type { Plan } from '../domain'

const empty = (): Assumption => ({
  id: crypto.randomUUID(),
  claim: '',
  impact: '',
  refute: '',
  status: 'Denenmedi',
  evidence: '',
  critical: false,
})
export default function Assumptions({
  p,
  change,
  readOnly,
}: {
  p: Plan
  change: (fn: (p: Plan) => Plan) => void
  readOnly: boolean
}) {
  const [draft, setDraft] = useState<Assumption>(),
    [error, setError] = useState('')
  const rows = foundation(p).assumptions ?? []
  const open = (item: Assumption) => {
    setError('')
    setDraft({ ...item })
  }
  function save() {
    if (readOnly || !draft) return
    const evidence = p.evidence.find(
      (e) =>
        e.id === draft.evidence &&
        bound(e, 'Z8') &&
        !proofIssue(p, e) &&
        e.stance === (draft.status === 'Çürüdü' ? 'Karşı bulgu' : 'Destek'),
    )
    if (
      !draft.claim.trim() ||
      !draft.impact.trim() ||
      !draft.refute.trim() ||
      (draft.status !== 'Denenmedi' && !evidence)
    ) {
      setError(
        'Tahmini, etkisini ve çürütecek bulguyu yazın. Sonucu bir kaynağa bağlayın.',
      )
      return
    }
    if (
      draft.critical &&
      draft.status === 'Denenmedi' &&
      (!draft.question ||
        !draft.route ||
        !draft.exposure ||
        (draft.exposure === 'Taahhüt' && !draft.commitment?.trim()))
    ) {
      setError('Karar sorusunu, yolu ve bekleyen taahhüdü belirtin.')
      return
    }
    change((prev) => {
      const data = foundation(prev),
        current = data.assumptions ?? []
      return {
        ...prev,
        foundation: {
          ...data,
          assumptions: current.some((a) => a.id === draft.id)
            ? current.map((a) => (a.id === draft.id ? draft : a))
            : [...current, draft],
        },
      }
    })
    setDraft(undefined)
  }
  return (
    <>
      <h4>Diğer varsayımlar</h4>
      {rows.map((a) => (
        <details key={a.id} className="step-help">
          <summary>
            {a.claim} · {a.status}
          </summary>
          <p>
            {a.impact}. {a.refute}
          </p>
          <p>
            {a.critical ? 'Kritik varsayım. ' : ''}
            {p.evidence.find((e) => e.id === a.evidence)?.source ||
              'Bağlı kaynak bekleniyor.'}
          </p>
          <Button disabled={readOnly} onClick={() => open(a)}>
            Varsayımı düzenle
          </Button>
        </details>
      ))}
      <Button disabled={readOnly} onClick={() => open(empty())}>
        Varsayım ekle
      </Button>
      <Modal
        title="Varsayım kaydı"
        open={!!draft}
        onCancel={() => setDraft(undefined)}
        onOk={save}
        okText="Varsayımı kaydet"
        cancelText="Vazgeç"
      >
        {draft && (
          <div className="fields">
            {(
              [
                ['claim', 'Neyi doğru sayıyorsunuz?'],
                ['impact', 'Yanlışsa ne olur?'],
                ['refute', 'Hangi bulgu fikrinizi değiştirir?'],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <Input
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <Checkbox
              checked={draft.critical}
              onChange={(e) =>
                setDraft({ ...draft, critical: e.target.checked })
              }
            >
              Bu tahmin geçiş kararını etkiler
            </Checkbox>
            {draft.critical && (
              <div className="fields">
                <label>
                  <span>İlgili karar sorusu</span>
                  <Select
                    aria-label="İlgili karar sorusu"
                    value={draft.question || undefined}
                    options={[
                      {
                        value: 'first',
                        label:
                          foundation(p).brief?.openDecisions?.[0]?.question ||
                          foundation(p).brief?.question ||
                          'İlk karar sorusu',
                      },
                      ...(foundation(p).brief?.openDecisions ?? [])
                        .filter((q) => q.question.trim())
                        .map((q) => ({ value: q.id, label: q.question })),
                    ]}
                    onChange={(question) => setDraft({ ...draft, question })}
                  />
                </label>
                <label>
                  <span>Varsayım hangi yolu etkiliyor?</span>
                  <Select
                    aria-label="Varsayım hangi yolu etkiliyor?"
                    value={draft.route || undefined}
                    options={routes(p).map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                    onChange={(route) => setDraft({ ...draft, route })}
                  />
                </label>
                <label>
                  <span>Hangi karar beklemeli?</span>
                  <Select
                    aria-label="Hangi karar beklemeli?"
                    value={draft.exposure}
                    options={[
                      {
                        value: 'Araştırma',
                        label: 'Yalnız araştırmayı ilgilendiriyor',
                      },
                      {
                        value: 'Taahhüt',
                        label: 'Geri alınması zor bir karar var',
                      },
                    ]}
                    onChange={(exposure) =>
                      setDraft({
                        ...draft,
                        exposure,
                        commitment:
                          exposure === 'Araştırma' ? '' : draft.commitment,
                      })
                    }
                  />
                </label>
                {draft.exposure === 'Taahhüt' && (
                  <label>
                    <span>Kanıt bekleyen taahhüt</span>
                    <Input
                      value={draft.commitment}
                      onChange={(e) =>
                        setDraft({ ...draft, commitment: e.target.value })
                      }
                    />
                  </label>
                )}
              </div>
            )}
            <Select
              aria-label="Varsayımın durumu"
              value={draft.status}
              onChange={(status) => setDraft({ ...draft, status })}
              options={['Denenmedi', 'Desteklendi', 'Çürüdü'].map((value) => ({
                value,
                label: value,
              }))}
            />
            <Select
              aria-label="Varsayım kaynağı"
              value={draft.evidence || undefined}
              onChange={(evidence) => setDraft({ ...draft, evidence })}
              options={p.evidence
                .filter((e) => bound(e, 'Z8'))
                .map((e) => ({ value: e.id, label: e.title }))}
            />
            {error && <Alert type="error" title={error} />}
          </div>
        )}
      </Modal>
    </>
  )
}
