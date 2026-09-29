import { create } from 'zustand'
import type { Tier } from './tier'

/** Длительность полёта камеры к эре по чипу, hashchange и deep-link, секунды. */
export const NAV_DURATION = 0.8

interface SceneState {
  activeEraId: string
  tier: Tier
  reducedMotion: boolean
  /** Замер FrameMeter завершён: тир больше не пересчитывается при перемонтировании сцены. */
  tierLocked: boolean
  /** Регистрирует CameraRig; зовут EraNav и deep-link. duration в секундах. */
  scrollToEra?: (id: string, duration: number) => void
  setActiveEra: (id: string) => void
  setTier: (tier: Tier) => void
  setTierLocked: (locked: boolean) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  activeEraId: '',
  tier: 'high',
  reducedMotion: false,
  tierLocked: false,
  setActiveEra: (activeEraId) => set({ activeEraId }),
  setTier: (tier) => set({ tier }),
  setTierLocked: (tierLocked) => set({ tierLocked }),
}))

// «Живая» сцена: 3 секунды после последнего ввода, скролла или твина. Модульные переменные — без ререндеров.
const ALIVE_MS = 3000
let lastInputAt = 0
export function markAlive(): void {
  lastInputAt = performance.now()
}
export function isAlive(): boolean {
  return performance.now() - lastInputAt < ALIVE_MS
}

// Последняя позиция нити: нативный offset (0..1) и эра из URL в момент записи. Переживает перемонтирование Canvas
// (смена тира) и уход в «Список». Модульная переменная — без ререндеров; запись — присваивание полей, без аллокаций.
const lastPos = { valid: false, offset: 0, eraId: '' }
export function setLastOffset(offset: number, eraId: string): void {
  lastPos.valid = true
  lastPos.offset = offset
  lastPos.eraId = eraId
}
/** Сохранённая позиция или null. Если эра в URL с тех пор менялась вне сцены (чип или карточка в «Списке»), позиция устарела: URL важнее. */
export function getLastOffset(eraId: string): number | null {
  return lastPos.valid && lastPos.eraId === eraId ? lastPos.offset : null
}
