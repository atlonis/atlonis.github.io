import gsap from 'gsap'
import { invalidate } from '@react-three/fiber'
import { markAlive, useSceneStore } from './sceneStore'

/** Единственный способ твинить в сцене: каждый шаг просит кадр, при reduced-motion — мгновенно. */
export function tweenTo<T extends object>(target: T, vars: gsap.TweenVars): gsap.core.Tween {
  markAlive()
  const reduced = useSceneStore.getState().reducedMotion
  return gsap.to(target, {
    ...vars,
    duration: reduced ? 0 : vars.duration,
    onUpdate: () => {
      vars.onUpdate?.()
      invalidate()
    },
  })
}
