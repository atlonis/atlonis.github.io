import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/** ?debug — draw calls, треугольники и кадры в секунду в #debug-stats (элемент рисует SceneHost). */
export function DebugStats() {
  const frames = useRef(0)
  const since = useRef(performance.now())
  useFrame((state) => {
    frames.current++
    const now = performance.now()
    if (now - since.current < 500) return
    const fps = Math.round((frames.current * 1000) / (now - since.current))
    frames.current = 0
    since.current = now
    const el = document.getElementById('debug-stats')
    if (el) el.textContent = `calls ${state.gl.info.render.calls} · tris ${state.gl.info.render.triangles} · ${fps} fps · dpr ${state.viewport.dpr}`
  })
  return null
}
