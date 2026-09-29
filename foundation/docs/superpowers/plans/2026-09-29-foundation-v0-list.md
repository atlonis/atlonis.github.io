# Карта «Основания» v0 (данные, список, роутер) — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Опубликовать на `https://atlonis.github.io/foundation/` работающую v0 без 3D: схема данных, сборка `content/ → foundation.json`, hash-роутер, режим «Список», карточка сущности, баннер спойлеров, с тестами и бюджетом бандла.

**Architecture:** Один Vite-проект в `lab/foundation/`. Контент лежит в YAML по файлу на сущность, `scripts/build-data.ts` валидирует его zod-схемой и перекрёстными проверками, считает производные и пишет один JSON. Оболочка на React 19 + zustand читает JSON, держит режим/эру/выбранную сущность в сторе, синхронизирует их с URL-хэшем и рендерит DOM-список и карточку. 3D-режимы «Хроника» и «Карта» принимаются роутером, но в v0 показывают список с пометкой. Следующий план добавит 3D-чанк поверх этой оболочки, не трогая данные и роутер.

**Tech Stack:** TypeScript, Vite 8, React 19.2, zustand, zod, yaml, tsx, vitest, @playwright/test, size-limit. Без three.js в этом плане.

**Spec:** `foundation/docs/superpowers/specs/2026-09-29-foundation-map-design.md` — разделы 5 (данные), 6.2 (структура, маршруты), 6.4 (UI, кроме hover-лейбла), 6.6 (ошибки данных и маршрутов), 7, 8.

## Global Constraints

- Все команды выполняются из `/Users/user/projects/lab/foundation/` (далее «корень проекта»). Репозиторий git — `/Users/user/projects/lab` (монорепо `lab`); коммиты делаем из корня репо, push только по просьбе владельца.
- Версии пиним точно (`npm i -E`), `package-lock.json` коммитим. Не ставить `three`, `@react-three/*`, `gsap` — это следующий план.
- `vite.config.ts`: `base: '/foundation/'`. Все пути к `public/` только через `import.meta.env.BASE_URL`.
- Оболочка ≤ 100 КБ gzip (проверяет `size-limit`).
- Язык интерфейса и контента — русский, оригинальные имена в скобках. Тексты в коде и YAML — по-русски.
- `id` сущностей — kebab-case, уникальны среди всех видов. `book` обязателен у всех видов, кроме `era`.
- Единая шкала времени — годы Э.О., `FE_ZERO_IE = 12067`, `SEASONS = 3`.
- Маршруты: `#/<mode>/<eraId>[/<kind>/<id>]`, `mode ∈ {chronicle, map, list}`; открытие карточки — `pushState`, всё остальное — `replaceState`.
- `public/data/foundation.json` — артефакт сборки, в git не попадает.
- Чистые модули (`derive`, `schema`, `validate`, `hash`, `indexDataset`, `build-dataset`) — через TDD. UI проверяется глазами в браузере и Playwright-смоуком, без юнит-тестов компонентов.
- Картинок нет. Стиллы из сериала не использовать.

---

## Структура файлов

```
foundation/
  package.json, package-lock.json, tsconfig.json, vite.config.ts, vitest.config.ts,
  playwright.config.ts, .size-limit.json, .gitignore, index.html
  content/
    era/*.yaml  planet/*.yaml  character/*.yaml  faction/*.yaml
    event/*.yaml  artifact/*.yaml  difference/*.yaml
  scripts/
    build-dataset.ts        # buildDataset(contentDir) — чтение YAML, схема, проверки, производные
    build-dataset.test.ts   # интеграционный тест на реальном content/
    build-data.ts           # CLI: пишет public/data/foundation.json или падает
  src/
    main.tsx                # ReactDOM.createRoot
    App.tsx                 # загрузка данных, состояния loading/error/ready, раскладка
    styles.css              # токены, раскладка, карточка (bottom sheet / правая панель)
    data/
      derive.ts (+ .test.ts)        # константы шкалы, bookOf, helix, eraT, planetXYZ
      schema.ts (+ .test.ts)        # zod-схемы и типы сущностей и датасета
      validate.ts (+ .test.ts)      # перекрёстные проверки validateDataset
      indexDataset.ts (+ .test.ts)  # DataIndex: byId, eras, byEra
      labels.ts                     # русские подписи частей книг, сезонов, видов
      load.ts                       # fetch + zod parse → DataIndex
    router/
      hash.ts (+ .test.ts)          # parseHash, formatHash, resolveHash — чистые
      bind.ts                       # связь стора с location.hash
    state/
      store.ts                      # zustand: mode, eraId, selectedId, notice
    ui/
      ListView.tsx  EraNav.tsx  ModeToggle.tsx  EntityCard.tsx
      SpoilerBanner.tsx  Toast.tsx  Loading.tsx  ErrorView.tsx
  tests/
    smoke.spec.ts           # Playwright
  public/
    data/foundation.json    # генерируется
  README.md                 # обновляется в задаче 9
```

---

### Task 1: Каркас проекта

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `.size-limit.json`, `.gitignore`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`

**Interfaces:**
- Produces: npm-скрипты `dev`, `test`, `data`, `build`, `preview`; `import.meta.env.BASE_URL === '/foundation/'`.

- [ ] **Step 1: package.json и зависимости**

Создать `package.json`:

```json
{
  "name": "foundation-map",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "data": "tsx scripts/build-data.ts",
    "test": "vitest run",
    "build": "vitest run && tsx scripts/build-data.ts && vite build && size-limit",
    "preview": "vite preview",
    "e2e": "npm run build && playwright test"
  }
}
```

Установить точные версии:

```bash
npm i -E react@^19.2.0 react-dom@^19.2.0 zustand zod yaml
npm i -D -E vite@^8 @vitejs/plugin-react typescript @types/react @types/react-dom vitest tsx size-limit @size-limit/file @playwright/test
```

Если `vitest` ругается на peer-зависимость `vite@8`, поставить `npm i -D -E vitest@next`. После установки убедиться, что в `package.json` версии без `^`.

- [ ] **Step 2: конфиги**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "scripts", "tests", "vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

Поставить типы Node: `npm i -D -E @types/node`.

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/foundation/',
  plugins: [react()],
  build: { target: 'es2022' },
})
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
})
```

`.size-limit.json`:

```json
[
  { "name": "оболочка", "path": "dist/assets/index-*.js", "limit": "100 kB", "gzip": true }
]
```

`.gitignore`:

```
node_modules/
dist/
public/data/foundation.json
test-results/
playwright-report/
```

- [ ] **Step 3: index.html и заглушка приложения**

`index.html`:

```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Основание: карта вселенной</title>
  <meta name="description" content="Интерактивная карта вселенной «Основания»: сериал Apple TV+ и трилогия Азимова, эры, планеты, персонажи и чем книга отличается от сериала.">
  <meta name="theme-color" content="#070912">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx` (временно):

```tsx
export default function App() {
  return <p>Основание: карта вселенной. Скоро.</p>
}
```

`src/styles.css` (токены, остальное добавится в задаче 7):

```css
:root {
  color-scheme: dark;
  --bg: #070912;
  --bg-2: #0f1322;
  --fg: #e8e9f0;
  --muted: #8a90a6;
  --line: #232840;
  --era: #7aa2ff;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--fg); }
body { font: 16px/1.5 Inter, -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; }
```

- [ ] **Step 4: проверить сборку**

```bash
npx tsc --noEmit && npx vite build
```

Ожидание: без ошибок, в `dist/assets/` один `index-*.js`. `npx vite preview` открывает `http://localhost:4173/foundation/` с текстом заглушки.

- [ ] **Step 5: commit**

```bash
cd /Users/user/projects/lab && git add foundation && git commit -m "foundation: каркас Vite + React 19, конфиги, size-limit"
```

---

### Task 2: derive.ts — шкала времени, части книг, спираль, координаты

**Files:**
- Create: `src/data/derive.ts`
- Test: `src/data/derive.test.ts`

**Interfaces:**
- Produces:
  - `FE_ZERO_IE = 12067`, `SEASONS = 3`, `BOOK_PARTS` (readonly tuple из 9 строк), `type BookPart`
  - `bookOf(part: BookPart): 1 | 2 | 3`
  - `feToIe(fe: number): number`
  - `HELIX = { turns, r0, r1, h0, h1 }`, `helix(t: number): [number, number, number]`
  - `eraT(order: number, count: number): number`
  - `GALAXY = { arms, radius, spin }`, `interface GalaxyCoords { arm; r; offset; y? }`, `planetXYZ(g: GalaxyCoords): [number, number, number]`

- [ ] **Step 1: тест**

`src/data/derive.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { HELIX, bookOf, eraT, feToIe, helix, planetXYZ } from './derive'

describe('bookOf', () => {
  it('раскладывает части трилогии по книгам', () => {
    expect(bookOf('psychohistorians')).toBe(1)
    expect(bookOf('merchant-princes')).toBe(1)
    expect(bookOf('general')).toBe(2)
    expect(bookOf('mule')).toBe(2)
    expect(bookOf('search-by-mule')).toBe(3)
    expect(bookOf('search-by-foundation')).toBe(3)
  })
})

describe('feToIe', () => {
  it('35 Э.О. = 12 102 И.Э.', () => expect(feToIe(35)).toBe(12102))
})

describe('helix', () => {
  it('начинается на r0/h0 и заканчивается на r1/h1', () => {
    const [x0, y0, z0] = helix(0)
    expect(x0).toBeCloseTo(HELIX.r0)
    expect(y0).toBe(HELIX.h0)
    expect(z0).toBeCloseTo(0)
    const [x1, y1, z1] = helix(1)
    expect(Math.hypot(x1, z1)).toBeCloseTo(HELIX.r1)
    expect(y1).toBe(HELIX.h1)
  })
  it('высота растёт монотонно', () => {
    let prev = -Infinity
    for (let i = 0; i <= 10; i++) {
      const y = helix(i / 10)[1]
      expect(y).toBeGreaterThan(prev)
      prev = y
    }
  })
})

describe('eraT', () => {
  it('первая эра 0, последняя 1, середина 0.5', () => {
    expect(eraT(1, 5)).toBe(0)
    expect(eraT(5, 5)).toBe(1)
    expect(eraT(3, 5)).toBe(0.5)
  })
  it('единственная эра стоит на 0', () => expect(eraT(1, 1)).toBe(0))
})

describe('planetXYZ', () => {
  it('r = 0 — центр галактики', () => {
    expect(planetXYZ({ arm: 0, r: 0, offset: 0 })).toEqual([0, 0, 0])
  })
  it('r = 1 лежит на радиусе галактики', () => {
    const [x, , z] = planetXYZ({ arm: 1, r: 1, offset: 0.1 })
    expect(Math.hypot(x, z)).toBeCloseTo(100)
  })
  it('y берётся из координат', () => {
    expect(planetXYZ({ arm: 2, r: 0.5, offset: 0, y: 3 })[1]).toBe(3)
  })
  it('детерминирована', () => {
    const a = planetXYZ({ arm: 2, r: 0.5, offset: -0.2 })
    const b = planetXYZ({ arm: 2, r: 0.5, offset: -0.2 })
    expect(a).toEqual(b)
  })
})
```

