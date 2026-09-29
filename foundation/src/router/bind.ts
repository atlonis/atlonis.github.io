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
  let applying = false

  const fromHash = () => {
    applying = true
    try {
      const { route, notice } = resolveHash(location.hash, index)
      useStore.getState().applyRoute(route)
      if (notice) useStore.getState().setNotice(notice)
      const h = formatHash(route)
      if (location.hash !== h) history.replaceState(null, '', h)
    } finally {
      applying = false
    }
  }
  fromHash()
  window.addEventListener('hashchange', fromHash)

  const unsub = useStore.subscribe((s, prev) => {
    if (applying) return
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

/** Открыть карточку. Если сущность не живёт в активной эре — переключить эру на первую её эру. Один атомарный апдейт стора — иначе subscriber увидит промежуточное состояние «старая карточка + новая эра». */
export function openEntity(index: DataIndex, id: string): void {
  const entity = index.byId.get(id)
  if (!entity || entity.kind === 'era') return
  const s = useStore.getState()
  const eraId = entity.eras.includes(s.eraId) ? s.eraId : entity.eras[0]
  s.open(id, eraId)
}
