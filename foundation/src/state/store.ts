import { create } from 'zustand'
import type { Mode, Route } from '../router/hash'
import type { GateDecision } from '../scene/gate'

export type Scene3dStatus = 'idle' | 'loading' | 'ready' | 'failed' | 'lost'

interface State {
  mode: Mode
  eraId: string
  selectedId: string | null
  notice: string | null
  gate: GateDecision | null
  scene3d: Scene3dStatus
  want3d: boolean
  sceneAttempt: number
  applyRoute: (r: Route) => void
  setMode: (mode: Mode) => void
  setEra: (eraId: string) => void
  select: (id: string | null) => void
  open: (selectedId: string, eraId: string) => void
  setNotice: (notice: string | null) => void
  setGate: (gate: GateDecision) => void
  setScene3d: (scene3d: Scene3dStatus) => void
  /** Запросить 3D: по кнопке на постере, «Повторить загрузку», «Перезапустить». */
  request3d: () => void
}

export const useStore = create<State>((set) => ({
  mode: 'chronicle',
  eraId: '',
  selectedId: null,
  notice: null,
  gate: null,
  scene3d: 'idle',
  want3d: false,
  sceneAttempt: 0,
  applyRoute: (r) => set({ mode: r.mode, eraId: r.eraId, selectedId: r.id ?? null }),
  setMode: (mode) => set({ mode }),
  setEra: (eraId) => set({ eraId }),
  select: (selectedId) => set({ selectedId }),
  open: (selectedId, eraId) => set({ selectedId, eraId }),
  setNotice: (notice) => set({ notice }),
  setGate: (gate) => set({ gate, want3d: gate === 'auto' }),
  setScene3d: (scene3d) => set({ scene3d }),
  request3d: () => set((s) => ({ want3d: true, scene3d: 'loading', sceneAttempt: s.sceneAttempt + 1 })),
}))
