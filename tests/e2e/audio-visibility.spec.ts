import { type Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function startPlayback(page: Page) {
  await page.goto('/media')
  const player = page.locator('.spotify-player__play')
  const audio = page.locator('audio.home-audio')
  await expect(player).toBeVisible()
  if (await player.getAttribute('aria-pressed') !== 'true') await player.click()
  await expect(player).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => audio.evaluate((element) => !(element as HTMLAudioElement).paused), { timeout: 10_000 }).toBe(true)
  return { player, audio }
}

async function openSelectedWorks(page: Page) {
  await page.getByRole('button', { name: 'Photo', exact: true }).click()
  await page.getByRole('option', { name: 'Portfolios', exact: true }).dblclick()
  await page.getByRole('option', { name: 'Selected Works', exact: true }).dblclick()
  await expect(page.getByRole('dialog', { name: 'Reading Selected Works' })).toBeVisible()
}

async function setVisibility(page: Page, visibility: 'hidden' | 'visible') {
  await page.evaluate((nextVisibility) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: nextVisibility })
    document.dispatchEvent(new Event('visibilitychange'))
  }, visibility)
}

test.describe('shared music pause coordination', () => {
  test.use({ viewport: { width: 1366, height: 900 } })

  test('recovers blocked autoplay on the first trusted navigation interaction', async ({ page }) => {
    // Model Chrome's policy for a first visit: play() without user activation is rejected.
    await page.addInitScript(() => {
      const nativePlay = HTMLMediaElement.prototype.play
      ;(window as Window & { __portfolioAudioPlayCalls?: number }).__portfolioAudioPlayCalls = 0
      HTMLMediaElement.prototype.play = function () {
        if (this.classList.contains('home-audio')) {
          const testWindow = window as Window & { __portfolioAudioPlayCalls: number }
          testWindow.__portfolioAudioPlayCalls += 1
          if (!navigator.userActivation.hasBeenActive) return Promise.reject(new DOMException('Autoplay was blocked', 'NotAllowedError'))
        }
        return nativePlay.call(this)
      }
    })
    await page.goto('/')
    await expect.poll(() => page.evaluate(() => (window as Window & { __portfolioAudioPlayCalls?: number }).__portfolioAudioPlayCalls)).toBeGreaterThanOrEqual(1)
    const blockedCalls = await page.evaluate(() => (window as Window & { __portfolioAudioPlayCalls?: number }).__portfolioAudioPlayCalls ?? 0)
    expect(await page.locator('audio.home-audio').evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
    await page.getByRole('link', { name: 'projects', exact: true }).click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect.poll(() => page.evaluate(() => (window as Window & { __portfolioAudioPlayCalls?: number }).__portfolioAudioPlayCalls)).toBeGreaterThan(blockedCalls)
    await expect.poll(() => page.locator('audio.home-audio').evaluate((element) => !(element as HTMLAudioElement).paused), { timeout: 10_000 }).toBe(true)
  })

  test('a manual pause is not overridden by later interactions', async ({ page }) => {
    await page.goto('/')
    const player = page.locator('.spotify-player__play')
    await expect(player).toBeVisible()
    if (await player.getAttribute('aria-pressed') !== 'true') await player.click()
    await expect(player).toHaveAttribute('aria-pressed', 'true')
    await player.click()
    await expect(player).toHaveAttribute('aria-pressed', 'false')
    await page.mouse.click(5, 450)
    await page.keyboard.press('Shift')
    await page.waitForTimeout(500)
    expect(await page.locator('audio.home-audio').evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
  })

  test('uses the active route artwork as soon as its player renders', async ({ page }) => {
    await page.goto('/')
    const artwork = page.locator('.spotify-player__art img').first()
    const routeArtwork = [
      ['projects', 'late-registration-cover.webp'],
      ['media', 'ouroborus-cover.webp'],
      ['about', 'bodies-cover.webp'],
      ['home', 'nujabes-album-cover.webp'],
    ] as const
    for (const [route, imageName] of routeArtwork) {
      await page.getByRole('link', { name: route, exact: true }).click()
      await expect(artwork).toHaveAttribute('src', new RegExp(imageName.replaceAll('.', '\\.') + '$'))
    }
  })

  test('pauses for a portfolio and resumes at the same position after closing it', async ({ page }) => {
    const { player, audio } = await startPlayback(page)
    await openSelectedWorks(page)
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
    const pausePosition = await audio.evaluate((element) => (element as HTMLAudioElement).currentTime)
    await page.waitForTimeout(500)
    const whileOpen = await audio.evaluate((element) => (element as HTMLAudioElement).currentTime)
    expect(Math.abs(whileOpen - pausePosition)).toBeLessThan(0.05)

    await page.getByRole('button', { name: 'Back to Finder' }).click()
    await expect.poll(() => audio.evaluate((element) => !(element as HTMLAudioElement).paused)).toBe(true)
    await expect(player).toHaveAttribute('aria-pressed', 'true')
    const afterClose = await audio.evaluate((element) => (element as HTMLAudioElement).currentTime)
    expect(afterClose).toBeGreaterThanOrEqual(whileOpen)
    expect(afterClose - whileOpen).toBeLessThan(1)
  })

  test('does not auto-resume a manually paused track after closing a portfolio', async ({ page }) => {
    const { player, audio } = await startPlayback(page)
    await player.click()
    await expect(player).toHaveAttribute('aria-pressed', 'false')
    await openSelectedWorks(page)
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
    await page.getByRole('button', { name: 'Back to Finder' }).click()
    await expect(player).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
  })

  test('waits for both a hidden tab and a closed portfolio before resuming', async ({ page }) => {
    const { player, audio } = await startPlayback(page)
    await openSelectedWorks(page)
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
    await setVisibility(page, 'hidden')
    await page.getByRole('button', { name: 'Back to Finder' }).click()
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
    await setVisibility(page, 'visible')
    await expect.poll(() => audio.evaluate((element) => !(element as HTMLAudioElement).paused)).toBe(true)
    await expect(player).toHaveAttribute('aria-pressed', 'true')
  })

  test('pauses and resumes when the document visibility changes', async ({ page }) => {
    const { player, audio } = await startPlayback(page)
    await setVisibility(page, 'hidden')
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true)
    await setVisibility(page, 'visible')
    await expect.poll(() => audio.evaluate((element) => !(element as HTMLAudioElement).paused)).toBe(true)
    await expect(player).toHaveAttribute('aria-pressed', 'true')
  })
})
