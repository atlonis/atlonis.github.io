# Карта «Основания» 3D-A: сцена и «Хроника» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Поверх v0 добавить 3D-чанк: галактика из частиц, процедурные планеты, светящаяся нить эр над диском и режим «Хроника» — скролл ведёт камеру вдоль нити, остановки на эрах, палитра меняется по эре, тап по планете открывает карточку. Всё это с тирами устройств, render-on-demand, страховками на потерю контекста и деплоем в лабу.

**Architecture:** Оболочка v0 остаётся без three; `SceneHost` в оболочке решает по гейту (WebGL2, reduced-motion, saveData, `?no3d`) грузить ли чанк `SceneRoot` динамическим `import()`. Внутри чанка: `<Canvas frameloop="demand">`, слои как отдельные компоненты с материалами, созданными императивно в `useMemo` (uniform-объекты общие, палитра твинится GSAP по месту), чистые модули `galaxy.ts`/`layout.ts`/`tier.ts`/`gate.ts` без three и с тестами. Камерой в «Хронике» владеет только `CameraRig` под drei `ScrollControls`. Режим «Карта», подписи troika, маркеры персонажей, hover-лейбл и «Показать на карте» — план 3D-B.

**Tech Stack:** three 0.186.1, @react-three/fiber 9.8.1, @react-three/drei 10.7.9 (только `ScrollControls`/`useScroll`), gsap 3.15.0, zustand, Vite 8, vitest, Playwright.

**Spec:** `foundation/docs/superpowers/specs/2026-09-29-foundation-map-design.md` — разделы 6.2 (два чанка), 6.3 (слои, камера «Хроники», активная эра, палитра), 6.4 (Loading), 6.5 (тиры, render-on-demand, бюджеты), 6.6 (WebGL2, reduced-motion, import(), contextlost). Разведка API, на которой основан код: проверена по исходникам pinned-версий 29.09.2026 (см. «Проверенные факты» ниже).

## Global Constraints

- Все команды из `/Users/user/projects/lab/foundation/`; git-корень `/Users/user/projects/lab`, ветка `foundation-3d-a` от `main`; коммиты из корня репо; push только по просьбе владельца.
- Версии точные: `three@0.186.1`, `@react-three/fiber@9.8.1`, `@react-three/drei@10.7.9`, `gsap@3.15.0`, `@types/three@0.186.0` (если такой нет — ближайший `@types/three@0.186.x`/`latest`, записать в отчёт). `package-lock.json` коммитим.
- Оболочка (`dist/assets/index-*.js`) ≤ 100 КБ gzip и не импортирует статически `three`, `@react-three/*`, `gsap`; 3D-чанк (`dist/assets/SceneRoot-*.js`) ≤ 420 КБ gzip. Проверяет `size-limit`.
- Все пути к `public/` через `import.meta.env.BASE_URL`.
- `frameloop="demand"`; в `useFrame` любой интегрируемый `delta` клампится `Math.min(delta, 1/30)` (fiber не клампит). Каждый твин — через `tweenTo()` из `src/scene/anim.ts`, который вызывает `invalidate()` в `onUpdate`.
- Камерой владеет один компонент: в «Хронике» — `CameraRig`. `CameraControls` в этом плане не монтируется.
- Никаких `Light` в сцене, никакого постпроцесса, никакого `scene.fog` (аддитивные точки гасятся по глубине в шейдере).
- В `ShaderMaterial` не объявлять `precision`, `projectionMatrix`, `modelViewMatrix`, `position`, `normal`, `uv`, `instanceMatrix` — three подставляет их сам; дублирование = ошибка компиляции.
- Все тексты интерфейса — по-русски, как в плане.
- Чистые модули (`gate`, `tier`, `galaxy`, `layout`) без импорта `three`, с TDD. Компоненты сцены проверяются в браузере и Playwright-смоуком.

## Проверенные факты (не перепроверять, применять)

- fiber 9.8.1: `<Canvas fallback>` — это дети `<canvas>`, а не UI ошибки; провал создания WebGL-контекста **бросает исключение** из `Canvas` → нужен React error boundary. `invalidate()` импортируется из `@react-three/fiber` и работает вне компонентов. В demand-режиме `useFrame` бежит только на инвалидированных кадрах; `delta` не клампится.
- drei 10.7.9 `ScrollControls`: пропсы `pages, distance, damping, maxSpeed, eps, enabled, style`; сам инвалидирует на scroll и пока идёт демпфирование; `<Scroll>` не обязателен; `useScroll()` даёт `{ el, offset, delta, pages, range, curve, visible }`; `offset = scrollTop / (scrollHeight − clientHeight)`; первый scroll-событие после монтирования игнорируется — программный скролл делать через `requestAnimationFrame`. Свой скролл-div перекрывает родителя Canvas и перехватывает pointer/wheel.
- fiber 9.8.1 **рейкастит объекты с `visible={false}`** (проверки visible нет ни в events.ts, ни в three Raycaster) — прокси-сферы для пикинга делаем невидимыми; draw calls они не дают.
- three r186 `ShaderMaterial`: `USE_SIZEATTENUATION` для него не определяется — размер точек считаем сами `uSize * aScale * uPixelRatio * (uScale / -mvPosition.z)`, где `uScale = cssHeight * 0.5`, `uPixelRatio = renderer.getPixelRatio()`. Шейдер компилируется как GLSL ES 3.00 с макросами — синтаксис `attribute/varying/gl_FragColor` работает.
- three r186 `InstancedMesh` + `ShaderMaterial`: `attribute mat4 instanceMatrix` подставляется автоматически (`USE_INSTANCING`); свои per-instance атрибуты — `InstancedBufferAttribute` на геометрии, объявлять `attribute vec3 aColorA;`. После `setMatrixAt` — `instanceMatrix.needsUpdate = true`.
- R3F копирует JSX-проп `uniforms` в `material.uniforms` (`{...uniform}` — копия обёртки, но `.value` тот же объект). Поэтому материалы создаём императивно в `useMemo` и общие `THREE.Color` из `paletteUniforms` мутируем по месту (`r,g,b`), а не переприсваиваем `.value`.
- Контекст: события `webglcontextlost`/`webglcontextrestored` на `gl.domElement`; three сам делает `preventDefault`; R3F при размонтировании сам зовёт `gl.dispose()` и `forceContextLoss()`.
- gsap 3.15: `ticker.deltaTime` в миллисекундах; тикер держит свой rAF, пока есть слушатели, поэтому глобальный `gsap.ticker.add(invalidate)` из спека §6.5 п.2 **не используем** (кадры шли бы постоянно) — вместо этого `invalidate()` в `onUpdate` каждого твина. Это отклонение от спека, зафиксировано в задаче 7 (правка спека).
- `navigator.deviceMemory` есть только в Chromium; `matchMedia('(pointer: coarse)')` + `navigator.maxTouchPoints` — рабочий детектор телефона и iPad (iPadOS шлёт Mac UA). MAX_TEXTURE_SIZE гарантированно ≥ 4096.
- three r186 `Clock` deprecated (одно `console.warn` на Canvas от fiber) — это не ошибка, смоук ловит только `console.error`.

## Отклонения от спека, принятые в этом плане

1. §6.5 п.2: вместо `gsap.ticker.add(invalidate)` — `invalidate()` в `onUpdate` каждого твина (см. факты). Спек правится в задаче 7.
2. Режим «Карта» в этом плане показывает ту же сцену «Хроники» (CameraControls — план 3D-B).
3. Постер загрузки — CSS-блок с заголовком и кнопкой, без WebP-картинки (картинка — полировка в 3D-B).
4. Флаги `?no3d` (принудительно «3D недоступно», нужен смоуку) и `?debug` (счётчик draw calls/fps).
5. «Виток» из спека §6.3 трактуем как **шаг между остановками** `spacing = 1/(N−1)`: гистерезис 0.1·spacing, дотягивание при |t − t_эры| < 0.3·spacing, наклон камеры по `smoothstep(0, 0.35·spacing, dist)`.

---

## Структура файлов

```
foundation/
  package.json  .size-limit.json  playwright.config.ts (изменяются)
  src/
    App.tsx (изменяется)  styles.css (дополняется)
    state/store.ts (дополняется: gate, scene3d, want3d, sceneAttempt)
    scene/
      gate.ts (+ .test.ts)        # оболочка: можно ли 3D — WebGL2, reduced-motion, saveData, ?no3d
      SceneHost.tsx               # оболочка: динамический import() чанка, постер, статусы
      SceneNotice.tsx             # оболочка: пометки и кнопки «Открыть 3D-карту / Повторить / Перезапустить»
      SceneRoot.tsx               # ЧАНК: Canvas, error boundary, guard, слои, режим
      tier.ts (+ .test.ts)        # чистый: тиры и их параметры, понижение по frame time
      galaxy.ts (+ .test.ts)      # чистый: mulberry32, buildGalaxy/buildBackgroundStars/buildDust
      layout.ts (+ .test.ts)      # чистый: остановки эр, t событий, активная эра с гистерезисом, камера «Хроники»
      sceneStore.ts               # zustand чанка: activeEraId, tier, reducedMotion, scrollToEra; liveness
      anim.ts                     # tweenTo() = gsap.to + invalidate + markAlive
      palette.ts                  # общие uniform-цвета эры + tweenPalette
      materials.ts                # GLSL-исходники, pointsGeometry(), useResolutionUniforms()
      Background.tsx  Galaxy.tsx  Dust.tsx  Core.tsx  Planets.tsx  Thread.tsx
      Chronicle.tsx               # ScrollControls + CameraRig
      DebugStats.tsx              # ?debug
      ContextLossGuard.tsx  FrameMeter.tsx
  tests/smoke.spec.ts (дополняется)
  README.md, docs/superpowers/specs/... (правятся в задаче 7)
```

---

### Task 1: Зависимости, гейт и сторы

**Files:**
- Modify: `package.json` (через npm), `.size-limit.json`, `src/state/store.ts`
- Create: `src/scene/gate.ts`, `src/scene/gate.test.ts`

**Interfaces:**
- Produces: `decide3D(env: GateEnv): GateDecision` (`'auto' | 'button' | 'unavailable'`), `readGateEnv(): GateEnv`; в сторе поля `gate: GateDecision | null`, `scene3d: Scene3dStatus` (`'idle' | 'loading' | 'ready' | 'failed' | 'lost'`), `want3d: boolean`, `sceneAttempt: number` и действия `setGate`, `setScene3d`, `request3d()`.

