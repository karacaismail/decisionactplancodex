import { createRoot } from 'react-dom/client'
import '@fontsource-variable/outfit'
import 'dayjs/locale/tr'
import dayjs from 'dayjs'
import App from './App'
import './styles.css'
dayjs.locale('tr')
const root = document.documentElement
window.addEventListener(
  'keydown',
  (e) => {
    if (e.key === 'Tab') root.dataset.keyboard = 'on'
  },
  true,
)
for (const event of ['pointerdown', 'touchstart'])
  window.addEventListener(event, () => delete root.dataset.keyboard, {
    capture: true,
    passive: true,
  })
createRoot(document.getElementById('root')!).render(<App />)
