# Основание: карта вселенной

3D-карта галактики и таймлайн сериала Apple TV+ «Основание» (сезоны 1–3) и трилогии Азимова. Сериал как основа, книга как слой «в книге иначе». Публикуется на `https://atlonis.github.io/foundation/`.

Сейчас 3D-A: галактика, планеты, нить эр и режим «Хроника» (скролл по нити). Режим «Карта», подписи и маркеры персонажей — план 3D-B.

Флаги в адресной строке: `?no3d` — принудительно без 3D (список), `?debug` — счётчик draw calls и fps в углу.

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

Одна сущность — один файл `content/<kind>/<id>.yaml`, имя файла = `id`. Виды: `era`, `planet`, `character`, `faction`, `event`, `artifact`, `difference`. Схема — `src/data/schema.ts`, перекрёстные проверки — `src/data/validate.ts`. Блок `book` обязателен у всех, кроме эр. Годы — Э.О., 0 = суд над Селдоном. `body` пока plain text: абзацы разделяются пустой строкой, markdown-разметка не рендерится.

## Маршруты

`#/<mode>/<eraId>[/<kind>/<id>]`, режимы `chronicle`, `map`, `list`. Режим `chronicle` — 3D-сцена; `map` пока открывает ту же сцену «Хроники» (настоящая «Карта» — план 3D-B). Без 3D (`?no3d`, нет WebGL2) оба режима показывают список с пометкой.

## Сцена

Чанк `src/scene/SceneRoot.tsx` грузится динамически; оболочка не импортирует three. Чистые модули без three: `gate.ts` (можно ли 3D), `tier.ts` (тир устройства), `galaxy.ts` (точки по сиду), `layout.ts` (остановки эр, камера «Хроники»). Галактика рисуется компонентом `GalaxyLayer.tsx`. Каждый твин — через `tweenTo()` из `anim.ts`, он просит кадр (`frameloop="demand"`). Чипы эр зовут `scrollToEra` из `sceneStore`, который регистрирует `CameraRig`.
