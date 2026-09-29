import { Component, type ReactNode, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'
import { Background } from './Background'
import { ContextLossGuard } from './ContextLossGuard'
import { Core } from './Core'
import { DebugStats } from './DebugStats'
import { Dust } from './Dust'
import { FrameMeter } from './FrameMeter'
import { Galaxy } from './GalaxyLayer'
import { setPaletteNow } from './palette'
import { useSceneStore } from './sceneStore'
import { TIER_PARAMS, detectTier, readTierEnv } from './tier'

class GLErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

/** Один раз до первого рендера сцены: тир, reduced-motion, активная эра и стартовая палитра из URL. Идемпотентно (StrictMode зовёт дважды). */
function initSceneState(index: DataIndex): void {
  const eraId = useStore.getState().eraId
  useSceneStore.setState({
    tier: detectTier(readTierEnv()),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    activeEraId: eraId,
  })
  const era = index.eras.find((e) => e.id === eraId) ?? index.eras[0]
  setPaletteNow(era.palette.primary, era.palette.glow)
}

export default function SceneRoot({ index }: { index: DataIndex }) {
  const setScene3d = useStore((s) => s.setScene3d)
  // Ленивый инициализатор бежит до подписки на tier ниже — Canvas сразу монтируется с верным тиром, без перемонтирования.
  useState(() => { initSceneState(index); return true })
  const tier = useSceneStore((s) => s.tier)
  const params = TIER_PARAMS[tier]
  const debug = useMemo(() => new URLSearchParams(location.search).has('debug'), [])

  return (
    <GLErrorBoundary onError={() => setScene3d('failed')}>
      <Canvas
        key={tier}
        frameloop="demand"
        dpr={[1, params.dpr]}
        gl={{ antialias: params.antialias, powerPreference: 'high-performance', alpha: false }}
        camera={{ fov: 50, near: 1, far: 1500, position: [0, 90, 220] }}
        onCreated={(state) => {
          state.gl.setClearColor('#070912')
          setScene3d('ready')
        }}
      >
        <ContextLossGuard />
        <FrameMeter />
        {debug && <DebugStats />}
        <Background tier={tier} />
        <Galaxy tier={tier} />
        <Dust tier={tier} />
        <Core />
      </Canvas>
    </GLErrorBoundary>
  )
}
