import { storagePrefix } from './hosting'
import { now, validatePlan } from './domain'
import type { Plan } from './domain'

let connection: Promise<IDBDatabase> | undefined
function openDatabase() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const req = indexedDB.open(storagePrefix + 'karar-atlasi', 1)
      req.onupgradeneeded = () =>
        req.result.createObjectStore('plans', { keyPath: 'id' })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        connection = undefined
        reject(req.error)
      }
    })
  return connection
}
export async function readPlans(): Promise<Plan[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const req = db.transaction('plans').objectStore('plans').getAll()
    req.onsuccess = () =>
      req.result.every(validatePlan)
        ? resolve(req.result)
        : reject(Error('Kayıt biçimi tanınmadı.'))
    req.onerror = () => reject(req.error)
  })
}
export async function savePlan(p: Plan): Promise<Plan> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('plans', 'readwrite'),
      store = tx.objectStore('plans'),
      read = store.get(p.id)
    const next = { ...p, revision: p.revision + 1, updatedAt: now() }
    let conflict = false
    read.onsuccess = () => {
      if ((read.result?.revision ?? 0) !== p.revision) {
        conflict = true
        tx.abort()
        return
      }
      store.put(next)
    }
    tx.oncomplete = () => resolve(next)
    tx.onabort = () =>
      reject(
        Error(
          conflict
            ? 'Başka bir sekme bu planı değiştirdi. Kopyanızı indirin veya kayıtlı sürümü açın.'
            : 'Tarayıcı kaydı tamamlayamadı. Kopyanızı indirebilirsiniz.',
        ),
      )
    tx.onerror = () => reject(tx.error)
  })
}
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
