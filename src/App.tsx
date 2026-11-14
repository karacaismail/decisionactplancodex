import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  Alert,
  Button,
  ConfigProvider,
  Dropdown,
  Input,
  Modal,
  Radio,
  Select,
  theme,
} from 'antd'
import trTR from 'antd/locale/tr_TR'
import {
  ArrowSquareOut,
  CaretDown,
  CheckCircle,
  DownloadSimple,
  FolderOpen,
  Moon,
  Plus,
  Sun,
  UploadSimple,
  SlidersHorizontal,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { usePlans } from './usePlans'
import { currentStage, validatePlan } from './domain'
import { download } from './store'
import { identity } from './ui/identity'
import { navigation, type Page } from './ui/navigation'
import { launchPlan, type Launch } from './operations'
import { teamRequest, roleLabel, type Session } from './team'
import { steps } from './data/steps'
import type { Criterion } from './readiness'
import Dashboard from './views/Dashboard'
const Foundation = lazy(() => import('./views/Foundation'))
const Team = lazy(() => import('./views/Team')),
  Portfolio = lazy(() => import('./views/Portfolio')),
  Work = lazy(() => import('./views/Work'))
const Wide = lazy(() => import('./ui/WideRail')),
  Small = lazy(() => import('./ui/SmallNav'))
const Editor = lazy(() => import('./views/Editor')),
  Methods = lazy(() => import('./views/Methods')),
  Reports = lazy(() => import('./views/Reports')),
  Evidence = lazy(() => import('./views/Evidence')),
  Insights = lazy(() => import('./views/Insights'))
const width = matchMedia('(min-width: 64rem) and (min-height: 35rem)')
const subscribe = (cb: () => void) => {
  width.addEventListener('change', cb)
  return () => width.removeEventListener('change', cb)
}
const descriptions: Record<Page, string> = {
  gecis:
    '17. adımdan sonra dayanakları inceleyin. Stratejiye geçiş kararını kaydedin.',
  team: 'Üyeleri, yetkileri ve kurum kayıtlarını yönetin.',
  work: 'Karardan doğan işleri sorumlusu ve kapanış kanıtıyla izleyin.',
  portfolio:
    'Planları, açık işleri ve kaynak ihtiyaçlarını birlikte inceleyin.',
  dashboard: 'Planın durumunu ve sıradaki kararı görün.',
  editor: 'İşinize uyan adımları doldurun. Yanıtlarınız otomatik kaydedilir.',
  evidence: 'Her gözlemi kaynağıyla birlikte saklayın.',
  reports: 'Aynı kayıttan karar özeti ve çalışma planı hazırlayın.',
  insights: 'Para durumunu ve tamamlanan adımları inceleyin.',
  methods: 'Kararınızı destekleyen 128 yöntemi keşfedin.',
}
const fromHash = (): Page =>
  navigation.find((n) => n.id === location.hash.slice(1).split('?')[0])?.id ??
  'dashboard'
function initialDark() {
  try {
    return localStorage.getItem('atlas-theme') === 'dark'
  } catch {
    return false
  }
}
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  async function check() {
    try {
      setSession(await teamRequest<Session | null>('session'))
      setReady(true)
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }
  useEffect(() => {
    void check()
  }, [])
  if (!ready && !failed) return <p role="status">Çalışma alanı açılıyor.</p>
  if (!ready && failed)
    return (
      <section className="panel">
        <h2>Kurum hizmetine ulaşılamadı.</h2>
        <button onClick={check}>Tekrar dene</button>{' '}
        <button
          onClick={() => {
            setReady(true)
            setSession(null)
          }}
        >
          Kişisel planlarımı aç
        </button>
      </section>
    )
  return (
    <Workspace
      key={session?.user.id || 'local'}
      session={session}
      switchMode={setSession}
    />
  )
}
function Workspace({
  session,
  switchMode,
}: {
  session: Session | null
  switchMode: (s: Session | null) => void
}) {
  const readOnly =
    !!session && ['reader', 'reviewer'].includes(session.user.role)
  const [launch, setLaunch] = useState<Launch>('new')
  const store = usePlans(session),
    p = store.plan
  const [page, setPage] = useState<Page>(fromHash),
    [dark, setDark] = useState(initialDark),
    [stage, setStage] = useState(0),
    [dialog, setDialog] = useState(false),
    [name, setName] = useState(''),
    [error, setError] = useState(''),
    [nameError, setNameError] = useState(''),
    [replacing, setReplacing] = useState(false)
  const [proofId, setProofId] = useState<Criterion>()
  const [foundationReport, setFoundationReport] = useState<string | undefined>()
  const [, clockTick] = useState(0)
  useEffect(() => {
    const refresh = () => clockTick((t) => t + 1)
    const id = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  const wide = useSyncExternalStore(subscribe, () => width.matches)
  useEffect(() => {
    const cb = () => setPage(fromHash())
    window.addEventListener('hashchange', cb)
    return () => window.removeEventListener('hashchange', cb)
  }, [])
  useEffect(() => {
    for (const [key, value] of Object.entries(
      identity[dark ? 'dark' : 'light'],
    ))
      document.documentElement.style.setProperty('--' + key, value)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    try {
      localStorage.setItem('atlas-theme', dark ? 'dark' : 'light')
    } catch {}
  }, [dark])
  useEffect(() => {
    if (p) {
      let saved = null
      try {
        saved = localStorage.getItem('atlas-stage-' + p.id)
      } catch {}
      setStage(
        saved !== null && /^[0-7]$/.test(saved)
          ? Number(saved)
          : currentStage(p),
      )
    }
  }, [p?.id])
  function visitStage(i: number) {
    setStage(i)
    if (p)
      try {
        localStorage.setItem('atlas-stage-' + p.id, String(i))
      } catch {}
  }
  useEffect(() => {
    document.title =
      (navigation.find((n) => n.id === page)?.label ?? '') + ' · Karar Atlası'
    window.scrollTo(0, 0)
  }, [page])
  const go = useCallback((v: Page) => {
    location.hash = v
    setPage(v)
  }, [])
  function visitStep(id: string) {
    const step = steps.find((s) => s.id === id)
    if (!step || !p) return
    try {
      localStorage.setItem('atlas-step-' + p.id + '-' + step.stage, id)
    } catch {}
    visitStage(step.stage)
    go('editor')
  }
  const exportPlan = () => {
    if (p)
      download(
        'karar-atlasi-' + p.id + '.json',
        JSON.stringify(p, null, 2),
        'application/json',
      )
  }
  async function importPlan(file: File) {
    try {
      if (file.size > 8 * 1024 * 1024)
        throw Error('Dosya 8 MB sınırını aşıyor.')
      const v: unknown = JSON.parse(await file.text())
      if (!validatePlan(v))
        throw Error('Bu dosya geçerli bir Karar Atlası planı içermiyor.')
      const copy = {
        ...v,
        ...(v.foundation
          ? {
              foundation: {
                ...v.foundation,
                decisions: v.foundation.decisions.map((d) => ({
                  ...d,
                  revoked: true,
                })),
              },
            }
          : {}),
        id: crypto.randomUUID(),
        revision: 0,
        name: v.name + ' (kopya)',
      }
      store.write(copy)
      store.select(copy.id)
      setError('')
      go('dashboard')
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? 'Dosya JSON biçiminde okunamadı.'
          : (e as Error).message,
      )
    }
  }
  function add() {
    if (!name.trim()) {
      setNameError('Plan adını yazın.')
      return
    }
    const newPlan = launchPlan(name, launch)
    store.write(newPlan)
    store.select(newPlan.id)
    setDialog(false)
    setName('')
    if (launch === 'danger') {
      try {
        localStorage.setItem('atlas-step-' + newPlan.id + '-0', '02')
      } catch {}
    }
    setStage(0)
    go('editor')
  }
  const [quickOpen, setQuickOpen] = useState(false),
    [query, setQuery] = useState('')
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setQuery('')
        setQuickOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const matches = navigation.filter((n) =>
    n.label
      .toLocaleLowerCase('tr')
      .includes(query.trim().toLocaleLowerCase('tr')),
  )
  function jump(page: Page) {
    setQuickOpen(false)
    go(page)
  }
  const colors = identity[dark ? 'dark' : 'light']
  const title = navigation.find((n) => n.id === page)!.label
  return (
    <ConfigProvider
      locale={trTR}
      theme={{
        components: { Button: { primaryColor: colors.onAccent } },
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontFamily: '"Outfit Variable", Outfit, sans-serif',
          fontSize: 16,
          colorPrimary: colors.accent,
          colorText: colors.ink,
          colorTextSecondary: colors.muted,
          colorBgContainer: colors.paper,
          colorBgElevated: colors.elevated,
          colorBorder: colors.control,
          borderRadius: 6,
          fontSizeSM: 14,
          controlHeight: 42,
          motionEaseInOut: 'cubic-bezier(.65,0,.35,1)',
          controlOutlineWidth: 0,
          colorBorderSecondary: colors.line,
          colorFillTertiary: colors.subtle,
          colorTextPlaceholder: colors.muted,
        },
      }}
    >
      <a
        className="skip"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        İçeriğe geç
      </a>
      <div className={wide ? 'shell wide' : 'shell narrow'}>
        <div className="workspace">
          {wide && (
            <Suspense fallback={null}>
              <Wide page={page} go={go} />
            </Suspense>
          )}
          <header className="topbar">
            {wide ? (
              <div className="masthead-identity">
                <span className="workspace-name">
                  <FolderOpen size={17} />
                  {session?.workspace.name || 'Kişisel alan'}
                </span>
              </div>
            ) : (
              <Suspense fallback={null}>
                <Small page={page} go={go} />
              </Suspense>
            )}
            <div className="toolbar">
              {wide && (
                <button
                  className="jump-control"
                  onClick={() => {
                    setQuery('')
                    setQuickOpen(true)
                  }}
                >
                  <MagnifyingGlass size={17} />
                  Bölüm bul <kbd>⌘ K</kbd>
                </button>
              )}
              {wide && (
                <span className="save" role="status">
                  <CheckCircle size={17} />
                  {store.status}
                </span>
              )}
              <Button
                type="text"
                aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
                icon={dark ? <Sun size={21} /> : <Moon size={21} />}
                onClick={() => setDark(!dark)}
              />
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    {
                      key: 'export',
                      label: 'Planı JSON indir',
                      icon: <DownloadSimple />,
                      disabled: !p,
                    },
                    {
                      disabled: readOnly,
                      key: 'import',
                      label: 'JSON dosyasını aç',
                      icon: <UploadSimple />,
                    },
                  ],
                  onClick: ({ key }) =>
                    key === 'export'
                      ? exportPlan()
                      : document.getElementById('import-file')?.click(),
                }}
              >
                <Button
                  type="text"
                  aria-label="Dosya işlemleri"
                  icon={<SlidersHorizontal size={21} />}
                />
              </Dropdown>
              <input
                id="import-file"
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void importPlan(file)
                  e.target.value = ''
                }}
              />
            </div>
          </header>
          <main data-page={page} id="main-content" tabIndex={-1}>
            <div className="page-heading">
              <div>
                {page === 'dashboard' && p && (
                  <span className="heading-context">{title}</span>
                )}
                <h1>{page === 'dashboard' && p ? p.name : title}</h1>
                {page !== 'editor' && page !== 'dashboard' && (
                  <p>{descriptions[page]}</p>
                )}
              </div>
              <Button
                disabled={readOnly}
                type="primary"
                icon={<Plus size={18} weight="bold" />}
                onClick={() => {
                  setLaunch('new')
                  setDialog(true)
                  setNameError('')
                }}
              >
                Yeni plan
              </Button>
            </div>
            {(error || store.error) && (
              <Alert
                type="error"
                showIcon
                title={error || store.error}
                action={
                  store.error && p ? (
                    <div className="error-actions">
                      <Button onClick={exportPlan}>Kopyamı indir</Button>
                      <Button onClick={() => setReplacing(true)}>
                        Kayıtlı sürümü aç
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            )}
            {session && (
              <div className="session-mark">
                {session.workspace.name} · {session.user.name} ·{' '}
                {roleLabel[session.user.role]}
                {page !== 'team' && (
                  <Button type="link" onClick={() => go('team')}>
                    Üyelik
                  </Button>
                )}
              </div>
            )}
            {page === 'team' ? (
              <Suspense fallback={<p>Üyelik açılıyor.</p>}>
                <Team
                  plan={p}
                  session={session}
                  switchMode={switchMode}
                  blocked={store.hasDraft}
                />
              </Suspense>
            ) : page === 'portfolio' ? (
              <Suspense fallback={<p>Planlar açılıyor.</p>}>
                <Portfolio
                  plans={store.plans}
                  canRefresh={!store.hasDraft}
                  refresh={store.refresh}
                  open={(plan) => {
                    store.select(plan.id)
                    go('dashboard')
                  }}
                />
              </Suspense>
            ) : p ? (
              <>
                <div className="context-row">
                  <span className="context-icon">
                    <FolderOpen size={18} />
                  </span>
                  <Select
                    labelRender={
                      page === 'dashboard'
                        ? ({ label }) => (
                            <span>
                              Plan seç
                              <span className="visually-hidden">: {label}</span>
                            </span>
                          )
                        : undefined
                    }
                    aria-label="Çalışılan plan"
                    className="plan-picker"
                    variant="borderless"
                    value={p.id}
                    options={store.plans.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    onChange={(id) => {
                      store.select(id)
                      setError('')
                    }}
                    suffixIcon={<CaretDown />}
                  />
                  {p.example && <span className="sample">Örnek plan</span>}
                  <span className="revision-note">Sürüm {p.revision}</span>
                  {!wide && (
                    <span className="mobile-save" role="status">
                      {store.status}
                    </span>
                  )}
                </div>
                <Suspense fallback={<p role="status">Bölüm açılıyor.</p>}>
                  {page === 'dashboard' ? (
                    <Dashboard
                      visit={visitStep}
                      confirmed={
                        !!p.foundation?.decisions.length &&
                        p.foundation.decisions.at(-1)?.id ===
                          store.confirmedTransition
                      }
                      proof={(id) => {
                        setProofId(id)
                        go('evidence')
                      }}
                      key={p.id}
                      p={p}
                      go={go}
                      openStage={(i) => {
                        visitStage(i)
                        go('editor')
                      }}
                    />
                  ) : page === 'work' ? (
                    <Work
                      key={p.id}
                      p={p}
                      change={store.change}
                      readOnly={!!readOnly}
                      openStage={(i) => {
                        visitStage(i)
                        go('editor')
                      }}
                    />
                  ) : page === 'editor' ? (
                    <Editor
                      actor={session?.user.name}
                      openTransition={() => go('gecis')}
                      savedTransition={store.confirmedTransition}
                      key={p.id + '-' + store.generation}
                      p={p}
                      change={store.change}
                      readOnly={!!readOnly}
                      stage={stage}
                      setStage={visitStage}
                    />
                  ) : page === 'gecis' ? (
                    <Foundation
                      key={p.id}
                      p={p}
                      change={store.change}
                      readOnly={!!readOnly}
                      actor={session?.user.name}
                      saved={
                        store.status === 'Kaydedildi' &&
                        !store.hasDraft &&
                        !store.error
                      }
                      visit={visitStep}
                      reports={(id) => {
                        setFoundationReport(id ?? '')
                        go('reports')
                      }}
                      proof={(id) => {
                        setProofId(id)
                        go('evidence')
                      }}
                      example={async () => {
                        const existing = store.plans.find(
                          (item) =>
                            item.example &&
                            item.name === 'Ayşe’nin mahalle kafesi',
                        )
                        if (existing) {
                          store.select(existing.id)
                          return
                        }
                        const { cafeExample } = await import('./cafe')
                        const sample = cafeExample()
                        store.write(sample)
                        store.select(sample.id)
                      }}
                    />
                  ) : page === 'evidence' ? (
                    <Evidence
                      initialCriterion={proofId}
                      closeContext={() => setProofId(undefined)}
                      readOnly={!!readOnly}
                      key={p.id}
                      p={p}
                      change={store.change}
                    />
                  ) : page === 'reports' ? (
                    <Reports
                      initialFoundation={foundationReport}
                      clearInitial={() => setFoundationReport(undefined)}
                      key={p.id}
                      p={p}
                      change={store.change}
                      saved={
                        !readOnly &&
                        store.status === 'Kaydedildi' &&
                        !store.busy
                      }
                    />
                  ) : page === 'methods' ? (
                    <Methods />
                  ) : (
                    <Insights p={p} dark={dark} />
                  )}
                </Suspense>
              </>
            ) : (
              !store.error && (
                <p role="status">
                  {store.status === 'Yükleniyor'
                    ? 'Planlar açılıyor.'
                    : readOnly
                      ? 'Bu kurumda henüz plan yok.'
                      : 'İlk kurum planınızı “Yeni plan” ile açın.'}
                </p>
              )
            )}
          </main>
          <footer>
            <span>Karar Atlası</span>
            <a
              href="https://github.com/karacaismail/decisionactplancodex"
              rel="noreferrer"
              target="_blank"
            >
              Proje kaynağı <ArrowSquareOut size={15} />
            </a>
          </footer>
        </div>
      </div>
      <Modal
        title="Bölüm bul"
        open={quickOpen}
        footer={null}
        onCancel={() => setQuickOpen(false)}
        afterOpenChange={(open) => {
          if (open) document.getElementById('section-query')?.focus()
        }}
      >
        <Input
          id="section-query"
          aria-label="Bölüm adı"
          prefix={<MagnifyingGlass />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPressEnter={() => {
            if (matches.length === 1) jump(matches[0].id)
          }}
          placeholder="Bölüm adı yazın"
        />
        <div className="jump-results">
          {matches.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => jump(id)}>
              <Icon size={19} />
              {label}
            </button>
          ))}
          {!matches.length && <p>Bölüm bulunamadı.</p>}
        </div>
      </Modal>
      <Modal
        title="Yeni plan"
        open={dialog}
        okText="Planı oluştur"
        cancelText="Vazgeç"
        onOk={add}
        onCancel={() => setDialog(false)}
      >
        <div className="fields">
          <label>
            <span>Plan adı</span>
            <Input
              maxLength={120}
              value={name}
              placeholder="Örneğin atölye yatırımı"
              onPressEnter={add}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="field">
            <label id="start-path">Nereden başlıyorsunuz?</label>
            <Radio.Group
              aria-labelledby="start-path"
              className="launch-path"
              value={launch}
              onChange={(e) => setLaunch(e.target.value)}
              options={[
                { value: 'new', label: 'Yeni iş fikri' },
                { value: 'takeover', label: 'Bir işi devralıyorum' },
                { value: 'danger', label: 'Acil zarar tehlikesi' },
              ]}
            />
          </div>
          {nameError && <Alert type="error" title={nameError} />}
        </div>
      </Modal>
      <Modal
        title="Kayıtlı sürüm açılsın mı?"
        open={replacing}
        onCancel={() => setReplacing(false)}
        okText="Kayıtlı sürümü aç"
        cancelText="Vazgeç"
        onOk={() => {
          return store
            .reload()
            .then(() => setReplacing(false))
            .catch((e) => {
              setReplacing(false)
              setError(e.message)
            })
        }}
      >
        Kaydedilmemiş değişiklikler kapanır. Gerekirse önce JSON kopyanızı
        indirin.
      </Modal>
    </ConfigProvider>
  )
}
