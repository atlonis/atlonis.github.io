import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { lowerTier, shouldDowngrade } from './tier'
import { useSceneStore } from './sceneStore'

/** Первые 30 кадров — прогрев (компиляция шейдеров, JIT), не считаются. Затем 60 подряд идущих кадров (промежуток < 100 мс): средний кадр > 20 мс → тир ниже. Один раз, только вниз. */
export function FrameMeter() {
  const samples = useRef<number[]>([])
  const last = useRef(0)
  const done = useRef(false)
  const warmup = useRef(0)
  useFrame(() => {
    if (done.current) return
    if (warmup.current < 30) { warmup.current++; last.current = performance.now(); return }
    const now = performance.now()
    const gap = now - last.current
    last.current = now
    if (gap <= 0 || gap > 100) return
    samples.current.push(gap)
    if (samples.current.length < 60) return
    done.current = true
    if (shouldDowngrade(samples.current, 60, 20)) {
      const s = useSceneStore.getState()
      if (s.tier !== 'low') s.setTier(lowerTier(s.tier))
    }
  })
  return null
}
