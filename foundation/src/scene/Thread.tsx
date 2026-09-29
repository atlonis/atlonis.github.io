import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { helix } from '../data/derive'
import type { DataIndex } from '../data/indexDataset'
import type { Event } from '../data/schema'
import { getGlowTexture, useResolutionUniforms } from './materials'
import { paletteUniforms } from './palette'
import { eraStops, eventT } from './layout'

const NODE_VERT = /* glsl */ `
  attribute float aScale;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(uSize * aScale * uPixelRatio * (uScale / -mvPosition.z), 2.0, 48.0 * uPixelRatio);
  }
`
const NODE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uEraGlow;
  uniform float uOpacity;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float a = tex.a * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(vec3(1.0), uEraGlow, 0.5) * a, a);
  }
`

function nodesGeometry(positions: number[][], scale: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array(positions.length * 3)
  const scl = new Float32Array(positions.length).fill(scale)
  positions.forEach((p, i) => pos.set(p, i * 3))
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aScale', new THREE.BufferAttribute(scl, 1))
  return g
}

/** Нить Плана: труба по спирали + узлы эр + узлы событий. Цвет — общий Color палитры. */
export function Thread({ index }: { index: DataIndex }) {
  const tube = useMemo(() => {
    const samples: THREE.Vector3[] = []
    for (let i = 0; i <= 200; i++) samples.push(new THREE.Vector3(...helix(i / 200)))
    const path = new THREE.CatmullRomCurve3(samples, false, 'centripetal')
    return new THREE.TubeGeometry(path, 400, 0.6, 8, false)
  }, [])
  const tubeMaterial = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    m.color = paletteUniforms.uEraGlow.value
    return m
  }, [])

  const stops = useMemo(() => eraStops(index.eras), [index])
  const eraNodes = useMemo(() => nodesGeometry(stops.map((s) => s.pos), 1), [stops])
  const eventNodes = useMemo(() => {
    const ts = index.entities
      .filter((e): e is Event => e.kind === 'event')
      .map((e) => eventT(e, index.eras))
      .filter((t): t is number => t !== null)
    return nodesGeometry(ts.map((t) => helix(t)), 0.35)
  }, [index])
  const nodeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NODE_VERT,
        fragmentShader: NODE_FRAG,
        uniforms: { uMap: { value: getGlowTexture() }, uEraGlow: paletteUniforms.uEraGlow, uOpacity: { value: 0.95 }, uSize: { value: 18 }, uPixelRatio: { value: 1 }, uScale: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        premultipliedAlpha: true,
      }),
    [],
  )
  useResolutionUniforms(nodeMaterial)
  useEffect(() => () => { tube.dispose(); tubeMaterial.dispose(); eraNodes.dispose(); eventNodes.dispose(); nodeMaterial.dispose() }, [tube, tubeMaterial, eraNodes, eventNodes, nodeMaterial])

  return (
    <group>
      <mesh geometry={tube} material={tubeMaterial} renderOrder={3} frustumCulled={false} />
      <points geometry={eraNodes} material={nodeMaterial} renderOrder={4} frustumCulled={false} />
      <points geometry={eventNodes} material={nodeMaterial} renderOrder={4} frustumCulled={false} />
    </group>
  )
}