- [ ] **Step 2: убедиться, что падает**

```bash
npx vitest run src/data/derive.test.ts
```

Ожидание: FAIL, `Cannot find module './derive'`.

- [ ] **Step 3: реализация**

`src/data/derive.ts`:

```ts
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
```

- [ ] **Step 4: тесты зелёные**

```bash
npx vitest run src/data/derive.test.ts
```

Ожидание: PASS, 9 тестов.

- [ ] **Step 5: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src/data && git commit -m "foundation: derive — шкала Э.О., части книг, спираль, координаты планет"
```

---

### Task 3: schema.ts — zod-схемы сущностей и датасета

**Files:**
- Create: `src/data/schema.ts`
- Test: `src/data/schema.test.ts`

**Interfaces:**
- Consumes: `BOOK_PARTS`, `SEASONS` из `./derive`.
- Produces:
  - `KINDS`, `type Kind`
  - `EntitySchema` (discriminatedUnion по `kind`), `DatasetSchema`
  - типы `Era, Planet, Character, Faction, Event, Artifact, Difference, Entity, NonEra`
  - типы вывода сборки: `EraOut = Era & { t: number }`, `PlanetOut = Planet & { xyz: [number, number, number] }`, `EntityOut`, `NonEraOut`, `Dataset = { version: 1; entities: EntityOut[] }`

- [ ] **Step 1: тест**

`src/data/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DatasetSchema, EntitySchema } from './schema'

const character = {
  id: 'salvor-hardin',
  kind: 'character',
  name: { ru: 'Салвор Хардин' },
  originalName: 'Salvor Hardin',
  summary: { ru: 'Смотритель Терминуса.' },
  eras: ['terminus-crisis'],
  appearsIn: { show: [{ season: 1 }], book: ['encyclopedists', 'mayors'] },
  book: { presence: 'different', diff: { ru: 'В книге — мужчина, мэр Терминуса.' } },
}

const era = {
  id: 'terminus-crisis',
  kind: 'era',
  name: { ru: 'Терминус: Хардин и Анакреон' },
  summary: { ru: 'Первый кризис Селдона.' },
  order: 2,
  years: { start: 6, end: 100, bookStart: 50, bookEnd: 80, label: { ru: '~35 Э.О.' } },
  palette: { primary: '#4a7cff', glow: '#9cc0ff' },
}

describe('EntitySchema', () => {
  it('персонаж проходит, related и sources по умолчанию пустые', () => {
    const r = EntitySchema.parse(character)
    expect(r.kind).toBe('character')
    expect(r.related).toEqual([])
    expect(r.sources).toEqual([])
  })
  it('персонаж без book не проходит', () => {
    const { book: _book, ...rest } = character
    expect(EntitySchema.safeParse(rest).success).toBe(false)
  })
  it('эра проходит без book и eras', () => {
    expect(EntitySchema.safeParse(era).success).toBe(true)
  })
  it('сезон 5 не проходит (SEASONS + 1 = 4)', () => {
    const bad = { ...character, appearsIn: { show: [{ season: 5 }] } }
    expect(EntitySchema.safeParse(bad).success).toBe(false)
  })
  it('id не в kebab-case не проходит', () => {
    expect(EntitySchema.safeParse({ ...character, id: 'Salvor_Hardin' }).success).toBe(false)
  })
  it('неизвестный kind не проходит', () => {
    expect(EntitySchema.safeParse({ ...character, kind: 'hero' }).success).toBe(false)
  })
  it('неизвестная часть книги не проходит', () => {
    const bad = { ...character, appearsIn: { book: ['prelude'] } }
    expect(EntitySchema.safeParse(bad).success).toBe(false)
  })
  it('цвет палитры должен быть #rrggbb', () => {
    const bad = { ...era, palette: { primary: 'gold', glow: '#9cc0ff' } }
    expect(EntitySchema.safeParse(bad).success).toBe(false)
  })
})

describe('DatasetSchema', () => {
  it('принимает эру с t и планету с xyz', () => {
    const ds = {
      version: 1,
      entities: [
        { ...era, t: 0.25 },
        {
          id: 'terminus', kind: 'planet', name: { ru: 'Терминус' }, summary: { ru: 'Край галактики.' },
          eras: ['terminus-crisis'], book: { presence: 'same' },
          galaxy: { arm: 1, r: 0.95, offset: 0 },
          look: { type: 'barren', colorA: '#7fa3c7', colorB: '#2e4a6b', radius: 1.5 },
          xyz: [1, 0, 2],
        },
      ],
    }
    expect(DatasetSchema.safeParse(ds).success).toBe(true)
  })
  it('эру без t не принимает', () => {
    expect(DatasetSchema.safeParse({ version: 1, entities: [era] }).success).toBe(false)
  })
})
```

- [ ] **Step 2: убедиться, что падает**

```bash
npx vitest run src/data/schema.test.ts
```

Ожидание: FAIL, `Cannot find module './schema'`.

- [ ] **Step 3: реализация**

`src/data/schema.ts`:

```ts
import { z } from 'zod'
import { BOOK_PARTS, SEASONS } from './derive'

export const KINDS = ['era', 'planet', 'character', 'faction', 'event', 'artifact', 'difference'] as const
export type Kind = (typeof KINDS)[number]

