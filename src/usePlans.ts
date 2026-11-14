import { useEffect, useRef, useState } from 'react'
import { invalidate } from './readiness'
import { readPlans, savePlan } from './store'
import { demonstration } from './demo'
import type { Plan } from './domain'

import { teamRequest, type Session } from './team'
export function usePlans(session: Session | null) {
  const list = () =>
    session ? teamRequest<Plan[]>('list', undefined, session) : readPlans()
  const persist = (p: Plan) =>
    session ? teamRequest<Plan>('save', { plan: p }, session) : savePlan(p)
  const lastKey = session ? 'atlas-last-' + session.workspace.id : 'atlas-plan'
  const [plans, setPlans] = useState<Plan[]>([]),
    [selected, select] = useState(''),
    [status, setStatus] = useState('Yükleniyor')
  const [loadError, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [failures, setFailures] = useState<Record<string, string>>({})
  const confirmed = useRef(new Map<string, string | undefined>())
  const data = useRef(new Map<string, Plan>()),
    pending = useRef(new Set<string>()),
    running = useRef(false),
    blocked = useRef(new Set<string>())
  function render() {
    setPlans([...data.current.values()])
  }
  const loadId = useRef(0)
  async function load() {
    const token = ++loadId.current
    const before = new Map(data.current)
    const rows = await list()
    if (!rows.length && !session) {
      try {
        rows.push(await savePlan(demonstration()))
      } catch (e) {
        const concurrent = await readPlans()
        if (!concurrent.length) throw e
        rows.push(...concurrent)
      }
    }
    if (token !== loadId.current) return
    for (const p of rows) {
      const current = data.current.get(p.id)
      if (
        !pending.current.has(p.id) &&
        !blocked.current.has(p.id) &&
        current === before.get(p.id) &&
        (!current || p.revision >= current.revision)
      ) {
        data.current.set(p.id, p)
        confirmed.current.set(p.id, p.foundation?.decisions.at(-1)?.id)
      }
    }
    let last = ''
    try {
      last = localStorage.getItem(lastKey) || ''
    } catch {}
    render()
    select((prev) =>
      data.current.has(prev)
        ? prev
        : data.current.has(last)
          ? last
          : rows.find((p) => !p.example)?.id || rows[0]?.id || '',
    )
    setError('')
    if (!running.current) setStatus('Kaydedildi')
  }
  useEffect(() => {
    if (selected)
      try {
        localStorage.setItem(lastKey, selected)
      } catch {}
  }, [selected])
  useEffect(() => {
    load().catch((e) => {
      setError(String(e.message || e))
      setStatus('Kayıt açılamadı')
    })
  }, [])
  useEffect(() => {
    function before(e: BeforeUnloadEvent) {
      if (pending.current.size || running.current || blocked.current.size) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', before)
    return () => window.removeEventListener('beforeunload', before)
  }, [])
  async function flush() {
    if (running.current) return
    running.current = true
    setBusy(true)
    try {
      for (;;) {
        const id = [...pending.current].find((id) => !blocked.current.has(id))
        if (!id) break
        const snapshot = data.current.get(id)!
        try {
          const saved = await persist(snapshot),
            latest = data.current.get(id)!
          confirmed.current.set(id, saved.foundation?.decisions.at(-1)?.id)
          if (latest === snapshot) {
            data.current.set(id, saved)
            pending.current.delete(id)
          } else
            data.current.set(id, {
              ...latest,
              revision: saved.revision,
              updatedAt: saved.updatedAt,
            })
          render()
        } catch (e) {
          blocked.current.add(id)
          const message = e instanceof Error ? e.message : 'Kayıt başarısız.'
          setFailures((prev) => ({ ...prev, [id]: message }))
        }
      }
      setStatus('Kaydedildi')
    } finally {
      running.current = false
      setBusy(false)
    }
  }
  const [generation, setGeneration] = useState(0)
  async function reload() {
    if (!selected) return load()
    const saved = (await list()).find((p) => p.id === selected)
    if (!saved)
      throw Error(
        'Bu planın kaydedilmiş sürümü bulunamadı. JSON kopyanızı indirin.',
      )
    confirmed.current.set(selected, saved.foundation?.decisions.at(-1)?.id)
    data.current.set(selected, saved)
    setGeneration((n) => n + 1)
    pending.current.delete(selected)
    blocked.current.delete(selected)
    setFailures((prev) => {
      const next = { ...prev }
      delete next[selected]
      return next
    })
    render()
  }
  function write(plan: Plan) {
    if (session && ['reader', 'reviewer'].includes(session.user.role)) {
      setError('Bu hesap yalnız okuyabilir.')
      return
    }

    data.current.set(plan.id, plan)
    pending.current.add(plan.id)
    render()
    if (!blocked.current.has(plan.id)) setStatus('Kaydediliyor')
    void flush()
  }
  function change(fn: (p: Plan) => Plan) {
    const p = data.current.get(selected)
    if (p) {
      const next = fn(p)
      if (next !== p) write(invalidate(p, next))
    }
  }
  return {
    plans,
    confirmedTransition: confirmed.current.get(selected),
    refresh: load,
    plan: plans.find((p) => p.id === selected),
    select,
    write,
    change,
    status: failures[selected] ? 'Kaydedilemedi' : status,
    busy,
    hasDraft: busy || pending.current.size > 0,
    generation,
    error: failures[selected] || loadError,
    reload,
  }
}
