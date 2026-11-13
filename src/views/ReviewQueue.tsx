import { useEffect, useState } from 'react'
import { Alert, Button, Drawer, Input, Select, Tabs } from 'antd'
import { SealCheck, ArrowRight } from '@phosphor-icons/react'
import { teamRequest, type Session } from '../team'
import { dateLabel, type Plan } from '../domain'
const labels = {
  pending: 'İnceleme bekliyor',
  approved: 'Onaylandı',
  returned: 'Düzeltme istendi',
  superseded: 'Sürüm değişti',
} as const
interface Ticket {
  id: string
  planId: string
  planName: string
  revision: number
  author: string
  authorName: string
  note: string
  state: keyof typeof labels
  reviewerName: string | null
  reply: string | null
  created: string
}
type Packet = { executive: string; actions: string }
export default function ReviewQueue({
  session,
  plan,
  blocked,
  after,
}: {
  session: Session
  plan?: Plan
  blocked: boolean
  after: () => Promise<void>
}) {
  const [list, rows] = useState<Ticket[]>([]),
    [filter, filterBy] = useState('all'),
    [detail, select] = useState<Ticket | null>(null),
    [packet, setPacket] = useState<Packet | null>(null),
    [tab, setTab] = useState<keyof Packet>('executive'),
    [draft, newDraft] = useState(false),
    [note, setNote] = useState(''),
    [error, warn] = useState(''),
    [busy, loading] = useState(false)
  const editor = ['admin', 'editor'].includes(session.user.role),
    reviewer = ['admin', 'reviewer'].includes(session.user.role)
  const load = async () =>
    rows(await teamRequest<Ticket[]>('reviews', undefined, session))
  useEffect(() => {
    load().catch((e) => warn(e.message))
  }, [session])
  async function run(fn: () => Promise<void>) {
    loading(true)
    warn('')
    try {
      await fn()
    } catch (e) {
      warn((e as Error).message)
    } finally {
      loading(false)
    }
  }
  async function finish(outcome?: string) {
    await run(async () => {
      if (outcome && detail)
        await teamRequest('resolve', { id: detail.id, outcome, note }, session)
      else if (plan)
        await teamRequest(
          'submit',
          { id: plan.id, revision: plan.revision, note },
          session,
        )
      select(null)
      newDraft(false)
      setNote('')
      await Promise.all([load(), after()])
    })
  }
  async function view(t: Ticket) {
    await run(async () => {
      const value = await teamRequest<Packet>('packet', { id: t.id }, session)
      setPacket(value)
      setNote('')
      setTab('executive')
      select(t)
    })
  }
  const visible = list.filter((t) => filter === 'all' || t.state === filter)
  const mayDecide =
    detail?.state === 'pending' && reviewer && detail.author !== session.user.id
  return (
    <section className="panel audit">
      <div className="section-head">
        <div>
          <div className="office-kicker">
            <SealCheck /> Kurum onayı
          </div>
          <h2>İnceleme kuyruğu</h2>
          <p>İkinci bir üye gönderilen sürümü ve iki raporu inceler.</p>
        </div>
        <Button onClick={() => run(load)}>Kuyruğu yenile</Button>
      </div>
      <div className="ops-actions">
        <Select
          aria-label="İnceleme durumu"
          value={filter}
          onChange={filterBy}
          options={[
            { value: 'all', label: 'Bütün istekler' },
            ...Object.entries(labels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        {editor && plan && (
          <Button
            type="primary"
            disabled={
              busy ||
              blocked ||
              list.some(
                (t) => t.planId === plan.id && t.revision === plan.revision,
              )
            }
            onClick={() => {
              warn('')
              newDraft(true)
              setNote('')
            }}
          >
            Seçili planı incelemeye gönder
          </Button>
        )}
      </div>
      {plan && (
        <p className="queue-plan">
          Seçili plan: {plan.name} · Sürüm {plan.revision}
        </p>
      )}
      {error && !draft && !detail && <Alert type="error" title={error} />}
      {visible.map((t) => (
        <div className="portfolio-row" key={t.id}>
          <div>
            <h3>{t.planName}</h3>
            <small>
              Sürüm {t.revision} · {t.authorName} · {dateLabel(t.created)}
            </small>
          </div>
          <span
            className="office-chip"
            data-tone={
              t.state === 'approved'
                ? 'positive'
                : t.state === 'pending'
                  ? 'warning'
                  : t.state === 'returned'
                    ? 'negative'
                    : undefined
            }
          >
            {labels[t.state]}
          </span>
          <Button disabled={busy} onClick={() => view(t)}>
            Dosyayı aç <ArrowRight />
          </Button>
        </div>
      ))}
      {!visible.length && (
        <p className="office-empty">Bu seçimde inceleme isteği yok.</p>
      )}
      <Drawer
        title={draft ? 'İnceleme isteği' : 'Sürüm incelemesi'}
        open={draft || !!detail}
        size="min(100vw, 680px)"
        onClose={() => {
          newDraft(false)
          select(null)
          warn('')
        }}
      >
        <div className="fields">
          {draft ? (
            <>
              <h2>{plan?.name}</h2>
              <p>Sürüm {plan?.revision}. İki rapor bu sürümden saklanır.</p>
            </>
          ) : (
            detail && (
              <>
                <h2>{detail.planName}</h2>
                <p>
                  Sürüm {detail.revision} · {labels[detail.state]}
                </p>
                <p>
                  <b>{detail.authorName}</b> · {detail.note}
                </p>
                {detail.reply && (
                  <p>
                    <b>{detail.reviewerName}</b> · {detail.reply}
                  </p>
                )}
                <Tabs
                  activeKey={tab}
                  onChange={(v) => setTab(v as keyof Packet)}
                  items={[
                    { key: 'executive', label: 'Yönetici raporu' },
                    { key: 'actions', label: 'Aksiyon planı' },
                  ]}
                />
                <div className="packet-text">
                  {packet?.[tab]
                    .split('\n\n')
                    .map((v, i) =>
                      v.startsWith('#') ? (
                        <h3 key={i}>{v.replace(/^#+\s*/, '')}</h3>
                      ) : (
                        <p key={i}>{v}</p>
                      ),
                    )}
                </div>
              </>
            )
          )}
          {(draft || mayDecide) && (
            <label>
              <span>{draft ? 'İnceleme nedeni' : 'İnceleme gerekçesi'}</span>
              <Input.TextArea
                maxLength={2000}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          )}
          {error && <Alert type="error" title={error} />}
          <div className="ops-actions">
            {draft ? (
              <Button
                type="primary"
                disabled={!note.trim() || busy}
                onClick={() => finish()}
              >
                İsteği kaydet
              </Button>
            ) : (
              mayDecide && (
                <>
                  <Button
                    type="primary"
                    disabled={!note.trim() || busy}
                    onClick={() => finish('approved')}
                  >
                    Sürümü onayla
                  </Button>
                  <Button
                    disabled={!note.trim() || busy}
                    onClick={() => finish('returned')}
                  >
                    Düzeltme iste
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </Drawer>
    </section>
  )
}
