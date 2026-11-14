import { useEffect, useState } from 'react'
import { Select } from 'antd'
import { teamRequest, type Session } from '../team'
import type { Plan } from '../domain'

export default function TeamOwner({
  p,
  session,
  readOnly,
  select,
}: {
  p: Plan
  session: Session
  readOnly: boolean
  select: (name: string) => void
}) {
  const owner = String(p.answers['01']?.owner ?? '')
  const [names, setNames] = useState<string[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (readOnly) return
    let active = true
    teamRequest<string[]>('owners', undefined, session)
      .then((list) => {
        if (active) setNames(list)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [readOnly, session])
  const canAssign =
    !owner ||
    owner === session.user.name ||
    (session.user.role === 'admin' && !names.includes(owner))
  return (
    <>
      <Select
        id="field-owner"
        aria-label="Karar sahibi"
        virtual={false}
        value={owner || undefined}
        disabled={readOnly || !names.length || !canAssign}
        placeholder="Üye seçin"
        options={names.map((name) => ({ value: name, label: name }))}
        onChange={select}
      />
      {p.importedOwner && <p>Önceki planın karar sahibi: {p.importedOwner}</p>}
      {error && <p role="alert">{error}</p>}
    </>
  )
}
