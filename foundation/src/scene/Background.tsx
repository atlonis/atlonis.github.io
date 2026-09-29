import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { GALAXY_SEED, buildBackgroundStars } from './galaxy'
import { BACKGROUND_VERT, POINTS_FRAG, pointsGeometry, useResolutionUniforms } from './materials'
import { paletteUniforms } from './palette'
import { TIER_PARAMS, type Tier } from './tier'

export function Background({ tier }: { tier: Tier }) {
  const count = TIER_PARAMS[tier].background
  const geometry = useMemo(() => pointsGeometry(buildBackgroundStars(GALAXY_SEED + 1, count, 600)), [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BACKGROUND_VERT,
        fragmentShader: POINTS_FRAG,
        uniforms: {
          uSize: { value: 1.3 },
          uPixelRatio: { value: 1 },
          uEraColor: paletteUniforms.uEraColor,
          uTint: { value: 0 },
          uOpacity: { value: 0.9 },
          uFadeNear: { value: 10_000 },
          uFadeFar: { value: 20_000 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useResolutionUniforms(material)
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />
}
