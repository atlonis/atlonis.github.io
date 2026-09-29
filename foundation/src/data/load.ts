import { indexDataset, type DataIndex } from './indexDataset'
import type { Dataset } from './schema'

function isDataset(x: unknown): x is Dataset {
  if (typeof x !== 'object' || x === null) return false
  const o = x as { version?: unknown; entities?: unknown }
  return o.version === 1 && Array.isArray(o.entities)
}

/** Данные проверены zod-схемой при сборке (build-data); в оболочке только дешёвая проверка формы, чтобы zod не попадал в бандл. */
export async function loadDataset(): Promise<DataIndex> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/foundation.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Данные не загрузились: HTTP ${res.status}`)
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error('Данные повреждены. Пересоберите foundation.json.')
  }
  if (!isDataset(json)) throw new Error('Данные не той версии. Пересоберите foundation.json.')
  return indexDataset(json)
}
