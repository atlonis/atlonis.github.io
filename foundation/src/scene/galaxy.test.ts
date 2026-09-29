import { describe, expect, it } from 'vitest'
import { GALAXY } from '../data/derive'
import { buildBackgroundStars, buildDust, buildGalaxy, hexToRgb, mulberry32 } from './galaxy'

describe('mulberry32', () => {
  it('детерминирован и в [0, 1)', () => {
    const a = mulberry32(7), b = mulberry32(7)
    for (let i = 0; i < 100; i++) {
      const x = a()
      expect(x).toBe(b())
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})

describe('hexToRgb', () => {
  it('#ff8000 → [1, ~0.5, 0]', () => {
    const [r, g, b] = hexToRgb('#ff8000')
    expect(r).toBe(1)
    expect(g).toBeCloseTo(128 / 255)
    expect(b).toBe(0)
  })
})

describe('buildGalaxy', () => {
  const cloud = buildGalaxy(1, 5000)
  it('размеры буферов', () => {
    expect(cloud.count).toBe(5000)
    expect(cloud.positions.length).toBe(15000)
    expect(cloud.colors.length).toBe(15000)
    expect(cloud.scales.length).toBe(5000)
  })
  it('побайтно одинаков при одном сиде', () => {
    const again = buildGalaxy(1, 5000)
    expect(Buffer.from(again.positions.buffer).equals(Buffer.from(cloud.positions.buffer))).toBe(true)
  })
  it('другой сид — другие точки', () => {
    expect(buildGalaxy(2, 5000).positions[0]).not.toBe(cloud.positions[0])
  })
  it('диск: радиус в пределах, y плоский', () => {
    let maxR = 0, maxY = 0
    for (let i = 0; i < cloud.count; i++) {
      const x = cloud.positions[i * 3], y = cloud.positions[i * 3 + 1], z = cloud.positions[i * 3 + 2]
      maxR = Math.max(maxR, Math.hypot(x, z))
      maxY = Math.max(maxY, Math.abs(y))
    }
    expect(maxR).toBeLessThanOrEqual(GALAXY.radius * 1.5)
    expect(maxY).toBeLessThanOrEqual(GALAXY.radius * 0.35)
  })
  it('цвета в [0, 1], масштаб в [0.5, 1.5]', () => {
    for (let i = 0; i < cloud.colors.length; i++) {
      expect(cloud.colors[i]).toBeGreaterThanOrEqual(0)
      expect(cloud.colors[i]).toBeLessThanOrEqual(1)
    }
    for (let i = 0; i < cloud.count; i++) {
      expect(cloud.scales[i]).toBeGreaterThanOrEqual(0.5)
      expect(cloud.scales[i]).toBeLessThanOrEqual(1.5)
    }
  })
})

describe('buildBackgroundStars', () => {
  it('лежат на сфере заданного радиуса', () => {
    const c = buildBackgroundStars(3, 500, 400)
    for (let i = 0; i < c.count; i++) {
      const r = Math.hypot(c.positions[i * 3], c.positions[i * 3 + 1], c.positions[i * 3 + 2])
      expect(r).toBeCloseTo(400, 3)
    }
  })
})

describe('buildDust', () => {
  it('детерминирована, тёмные цвета', () => {
    const a = buildDust(5, 1000), b = buildDust(5, 1000)
    expect(a.positions[10]).toBe(b.positions[10])
    for (let i = 0; i < a.colors.length; i++) expect(a.colors[i]).toBeLessThanOrEqual(0.4)
  })
})
