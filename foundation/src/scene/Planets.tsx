import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import type { DataIndex } from '../data/indexDataset'
import type { PlanetOut } from '../data/schema'
import { openEntity } from '../router/bind'
import { tweenTo } from './anim'
import { paletteUniforms } from './palette'
import { markAlive, useSceneStore } from './sceneStore'

const LOOK_TYPES = ['city', 'ocean', 'desert', 'ice', 'gas', 'barren'] as const
const DIM_OFF = 0.15

const PLANET_VERT = /* glsl */ `
  attribute vec3 aColorA;
  attribute vec3 aColorB;
  attribute float aType;
  attribute float aDim;
  varying vec3 vA;
  varying vec3 vB;
  varying float vType;
  varying float vDim;
  varying vec3 vN;
  varying vec3 vPos;
  varying vec3 vView;
  void main() {
    vec4 world = instanceMatrix * vec4(position, 1.0);
    vec4 mv = modelViewMatrix * world;
    gl_Position = projectionMatrix * mv;
    vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vPos = position;
    vView = -mv.xyz;
    vA = aColorA; vB = aColorB; vType = aType; vDim = aDim;
  }
`

const PLANET_FRAG = /* glsl */ `
  uniform vec3 uEraGlow;
  varying vec3 vA;
  varying vec3 vB;
  varying float vType;
  varying float vDim;
  varying vec3 vN;
  varying vec3 vPos;
  varying vec3 vView;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y);
    float b = mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y);
    return mix(a, b, f.z);
  }
  void main() {
    float n = vnoise(vPos * 3.0) * 0.65 + vnoise(vPos * 7.0) * 0.35;
    float t = floor(vType + 0.5);
    float mask;
    if (t == 0.0) mask = step(0.5, fract(vPos.y * 6.0 + n));
    else if (t == 1.0) mask = smoothstep(0.45, 0.6, n);
    else if (t == 2.0) mask = smoothstep(0.3, 0.7, n);
    else if (t == 3.0) mask = smoothstep(0.55, 0.75, n + abs(vPos.y) * 0.5);
    else if (t == 4.0) mask = step(0.5, fract(vPos.y * 4.0 + n * 0.5));
    else mask = smoothstep(0.35, 0.65, n);
    vec3 base = mix(vA, vB, mask);
    vec3 N = normalize(vN);
    vec3 L = normalize(vec3(0.5, 0.8, 0.6));
    float lambert = dot(N, L) * 0.5 + 0.5;
    float rim = pow(1.0 - max(dot(N, normalize(vView)), 0.0), 3.0);
    vec3 col = base * (0.25 + 0.75 * lambert) + uEraGlow * rim * 0.35;
    col *= mix(${DIM_OFF.toFixed(2)}, 1.0, vDim);
    gl_FragColor = vec4(col, 1.0);
  }
`

function planetsOf(index: DataIndex): PlanetOut[] {
  return index.entities.filter((e): e is PlanetOut => e.kind === 'planet')
}

/** Один InstancedMesh на все планеты + невидимые прокси-сферы для тапа. */
export function Planets({ index }: { index: DataIndex }) {
  const planets = useMemo(() => planetsOf(index), [index])
  const activeEraId = useSceneStore((s) => s.activeEraId)
  const invalidate = useThree((s) => s.invalidate)
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { geometry, dimAttr } = useMemo(() => {
    const n = planets.length
    const geometry = new THREE.SphereGeometry(1, 24, 16)
    const colorA = new Float32Array(n * 3)
    const colorB = new Float32Array(n * 3)
    const type = new Float32Array(n)
    const dim = new Float32Array(n).fill(1)
    planets.forEach((p, i) => {
      const a = new THREE.Color(p.look.colorA)
      const b = new THREE.Color(p.look.colorB)
      colorA.set([a.r, a.g, a.b], i * 3)
      colorB.set([b.r, b.g, b.b], i * 3)
      type[i] = LOOK_TYPES.indexOf(p.look.type)
    })
    geometry.setAttribute('aColorA', new THREE.InstancedBufferAttribute(colorA, 3))
    geometry.setAttribute('aColorB', new THREE.InstancedBufferAttribute(colorB, 3))
    geometry.setAttribute('aType', new THREE.InstancedBufferAttribute(type, 1))
    const dimAttr = new THREE.InstancedBufferAttribute(dim, 1)
    dimAttr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('aDim', dimAttr)
    return { geometry, dimAttr }
  }, [planets])

  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG, uniforms: { uEraGlow: paletteUniforms.uEraGlow } }),
    [],
  )
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  // Матрицы инстансов: позиция из xyz, масштаб из look.radius.
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    planets.forEach((p, i) => {
      m.compose(new THREE.Vector3(...p.xyz), q, new THREE.Vector3().setScalar(p.look.radius))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    invalidate()
  }, [planets, invalidate])

  // Гашение планет вне активной эры. Первый запуск (в т.ч. после перемонтирования Canvas) ставит значения сразу, без твина:
  // иначе неактивные планеты вспыхивают яркими и только потом гаснут. Последующие смены эры — твин значений aDim.
  const dims = useRef<Record<string, number>>({})
  const seeded = useRef(false)
  useEffect(() => {
    const targets: Record<string, number> = {}
    planets.forEach((p) => { targets[p.id] = p.eras.includes(activeEraId) ? 1 : 0 })
    if (!seeded.current) {
      seeded.current = true
      planets.forEach((p, i) => {
        dims.current[p.id] = targets[p.id]
        dimAttr.array[i] = targets[p.id]
      })
      dimAttr.needsUpdate = true
      invalidate()
      return
    }
    planets.forEach((p) => { if (dims.current[p.id] === undefined) dims.current[p.id] = 1 })
    const tween = tweenTo(dims.current, {
      ...targets,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        planets.forEach((p, i) => { dimAttr.array[i] = dims.current[p.id] })
        dimAttr.needsUpdate = true
      },
    })
    return () => { tween.kill() }
  }, [activeEraId, planets, dimAttr, invalidate])

  // Курсор не залипает, если сцену размонтировали, пока мышь над планетой.
  useEffect(() => () => { document.body.style.cursor = '' }, [])

  const onOver = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; markAlive(); invalidate() }
  const onOut = () => { document.body.style.cursor = '' }
  const onClick = (id: string) => (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); openEntity(index, id) }

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geometry, material, planets.length]} frustumCulled={false} />
      {planets.map((p) => (
        <mesh key={p.id} visible={false} position={p.xyz} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick(p.id)}>
          <sphereGeometry args={[Math.max(p.look.radius * 1.8, 5), 8, 8]} />
          <meshBasicMaterial />
        </mesh>
      ))}
    </group>
  )
}