- [ ] **Step 1: ветка и зависимости**

```bash
cd /Users/user/projects/lab && git checkout -b foundation-3d-a main
cd foundation
npm i -E three@0.186.1 @react-three/fiber@9.8.1 @react-three/drei@10.7.9 gsap@3.15.0
npm i -D -E @types/three@0.186.0
```

Если `@types/three@0.186.0` не существует — `npm view @types/three versions --json | tail -5` и поставить старшую `0.186.x`; если нет ни одной — `@types/three@latest`, записать версию в отчёт. Проверить `npx tsc --noEmit` (оболочка ещё не импортирует three — должно быть чисто).

- [ ] **Step 2: тест гейта**

`src/scene/gate.test.ts`:

```ts
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
```

- [ ] **Step 3: убедиться, что падает**

```bash
npx vitest run src/scene/gate.test.ts
```

Ожидание: FAIL, `Cannot find module './gate'`.

- [ ] **Step 4: gate.ts**

```ts
export interface GateEnv {
  webgl2: boolean
  reducedMotion: boolean
  saveData: boolean
  forceOff: boolean
}
export type GateDecision = 'auto' | 'button' | 'unavailable'

/** Что делать с 3D: грузить сразу, только по кнопке или никогда. */
export function decide3D(env: GateEnv): GateDecision {
  if (env.forceOff || !env.webgl2) return 'unavailable'
  if (env.reducedMotion || env.saveData) return 'button'
  return 'auto'
}

/** Читает окружение браузера. Пробный WebGL2-контекст сразу отпускаем. */
export function readGateEnv(): GateEnv {
  let webgl2 = false
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (gl) {
      webgl2 = true
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    webgl2 = false
  }
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  const saveData = conn?.saveData === true
  const forceOff = new URLSearchParams(location.search).has('no3d')
  return { webgl2, reducedMotion, saveData, forceOff }
}
```

```bash
npx vitest run src/scene/gate.test.ts
```

Ожидание: PASS, 5 тестов.

- [ ] **Step 5: стор**

`src/state/store.ts` — заменить целиком:

```ts
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
```

`import type` из `../scene/gate` — только тип, zod и three в оболочку не тянет.

- [ ] **Step 6: size-limit**

`.size-limit.json`:

```json
[
  { "name": "оболочка", "path": "dist/assets/index-*.js", "limit": "100 kB", "gzip": true },
  { "name": "3D-чанк", "path": "dist/assets/SceneRoot-*.js", "limit": "420 kB", "gzip": true }
]
```

Пока чанка нет, `size-limit` на второй записи упадёт — это ожидаемо до задачи 4; `npm run build` в этой задаче не гоняем, только `npx tsc --noEmit && npx vitest run`.

- [ ] **Step 7: commit**

```bash
cd /Users/user/projects/lab && git add foundation/package.json foundation/package-lock.json foundation/.size-limit.json foundation/src && git commit -m "foundation 3d: зависимости three/fiber/drei/gsap, гейт 3D, статусы сцены в сторе"
```

---

### Task 2: Тиры устройств

**Files:**
- Create: `src/scene/tier.ts`, `src/scene/tier.test.ts`

**Interfaces:**
- Produces: `type Tier = 'low' | 'mid' | 'high'`, `TIER_PARAMS: Record<Tier, TierParams>` (`dpr, galaxy, dust, background, antialias`), `detectTier(env: TierEnv): Tier`, `lowerTier(t: Tier): Tier`, `shouldDowngrade(frameMs: number[], window?: number, thresholdMs?: number): boolean`, `readTierEnv(): TierEnv`.

- [ ] **Step 1: тест**

`src/scene/tier.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { TIER_PARAMS, detectTier, lowerTier, shouldDowngrade } from './tier'

describe('detectTier', () => {
  it('десктоп с мышью — high', () => expect(detectTier({ coarse: false, touchPoints: 0 })).toBe('high'))
  it('телефон — mid', () => expect(detectTier({ coarse: true, touchPoints: 5 })).toBe('mid'))
  it('iPad с Mac UA (pointer fine, но тач есть) — mid', () => expect(detectTier({ coarse: false, touchPoints: 5 })).toBe('mid'))
  it('deviceMemory ≤ 2 — low даже на десктопе', () => expect(detectTier({ coarse: false, touchPoints: 0, deviceMemory: 2 })).toBe('low'))
  it('deviceMemory undefined не понижает', () => expect(detectTier({ coarse: false, touchPoints: 0, deviceMemory: undefined })).toBe('high'))
})

describe('lowerTier', () => {
  it('high → mid → low → low', () => {
    expect(lowerTier('high')).toBe('mid')
    expect(lowerTier('mid')).toBe('low')
    expect(lowerTier('low')).toBe('low')
  })
})

describe('shouldDowngrade', () => {
  it('меньше окна — не решаем', () => expect(shouldDowngrade([30, 30, 30], 60)).toBe(false))
  it('средний кадр 25 мс на первых 60 — понижаем', () => expect(shouldDowngrade(Array(60).fill(25), 60, 20)).toBe(true))
  it('средний кадр 12 мс — не понижаем', () => expect(shouldDowngrade(Array(60).fill(12), 60, 20)).toBe(false))
})

describe('TIER_PARAMS', () => {
  it('точек и dpr больше по возрастанию тира', () => {
    expect(TIER_PARAMS.low.galaxy).toBeLessThan(TIER_PARAMS.mid.galaxy)
    expect(TIER_PARAMS.mid.galaxy).toBeLessThan(TIER_PARAMS.high.galaxy)
    expect(TIER_PARAMS.low.dpr).toBeLessThanOrEqual(TIER_PARAMS.mid.dpr)
    expect(TIER_PARAMS.mid.dpr).toBeLessThanOrEqual(TIER_PARAMS.high.dpr)
  })
})
```

- [ ] **Step 2: убедиться, что падает**

```bash
npx vitest run src/scene/tier.test.ts
```

Ожидание: FAIL, `Cannot find module './tier'`.

- [ ] **Step 3: tier.ts**

```ts
export type Tier = 'low' | 'mid' | 'high'

export interface TierEnv {
  coarse: boolean
  touchPoints: number
  deviceMemory?: number
}

export interface TierParams {
  dpr: number
  galaxy: number
  dust: number
  background: number
  antialias: boolean
}

/** Спек §6.5. Цифры точек — середина диапазонов. */
export const TIER_PARAMS: Record<Tier, TierParams> = {
  low: { dpr: 1, galaxy: 40_000, dust: 5_000, background: 10_000, antialias: false },
  mid: { dpr: 1.5, galaxy: 70_000, dust: 10_000, background: 15_000, antialias: false },
  high: { dpr: 2, galaxy: 160_000, dust: 20_000, background: 20_000, antialias: true },
}

/** Телефоны и все iPad — mid; deviceMemory ≤ 2 ГБ (только Chromium) — low; остальное — high. */
export function detectTier(env: TierEnv): Tier {
  if (env.deviceMemory !== undefined && env.deviceMemory <= 2) return 'low'
  if (env.coarse || env.touchPoints > 1) return 'mid'
  return 'high'
}

export function lowerTier(t: Tier): Tier {
  return t === 'high' ? 'mid' : 'low'
}

/** Средний кадр первых `window` подряд отрисованных кадров больше порога — понижаем тир. */
export function shouldDowngrade(frameMs: number[], window = 60, thresholdMs = 20): boolean {
  if (frameMs.length < window) return false
  const first = frameMs.slice(0, window)
  return first.reduce((a, b) => a + b, 0) / window > thresholdMs
}

export function readTierEnv(): TierEnv {
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints ?? 0 : 0
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return { coarse, touchPoints, deviceMemory }
}
```

```bash
npx vitest run src/scene/tier.test.ts
```

Ожидание: PASS, 10 тестов.

- [ ] **Step 4: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src/scene && git commit -m "foundation 3d: тиры устройств и понижение по frame time"
```

---

### Task 3: Генерация галактики

**Files:**
- Create: `src/scene/galaxy.ts`, `src/scene/galaxy.test.ts`

**Interfaces:**
- Consumes: `GALAXY` из `../data/derive` (`arms: 4, radius: 100, spin: 2.0`).
- Produces: `mulberry32(seed): () => number`, `hexToRgb(hex): [r, g, b]`, `interface PointCloud { positions: Float32Array; colors: Float32Array; scales: Float32Array; count: number }`, `buildGalaxy(seed, count): PointCloud`, `buildBackgroundStars(seed, count, radius?): PointCloud`, `buildDust(seed, count): PointCloud`, `GALAXY_SEED = 12067`.

- [ ] **Step 1: тест**

`src/scene/galaxy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { GALAXY } from '../data/derive'
import { buildBackgroundStars, buildDust, buildGalaxy, hexToRgb, mulberry32 } from './galaxy'

