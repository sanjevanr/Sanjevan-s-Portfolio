import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 90_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
      testMatch: ['morph-cross-browser.spec.ts', 'mobile-layout.spec.ts'],
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
      testMatch: ['morph-cross-browser.spec.ts', 'mobile-layout.spec.ts', 'morphing-background.spec.ts'],
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
