import { bookOf, feToIe, type BookPart } from './derive'
import type { Event, Kind } from './schema'

export const BOOK_PART_TITLES: Record<BookPart, string> = {
  'psychohistorians': 'Психоисторики',
  'encyclopedists': 'Энциклопедисты',
  'mayors': 'Мэры',
  'traders': 'Торговцы',
  'merchant-princes': 'Князья торговли',
  'general': 'Генерал',
  'mule': 'Мул',
  'search-by-mule': 'Поиски Мула',
  'search-by-foundation': 'Поиски Основания',
}

export const KIND_TITLES: Record<Kind, string> = {
  era: 'Эра',
  planet: 'Планета',
  character: 'Персонаж',
  faction: 'Фракция',
  event: 'Событие',
  artifact: 'Объект',
  difference: 'Расхождение',
}

export const seasonLabel = (n: number) => `S${n}`
export const bookPartLabel = (p: BookPart) => `кн. ${bookOf(p)} «${BOOK_PART_TITLES[p]}»`

export function eventYears(e: Event): string {
  const parts: string[] = []
  if (e.year !== undefined) parts.push(`${e.year} Э.О. (${feToIe(e.year)} И.Э.)`)
  else if (e.yearLabel) parts.push(e.yearLabel.ru)
  if (e.yearBook !== undefined && e.yearBook !== e.year) parts.push(`в книге ${e.yearBook} Э.О.`)
  return parts.join(' · ')
}
