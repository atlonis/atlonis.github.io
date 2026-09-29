import { describe, expect, it } from 'vitest'
import { DatasetSchema, EntitySchema } from './schema'

const character = {
  id: 'salvor-hardin',
  kind: 'character',
  name: { ru: 'Салвор Хардин' },
  originalName: 'Salvor Hardin',
  summary: { ru: 'Смотритель Терминуса.' },
  eras: ['terminus-crisis'],
  appearsIn: { show: [{ season: 1 }], book: ['encyclopedists', 'mayors'] },
  book: { presence: 'different', diff: { ru: 'В книге — мужчина, мэр Терминуса.' } },
}

const era = {
  id: 'terminus-crisis',
  kind: 'era',
  name: { ru: 'Терминус: Хардин и Анакреон' },
  summary: { ru: 'Первый кризис Селдона.' },
  order: 2,
  years: { start: 6, end: 100, bookStart: 50, bookEnd: 80, label: { ru: '~35 Э.О.' } },
  palette: { primary: '#4a7cff', glow: '#9cc0ff' },
}

describe('EntitySchema', () => {
  it('персонаж проходит, related и sources по умолчанию пустые', () => {
    const r = EntitySchema.parse(character)
    expect(r.kind).toBe('character')
    expect(r.related).toEqual([])
    expect(r.sources).toEqual([])
  })
  it('персонаж без book не проходит', () => {
    const { book: _book, ...rest } = character
    expect(EntitySchema.safeParse(rest).success).toBe(false)
  })
  it('эра проходит без book и eras', () => {
    expect(EntitySchema.safeParse(era).success).toBe(true)
  })
  it('сезон 5 не проходит (SEASONS + 1 = 4)', () => {
    const bad = { ...character, appearsIn: { show: [{ season: 5 }] } }
    expect(EntitySchema.safeParse(bad).success).toBe(false)
  })
  it('id не в kebab-case не проходит', () => {
    expect(EntitySchema.safeParse({ ...character, id: 'Salvor_Hardin' }).success).toBe(false)
  })
  it('неизвестный kind не проходит', () => {
    expect(EntitySchema.safeParse({ ...character, kind: 'hero' }).success).toBe(false)
  })
  it('неизвестная часть книги не проходит', () => {
    const bad = { ...character, appearsIn: { book: ['prelude'] } }
    expect(EntitySchema.safeParse(bad).success).toBe(false)
  })
  it('цвет палитры должен быть #rrggbb', () => {
    const bad = { ...era, palette: { primary: 'gold', glow: '#9cc0ff' } }
    expect(EntitySchema.safeParse(bad).success).toBe(false)
  })
})

describe('DatasetSchema', () => {
  it('принимает эру с t и планету с xyz', () => {
    const ds = {
      version: 1,
      entities: [
        { ...era, t: 0.25 },
        {
          id: 'terminus', kind: 'planet', name: { ru: 'Терминус' }, summary: { ru: 'Край галактики.' },
          eras: ['terminus-crisis'], book: { presence: 'same' },
          galaxy: { arm: 1, r: 0.95, offset: 0 },
          look: { type: 'barren', colorA: '#7fa3c7', colorB: '#2e4a6b', radius: 1.5 },
          xyz: [1, 0, 2],
        },
      ],
    }
    expect(DatasetSchema.safeParse(ds).success).toBe(true)
  })
  it('эру без t не принимает', () => {
    expect(DatasetSchema.safeParse({ version: 1, entities: [era] }).success).toBe(false)
  })
})
