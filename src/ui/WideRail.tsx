import { HardDrives, CaretRight } from '@phosphor-icons/react'
import { navigation, Brand, type NavProps } from './navigation'
import './wide.css'
const groups = [
  {
    title: 'Çalışma alanı',
    entries: ['dashboard', 'portfolio', 'editor', 'work'],
  },
  {
    title: 'İnceleme',
    entries: ['evidence', 'insights', 'reports', 'methods'],
  },
  { title: 'Yönetim', entries: ['team'] },
]
export default function WideRail({ page, go, scope }: NavProps) {
  return (
    <aside className="wide-rail">
      <Brand />
      <nav aria-label="Ana menü">
        {groups.map((group) => (
          <div className="rail-group" key={group.title}>
            <span>{group.title}</span>
            {group.entries.map((id) => {
              const entry = navigation.find((n) => n.id === id)!
              const Icon = entry.icon
              return (
                <button
                  key={id}
                  aria-current={page === id ? 'page' : undefined}
                  onClick={() => go(entry.id)}
                >
                  <Icon
                    size={20}
                    weight={page === id ? 'duotone' : 'regular'}
                  />
                  {entry.label}
                  {page === id && (
                    <CaretRight className="rail-pointer" size={14} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="rail-bottom">
        <span className="rail-drive">
          <HardDrives size={20} />
        </span>
        <div>
          <b>{scope || 'Kişisel alan'}</b>
          <small>
            {scope ? 'Bu Mac’te saklanır' : 'Bu tarayıcıda saklanır'}
          </small>
        </div>
      </div>
    </aside>
  )
}
