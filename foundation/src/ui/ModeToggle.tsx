import { MODES, type Mode } from '../router/hash'
import { useStore } from '../state/store'

const TITLES: Record<Mode, string> = { chronicle: 'Хроника', map: 'Карта', list: 'Список' }

export function ModeToggle() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  return (
    <nav className="modes" aria-label="Режим">
      {MODES.map((m) => (
        <button key={m} type="button" className={m === mode ? 'active' : ''} aria-pressed={m === mode} onClick={() => setMode(m)}>
          {TITLES[m]}
        </button>
      ))}
    </nav>
  )
}
