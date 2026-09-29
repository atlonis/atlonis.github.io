import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { PointCloud } from './galaxy'

/** Точки с аттенюацией по расстоянию (как PointsMaterial) и медленным дифференциальным вращением. */
export const GALAXY_VERT = /* glsl */ `
  attribute float aScale;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uSpin;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vec3 p = position;
    float r = length(p.xz);
    float omega = uSpin * 20.0 / max(r, 20.0);
    float a = uTime * omega;
    float c = cos(a), s = sin(a);
    p.xz = vec2(p.x * c - p.z * s, p.x * s + p.z * c);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(uSize * aScale * uPixelRatio * (uScale / -mvPosition.z), 1.0, 8.0 * uPixelRatio);
    vColor = aColor;
    vDepth = -mvPosition.z;
  }
`

/** Точки без вращения и без аттенюации: фон. */
export const BACKGROUND_VERT = /* glsl */ `
  attribute float aScale;
  attribute vec3 aColor;
  uniform float uSize;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * aScale * uPixelRatio;
    vColor = aColor;
    vDepth = 0.0;
  }
`

/** Точки с аттенюацией, без вращения: пыль. */
export const DUST_VERT = /* glsl */ `
  attribute float aScale;
  attribute vec3 aColor;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(uSize * aScale * uPixelRatio * (uScale / -mvPosition.z), 1.0, 24.0 * uPixelRatio);
    vColor = aColor;
    vDepth = -mvPosition.z;
  }
`

/** Мягкий диск, подкраска цветом эры, гашение по глубине. Для аддитива rgb уже умножен на альфу. */
export const POINTS_FRAG = /* glsl */ `
  uniform vec3 uEraColor;
  uniform float uTint;
  uniform float uOpacity;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(1.0 - smoothstep(0.0, 0.5, d), 3.0);
    a *= 1.0 - smoothstep(uFadeNear, uFadeFar, vDepth);
    a *= uOpacity;
    if (a < 0.003) discard;
    vec3 col = mix(vColor, uEraColor, uTint);
    gl_FragColor = vec4(col * a, a);
  }
`

/** Та же форма точки, но обычное смешивание: пыль затемняет то, что под ней. */
export const DUST_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.15, 0.5, d)) * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

export function pointsGeometry(cloud: PointCloud): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(cloud.positions, 3))
  g.setAttribute('aColor', new THREE.BufferAttribute(cloud.colors, 3))
  g.setAttribute('aScale', new THREE.BufferAttribute(cloud.scales, 1))
  return g
}

/** Держит uScale/uPixelRatio в согласии с размером канваса и dpr (как PointsMaterial). */
export function useResolutionUniforms(material: THREE.ShaderMaterial): void {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  useEffect(() => {
    if (material.uniforms.uScale) material.uniforms.uScale.value = size.height * 0.5
    if (material.uniforms.uPixelRatio) material.uniforms.uPixelRatio.value = dpr
  }, [material, size, dpr])
}

/** Радиальный градиент для спрайтов ядра и узлов. Одна текстура на всех. */
let glowTexture: THREE.CanvasTexture | null = null
export function getGlowTexture(): THREE.CanvasTexture {
  if (glowTexture) return glowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}
