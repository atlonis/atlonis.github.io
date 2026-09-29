import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useStore } from '../state/store'

/** Потеря контекста → статус 'lost'; оболочка снимает сцену и предлагает «Перезапустить 3D». */
export function ContextLossGuard() {
  const gl = useThree((s) => s.gl)
  const setScene3d = useStore((s) => s.setScene3d)
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (e: Event) => {
      e.preventDefault()
      setScene3d('lost')
    }
    canvas.addEventListener('webglcontextlost', lost, false)
    return () => canvas.removeEventListener('webglcontextlost', lost, false)
  }, [gl, setScene3d])
  return null
}
