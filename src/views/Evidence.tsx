import { lazy, Suspense, useEffect, useState } from 'react'
import { Alert, Button, Checkbox, Input, Modal, Select } from 'antd'
import { Plus, Trash } from '@phosphor-icons/react'
import { steps } from '../data/steps'
import { evidenceKinds, type EvidenceKind } from '../operations'
import { criteria, usable, type Criterion } from '../readiness'
import {
  calendar,
  today,
  dateLabel,
  now,
  type Evidence as Proof,
  type Plan,
} from '../domain'
import { offerBasis, proofIssue } from '../proofReview'
const SurpriseEditor = lazy(() => import('./SurpriseEditor'))
export default function Evidence({
  p,
  change,
  readOnly,
  initialCriterion,
  actor,
  recordId,
  clearRecord,
  closeContext,
}: {
  recordId?: string
  clearRecord: () => void
  initialCriterion?: Criterion
  actor?: string
  closeContext: () => void
  readOnly: boolean
  p: Plan
  change: (fn: (p: Plan) => Plan) => void
}) {
  const [editing, setEditing] = useState(''),
    [links, setLinks] = useState<Criterion[]>([]),
    [observed, setObserved] = useState(''),
    [stance, setStance] = useState<'Destek' | 'Karşı bulgu'>('Destek')
  const [selectedRecord, setRecord] = useState(recordId)
  useEffect(() => {
    if (recordId) clearRecord()
  }, [recordId])
  const context = criteria.find((c) => c[0] === initialCriterion)
  const [kind, setKind] = useState<EvidenceKind>('Gözlem'),
    [filter, setFilter] = useState('Tümü'),
    [query, search] = useState('')
  const rows = p.evidence.filter(
    (e) =>
      (!selectedRecord || e.id === selectedRecord) &&
      (!context || context[4].split(' ').includes(e.step)) &&
      (filter === 'Tümü' || (e.kind || 'Sınıflandırılmadı') === filter) &&
      [e.title, e.source, e.step]
        .join(' ')
        .toLocaleLowerCase('tr')
        .includes(query.trim().toLocaleLowerCase('tr')),
  )
  const [customerGroup, setGroup] = useState(''),
    [period, setPeriod] = useState('')
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState(''),
    [source, setSource] = useState(''),
    [step, setStep] = useState('00'),
    [err, error] = useState(''),
    [remove, setRemove] = useState('')
  const [side, setSide] = useState<NonNullable<Proof['side']>>('Müşteri'),
    [codes, setCodes] = useState('')
  const [surpriseId, showSurprise] = useState<string | undefined>()
  const [replacement, setReplacement] = useState(''),
    [reason, setReason] = useState('')
  const [place, setPlace] = useState(''),
    [rule, setRule] = useState(''),
    [reviewer, setReviewer] = useState(''),
    [until, setUntil] = useState(''),
    [renew, setRenew] = useState(false),
    [changed, setChanged] = useState(false)
  function start(existing?: Proof) {
    if (existing?.surprise) {
      showSurprise(existing.id)
      return
    }
    setPlace(existing?.place ?? '')
    setReplacement(existing?.review?.replacement ?? '')
    setReason(existing?.review?.reason ?? '')
    setRule(existing?.review?.rule ?? '')
    setReviewer(
      actor ?? existing?.review?.owner ?? String(p.answers['01']?.owner ?? ''),
    )
    setUntil(existing?.review?.until ?? '')
    setRenew(false)
    setChanged(!!existing?.review?.changed)
    setSide(existing?.side ?? 'Müşteri')
    setCodes(existing?.participants?.join(', ') ?? '')
    setGroup(existing?.customerGroup ?? '')
    setPeriod(existing?.period ?? '')
    setEditing(existing?.id ?? '')
    setTitle(existing?.title ?? '')
    setSource(existing?.source ?? '')
    setKind(
      existing?.kind ??
        (initialCriterion === 'Z6' ? 'Yazılı taahhüt' : 'Gözlem'),
    )
    setObserved(existing ? (existing.observed ?? '') : today())
    setStance(existing?.stance ?? 'Destek')
    setStep(existing?.step ?? context?.[2] ?? '00')
    setLinks(
      existing
        ? Array.from(
            new Set([
              ...(existing.criteria ?? []),
              ...(initialCriterion ? [initialCriterion] : []),
            ]),
          )
        : initialCriterion
          ? [initialCriterion]
          : [],
    )
    error('')
    setOpen(true)
  }
  function add() {
    if (readOnly) return
    if (
      !title.trim() ||
      !source.trim() ||
      (links.length > 0 && (!calendar(observed) || observed > today()))
    ) {
      error('Gözlemi, kaynağı ve geçerli olay tarihini yazın.')
      return
    }
    const prior = p.evidence.find((e) => e.id === editing)?.review
    if (prior?.until && prior.until < today() && until !== prior.until) {
      error(
        'Bu belgenin süresi doldu. Yeni belgeyi ayrı bir kanıt olarak ekleyin.',
      )
      return
    }
    if (replacement && !reason.trim()) {
      error('Önceki karşı bulgunun neden geçerli olmadığını yazın.')
      return
    }
    if (
      links.length &&
      !renew &&
      (rule !== (prior?.rule ?? '') ||
        replacement !== (prior?.replacement ?? '') ||
        reason !== (prior?.reason ?? '') ||
        until !== (prior?.until ?? '') ||
        (prior && !actor && reviewer !== prior.owner))
    ) {
      error(
        'Geçerlilik bilgisini değiştirdiniz. Kaynağı inceleyip onay kutusunu seçin.',
      )
      return
    }
    if (
      renew &&
      (!rule.trim() ||
        !reviewer.trim() ||
        !calendar(observed) ||
        observed > today() ||
        (until && (!calendar(until) || until < observed)))
    ) {
      error('İnceleyen kişiyi, geçerlilik koşulunu ve tarihleri kontrol edin.')
      return
    }
    change((prev) => {
      const old = prev.evidence.find((e) => e.id === editing)
      const item: Proof = {
        id: old?.id ?? crypto.randomUUID(),
        at: old?.at ?? now(),
        kind,
        step,
        title: title.trim(),
        source: source.trim(),
        criteria: links,
        place: place.trim() || undefined,
        ...(customerGroup.trim()
          ? { customerGroup: customerGroup.trim() }
          : {}),
        ...(period.trim() ? { period: period.trim() } : {}),
        ...(links.includes('Z6')
          ? {
              side,
              participants: Array.from(
                new Set(
                  codes
                    .split(/[,;\n]+/)
                    .map((v) => v.trim())
                    .filter(Boolean),
                ),
              ),
            }
          : {}),
        observed: observed || undefined,
        stance,
      }
      if (renew)
        item.review = {
          owner: reviewer.trim(),
          rule: rule.trim(),
          until: until || undefined,
          checked: today(),
          observation: observed,
          changed,
          ...(stance === 'Karşı bulgu' && replacement
            ? { replacement, reason: reason.trim() }
            : {}),
          ...(old?.review?.offer !== undefined ||
          links.some((id) => id === 'D1' || id === 'Z6')
            ? { offer: old?.review?.offer ?? offerBasis(prev) }
            : {}),
        }
      else if (old?.review) {
        const proofChanged =
          old.observed !== item.observed ||
          old.source !== item.source ||
          old.title !== item.title ||
          old.place !== item.place ||
          old.customerGroup !== item.customerGroup ||
          old.period !== item.period ||
          old.kind !== item.kind ||
          old.side !== item.side ||
          old.stance !== item.stance ||
          JSON.stringify(old.participants) !==
            JSON.stringify(item.participants) ||
          JSON.stringify(old.criteria) !== JSON.stringify(item.criteria)
        item.review = {
          ...old.review,
          changed: !!old.review.changed || changed || proofChanged,
        }
      }
      return {
        ...prev,
        evidence: old
          ? prev.evidence.map((e) => (e.id === old.id ? item : e))
          : [...prev.evidence, item],
        history: old
          ? prev.history.map((h) => ({ ...h, stale: true }))
          : prev.history,
      }
    })
    setOpen(false)
  }
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Gözlem kayıtları</h2>
          <p>{p.evidence.length} kayıt</p>
        </div>
        <Button
          disabled={readOnly}
          type="primary"
          icon={<Plus />}
          onClick={() => start()}
        >
          Kanıt ekle
        </Button>
      </div>
      <Button disabled={readOnly} onClick={() => showSurprise('')}>
        Bunu beklemiyorduk
      </Button>
      {surpriseId !== undefined && (
        <Suspense fallback={<p>Gözlem açılıyor.</p>}>
          <SurpriseEditor
            actor={actor}
            key={surpriseId}
            p={p}
            item={p.evidence.find((e) => e.id === surpriseId)}
            close={() => showSurprise(undefined)}
            readOnly={readOnly}
            change={change}
          />
        </Suspense>
      )}
      {selectedRecord && (
        <Button onClick={() => setRecord(undefined)}>
          Tüm kanıtları göster
        </Button>
      )}
      {context && (
        <div className="step-help">
          <strong>{context[1]}</strong>
          <p>{context[3]}</p>
          <Button onClick={closeContext}>Tüm kayıtları göster</Button>
          <Button
            onClick={() => {
              location.hash = 'gecis'
            }}
          >
            Geçişe dön
          </Button>
        </div>
      )}
      <div className="evidence-filter ops-filters">
        <Input.Search
          aria-label="Kanıt veya kaynak ara"
          placeholder="Kanıt veya kaynak ara"
          value={query}
          onChange={(e) => search(e.target.value)}
        />
        <Select
          aria-label="Kanıt türüne göre süz"
          value={filter}
          onChange={setFilter}
          options={['Tümü', 'Sınıflandırılmadı', ...evidenceKinds].map((v) => ({
            value: v,
            label: v,
          }))}
        />
      </div>
      {rows.length ? (
        <div
          className="table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Kanıt kayıtları"
        >
          <table className="register-table" aria-label="Kanıt defteri">
            <thead>
              <tr>
                <th scope="col">Gözlem</th>
                <th scope="col">Kaynak</th>
                <th scope="col">Kanıt türü</th>
                <th scope="col">Plan adımı</th>
                <th scope="col">Kayıt tarihi</th>
                <th scope="col">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.toReversed().map((e) => (
                <tr key={e.id}>
                  <th scope="row">
                    <h3>{e.title}</h3>
                    {e.surprise && (
                      <p>Beklenmeyen gözlem. {e.surprise.status}</p>
                    )}
                    {e.criteria?.length ? (
                      <p>{proofIssue(p, e) || 'Geçerliliği incelendi.'}</p>
                    ) : null}
                    {(e.customerGroup || e.period) && (
                      <p>
                        {[e.customerGroup, e.period, e.place]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </th>
                  <td>{e.source}</td>
                  <td>{e.kind || 'Sınıflandırılmadı'}</td>
                  <td>
                    {e.step}. {steps.find((s) => s.id === e.step)?.title}
                  </td>
                  <td>
                    {dateLabel(e.at)}
                    {e.observed && <p>Olay: {dateLabel(e.observed)}</p>}
                    {e.criteria?.length ? (
                      <p>
                        {e.stance} · {e.criteria.join(', ')}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <Button disabled={readOnly} onClick={() => start(e)}>
                      Kaydı incele
                    </Button>
                    <Button
                      disabled={
                        readOnly ||
                        (!!e.surprise?.danger &&
                          e.surprise.status !== 'Kapandı')
                      }
                      type="text"
                      icon={<Trash />}
                      aria-label={e.title + ' kaydını sil'}
                      onClick={() => setRemove(e.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          {p.evidence.length
            ? 'Bu seçimde kayıt yok.'
            : 'Henüz gözlem kaydı yok.'}
        </p>
      )}
      <Modal
        title={editing ? 'Kanıtı güncelle' : 'Kanıt ekle'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={add}
        okText="Kanıtı kaydet"
        cancelText="Vazgeç"
      >
        <div className="fields">
          <label>
            <span>Plan adımı</span>
            <Select
              value={step}
              onChange={(v) => {
                setStep(v)
                setLinks(
                  links.filter((id) =>
                    criteria
                      .find((c) => c[0] === id)?.[4]
                      .split(' ')
                      .includes(v),
                  ),
                )
              }}
              options={steps.map((s) => ({
                value: s.id,
                label: s.id + '. ' + s.title,
              }))}
            />
          </label>
          <label>
            <span>Ne gözlediniz?</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            <span>Kaynak</span>
            <Input.TextArea
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
          <label>
            <span>Kanıt türü</span>
            <Select
              value={kind}
              onChange={setKind}
              options={evidenceKinds.map((v) => ({ value: v, label: v }))}
            />
          </label>
          <details className="step-help">
            <summary>Gözlemin kapsadığı müşteri ve dönem</summary>
            <div className="fields">
              <label>
                <span>Gözlenen müşteri grubu</span>
                <Input
                  value={customerGroup}
                  onChange={(e) => setGroup(e.target.value)}
                />
              </label>
              <label>
                <span>Teklifin verildiği yer veya kanal</span>
                <Input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                />
              </label>
              <label>
                <span>Gözlem dönemi</span>
                <Input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </label>
            </div>
          </details>
          <label>
            <span>Olay tarihi</span>
            <Input
              type="date"
              max={today()}
              value={observed}
              onChange={(e) => setObserved(e.target.value)}
            />
          </label>
          <label>
            <span>Bağlı ölçütler</span>
            <Select
              aria-label="Bağlı ölçütler"
              mode="multiple"
              value={links}
              onChange={setLinks}
              options={criteria
                .filter((c) => c[4].split(' ').includes(step))
                .map((c) => ({ value: c[0], label: c[1] }))}
            />
          </label>
          <label>
            <span>Kanıtın yönü</span>
            <Select
              aria-label="Kanıtın yönü"
              value={stance}
              onChange={setStance}
              options={['Destek', 'Karşı bulgu'].map((v) => ({
                value: v,
                label: v,
              }))}
            />
          </label>
          {links.includes('Z6') && (
            <>
              <label>
                <span>Davranış kime ait?</span>
                <Select
                  aria-label="Davranış kime ait?"
                  value={side}
                  onChange={setSide}
                  options={['Müşteri', 'Diğer taraf', 'Eşleşme'].map(
                    (value) => ({ value, label: value }),
                  )}
                />
              </label>
              <label>
                <span>
                  {side === 'Eşleşme'
                    ? 'Eşleşen kodlar. Örnek: K1/S1, K2/S2'
                    : 'Kişi veya kurum kodları. Örnek: K1, K2'}
                </span>
                <Input.TextArea
                  value={codes}
                  onChange={(e) => setCodes(e.target.value)}
                />
              </label>
              <p>Her alıcıya bir kod verin. Aynı kod bir kez sayılır.</p>
            </>
          )}
          {links.includes('Z6') && (
            <p>
              15. adımdaki denemeyi kontrol edin. Grup:{' '}
              {String(
                p.answers['08']?.[
                  side === 'Diğer taraf' ? 'other' : 'target'
                ] || 'Eksik',
              )}
              . Yer: {p.foundation?.inputs.trialPlace || 'Eksik'}. Dönem:{' '}
              {p.foundation?.inputs.trialPeriod || 'Eksik'}.
            </p>
          )}
          {(links.length > 0 ||
            (editing && p.evidence.find((e) => e.id === editing)?.review)) && (
            <details className="step-help" open>
              <summary>Kanıtın bugünkü geçerliliği</summary>
              <div className="fields">
                <label>
                  <span>Koşulu doğrulayan kişi</span>
                  <Input
                    value={reviewer}
                    readOnly={!!actor}
                    onChange={(e) => {
                      setReviewer(e.target.value)
                    }}
                  />
                </label>
                <label>
                  <span>Hangi değişiklik bu kanıtı eskitebilir?</span>
                  <Input
                    value={rule}
                    onChange={(e) => {
                      setRule(e.target.value)
                    }}
                  />
                </label>
                <label>
                  <span>Belgenin son geçerlilik günü varsa yazın</span>
                  <Input
                    type="date"
                    value={until}
                    onChange={(e) => {
                      setUntil(e.target.value)
                    }}
                  />
                </label>
                <Checkbox
                  checked={changed}
                  onChange={(e) => setChanged(e.target.checked)}
                >
                  Kaynağın koşulu değişti
                </Checkbox>
                <Checkbox
                  checked={renew}
                  onChange={(e) => setRenew(e.target.checked)}
                >
                  Kaynağı bugün yeniden inceledim
                </Checkbox>
                {stance === 'Karşı bulgu' && (
                  <>
                    <label>
                      <span>Önceki bulgunun yerini alan kaynak</span>
                      <Select
                        aria-label="Önceki bulgunun yerini alan kaynak"
                        allowClear
                        value={replacement || undefined}
                        options={p.evidence
                          .filter(
                            (e) =>
                              e.id !== editing &&
                              links.some((id) => usable(p, e, id)),
                          )
                          .map((e) => ({ value: e.id, label: e.title }))}
                        onChange={(v) => setReplacement(v ?? '')}
                      />
                    </label>
                    {!!replacement && (
                      <label>
                        <span>Önceki bulgu neden geçerliliğini yitirdi?</span>
                        <Input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                    )}
                  </>
                )}
                <p>
                  Güncel karar için kaynağı doğrulayın. Eski gözlemi defterde
                  saklayabilirsiniz.
                </p>
              </div>
            </details>
          )}
          {err && <Alert type="error" title={err} />}
        </div>
      </Modal>
      <Modal
        title="Kanıt kaydı silinsin mi?"
        open={!!remove}
        okText="Sil"
        cancelText="Vazgeç"
        onCancel={() => setRemove('')}
        onOk={() => {
          change((prev) => ({
            ...prev,
            evidence: prev.evidence.filter((e) => e.id !== remove),
            history: prev.history.map((h) => ({ ...h, stale: true })),
          }))
          setRemove('')
        }}
      >
        Bu kaydı kullanan kararları yeniden inceleyin.
      </Modal>
    </section>
  )
}
