import type { Dataset, EntityOut, EraOut, NonEraOut } from './schema'

export interface DataIndex {
  entities: EntityOut[]
  byId: Map<string, EntityOut>
  eras: EraOut[]
  byEra: Map<string, NonEraOut[]>
}

export function indexDataset(ds: Dataset): DataIndex {
  const byId = new Map<string, EntityOut>()
  const byEra = new Map<string, NonEraOut[]>()
  const eras: EraOut[] = []
  for (const e of ds.entities) {
    byId.set(e.id, e)
    if (e.kind === 'era') {
      eras.push(e)
      continue
    }
    for (const eraId of e.eras) {
      const list = byEra.get(eraId) ?? []
      list.push(e)
      byEra.set(eraId, list)
    }
  }
  eras.sort((a, b) => a.order - b.order)
  return { entities: ds.entities, byId, eras, byEra }
}
