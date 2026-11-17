import { expect, test, type Page } from '@playwright/test'

type AudioWindow = Window & { __playAt?: number; __playCalls?: number }

async function recordPlay(page: Page) {
  await page.addInitScript(() => {
    const nativePlay = HTMLMediaElement.prototype.play
    const testWindow = window as AudioWindow
    testWindow.__playCalls = 0
    HTMLMediaElement.prototype.play = function () {
      if (this.classList.contains('home-audio')) {
        testWindow.__playAt = performance.now()
        testWindow.__playCalls = (testWindow.__playCalls ?? 0) + 1
      }
      return nativePlay.call(this)
    }
  })
}

const playCalls = (page: Page) => page.evaluate(() => (window as AudioWindow).__playCalls ?? 0)
const dialog = (page: Page) => page.getByRole('dialog', { name: "Welcome to Sanjevan's Portfolio" })

test.describe('desktop entry', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('a fresh visit enters once, starts playback from the click, then stays dismissed', async ({ page, browser }) => {
    await recordPlay(page)
    await page.goto('/')
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'ENTER' })).toBeFocused()
    await expect(page.getByRole('link', { name: 'projects', exact: true })).toHaveCount(0)
    await expect(page.locator('.site')).toHaveCSS('opacity', '0')
    expect(await page.locator('.site').evaluate((element) => element.hasAttribute('inert'))).toBe(true)

    const started = Date.now()
    await page.getByRole('button', { name: 'ENTER' }).click()
    expect(await playCalls(page)).toBeGreaterThan(0)
    await expect(dialog(page)).toBeVisible()
    expect(Date.now() - started).toBeLessThan(1000)

    await expect(dialog(page)).toBeHidden({ timeout: 5_000 })
    await expect(page.locator('.site-header .wordmark')).toBeVisible()
    await expect.poll(() => page.locator('audio.home-audio').evaluate((element) => (element as HTMLAudioElement).paused)).toBe(false)

    await page.reload()
    await expect(dialog(page)).toHaveCount(0)
    await page.getByRole('link', { name: 'about', exact: true }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(dialog(page)).toHaveCount(0)

    const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const nextTab = await fresh.newPage()
    await nextTab.goto('/')
    await expect(dialog(nextTab)).toBeVisible()
    await fresh.close()
  })

  test('Enter and Space both start playback from the button', async ({ browser }) => {
      for (const key of ['Enter', 'Space'] as const) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
      const page = await context.newPage()
      await recordPlay(page)
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'ENTER' })).toBeFocused()
      await page.keyboard.press(key)
      expect(await playCalls(page)).toBeGreaterThan(0)
      await expect(dialog(page)).toBeVisible()
      await context.close()
    }
  })

  test('a direct /projects visit stays on projects and plays that track', async ({ page }) => {
    await recordPlay(page)
    await page.goto('/projects')
    await expect(dialog(page)).toBeVisible()
    await page.getByRole('button', { name: 'ENTER' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.locator('section.projects-workspace')).toBeVisible()
    await expect.poll(() => page.locator('audio.home-audio').evaluate((element) => (element as HTMLAudioElement).src)).toMatch(/Roses/)
  })

  test('a direct /contact visit stays on contact without starting a track', async ({ page }) => {
    await recordPlay(page)
    await page.goto('/contact')
    await page.getByRole('button', { name: 'ENTER' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.getByRole('region', { name: 'Contact form' })).toBeVisible()
    expect(await playCalls(page)).toBe(0)
  })
})

test.describe('tablet entry', () => {
  test.use({ viewport: { width: 820, height: 1180 } })

  test('a fresh tablet visit shows the entry screen', async ({ page }) => {
    await page.goto('/')
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByRole('link', { name: 'home', exact: true })).toHaveCount(0)
  })
})

test.describe('phone entry', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('a phone opens the site and never plays', async ({ page }) => {
    await recordPlay(page)
    await page.goto('/')
    await page.waitForTimeout(600)
    await expect(dialog(page)).toHaveCount(0)
    await expect(page.locator('.site-header .wordmark')).toBeVisible()
    expect(await playCalls(page)).toBe(0)
    expect(await page.locator('audio.home-audio').evaluate((element) => element.hasAttribute('src'))).toBe(false)
  })
})

test.describe('entry resize and reduced motion', () => {
  test('resizing onto a phone dismisses the entry without sound and restores it afterwards', async ({ page }) => {
    await recordPlay(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(dialog(page)).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(dialog(page)).toHaveCount(0)
    expect(await playCalls(page)).toBe(0)
    const audio = page.locator('audio.home-audio')
    expect(await audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
    expect(await audio.evaluate((element) => element.hasAttribute('src'))).toBe(false)
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(dialog(page)).toBeVisible()
  })

  test('reduced motion reveals immediately and still plays from the click', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await recordPlay(page)
    await page.goto('/')
    const started = Date.now()
    await page.getByRole('button', { name: 'ENTER' }).click()
    await expect(dialog(page)).toHaveCount(0)
    expect(Date.now() - started).toBeLessThan(1_000)
    expect(await playCalls(page)).toBeGreaterThan(0)
    await context.close()
  })
})
