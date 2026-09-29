/** Виды сущностей. Живёт здесь (не в schema.ts), чтобы оболочка могла использовать их без импорта zod. */
export const KINDS = ['era', 'planet', 'character', 'faction', 'event', 'artifact', 'difference'] as const
export type Kind = (typeof KINDS)[number]

/** Год 0 Э.О. = суд над Селдоном = 12 067 Имперской эры сериала. */
export const FE_ZERO_IE = 12067
/** Сколько сезонов сериала вышло. Баннер и валидация читают отсюда. */
export const SEASONS = 3

export const BOOK_PARTS = [
  'psychohistorians', 'encyclopedists', 'mayors', 'traders', 'merchant-princes', // кн. 1
  'general', 'mule',                                                             // кн. 2
  'search-by-mule', 'search-by-foundation',                                      // кн. 3
] as const
export type BookPart = (typeof BOOK_PARTS)[number]

export function bookOf(part: BookPart): 1 | 2 | 3 {
  const i = BOOK_PARTS.indexOf(part)
  if (i < 5) return 1
  if (i < 7) return 2
  return 3
}

export function feToIe(fe: number): number {
  return FE_ZERO_IE + fe
}

/** Спираль нити над диском галактики. Константы подбираются в 3D-плане. */
export const HELIX = { turns: 1.5, r0: 40, r1: 120, h0: 25, h1: 60 } as const

export function helix(t: number): [number, number, number] {
  const angle = t * HELIX.turns * Math.PI * 2
  const radius = HELIX.r0 + (HELIX.r1 - HELIX.r0) * t
  const y = HELIX.h0 + (HELIX.h1 - HELIX.h0) * t
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius]
}

/** Параметр эры на нити: order = 1 → 0, order = N → 1. */
export function eraT(order: number, count: number): number {
  if (count <= 1) return 0
  return (order - 1) / (count - 1)
}

/** Спиральное правило галактики: то же, что и у частиц в 3D-плане. */
export const GALAXY = { arms: 4, radius: 100, spin: 2.0 } as const

export interface GalaxyCoords {
  arm: number
  r: number
  offset: number
  y?: number
}

export function planetXYZ(g: GalaxyCoords): [number, number, number] {
  const branch = ((g.arm % GALAXY.arms) / GALAXY.arms) * Math.PI * 2
  const angle = branch + g.r * GALAXY.spin + g.offset
  const radius = g.r * GALAXY.radius
  return [Math.cos(angle) * radius, g.y ?? 0, Math.sin(angle) * radius]
}
