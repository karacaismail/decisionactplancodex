import { HardDrives } from '@phosphor-icons/react'
import { navigation, Brand, type NavProps } from './navigation'
import './wide.css'
export default function WideRail({ page, go }: NavProps) {
  return (
    <aside className="wide-rail">
      <Brand />
      <div className="rail-group">Çalışma alanı</div>
      <nav aria-label="Ana menü">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-current={id === page ? 'page' : undefined}
            onClick={() => go(id)}
          >
            <Icon size={21} weight={id === page ? 'fill' : 'regular'} />
            {label}
          </button>
        ))}
      </nav>
      <div className="rail-bottom">
        <HardDrives size={23} />
        <div>
          <b>Yerel çalışma alanı</b>
          <small>Bu tarayıcıda saklanır</small>
        </div>
      </div>
    </aside>
  )
}
