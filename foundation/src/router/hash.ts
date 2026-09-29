import type { DataIndex } from '../data/indexDataset'
import { KINDS, type Kind } from '../data/schema'

export const MODES = ['chronicle', 'map', 'list'] as const
export type Mode = (typeof MODES)[number]

export interface Route {
  mode: Mode
  eraId: string
  kind?: Kind
  id?: string
}

export const NOT_FOUND = 'Такой страницы нет'

const isMode = (s: string): s is Mode => (MODES as readonly string[]).includes(s)
const isKind = (s: string): s is Kind => (KINDS as readonly string[]).includes(s)

/** `#/<mode>/<eraId>[/<kind>/<id>]`. Мусор → null. Сегмент сущности не может быть эрой. */
export function parseHash(hash: string): Route | null {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts.length !== 2 && parts.length !== 4) return null
  const [mode, eraId, kind, id] = parts
  if (!isMode(mode) || !eraId) return null
  if (parts.length === 2) return { mode, eraId }
  if (!isKind(kind) || kind === 'era' || !id) return null
  return { mode, eraId, kind, id }
}

export function formatHash(r: Route): string {
  return r.kind && r.id ? `#/${r.mode}/${r.eraId}/${r.kind}/${r.id}` : `#/${r.mode}/${r.eraId}`
}

/** Проверяет хэш по данным. Пустой хэш — дефолт молча; мусор или чужой id — дефолт с уведомлением. */
export function resolveHash(hash: string, index: DataIndex): { route: Route; notice?: string } {
  const fallback: Route = { mode: 'chronicle', eraId: index.eras[0].id }
  const clean = hash.replace(/^#\/?$/, '')
  if (clean === '') return { route: fallback }

  const parsed = parseHash(hash)
  if (!parsed) return { route: fallback, notice: NOT_FOUND }
  const era = index.byId.get(parsed.eraId)
  if (!era || era.kind !== 'era') return { route: fallback, notice: NOT_FOUND }

  if (parsed.id) {
    const entity = index.byId.get(parsed.id)
    if (!entity || entity.kind !== parsed.kind || entity.kind === 'era') {
      return { route: { mode: parsed.mode, eraId: parsed.eraId }, notice: NOT_FOUND }
    }
    if (!entity.eras.includes(parsed.eraId)) return { route: { ...parsed, eraId: entity.eras[0] } }
  }
  return { route: parsed }
}
