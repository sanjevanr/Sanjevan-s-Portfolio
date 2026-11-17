import { test as base, expect } from '@playwright/test'
import { entryStorageKey } from '../../src/audio/entrySession'

/** Existing specs cover the site after entry. A fresh tab is exercised by entry-screen.spec. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript((key) => {
      sessionStorage.setItem(key, '1')
    }, entryStorageKey)
    await use(page)
  },
})

export { expect }
