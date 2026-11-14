import { Brand, navigation, type NavProps, type Page } from './navigation'
import './wide.css'

const sections: { title: string; pages: Page[] }[] = [
  {
    title: 'Çalışma alanı',
    pages: ['dashboard', 'portfolio', 'editor', 'gecis', 'evidence', 'work'],
  },
  { title: 'İnceleme', pages: ['insights', 'reports', 'methods'] },
  { title: 'Yönetim', pages: ['team'] },
]

export default function WideRail({ page, go }: NavProps) {
  return (
    <nav className="product-nav" aria-label="Ana menü">
      <Brand />
      {sections.map(({ title, pages }) => (
        <div className="nav-group" key={title}>
          <p>{title}</p>
          {pages.map((id) => {
            const item = navigation.find((n) => n.id === id)!
            const Icon = item.icon
            const selected = page === id
            return (
              <button
                key={id}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => go(id)}
              >
                <Icon size={20} weight={selected ? 'duotone' : 'regular'} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
