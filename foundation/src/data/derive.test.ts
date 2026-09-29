import { describe, expect, it } from 'vitest'
import { HELIX, bookOf, eraT, feToIe, helix, planetXYZ } from './derive'

describe('bookOf', () => {
  it('раскладывает части трилогии по книгам', () => {
    expect(bookOf('psychohistorians')).toBe(1)
    expect(bookOf('merchant-princes')).toBe(1)
    expect(bookOf('general')).toBe(2)
    expect(bookOf('mule')).toBe(2)
    expect(bookOf('search-by-mule')).toBe(3)
    expect(bookOf('search-by-foundation')).toBe(3)
  })
})

describe('feToIe', () => {
  it('35 Э.О. = 12 102 И.Э.', () => expect(feToIe(35)).toBe(12102))
})

describe('helix', () => {
  it('начинается на r0/h0 и заканчивается на r1/h1', () => {
    const [x0, y0, z0] = helix(0)
    expect(x0).toBeCloseTo(HELIX.r0)
    expect(y0).toBe(HELIX.h0)
    expect(z0).toBeCloseTo(0)
    const [x1, y1, z1] = helix(1)
    expect(Math.hypot(x1, z1)).toBeCloseTo(HELIX.r1)
    expect(y1).toBe(HELIX.h1)
  })
  it('высота растёт монотонно', () => {
    let prev = -Infinity
    for (let i = 0; i <= 10; i++) {
      const y = helix(i / 10)[1]
      expect(y).toBeGreaterThan(prev)
      prev = y
    }
  })
})

describe('eraT', () => {
  it('первая эра 0, последняя 1, середина 0.5', () => {
    expect(eraT(1, 5)).toBe(0)
    expect(eraT(5, 5)).toBe(1)
    expect(eraT(3, 5)).toBe(0.5)
  })
  it('единственная эра стоит на 0', () => expect(eraT(1, 1)).toBe(0))
})

describe('planetXYZ', () => {
  it('r = 0 — центр галактики', () => {
    expect(planetXYZ({ arm: 0, r: 0, offset: 0 })).toEqual([0, 0, 0])
  })
  it('r = 1 лежит на радиусе галактики', () => {
    const [x, , z] = planetXYZ({ arm: 1, r: 1, offset: 0.1 })
    expect(Math.hypot(x, z)).toBeCloseTo(100)
  })
  it('y берётся из координат', () => {
    expect(planetXYZ({ arm: 2, r: 0.5, offset: 0, y: 3 })[1]).toBe(3)
  })
  it('детерминирована', () => {
    const a = planetXYZ({ arm: 2, r: 0.5, offset: -0.2 })
    const b = planetXYZ({ arm: 2, r: 0.5, offset: -0.2 })
    expect(a).toEqual(b)
  })
})
