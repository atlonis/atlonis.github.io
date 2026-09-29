import { useCallback, useEffect, useState } from 'react'
import type { DataIndex } from './data/indexDataset'
import { loadDataset } from './data/load'
import { bindRouter } from './router/bind'
import { decide3D, readGateEnv } from './scene/gate'
import { SceneHost } from './scene/SceneHost'
import { SceneNotice } from './scene/SceneNotice'
import { useStore } from './state/store'
import { EntityCard } from './ui/EntityCard'
import { EraNav } from './ui/EraNav'
import { ErrorView } from './ui/ErrorView'
import { ListView } from './ui/ListView'
import { Loading } from './ui/Loading'
import { ModeToggle } from './ui/ModeToggle'
import { SpoilerBanner } from './ui/SpoilerBanner'
import { Toast } from './ui/Toast'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; index: DataIndex }

export default function App() {
  const [data, setData] = useState<LoadState>({ status: 'loading' })
  const mode = useStore((s) => s.mode)
  const gate = useStore((s) => s.gate)
  const scene3d = useStore((s) => s.scene3d)
  const setGate = useStore((s) => s.setGate)

  const load = useCallback(() => {
    setData({ status: 'loading' })
    loadDataset()
      .then((index) => setData({ status: 'ready', index }))
      .catch((e: unknown) => setData({ status: 'error', message: e instanceof Error ? e.message : String(e) }))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setGate(decide3D(readGateEnv())) }, [setGate])
  useEffect(() => {
    if (data.status !== 'ready') return
    return bindRouter(data.index)
  }, [data])

  if (data.status === 'loading') return <Loading />
  if (data.status === 'error') return <ErrorView message={data.message} onRetry={load} />
  const { index } = data

  const in3d = mode !== 'list' && gate !== 'unavailable'
  const sceneShown = in3d && scene3d === 'ready'

  return (
    <div className={sceneShown ? 'app scene-on' : 'app'}>
      <SpoilerBanner />
      <header className="top">
        <h1>Основание: карта вселенной</h1>
        {gate !== 'unavailable' && <ModeToggle />}
      </header>
      <EraNav index={index} />
      {in3d && <SceneHost index={index} />}
      {!sceneShown && (
        <main>
          {mode !== 'list' && <SceneNotice />}
          <ListView index={index} />
        </main>
      )}
      <EntityCard index={index} />
      <Toast />
    </div>
  )
}
