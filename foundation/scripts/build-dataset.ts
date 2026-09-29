import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { eraT, planetXYZ } from '../src/data/derive'
import { EntitySchema, type Dataset, type Entity, type EntityOut } from '../src/data/schema'
import { validateDataset } from '../src/data/validate'

/** Читает content/<kind>/<id>.yaml, валидирует, считает производные. Ничего не пишет на диск. */
export function buildDataset(contentDir: string): { dataset?: Dataset; errors: string[] } {
  const errors: string[] = []
  const entities: Entity[] = []
  const files = (readdirSync(contentDir, { recursive: true }) as string[]).filter((f) => f.endsWith('.yaml')).sort()

  for (const rel of files) {
    let raw: unknown
    try {
      raw = parse(readFileSync(join(contentDir, rel), 'utf8'))
    } catch (e) {
      errors.push(`${rel}: не читается YAML — ${(e as Error).message}`)
      continue
    }
    const parsed = EntitySchema.safeParse(raw)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push(`${rel}: ${issue.path.join('.') || '(корень)'} — ${issue.message}`)
      continue
    }
    const folder = rel.split('/')[0]
    if (parsed.data.kind !== folder) errors.push(`${rel}: kind «${parsed.data.kind}» не совпадает с папкой «${folder}»`)
    const expectedName = `${parsed.data.id}.yaml`
    if (!rel.endsWith(`/${expectedName}`)) errors.push(`${rel}: файл должен называться ${expectedName}`)
    entities.push(parsed.data)
  }

  errors.push(...validateDataset(entities))
  if (errors.length) return { errors }

  const eraCount = entities.filter((e) => e.kind === 'era').length
  const out: EntityOut[] = entities.map((e) => {
    if (e.kind === 'era') return { ...e, t: eraT(e.order, eraCount) }
    if (e.kind === 'planet') return { ...e, xyz: planetXYZ(e.galaxy) }
    return e
  })
  return { dataset: { version: 1, entities: out }, errors: [] }
}
