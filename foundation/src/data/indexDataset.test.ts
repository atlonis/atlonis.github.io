import { describe, expect, it } from 'vitest'
import { indexDataset } from './indexDataset'
import type { Dataset } from './schema'

const ds: Dataset = {
  version: 1,
  entities: [
    { id: 'e2', kind: 'era', name: { ru: 'e2' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], order: 2, years: { start: 11, end: 20, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: 1 },
    { id: 'e1', kind: 'era', name: { ru: 'e1' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], order: 1, years: { start: 0, end: 10, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: 0 },
    { id: 'f', kind: 'faction', name: { ru: 'f' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], eras: ['e1', 'e2'], book: { presence: 'same' }, color: '#123456' },
    { id: 'c', kind: 'character', name: { ru: 'c' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], eras: ['e2'], book: { presence: 'same' } },
  ],
}

describe('indexDataset', () => {
  const index = indexDataset(ds)
  it('эры отсортированы по order', () => expect(index.eras.map((e) => e.id)).toEqual(['e1', 'e2']))
  it('byId находит всё', () => expect(index.byId.get('c')?.kind).toBe('character'))
  it('byEra группирует сущности по эрам', () => {
    expect(index.byEra.get('e1')?.map((e) => e.id)).toEqual(['f'])
    expect(index.byEra.get('e2')?.map((e) => e.id)).toEqual(['f', 'c'])
  })
})
