import './new-field.css'
import { useState } from 'react'
import { Button } from 'antd'
import { Pause, Play } from '@phosphor-icons/react'
import { storagePrefix } from '../hosting'

export const newFieldDescription = 'Bu sürümde eklendi veya güncellendi.'

export function NewFieldLabel({
  text,
  marked,
}: {
  text: string
  marked?: boolean
}) {
  if (!marked) return <>{text}</>
  return (
    <span className="release-label">
      {text}{' '}
      <span className="new-field-badge" aria-hidden="true" lang="en">
        <span className="new-field-dot" />
        new
      </span>
    </span>
  )
}

const preference = storagePrefix + 'atlas-pause-new-marks'

export function NewFieldMotion() {
  const [paused, setPaused] = useState(() => {
    try {
      return sessionStorage.getItem(preference) === 'on'
    } catch {
      return false
    }
  })
  const label = paused
    ? 'Yeni alanların hareketini başlat'
    : 'Yeni alanların hareketini durdur'
  return (
    <Button
      type="text"
      size="small"
      className="new-field-motion"
      data-paused={paused}
      icon={paused ? <Play /> : <Pause />}
      onClick={() => {
        setPaused(!paused)
        try {
          sessionStorage.setItem(preference, paused ? 'off' : 'on')
        } catch {
          /* The current view still retains the choice. */
        }
      }}
    >
      {label}
    </Button>
  )
}
