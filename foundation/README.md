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