const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id: только kebab-case')
const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'цвет: #rrggbb')
const Url = z.string().regex(/^https?:\/\//, 'источник: URL')
const Vec3 = z.tuple([z.number(), z.number(), z.number()])

export const TextSchema = z.object({ ru: z.string().min(1), en: z.string().min(1).optional() })
export type Text = z.infer<typeof TextSchema>

const View = z.object({ position: Vec3, target: Vec3 })

const AppearsIn = z.object({
  show: z
    .array(z.object({ season: z.number().int().min(1).max(SEASONS + 1), episodes: z.array(z.number().int().min(1)).optional() }))
    .optional(),
  book: z.array(z.enum(BOOK_PARTS)).optional(),
})

const TimelineEntry = z.object({
  era: Id,
  note: TextSchema,
  status: z.enum(['alive', 'dead', 'digital', 'cryo', 'destroyed', 'absent']).optional(),
  planet: Id.optional(),
  faction: Id.optional(),
})

export const BookBlock = z.object({
  presence: z.enum(['same', 'different', 'show-only', 'book-only']),
  diff: TextSchema.optional(),
  name: TextSchema.optional(),
  originalName: z.string().optional(),
  counterpart: Id.optional(),
})

const Related = z.object({ id: Id, role: TextSchema })

const common = {
  id: Id,
  name: TextSchema,
  originalName: z.string().optional(),
  summary: TextSchema,
  body: TextSchema.optional(),
  appearsIn: AppearsIn.default({}),
  timeline: z.array(TimelineEntry).optional(),
  related: z.array(Related).default([]),
  sources: z.array(Url).default([]),
}
const withEras = { ...common, eras: z.array(Id).min(1), book: BookBlock }

export const EraSchema = z.object({
  ...common,
  kind: z.literal('era'),
  order: z.number().int().min(1),
  years: z.object({
    start: z.number().int(),
    end: z.number().int(),
    bookStart: z.number().int().optional(),
    bookEnd: z.number().int().optional(),
    label: TextSchema,
  }),
  palette: z.object({ primary: Hex, glow: Hex }),
  view: View.optional(),
})

export const PlanetSchema = z.object({
  ...withEras,
  kind: z.literal('planet'),
  galaxy: z.object({ arm: z.number().int().min(0), r: z.number().min(0).max(1), offset: z.number(), y: z.number().optional() }),
  look: z.object({
    type: z.enum(['city', 'ocean', 'desert', 'ice', 'gas', 'barren']),
    colorA: Hex,
    colorB: Hex,
    radius: z.number().positive(),
  }),
  view: View.optional(),
})

export const CharacterSchema = z.object({
  ...withEras,
  kind: z.literal('character'),
  faction: Id.optional(),
  homeworld: Id.optional(),
  actor: z.string().optional(),
})

export const FactionSchema = z.object({ ...withEras, kind: z.literal('faction'), color: Hex })

export const EventSchema = z.object({
  ...withEras,
  kind: z.literal('event'),
  year: z.number().int().optional(),
  yearBook: z.number().int().optional(),
  yearLabel: TextSchema.optional(),
  planet: Id.optional(),
  isSeldonCrisis: z.boolean().optional(),
})

export const ArtifactSchema = z.object({ ...withEras, kind: z.literal('artifact'), planet: Id.optional() })
export const DifferenceSchema = z.object({ ...withEras, kind: z.literal('difference') })

export const EntitySchema = z.discriminatedUnion('kind', [
  EraSchema, PlanetSchema, CharacterSchema, FactionSchema, EventSchema, ArtifactSchema, DifferenceSchema,
])

export type Era = z.infer<typeof EraSchema>
export type Planet = z.infer<typeof PlanetSchema>
export type Character = z.infer<typeof CharacterSchema>
export type Faction = z.infer<typeof FactionSchema>
export type Event = z.infer<typeof EventSchema>
export type Artifact = z.infer<typeof ArtifactSchema>
export type Difference = z.infer<typeof DifferenceSchema>
export type Entity = z.infer<typeof EntitySchema>
export type NonEra = Exclude<Entity, Era>

// Что добавляет build-data
const EraOutSchema = EraSchema.extend({ t: z.number().min(0).max(1) })
const PlanetOutSchema = PlanetSchema.extend({ xyz: Vec3 })
const EntityOutSchema = z.discriminatedUnion('kind', [
  EraOutSchema, PlanetOutSchema, CharacterSchema, FactionSchema, EventSchema, ArtifactSchema, DifferenceSchema,
])
export const DatasetSchema = z.object({ version: z.literal(1), entities: z.array(EntityOutSchema) })

export type EraOut = z.infer<typeof EraOutSchema>
export type PlanetOut = z.infer<typeof PlanetOutSchema>
export type EntityOut = z.infer<typeof EntityOutSchema>
export type NonEraOut = Exclude<EntityOut, EraOut>
export type Dataset = z.infer<typeof DatasetSchema>
```

- [ ] **Step 4: тесты зелёные**

```bash
npx vitest run src/data/schema.test.ts
```

Ожидание: PASS, 10 тестов.

- [ ] **Step 5: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src/data && git commit -m "foundation: zod-схема сущностей и датасета"
```

---

### Task 4: validate.ts — перекрёстные проверки

**Files:**
- Create: `src/data/validate.ts`
- Test: `src/data/validate.test.ts`

**Interfaces:**
- Consumes: типы `Entity, Era, Kind` из `./schema`.
- Produces: `validateDataset(entities: Entity[]): string[]` — список ошибок по-русски, пустой = всё хорошо.

- [ ] **Step 1: тест**

`src/data/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Entity } from './schema'
import { validateDataset } from './validate'

const era = (id: string, order: number, start: number, end: number): Entity => ({
  id, kind: 'era', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  order, years: { start, end, label: { ru: `${start}–${end}` } }, palette: { primary: '#000000', glow: '#ffffff' },
})
const planet = (id: string, eras: string[]): Entity => ({
  id, kind: 'planet', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  eras, book: { presence: 'same' }, galaxy: { arm: 0, r: 0.5, offset: 0 },
  look: { type: 'city', colorA: '#000000', colorB: '#ffffff', radius: 1 },
})
const faction = (id: string, eras: string[]): Entity => ({
  id, kind: 'faction', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  eras, book: { presence: 'same' }, color: '#123456',
})
const character = (id: string, eras: string[], extra: Partial<Extract<Entity, { kind: 'character' }>> = {}): Entity => ({
  id, kind: 'character', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  eras, book: { presence: 'same' }, ...extra,
})
const event = (id: string, eras: string[], extra: Partial<Extract<Entity, { kind: 'event' }>> = {}): Entity => ({
  id, kind: 'event', name: { ru: id }, summary: { ru: id }, appearsIn: {}, related: [], sources: [],
  eras, book: { presence: 'same' }, ...extra,
})

const base = [era('e1', 1, 0, 10), era('e2', 2, 11, 100), planet('trantor', ['e1', 'e2']), faction('empire', ['e1'])]

describe('validateDataset', () => {
  it('корректный набор — без ошибок', () => {
    expect(validateDataset([...base, character('hari', ['e1'], { faction: 'empire', homeworld: 'trantor' }), event('trial', ['e1'], { year: 0 })])).toEqual([])
  })
  it('дубликат id', () => {
    expect(validateDataset([...base, planet('trantor', ['e1'])])).toContainEqual(expect.stringContaining('дубликат'))
  })
  it('ссылка на несуществующую эру', () => {
    expect(validateDataset([...base, character('x', ['nope'])])).toContainEqual(expect.stringContaining('«nope» не существует'))
  })
  it('эры пересекаются по годам', () => {
    expect(validateDataset([era('e1', 1, 0, 50), era('e2', 2, 40, 100)])).toContainEqual(expect.stringContaining('пересекаются'))
  })
  it('order должен идти 1..N без дыр', () => {
    expect(validateDataset([era('e1', 1, 0, 10), era('e3', 3, 11, 20)])).toContainEqual(expect.stringContaining('order должен быть 2'))
  })
  it('timeline.era должна входить в eras', () => {
    const c = character('gaal', ['e1'], { timeline: [{ era: 'e2', note: { ru: 'криосон' } }] })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('timeline.era'))
  })
  it('homeworld должен быть планетой', () => {
    const c = character('x', ['e1'], { homeworld: 'empire' })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('нужен planet'))
  })
  it('событию нужен year или yearLabel', () => {
    expect(validateDataset([...base, event('x', ['e1'])])).toContainEqual(expect.stringContaining('year или yearLabel'))
  })
  it('year события должен попадать в одну из его эр', () => {
    expect(validateDataset([...base, event('x', ['e1'], { year: 50 })])).toContainEqual(expect.stringContaining('не попадает'))
  })
  it('book.counterpart должен существовать и быть того же вида', () => {
    const c = character('mule', ['e1'], { book: { presence: 'different', counterpart: 'trantor' } })
    expect(validateDataset([...base, c])).toContainEqual(expect.stringContaining('book.counterpart'))
  })
})
```

- [ ] **Step 2: убедиться, что падает**

```bash
npx vitest run src/data/validate.test.ts
```

Ожидание: FAIL, `Cannot find module './validate'`.

- [ ] **Step 3: реализация**

`src/data/validate.ts`:

```ts
import type { Entity, Era, Kind } from './schema'

/** Перекрёстные проверки поверх zod. Возвращает список ошибок; пустой — всё хорошо. */
export function validateDataset(entities: Entity[]): string[] {
  const errors: string[] = []
  const byId = new Map<string, Entity>()
  for (const e of entities) {
    if (byId.has(e.id)) errors.push(`${e.id}: дубликат id`)
    byId.set(e.id, e)
  }

  const expectKind = (owner: string, field: string, id: string | undefined, kind: Kind) => {
    if (id === undefined) return
    const target = byId.get(id)
    if (!target) errors.push(`${owner}: ${field} → «${id}» не существует`)
    else if (target.kind !== kind) errors.push(`${owner}: ${field} → «${id}» это ${target.kind}, нужен ${kind}`)
  }

  const eras = entities.filter((e): e is Era => e.kind === 'era').sort((a, b) => a.order - b.order)
  eras.forEach((era, i) => {
    if (era.order !== i + 1) errors.push(`${era.id}: order должен быть ${i + 1}, а не ${era.order}`)
    if (era.years.start > era.years.end) errors.push(`${era.id}: years.start больше years.end`)
    const prev = eras[i - 1]
    if (prev && era.years.start <= prev.years.end) errors.push(`${era.id}: годы пересекаются с ${prev.id}`)
  })

  for (const e of entities) {
    for (const r of e.related) if (!byId.has(r.id)) errors.push(`${e.id}: related → «${r.id}» не существует`)
    if (e.kind === 'era') continue

    for (const id of e.eras) expectKind(e.id, 'eras', id, 'era')
    expectKind(e.id, 'book.counterpart', e.book.counterpart, e.kind)
    for (const t of e.timeline ?? []) {
      if (!e.eras.includes(t.era)) errors.push(`${e.id}: timeline.era «${t.era}» нет в eras`)
      expectKind(e.id, 'timeline.planet', t.planet, 'planet')
      expectKind(e.id, 'timeline.faction', t.faction, 'faction')
    }
    if (e.kind === 'character') {
      expectKind(e.id, 'faction', e.faction, 'faction')
      expectKind(e.id, 'homeworld', e.homeworld, 'planet')
    }
    if (e.kind === 'artifact') expectKind(e.id, 'planet', e.planet, 'planet')
    if (e.kind === 'event') {
      expectKind(e.id, 'planet', e.planet, 'planet')
      if (e.year === undefined && e.yearLabel === undefined) errors.push(`${e.id}: у события нужен year или yearLabel`)
      if (e.year !== undefined) {
        const year = e.year
        const inside = e.eras.some((id) => {
          const era = byId.get(id)
          return era?.kind === 'era' && year >= era.years.start && year <= era.years.end
        })
        if (!inside) errors.push(`${e.id}: year ${year} не попадает ни в одну из его эр`)
      }
    }
  }
  return errors
}
```

- [ ] **Step 4: тесты зелёные**

```bash
npx vitest run src/data/validate.test.ts
```

Ожидание: PASS, 10 тестов.

- [ ] **Step 5: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src/data && git commit -m "foundation: перекрёстные проверки датасета"
```

---

### Task 5: Сборка данных и контент-заглушки

**Files:**
- Create: `scripts/build-dataset.ts`, `scripts/build-data.ts`, 20 YAML-файлов в `content/`
- Test: `scripts/build-dataset.test.ts`

**Interfaces:**
- Consumes: `EntitySchema`, типы из `src/data/schema`; `validateDataset`; `eraT`, `planetXYZ`.
- Produces: `buildDataset(contentDir: string): { dataset?: Dataset; errors: string[] }`; CLI `npm run data` пишет `public/data/foundation.json`. Id эр, на которые опираются задачи 6–9: `trantor-trial`, `terminus-crisis`, `traders-general`, `mule`, `second-foundation-search`; персонаж `salvor-hardin`.

- [ ] **Step 1: контент-заглушки**

Тексты короткие, проверяются в контент-фазе; структура — рабочая. Создать файлы:

`content/era/trantor-trial.yaml`:

```yaml
id: trantor-trial
kind: era
name: { ru: "Трантор: суд и ссылка", en: "Trantor: the trial" }
summary: { ru: "Селдон предсказывает падение Империи, суд отправляет его и Основание на Терминус." }
order: 1
years: { start: 0, end: 5, bookStart: 0, bookEnd: 2, label: { ru: "0 Э.О. · 12 067 И.Э." } }
palette: { primary: "#d4a53a", glow: "#ffe08a" }
appearsIn: { show: [{ season: 1 }], book: [psychohistorians] }
sources: ["https://ru.wikipedia.org/wiki/Основание_(телесериал)"]
```

`content/era/terminus-crisis.yaml`:

```yaml
id: terminus-crisis
kind: era
name: { ru: "Терминус: Хардин и Анакреон" }
summary: { ru: "Первое поколение на Терминусе и первый кризис Селдона." }
order: 2
years: { start: 6, end: 100, bookStart: 50, bookEnd: 80, label: { ru: "~35 Э.О. в сериале · 50–80 Э.О. в книге" } }
palette: { primary: "#4a7cff", glow: "#9cc0ff" }
appearsIn: { show: [{ season: 1 }], book: [encyclopedists, mayors] }
```

`content/era/traders-general.yaml`:

```yaml
id: traders-general
kind: era
name: { ru: "Торговцы, генерал, второй кризис" }
summary: { ru: "Основание богатеет торговлей, Империя посылает генерала, рождается Второе Основание сериала." }
order: 3
years: { start: 101, end: 250, bookStart: 135, bookEnd: 195, label: { ru: "~173 Э.О. в сериале · 135–195 Э.О. в книге" } }
palette: { primary: "#3fb7c9", glow: "#a5eef8" }
appearsIn: { show: [{ season: 2 }], book: [traders, merchant-princes, general] }
```

`content/era/mule.yaml`:

```yaml
id: mule
kind: era
name: { ru: "Мул" }
summary: { ru: "Мутант, которого План не предвидел, ломает Основание." }
order: 4
years: { start: 251, end: 350, bookStart: 300, bookEnd: 316, label: { ru: "~325 Э.О. в сериале · 300–316 Э.О. в книге" } }
palette: { primary: "#d9463b", glow: "#ff9b93" }
appearsIn: { show: [{ season: 3 }], book: [mule, search-by-mule] }
```

`content/era/second-foundation-search.yaml`:

```yaml
id: second-foundation-search
kind: era
name: { ru: "Поиски Второго Основания" }
summary: { ru: "Первое Основание ищет Второе; только книга." }
order: 5
years: { start: 351, end: 420, bookStart: 376, bookEnd: 377, label: { ru: "376 Э.О., только книга" } }
palette: { primary: "#8a5cff", glow: "#cbb5ff" }
appearsIn: { book: [search-by-foundation] }
```

`content/planet/trantor.yaml`:

```yaml
id: trantor
kind: planet
name: { ru: "Трантор", en: "Trantor" }
originalName: Trantor
summary: { ru: "Столица Империи, планета-город." }
eras: [trantor-trial, terminus-crisis, traders-general, mule, second-foundation-search]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }], book: [psychohistorians, general, search-by-foundation] }
book: { presence: same }
galaxy: { arm: 0, r: 0.02, offset: 0 }
look: { type: city, colorA: "#f0c060", colorB: "#8a5a20", radius: 3 }
```

`content/planet/terminus.yaml`:

```yaml
id: terminus
kind: planet
name: { ru: "Терминус", en: "Terminus" }
originalName: Terminus
summary: { ru: "Бедный мир на краю галактики, дом Основания." }
eras: [terminus-crisis, traders-general, mule, second-foundation-search]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }], book: [encyclopedists, mayors, traders, merchant-princes, mule] }
book: { presence: same }
galaxy: { arm: 1, r: 0.95, offset: 0 }
look: { type: barren, colorA: "#7fa3c7", colorB: "#2e4a6b", radius: 1.5 }
```

`content/planet/synnax.yaml`:

```yaml
id: synnax
kind: planet
name: { ru: "Синнакс", en: "Synnax" }
originalName: Synnax
summary: { ru: "Водный мир, родина Гаал Дорник." }
eras: [trantor-trial, traders-general]
appearsIn: { show: [{ season: 1 }, { season: 2 }] }
book: { presence: show-only, diff: { ru: "В книге Гаал родом с Синнакса, но сама планета не показана." } }
galaxy: { arm: 2, r: 0.7, offset: 0.1 }
look: { type: ocean, colorA: "#2f7fd6", colorB: "#0b3a6e", radius: 1.6 }
```

`content/planet/anacreon.yaml`:

```yaml
id: anacreon
kind: planet
name: { ru: "Анакреон", en: "Anacreon" }
originalName: Anacreon
summary: { ru: "Королевство на Периферии, первый противник Терминуса." }
eras: [terminus-crisis]
appearsIn: { show: [{ season: 1 }], book: [encyclopedists, mayors] }
book: { presence: same }
galaxy: { arm: 1, r: 0.85, offset: 0.25 }
look: { type: desert, colorA: "#c9a36b", colorB: "#6b4b23", radius: 1.8 }
```

`content/planet/kalgan.yaml`:

```yaml
id: kalgan
kind: planet
name: { ru: "Калган", en: "Kalgan" }
originalName: Kalgan
summary: { ru: "Мир развлечений, ставший столицей Мула." }
eras: [mule, second-foundation-search]
appearsIn: { show: [{ season: 3 }], book: [mule, search-by-mule, search-by-foundation] }
book: { presence: same }
galaxy: { arm: 3, r: 0.6, offset: -0.15 }
look: { type: ocean, colorA: "#58c8b0", colorB: "#1d5e52", radius: 2 }
```

`content/faction/empire.yaml`:

```yaml
id: empire
kind: faction
name: { ru: "Галактическая Империя", en: "Galactic Empire" }
summary: { ru: "Двенадцать тысяч лет власти над галактикой, которые кончаются." }
eras: [trantor-trial, terminus-crisis, traders-general, mule]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }], book: [psychohistorians, general] }
book: { presence: different, diff: { ru: "В книге нет генетической династии: императоры — обычные люди, Клеон II появляется в «Генерале»." } }
color: "#d4a53a"
```

`content/faction/foundation.yaml`:

```yaml
id: foundation
kind: faction
name: { ru: "Основание", en: "The Foundation" }
summary: { ru: "Колония на Терминусе, которая должна сократить тёмные века с тридцати тысяч лет до одной тысячи." }
eras: [terminus-crisis, traders-general, mule, second-foundation-search]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }], book: [encyclopedists, mayors, traders, merchant-princes, general, mule, search-by-mule, search-by-foundation] }
book: { presence: same }
color: "#4a7cff"
```

`content/faction/second-foundation.yaml`:

```yaml
id: second-foundation
kind: faction
name: { ru: "Второе Основание", en: "Second Foundation" }
summary: { ru: "Тайные хранители Плана, менталики." }
eras: [traders-general, mule, second-foundation-search]
appearsIn: { show: [{ season: 2 }, { season: 3 }], book: [search-by-mule, search-by-foundation] }
book: { presence: different, diff: { ru: "В книге Второе Основание создано Селдоном вместе с Первым и с самого начала живёт на Транторе; в сериале его создают Гаал и Хари на Игнисе." } }
color: "#8a5cff"
```

`content/character/hari-seldon.yaml`:

```yaml
id: hari-seldon
kind: character
name: { ru: "Хари Селдон", en: "Hari Seldon" }
originalName: Hari Seldon
summary: { ru: "Математик, создатель психоистории и Плана." }
eras: [trantor-trial, terminus-crisis, traders-general, mule]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }], book: [psychohistorians, encyclopedists, mayors, mule] }
faction: foundation
homeworld: trantor
actor: Джаред Харрис
timeline:
  - { era: trantor-trial, note: { ru: "Человек. Суд на Транторе, ссылка на Терминус." }, status: alive, planet: trantor }
  - { era: terminus-crisis, note: { ru: "Цифровая копия в Хранилище на Терминусе." }, status: digital, planet: terminus }
  - { era: traders-general, note: { ru: "Две копии: одна в Хранилище, другая рядом с Гаал." }, status: digital }
