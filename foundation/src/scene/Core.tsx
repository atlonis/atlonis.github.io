import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { getGlowTexture } from './materials'

/** Ядро галактики: два аддитивных спрайта с общей текстурой-градиентом. */
export function Core() {
  const texture = useMemo(() => getGlowTexture(), [])
  const outer = useMemo(() => new THREE.SpriteMaterial({ map: texture, color: '#ffb46b', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.55 }), [texture])
  const inner = useMemo(() => new THREE.SpriteMaterial({ map: texture, color: '#fff1d6', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.85 }), [texture])
  useEffect(() => () => { outer.dispose(); inner.dispose() }, [outer, inner])
  return (
    <>
      <sprite material={outer} scale={[70, 70, 1]} renderOrder={2} />
      <sprite material={inner} scale={[26, 26, 1]} renderOrder={2} />
    </>
  )
}
