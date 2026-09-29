import { create } from 'zustand'
import type { Tier } from './tier'

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