describe('mulberry32', () => {
  it('детерминирован и в [0, 1)', () => {
    const a = mulberry32(7), b = mulberry32(7)
    for (let i = 0; i < 100; i++) {
      const x = a()
      expect(x).toBe(b())
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})

describe('hexToRgb', () => {
  it('#ff8000 → [1, ~0.5, 0]', () => {
    const [r, g, b] = hexToRgb('#ff8000')
    expect(r).toBe(1)
    expect(g).toBeCloseTo(128 / 255)
    expect(b).toBe(0)
  })
})

describe('buildGalaxy', () => {
  const cloud = buildGalaxy(1, 5000)
  it('размеры буферов', () => {
    expect(cloud.count).toBe(5000)
    expect(cloud.positions.length).toBe(15000)
    expect(cloud.colors.length).toBe(15000)
    expect(cloud.scales.length).toBe(5000)
  })
  it('побайтно одинаков при одном сиде', () => {
    const again = buildGalaxy(1, 5000)
    expect(Buffer.from(again.positions.buffer).equals(Buffer.from(cloud.positions.buffer))).toBe(true)
  })
  it('другой сид — другие точки', () => {
    expect(buildGalaxy(2, 5000).positions[0]).not.toBe(cloud.positions[0])
  })
  it('диск: радиус в пределах, y плоский', () => {
    let maxR = 0, maxY = 0
    for (let i = 0; i < cloud.count; i++) {
      const x = cloud.positions[i * 3], y = cloud.positions[i * 3 + 1], z = cloud.positions[i * 3 + 2]
      maxR = Math.max(maxR, Math.hypot(x, z))
      maxY = Math.max(maxY, Math.abs(y))
    }
    expect(maxR).toBeLessThanOrEqual(GALAXY.radius * 1.5)
    expect(maxY).toBeLessThanOrEqual(GALAXY.radius * 0.35)
  })
  it('цвета в [0, 1], масштаб в [0.5, 1.5]', () => {
    for (let i = 0; i < cloud.colors.length; i++) {
      expect(cloud.colors[i]).toBeGreaterThanOrEqual(0)
      expect(cloud.colors[i]).toBeLessThanOrEqual(1)
    }
    for (let i = 0; i < cloud.count; i++) {
      expect(cloud.scales[i]).toBeGreaterThanOrEqual(0.5)
      expect(cloud.scales[i]).toBeLessThanOrEqual(1.5)
    }
  })
})

describe('buildBackgroundStars', () => {
  it('лежат на сфере заданного радиуса', () => {
    const c = buildBackgroundStars(3, 500, 400)
    for (let i = 0; i < c.count; i++) {
      const r = Math.hypot(c.positions[i * 3], c.positions[i * 3 + 1], c.positions[i * 3 + 2])
      expect(r).toBeCloseTo(400, 3)
    }
  })
})

describe('buildDust', () => {
  it('детерминирована, тёмные цвета', () => {
    const a = buildDust(5, 1000), b = buildDust(5, 1000)
    expect(a.positions[10]).toBe(b.positions[10])
    for (let i = 0; i < a.colors.length; i++) expect(a.colors[i]).toBeLessThanOrEqual(0.4)
  })
})
```

- [ ] **Step 2: убедиться, что падает**

```bash
npx vitest run src/scene/galaxy.test.ts
```

Ожидание: FAIL, `Cannot find module './galaxy'`.

- [ ] **Step 3: galaxy.ts**

```ts
import { GALAXY } from '../data/derive'

export const GALAXY_SEED = 12067

export interface PointCloud {
  positions: Float32Array
  colors: Float32Array
  scales: Float32Array
  count: number
}

/** Детерминированный генератор: одинаковый сид — одинаковые точки на любой машине. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const LOOK = {
  randomness: 0.28,
  randomnessPower: 3,
  flatten: 0.3,
  inside: hexToRgb('#ffb46b'),
  outside: hexToRgb('#3a5bd9'),
}

function empty(count: number): PointCloud {
  return { positions: new Float32Array(count * 3), colors: new Float32Array(count * 3), scales: new Float32Array(count), count }
}

/** Спиральная галактика: то же правило рукавов, что и planetXYZ (branch + r·spin). */
export function buildGalaxy(seed: number, count: number): PointCloud {
  const rnd = mulberry32(seed)
  const out = empty(count)
  const { arms, radius, spin } = GALAXY
  for (let i = 0; i < count; i++) {
    const r = radius * Math.pow(rnd(), 1.6)
    const branch = ((i % arms) / arms) * Math.PI * 2
    const angle = branch + (r / radius) * spin
    const jitter = () => Math.pow(rnd(), LOOK.randomnessPower) * (rnd() < 0.5 ? 1 : -1) * LOOK.randomness * r
    out.positions[i * 3] = Math.cos(angle) * r + jitter()
    out.positions[i * 3 + 1] = jitter() * LOOK.flatten
    out.positions[i * 3 + 2] = Math.sin(angle) * r + jitter()
    const mix = r / radius
    for (let c = 0; c < 3; c++) out.colors[i * 3 + c] = LOOK.inside[c] * (1 - mix) + LOOK.outside[c] * mix
    out.scales[i] = 0.5 + rnd()
  }
  return out
}

/** Фон: точки на сфере, чуть голубоватые. */
export function buildBackgroundStars(seed: number, count: number, radius = 500): PointCloud {
  const rnd = mulberry32(seed)
  const out = empty(count)
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1
    const phi = rnd() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    out.positions[i * 3] = s * Math.cos(phi) * radius
    out.positions[i * 3 + 1] = u * radius
    out.positions[i * 3 + 2] = s * Math.sin(phi) * radius
    const warm = rnd()
    out.colors[i * 3] = 0.75 + warm * 0.25
    out.colors[i * 3 + 1] = 0.8 + warm * 0.15
    out.colors[i * 3 + 2] = 1
    out.scales[i] = 0.4 + rnd() * 0.6
  }
  return out
}

/** Пыль вдоль рукавов: тёмно-фиолетовая, рисуется обычным смешиванием поверх галактики. */
export function buildDust(seed: number, count: number): PointCloud {
  const rnd = mulberry32(seed)
  const out = empty(count)
  const { arms, radius, spin } = GALAXY
  const dark = hexToRgb('#2a1d45')
  const darker = hexToRgb('#120c22')
  for (let i = 0; i < count; i++) {
    const r = radius * (0.15 + 0.85 * Math.pow(rnd(), 1.2))
    const branch = ((i % arms) / arms) * Math.PI * 2 + 0.25
    const angle = branch + (r / radius) * spin
    const jitter = () => (rnd() - 0.5) * 0.12 * r
    out.positions[i * 3] = Math.cos(angle) * r + jitter()
    out.positions[i * 3 + 1] = jitter() * 0.5
    out.positions[i * 3 + 2] = Math.sin(angle) * r + jitter()
    const mix = rnd()
    for (let c = 0; c < 3; c++) out.colors[i * 3 + c] = dark[c] * (1 - mix) + darker[c] * mix
    out.scales[i] = 2 + rnd() * 2
  }
  return out
}
```

```bash
npx vitest run src/scene/galaxy.test.ts
```

Ожидание: PASS, 9 тестов.

- [ ] **Step 4: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src/scene && git commit -m "foundation 3d: детерминированная генерация галактики, фона и пыли"
```

---

### Task 4: Чанк сцены: Canvas, страховки, фон, галактика, пыль, ядро

**Files:**
- Create: `src/scene/sceneStore.ts`, `src/scene/anim.ts`, `src/scene/palette.ts`, `src/scene/materials.ts`, `src/scene/Background.tsx`, `src/scene/Galaxy.tsx`, `src/scene/Dust.tsx`, `src/scene/Core.tsx`, `src/scene/ContextLossGuard.tsx`, `src/scene/FrameMeter.tsx`, `src/scene/DebugStats.tsx`, `src/scene/SceneRoot.tsx`, `src/scene/SceneHost.tsx`, `src/scene/SceneNotice.tsx`
- Modify: `src/App.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `useStore` (поля из задачи 1), `Tier`/`TIER_PARAMS`/`detectTier`/`readTierEnv`/`lowerTier`/`shouldDowngrade`, `buildGalaxy`/`buildBackgroundStars`/`buildDust`/`GALAXY_SEED`, `decide3D`/`readGateEnv`, `DataIndex`.
- Produces: `useSceneStore` (`activeEraId, tier, reducedMotion, scrollToEra?, setActiveEra, setTier`), `markAlive()/isAlive()`, `tweenTo(target, vars)`, `paletteUniforms`, `tweenPalette(primary, glow)`, `setPaletteNow(primary, glow)`, `pointsGeometry(cloud)`, `useResolutionUniforms(material)`, GLSL-константы, компоненты слоёв, `SceneRoot` (default export, пропс `index`), `SceneHost`, `SceneNotice`.

- [ ] **Step 1: sceneStore.ts и anim.ts**

`src/scene/sceneStore.ts`:

```ts
import { create } from 'zustand'
import type { Tier } from './tier'

interface SceneState {
  activeEraId: string
  tier: Tier
  reducedMotion: boolean
  /** Регистрирует CameraRig; зовут EraNav и deep-link. duration в секундах. */
  scrollToEra?: (id: string, duration: number) => void
  setActiveEra: (id: string) => void
  setTier: (tier: Tier) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  activeEraId: '',
  tier: 'high',
  reducedMotion: false,
  setActiveEra: (activeEraId) => set({ activeEraId }),
  setTier: (tier) => set({ tier }),
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
```

`src/scene/anim.ts`:

```ts
import gsap from 'gsap'
import { invalidate } from '@react-three/fiber'
import { markAlive, useSceneStore } from './sceneStore'

/** Единственный способ твинить в сцене: каждый шаг просит кадр, при reduced-motion — мгновенно. */
export function tweenTo<T extends object>(target: T, vars: gsap.TweenVars): gsap.core.Tween {
  markAlive()
  const reduced = useSceneStore.getState().reducedMotion
  return gsap.to(target, {
    ...vars,
    duration: reduced ? 0 : vars.duration,
    onUpdate: () => {
      vars.onUpdate?.()
      invalidate()
    },
  })
}
```

- [ ] **Step 2: palette.ts и materials.ts**

`src/scene/palette.ts`:

```ts
import * as THREE from 'three'
import gsap from 'gsap'
import { tweenTo } from './anim'

/** Общие uniform-цвета активной эры. Материалы получают ЭТИ объекты; Color мутируется по месту. */
export const paletteUniforms = {
  uEraColor: { value: new THREE.Color('#4a7cff') },
  uEraGlow: { value: new THREE.Color('#9cc0ff') },
}

export function setPaletteNow(primary: string, glow: string): void {
  gsap.killTweensOf([paletteUniforms.uEraColor.value, paletteUniforms.uEraGlow.value])
  paletteUniforms.uEraColor.value.set(primary)
  paletteUniforms.uEraGlow.value.set(glow)
}

export function tweenPalette(primary: string, glow: string, duration = 0.8): void {
  const p = new THREE.Color(primary)
  const g = new THREE.Color(glow)
  gsap.killTweensOf([paletteUniforms.uEraColor.value, paletteUniforms.uEraGlow.value])
  tweenTo(paletteUniforms.uEraColor.value, { r: p.r, g: p.g, b: p.b, duration, ease: 'power2.out' })
  tweenTo(paletteUniforms.uEraGlow.value, { r: g.r, g: g.g, b: g.b, duration, ease: 'power2.out' })
}
```

`src/scene/materials.ts`:

```ts
import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { PointCloud } from './galaxy'

/** Точки с аттенюацией по расстоянию (как PointsMaterial) и медленным дифференциальным вращением. */
export const GALAXY_VERT = /* glsl */ `
  attribute float aScale;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uSpin;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vec3 p = position;
    float r = length(p.xz);
    float omega = uSpin * 20.0 / max(r, 20.0);
    float a = uTime * omega;
    float c = cos(a), s = sin(a);
    p.xz = vec2(p.x * c - p.z * s, p.x * s + p.z * c);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(uSize * aScale * uPixelRatio * (uScale / -mvPosition.z), 1.0, 8.0 * uPixelRatio);
    vColor = aColor;
    vDepth = -mvPosition.z;
  }
`

/** Точки без вращения и без аттенюации: фон. */
export const BACKGROUND_VERT = /* glsl */ `
  attribute float aScale;
  attribute vec3 aColor;
  uniform float uSize;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * aScale * uPixelRatio;
    vColor = aColor;
    vDepth = 0.0;
  }
`

/** Точки с аттенюацией, без вращения: пыль. */
export const DUST_VERT = /* glsl */ `
  attribute float aScale;
  attribute vec3 aColor;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(uSize * aScale * uPixelRatio * (uScale / -mvPosition.z), 1.0, 24.0 * uPixelRatio);
    vColor = aColor;
    vDepth = -mvPosition.z;
  }
`

/** Мягкий диск, подкраска цветом эры, гашение по глубине. Для аддитива rgb уже умножен на альфу. */
export const POINTS_FRAG = /* glsl */ `
  uniform vec3 uEraColor;
  uniform float uTint;
  uniform float uOpacity;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(1.0 - smoothstep(0.0, 0.5, d), 3.0);
    a *= 1.0 - smoothstep(uFadeNear, uFadeFar, vDepth);
    a *= uOpacity;
    if (a < 0.003) discard;
    vec3 col = mix(vColor, uEraColor, uTint);
    gl_FragColor = vec4(col * a, a);
  }
`

/** Та же форма точки, но обычное смешивание: пыль затемняет то, что под ней. */
export const DUST_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.15, 0.5, d)) * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

export function pointsGeometry(cloud: PointCloud): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(cloud.positions, 3))
  g.setAttribute('aColor', new THREE.BufferAttribute(cloud.colors, 3))
  g.setAttribute('aScale', new THREE.BufferAttribute(cloud.scales, 1))
  return g
}

