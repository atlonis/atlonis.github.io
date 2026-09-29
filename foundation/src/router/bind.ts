import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'
import { formatHash, resolveHash, type Route } from './hash'

function routeOf(index: DataIndex): Route {
  const s = useStore.getState()
  const entity = s.selectedId ? index.byId.get(s.selectedId) : undefined
  if (entity && entity.kind !== 'era') return { mode: s.mode, eraId: s.eraId, kind: entity.kind, id: entity.id }
  return { mode: s.mode, eraId: s.eraId }
}

/** URL — источник истины. Хэш → стор при старте и на hashchange; стор → хэш на изменения. */
export function bindRouter(index: DataIndex): () => void {
  const fromHash = () => {
    const { route, notice } = resolveHash(location.hash, index)
    useStore.getState().applyRoute(route)
    if (notice) useStore.getState().setNotice(notice)
    const h = formatHash(route)
    if (location.hash !== h) history.replaceState(null, '', h)
  }
  fromHash()
  window.addEventListener('hashchange', fromHash)

  const unsub = useStore.subscribe((s, prev) => {
    const h = formatHash(routeOf(index))
    if (h === location.hash) return
    const opened = s.selectedId !== null && s.selectedId !== prev.selectedId
    if (opened) history.pushState(null, '', h)
    else history.replaceState(null, '', h)
  })

  return () => {
    window.removeEventListener('hashchange', fromHash)
    unsub()
  }
}

/** Открыть карточку. Если сущность не живёт в активной эре — переключить эру на первую её эру. */
export function openEntity(index: DataIndex, id: string): void {
  const entity = index.byId.get(id)
  if (!entity || entity.kind === 'era') return
  const s = useStore.getState()
  if (!entity.eras.includes(s.eraId)) s.setEra(entity.eras[0])
  s.select(id)
}
