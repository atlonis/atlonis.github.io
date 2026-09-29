# lab

Витрина экспериментов. Публикуется на GitHub Pages как `https://atlonis.github.io/`.

## Как устроено

- Каждый эксперимент — папка в корне (`foundation/`, ...). Папка с `package.json` собирается `npm ci && npm run build`, результат из `dist/` попадает в `/<папка>/`. Папка с голым `index.html` копируется как есть.
- `experiments.json` — список для витрины (`index.html`). Добавил эксперимент → добавь запись.
- `scripts/build.sh` собирает всё в `_site/`; его же гоняет `.github/workflows/pages.yml` на каждый push в `main`.
- Vite-проекты: в `vite.config` ставь `base: '/<папка>/'`, иначе ассеты не найдутся.

## Локально

```bash
bash scripts/build.sh && npx serve _site
```
