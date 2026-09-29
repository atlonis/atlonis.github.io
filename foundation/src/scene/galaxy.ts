import { GALAXY } from '../data/derive'

export const GALAXY_SEED = 12067

export interface PointCloud {
  positions: Float32Array
  colors: Float32Array
  scales: Float32Array
  count: number
}

/** Детерминированный генератор: одинаковый сид — одинаковые точки на любой машине. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const LOOK = {
  randomness: 0.28,
  randomnessPower: 3,
  flatten: 0.3,
  inside: hexToRgb('#ffb46b'),
  outside: hexToRgb('#3a5bd9'),
}

function empty(count: number): PointCloud {
  return { positions: new Float32Array(count * 3), colors: new Float32Array(count * 3), scales: new Float32Array(count), count }
}

/** Спиральная галактика: то же правило рукавов, что и planetXYZ (branch + r·spin). */
export function buildGalaxy(seed: number, count: number): PointCloud {
  const rnd = mulberry32(seed)
  const out = empty(count)
  const { arms, radius, spin } = GALAXY
  for (let i = 0; i < count; i++) {
    const r = radius * Math.pow(rnd(), 1.6)
    const branch = ((i % arms) / arms) * Math.PI * 2
    const angle = branch + (r / radius) * spin
    const jitter = () => Math.pow(rnd(), LOOK.randomnessPower) * (rnd() < 0.5 ? 1 : -1) * LOOK.randomness * r
    out.positions[i * 3] = Math.cos(angle) * r + jitter()
    out.positions[i * 3 + 1] = jitter() * LOOK.flatten
    out.positions[i * 3 + 2] = Math.sin(angle) * r + jitter()
    const mix = r / radius
    for (let c = 0; c < 3; c++) out.colors[i * 3 + c] = LOOK.inside[c] * (1 - mix) + LOOK.outside[c] * mix
    out.scales[i] = 0.5 + rnd()
  }
  return out
}

/** Фон: точки на сфере, чуть голубоватые. */
export function buildBackgroundStars(seed: number, count: number, radius = 500): PointCloud {
  const rnd = mulberry32(seed)
  const out = empty(count)
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1
    const phi = rnd() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    out.positions[i * 3] = s * Math.cos(phi) * radius
    out.positions[i * 3 + 1] = u * radius
    out.positions[i * 3 + 2] = s * Math.sin(phi) * radius
    const warm = rnd()
    out.colors[i * 3] = 0.75 + warm * 0.25
    out.colors[i * 3 + 1] = 0.8 + warm * 0.15
    out.colors[i * 3 + 2] = 1
    out.scales[i] = 0.4 + rnd() * 0.6
  }
  return out
}

/** Пыль вдоль рукавов: тёмно-фиолетовая, рисуется обычным смешиванием поверх галактики. */
export function buildDust(seed: number, count: number): PointCloud {
  const rnd = mulberry32(seed)
  const out = empty(count)
  const { arms, radius, spin } = GALAXY
  const dark = hexToRgb('#2a1d45')
  const darker = hexToRgb('#120c22')
  for (let i = 0; i < count; i++) {
    const r = radius * (0.15 + 0.85 * Math.pow(rnd(), 1.2))
    const branch = ((i % arms) / arms) * Math.PI * 2 + 0.25
    const angle = branch + (r / radius) * spin
    const jitter = () => (rnd() - 0.5) * 0.12 * r
    out.positions[i * 3] = Math.cos(angle) * r + jitter()
    out.positions[i * 3 + 1] = jitter() * 0.5
    out.positions[i * 3 + 2] = Math.sin(angle) * r + jitter()
    const mix = rnd()
    for (let c = 0; c < 3; c++) out.colors[i * 3 + c] = dark[c] * (1 - mix) + darker[c] * mix
    out.scales[i] = 2 + rnd() * 2
  }
  return out
}
