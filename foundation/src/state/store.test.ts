import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'

const initial = useStore.getState()

describe('store: 3D', () => {
  beforeEach(() => useStore.setState(initial, true))

  it('setGate: want3d только при auto', () => {
    useStore.getState().setGate('auto')
    expect(useStore.getState().want3d).toBe(true)
    useStore.getState().setGate('button')
    expect(useStore.getState().want3d).toBe(false)
    useStore.getState().setGate('unavailable')
    expect(useStore.getState().want3d).toBe(false)
  })

  it('request3d: включает want3d, статус loading, считает попытки', () => {
    useStore.getState().request3d()
    useStore.getState().request3d()
    const s = useStore.getState()
    expect(s.want3d).toBe(true)
    expect(s.scene3d).toBe('loading')
    expect(s.sceneAttempt).toBe(2)
  })

  it('open: атомарно ставит карточку и эру', () => {
    useStore.getState().open('salvor-hardin', 'terminus-crisis')
    const s = useStore.getState()
    expect(s.selectedId).toBe('salvor-hardin')
    expect(s.eraId).toBe('terminus-crisis')
  })
})
