import { navigation, type NavProps } from './navigation'
import './wide.css'

export default function WideRail({ page, go }: NavProps) {
  return (
    <nav className="product-nav" aria-label="Ana menü">
      {navigation.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={page === id ? 'page' : undefined}
          onClick={() => go(id)}
        >
          <Icon size={18} weight={page === id ? 'fill' : 'regular'} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
