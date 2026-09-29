import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 20_000,
  use: { baseURL: 'http://localhost:4173', viewport: { width: 390, height: 844 } },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/foundation/',
    reuseExistingServer: !process.env.CI,
  },
})