book: { presence: different, diff: { ru: "В книге Селдон после смерти появляется только записями в Склепе Времени во время кризисов. Никаких живых цифровых копий." } }
related:
  - { id: trantor, role: { ru: "родной мир" } }
  - { id: foundation, role: { ru: "основал" } }
body: { ru: "Хари Селдон доказал математически, что Империя падёт, и придумал, как сократить тьму после неё.\n\nВ сериале он остаётся действующим лицом на протяжении всех сезонов — как цифровая копия." }
```

`content/character/gaal-dornick.yaml`:

```yaml
id: gaal-dornick
kind: character
name: { ru: "Гаал Дорник", en: "Gaal Dornick" }
originalName: Gaal Dornick
summary: { ru: "Математик с Синнакса, ученица Селдона, в сериале — сквозная героиня." }
eras: [trantor-trial, traders-general, mule]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }], book: [psychohistorians] }
faction: second-foundation
homeworld: synnax
actor: ЛуЛлобелл
timeline:
  - { era: trantor-trial, note: { ru: "Прилетает на Трантор, свидетель суда." }, status: alive, planet: trantor, faction: foundation }
  - { era: traders-general, note: { ru: "После криосна встречает дочь Салвор; вместе с Хари создаёт Второе Основание." }, status: alive, faction: second-foundation }
  - { era: mule, note: { ru: "Возглавляет Второе Основание против Мула." }, status: alive, faction: second-foundation }
book: { presence: different, diff: { ru: "В книге Гаал — мужчина и рассказчик только первой части «Психоисторики». Дальше не появляется." } }
related:
  - { id: hari-seldon, role: { ru: "учитель" } }
  - { id: synnax, role: { ru: "родной мир" } }
```

`content/character/salvor-hardin.yaml`:

```yaml
id: salvor-hardin
kind: character
name: { ru: "Салвор Хардин", en: "Salvor Hardin" }
originalName: Salvor Hardin
summary: { ru: "Смотритель Терминуса, дочь Гаал и Рейча." }
eras: [terminus-crisis, traders-general]
appearsIn: { show: [{ season: 1 }, { season: 2 }], book: [encyclopedists, mayors] }
faction: foundation
homeworld: terminus
actor: Лия Харви
timeline:
  - { era: terminus-crisis, note: { ru: "Смотритель Терминуса во время анакреонского кризиса." }, status: alive, planet: terminus }
  - { era: traders-general, note: { ru: "Находит мать, Гаал, и погибает, защищая её." }, status: dead }
book: { presence: different, diff: { ru: "В книге Сальвор Хардин — мужчина, первый мэр Терминуса, автор фразы «Насилие — последнее прибежище некомпетентности». Родства с Гаал нет." } }
related:
  - { id: gaal-dornick, role: { ru: "мать" } }
  - { id: terminus, role: { ru: "родной мир" } }
```

`content/character/demerzel.yaml`:

```yaml
id: demerzel
kind: character
name: { ru: "Демерзель", en: "Demerzel" }
originalName: Demerzel
summary: { ru: "Робот, хранительница генетической династии." }
eras: [trantor-trial, terminus-crisis, traders-general, mule]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }] }
faction: empire
homeworld: trantor
actor: Лора Бирн
book: { presence: show-only, diff: { ru: "В трилогии нет; у Азимова есть в «Прелюдии к Основанию» как Это Демерзель, он же робот Р. Дэниел Оливо." } }
related:
  - { id: empire, role: { ru: "служит" } }
```

`content/character/brother-day.yaml`:

```yaml
id: brother-day
kind: character
name: { ru: "Брат День", en: "Brother Day" }
originalName: Brother Day
summary: { ru: "Правящий клон Клеона в расцвете лет. Титул, который носят разные Клеоны." }
eras: [trantor-trial, terminus-crisis, traders-general, mule]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }] }
faction: empire
homeworld: trantor
actor: Ли Пейс
timeline:
  - { era: trantor-trial, note: { ru: "Клеон XII." }, status: alive, planet: trantor }
  - { era: terminus-crisis, note: { ru: "Клеон XIII." }, status: alive, planet: trantor }
  - { era: traders-general, note: { ru: "Клеон XVII, помолвка с Сарет." }, status: alive, planet: trantor }
  - { era: mule, note: { ru: "Клеон XXIV." }, status: alive, planet: trantor }
book: { presence: show-only, diff: { ru: "В трилогии генетической династии нет. Ближайшая роль — Клеон II в части «Генерал»." } }
related:
  - { id: demerzel, role: { ru: "воспитана ею" } }
  - { id: empire, role: { ru: "правит" } }
```

`content/character/bayta.yaml`:

```yaml
id: bayta
kind: character
name: { ru: "Байта", en: "Bayta" }
originalName: Bayta
summary: { ru: "Женщина из Основания, чья история пересекается с Мулом." }
eras: [mule]
appearsIn: { show: [{ season: 3 }], book: [mule] }
faction: foundation
book:
  presence: different
  name: { ru: "Байта Дарелл", en: "Bayta Darell" }
  originalName: Bayta Darell
  diff: { ru: "В книге Байта Дарелл вместе с мужем Тораном увозит с Калгана шута Магнифико и первой понимает, кто такой Мул. Фамилия и родство в сериале другие — уточняется." }
related:
  - { id: kalgan, role: { ru: "встреча с Мулом" } }
```

`content/event/seldon-trial.yaml`:

```yaml
id: seldon-trial
kind: event
name: { ru: "Суд над Селдоном" }
summary: { ru: "Империя судит Селдона за предсказание своего падения и ссылает Основание на Терминус." }
eras: [trantor-trial]
appearsIn: { show: [{ season: 1, episodes: [1, 2] }], book: [psychohistorians] }
book: { presence: same }
year: 0
planet: trantor
related:
  - { id: hari-seldon, role: { ru: "обвиняемый" } }
  - { id: gaal-dornick, role: { ru: "свидетель" } }
