import { useCallback, useEffect, useState } from 'react'
import type { DataIndex } from './data/indexDataset'
import { loadDataset } from './data/load'
import { bindRouter } from './router/bind'
import { useStore } from './state/store'
import { EraNav } from './ui/EraNav'
import { ErrorView } from './ui/ErrorView'
import { ListView } from './ui/ListView'
import { Loading } from './ui/Loading'
import { ModeToggle } from './ui/ModeToggle'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; index: DataIndex }

export default function App() {
  const [data, setData] = useState<LoadState>({ status: 'loading' })
  const mode = useStore((s) => s.mode)

  const load = useCallback(() => {
    setData({ status: 'loading' })
    loadDataset()
      .then((index) => setData({ status: 'ready', index }))
      .catch((e: unknown) => setData({ status: 'error', message: e instanceof Error ? e.message : String(e) }))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (data.status !== 'ready') return
    return bindRouter(data.index)
  }, [data])

  if (data.status === 'loading') return <Loading />
  if (data.status === 'error') return <ErrorView message={data.message} onRetry={load} />
  const { index } = data

  return (
    <>
      <header className="top">
        <h1>Основание: карта вселенной</h1>
        <ModeToggle />
      </header>
      <EraNav index={index} />
      <main>
        {mode !== 'list' && <p className="notice">3D-режимы «Хроника» и «Карта» появятся в следующей версии. Пока — список.</p>}
        <ListView index={index} />
      </main>
    </>
  )
}
