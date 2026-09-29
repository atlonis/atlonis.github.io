import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { GALAXY_SEED, buildDust } from './galaxy'
import { DUST_FRAG, DUST_VERT, pointsGeometry, useResolutionUniforms } from './materials'
import { TIER_PARAMS, type Tier } from './tier'

export function Dust({ tier }: { tier: Tier }) {
  const count = TIER_PARAMS[tier].dust
  const geometry = useMemo(() => pointsGeometry(buildDust(GALAXY_SEED + 2, count)), [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        uniforms: { uSize: { value: 7 }, uPixelRatio: { value: 1 }, uScale: { value: 1 }, uOpacity: { value: 0.18 } },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
      }),
    [],
  )
  useResolutionUniforms(material)
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />
}
