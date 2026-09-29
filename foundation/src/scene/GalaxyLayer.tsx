import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GALAXY_SEED, buildGalaxy } from './galaxy'
import { GALAXY_VERT, POINTS_FRAG, pointsGeometry, useResolutionUniforms } from './materials'
import { paletteUniforms } from './palette'
import { isAlive, useSceneStore } from './sceneStore'
import { TIER_PARAMS, type Tier } from './tier'

const MAX_DT = 1 / 30

export function Galaxy({ tier }: { tier: Tier }) {
  const count = TIER_PARAMS[tier].galaxy
  const reduced = useSceneStore((s) => s.reducedMotion)
  const geometry = useMemo(() => pointsGeometry(buildGalaxy(GALAXY_SEED, count)), [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GALAXY_VERT,
        fragmentShader: POINTS_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 2.0 },
          uPixelRatio: { value: 1 },
          uScale: { value: 1 },
          uSpin: { value: 0.03 },
          uEraColor: paletteUniforms.uEraColor,
          uTint: { value: 0.22 },
          uOpacity: { value: 1 },
          uFadeNear: { value: 220 },
          uFadeFar: { value: 700 },
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

  // Вращение живёт только пока сцена «живая» и не при reduced-motion; каждый такой кадр просит следующий.
  useFrame((state, delta) => {
    if (reduced || !isAlive()) return
    material.uniforms.uTime.value += Math.min(delta, MAX_DT)
    state.invalidate()
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />
}
