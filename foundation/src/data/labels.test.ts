import { describe, expect, it } from 'vitest'
import type { Event } from './schema'
import { eventYears } from './labels'

const event = (extra: Partial<Event>): Event => ({
  id: 'x', kind: 'event', name: { ru: 'x' }, summary: { ru: 'x' }, appearsIn: {}, related: [], sources: [],
  eras: ['e1'], book: { presence: 'same' }, ...extra,
})

describe('eventYears', () => {
  it('year + yearBook разных значений — обе даты и книжный год', () => {
    expect(eventYears(event({ year: 35, yearBook: 50 }))).toBe('35 Э.О. (12102 И.Э.) · в книге 50 Э.О.')
  })
  it('только yearLabel — берём его как есть', () => {
    expect(eventYears(event({ yearLabel: { ru: 'между S1 и S2' } }))).toBe('между S1 и S2')
  })
})
