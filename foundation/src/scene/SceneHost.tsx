import { type ComponentType, useEffect, useMemo, useState } from 'react'
import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'

type SceneComponent = ComponentType<{ index: DataIndex }>

/** Оболочка: грузит 3D-чанк динамическим import(), когда want3d; ошибку импорта переводит в 'failed'. */
export function SceneHost({ index }: { index: DataIndex }) {
  const want3d = useStore((s) => s.want3d)
  const attempt = useStore((s) => s.sceneAttempt)
  const scene3d = useStore((s) => s.scene3d)
  const setScene3d = useStore((s) => s.setScene3d)
  const [Scene, setScene] = useState<SceneComponent | null>(null)
  const debug = useMemo(() => new URLSearchParams(location.search).has('debug'), [])

  useEffect(() => {
    if (!want3d || Scene) return
    let alive = true
    setScene3d('loading')
    import('./SceneRoot')
      .then((m) => { if (alive) setScene(() => m.default) })
      .catch(() => { if (alive) setScene3d('failed') })
    return () => { alive = false }
  }, [want3d, attempt, Scene, setScene3d])

  // Ушли в «Список» — сцена размонтирована; при возврате статус не должен остаться 'ready'.
  useEffect(() => () => setScene3d('idle'), [setScene3d])

  if (!want3d || !Scene || scene3d === 'lost' || scene3d === 'failed') return null
  return (
    <div className="stage" aria-hidden="true">
      <Scene key={attempt} index={index} />
      {debug && <pre id="debug-stats" className="debug" />}
    </div>
  )
}
