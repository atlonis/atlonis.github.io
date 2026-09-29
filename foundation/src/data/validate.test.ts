import { describe, expect, it } from 'vitest'
import type { Entity } from './schema'
import { validateDataset } from './validate'

const era = (id: string, order: number, start: number, end: number): Entity => ({
  id, kind: 'era', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  order, years: { start, end, label: { ru: `${start}–${end}` } }, palette: { primary: '#000000', glow: '#ffffff' },
})
const planet = (id: string, eras: string[]): Entity => ({
  id, kind: 'planet', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  eras, book: { presence: 'same' }, galaxy: { arm: 0, r: 0.5, offset: 0 },
  look: { type: 'city', colorA: '#000000', colorB: '#ffffff', radius: 1 },
})
const faction = (id: string, eras: string[]): Entity => ({
  id, kind: 'faction', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  eras, book: { presence: 'same' }, color: '#123456',
})
const character = (id: string, eras: string[], extra: Partial<Extract<Entity, { kind: 'character' }>> = {}): Entity => ({
  id, kind: 'character', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  eras, book: { presence: 'same' }, ...extra,
})
const event = (id: string, eras: string[], extra: Partial<Extract<Entity, { kind: 'event' }>> = {}): Entity => ({
  id, kind: 'event', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  eras, book: { presence: 'same' }, ...extra,
})

const base = [era('e1', 1, 0, 10), era('e2', 2, 11, 100), planet('trantor', ['e1', 'e2']), faction('empire', ['e1'])]

describe('validateDataset', () => {
  it('корректный набор — без ошибок', () => {
    expect(validateDataset([...base, character('hari', ['e1'], { faction: 'empire', homeworld: 'trantor' }), event('trial', ['e1'], { year: 0 })])).toEqual([])
  })
  it('дубликат id', () => {
    expect(validateDataset([...base, planet('trantor', ['e1'])])).toContainEqual(expect.stringContaining('дубликат'))
  })
  it('ссылка на несуществующую эру', () => {
    expect(validateDataset([...base, character('x', ['nope'])])).toContainEqual(expect.stringContaining('«nope» не существует'))
  })
  it('эры пересекаются по годам', () => {
    expect(validateDataset([era('e1', 1, 0, 50), era('e2', 2, 40, 100)])).toContainEqual(expect.stringContaining('пересекаются'))
  })
  it('order должен идти 1..N без дыр', () => {
    expect(validateDataset([era('e1', 1, 0, 10), era('e3', 3, 11, 20)])).toContainEqual(expect.stringContaining('order должен быть 2'))
  })
  it('timeline.era должна входить в eras', () => {
    const c = character('gaal', ['e1'], { timeline: [{ era: 'e2', note: { ru: 'криосон' } }] })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('timeline.era'))
  })
  it('homeworld должен быть планетой', () => {
    const c = character('x', ['e1'], { homeworld: 'empire' })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('нужен planet'))
  })
  it('событию нужен year или yearLabel', () => {
    expect(validateDataset([...base, event('x', ['e1'])])).toContainEqual(expect.stringContaining('year или yearLabel'))
  })
  it('year события должен попадать в одну из его эр', () => {
    expect(validateDataset([...base, event('x', ['e1'], { year: 50 })])).toContainEqual(expect.stringContaining('не попадает'))
  })
  it('book.counterpart должен существовать и быть того же вида', () => {
    const c = character('mule', ['e1'], { book: { presence: 'different', counterpart: 'trantor' } })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('book.counterpart'))
  })
  it('related[].id не существует', () => {
    const c = character('x', ['e1'], { related: [{ id: 'ghost', role: { ru: 'друг' } }] })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('related → «ghost» не существует'))
  })
  it('character.faction должна быть фракцией', () => {
    const c = character('x', ['e1'], { faction: 'trantor' })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('нужен faction'))
  })
  it('timeline.planet должна быть планетой', () => {
    const c = character('x', ['e1'], { timeline: [{ era: 'e1', note: { ru: 'на Транторе' }, planet: 'empire' }] })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('timeline.planet'))
  })
  it('timeline.faction должна быть фракцией', () => {
    const c = character('x', ['e1'], { timeline: [{ era: 'e1', note: { ru: 'служит' }, faction: 'trantor' }] })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('timeline.faction'))
  })
  it('event.planet должна быть планетой', () => {
    expect(validateDataset([...base, event('x', ['e1'], { year: 0, planet: 'empire' })])).toContainEqual(expect.stringContaining('planet → «empire» это faction'))
  })
  it('эра с years.start > years.end', () => {
    expect(validateDataset([era('e1', 1, 10, 0)])).toContainEqual(expect.stringContaining('years.start больше years.end'))
  })
})
