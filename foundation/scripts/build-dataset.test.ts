import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildDataset } from './build-dataset'

const CONTENT = fileURLToPath(new URL('../content', import.meta.url))

describe('content/', () => {
  const { dataset, errors } = buildDataset(CONTENT)

  it('проходит схему и перекрёстные проверки', () => {
    expect(errors).toEqual([])
    expect(dataset).toBeDefined()
  })

  it('эры идут по нити монотонно', () => {
    const eras = dataset!.entities.filter((e) => e.kind === 'era').sort((a, b) => a.order - b.order)
    expect(eras.length).toBeGreaterThanOrEqual(5)
    eras.forEach((era, i) => {
      if (i > 0) expect(era.t).toBeGreaterThan(eras[i - 1].t)
    })
    expect(eras[0].t).toBe(0)
    expect(eras[eras.length - 1].t).toBe(1)
  })

  it('у планет есть xyz', () => {
    for (const e of dataset!.entities) if (e.kind === 'planet') expect(e.xyz).toHaveLength(3)
  })

  it('kind совпадает с папкой', () => {
    const ids = dataset!.entities.map((e) => e.id)
    expect(ids).toContain('salvor-hardin')
    expect(ids).toContain('trantor-trial')
  })
})

describe('buildDataset на битом контенте', () => {
  it('возвращает ошибки, а не датасет', () => {
    const { dataset, errors } = buildDataset(fileURLToPath(new URL('./fixtures/broken', import.meta.url)))
    expect(dataset).toBeUndefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.join('\n')).toContain('planet/oops.yaml')
  })
})
