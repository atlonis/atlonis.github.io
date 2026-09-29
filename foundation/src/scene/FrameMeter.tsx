import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { lowerTier, shouldDowngrade } from './tier'
import { useSceneStore } from './sceneStore'

/** Столько кадров подряд дольше 100 мс — устройство точно медленное: ждать 60 «нормальных» кадров бессмысленно. */
const SLOW_STREAK = 5

/**
 * Первые 30 кадров — прогрев (компиляция шейдеров, JIT), не считаются. Затем 60 подряд идущих кадров
 * (промежуток < 100 мс): средний кадр > 20 мс → тир ниже. Один раз, только вниз; после замера тир
 * фиксируется (tierLocked), и перемонтированный метр заново не меряет.
 * Пока замер идёт, метр сам просит следующий кадр: frameloop="demand" без него встанет раньше времени.
 */
export function FrameMeter() {
  const samples = useRef<number[]>([])
  const last = useRef(0)
  const done = useRef(false)
  const warmup = useRef(0)
  const slow = useRef(0)
  useFrame((state) => {
    if (done.current || useSceneStore.getState().tierLocked) return
    if (warmup.current < 30) {
      warmup.current++
      last.current = performance.now()
      state.invalidate()
      return
    }
    const now = performance.now()
    const gap = now - last.current
    last.current = now
    if (document.visibilityState === 'hidden') {
      slow.current = 0 // rAF скрытой вкладки троттлится — это не медлительность устройства
    } else if (gap > 100) {
      slow.current++
    } else if (gap > 0) {
      slow.current = 0
      samples.current.push(gap)
    }
    const verySlow = slow.current >= SLOW_STREAK
    if (samples.current.length < 60 && !verySlow) {
      state.invalidate()
      return
    }
    done.current = true
    const s = useSceneStore.getState()
    s.setTierLocked(true)
    if ((verySlow || shouldDowngrade(samples.current, 60, 20)) && s.tier !== 'low') s.setTier(lowerTier(s.tier))
  })
  return null
}
