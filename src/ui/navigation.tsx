import {
  SquaresFour,
  Buildings,
  Stack,
  ClipboardText,
  Path,
  BookOpenText,
  Files,
  ChartBar,
  Notepad,
} from '@phosphor-icons/react'
import { personalOnly } from '../hosting'
const pages = [
  { id: 'dashboard', label: 'Karar panosu', icon: SquaresFour },
  { id: 'portfolio', label: 'Plan portföyü', icon: Stack },
  { id: 'asamalar', label: 'Strateji yönetimi', icon: Stack },
  { id: 'editor', label: 'Plan adımları', icon: Path },
  { id: 'gecis', label: 'Planlamaya geçiş', icon: Path },
  { id: 'evidence', label: 'Kanıt defteri', icon: Notepad },
  { id: 'work', label: 'Görevler', icon: ClipboardText },
  { id: 'insights', label: 'Göstergeler', icon: ChartBar },
  { id: 'reports', label: 'Raporlar', icon: Files },
  { id: 'methods', label: 'Karar Kitabı', icon: BookOpenText },
  { id: 'team', label: 'Kurum alanı', icon: Buildings },
] as const
export type Page = (typeof pages)[number]['id']
export const navigation = pages.filter(
  ({ id }) => !personalOnly || id !== 'team',
)
export interface NavProps {
  scope?: string
  page: Page
  go: (page: Page) => void
}
export function Brand() {
  return (
    <div className="brand">
      <img
        src={import.meta.env.BASE_URL + 'mark.svg'}
        width="39"
        height="39"
        alt=""
      />
      <span>
        Karar <b>Atlası</b>
      </span>
    </div>
  )
}
