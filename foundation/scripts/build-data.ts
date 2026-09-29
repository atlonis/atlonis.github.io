import { mkdirSync, writeFileSync } from 'node:fs'
import { buildDataset } from './build-dataset'

const root = new URL('..', import.meta.url).pathname
const { dataset, errors } = buildDataset(`${root}content`)

if (errors.length || !dataset) {
  console.error(`build-data: ${errors.length} ошибок`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

mkdirSync(`${root}public/data`, { recursive: true })
writeFileSync(`${root}public/data/foundation.json`, JSON.stringify(dataset))
console.log(`build-data: ${dataset.entities.length} сущностей → public/data/foundation.json`)