```

`content/event/first-seldon-crisis.yaml`:

```yaml
id: first-seldon-crisis
kind: event
name: { ru: "Первый кризис Селдона" }
summary: { ru: "Анакреон давит на Терминус; Хранилище открывается впервые." }
eras: [terminus-crisis]
appearsIn: { show: [{ season: 1 }], book: [encyclopedists] }
book: { presence: different, diff: { ru: "В книге кризис случается в 50 Э.О. и решается политикой Хардина, без «Инвиктуса»." } }
year: 35
yearBook: 50
planet: terminus
isSeldonCrisis: true
related:
  - { id: salvor-hardin, role: { ru: "смотритель Терминуса" } }
  - { id: anacreon, role: { ru: "противник" } }
```

`content/event/sack-of-trantor.yaml`:

```yaml
id: sack-of-trantor
kind: event
name: { ru: "Великое разграбление Трантора" }
summary: { ru: "Трантор разорён, Империя фактически кончается." }
eras: [mule]
appearsIn: { book: [mule] }
book: { presence: book-only }
year: 260
planet: trantor
body: { ru: "В книге упоминается как событие, случившееся за десятилетия до Мула. Точная датировка уточняется в контент-фазе." }
```

`content/artifact/vault.yaml`:

```yaml
id: vault
kind: artifact
name: { ru: "Хранилище", en: "The Vault" }
originalName: The Vault
summary: { ru: "Объект на Терминусе, где живёт цифровой Селдон." }
eras: [terminus-crisis, traders-general, mule]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }], book: [encyclopedists, mayors, mule] }
book: { presence: different, name: { ru: "Склеп Времени", en: "Time Vault" }, originalName: Time Vault, diff: { ru: "В книге — зал с голограммами Селдона, которые включаются в моменты кризисов. Ничего живого внутри нет." } }
planet: terminus
related:
  - { id: hari-seldon, role: { ru: "обитатель" } }
```

`content/difference/genetic-dynasty.yaml`:

```yaml
id: genetic-dynasty
kind: difference
name: { ru: "Генетическая династия Клеонов" }
summary: { ru: "Три клона одного императора — День, Закат и Рассвет — изобретение сериала." }
eras: [trantor-trial, terminus-crisis, traders-general, mule]
appearsIn: { show: [{ season: 1 }, { season: 2 }, { season: 3 }] }
book: { presence: show-only }
body: { ru: "В трилогии Азимова Империей правят обычные императоры, и линия Трантора почти не показана. Сериал придумал династию клонов, чтобы у Империи было лицо на протяжении столетий." }
related:
  - { id: brother-day, role: { ru: "титул династии" } }
  - { id: demerzel, role: { ru: "хранительница" } }
  - { id: empire, role: { ru: "фракция" } }
```

- [ ] **Step 2: интеграционный тест**

`scripts/build-dataset.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildDataset } from './build-dataset'

const CONTENT = new URL('../content', import.meta.url).pathname

describe('content/', () => {
  const { dataset, errors } = buildDataset(CONTENT)

  it('проходит схему и перекрёстные проверки', () => {
    expect(errors).toEqual([])
    expect(dataset).toBeDefined()
  })

  it('эры идут по нити монотонно', () => {
    const eras = dataset!.entities.filter((e) => e.kind === 'era').sort((a, b) => a.order - b.order)
    expect(eras.length).toBeGreaterThanOrEqual(5)
    eras.forEach((era, i) => {
      if (i > 0) expect(era.t).toBeGreaterThan(eras[i - 1].t)
    })
    expect(eras[0].t).toBe(0)
    expect(eras[eras.length - 1].t).toBe(1)
  })

  it('у планет есть xyz', () => {
    for (const e of dataset!.entities) if (e.kind === 'planet') expect(e.xyz).toHaveLength(3)
  })

  it('kind совпадает с папкой', () => {
    const ids = dataset!.entities.map((e) => e.id)
    expect(ids).toContain('salvor-hardin')
    expect(ids).toContain('trantor-trial')
  })
})

describe('buildDataset на битом контенте', () => {
  it('возвращает ошибки, а не датасет', () => {
    const { dataset, errors } = buildDataset(new URL('./fixtures/broken', import.meta.url).pathname)
    expect(dataset).toBeUndefined()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.join('\n')).toContain('planet/oops.yaml')
  })
})
```

Фикстура `scripts/fixtures/broken/planet/oops.yaml` (планета без `book` и с плохим цветом):

```yaml
id: oops
kind: planet
name: { ru: "Упс" }
summary: { ru: "Битая планета" }
eras: [nope]
galaxy: { arm: 0, r: 0.5, offset: 0 }
look: { type: city, colorA: "red", colorB: "#ffffff", radius: 1 }
```

- [ ] **Step 3: убедиться, что падает**

```bash
npx vitest run scripts/build-dataset.test.ts
```

Ожидание: FAIL, `Cannot find module './build-dataset'`.

- [ ] **Step 4: реализация**

`scripts/build-dataset.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { eraT, planetXYZ } from '../src/data/derive'
import { EntitySchema, type Dataset, type Entity, type EntityOut } from '../src/data/schema'
import { validateDataset } from '../src/data/validate'

/** Читает content/<kind>/<id>.yaml, валидирует, считает производные. Ничего не пишет на диск. */
export function buildDataset(contentDir: string): { dataset?: Dataset; errors: string[] } {
  const errors: string[] = []
  const entities: Entity[] = []
  const files = (readdirSync(contentDir, { recursive: true }) as string[]).filter((f) => f.endsWith('.yaml')).sort()

  for (const rel of files) {
    let raw: unknown
    try {
      raw = parse(readFileSync(join(contentDir, rel), 'utf8'))
    } catch (e) {
      errors.push(`${rel}: не читается YAML — ${(e as Error).message}`)
      continue
    }
    const parsed = EntitySchema.safeParse(raw)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push(`${rel}: ${issue.path.join('.') || '(корень)'} — ${issue.message}`)
      continue
    }
    const folder = rel.split('/')[0]
    if (parsed.data.kind !== folder) errors.push(`${rel}: kind «${parsed.data.kind}» не совпадает с папкой «${folder}»`)
    const expectedName = `${parsed.data.id}.yaml`
    if (!rel.endsWith(`/${expectedName}`)) errors.push(`${rel}: файл должен называться ${expectedName}`)
    entities.push(parsed.data)
  }

  errors.push(...validateDataset(entities))
  if (errors.length) return { errors }

  const eraCount = entities.filter((e) => e.kind === 'era').length
  const out: EntityOut[] = entities.map((e) => {
    if (e.kind === 'era') return { ...e, t: eraT(e.order, eraCount) }
    if (e.kind === 'planet') return { ...e, xyz: planetXYZ(e.galaxy) }
    return e
  })
  return { dataset: { version: 1, entities: out }, errors: [] }
}
```

`scripts/build-data.ts` (CLI):

```ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { buildDataset } from './build-dataset'

const root = new URL('..', import.meta.url).pathname
const { dataset, errors } = buildDataset(`${root}content`)

