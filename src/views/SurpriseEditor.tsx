import { useState } from 'react'
import { Alert, Checkbox, Input, Modal, Select } from 'antd'
import { calendar, now, today, type Evidence, type Plan } from '../domain'
import { foundation } from '../readiness'
import type { Surprise } from '../proofReview'

type Props = {
  actor?: string
  p: Plan
  item?: Evidence
  close: () => void
  readOnly: boolean
  change: (f: (p: Plan) => Plan) => void
}
export default function SurpriseEditor({
  p,
  item,
  close,
  readOnly,
  actor,
  change,
}: Props) {
  const [title, setTitle] = useState(item?.title ?? ''),
    [place, setPlace] = useState(item?.place ?? ''),
    [observed, setObserved] = useState(item?.observed ?? today()),
    [source, setSource] = useState(item?.source ?? '')
  const [follow, setFollow] = useState<Surprise>(
    item?.surprise ?? { status: 'Açık' },
  )
  const [newClaim, setClaim] = useState(''),
    [closureOwner, setClosureOwner] = useState(
      actor ?? item?.surprise?.closedBy ?? String(p.answers['01']?.owner ?? ''),
    ),
    [refute, setRefute] = useState(''),
    [error, setError] = useState('')
  const assumptions = foundation(p).assumptions ?? []
  const decisionOwner = String(p.answers['01']?.owner ?? '').trim()
  const canDecide = !readOnly && (!actor || actor === decisionOwner)
  const update = (patch: Partial<Surprise>) =>
    setFollow((old) => ({ ...old, ...patch }))
  function save() {
    if (readOnly) return
    if (follow.danger && !item?.surprise?.danger && follow.status === 'Kapandı')
      return setError('Yeni zarar işaretini önce açık kaydedin.')
    if (
      !title.trim() ||
      !place.trim() ||
      !source.trim() ||
      !calendar(observed) ||
      observed > today()
    )
      return setError('Gözlemi, yeri, kaynağı ve geçerli günü yazın.')
    if (
      follow.status === 'Kapandı' &&
      (!follow.conclusion?.trim() || !closureOwner.trim())
    )
      return setError('Kapanış gerekçesini ve kararı veren kişiyi yazın.')
    if (
      follow.status === 'Varsayıma bağlandı' &&
      !assumptions.some((a) => a.id === follow.assumption) &&
      !(newClaim.trim() && refute.trim())
    )
      return setError(
        'Bir varsayım seçin veya yeni tahmini ve onu çürütecek bulguyu yazın.',
      )
    const id = item?.id ?? crypto.randomUUID()
    change((prev) => {
      const data = foundation(prev)
      const create =
        follow.status === 'Varsayıma bağlandı' &&
        !data.assumptions?.some((a) => a.id === follow.assumption)
      const assumptionId = create ? crypto.randomUUID() : follow.assumption
      const previous = item?.surprise
      const reopened =
        previous?.status === 'Kapandı' && follow.status !== 'Kapandı'
      const surprise = {
        ...follow,
        assumption: assumptionId,
        danger: !!item?.surprise?.danger || !!follow.danger,
        ...(reopened
          ? {
              closures: [
                ...(previous.closures ?? []),
                {
                  reason: previous.conclusion!,
                  owner: previous.closedBy,
                  day: previous.closedOn,
                },
              ],
              conclusion: undefined,
              closedBy: undefined,
              closedOn: undefined,
            }
          : {}),
        ...(follow.status === 'Kapandı' && canDecide
          ? {
              closedBy:
                item?.surprise?.status === 'Kapandı' &&
                item.surprise.conclusion === follow.conclusion
                  ? (item.surprise.closedBy ?? closureOwner.trim())
                  : closureOwner.trim(),
              closedOn:
                item?.surprise?.status === 'Kapandı' &&
                item.surprise.conclusion === follow.conclusion
                  ? (item.surprise.closedOn ?? today())
                  : today(),
            }
          : {}),
      }
      const record: Evidence = {
        ...item,
        id,
        at: item?.at ?? now(),
        step: item?.step ?? '17',
        kind: 'Gözlem',
        title: title.trim(),
        source: source.trim(),
        place: place.trim(),
        observed,
        surprise,
      }
      return {
        ...prev,
        foundation: create
          ? {
              ...data,
              assumptions: [
                ...(data.assumptions ?? []),
                {
                  id: assumptionId!,
                  claim: newClaim.trim(),
                  refute: refute.trim(),
                  impact: follow.question || title,
                  critical: false,
                  status: 'Denenmedi',
                  evidence: id,
                },
              ],
            }
          : prev.foundation,
        evidence: item
          ? prev.evidence.map((e) => (e.id === id ? record : e))
          : [...prev.evidence, record],
      }
    })
    close()
  }
  return (
    <Modal
      title="Beklenmeyen gözlem"
      open
      onCancel={close}
      onOk={save}
      okText="Gözlemi kaydet"
      cancelText="Vazgeç"
      okButtonProps={{ disabled: readOnly }}
    >
      <div className="fields">
        <label>
          <span>Ne oldu?</span>
          <Input.TextArea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          <span>Nerede gözlediniz?</span>
          <Input value={place} onChange={(e) => setPlace(e.target.value)} />
        </label>
        <label>
          <span>Gözlem günü</span>
          <Input
            type="date"
            max={today()}
            value={observed}
            onChange={(e) => setObserved(e.target.value)}
          />
        </label>
        <label>
          <span>Gözlemin kaynağı</span>
          <Input value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
        <Checkbox
          checked={!!follow.danger}
          disabled={!!item?.surprise?.danger}
          onChange={(e) =>
            update({
              danger: e.target.checked,
              ...(e.target.checked && follow.status === 'Kapandı'
                ? { status: 'Açık', conclusion: undefined }
                : {}),
            })
          }
        >
          Ciddi zarar işareti gördüm
        </Checkbox>
        <details className="step-help">
          <summary>İncelemeyi izle</summary>
          {!canDecide && <p>İzleme kararını planın karar sahibi kaydeder.</p>}
          <div className="fields">
            {(
              [
                ['missingGroup', 'Henüz kimi dinlemediniz?'],
                ['second', 'İkinci gözlem veya farklı açıklama'],
                ['question', 'Hangi karar etkilenebilir?'],
                ['owner', 'İnceleyecek kişi'],
                ['due', 'Yeniden inceleme günü'],
                ['limit', 'Denemede en fazla ne kaybedilebilir?'],
                ['stop', 'Hangi durumda deneme durur?'],
              ] as const
            ).map(([k, label]) => (
              <label key={k}>
                <span>{label}</span>
                <Input
                  disabled={
                    !canDecide && k !== 'missingGroup' && k !== 'second'
                  }
                  type={k === 'due' ? 'date' : 'text'}
                  value={follow[k] ?? ''}
                  onChange={(e) => update({ [k]: e.target.value })}
                />
              </label>
            ))}
            <label>
              <span>Benzer önceki gözlem</span>
              <Select
                allowClear
                aria-label="Benzer önceki gözlem"
                value={follow.prior}
                options={p.evidence
                  .filter((e) => e.surprise && e.id !== item?.id)
                  .map((e) => ({ value: e.id, label: e.title }))}
                onChange={(prior) => update({ prior })}
              />
            </label>
            <label>
              <span>İnceleme sonucu</span>
              <Select
                aria-label="İnceleme sonucu"
                disabled={!canDecide}
                value={follow.status}
                onChange={(status) => update({ status })}
                options={['Açık', 'Varsayıma bağlandı', 'Kapandı'].map(
                  (value) => ({ value, label: value }),
                )}
              />
            </label>
            {follow.status === 'Varsayıma bağlandı' && (
              <>
                <label>
                  <span>Mevcut varsayım</span>
                  <Select
                    aria-label="Mevcut varsayım"
                    allowClear
                    value={follow.assumption}
                    options={assumptions.map((a) => ({
                      value: a.id,
                      label: a.claim,
                    }))}
                    onChange={(assumption) => update({ assumption })}
                  />
                </label>
                {!assumptions.some((a) => a.id === follow.assumption) && (
                  <>
                    <label>
                      <span>Yeni varsayım</span>
                      <Input
                        value={newClaim}
                        onChange={(e) => setClaim(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Hangi bulgu bu tahmini çürütür?</span>
                      <Input
                        value={refute}
                        onChange={(e) => setRefute(e.target.value)}
                      />
                    </label>
                  </>
                )}
              </>
            )}
            {follow.status === 'Kapandı' && (
              <>
                <label>
                  <span>Kapanış kararını veren kişi</span>
                  <Input
                    value={closureOwner}
                    readOnly={!!actor}
                    onChange={(e) => setClosureOwner(e.target.value)}
                  />
                </label>
                <label>
                  <span>Kapanış gerekçesi</span>
                  <Input.TextArea
                    disabled={!canDecide}
                    value={follow.conclusion}
                    onChange={(e) => update({ conclusion: e.target.value })}
                  />
                </label>
              </>
            )}
          </div>
        </details>
        {error && <Alert type="error" role="alert" title={error} />}
      </div>
    </Modal>
  )
}
