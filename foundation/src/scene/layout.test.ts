import { describe, expect, it } from 'vitest'
import { HELIX, helix } from '../data/derive'
import type { EraOut, Event } from '../data/schema'
import { activeEraFor, chronicleCamera, eraSpacing, eraStops, eventT, nearestStop, smoothstep } from './layout'

const era = (id: string, order: number, start: number, end: number): EraOut => ({
  id, kind: 'era', name: { ru: id }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [],
  order, years: { start, end, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: (order - 1) / 4,
})
const eras = [era('e1', 1, 0, 5), era('e2', 2, 6, 100), era('e3', 3, 101, 250), era('e4', 4, 251, 350), era('e5', 5, 351, 420)]
const stops = eraStops(eras)

describe('eraStops', () => {
  it('по order, t от 0 до 1, позиция на спирали', () => {
    expect(stops.map((s) => s.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
    expect(stops[0].t).toBe(0)
    expect(stops[4].t).toBe(1)
    expect(stops[2].pos).toEqual(helix(0.5))
  })
  it('spacing = 1/(N−1)', () => expect(eraSpacing(5)).toBe(0.25))
})

describe('eventT', () => {
  const ev = (year: number | undefined, eraId: string): Event => ({
    id: 'x', kind: 'event', name: { ru: '' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [],
    eras: [eraId], book: { presence: 'same' }, year,
  })
  it('событие в начале эры — чуть раньше остановки, в конце — чуть позже', () => {
    expect(eventT(ev(6, 'e2'), eras)).toBeLessThan(0.25)
    expect(eventT(ev(100, 'e2'), eras)).toBeGreaterThan(0.25)
    expect(Math.abs(eventT(ev(53, 'e2'), eras)! - 0.25)).toBeLessThan(0.01)
  })
  it('без года — ровно на остановке; неизвестная эра — null', () => {
    expect(eventT(ev(undefined, 'e3'), eras)).toBe(0.5)
    expect(eventT(ev(10, 'zzz'), eras)).toBeNull()
  })
  it('на краях нити не выходит за [0, 1]', () => {
    expect(eventT(ev(0, 'e1'), eras)).toBe(0)
    expect(eventT(ev(420, 'e5'), eras)).toBe(1)
  })
})

describe('nearestStop / activeEraFor', () => {
  it('ближайшая остановка', () => {
    expect(nearestStop(stops, 0.3).stop.id).toBe('e2')
    expect(nearestStop(stops, 0.3).dist).toBeCloseTo(0.05)
  })
  it('гистерезис: у границы остаёмся в текущей эре, дальше границы — переключаемся', () => {
    // граница e1/e2 на 0.125; переключаемся, когда другая остановка ближе больше чем на 0.1·0.25 = 0.025
    expect(activeEraFor(stops, 0.135, 'e1')).toBe('e1') // e2 ближе на 0.02 — держим e1
    expect(activeEraFor(stops, 0.16, 'e1')).toBe('e2')  // e2 ближе на 0.07 — переключаемся
    expect(activeEraFor(stops, 0.115, 'e2')).toBe('e2') // e1 ближе на 0.02 — держим e2
    expect(activeEraFor(stops, 0.09, 'e2')).toBe('e1')  // e1 ближе на 0.07 — переключаемся
  })
  it('неизвестный текущий id — просто ближайшая', () => expect(activeEraFor(stops, 0.9, 'nope')).toBe('e5'))
})

describe('smoothstep', () => {
  it('0 до a, 1 после b, 0.5 в середине', () => {
    expect(smoothstep(0, 1, -1)).toBe(0)
    expect(smoothstep(0, 1, 2)).toBe(1)
    expect(smoothstep(0, 1, 0.5)).toBe(0.5)
    expect(smoothstep(1, 1, 0.5)).toBe(0) // вырожденный интервал a === b: без NaN
    expect(smoothstep(1, 1, 1)).toBe(1)
  })
})

describe('chronicleCamera', () => {
  it('камера снаружи спирали и выше неё', () => {
    const { position } = chronicleCamera(0.5, 0)
    const p = helix(0.5)
    expect(Math.hypot(position[0], position[2])).toBeGreaterThan(Math.hypot(p[0], p[2]))
    expect(position[1]).toBeGreaterThan(p[1])
  })
  it('без наклона смотрит вперёд по нити, с наклоном — к диску', () => {
    const ahead = chronicleCamera(0.5, 0).target
    const down = chronicleCamera(0.5, 1).target
    expect(down[1]).toBeLessThan(ahead[1])
    expect(down[1]).toBeLessThan(HELIX.h0)
  })
})
