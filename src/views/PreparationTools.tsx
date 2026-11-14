import { lazy, Suspense, useState } from 'react'
import { Button } from 'antd'
import { methodsFor, type MethodId } from '../preparationMethods'
import type { Plan } from '../domain'

const StudyForm = lazy(() => import('./StudyForm'))
export default function PreparationTools({
  p,
  step,
  change,
  disabled,
  actor,
  openProof,
}: {
  p: Plan
  step: string
  change: (fn: (current: Plan) => Plan) => void
  openProof: (id: string) => void
  actor?: string
  disabled: boolean
}) {
  const [opened, setOpened] = useState<MethodId>()
  const [others, setOthers] = useState(false)
  const available = methodsFor(p, step)
  if (!available.length) return null
  const hidden = available.filter((m) => !m.suggested)
  return (
    <section
      className="method-work brief-editor"
      aria-label="Hazırlık yöntemleri"
    >
      <h4>Hazırlık yöntemleri</h4>
      {available
        .filter((m) => m.suggested || others || opened === m.id)
        .map((m) => {
          const open = opened === m.id
          return (
            <section key={m.id} className="method-choice">
              <Button
                className="method-trigger"
                aria-expanded={open}
                aria-controls={open ? 'method-form-' + m.id : undefined}
                onClick={() => setOpened(open ? undefined : m.id)}
              >
                {m.title}
              </Button>
              {open && (
                <div id={'method-form-' + m.id}>
                  <p>{m.hint}</p>
                  <Suspense fallback={<p role="status">Yöntem açılıyor.</p>}>
                    <StudyForm
                      openProof={openProof}
                      actor={actor}
                      key={m.id}
                      method={m}
                      p={p}
                      change={change}
                      disabled={disabled}
                    />
                  </Suspense>
                </div>
              )}
            </section>
          )
        })}
      {hidden.length > 0 && (
        <Button
          type="link"
          aria-expanded={others}
          onClick={() => {
            if (others && hidden.some((m) => m.id === opened))
              setOpened(undefined)
            setOthers(!others)
          }}
        >
          {others ? 'Diğer yöntemleri gizle' : 'Bu adıma uygun diğer yöntemler'}
        </Button>
      )}
    </section>
  )
}
