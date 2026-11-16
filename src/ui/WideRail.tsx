import { Brand, navigation, type NavProps, type Page } from './navigation'
import './wide.css'

const sections: { title: string; pages: Page[] }[] = [
  {
    title: 'Çalışma alanı',
    pages: ['dashboard', 'portfolio', 'editor', 'gecis', 'evidence', 'work'],
  },
  { title: 'İnceleme', pages: ['insights', 'reports', 'methods'] },
  { title: 'Yönetim', pages: ['team', 'moduller'] },
]

export default function WideRail({ page, go }: NavProps) {
  return (
    <nav className="product-nav" aria-label="Ana menü">
      <Brand />
      {sections.map(({ title, pages }) => {
        const items = navigation.filter((item) => pages.includes(item.id))
        if (!items.length) return null
        return (
          <div className="nav-group" key={title}>
            <p>{title}</p>
            {items.map((item) => {
              const id = item.id
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
        )
      })}
    </nav>
  )
}
