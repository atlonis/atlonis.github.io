import { create } from 'zustand'
import type { Mode, Route } from '../router/hash'

interface State {
  mode: Mode
  eraId: string
  selectedId: string | null
  notice: string | null
  applyRoute: (r: Route) => void
  setMode: (mode: Mode) => void
  setEra: (eraId: string) => void
  select: (id: string | null) => void
  open: (selectedId: string, eraId: string) => void
  setNotice: (notice: string | null) => void
}

export const useStore = create<State>((set) => ({
  mode: 'chronicle',
  eraId: '',
  selectedId: null,
  notice: null,
  applyRoute: (r) => set({ mode: r.mode, eraId: r.eraId, selectedId: r.id ?? null }),
  setMode: (mode) => set({ mode }),
  setEra: (eraId) => set({ eraId }),
  select: (selectedId) => set({ selectedId }),
  open: (selectedId, eraId) => set({ selectedId, eraId }),
  setNotice: (notice) => set({ notice }),
}))
