import * as THREE from 'three'
import gsap from 'gsap'
import { tweenTo } from './anim'

/** Общие uniform-цвета активной эры. Материалы получают ЭТИ объекты; Color мутируется по месту. */
export const paletteUniforms = {
  uEraColor: { value: new THREE.Color('#4a7cff') },
  uEraGlow: { value: new THREE.Color('#9cc0ff') },
}

export function setPaletteNow(primary: string, glow: string): void {
  gsap.killTweensOf([paletteUniforms.uEraColor.value, paletteUniforms.uEraGlow.value])
  paletteUniforms.uEraColor.value.set(primary)
  paletteUniforms.uEraGlow.value.set(glow)
}

export function tweenPalette(primary: string, glow: string, duration = 0.8): void {
  const p = new THREE.Color(primary)
  const g = new THREE.Color(glow)
  gsap.killTweensOf([paletteUniforms.uEraColor.value, paletteUniforms.uEraGlow.value])
  tweenTo(paletteUniforms.uEraColor.value, { r: p.r, g: p.g, b: p.b, duration, ease: 'power2.out' })
  tweenTo(paletteUniforms.uEraGlow.value, { r: g.r, g: g.g, b: g.b, duration, ease: 'power2.out' })
}
