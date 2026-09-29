import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDataset } from './build-dataset'

const root = fileURLToPath(new URL('..', import.meta.url))
const { dataset, errors } = buildDataset(join(root, 'content'))

if (errors.length || !dataset) {
  console.error(`build-data: ${errors.length} ошибок`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

const outDir = join(root, 'public', 'data')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'foundation.json'), JSON.stringify(dataset))
console.log(`build-data: ${dataset.entities.length} сущностей → public/data/foundation.json`)
