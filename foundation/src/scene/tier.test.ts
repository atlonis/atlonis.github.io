import { describe, expect, it } from 'vitest'
import { TIER_PARAMS, detectTier, lowerTier, shouldDowngrade } from './tier'

describe('detectTier', () => {
  it('десктоп с мышью — high', () => expect(detectTier({ coarse: false, touchPoints: 0 })).toBe('high'))
  it('телефон — mid', () => expect(detectTier({ coarse: true, touchPoints: 5 })).toBe('mid'))
  it('iPad с Mac UA (pointer fine, но тач есть) — mid', () => expect(detectTier({ coarse: false, touchPoints: 5 })).toBe('mid'))
  it('deviceMemory ≤ 2 — low даже на десктопе', () => expect(detectTier({ coarse: false, touchPoints: 0, deviceMemory: 2 })).toBe('low'))
  it('deviceMemory undefined не понижает', () => expect(detectTier({ coarse: false, touchPoints: 0, deviceMemory: undefined })).toBe('high'))
})

describe('lowerTier', () => {
  it('high → mid → low → low', () => {
    expect(lowerTier('high')).toBe('mid')
    expect(lowerTier('mid')).toBe('low')
    expect(lowerTier('low')).toBe('low')
  })
})

describe('shouldDowngrade', () => {
  it('меньше окна — не решаем', () => expect(shouldDowngrade([30, 30, 30], 60)).toBe(false))
  it('средний кадр 25 мс на первых 60 — понижаем', () => expect(shouldDowngrade(Array(60).fill(25), 60, 20)).toBe(true))
  it('средний кадр 12 мс — не понижаем', () => expect(shouldDowngrade(Array(60).fill(12), 60, 20)).toBe(false))
})

describe('TIER_PARAMS', () => {
  it('точек и dpr больше по возрастанию тира', () => {
    expect(TIER_PARAMS.low.galaxy).toBeLessThan(TIER_PARAMS.mid.galaxy)
    expect(TIER_PARAMS.mid.galaxy).toBeLessThan(TIER_PARAMS.high.galaxy)
    expect(TIER_PARAMS.low.dpr).toBeLessThanOrEqual(TIER_PARAMS.mid.dpr)
    expect(TIER_PARAMS.mid.dpr).toBeLessThanOrEqual(TIER_PARAMS.high.dpr)
  })
})
