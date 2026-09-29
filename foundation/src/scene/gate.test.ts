import { describe, expect, it } from 'vitest'
import { decide3D } from './gate'

const ok = { webgl2: true, reducedMotion: false, saveData: false, forceOff: false }

describe('decide3D', () => {
  it('всё в порядке — грузим сразу', () => expect(decide3D(ok)).toBe('auto'))
  it('нет WebGL2 — недоступно', () => expect(decide3D({ ...ok, webgl2: false })).toBe('unavailable'))
  it('?no3d — недоступно даже с WebGL2', () => expect(decide3D({ ...ok, forceOff: true })).toBe('unavailable'))
  it('reduced-motion — только по кнопке', () => expect(decide3D({ ...ok, reducedMotion: true })).toBe('button'))
  it('saveData — только по кнопке', () => expect(decide3D({ ...ok, saveData: true })).toBe('button'))
})
