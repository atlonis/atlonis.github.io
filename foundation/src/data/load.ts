import { indexDataset, type DataIndex } from './indexDataset'
import { DatasetSchema } from './schema'

export async function loadDataset(): Promise<DataIndex> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/foundation.json`)
  if (!res.ok) throw new Error(`Данные не загрузились: HTTP ${res.status}`)
  const parsed = DatasetSchema.safeParse(await res.json())
  if (!parsed.success) throw new Error('Данные не проходят схему. Пересоберите foundation.json.')
  return indexDataset(parsed.data)
}
