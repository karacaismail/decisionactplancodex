import { useState } from 'react'
import { catalog, groups, type ModuleId, type Scope } from './catalog'

export function useModulePlan() {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('tumu')
  const [group, setGroup] = useState<(typeof groups)[number] | ''>('')
  const [expanded, setExpanded] = useState<ModuleId>()
  const matches = catalog
    .search(query, scope)
    .filter((m) => !group || m.group === group)
  function reset() {
    setQuery('')
    setScope('tumu')
    setGroup('')
    setExpanded(undefined)
  }
  function reveal(id: ModuleId) {
    reset()
    setExpanded(id)
    requestAnimationFrame(() => {
      const summary = document.getElementById('module-' + id)
      if (summary) {
        summary.focus({ preventScroll: true })
        summary.scrollIntoView({ block: 'start' })
      }
    })
  }
  return {
    query,
    setQuery,
    scope,
    setScope,
    group,
    setGroup,
    expanded,
    toggle: (id: ModuleId) =>
      setExpanded((prev) => (prev === id ? undefined : id)),
    matches,
    reset,
    reveal,
  }
}