/** Держит uScale/uPixelRatio в согласии с размером канваса и dpr (как PointsMaterial). */
export function useResolutionUniforms(material: THREE.ShaderMaterial): void {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  useEffect(() => {
    if (material.uniforms.uScale) material.uniforms.uScale.value = size.height * 0.5
    if (material.uniforms.uPixelRatio) material.uniforms.uPixelRatio.value = dpr
  }, [material, size, dpr])
}

/** Радиальный градиент для спрайтов ядра и узлов. Одна текстура на всех. */
let glowTexture: THREE.CanvasTexture | null = null
export function getGlowTexture(): THREE.CanvasTexture {
  if (glowTexture) return glowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}
```

- [ ] **Step 3: слои Background, Galaxy, Dust, Core**

`src/scene/Background.tsx`:

```tsx
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { GALAXY_SEED, buildBackgroundStars } from './galaxy'
import { BACKGROUND_VERT, POINTS_FRAG, pointsGeometry, useResolutionUniforms } from './materials'
import { paletteUniforms } from './palette'
import { TIER_PARAMS, type Tier } from './tier'

export function Background({ tier }: { tier: Tier }) {
  const count = TIER_PARAMS[tier].background
  const geometry = useMemo(() => pointsGeometry(buildBackgroundStars(GALAXY_SEED + 1, count, 600)), [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BACKGROUND_VERT,
        fragmentShader: POINTS_FRAG,
        uniforms: {
          uSize: { value: 1.3 },
          uPixelRatio: { value: 1 },
          uEraColor: paletteUniforms.uEraColor,
          uTint: { value: 0 },
          uOpacity: { value: 0.9 },
          uFadeNear: { value: 10_000 },
          uFadeFar: { value: 20_000 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useResolutionUniforms(material)
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />
}
```

`src/scene/Galaxy.tsx`:

```tsx
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GALAXY_SEED, buildGalaxy } from './galaxy'
import { GALAXY_VERT, POINTS_FRAG, pointsGeometry, useResolutionUniforms } from './materials'
import { paletteUniforms } from './palette'
import { isAlive, useSceneStore } from './sceneStore'
import { TIER_PARAMS, type Tier } from './tier'

const MAX_DT = 1 / 30

export function Galaxy({ tier }: { tier: Tier }) {
  const count = TIER_PARAMS[tier].galaxy
  const reduced = useSceneStore((s) => s.reducedMotion)
  const geometry = useMemo(() => pointsGeometry(buildGalaxy(GALAXY_SEED, count)), [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GALAXY_VERT,
        fragmentShader: POINTS_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 2.0 },
          uPixelRatio: { value: 1 },
          uScale: { value: 1 },
          uSpin: { value: 0.03 },
          uEraColor: paletteUniforms.uEraColor,
          uTint: { value: 0.22 },
          uOpacity: { value: 1 },
          uFadeNear: { value: 220 },
          uFadeFar: { value: 700 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useResolutionUniforms(material)
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  // Вращение живёт только пока сцена «живая» и не при reduced-motion; каждый такой кадр просит следующий.
  useFrame((state, delta) => {
    if (reduced || !isAlive()) return
    material.uniforms.uTime.value += Math.min(delta, MAX_DT)
    state.invalidate()
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />
}
```

`src/scene/Dust.tsx`:

```tsx
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { GALAXY_SEED, buildDust } from './galaxy'
import { DUST_FRAG, DUST_VERT, pointsGeometry, useResolutionUniforms } from './materials'
import { TIER_PARAMS, type Tier } from './tier'

export function Dust({ tier }: { tier: Tier }) {
  const count = TIER_PARAMS[tier].dust
  const geometry = useMemo(() => pointsGeometry(buildDust(GALAXY_SEED + 2, count)), [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        uniforms: { uSize: { value: 7 }, uPixelRatio: { value: 1 }, uScale: { value: 1 }, uOpacity: { value: 0.18 } },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
      }),
    [],
  )
  useResolutionUniforms(material)
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />
}
```

`src/scene/Core.tsx`:

```tsx
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { getGlowTexture } from './materials'

/** Ядро галактики: два аддитивных спрайта с общей текстурой-градиентом. */
export function Core() {
  const texture = useMemo(() => getGlowTexture(), [])
  const outer = useMemo(() => new THREE.SpriteMaterial({ map: texture, color: '#ffb46b', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.55 }), [texture])
  const inner = useMemo(() => new THREE.SpriteMaterial({ map: texture, color: '#fff1d6', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.85 }), [texture])
  useEffect(() => () => { outer.dispose(); inner.dispose() }, [outer, inner])
  return (
    <>
      <sprite material={outer} scale={[70, 70, 1]} renderOrder={2} />
      <sprite material={inner} scale={[26, 26, 1]} renderOrder={2} />
    </>
  )
}
```

- [ ] **Step 4: страховки и отладка**

`src/scene/ContextLossGuard.tsx`:

```tsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useStore } from '../state/store'

/** Потеря контекста → статус 'lost'; оболочка снимает сцену и предлагает «Перезапустить 3D». */
export function ContextLossGuard() {
  const gl = useThree((s) => s.gl)
  const setScene3d = useStore((s) => s.setScene3d)
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (e: Event) => {
      e.preventDefault()
      setScene3d('lost')
    }
    canvas.addEventListener('webglcontextlost', lost, false)
    return () => canvas.removeEventListener('webglcontextlost', lost, false)
  }, [gl, setScene3d])
  return null
}
```

`src/scene/FrameMeter.tsx`:

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { lowerTier, shouldDowngrade } from './tier'
import { useSceneStore } from './sceneStore'

/** Первые 60 подряд идущих кадров (промежуток < 100 мс): средний кадр > 20 мс → тир ниже. Один раз, только вниз. */
export function FrameMeter() {
  const samples = useRef<number[]>([])
  const last = useRef(0)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    const now = performance.now()
    const gap = now - last.current
    last.current = now
    if (gap <= 0 || gap > 100) return
    samples.current.push(gap)
    if (samples.current.length < 60) return
    done.current = true
    if (shouldDowngrade(samples.current, 60, 20)) {
      const s = useSceneStore.getState()
      if (s.tier !== 'low') s.setTier(lowerTier(s.tier))
    }
  })
  return null
}
```

`src/scene/DebugStats.tsx`:

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/** ?debug — draw calls, треугольники и кадры в секунду в #debug-stats (элемент рисует SceneHost). */
export function DebugStats() {
  const frames = useRef(0)
  const since = useRef(performance.now())
  useFrame((state) => {
    frames.current++
    const now = performance.now()
    if (now - since.current < 500) return
    const fps = Math.round((frames.current * 1000) / (now - since.current))
    frames.current = 0
    since.current = now
    const el = document.getElementById('debug-stats')
    if (el) el.textContent = `calls ${state.gl.info.render.calls} · tris ${state.gl.info.render.triangles} · ${fps} fps · dpr ${state.viewport.dpr}`
  })
  return null
}
```

- [ ] **Step 5: SceneRoot.tsx (вход чанка)**

```tsx
import { Component, type ReactNode, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'
import { Background } from './Background'
import { ContextLossGuard } from './ContextLossGuard'
import { Core } from './Core'
import { DebugStats } from './DebugStats'
import { Dust } from './Dust'
import { FrameMeter } from './FrameMeter'
import { Galaxy } from './Galaxy'
import { setPaletteNow } from './palette'
import { useSceneStore } from './sceneStore'
import { TIER_PARAMS, detectTier, readTierEnv } from './tier'

class GLErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

/** Один раз до первого рендера сцены: тир, reduced-motion, активная эра и стартовая палитра из URL. Идемпотентно (StrictMode зовёт дважды). */
function initSceneState(index: DataIndex): void {
  const eraId = useStore.getState().eraId
  useSceneStore.setState({
    tier: detectTier(readTierEnv()),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    activeEraId: eraId,
  })
  const era = index.eras.find((e) => e.id === eraId) ?? index.eras[0]
  setPaletteNow(era.palette.primary, era.palette.glow)
}

export default function SceneRoot({ index }: { index: DataIndex }) {
  const setScene3d = useStore((s) => s.setScene3d)
  // Ленивый инициализатор бежит до подписки на tier ниже — Canvas сразу монтируется с верным тиром, без перемонтирования.
  useState(() => { initSceneState(index); return true })
  const tier = useSceneStore((s) => s.tier)
  const params = TIER_PARAMS[tier]
  const debug = useMemo(() => new URLSearchParams(location.search).has('debug'), [])

  return (
    <GLErrorBoundary onError={() => setScene3d('failed')}>
      <Canvas
        key={tier}
        frameloop="demand"
        dpr={[1, params.dpr]}
        gl={{ antialias: params.antialias, powerPreference: 'high-performance', alpha: false }}
        camera={{ fov: 50, near: 1, far: 1500, position: [0, 90, 220] }}
        onCreated={(state) => {
          state.gl.setClearColor('#070912')
          setScene3d('ready')
        }}
      >
        <ContextLossGuard />
        <FrameMeter />
        {debug && <DebugStats />}
        <Background tier={tier} />
        <Galaxy tier={tier} />
        <Dust tier={tier} />
        <Core />
      </Canvas>
    </GLErrorBoundary>
  )
}
```

Пока без планет, нити и камеры — они придут в задачах 5–6 и добавятся в этот же список детей.

- [ ] **Step 6: SceneHost.tsx и SceneNotice.tsx (оболочка)**

`src/scene/SceneHost.tsx`:

```tsx
import { type ComponentType, useEffect, useMemo, useState } from 'react'
import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'

type SceneComponent = ComponentType<{ index: DataIndex }>

/** Оболочка: грузит 3D-чанк динамическим import(), когда want3d; ошибку импорта переводит в 'failed'. */
export function SceneHost({ index }: { index: DataIndex }) {
  const want3d = useStore((s) => s.want3d)
  const attempt = useStore((s) => s.sceneAttempt)
  const scene3d = useStore((s) => s.scene3d)
  const setScene3d = useStore((s) => s.setScene3d)
  const [Scene, setScene] = useState<SceneComponent | null>(null)
  const debug = useMemo(() => new URLSearchParams(location.search).has('debug'), [])

  useEffect(() => {
    if (!want3d || Scene) return
    let alive = true
    setScene3d('loading')
    import('./SceneRoot')
      .then((m) => { if (alive) setScene(() => m.default) })
      .catch(() => { if (alive) setScene3d('failed') })
    return () => { alive = false }
  }, [want3d, attempt, Scene, setScene3d])

  // Ушли в «Список» — сцена размонтирована; при возврате статус не должен остаться 'ready'.
  useEffect(() => () => setScene3d('idle'), [setScene3d])

  if (!want3d || !Scene || scene3d === 'lost' || scene3d === 'failed') return null
  return (
    <div className="stage" aria-hidden="true">
      <Scene key={attempt} index={index} />
      {debug && <pre id="debug-stats" className="debug" />}
    </div>
  )
}
```

`src/scene/SceneNotice.tsx`:

```tsx
import { useStore } from '../state/store'

/** Пометки над списком, пока 3D не показано. */
export function SceneNotice() {
  const gate = useStore((s) => s.gate)
  const scene3d = useStore((s) => s.scene3d)
  const want3d = useStore((s) => s.want3d)
  const request3d = useStore((s) => s.request3d)

  if (gate === 'unavailable') return <p className="notice">3D недоступно на этом устройстве.</p>
  if (scene3d === 'failed') return <p className="notice">3D-карта не загрузилась. <button type="button" onClick={request3d}>Повторить загрузку 3D</button></p>
  if (scene3d === 'lost') return <p className="notice">Графический контекст потерян. <button type="button" onClick={request3d}>Перезапустить 3D</button></p>
  if (!want3d) {
    return (
      <div className="poster">
        <p>Галактика, нить эр и планеты — в 3D.</p>
        <button type="button" onClick={request3d}>Открыть 3D-карту</button>
      </div>
    )
  }
  if (scene3d === 'loading') return <p className="notice">Загружаю 3D-карту…</p>
  return null
}
```

- [ ] **Step 7: App.tsx и стили**

`src/App.tsx` — заменить целиком:

```tsx
import { useCallback, useEffect, useState } from 'react'
import type { DataIndex } from './data/indexDataset'
import { loadDataset } from './data/load'
import { bindRouter } from './router/bind'
import { decide3D, readGateEnv } from './scene/gate'
import { SceneHost } from './scene/SceneHost'
import { SceneNotice } from './scene/SceneNotice'
import { useStore } from './state/store'
import { EntityCard } from './ui/EntityCard'
import { EraNav } from './ui/EraNav'
import { ErrorView } from './ui/ErrorView'
import { ListView } from './ui/ListView'
import { Loading } from './ui/Loading'
import { ModeToggle } from './ui/ModeToggle'
import { SpoilerBanner } from './ui/SpoilerBanner'
import { Toast } from './ui/Toast'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; index: DataIndex }

export default function App() {
  const [data, setData] = useState<LoadState>({ status: 'loading' })
  const mode = useStore((s) => s.mode)
  const gate = useStore((s) => s.gate)
  const scene3d = useStore((s) => s.scene3d)
  const setGate = useStore((s) => s.setGate)

  const load = useCallback(() => {
    setData({ status: 'loading' })
    loadDataset()
      .then((index) => setData({ status: 'ready', index }))
      .catch((e: unknown) => setData({ status: 'error', message: e instanceof Error ? e.message : String(e) }))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setGate(decide3D(readGateEnv())) }, [setGate])
  useEffect(() => {
    if (data.status !== 'ready') return
    return bindRouter(data.index)
  }, [data])

  if (data.status === 'loading') return <Loading />
  if (data.status === 'error') return <ErrorView message={data.message} onRetry={load} />
  const { index } = data

  const in3d = mode !== 'list' && gate !== 'unavailable'
  const sceneShown = in3d && scene3d === 'ready'

  return (
    <div className={sceneShown ? 'app scene-on' : 'app'}>
      <SpoilerBanner />
      <header className="top">
        <h1>Основание: карта вселенной</h1>
        {gate !== 'unavailable' && <ModeToggle />}
      </header>
      <EraNav index={index} />
      {in3d && <SceneHost index={index} />}
      {!sceneShown && (
        <main>
          {mode !== 'list' && <SceneNotice />}
          <ListView index={index} />
        </main>
      )}
      <EntityCard index={index} />
      <Toast />
    </div>
  )
}
```

Дописать в `src/styles.css`:

```css
.app { position: relative; min-height: 100dvh; }
.stage { position: fixed; inset: 0; z-index: 0; background: var(--bg); }
.stage canvas { display: block; }
.top, .eras { position: relative; z-index: 2; }
.scene-on .top { background: linear-gradient(180deg, rgba(7, 9, 18, 0.85), rgba(7, 9, 18, 0)); }
.scene-on .eras { background: transparent; }
.spoilers { position: relative; z-index: 3; }
.notice button, .poster button { font: inherit; margin-left: 8px; background: var(--line); border: 0; color: var(--fg); border-radius: 999px; padding: 6px 12px; cursor: pointer; }
.poster { background: radial-gradient(ellipse at 50% 30%, #1a2148, var(--bg) 70%); border: 1px solid var(--line); border-radius: 16px; padding: 40px 16px; text-align: center; margin-bottom: 16px; }
.poster p { margin: 0 0 12px; color: var(--muted); }
.debug { position: fixed; left: 8px; bottom: 8px; z-index: 4; margin: 0; font: 12px/1.4 ui-monospace, monospace; color: #9fe; background: rgba(0, 0, 0, 0.5); padding: 4px 8px; border-radius: 6px; pointer-events: none; }
```

- [ ] **Step 8: проверить в браузере**

```bash
npx tsc --noEmit && npm run data && npm run dev
```

Открыть `http://localhost:5173/foundation/?debug`. Ожидание: сразу список и «Загружаю 3D-карту…», через секунду список исчезает, на весь экран тёмная сцена: спиральная галактика частиц с тёплым ядром и синеватой периферией, тёмные полосы пыли, звёзды фона, шапка и чипы эр поверх. В углу строка `calls N · tris … · fps · dpr` — `calls` ≤ 6. Пошевелить мышью над сценой ничего не делает (ввод появится в задаче 6), галактика статична — это нормально. Консоль: ровно одно предупреждение `Clock: This module has been deprecated…`, ошибок нет. `http://localhost:5173/foundation/?no3d` — список, пометка «3D недоступно на этом устройстве», переключателя режимов нет. Переключение на «Список» показывает список поверх (сцена размонтирована).

```bash
npx vitest run && npx vite build && ls dist/assets | grep -c SceneRoot && npx size-limit
```

Ожидание: тесты зелёные; в `dist/assets` есть `SceneRoot-*.js`; `size-limit`: оболочка ≤ 100 КБ, чанк ≤ 420 КБ (ожидаемо ~260–300 КБ без drei-компонентов).

- [ ] **Step 9: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src && git commit -m "foundation 3d: чанк сцены — Canvas, страховки, галактика, пыль, ядро, постер и статусы"
```

---

### Task 5: Раскладка нити, планеты, нить

**Files:**
- Create: `src/scene/layout.ts`, `src/scene/layout.test.ts`, `src/scene/Planets.tsx`, `src/scene/Thread.tsx`
- Modify: `src/scene/SceneRoot.tsx` (добавить `<Planets index={index} />` и `<Thread index={index} />` после `<Core />`)

**Interfaces:**
- Consumes: `helix`, `eraT` из `../data/derive`; типы `EraOut`, `Event`, `PlanetOut`; `openEntity`; `paletteUniforms`; `tweenTo`; `useSceneStore`.
- Produces: `interface Stop { id: string; t: number; pos: [number, number, number] }`, `eraSpacing(n)`, `eraStops(eras)`, `eventT(ev, eras)`, `nearestStop(stops, t)`, `activeEraFor(stops, t, currentId, hysteresis?)`, `smoothstep(a, b, x)`, `chronicleCamera(t, tilt)`; компоненты `Planets`, `Thread`.

- [ ] **Step 1: тест раскладки**

`src/scene/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { HELIX, helix } from '../data/derive'
import type { EraOut, Event } from '../data/schema'
import { activeEraFor, chronicleCamera, eraSpacing, eraStops, eventT, nearestStop, smoothstep } from './layout'

const era = (id: string, order: number, start: number, end: number): EraOut => ({
  id, kind: 'era', name: { ru: id }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [],
  order, years: { start, end, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: (order - 1) / 4,
})
const eras = [era('e1', 1, 0, 5), era('e2', 2, 6, 100), era('e3', 3, 101, 250), era('e4', 4, 251, 350), era('e5', 5, 351, 420)]
const stops = eraStops(eras)

describe('eraStops', () => {
  it('по order, t от 0 до 1, позиция на спирали', () => {
    expect(stops.map((s) => s.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
    expect(stops[0].t).toBe(0)
    expect(stops[4].t).toBe(1)
    expect(stops[2].pos).toEqual(helix(0.5))
  })
  it('spacing = 1/(N−1)', () => expect(eraSpacing(5)).toBe(0.25))
})

describe('eventT', () => {
  const ev = (year: number | undefined, eraId: string): Event => ({
    id: 'x', kind: 'event', name: { ru: '' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [],
    eras: [eraId], book: { presence: 'same' }, year,
  })
  it('событие в начале эры — чуть раньше остановки, в конце — чуть позже', () => {
    expect(eventT(ev(6, 'e2'), eras)).toBeLessThan(0.25)
    expect(eventT(ev(100, 'e2'), eras)).toBeGreaterThan(0.25)
    expect(Math.abs(eventT(ev(53, 'e2'), eras)! - 0.25)).toBeLessThan(0.01)
  })
  it('без года — ровно на остановке; неизвестная эра — null', () => {
    expect(eventT(ev(undefined, 'e3'), eras)).toBe(0.5)
    expect(eventT(ev(10, 'zzz'), eras)).toBeNull()
  })
})

describe('nearestStop / activeEraFor', () => {
  it('ближайшая остановка', () => {
    expect(nearestStop(stops, 0.3).stop.id).toBe('e2')
    expect(nearestStop(stops, 0.3).dist).toBeCloseTo(0.05)
  })
  it('гистерезис: у границы остаёмся в текущей эре, дальше границы — переключаемся', () => {
    // граница e1/e2 на 0.125; переключаемся, когда другая остановка ближе больше чем на 0.1·0.25 = 0.025
    expect(activeEraFor(stops, 0.135, 'e1')).toBe('e1') // e2 ближе на 0.02 — держим e1
    expect(activeEraFor(stops, 0.16, 'e1')).toBe('e2')  // e2 ближе на 0.07 — переключаемся
    expect(activeEraFor(stops, 0.115, 'e2')).toBe('e2') // e1 ближе на 0.02 — держим e2
    expect(activeEraFor(stops, 0.09, 'e2')).toBe('e1')  // e1 ближе на 0.07 — переключаемся
  })
  it('неизвестный текущий id — просто ближайшая', () => expect(activeEraFor(stops, 0.9, 'nope')).toBe('e5'))
})

describe('smoothstep', () => {
  it('0 до a, 1 после b, 0.5 в середине', () => {
    expect(smoothstep(0, 1, -1)).toBe(0)
    expect(smoothstep(0, 1, 2)).toBe(1)
    expect(smoothstep(0, 1, 0.5)).toBe(0.5)
  })
})

describe('chronicleCamera', () => {
  it('камера снаружи спирали и выше неё', () => {
    const { position } = chronicleCamera(0.5, 0)
    const p = helix(0.5)
    expect(Math.hypot(position[0], position[2])).toBeGreaterThan(Math.hypot(p[0], p[2]))
    expect(position[1]).toBeGreaterThan(p[1])
  })
  it('без наклона смотрит вперёд по нити, с наклоном — к диску', () => {
    const ahead = chronicleCamera(0.5, 0).target
    const down = chronicleCamera(0.5, 1).target
    expect(down[1]).toBeLessThan(ahead[1])
    expect(down[1]).toBeLessThan(HELIX.h0)
  })
})
```

- [ ] **Step 2: убедиться, что падает**

```bash
npx vitest run src/scene/layout.test.ts
```

Ожидание: FAIL, `Cannot find module './layout'`.

- [ ] **Step 3: layout.ts**

```ts
import { eraT, helix } from '../data/derive'
import type { EraOut, Event } from '../data/schema'

export interface Stop {
  id: string
  t: number
  pos: [number, number, number]
}

export function eraSpacing(n: number): number {
  return n > 1 ? 1 / (n - 1) : 1
}

export function eraStops(eras: EraOut[]): Stop[] {
  const sorted = [...eras].sort((a, b) => a.order - b.order)
  return sorted.map((e) => {
    const t = eraT(e.order, sorted.length)
    return { id: e.id, t, pos: helix(t) }
  })
}

/** Параметр события на нити: внутри своей эры смещается по году в пределах ±0.3 шага. */
export function eventT(ev: Event, eras: EraOut[]): number | null {
  const sorted = [...eras].sort((a, b) => a.order - b.order)
  const era = sorted.find((e) => e.id === ev.eras[0])
  if (!era) return null
  const t = eraT(era.order, sorted.length)
  if (ev.year === undefined) return t
  const span = Math.max(era.years.end - era.years.start, 1)
  const frac = (ev.year - era.years.start) / span - 0.5
  return t + frac * eraSpacing(sorted.length) * 0.6
}

export function nearestStop(stops: Stop[], t: number): { stop: Stop; dist: number } {
  let best = stops[0]
  let dist = Math.abs(t - best.t)
  for (const s of stops) {
    const d = Math.abs(t - s.t)
    if (d < dist) { best = s; dist = d }
  }
  return { stop: best, dist }
}

/** Ближайшая остановка с гистерезисом: текущая эра держится, пока другая не станет ближе на hysteresis·spacing. */
export function activeEraFor(stops: Stop[], t: number, currentId: string, hysteresis = 0.1): string {
  const { stop } = nearestStop(stops, t)
  const current = stops.find((s) => s.id === currentId)
  if (!current || current.id === stop.id) return stop.id
  const margin = hysteresis * eraSpacing(stops.length)
  return Math.abs(t - stop.t) + margin < Math.abs(t - current.t) ? stop.id : current.id
}

export function smoothstep(a: number, b: number, x: number): number {
  const k = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return k * k * (3 - 2 * k)
}

const CAM_OUT = 45
const CAM_UP = 18
const LOOK_AHEAD = 0.03

/** Камера «Хроники»: снаружи спирали, выше неё; взгляд — вперёд по нити (tilt 0) или вниз к диску (tilt 1). */
export function chronicleCamera(t: number, tilt: number): { position: [number, number, number]; target: [number, number, number] } {
  const p = helix(t)
  const len = Math.hypot(p[0], p[2]) || 1
  const nx = p[0] / len
  const nz = p[2] / len
  const position: [number, number, number] = [p[0] + nx * CAM_OUT, p[1] + CAM_UP, p[2] + nz * CAM_OUT]
  const ahead = helix(Math.min(t + LOOK_AHEAD, 1))
  const down: [number, number, number] = [p[0] * 0.35, 0, p[2] * 0.35]
  const target: [number, number, number] = [
    ahead[0] + (down[0] - ahead[0]) * tilt,
    ahead[1] + (down[1] - ahead[1]) * tilt,
    ahead[2] + (down[2] - ahead[2]) * tilt,
  ]
  return { position, target }
}
```

```bash
npx vitest run src/scene/layout.test.ts
```

Ожидание: PASS, 10 тестов. Если тест гистерезиса не сходится на границе — проверить арифметику `margin`, не менять тест.

- [ ] **Step 4: Planets.tsx**

```tsx
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import type { DataIndex } from '../data/indexDataset'
import type { PlanetOut } from '../data/schema'
import { openEntity } from '../router/bind'
import { tweenTo } from './anim'
import { paletteUniforms } from './palette'
import { markAlive, useSceneStore } from './sceneStore'

const LOOK_TYPES = ['city', 'ocean', 'desert', 'ice', 'gas', 'barren'] as const
const DIM_OFF = 0.15

const PLANET_VERT = /* glsl */ `
  attribute vec3 aColorA;
  attribute vec3 aColorB;
  attribute float aType;
  attribute float aDim;
  varying vec3 vA;
  varying vec3 vB;
  varying float vType;
  varying float vDim;
  varying vec3 vN;
  varying vec3 vPos;
  varying vec3 vView;
  void main() {
    vec4 world = instanceMatrix * vec4(position, 1.0);
    vec4 mv = modelViewMatrix * world;
    gl_Position = projectionMatrix * mv;
    vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vPos = position;
    vView = -mv.xyz;
    vA = aColorA; vB = aColorB; vType = aType; vDim = aDim;
  }
`

const PLANET_FRAG = /* glsl */ `
  uniform vec3 uEraGlow;
  varying vec3 vA;
  varying vec3 vB;
  varying float vType;
  varying float vDim;
  varying vec3 vN;
  varying vec3 vPos;
  varying vec3 vView;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y);
    float b = mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y);
    return mix(a, b, f.z);
  }
  void main() {
    float n = vnoise(vPos * 3.0) * 0.65 + vnoise(vPos * 7.0) * 0.35;
    float t = floor(vType + 0.5);
    float mask;
    if (t == 0.0) mask = step(0.5, fract(vPos.y * 6.0 + n));
    else if (t == 1.0) mask = smoothstep(0.45, 0.6, n);
    else if (t == 2.0) mask = smoothstep(0.3, 0.7, n);
    else if (t == 3.0) mask = smoothstep(0.55, 0.75, n + abs(vPos.y) * 0.5);
    else if (t == 4.0) mask = step(0.5, fract(vPos.y * 4.0 + n * 0.5));
    else mask = smoothstep(0.35, 0.65, n);
    vec3 base = mix(vA, vB, mask);
    vec3 N = normalize(vN);
    vec3 L = normalize(vec3(0.5, 0.8, 0.6));
    float lambert = dot(N, L) * 0.5 + 0.5;
    float rim = pow(1.0 - max(dot(N, normalize(vView)), 0.0), 3.0);
    vec3 col = base * (0.25 + 0.75 * lambert) + uEraGlow * rim * 0.35;
    col *= mix(${DIM_OFF.toFixed(2)}, 1.0, vDim);
    gl_FragColor = vec4(col, 1.0);
  }
`

function planetsOf(index: DataIndex): PlanetOut[] {
  return index.entities.filter((e): e is PlanetOut => e.kind === 'planet')
}

/** Один InstancedMesh на все планеты + невидимые прокси-сферы для тапа. */
export function Planets({ index }: { index: DataIndex }) {
  const planets = useMemo(() => planetsOf(index), [index])
  const activeEraId = useSceneStore((s) => s.activeEraId)
  const invalidate = useThree((s) => s.invalidate)
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { geometry, dimAttr } = useMemo(() => {
    const n = planets.length
    const geometry = new THREE.SphereGeometry(1, 24, 16)
    const colorA = new Float32Array(n * 3)
    const colorB = new Float32Array(n * 3)
    const type = new Float32Array(n)
    const dim = new Float32Array(n).fill(1)
    planets.forEach((p, i) => {
      const a = new THREE.Color(p.look.colorA)
      const b = new THREE.Color(p.look.colorB)
      colorA.set([a.r, a.g, a.b], i * 3)
      colorB.set([b.r, b.g, b.b], i * 3)
      type[i] = LOOK_TYPES.indexOf(p.look.type)
    })
    geometry.setAttribute('aColorA', new THREE.InstancedBufferAttribute(colorA, 3))
    geometry.setAttribute('aColorB', new THREE.InstancedBufferAttribute(colorB, 3))
    geometry.setAttribute('aType', new THREE.InstancedBufferAttribute(type, 1))
    const dimAttr = new THREE.InstancedBufferAttribute(dim, 1)
    dimAttr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('aDim', dimAttr)
    return { geometry, dimAttr }
  }, [planets])

  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG, uniforms: { uEraGlow: paletteUniforms.uEraGlow } }),
    [],
  )
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  // Матрицы инстансов: позиция из xyz, масштаб из look.radius.
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    planets.forEach((p, i) => {
      m.compose(new THREE.Vector3(...p.xyz), q, new THREE.Vector3().setScalar(p.look.radius))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    invalidate()
  }, [planets, invalidate])

  // Гашение планет вне активной эры: твин значений aDim.
  const dims = useRef<Record<string, number>>({})
  useEffect(() => {
    const targets: Record<string, number> = {}
    planets.forEach((p) => {
      if (dims.current[p.id] === undefined) dims.current[p.id] = 1
      targets[p.id] = p.eras.includes(activeEraId) ? 1 : 0
    })
    const tween = tweenTo(dims.current, {
      ...targets,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        planets.forEach((p, i) => { dimAttr.array[i] = dims.current[p.id] })
        dimAttr.needsUpdate = true
      },
    })
    return () => { tween.kill() }
  }, [activeEraId, planets, dimAttr])

  const onOver = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; markAlive() }
  const onOut = () => { document.body.style.cursor = '' }
  const onClick = (id: string) => (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); openEntity(index, id) }

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geometry, material, planets.length]} frustumCulled={false} />
      {planets.map((p) => (
        <mesh key={p.id} visible={false} position={p.xyz} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick(p.id)}>
          <sphereGeometry args={[Math.max(p.look.radius * 1.8, 5), 8, 8]} />
          <meshBasicMaterial />
        </mesh>
      ))}
    </group>
  )
}
```

`dimAttr.array` — `TypedArray`; в r186 `InstancedBufferAttribute.array` типизирован как `TypedArray`, присваивание числа по индексу допустимо. Если `tsc` ругается, использовать `dimAttr.setX(i, dims.current[p.id])`.

- [ ] **Step 5: Thread.tsx**

```tsx
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { helix } from '../data/derive'
import type { DataIndex } from '../data/indexDataset'
import type { Event } from '../data/schema'
import { getGlowTexture, useResolutionUniforms } from './materials'
import { paletteUniforms } from './palette'
import { eraStops, eventT } from './layout'

