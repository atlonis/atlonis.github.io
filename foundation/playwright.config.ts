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
