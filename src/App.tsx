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
} from '@phosphor-icons/react'
import { usePlans } from './usePlans'
import { currentStage, validatePlan } from './domain'
import { download } from './store'
import { navigation, type Page } from './ui/navigation'
import { launchPlan, type Launch } from './operations'
import { teamRequest, roleLabel, type Session } from './team'
import Dashboard from './views/Dashboard'
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
  navigation.find((n) => n.id === location.hash.slice(1))?.id ?? 'dashboard'
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
  const wide = useSyncExternalStore(subscribe, () => width.matches)
  useEffect(() => {
    const cb = () => setPage(fromHash())
    window.addEventListener('hashchange', cb)
    return () => window.removeEventListener('hashchange', cb)
  }, [])
  useEffect(() => {
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
  const title = navigation.find((n) => n.id === page)!.label
  return (
    <ConfigProvider
      locale={trTR}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontFamily: '"Outfit Variable", Outfit, sans-serif',
          fontSize: 16,
          colorPrimary: dark ? '#f2aa78' : '#99461f',
          colorText: dark ? '#f1f1e9' : '#1e3338',
          colorTextSecondary: dark ? '#b7c9c6' : '#54696c',
          colorBgContainer: dark ? '#213137' : '#ffffff',
          colorBgElevated: dark ? '#263940' : '#ffffff',
          colorBorder: dark ? '#557072' : '#a6b1ad',
          borderRadius: 9,
          controlHeight: 42,
          motionEaseInOut: 'cubic-bezier(.65,0,.35,1)',
          controlOutlineWidth: 0,
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
        {wide && (
          <Suspense fallback={null}>
            <Wide page={page} go={go} scope={session?.workspace.name} />
          </Suspense>
        )}
        <div className="workspace">
          <header className="topbar">
            {wide ? (
              <div className="breadcrumb">
                <FolderOpen size={20} />
                <span>{session?.workspace.name || 'Çalışma alanı'}</span>
                <span aria-hidden="true">/</span>
                <b>{title}</b>
              </div>
            ) : (
              <Suspense fallback={null}>
                <Small page={page} go={go} />
              </Suspense>
            )}
            <div className="toolbar">
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
                <h1>{title}</h1>
                <p>{descriptions[page]}</p>
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
                  {!wide && (
                    <span className="mobile-save" role="status">
                      {store.status}
                    </span>
                  )}
                </div>
                <Suspense fallback={<p role="status">Bölüm açılıyor.</p>}>
                  {page === 'dashboard' ? (
                    <Dashboard
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
                      key={p.id + '-' + store.generation}
                      p={p}
                      change={store.change}
                      readOnly={!!readOnly}
                      stage={stage}
                      setStage={visitStage}
                    />
                  ) : page === 'evidence' ? (
                    <Evidence
                      readOnly={!!readOnly}
                      key={p.id}
                      p={p}
                      change={store.change}
                    />
                  ) : page === 'reports' ? (
                    <Reports
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
