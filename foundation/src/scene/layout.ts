import { eraT, helix } from '../data/derive'
import type { EraOut, Event } from '../data/schema'

export interface Stop {
  id: string
  t: number
  pos: [number, number, number]
}

export function eraSpacing(n: number): number {
  return n > 1 ? 1 / (n - 1) : 1
}

export function eraStops(eras: EraOut[]): Stop[] {
  const sorted = [...eras].sort((a, b) => a.order - b.order)
  return sorted.map((e) => {
    const t = eraT(e.order, sorted.length)
    return { id: e.id, t, pos: helix(t) }
  })
}

/** Параметр события на нити: внутри своей эры смещается по году в пределах ±0.3 шага. */
export function eventT(ev: Event, eras: EraOut[]): number | null {
  const sorted = [...eras].sort((a, b) => a.order - b.order)
  const era = sorted.find((e) => e.id === ev.eras[0])
  if (!era) return null
  const t = eraT(era.order, sorted.length)
  if (ev.year === undefined) return t
  const span = Math.max(era.years.end - era.years.start, 1)
  const frac = (ev.year - era.years.start) / span - 0.5
  return t + frac * eraSpacing(sorted.length) * 0.6
}

export function nearestStop(stops: Stop[], t: number): { stop: Stop; dist: number } {
  let best = stops[0]
  let dist = Math.abs(t - best.t)
  for (const s of stops) {
    const d = Math.abs(t - s.t)
    if (d < dist) { best = s; dist = d }
  }
  return { stop: best, dist }
}

/** Ближайшая остановка с гистерезисом: текущая эра держится, пока другая не станет ближе на hysteresis·spacing. */
export function activeEraFor(stops: Stop[], t: number, currentId: string, hysteresis = 0.1): string {
  const { stop } = nearestStop(stops, t)
  const current = stops.find((s) => s.id === currentId)
  if (!current || current.id === stop.id) return stop.id
  const margin = hysteresis * eraSpacing(stops.length)
  return Math.abs(t - stop.t) + margin < Math.abs(t - current.t) ? stop.id : current.id
}

export function smoothstep(a: number, b: number, x: number): number {
  const k = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return k * k * (3 - 2 * k)
}

const CAM_OUT = 45
const CAM_UP = 18
const LOOK_AHEAD = 0.03

/** Камера «Хроники»: снаружи спирали, выше неё; взгляд — вперёд по нити (tilt 0) или вниз к диску (tilt 1). */
export function chronicleCamera(t: number, tilt: number): { position: [number, number, number]; target: [number, number, number] } {
  const p = helix(t)
  const len = Math.hypot(p[0], p[2]) || 1
  const nx = p[0] / len
  const nz = p[2] / len
  const position: [number, number, number] = [p[0] + nx * CAM_OUT, p[1] + CAM_UP, p[2] + nz * CAM_OUT]
  const ahead = helix(Math.min(t + LOOK_AHEAD, 1))
  const down: [number, number, number] = [p[0] * 0.35, 0, p[2] * 0.35]
  const target: [number, number, number] = [
    ahead[0] + (down[0] - ahead[0]) * tilt,
    ahead[1] + (down[1] - ahead[1]) * tilt,
    ahead[2] + (down[2] - ahead[2]) * tilt,
  ]
  return { position, target }
}