if (errors.length || !dataset) {
  console.error(`build-data: ${errors.length} ошибок`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

mkdirSync(`${root}public/data`, { recursive: true })
writeFileSync(`${root}public/data/foundation.json`, JSON.stringify(dataset))
console.log(`build-data: ${dataset.entities.length} сущностей → public/data/foundation.json`)
```

- [ ] **Step 5: тесты зелёные и CLI работает**

```bash
npx vitest run scripts/build-dataset.test.ts && npm run data && ls -la public/data/foundation.json
```

Ожидание: PASS, 5 тестов; CLI печатает `build-data: 20 сущностей → public/data/foundation.json`. Если тест на контент падает — чинить YAML по тексту ошибки, не схему.

- [ ] **Step 6: commit**

```bash
cd /Users/user/projects/lab && git add foundation/scripts foundation/content && git commit -m "foundation: сборка content/ → foundation.json, контент-заглушки (20 сущностей)"
```

---

### Task 6: Индекс данных, роутер и стор

**Files:**
- Create: `src/data/indexDataset.ts`, `src/router/hash.ts`, `src/state/store.ts`
- Test: `src/data/indexDataset.test.ts`, `src/router/hash.test.ts`

**Interfaces:**
- Consumes: типы `Dataset, EntityOut, EraOut, NonEraOut, Kind, KINDS` из `../data/schema`.
- Produces:
  - `interface DataIndex { entities: EntityOut[]; byId: Map<string, EntityOut>; eras: EraOut[]; byEra: Map<string, NonEraOut[]> }`, `indexDataset(ds: Dataset): DataIndex`
  - `MODES`, `type Mode`, `interface Route { mode; eraId; kind?; id? }`, `parseHash(hash: string): Route | null`, `formatHash(r: Route): string`, `NOT_FOUND = 'Такой страницы нет'`, `resolveHash(hash: string, index: DataIndex): { route: Route; notice?: string }`
  - `useStore` (zustand) с полями `mode, eraId, selectedId, notice` и действиями `applyRoute(r), setMode(m), setEra(id), select(id | null), setNotice(n | null)`

- [ ] **Step 1: тест индекса**

`src/data/indexDataset.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { indexDataset } from './indexDataset'
import type { Dataset } from './schema'

const ds: Dataset = {
  version: 1,
  entities: [
    { id: 'e2', kind: 'era', name: { ru: 'e2' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], order: 2, years: { start: 11, end: 20, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: 1 },
    { id: 'e1', kind: 'era', name: { ru: 'e1' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], order: 1, years: { start: 0, end: 10, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: 0 },
    { id: 'f', kind: 'faction', name: { ru: 'f' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], eras: ['e1', 'e2'], book: { presence: 'same' }, color: '#123456' },
    { id: 'c', kind: 'character', name: { ru: 'c' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], eras: ['e2'], book: { presence: 'same' } },
  ],
}

describe('indexDataset', () => {
  const index = indexDataset(ds)
  it('эры отсортированы по order', () => expect(index.eras.map((e) => e.id)).toEqual(['e1', 'e2']))
  it('byId находит всё', () => expect(index.byId.get('c')?.kind).toBe('character'))
  it('byEra группирует сущности по эрам', () => {
    expect(index.byEra.get('e1')?.map((e) => e.id)).toEqual(['f'])
    expect(index.byEra.get('e2')?.map((e) => e.id)).toEqual(['f', 'c'])
  })
})
```

- [ ] **Step 2: реализация индекса**

`src/data/indexDataset.ts`:

```ts
import type { Dataset, EntityOut, EraOut, NonEraOut } from './schema'

export interface DataIndex {
  entities: EntityOut[]
  byId: Map<string, EntityOut>
  eras: EraOut[]
  byEra: Map<string, NonEraOut[]>
}

export function indexDataset(ds: Dataset): DataIndex {
  const byId = new Map<string, EntityOut>()
  const byEra = new Map<string, NonEraOut[]>()
  const eras: EraOut[] = []
  for (const e of ds.entities) {
    byId.set(e.id, e)
    if (e.kind === 'era') {
      eras.push(e)
      continue
    }
    for (const eraId of e.eras) {
      const list = byEra.get(eraId) ?? []
      list.push(e)
      byEra.set(eraId, list)
    }
  }
  eras.sort((a, b) => a.order - b.order)
  return { entities: ds.entities, byId, eras, byEra }
}
```

```bash
npx vitest run src/data/indexDataset.test.ts
```

Ожидание: PASS, 3 теста.

- [ ] **Step 3: тест роутера**

`src/router/hash.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { indexDataset } from '../data/indexDataset'
import type { Dataset } from '../data/schema'
import { NOT_FOUND, formatHash, parseHash, resolveHash } from './hash'

describe('parseHash / formatHash', () => {
  it('режим и эра', () => {
    expect(parseHash('#/list/mule')).toEqual({ mode: 'list', eraId: 'mule' })
  })
  it('режим, эра, сущность', () => {
    expect(parseHash('#/map/mule/character/bayta')).toEqual({ mode: 'map', eraId: 'mule', kind: 'character', id: 'bayta' })
  })
  it('симметричны', () => {
    for (const h of ['#/chronicle/trantor-trial', '#/list/mule/planet/kalgan']) expect(formatHash(parseHash(h)!)).toBe(h)
  })
  it('мусор — null', () => {
    expect(parseHash('')).toBeNull()
    expect(parseHash('#/foo/x')).toBeNull()
    expect(parseHash('#/map/x/character')).toBeNull()
    expect(parseHash('#/map/x/era/y')).toBeNull()
    expect(parseHash('#/map')).toBeNull()
  })
})

const ds: Dataset = {
  version: 1,
  entities: [
    { id: 'e1', kind: 'era', name: { ru: 'e1' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], order: 1, years: { start: 0, end: 10, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: 0 },
    { id: 'e2', kind: 'era', name: { ru: 'e2' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], order: 2, years: { start: 11, end: 20, label: { ru: '' } }, palette: { primary: '#000000', glow: '#ffffff' }, t: 1 },
    { id: 'c', kind: 'character', name: { ru: 'c' }, summary: { ru: '' }, appearsIn: {}, related: [], sources: [], eras: ['e2'], book: { presence: 'same' } },
  ],
}
const index = indexDataset(ds)

describe('resolveHash', () => {
  it('пустой хэш — первая эра, «Хроника», без уведомления', () => {
    expect(resolveHash('', index)).toEqual({ route: { mode: 'chronicle', eraId: 'e1' } })
    expect(resolveHash('#/', index)).toEqual({ route: { mode: 'chronicle', eraId: 'e1' } })
  })
  it('мусорный хэш — дефолт и уведомление', () => {
    expect(resolveHash('#/nope', index)).toEqual({ route: { mode: 'chronicle', eraId: 'e1' }, notice: NOT_FOUND })
  })
  it('несуществующая эра — дефолт и уведомление', () => {
    expect(resolveHash('#/list/zzz', index)).toEqual({ route: { mode: 'chronicle', eraId: 'e1' }, notice: NOT_FOUND })
  })
  it('несуществующая сущность — режим и эра остаются, карточки нет, уведомление', () => {
    expect(resolveHash('#/list/e1/character/zzz', index)).toEqual({ route: { mode: 'list', eraId: 'e1' }, notice: NOT_FOUND })
  })
  it('сущность не из этой эры — эра переключается на первую её эру', () => {
    expect(resolveHash('#/list/e1/character/c', index)).toEqual({ route: { mode: 'list', eraId: 'e2', kind: 'character', id: 'c' } })
  })
  it('всё существует — как есть', () => {
    expect(resolveHash('#/map/e2/character/c', index)).toEqual({ route: { mode: 'map', eraId: 'e2', kind: 'character', id: 'c' } })
  })
})
```

- [ ] **Step 4: реализация роутера**

`src/router/hash.ts`:

```ts
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
```

```bash
npx vitest run src/router/hash.test.ts
```

Ожидание: PASS, 10 тестов.

- [ ] **Step 5: стор**

`src/state/store.ts`:

```ts
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
  setNotice: (notice) => set({ notice }),
}))
```

```bash
npx tsc --noEmit && npx vitest run
```

Ожидание: без ошибок типов, все тесты зелёные (derive 9, schema 10, validate 10, build 5, index 3, hash 10).

- [ ] **Step 6: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src && git commit -m "foundation: индекс данных, hash-роутер, стор"
```

---

### Task 7: Оболочка: загрузка, список, навигация по эрам, режимы

**Files:**
- Create: `src/data/load.ts`, `src/data/labels.ts`, `src/router/bind.ts`, `src/ui/Loading.tsx`, `src/ui/ErrorView.tsx`, `src/ui/ListView.tsx`, `src/ui/EraNav.tsx`, `src/ui/ModeToggle.tsx`
- Modify: `src/App.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `DatasetSchema`, `indexDataset`, `DataIndex`, `useStore`, `resolveHash`, `formatHash`, `Route`.
- Produces:
  - `loadDataset(): Promise<DataIndex>`
  - `bindRouter(index: DataIndex): () => void` — подписка на `hashchange` и стор, возвращает отписку
  - `openEntity(index: DataIndex, id: string): void` — переключает эру при необходимости и открывает карточку (в `src/state/store.ts`? нет — в `src/router/bind.ts`, чтобы стор оставался тупым)
  - `BOOK_PART_TITLES`, `KIND_TITLES`, `seasonLabel(n)`, `bookPartLabel(p)` из `labels.ts`
  - Компоненты `ListView({ index })`, `EraNav({ index })`, `ModeToggle()`, `Loading()`, `ErrorView({ message, onRetry })`

- [ ] **Step 1: load.ts и labels.ts**

`src/data/load.ts`:

```ts
import { indexDataset, type DataIndex } from './indexDataset'
import { DatasetSchema } from './schema'

export async function loadDataset(): Promise<DataIndex> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/foundation.json`)
  if (!res.ok) throw new Error(`Данные не загрузились: HTTP ${res.status}`)
  const parsed = DatasetSchema.safeParse(await res.json())
  if (!parsed.success) throw new Error('Данные не проходят схему. Пересоберите foundation.json.')
  return indexDataset(parsed.data)
}
```

`src/data/labels.ts`:

```ts
import { bookOf, type BookPart } from './derive'
import type { Kind } from './schema'

export const BOOK_PART_TITLES: Record<BookPart, string> = {
  'psychohistorians': 'Психоисторики',
  'encyclopedists': 'Энциклопедисты',
  'mayors': 'Мэры',
  'traders': 'Торговцы',
  'merchant-princes': 'Князья торговли',
  'general': 'Генерал',
  'mule': 'Мул',
  'search-by-mule': 'Поиски Мула',
  'search-by-foundation': 'Поиски Основания',
}

export const KIND_TITLES: Record<Kind, string> = {
  era: 'Эра',
  planet: 'Планета',
  character: 'Персонаж',
  faction: 'Фракция',
  event: 'Событие',
  artifact: 'Объект',
  difference: 'Расхождение',
}

export const seasonLabel = (n: number) => `S${n}`
export const bookPartLabel = (p: BookPart) => `кн. ${bookOf(p)} «${BOOK_PART_TITLES[p]}»`
```

- [ ] **Step 2: bind.ts**

`src/router/bind.ts`:

```ts
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
```

- [ ] **Step 3: компоненты**

`src/ui/Loading.tsx`:

```tsx
export function Loading() {
  return <p className="status">Загружаю карту…</p>
}
```

`src/ui/ErrorView.tsx`:

```tsx
export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="status">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>Повторить</button>
    </div>
  )
}
```

`src/ui/ModeToggle.tsx`:

```tsx
import { MODES, type Mode } from '../router/hash'
import { useStore } from '../state/store'

const TITLES: Record<Mode, string> = { chronicle: 'Хроника', map: 'Карта', list: 'Список' }

export function ModeToggle() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  return (
    <nav className="modes" aria-label="Режим">
      {MODES.map((m) => (
        <button key={m} type="button" className={m === mode ? 'active' : ''} aria-pressed={m === mode} onClick={() => setMode(m)}>
          {TITLES[m]}
        </button>
      ))}
    </nav>
  )
}
```

`src/ui/EraNav.tsx`:

```tsx
import type { CSSProperties } from 'react'
import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'

export function EraNav({ index }: { index: DataIndex }) {
  const eraId = useStore((s) => s.eraId)
  const setEra = useStore((s) => s.setEra)
  const go = (id: string) => {
    setEra(id)
    document.getElementById(`era-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <nav className="eras" aria-label="Эры">
      {index.eras.map((era) => (
        <button
          key={era.id}
          type="button"
          className={era.id === eraId ? 'chip active' : 'chip'}
          style={{ '--era': era.palette.primary } as CSSProperties}
          onClick={() => go(era.id)}
        >
          {era.name.ru}
        </button>
      ))}
    </nav>
  )
}
```

`src/ui/ListView.tsx`:

```tsx
import type { CSSProperties } from 'react'
import type { DataIndex } from '../data/indexDataset'
import type { Kind, NonEraOut } from '../data/schema'
import { openEntity } from '../router/bind'
import { useStore } from '../state/store'

const GROUPS: { kind: Kind; title: string }[] = [
  { kind: 'planet', title: 'Планеты' },
  { kind: 'character', title: 'Персонажи' },
  { kind: 'faction', title: 'Фракции' },
  { kind: 'event', title: 'События' },
  { kind: 'artifact', title: 'Объекты и места' },
]

export function timelineNote(e: NonEraOut, eraId: string): string | undefined {
  return e.timeline?.find((t) => t.era === eraId)?.note.ru
}

function Item({ e, eraId, index }: { e: NonEraOut; eraId: string; index: DataIndex }) {
  return (
    <li>
      <button type="button" className="item" onClick={() => openEntity(index, e.id)}>
        <b>{e.name.ru}</b>
        {e.originalName && <i> ({e.originalName})</i>}
        <span>{timelineNote(e, eraId) ?? e.summary.ru}</span>
      </button>
    </li>
  )
}