const NODE_VERT = /* glsl */ `
  attribute float aScale;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(uSize * aScale * uPixelRatio * (uScale / -mvPosition.z), 2.0, 48.0 * uPixelRatio);
  }
`
const NODE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uEraGlow;
  uniform float uOpacity;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float a = tex.a * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(vec3(1.0), uEraGlow, 0.5) * a, a);
  }
`

function nodesGeometry(positions: number[][], scale: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array(positions.length * 3)
  const scl = new Float32Array(positions.length).fill(scale)
  positions.forEach((p, i) => pos.set(p, i * 3))
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aScale', new THREE.BufferAttribute(scl, 1))
  return g
}

/** Нить Плана: труба по спирали + узлы эр + узлы событий. Цвет — общий Color палитры. */
export function Thread({ index }: { index: DataIndex }) {
  const tube = useMemo(() => {
    const samples: THREE.Vector3[] = []
    for (let i = 0; i <= 200; i++) samples.push(new THREE.Vector3(...helix(i / 200)))
    const path = new THREE.CatmullRomCurve3(samples, false, 'centripetal')
    return new THREE.TubeGeometry(path, 400, 0.6, 8, false)
  }, [])
  const tubeMaterial = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    m.color = paletteUniforms.uEraGlow.value
    return m
  }, [])

  const stops = useMemo(() => eraStops(index.eras), [index])
  const eraNodes = useMemo(() => nodesGeometry(stops.map((s) => s.pos), 1), [stops])
  const eventNodes = useMemo(() => {
    const ts = index.entities
      .filter((e): e is Event => e.kind === 'event')
      .map((e) => eventT(e, index.eras))
      .filter((t): t is number => t !== null)
    return nodesGeometry(ts.map((t) => helix(t)), 0.35)
  }, [index])
  const nodeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NODE_VERT,
        fragmentShader: NODE_FRAG,
        uniforms: { uMap: { value: getGlowTexture() }, uEraGlow: paletteUniforms.uEraGlow, uOpacity: { value: 0.95 }, uSize: { value: 18 }, uPixelRatio: { value: 1 }, uScale: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useResolutionUniforms(nodeMaterial)
  useEffect(() => () => { tube.dispose(); tubeMaterial.dispose(); eraNodes.dispose(); eventNodes.dispose(); nodeMaterial.dispose() }, [tube, tubeMaterial, eraNodes, eventNodes, nodeMaterial])

  return (
    <group>
      <mesh geometry={tube} material={tubeMaterial} renderOrder={3} frustumCulled={false} />
      <points geometry={eraNodes} material={nodeMaterial} renderOrder={4} frustumCulled={false} />
      <points geometry={eventNodes} material={nodeMaterial} renderOrder={4} frustumCulled={false} />
    </group>
  )
}
```

