import { access } from './readiness.ts'
import { calendar, createPlan, effective, now, type Plan } from './domain.ts'
export const states = ['Açık', 'Yürütülüyor', 'Bekliyor', 'Tamamlandı'] as const
export type WorkState = (typeof states)[number]
export type Work = {
  id: string
  title: string
  owner: string
  stage: number
  due: string
  status: WorkState
  proof: string
  updated: string
  decision?: string
}
export const evidenceKinds = [
  'Görüş',
  'Gözlem',
  'Kaynak ayrıldı',
  'Yazılı taahhüt',
  'Ödeme',
  'Teslim veya kullanım',
] as const
export type EvidenceKind = (typeof evidenceKinds)[number]
export type Launch = 'new' | 'takeover' | 'danger'
export function launchPlan(name: string, kind: Launch) {
  const p = createPlan(name)
  p.answers['00'] = { start: kind === 'takeover' ? 'Devralınan iş' : 'Yeni iş' }
  if (kind === 'danger') p.answers['02'] = { danger: 'Var' }
  return p
}
export function workItems(p: Plan): Work[] {
  const saved = p.work || []
  const seen = new Set(saved.map((t) => t.decision))
  const defaults: Record<string, string> = {
    Bekletin: 'Engeli kontrol et',
    'Yeniden deneyin': 'Küçük denemeyi hazırla',
    'Yön değiştirin': 'Alternatif yolu incele',
    Durdurun: 'Açık yükümlülükleri kapat',
  }
  const missing = p.history
    .filter((h) => (h.task?.trim() || defaults[h.outcome]) && !seen.has(h.id))
    .map((h) => ({
      id: 'decision:' + h.id,
      decision: h.id,
      title: h.task?.trim() || defaults[h.outcome],
      owner: h.owner,
      stage: h.stage,
      due: h.date || '',
      status: 'Açık' as WorkState,
      proof: '',
      updated: h.at,
    }))
  return [...saved, ...missing]
}
export function retired(p: Plan, w: Work) {
  if (w.id.startsWith('gecis:')) {
    const grant = access(p)
    return !grant.active || w.id !== 'gecis:' + grant.last?.id
  }
  if (!w.decision) return false
  const last = p.history.findLast((h) => h.stage === w.stage)
  return last?.id !== w.decision || last.stale
}
export function workLabel(p: Plan, w: Work) {
  return w.status === 'Tamamlandı'
    ? w.status
    : retired(p, w)
      ? 'Geçmiş kayıt'
      : w.status
}
export function activeWork(p: Plan) {
  return workItems(p).filter((w) => w.status !== 'Tamamlandı' && !retired(p, w))
}
export function newWork(
  p: Plan,
  input: { title: string; owner: string; stage: number; due: string },
) {
  if (!input.title.trim() || !input.owner.trim())
    throw Error('İşi ve sorumlusunu yazın.')
  if (input.due && !calendar(input.due)) throw Error('Geçerli bir tarih seçin.')
  const w: Work = {
    ...input,
    title: input.title.trim(),
    owner: input.owner.trim(),
    id: crypto.randomUUID(),
    status: 'Açık',
    proof: '',
    updated: now(),
  }
  return { ...p, work: [...(p.work || []), w] }
}
export function updateWork(
  p: Plan,
  id: string,
  status: WorkState,
  proof: string,
) {
  const w = workItems(p).find((w) => w.id === id)
  if (!w) throw Error('Görev bulunamadı.')
  if (retired(p, w)) throw Error('Bu görevin dayandığı karar güncel değil.')
  if (status === 'Tamamlandı' && !proof.trim())
    throw Error('Kapanış kanıtını yazın.')
  return {
    ...p,
    work: [
      ...(p.work || []).filter((i) => i.id !== id),
      { ...w, status, proof: proof.trim(), updated: now() },
    ],
  }
}
export function workContext(p: Plan, w: Work) {
  if (w.id.startsWith('gecis:'))
    return retired(p, w) ? 'Geçmiş geçiş kararı' : 'Koşullu geçiş kararı'
  const h = p.history.find((d) => d.id === w.decision)
  return h
    ? retired(p, w)
      ? 'Kararı yeniden inceleyin'
      : effective(h)
    : 'Elle açılan görev'
}
export function validWork(
  v: unknown,
  history: { id: string; stage: number }[],
): boolean {
  if (v === undefined) return true
  if (!Array.isArray(v)) return false
  return (
    new Set(v.map((w) => w?.id)).size === v.length &&
    v.every(
      (w) =>
        w &&
        typeof w.id === 'string' &&
        !!w.id &&
        typeof w.title === 'string' &&
        !!w.title.trim() &&
        typeof w.owner === 'string' &&
        !!w.owner.trim() &&
        Number.isInteger(w.stage) &&
        w.stage >= 0 &&
        w.stage < 8 &&
        (w.due === '' || calendar(w.due)) &&
        states.includes(w.status) &&
        typeof w.proof === 'string' &&
        (w.status !== 'Tamamlandı' || !!w.proof.trim()) &&
        typeof w.updated === 'string' &&
        Number.isFinite(Date.parse(w.updated)) &&
        (w.decision === undefined
          ? !w.id.startsWith('decision:')
          : w.id === 'decision:' + w.decision &&
            history.some((h) => h?.id === w.decision && h.stage === w.stage)),
    )
  )
}

export const handoverChecks = [
  ['incident', 'Son olayın kaydı', '05'],
  ['commitment', 'Yetkili kişinin taahhüdü', '14'],
  ['delivery', 'Tamamlanan teslim', '23'],
  ['cash', 'Ödeme ve açık borçlar', '16'],
] as const
export type HandoverCheck = {
  status: 'Bilinmiyor' | 'Kayıt var' | 'Kayıt eksik'
  source: string
}
