import { expect, test, type Page } from '@playwright/test'

const desktopViewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1728, height: 972 },
  { width: 1920, height: 1080 },
]

async function expectAppInsideHeaderAndNavigation(page: Page, appSelector: string) {
  const bounds = await page.evaluate((selector) => {
    const app = document.querySelector<HTMLElement>(selector)
    const header = document.querySelector<HTMLElement>('.site-header')
    const nav = document.querySelector<HTMLElement>('.site-nav')
    if (!app || !header || !nav) throw new Error(`Missing layout element for ${selector}`)
    return {
      app: app.getBoundingClientRect().toJSON(),
      header: header.getBoundingClientRect().toJSON(),
      nav: nav.getBoundingClientRect().toJSON(),
    }
  }, appSelector)

  expect(bounds.app.top, `${appSelector} should clear the header by 24px`).toBeGreaterThanOrEqual(bounds.header.bottom + 23)
  expect(bounds.app.bottom, `${appSelector} should clear the navigation by 24px`).toBeLessThanOrEqual(bounds.nav.top - 23)
}

for (const viewport of desktopViewports) {
  test.describe(`desktop ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    test('Projects window fits while retaining its controls and scrollable content', async ({ page }) => {
      await page.goto('/projects')
      const app = page.locator('section.projects-workspace')
      await expect(app).toBeVisible()
      await expectAppInsideHeaderAndNavigation(page, 'section.projects-workspace')
      await expect(app.locator('.retro-window__titlebar')).toBeVisible()
      await expect(app.locator('.project-explorer')).toBeVisible()
      await expect(app.locator('.project-browser__tabs')).toBeVisible()
      const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)
      expect(pageOverflow).toBe(false)
    })

    test('Media Finder fits with its titlebar, toolbar and status bar visible', async ({ page }) => {
      await page.goto('/media')
      const app = page.locator('section.media-finder-window')
      await expect(app).toBeVisible()
      await expectAppInsideHeaderAndNavigation(page, 'section.media-finder-window')
      await expect(app.locator(':scope > .retro-window__titlebar')).toBeVisible()
      await expect(app.locator('.finder-toolbar')).toBeVisible()
      await expect(app.locator('.finder-status')).toBeVisible()
      const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)
      expect(pageOverflow).toBe(false)
    })

    test('Contact window and social shortcuts both fit between the header and navigation', async ({ page }) => {
      await page.goto('/contact')
      const app = page.locator('section.contact-window')
      await expect(app).toBeVisible()
      await expect(page.locator('.contact-shortcuts')).toBeVisible()
      await expectAppInsideHeaderAndNavigation(page, 'section.contact-window')
      const bounds = await page.evaluate(() => {
        const contact = document.querySelector<HTMLElement>('section.contact-window')
        const shortcuts = document.querySelector<HTMLElement>('.contact-shortcuts')
        const nav = document.querySelector<HTMLElement>('.site-nav')
        if (!contact || !shortcuts || !nav) throw new Error('Missing Contact layout element')
        return {
          contact: contact.getBoundingClientRect().toJSON(),
          shortcuts: shortcuts.getBoundingClientRect().toJSON(),
          nav: nav.getBoundingClientRect().toJSON(),
        }
      })
      expect(bounds.shortcuts.top).toBeGreaterThanOrEqual(bounds.contact.bottom + 23)
      expect(bounds.shortcuts.bottom).toBeLessThanOrEqual(bounds.nav.top - 23)
      await expect(app.locator('#contact-name')).toBeVisible()
      await expect(app.locator('#contact-email')).toBeVisible()
      await expect(app.locator('#contact-message')).toBeVisible()
      await expect(app.getByRole('button', { name: /send message/i })).toBeVisible()
      const scrollBody = app.locator(':scope > .retro-window__body')
      const initialOverflow = await scrollBody.evaluate((body) => body.scrollHeight > body.clientHeight)
      expect(initialOverflow, 'desktop Contact form should fit without hiding its submit button').toBe(false)
      for (const selector of ['.contact-panel__title', '#contact-name', '#contact-email', '#contact-message', '.contact-form__submit']) {
        const element = app.locator(selector)
        await element.scrollIntoViewIfNeeded()
        const isInsideScrollViewport = await page.evaluate((target) => {
          const body = document.querySelector<HTMLElement>('section.contact-window > .retro-window__body')
          const content = document.querySelector<HTMLElement>(`section.contact-window ${target}`)
          if (!body || !content) return false
          const viewport = body.getBoundingClientRect()
          const bounds = content.getBoundingClientRect()
          return bounds.top >= viewport.top - 1 && bounds.bottom <= viewport.bottom + 1
        }, selector)
        expect(isInsideScrollViewport, `${selector} should be reachable within the Contact content viewport`).toBe(true)
      }
      await scrollBody.evaluate((body) => { body.scrollTop = 0 })
      const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)
      expect(pageOverflow).toBe(false)
    })

    test('maximised windows still open and dismiss with Escape', async ({ page }) => {
      const windows = [
        { route: '/projects', section: 'section.projects-workspace', dialog: 'dialog.projects-workspace' },
        { route: '/media', section: 'section.media-finder-window', dialog: 'dialog.media-finder-window' },
        { route: '/contact', section: 'section.contact-window', dialog: 'dialog.contact-window' },
      ]

      for (const item of windows) {
        await page.goto(item.route)
        const section = page.locator(item.section)
        await section.getByRole('button', { name: /maximise/i }).click()
        const dialog = page.locator(`${item.dialog}[open]`)
        await expect(dialog).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
      }
    })

    test('the red control closes the maximised view', async ({ page }) => {
      await page.goto('/projects')
      const section = page.locator('section.projects-workspace')
      await section.getByRole('button', { name: /maximise/i }).click()
      const dialog = page.locator('dialog.projects-workspace[open]')
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Close expanded Projects window' }).click()
      await expect(dialog).toBeHidden()
      await expect(section).toBeVisible()
    })

    test('Spotto YouTube caption sits below the player through gallery transitions', async ({ page }) => {
      await page.goto('/projects')
      await page.getByRole('option', { name: 'Spotto' }).click()
      await page.getByRole('tab', { name: 'Media' }).click()
      const frame = page.locator('.project-media__current--youtube')
      const caption = page.locator('.project-media__caption--standalone')
      await expect(frame).toBeVisible()
      await expect(caption).toHaveText('Spotto Pitch Video')
      const initial = await frame.boundingBox()
      const captionBounds = await caption.boundingBox()
      expect(initial && captionBounds && captionBounds.y).toBeGreaterThan(initial!.y + initial!.height - 1)
      await page.getByRole('button', { name: 'Next media' }).click()
      await expect(page.locator('.project-media__current--image')).toBeVisible()
      await page.getByRole('button', { name: 'Previous media' }).click()
      await expect(frame.locator('iframe, .project-media__youtube-poster')).toBeVisible()
    })
  })
}

for (const viewport of [{ width: 1024, height: 1366 }, { width: 430, height: 932 }]) {
  test.describe(`responsive regression ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    for (const route of ['/projects', '/media', '/contact']) {
      test(`${route} remains visible without horizontal overflow`, async ({ page }) => {
        await page.goto(route)
        const selector = route === '/projects' ? 'section.projects-workspace' : route === '/media' ? 'section.media-finder-window' : 'section.contact-window'
        await expect(page.locator(selector)).toBeVisible()
        const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
        expect(horizontalOverflow).toBe(false)
      })
    }
  })
}
