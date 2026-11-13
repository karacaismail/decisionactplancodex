import { useEffect, useState } from 'react'
import { Alert, Button, Input, Select, Tabs } from 'antd'
import {
  Buildings,
  Key,
  UsersThree,
  UserGear,
  PencilSimpleLine,
  SealCheck,
  Eye,
} from '@phosphor-icons/react'
import {
  teamRequest,
  roleLabel,
  type Session,
  type Member,
  type AuditEvent,
} from '../team'
import ReviewQueue from './ReviewQueue'
import { dateLabel, type Plan } from '../domain'
import './office.css'
export default function Team({
  session,
  switchMode,
  blocked,
  plan,
}: {
  plan?: Plan
  session: Session | null
  switchMode: (s: Session | null) => void
  blocked: boolean
}) {
  const [mode, setMode] = useState('login'),
    [name, setName] = useState(''),
    [password, setPassword] = useState(''),
    [workspace, space] = useState(''),
    [code, setCode] = useState(''),
    [role, setRole] = useState('editor'),
    [issued, issue] = useState(''),
    [members, setMembers] = useState<Member[]>([]),
    [audit, setAudit] = useState<AuditEvent[]>([]),
    [err, error] = useState(''),
    [working, busy] = useState(false)
  const admin = session?.user.role === 'admin'
  async function refresh() {
    if (!session) return
    const events = await teamRequest<AuditEvent[]>('audit', undefined, session)
    setAudit(events)
    if (admin)
      setMembers(await teamRequest<Member[]>('members', undefined, session))
  }
  useEffect(() => {
    refresh().catch((e) => error(e.message))
  }, [session])
  async function run(fn: () => Promise<void>) {
    try {
      error('')
      busy(true)
      await fn()
    } catch (e) {
      error((e as Error).message)
    } finally {
      busy(false)
    }
  }
  function field(label: string, value: string, change: (v: string) => void) {
    return (
      <label>
        <span>{label}</span>
        <Input
          value={value}
          onChange={(e) => change(e.target.value)}
          maxLength={128}
        />
      </label>
    )
  }
  return (
    <div className={session ? 'office-layout' : 'office-layout access-layout'}>
      <section className="panel">
        <div className="office-heading">
          <Buildings size={27} />
          <h2>{session ? session.workspace.name : 'Kurum hesabı'}</h2>
        </div>
        {err && <Alert type="error" title={err} showIcon />}
        {blocked && (
          <Alert
            type="warning"
            title="Alan değiştirmeden önce açık kayıt sorununu çözün."
            showIcon
          />
        )}
        {session ? (
          <>
            <p>
              {session.user.name} · {roleLabel[session.user.role]}
            </p>
            <div className="key-box">
              <b>Kurum kodu</b>
              <code>{session.workspace.id}</code>
            </div>
            <Button
              disabled={blocked || working}
              onClick={() =>
                run(async () => {
                  await teamRequest('logout', {}, session)
                  switchMode(null)
                })
              }
            >
              Kişisel alana dön ve çık
            </Button>
          </>
        ) : (
          <>
            <Tabs
              activeKey={mode}
              onChange={(v) => {
                setMode(v)
                error('')
              }}
              items={[
                { key: 'login', label: 'Giriş' },
                { key: 'create', label: 'Kurum aç' },
                { key: 'join', label: 'Davetle katıl' },
              ]}
            />
            <form
              className="fields"
              onSubmit={(e) => {
                e.preventDefault()
                if (!working && !blocked)
                  void run(async () => {
                    const s = await teamRequest<Session>(mode, {
                      name,
                      password,
                      workspace,
                      code,
                    })
                    setPassword('')
                    switchMode(s)
                  })
              }}
            >
              {mode === 'join'
                ? field('Davet kodu', code, setCode)
                : field(
                    mode === 'create' ? 'Kurum adı' : 'Kurum kodu',
                    workspace,
                    space,
                  )}
              {field('Kullanıcı adı', name, setName)}
              <label>
                <span>Parola</span>
                <Input.Password
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  maxLength={256}
                />
              </label>
              {mode !== 'login' && <small>En az 12 karakter kullanın.</small>}
              <Button
                type="primary"
                htmlType="submit"
                loading={working}
                disabled={blocked}
              >
                {mode === 'create'
                  ? 'Kurum alanını oluştur'
                  : mode === 'join'
                    ? 'Daveti kabul et'
                    : 'Giriş yap'}
              </Button>
            </form>
          </>
        )}
      </section>
      {!session ? (
        <aside className="panel access-guide">
          <div className="office-heading">
            <Key size={25} />
            <h2>Kim ne yapabilir?</h2>
          </div>
          <dl className="access-roles">
            {[
              {
                icon: UserGear,
                role: 'Yönetici',
                detail: 'Üye davet eder ve erişimi kaldırır.',
              },
              {
                icon: PencilSimpleLine,
                role: 'Düzenleyen',
                detail: 'Planları, görevleri ve kararları günceller.',
              },
              {
                icon: SealCheck,
                role: 'İnceleyen',
                detail:
                  'Belirli bir plan sürümünü onaylar veya düzeltmeye gönderir.',
              },
              {
                icon: Eye,
                role: 'Okuyucu',
                detail: 'Kurumun planlarını ve raporlarını görür.',
              },
            ].map(({ icon: Icon, role, detail }) => (
              <div key={role}>
                <dt>
                  <Icon size={19} />
                  {role}
                </dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
          <p>
            Bu Mac kurum kayıtlarını yerel veritabanında saklar. Kişisel
            planlarınızı aktarmak için JSON kopyasını kullanabilirsiniz.
          </p>
        </aside>
      ) : (
        <>
          {admin && (
            <section className="panel">
              <div className="office-heading">
                <UsersThree size={25} />
                <h2>Üyeler ve davetler</h2>
              </div>
              <div className="ops-actions">
                <Select
                  aria-label="Davet yetkisi"
                  value={role}
                  onChange={setRole}
                  options={['editor', 'reviewer', 'reader'].map((v) => ({
                    value: v,
                    label: roleLabel[v as 'reader' | 'editor'],
                  }))}
                />
                <Button
                  disabled={working}
                  onClick={() =>
                    run(async () => {
                      const r = await teamRequest<{ code: string }>(
                        'invite',
                        { role },
                        session,
                      )
                      issue(r.code)
                      await refresh()
                    })
                  }
                >
                  Davet oluştur
                </Button>
              </div>
              {issued && (
                <div className="key-box">
                  <b>Tek kullanımlık davet kodu</b>
                  <code>{issued}</code>
                  <small>Kod 24 saat geçerlidir.</small>
                </div>
              )}
              {members.map((m) => (
                <div className="person-row" key={m.id}>
                  <span>
                    {m.name} · {roleLabel[m.role]}
                  </span>
                  {m.role !== 'admin' && (
                    <Button
                      disabled={working}
                      onClick={() =>
                        run(async () => {
                          await teamRequest('remove', { id: m.id }, session)
                          await refresh()
                        })
                      }
                    >
                      Erişimi kaldır
                    </Button>
                  )}
                </div>
              ))}
            </section>
          )}
          <ReviewQueue
            session={session}
            plan={plan}
            blocked={blocked}
            after={refresh}
          />
          <section className="panel audit">
            <div className="section-head">
              <div>
                <h2>İşlem geçmişi</h2>
                <p>Son 250 işlem</p>
              </div>
              <Button onClick={() => run(refresh)}>Yenile</Button>
            </div>
            {audit.map((e) => (
              <div className="audit-row" key={e.seq}>
                <strong>{e.action}</strong>
                <p>
                  {e.detail}
                  {e.revision ? ' · Sürüm ' + e.revision : ''}
                </p>
                <small>
                  {e.actor} · {dateLabel(e.at)}
                </small>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
