import { type Page } from '@playwright/test'
import { expect, test } from './fixtures'

type AudioWindow = Window & { __homeAudioPlayCalls?: number }

async function countPlayCalls(page: Page) {
  await page.addInitScript(() => {
    const nativePlay = HTMLMediaElement.prototype.play
    ;(window as AudioWindow).__homeAudioPlayCalls = 0
    HTMLMediaElement.prototype.play = function () {
      if (this.classList.contains('home-audio')) (window as AudioWindow).__homeAudioPlayCalls! += 1
      return nativePlay.call(this)
    }
  })
}

const playCalls = (page: Page) => page.evaluate(() => (window as AudioWindow).__homeAudioPlayCalls ?? 0)
const audioPaused = (page: Page) => page.locator('audio.home-audio').evaluate((element) => (element as HTMLAudioElement).paused)

async function setVisibility(page: Page, visibility: 'hidden' | 'visible') {
  await page.evaluate((nextVisibility) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: nextVisibility })
    document.dispatchEvent(new Event('visibilitychange'))
  }, visibility)
}

test.describe('phones never play music', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('no play() through load, navigation, taps and tab changes', async ({ page }) => {
    await countPlayCalls(page)
    await page.goto('/')
    await page.waitForTimeout(800)
    await page.touchscreen.tap(195, 420)
    for (const route of ['projects', 'media', 'about', 'home']) {
      await page.getByRole('link', { name: route, exact: true }).tap()
      await page.waitForTimeout(300)
    }
    await setVisibility(page, 'hidden')
    await setVisibility(page, 'visible')
    await page.mouse.click(10, 400)
    await page.keyboard.press('Tab')
    await page.waitForTimeout(500)
    expect(await playCalls(page)).toBe(0)
    expect(await audioPaused(page)).toBe(true)
    expect(await page.locator('audio.home-audio').evaluate((element) => element.hasAttribute('src'))).toBe(false)
  })
})

test.describe('entering the phone breakpoint', () => {
  test.use({ viewport: { width: 1366, height: 900 } })

  test('pauses playing music and does not resume it', async ({ page }) => {
    await page.goto('/media')
    const player = page.locator('.spotify-player__play')
    if (await player.getAttribute('aria-pressed') !== 'true') await player.click()
    await expect.poll(() => audioPaused(page), { timeout: 10_000 }).toBe(false)

    await page.setViewportSize({ width: 390, height: 844 })
    await expect.poll(() => audioPaused(page)).toBe(true)
    await setVisibility(page, 'hidden')
    await setVisibility(page, 'visible')
    await page.mouse.click(10, 400)
    await page.waitForTimeout(800)
    expect(await audioPaused(page)).toBe(true)
  })
})
