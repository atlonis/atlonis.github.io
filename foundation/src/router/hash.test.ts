import { describe, expect, it } from 'vitest'
import { indexDataset } from '../data/indexDataset'
import type { Dataset } from '../data/schema'
import { NOT_FOUND, formatHash, parseHash, resolveHash } from './hash'

describe('parseHash / formatHash', () => {
  it('режим и эра', () => {
    expect(parseHash('#/list/mule')).toEqual({ mode: 'list', eraId: 'mule' })
  })
  it('режим, эра, сущность', () => {
    expect(parseHash('#/map/mule/character/bayta')).toEqual({ mode: 'map', eraId: 'mule', kind: 'character', id: 'bayta' })
  })
  it('симметричны', () => {
    for (const h of ['#/chronicle/trantor-trial', '#/list/mule/planet/kalgan']) expect(formatHash(parseHash(h)!)).toBe(h)
  })
  it('мусор — null', () => {
    expect(parseHash('')).toBeNull()
    expect(parseHash('#/foo/x')).toBeNull()
    expect(parseHash('#/map/x/character')).toBeNull()
    expect(parseHash('#/map/x/era/y')).toBeNull()
    expect(parseHash('#/map')).toBeNull()
  })
})

const ds: Dataset = {
  version: 1,
  entities: [
    { id: 'e1', kind: 'era', name: { ru: 'e1' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], order: 1, years: { start: 0, end: 10, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: 0 },
    { id: 'e2', kind: 'era', name: { ru: 'e2' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], order: 2, years: { start: 11, end: 20, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: 1 },
    { id: 'c', kind: 'character', name: { ru: 'c' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], eras: ['e2'], book: { presence: 'same' } },
  ],
}
const index = indexDataset(ds)

describe('resolveHash', () => {
  it('пустой хэш — первая эра, «Хроника», без уведомления', () => {
    expect(resolveHash('', index)).toEqual({ route: { mode: 'chronicle', eraId: 'e1' } })
    expect(resolveHash('#/', index)).toEqual({ route: { mode: 'chronicle', eraId: 'e1' } })
  })
  it('мусорный хэш — дефолт и уведомление', () => {
    expect(resolveHash('#/nope', index)).toEqual({ route: { mode: 'chronicle', eraId: 'e1' }, notice: NOT_FOUND })
  })
  it('несуществующая эра — дефолт и уведомление', () => {
    expect(resolveHash('#/list/zzz', index)).toEqual({ route: { mode: 'chronicle', eraId: 'e1' }, notice: NOT_FOUND })
  })
  it('несуществующая сущность — режим и эра остаются, карточки нет, уведомление', () => {
    expect(resolveHash('#/list/e1/character/zzz', index)).toEqual({ route: { mode: 'list', eraId: 'e1' }, notice: NOT_FOUND })
  })
  it('сущность не из этой эры — эра переключается на первую её эру', () => {
    expect(resolveHash('#/list/e1/character/c', index)).toEqual({ route: { mode: 'list', eraId: 'e2', kind: 'character', id: 'c' } })
  })
  it('всё существует — как есть', () => {
    expect(resolveHash('#/map/e2/character/c', index)).toEqual({ route: { mode: 'map', eraId: 'e2', kind: 'character', id: 'c' } })
  })
})
