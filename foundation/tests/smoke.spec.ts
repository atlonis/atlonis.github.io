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