- [ ] **Step 6: подключить в SceneRoot**

В `SceneRoot.tsx` импортировать `Planets` и `Thread` и добавить после `<Core />`:

```tsx
        <Planets index={index} />
        <Thread index={index} />
```

- [ ] **Step 7: проверить в браузере**

```bash
npx tsc --noEmit && npm run dev
```

`http://localhost:5173/foundation/?debug`: над диском светящаяся спираль с пятью крупными узлами и мелкими узлами событий; в диске 5 разноцветных сфер (Трантор крупный у центра, Терминус на краю); планеты не активной эры темнее. `calls` ≤ 10. Клик по планете (камера пока статична: смотрит на сцену с [0, 90, 220] — Трантор виден) открывает карточку; курсор над планетой — pointer. Консоль без ошибок. `npx vitest run` — зелёные.

- [ ] **Step 8: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src && git commit -m "foundation 3d: раскладка нити, инстансированные планеты с шейдером, нить с узлами"
```

---

### Task 6: «Хроника»: ScrollControls и CameraRig

**Files:**
- Create: `src/scene/Chronicle.tsx`
- Modify: `src/scene/SceneRoot.tsx` (добавить `<Chronicle index={index} />` последним ребёнком Canvas)

**Interfaces:**
- Consumes: drei `ScrollControls`, `useScroll`; `chronicleCamera`, `eraStops`, `eraSpacing`, `nearestStop`, `activeEraFor`, `smoothstep`; `tweenTo`; `tweenPalette`; `useSceneStore`, `markAlive`; `useStore`.
- Produces: `useSceneStore.scrollToEra(id, duration)` зарегистрирован, пока смонтирован `CameraRig`.

- [ ] **Step 1: Chronicle.tsx**

```tsx
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ScrollControls, useScroll } from '@react-three/drei'
import { invalidate, useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'
import { tweenTo } from './anim'
import { activeEraFor, chronicleCamera, eraSpacing, eraStops, nearestStop, smoothstep } from './layout'
import { tweenPalette } from './palette'
import { markAlive, useSceneStore } from './sceneStore'

const SETTLE_IDLE_MS = 150
const SETTLE_RANGE = 0.3
const SETTLE_DURATION = 0.4
const NAV_DURATION = 0.8
const TILT_RANGE = 0.35
const STOP_EPS = 0.02

function CameraRig({ index }: { index: DataIndex }) {
  const scroll = useScroll()
  const camera = useThree((s) => s.camera)
  const stops = useMemo(() => eraStops(index.eras), [index])
  const spacing = eraSpacing(stops.length)
  const eraId = useStore((s) => s.eraId)
  const setEra = useStore((s) => s.setEra)
  const active = useRef(useSceneStore.getState().activeEraId || eraId)
  const lastScrollAt = useRef(0)
  const settleTimer = useRef<number | null>(null)
  const settling = useRef<gsap.core.Tween | null>(null)

  const scrollToEra = useCallback(
    (id: string, duration: number) => {
      const stop = stops.find((s) => s.id === id)
      if (!stop) return
      const el = scroll.el
      const max = el.scrollHeight - el.clientHeight
      settling.current?.kill()
      settling.current = tweenTo(el, { scrollTop: stop.t * max, duration, ease: 'power2.inOut', onComplete: () => { settling.current = null } })
    },
    [scroll, stops],
  )

  // Регистрация для EraNav и deep-link; стартовая позиция — эра из URL (через rAF: первое scroll-событие drei игнорирует).
  useEffect(() => {
    useSceneStore.setState({ scrollToEra })
    const raf = requestAnimationFrame(() => scrollToEra(useStore.getState().eraId, NAV_DURATION))
    return () => {
      cancelAnimationFrame(raf)
      useSceneStore.setState({ scrollToEra: undefined })
    }
  }, [scrollToEra])

  // Внешняя смена эры (чип, hashchange) → едем к остановке.
  useEffect(() => {
    if (eraId && eraId !== active.current) scrollToEra(eraId, NAV_DURATION)
  }, [eraId, scrollToEra])

  useFrame(() => {
    const t = scroll.offset
    const { stop, dist } = nearestStop(stops, t)
    const tilt = 1 - smoothstep(0, TILT_RANGE * spacing, dist)
    const { position, target } = chronicleCamera(t, tilt)
    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(target[0], target[1], target[2])

    const next = activeEraFor(stops, t, active.current)
    if (next !== active.current) {
      active.current = next
      useSceneStore.getState().setActiveEra(next)
      const era = index.eras.find((e) => e.id === next)
      if (era) tweenPalette(era.palette.primary, era.palette.glow)
    }

    if (Math.abs(scroll.delta) > 1e-4) {
      markAlive()
      lastScrollAt.current = performance.now()
      if (settleTimer.current) clearTimeout(settleTimer.current)
      // После остановки демпфирования кадров нет — просим один, чтобы проверить дотягивание.
      settleTimer.current = window.setTimeout(() => invalidate(), SETTLE_IDLE_MS + 30)
    } else if (!settling.current && performance.now() - lastScrollAt.current > SETTLE_IDLE_MS && dist > STOP_EPS * spacing && dist < SETTLE_RANGE * spacing) {
      scrollToEra(stop.id, SETTLE_DURATION)
    }

    // URL и стор — только на остановке и не во время полёта к другой эре.
    if (!settling.current && dist <= STOP_EPS * spacing && useStore.getState().eraId !== stop.id) setEra(stop.id)
  })

  useEffect(() => () => { settling.current?.kill(); if (settleTimer.current) clearTimeout(settleTimer.current) }, [])

  return null
}

/** Режим «Хроника»: скролл по эрам. На телефоне при открытой карточке скролл выключен. */
export function Chronicle({ index }: { index: DataIndex }) {
  const selectedId = useStore((s) => s.selectedId)
  const reduced = useSceneStore((s) => s.reducedMotion)
  const phone = typeof matchMedia === 'function' && !matchMedia('(min-width: 900px)').matches
  const enabled = !(phone && selectedId !== null)
  return (
    <ScrollControls pages={index.eras.length} damping={reduced ? 0.01 : 0.2} distance={1} maxSpeed={4} enabled={enabled}>
      <CameraRig index={index} />
    </ScrollControls>
  )
}
```

`tweenTo(el, { scrollTop })` — gsap твинит свойство `scrollTop` DOM-элемента напрямую; каждое изменение рождает scroll-событие, drei демпфирует `offset`.

- [ ] **Step 2: подключить в SceneRoot**

В `SceneRoot.tsx` импортировать `Chronicle` и добавить последним ребёнком `<Canvas>`: `<Chronicle index={index} />`. Режим `map` в этом плане показывает ту же «Хронику».

`EraNav` менять не нужно: чип зовёт `setEra`, в сцене за `eraId` следит эффект `CameraRig`, в списке по-прежнему работает `scrollIntoView` (элемента нет — `?.` делает no-op).

- [ ] **Step 3: проверить в браузере**

```bash
npx tsc --noEmit && npm run dev
```

`http://localhost:5173/foundation/?debug`, ширина ≥ 900 px:
1. Загрузка: камера за секунду подъезжает к первой остановке (золотая палитра), смотрит вниз на Трантор.
2. Колесо мыши: камера идёт вдоль нити, между остановками смотрит вперёд по нити, у остановки наклоняется к диску; палитра плавно меняется (золото → синий → бирюза → красный → фиолет); планеты чужих эр тускнеют; галактика медленно вращается 3 с после последнего скролла и замирает.
3. Остановить скролл между остановками ближе к одной из них — через ~0.2 с камера дотягивается к остановке; URL становится `#/chronicle/<эра>`; чип эры подсвечен.
4. Клик по чипу «Мул» — 0.8 с полёт к четвёртой остановке, URL `#/chronicle/mule`.
5. Ввести в адресную строку `#/chronicle/second-foundation-search` — полёт к последней.
6. Тап по планете активной эры открывает карточку, камера не двигается; «Назад» закрывает.
7. `?debug`: `calls` ≤ 12; в покое fps-счётчик замирает (кадров нет).
8. Ширина 390 px (DevTools): при открытой карточке скролл нити заблокирован, после закрытия работает.
Консоль без ошибок.

```bash
npx vitest run
```

- [ ] **Step 4: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src && git commit -m "foundation 3d: режим «Хроника» — скролл по нити, остановки, палитра, дотягивание"
```

---

### Task 7: Смоук, сборка, документация

**Files:**
- Modify: `playwright.config.ts`, `tests/smoke.spec.ts`, `README.md`, `docs/superpowers/specs/2026-09-29-foundation-map-design.md`

- [ ] **Step 1: Playwright — два проекта**

`playwright.config.ts` — заменить целиком:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/foundation/',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 2: смоук**

В `tests/smoke.spec.ts` первый тест («главная уходит на первую эру и рендерит список») заменить на два и добавить два новых в конец:

```ts
test('главная: без 3D (?no3d) — список и пометка', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/foundation/?no3d')
  await expect(page).toHaveURL(/\?no3d#\/chronicle\/trantor-trial$/)
  await expect(page.locator('section.era')).toHaveCount(6) // 5 эр + «Чем отличается»
  await expect(page.locator('.notice')).toContainText('3D недоступно')
  await expect(page.locator('nav.modes')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('главная в «Списке» рендерит все эры', async ({ page }) => {
  await page.goto('/foundation/#/list/trantor-trial')
  await expect(page.locator('section.era')).toHaveCount(6)
})

test('3D: «Хроника» поднимает canvas, список прячется, ошибок нет', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'сцена проверяется на десктопном проекте')
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/foundation/#/chronicle/mule')
  await expect(page.locator('.stage canvas')).toHaveCount(1, { timeout: 20_000 })
  await expect(page.locator('main')).toHaveCount(0)
  await expect(page.locator('.chip.active')).toHaveText('Мул')
  await page.locator('.chip', { hasText: 'Трантор' }).click()
  await expect(page).toHaveURL(/#\/chronicle\/trantor-trial$/, { timeout: 5_000 })
  expect(errors).toEqual([])
})

test('3D: переключение в «Список» и обратно не ломает сцену', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'сцена проверяется на десктопном проекте')
  await page.goto('/foundation/#/chronicle/trantor-trial')
  await expect(page.locator('.stage canvas')).toHaveCount(1, { timeout: 20_000 })
  await page.locator('nav.modes button', { hasText: 'Список' }).click()
  await expect(page.locator('section.era')).toHaveCount(6)
  await page.locator('nav.modes button', { hasText: 'Хроника' }).click()
  await expect(page.locator('.stage canvas')).toHaveCount(1, { timeout: 20_000 })
})
```

Проверка `toHaveURL(/\?no3d#\/chronicle…/)`: `history.replaceState(null, '', '#/…')` меняет только хэш, `?no3d` сохраняется. Если в headless Chromium WebGL2 недоступен и десктопные 3D-тесты падают на `.stage canvas` — добавить в проект `desktop` `launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }` и записать это в отчёт.

- [ ] **Step 3: полная сборка и e2e**

```bash
npm run e2e
```

Ожидание: vitest (55 + gate 5 + tier 10 + galaxy 9 + layout 10 = 89) зелёные; `build-data` 24 сущности; `vite build`; `size-limit` обе записи зелёные; Playwright: mobile 6 тестов (два 3D пропущены), desktop 8. Порт 4173 свободен после.

```bash
cd /Users/user/projects/lab && bash scripts/build.sh && ls _site/foundation/assets | grep -c SceneRoot
```

- [ ] **Step 4: документация**

`foundation/README.md`: заменить абзац «Сейчас v0: данные, режим «Список», карточки. 3D — следующий план.» на:

```markdown
Сейчас 3D-A: галактика, планеты, нить эр и режим «Хроника» (скролл по нити). Режим «Карта», подписи и маркеры персонажей — план 3D-B.

Флаги в адресной строке: `?no3d` — принудительно без 3D (список), `?debug` — счётчик draw calls и fps в углу.
```

и добавить после раздела «Маршруты»:

```markdown
## Сцена

Чанк `src/scene/SceneRoot.tsx` грузится динамически; оболочка не импортирует three. Чистые модули без three: `gate.ts` (можно ли 3D), `tier.ts` (тир устройства), `galaxy.ts` (точки по сиду), `layout.ts` (остановки эр, камера «Хроники»). Каждый твин — через `tweenTo()` из `anim.ts`, он просит кадр (`frameloop="demand"`).
```

В спеке `docs/superpowers/specs/2026-09-29-foundation-map-design.md`, раздел 6.5 «Правила render-on-demand», пункт 2 заменить на:

```markdown
2. Всё остальное анимируется через GSAP-твины, каждый с `invalidate()` в `onUpdate` (обёртка `tweenTo`). Глобальный `gsap.ticker.add(invalidate)` не используем: тикер GSAP держит свой rAF, пока есть слушатели, и кадры шли бы постоянно. Лерпы uniform — `gsap.to` по месту на общем `THREE.Color`, не ручной lerp в `useFrame`.
```

В той же спеке в 6.3 абзац «**Активная эра и остановки «Хроники».**» дополнить первым предложением: «Единица «виток» ниже — шаг между остановками `spacing = 1/(N−1)`.»

- [ ] **Step 5: commit**

```bash
cd /Users/user/projects/lab && git add foundation && git commit -m "foundation 3d: Playwright-смоук сцены, README и спек"
```

Push и слияние — после «ок» владельца. После деплоя проверить на iPhone по чеклисту спека §7: скролл нити плавный, тап по планете открывает карточку, батарея не греется за 5 минут, поворот экрана не ломает раскладку, в Network нет внешних запросов.

---

## Самопроверка плана

**Покрытие спека.** 6.2 два чанка, `import()` после гейта, `BASE_URL` — задачи 1, 4. 6.3 слои: фон, галактика, пыль/ядро, планеты (шейдер, прокси), нить (труба, узлы эр и событий), палитра — задачи 4–5; камера «Хроники», активная эра с гистерезисом, дотягивание, чипы и URL — задача 6; подписи, маркеры персонажей, подсветка выбранного, «Карта», hover — 3D-B. 6.4 Loading (постер, кнопка, WebGL2 до import) — задача 4; `ScrollControls enabled={false}` при карточке на телефоне — задача 6. 6.5 тиры, понижение по frame time, `dpr`, `antialias`, render-on-demand, клампы, бюджеты `size-limit` — задачи 1, 2, 4. 6.6 нет WebGL2 / reduced-motion / import() / contextlost — задачи 1, 4. 7 тесты — задачи 1–3, 5, 7. 8 сборка — задачи 1, 7.

**Типы между задачами.** `Tier`/`TIER_PARAMS` (задача 2) используются в `Background`/`Galaxy`/`Dust`/`SceneRoot` (задача 4) с теми же полями `dpr, galaxy, dust, background, antialias`; `PointCloud` (задача 3) → `pointsGeometry` (задача 4); `paletteUniforms.uEraColor/uEraGlow` (задача 4) → шейдеры галактики, фона, планет, нити (задачи 4–5); `Stop`/`eraStops`/`nearestStop`/`activeEraFor`/`chronicleCamera` (задача 5) → `CameraRig` (задача 6); `useSceneStore.scrollToEra` регистрирует `CameraRig`, читает никто в этом плане (EraNav идёт через `setEra`) — поле остаётся для 3D-B; `useStore.gate/scene3d/want3d/sceneAttempt/request3d` (задача 1) → `SceneHost`, `SceneNotice`, `App` (задача 4), `ContextLossGuard` (задача 4).
