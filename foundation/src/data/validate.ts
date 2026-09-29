import type { Entity, Era, Kind } from './schema'

/** Перекрёстные проверки поверх zod. Возвращает список ошибок; пустой — всё хорошо. */
export function validateDataset(entities: Entity[]): string[] {
  const errors: string[] = []
  const byId = new Map<string, Entity>()
  for (const e of entities) {
    if (byId.has(e.id)) errors.push(`${e.id}: дубликат id`)
    byId.set(e.id, e)
  }

  const expectKind = (owner: string, field: string, id: string | undefined, kind: Kind) => {
    if (id === undefined) return
    const target = byId.get(id)
    if (!target) errors.push(`${owner}: ${field} → «${id}» не существует`)
    else if (target.kind !== kind) errors.push(`${owner}: ${field} → «${id}» это ${target.kind}, нужен ${kind}`)
  }

  const eras = entities.filter((e): e is Era => e.kind === 'era').sort((a, b) => a.order - b.order)
  if (eras.length === 0) errors.push('нет ни одной эры')
  eras.forEach((era, i) => {
    if (era.order !== i + 1) errors.push(`${era.id}: order должен быть ${i + 1}, а не ${era.order}`)
    if (era.years.start > era.years.end) errors.push(`${era.id}: years.start больше years.end`)
    const prev = eras[i - 1]
    if (prev && era.years.start <= prev.years.end) errors.push(`${era.id}: годы пересекаются с ${prev.id}`)
  })

  for (const e of entities) {
    for (const r of e.related) if (!byId.has(r.id)) errors.push(`${e.id}: related → «${r.id}» не существует`)
    if (e.kind === 'era') continue

    for (const id of e.eras) expectKind(e.id, 'eras', id, 'era')
    expectKind(e.id, 'book.counterpart', e.book.counterpart, e.kind)
    for (const t of e.timeline ?? []) {
      if (!e.eras.includes(t.era)) errors.push(`${e.id}: timeline.era «${t.era}» нет в eras`)
      expectKind(e.id, 'timeline.planet', t.planet, 'planet')
      expectKind(e.id, 'timeline.faction', t.faction, 'faction')
    }
    if (e.kind === 'character') {
      expectKind(e.id, 'faction', e.faction, 'faction')
      expectKind(e.id, 'homeworld', e.homeworld, 'planet')
    }
    if (e.kind === 'artifact') expectKind(e.id, 'planet', e.planet, 'planet')
    if (e.kind === 'event') {
      expectKind(e.id, 'planet', e.planet, 'planet')
      if (e.year === undefined && e.yearLabel === undefined) errors.push(`${e.id}: у события нужен year или yearLabel`)
      if (e.year !== undefined) {
        const year = e.year
        const inside = e.eras.some((id) => {
          const era = byId.get(id)
          return era?.kind === 'era' && year >= era.years.start && year <= era.years.end
        })
        if (!inside) errors.push(`${e.id}: year ${year} не попадает ни в одну из его эр`)
      }
    }
  }
  return errors
}
