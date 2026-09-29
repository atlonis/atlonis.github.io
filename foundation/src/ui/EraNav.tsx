import type { CSSProperties } from 'react'
import type { DataIndex } from '../data/indexDataset'
import { useSceneStore } from '../scene/sceneStore'
import { useStore } from '../state/store'

export function EraNav({ index }: { index: DataIndex }) {
  const eraId = useStore((s) => s.eraId)
  const setEra = useStore((s) => s.setEra)
  const go = (id: string) => {
    setEra(id)
    // Чип всегда летит к своей остановке, даже если eraId не изменился (сцена регистрирует scrollToEra, пока смонтирована).
    useSceneStore.getState().scrollToEra?.(id, 0.8)
    document.getElementById(`era-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <nav className="eras" aria-label="Эры">
      {index.eras.map((era) => (
        <button
          key={era.id}
          type="button"
          className={era.id === eraId ? 'chip active' : 'chip'}
          style={{ '--era': era.palette.primary } as CSSProperties}
          onClick={() => go(era.id)}
        >
          {era.name.ru}
        </button>
      ))}
    </nav>
  )
}
