import { useState } from 'react'
import { Drawer, Button } from 'antd'
import { List } from '@phosphor-icons/react'
import { navigation, Brand, type NavProps } from './navigation'
import './small.css'
export default function SmallNav({ page, go }: NavProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="small-nav">
      <Button
        type="text"
        aria-label="Menüyü aç"
        icon={<List size={24} />}
        onClick={() => setOpen(true)}
      />
      <Brand />
      <Drawer
        open={open}
        placement="left"
        title="Çalışma alanı"
        onClose={() => setOpen(false)}
        size="min(85vw, 320px)"
      >
        <nav className="drawer-nav" aria-label="Ana menü">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={id === page ? 'page' : undefined}
              onClick={() => {
                setOpen(false)
                go(id)
              }}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </nav>
      </Drawer>
    </div>
  )
}
