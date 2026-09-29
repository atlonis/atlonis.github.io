export type Tier = 'low' | 'mid' | 'high'

export interface TierEnv {
  coarse: boolean
  touchPoints: number
  deviceMemory?: number
}

export interface TierParams {
  dpr: number
  galaxy: number
  dust: number
  background: number
  antialias: boolean
}

/** Спек §6.5. Цифры точек — середина диапазонов. */
export const TIER_PARAMS: Record<Tier, TierParams> = {
  low: { dpr: 1, galaxy: 40_000, dust: 5_000, background: 10_000, antialias: false },
  mid: { dpr: 1.5, galaxy: 70_000, dust: 10_000, background: 15_000, antialias: false },
  high: { dpr: 2, galaxy: 160_000, dust: 20_000, background: 20_000, antialias: true },
}

/** Телефоны и все iPad — mid; deviceMemory ≤ 2 ГБ (только Chromium) — low; остальное — high. */
export function detectTier(env: TierEnv): Tier {
  if (env.deviceMemory !== undefined && env.deviceMemory <= 2) return 'low'
  if (env.coarse || env.touchPoints > 1) return 'mid'
  return 'high'
}

export function lowerTier(t: Tier): Tier {
  return t === 'high' ? 'mid' : 'low'
}

/** Средний кадр первых `window` подряд отрисованных кадров больше порога — понижаем тир. */
export function shouldDowngrade(frameMs: number[], window = 60, thresholdMs = 20): boolean {
  if (frameMs.length < window) return false
  const first = frameMs.slice(0, window)
  return first.reduce((a, b) => a + b, 0) / window > thresholdMs
}

export function readTierEnv(): TierEnv {
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : undefined
  return { coarse, touchPoints: nav?.maxTouchPoints ?? 0, deviceMemory: nav?.deviceMemory }
}
