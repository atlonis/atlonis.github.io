import { expect, test } from '@playwright/test'

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

test('переход по связи в другую эру и «Назад» возвращают прежнюю карточку в её эре', async ({ page }) => {
  await page.goto('/foundation/#/list/trantor-trial/character/hari-seldon')
  await page.locator('aside.card .tabs button', { hasText: 'Связи' }).click()
  await page.locator('aside.card .related button', { hasText: 'Основание' }).click()
  await expect(page).toHaveURL(/#\/list\/terminus-crisis\/faction\/foundation$/)
  await page.goBack()
  await expect(page).toHaveURL(/#\/list\/trantor-trial\/character\/hari-seldon$/)
  await expect(page.locator('aside.card h2')).toContainText('Хари Селдон')
})

test('исправленный deep link не оставляет мёртвой записи в истории', async ({ page }) => {
  await page.goto('/foundation/#/list/trantor-trial')
  await page.goto('/foundation/#/list/trantor-trial/character/bayta')
  await expect(page).toHaveURL(/#\/list\/mule\/character\/bayta$/)
  await page.goBack()
  await expect(page).toHaveURL(/#\/list\/trantor-trial$/)
})

test('3D: «Хроника» поднимает canvas, список прячется, ошибок нет', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'сцена проверяется на десктопном проекте')
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/foundation/?debug#/chronicle/mule')
  await expect(page.locator('.stage canvas')).toHaveCount(1, { timeout: 20_000 })
  // Есть WebGL-контекст, кадр отрисован и бюджет ≤ 31 draw call выдержан.
  await expect(page.locator('#debug-stats')).toHaveText(/calls ([1-9]|[12]\d|3[01]) ·/, { timeout: 10_000 })
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

test('3D: смена эры по хэшу в первую секунду не теряется и не откатывается', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'сцена проверяется на десктопном проекте')
  await page.goto('/foundation/?debug#/chronicle/trantor-trial')
  await expect(page.locator('.stage canvas')).toHaveCount(1, { timeout: 20_000 })
  await page.waitForTimeout(300)
  await page.evaluate(() => { location.hash = '#/chronicle/mule/planet/kalgan' })
  await expect(page).toHaveURL(/#\/chronicle\/mule\/planet\/kalgan$/, { timeout: 5_000 })
  await page.waitForTimeout(2_000)
  await expect(page).toHaveURL(/#\/chronicle\/mule\/planet\/kalgan$/)
  await expect(page.locator('.chip.active')).toHaveText('Мул')
})

test('3D на телефоне: карточка блокирует скролл нити', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'блокировка скролла нити — только на телефоне')
  await page.goto('/foundation/?debug#/chronicle/trantor-trial')
  await expect(page.locator('.stage canvas')).toHaveCount(1, { timeout: 20_000 })
  await expect(page.locator('#debug-stats')).toHaveText(/calls/, { timeout: 10_000 })
  const thread = page.getByTestId('thread-scroll')
  await expect(thread).toHaveCSS('overflow-y', 'auto')
  await page.goto('/foundation/?debug#/chronicle/trantor-trial/planet/trantor')
  await expect(page.locator('aside.card')).toBeVisible()
  await expect(thread).toHaveCSS('overflow-y', 'hidden')
  await page.locator('aside.card button.close').click()
  await expect(page.locator('aside.card')).toHaveCount(0)
  await expect(thread).toHaveCSS('overflow-y', 'auto')
})
