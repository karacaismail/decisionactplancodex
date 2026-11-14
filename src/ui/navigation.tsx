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
export const navigation = [
  { id: 'dashboard', label: 'Karar panosu', icon: SquaresFour },
  { id: 'portfolio', label: 'Plan portföyü', icon: Stack },
  { id: 'editor', label: 'Plan adımları', icon: Path },
  { id: 'gecis', label: 'Planlamaya geçiş', icon: Path },
  { id: 'evidence', label: 'Kanıt defteri', icon: Notepad },
  { id: 'work', label: 'Görevler', icon: ClipboardText },
  { id: 'insights', label: 'Göstergeler', icon: ChartBar },
  { id: 'reports', label: 'Raporlar', icon: Files },
  { id: 'methods', label: 'Karar Kitabı', icon: BookOpenText },
  { id: 'team', label: 'Kurum alanı', icon: Buildings },
] as const
export type Page = (typeof navigation)[number]['id']
export interface NavProps {
  scope?: string
  page: Page
  go: (page: Page) => void
}
export function Brand() {
  return (
    <div className="brand">
      <img src="/mark.svg" width="39" height="39" alt="" />
      <span>
        Karar <b>Atlası</b>
      </span>
    </div>
  )
}