export function ListView({ index }: { index: DataIndex }) {
  const eraId = useStore((s) => s.eraId)
  const differences = index.entities.filter((e): e is NonEraOut => e.kind === 'difference')
  return (
    <div className="list">
      {index.eras.map((era) => {
        const items = index.byEra.get(era.id) ?? []
        return (
          <section key={era.id} id={`era-${era.id}`} className={era.id === eraId ? 'era active' : 'era'} style={{ '--era': era.palette.primary } as CSSProperties}>
            <h2>{era.name.ru}</h2>
            <p className="years">{era.years.label.ru}</p>
            <p className="muted">{era.summary.ru}</p>
            {GROUPS.map((g) => {
              const group = items.filter((e) => e.kind === g.kind)
              if (!group.length) return null
              return (
                <div key={g.kind} className="group">
                  <h3>{g.title}</h3>
                  <ul>{group.map((e) => <Item key={e.id} e={e} eraId={era.id} index={index} />)}</ul>
                </div>
              )
            })}
          </section>
        )
      })}
      {differences.length > 0 && (
        <section className="era" id="era-differences">
          <h2>Чем сериал отличается от книги</h2>
          <ul>{differences.map((e) => <Item key={e.id} e={e} eraId={eraId} index={index} />)}</ul>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 4: App.tsx и стили**

`src/App.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react'
import type { DataIndex } from './data/indexDataset'
import { loadDataset } from './data/load'
import { bindRouter } from './router/bind'
import { useStore } from './state/store'
import { EraNav } from './ui/EraNav'
import { ErrorView } from './ui/ErrorView'
import { ListView } from './ui/ListView'
import { Loading } from './ui/Loading'
import { ModeToggle } from './ui/ModeToggle'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; index: DataIndex }

export default function App() {
  const [data, setData] = useState<LoadState>({ status: 'loading' })
  const mode = useStore((s) => s.mode)

  const load = useCallback(() => {
    setData({ status: 'loading' })
    loadDataset()
      .then((index) => setData({ status: 'ready', index }))
      .catch((e: unknown) => setData({ status: 'error', message: e instanceof Error ? e.message : String(e) }))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (data.status !== 'ready') return
    return bindRouter(data.index)
  }, [data])

  if (data.status === 'loading') return <Loading />
  if (data.status === 'error') return <ErrorView message={data.message} onRetry={load} />
  const { index } = data

  return (
    <>
      <header className="top">
        <h1>Основание: карта вселенной</h1>
        <ModeToggle />
      </header>
      <EraNav index={index} />
      <main>
        {mode !== 'list' && <p className="notice">3D-режимы «Хроника» и «Карта» появятся в следующей версии. Пока — список.</p>}
        <ListView index={index} />
      </main>
    </>
  )
}
```

Дописать в `src/styles.css`:

```css
.status { padding: 48px 16px; text-align: center; color: var(--muted); }
.status button, .modes button, .chip, .item { font: inherit; cursor: pointer; }

.top { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; padding: 16px 16px 8px; }
.top h1 { font-size: 20px; margin: 0; letter-spacing: -0.01em; }

.modes { display: flex; gap: 4px; background: var(--bg-2); border: 1px solid var(--line); border-radius: 999px; padding: 3px; }
.modes button { border: 0; background: transparent; color: var(--muted); border-radius: 999px; padding: 6px 12px; }
.modes button.active { background: var(--line); color: var(--fg); }

.eras { display: flex; gap: 8px; overflow-x: auto; padding: 8px 16px 12px; scrollbar-width: none; }
.chip { flex: 0 0 auto; border: 1px solid var(--line); background: var(--bg-2); color: var(--fg); border-radius: 999px; padding: 6px 12px; white-space: nowrap; }
.chip.active { border-color: var(--era); box-shadow: inset 0 0 0 1px var(--era); }

main { max-width: 880px; margin: 0 auto; padding: 0 16px 96px; }
.notice { background: var(--bg-2); border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; color: var(--muted); }

.era { border-left: 3px solid var(--era); padding: 8px 0 8px 16px; margin: 24px 0 40px; }
.era h2 { margin: 0; font-size: 22px; }
.era .years { margin: 2px 0 8px; color: var(--era); font-size: 14px; }
.era .muted { color: var(--muted); margin: 0 0 12px; }
.group h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 16px 0 6px; }
.group ul, .era > ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.item { display: block; width: 100%; text-align: left; background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; color: var(--fg); }
.item:hover { border-color: var(--era); }
.item i { color: var(--muted); font-style: normal; }
.item span { display: block; color: var(--muted); font-size: 14px; margin-top: 2px; }
```

- [ ] **Step 5: проверить в браузере**

```bash
npm run data && npm run dev
```

Открыть `http://localhost:5173/foundation/`. Ожидание: URL сам становится `…/#/chronicle/trantor-trial`, сверху заголовок и переключатель режимов, чипы пяти эр, пометка про 3D и пять секций списка плюс «Чем сериал отличается от книги». Клик по чипу «Мул» прокручивает к секции и меняет URL на `#/chronicle/mule`. Переключение на «Список» убирает пометку и меняет URL на `#/list/mule`. Ввод `#/list/zzz` руками в адресной строке возвращает на первую эру. Клик по карточке пока ничего не показывает (карточка в задаче 8), но URL меняется на `#/list/<эра>/<kind>/<id>`.

```bash
npx tsc --noEmit
```

Ожидание: без ошибок.

- [ ] **Step 6: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src && git commit -m "foundation: оболочка — загрузка данных, список по эрам, чипы эр, режимы"
```

---

### Task 8: Карточка сущности, баннер спойлеров, тост

**Files:**
- Create: `src/ui/EntityCard.tsx`, `src/ui/SpoilerBanner.tsx`, `src/ui/Toast.tsx`
- Modify: `src/App.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `useStore`, `openEntity`, `DataIndex`, `NonEraOut`, `timelineNote` из `./ListView`, `seasonLabel`, `bookPartLabel`, `KIND_TITLES`, `SEASONS`.
- Produces: `EntityCard({ index })` — читает `selectedId` из стора, рендерит `<aside class="card">` или `null`; `SpoilerBanner()`; `Toast()` — показывает `notice` из стора 3 секунды.

- [ ] **Step 1: EntityCard**

`src/ui/EntityCard.tsx`:

```tsx
import { useEffect, useState } from 'react'
import type { DataIndex } from '../data/indexDataset'
import { KIND_TITLES, bookPartLabel, seasonLabel } from '../data/labels'
import type { NonEraOut } from '../data/schema'
import { openEntity } from '../router/bind'
import { useStore } from '../state/store'
import { timelineNote } from './ListView'

type TabKey = 'show' | 'book' | 'related'
const TAB_TITLES: Record<TabKey, string> = { show: 'Сериал', book: 'В книге', related: 'Связи' }

export function tabsFor(e: NonEraOut): TabKey[] {
  switch (e.book.presence) {
    case 'same': return ['show', 'related']
    case 'different': return ['show', 'book', 'related']
    case 'show-only': return ['show', 'related']
    case 'book-only': return ['book', 'related']
  }
}

function Paragraphs({ text }: { text?: string }) {
  if (!text) return <p className="muted">Текст появится в контент-фазе.</p>
  return <>{text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</>
}

export function EntityCard({ index }: { index: DataIndex }) {
  const selectedId = useStore((s) => s.selectedId)
  const eraId = useStore((s) => s.eraId)
  const select = useStore((s) => s.select)
  const entity = selectedId ? index.byId.get(selectedId) : undefined
  const e = entity && entity.kind !== 'era' ? (entity as NonEraOut) : undefined
  const tabs = e ? tabsFor(e) : []
  const [tab, setTab] = useState<TabKey>('show')

  useEffect(() => { if (e) setTab(tabsFor(e)[0]) }, [e])
  useEffect(() => {
    if (!e) return
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') select(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [e, select])

  if (!e) return null
  const note = timelineNote(e, eraId)
  const badge = e.book.presence === 'show-only' ? 'В книге нет' : e.book.presence === 'book-only' ? 'В сериале нет' : null
  const bookText = e.book.presence === 'book-only' ? e.body?.ru : e.book.diff?.ru

  return (
    <aside className="card" aria-label={e.name.ru}>
      <div className="card-head">
        <div>
          <p className="kind">{KIND_TITLES[e.kind]}{badge && <span className="badge">{badge}</span>}</p>
          <h2>
            {e.name.ru}
            {e.originalName && <i> ({e.originalName})</i>}
            {e.book.name && <small> · в книге — {e.book.name.ru}</small>}
          </h2>
        </div>
        <button type="button" className="close" aria-label="Закрыть" onClick={() => select(null)}>×</button>
      </div>
      <div className="tags">
        {e.appearsIn.show?.map((s) => <span key={`s${s.season}`}>{seasonLabel(s.season)}</span>)}
        {e.appearsIn.book?.map((p) => <span key={p}>{bookPartLabel(p)}</span>)}
        {e.eras.map((id) => <span key={id} className="era-tag">{index.byId.get(id)?.name.ru}</span>)}
      </div>
      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t} type="button" className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>{TAB_TITLES[t]}</button>
        ))}
      </nav>
      <div className="card-body">
        {tab === 'show' && (
          <>
            {note && <p className="now"><b>В эту эру:</b> {note}</p>}
            {e.kind === 'character' && e.actor && <p className="muted">Актёр: {e.actor}</p>}
            <Paragraphs text={e.body?.ru} />
          </>
        )}
        {tab === 'book' && <Paragraphs text={bookText} />}
        {tab === 'related' && (
          <ul className="related">
            {e.related.length === 0 && <li className="muted">Связей пока нет.</li>}
            {e.related.map((r) => {
              const target = index.byId.get(r.id)
              if (!target) return null
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => openEntity(index, r.id)}><b>{target.name.ru}</b><span>{r.role.ru}</span></button>
                </li>
              )
            })}
            {e.book.counterpart && index.byId.get(e.book.counterpart) && (
              <li>
                <button type="button" onClick={() => openEntity(index, e.book.counterpart!)}>
                  <b>{index.byId.get(e.book.counterpart)!.name.ru}</b><span>двойник в книге</span>
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: SpoilerBanner и Toast**

`src/ui/SpoilerBanner.tsx`:

```tsx
import { useState } from 'react'
import { SEASONS } from '../data/derive'

const KEY = 'foundation:spoilers-ok'

function read(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function SpoilerBanner() {
  const [hidden, setHidden] = useState(read)
  if (hidden) return null
  const close = () => {
    try { localStorage.setItem(KEY, '1') } catch { /* приватный режим */ }
    setHidden(true)
  }
  return (
    <div className="spoilers" role="note">
      <span>Здесь спойлеры на все {SEASONS} сезона сериала и три книги трилогии.</span>
      <button type="button" onClick={close}>Понятно</button>
    </div>
  )
}
```

`src/ui/Toast.tsx`:

```tsx
import { useEffect } from 'react'
import { useStore } from '../state/store'

export function Toast() {
  const notice = useStore((s) => s.notice)
  const setNotice = useStore((s) => s.setNotice)
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(t)
  }, [notice, setNotice])
  if (!notice) return null
  return <div className="toast" role="status">{notice}</div>
}
```

- [ ] **Step 3: подключить в App.tsx**

В `src/App.tsx` добавить импорты и элементы: `SpoilerBanner` первым внутри фрагмента, `EntityCard index={index}` и `Toast` после `<main>`:

```tsx
import { EntityCard } from './ui/EntityCard'
import { SpoilerBanner } from './ui/SpoilerBanner'
import { Toast } from './ui/Toast'
// …
  return (
    <>
      <SpoilerBanner />
      <header className="top">…</header>
      <EraNav index={index} />
      <main>…</main>
      <EntityCard index={index} />
      <Toast />
    </>
  )
```

- [ ] **Step 4: стили карточки, баннера, тоста**

Дописать в `src/styles.css`:

```css
.spoilers { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 10px 16px; background: #2a2410; border-bottom: 1px solid #4a3d1e; color: #ffd17a; font-size: 14px; }
.spoilers button { font: inherit; background: transparent; border: 1px solid #4a3d1e; color: inherit; border-radius: 999px; padding: 4px 10px; cursor: pointer; }

.toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); background: var(--bg-2); border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px; color: var(--fg); z-index: 20; }

.card { position: fixed; left: 0; right: 0; bottom: 0; max-height: 55dvh; display: flex; flex-direction: column; background: rgba(15, 19, 34, 0.96); backdrop-filter: blur(12px); border-top: 1px solid var(--line); border-radius: 16px 16px 0 0; padding: 12px 16px calc(16px + env(safe-area-inset-bottom)); z-index: 10; }
.card-head { display: flex; gap: 12px; align-items: flex-start; justify-content: space-between; }
.card .kind { margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.card .badge { margin-left: 8px; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--line); text-transform: none; letter-spacing: 0; }
.card h2 { margin: 2px 0 8px; font-size: 22px; }
.card h2 i { color: var(--muted); font-style: normal; font-weight: 400; }
.card h2 small { display: block; color: var(--muted); font-weight: 400; font-size: 14px; }
.close { font: inherit; font-size: 22px; line-height: 1; background: transparent; border: 0; color: var(--muted); cursor: pointer; padding: 4px 8px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.tags span { font-size: 12px; border: 1px solid var(--line); border-radius: 999px; padding: 1px 8px; color: var(--muted); }
.tags .era-tag { color: var(--fg); }
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 8px; }
.tabs button { font: inherit; background: transparent; border: 0; border-bottom: 2px solid transparent; color: var(--muted); padding: 6px 10px; cursor: pointer; }
.tabs button.active { color: var(--fg); border-bottom-color: var(--fg); }
.card-body { overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; min-height: 0; }
.card-body p { margin: 0 0 10px; }
.now { background: var(--bg); border-radius: 8px; padding: 8px 10px; }
.related { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.related button { font: inherit; width: 100%; text-align: left; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; color: var(--fg); cursor: pointer; }
.related button span { display: block; font-size: 13px; color: var(--muted); }

@media (min-width: 900px) {
  .card { left: auto; top: 0; bottom: 0; width: 400px; max-height: none; border-radius: 0; border-top: 0; border-left: 1px solid var(--line); padding-top: 16px; }
  main { padding-right: 16px; }
  body:has(.card) main { max-width: calc(100% - 432px); margin-left: 0; padding-left: 24px; }
}
```

- [ ] **Step 5: проверить в браузере**

```bash
npm run dev
```

Ожидание: сверху жёлтый баннер, «Понятно» его убирает и после перезагрузки он не возвращается. Клик по «Салвор Хардин» открывает карточку (снизу при узком окне, справа при ≥ 900 px) с вкладками «Сериал / В книге / Связи», тегами S1 S2 и «кн. 1 «Энциклопедисты»», строкой «В эту эру: …»; URL `#/…/character/salvor-hardin`. Кнопка «Назад» браузера закрывает карточку. Escape и × закрывают. «Связи» → «Гаал Дорник» открывает её карточку и переключает эру-чип (у Гаал нет эры `terminus-crisis`). У «Хранилища» в шапке «· в книге — Склеп Времени». У «Демерзель» бейдж «В книге нет» и нет вкладки «В книге». У «Великого разграбления Трантора» первая вкладка «В книге» и бейдж «В сериале нет». Ввод `#/list/mule/character/zzz` показывает тост «Такой страницы нет».

```bash
npx tsc --noEmit && npx vitest run
```

Ожидание: без ошибок, все тесты зелёные.

- [ ] **Step 6: commit**

```bash
cd /Users/user/projects/lab && git add foundation/src && git commit -m "foundation: карточка сущности с вкладками, баннер спойлеров, тост"
```

---

### Task 9: Playwright-смоук, полная сборка, документация

**Files:**
- Create: `playwright.config.ts`, `tests/smoke.spec.ts`
- Modify: `README.md` (foundation), `../README.md` (lab, одна строка), `../experiments.json`

**Interfaces:**
- Consumes: всё выше.
- Produces: `npm run e2e` зелёный; `npm run build` зелёный, включая `size-limit`; `lab/scripts/build.sh` кладёт `foundation` в `_site/`.

- [ ] **Step 1: конфиг Playwright и смоук**

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 20_000,
  use: { baseURL: 'http://localhost:4173', viewport: { width: 390, height: 844 } },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/foundation/',
    reuseExistingServer: true,
  },
})
```

`tests/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('главная уходит на первую эру и рендерит список', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/foundation/')
  await expect(page).toHaveURL(/#\/chronicle\/trantor-trial$/)
  await expect(page.locator('section.era')).toHaveCount(6) // 5 эр + «Чем отличается»
  expect(errors).toEqual([])
})

test('карточка открывается кликом и закрывается кнопкой «Назад»', async ({ page }) => {
  await page.goto('/foundation/#/list/terminus-crisis')
  await page.getByRole('button', { name: /Салвор Хардин/ }).first().click()
  await expect(page).toHaveURL(/#\/list\/terminus-crisis\/character\/salvor-hardin$/)
  await expect(page.locator('aside.card')).toBeVisible()
  await expect(page.locator('aside.card .tabs button')).toHaveCount(3)
  await page.goBack()
  await expect(page.locator('aside.card')).toHaveCount(0)
})

test('несуществующий id — тост и список', async ({ page }) => {
  await page.goto('/foundation/#/list/mule/character/zzz')
  await expect(page.getByRole('status')).toHaveText('Такой страницы нет')
  await expect(page).toHaveURL(/#\/list\/mule$/)
})
```

- [ ] **Step 2: установить браузер и прогнать**

```bash
npx playwright install chromium && npm run e2e
```

Ожидание: `npm run build` проходит (vitest → build-data → vite build → size-limit, оболочка меньше 100 КБ gzip), затем 3 Playwright-теста зелёные. Если `size-limit` красный — посмотреть `npx vite build` с `rollup-plugin-visualizer` не нужно: в v0 нет тяжёлых зависимостей, искать случайный импорт `node:*` или `yaml` в `src/`.

- [ ] **Step 3: сборка монорепо**

```bash
cd /Users/user/projects/lab && bash scripts/build.sh && ls _site/foundation/assets | head
```

Ожидание: `==> build foundation`, в `_site/foundation/` лежат `index.html`, `assets/`, `data/foundation.json`.

- [ ] **Step 4: документация**

Заменить `foundation/README.md`:

~~~markdown
# Основание: карта вселенной

3D-карта галактики и таймлайн сериала Apple TV+ «Основание» (сезоны 1–3) и трилогии Азимова. Сериал как основа, книга как слой «в книге иначе». Публикуется на `https://atlonis.github.io/foundation/`.

Сейчас v0: данные, режим «Список», карточки. 3D — следующий план.

- Дизайн v1: [docs/superpowers/specs/2026-09-29-foundation-map-design.md](docs/superpowers/specs/2026-09-29-foundation-map-design.md)
- План v0: [docs/superpowers/plans/2026-09-29-foundation-v0-list.md](docs/superpowers/plans/2026-09-29-foundation-v0-list.md)
- Разведка 3D-стека: [docs/research/2026-09-29-3d-stack-research.md](docs/research/2026-09-29-3d-stack-research.md)

## Команды

```bash
npm ci
npm run data      # content/*.yaml → public/data/foundation.json (падает на ошибках)
npm run dev       # http://localhost:5173/foundation/
npm test          # vitest: схема, проверки, роутер, сборка контента
npm run build     # тесты + данные + vite build + size-limit
npm run e2e       # build + Playwright-смоук (один раз: npx playwright install chromium)
```

## Контент

Одна сущность — один файл `content/<kind>/<id>.yaml`, имя файла = `id`. Виды: `era`, `planet`, `character`, `faction`, `event`, `artifact`, `difference`. Схема — `src/data/schema.ts`, перекрёстные проверки — `src/data/validate.ts`. Блок `book` обязателен у всех, кроме эр. Годы — Э.О., 0 = суд над Селдоном.

## Маршруты

`#/<mode>/<eraId>[/<kind>/<id>]`, режимы `chronicle`, `map`, `list`. В v0 режимы `chronicle` и `map` показывают список с пометкой.
~~~

В `lab/README.md` в раздел «Как устроено» добавить строку: «- `foundation/` — первый эксперимент, см. его README.» В `lab/experiments.json` оставить `status: in-progress`.

- [ ] **Step 5: commit**

```bash
cd /Users/user/projects/lab && git add foundation README.md && git commit -m "foundation: Playwright-смоук, README, сборка в лабе"
```

Push — только после «ок» владельца: `git push`. После push Actions выкатит `https://atlonis.github.io/foundation/`; проверить на телефоне по чеклисту из спека (раздел 7), кроме пунктов про 3D.

---

## Самопроверка плана

**Покрытие спека.** 5.1–5.5 (виды, шкала, схема, эры, сборка) — задачи 2–5. 6.2 структура, поток данных, два чанка (в v0 один — оболочка), `BASE_URL`, маршруты — задачи 6–7. 6.4 карточка с таблицей вкладок, теги, `timeline`, bottom sheet / правая панель, жесты (`overscroll-behavior`, `touch-action`), баннер — задача 8; hover-лейбл и «Показать на карте» — 3D-план. 6.6 ошибки данных, маршрутов, загрузки JSON — задачи 6–8; WebGL2, `import()`, `contextlost` — 3D-план. 7 тесты — задачи 2–6 и 9. 8 сборка и деплой — задачи 1 и 9. Не покрыто намеренно: всё из 6.3, 6.5 (3D и тиры) и `view` в данных (поле есть в схеме, заполняется в 3D-плане).

**Типы между задачами.** `DataIndex` (задача 6) используется в 7–8 с теми же полями; `NonEraOut` из задачи 3 — в `ListView`, `EntityCard`; `openEntity(index, id)` определён в `bind.ts` (задача 7) и вызывается в `ListView` и `EntityCard`; `timelineNote` экспортируется из `ListView` и импортируется в `EntityCard`; `NOT_FOUND` из `hash.ts` проверяется в смоуке буквальной строкой «Такой страницы нет».
