import { expect, test, type Page } from '@playwright/test'

const phoneViewports = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 430, height: 932 },
  { width: 360, height: 800 },
]

async function scrollToBottom(page: Page, browserName: string) {
  if (browserName === 'chromium') {
    const viewport = page.viewportSize()!
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.synthesizeScrollGesture', {
      x: Math.round(viewport.width / 2),
      y: Math.round(viewport.height * 0.6),
      yDistance: -4000,
      gestureSourceType: 'touch',
      speed: 5000,
    })
  } else {
    for (let step = 0; step < 10; step += 1) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(80)
    }
  }
  await page.waitForTimeout(300)
}

async function footerLayout(page: Page) {
  return page.evaluate(() => {
    const footer = document.querySelector<HTMLElement>('.site-footer')!.getBoundingClientRect()
    const content = document.querySelector<HTMLElement>('.site-content')!.getBoundingClientRect()
    const root = document.documentElement
    return {
      scrollY: window.scrollY,
      maxScroll: root.scrollHeight - window.innerHeight,
      footerTop: footer.top + window.scrollY,
      footerBottom: footer.bottom + window.scrollY,
      footerCentreOffset: (footer.left + footer.right) / 2 - window.innerWidth / 2,
      contentBottom: content.bottom + window.scrollY,
      documentHeight: root.scrollHeight,
      horizontalOverflow: root.scrollWidth > window.innerWidth,
    }
  })
}

for (const viewport of phoneViewports) {
  test.describe(`phone layout at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, hasTouch: true })

    test('home scrolls to the full About Me window with the footer after it', async ({ page, browserName }) => {
      await page.goto('/')
      const intro = page.locator('.mobile-home-content > section.retro-window--intro')
      await expect(intro).toBeVisible()
      await scrollToBottom(page, browserName)
      const layout = await footerLayout(page)
      expect(layout.maxScroll).toBeGreaterThan(0)
      expect(layout.scrollY).toBeGreaterThanOrEqual(layout.maxScroll - 2)
      await expect(page.getByRole('link', { name: /more about me/i })).toBeInViewport()
      const introBox = await intro.boundingBox()
      expect(introBox!.y + introBox!.height + layout.scrollY).toBeLessThanOrEqual(layout.footerTop)
      expect(layout.footerTop).toBeGreaterThanOrEqual(layout.contentBottom - 1)
      expect(layout.documentHeight - layout.footerBottom).toBeLessThanOrEqual(24)
      expect(Math.abs(layout.footerCentreOffset)).toBeLessThanOrEqual(2)
      expect(layout.horizontalOverflow).toBe(false)
      await expect(page.locator('.site-footer p')).toHaveText([
        '© Sanjevan Rajasegar 2026',
        'Website Developed by Sanjevan Rajasegar, Inspired by bicflame',
      ])
    })

    test('projects keeps the footer after the window and the background contained', async ({ page }) => {
      await page.goto('/projects')
      await expect(page.locator('section.projects-workspace')).toBeVisible()
      const layout = await footerLayout(page)
      const windowBox = await page.locator('section.projects-workspace').boundingBox()
      expect(windowBox!.y + windowBox!.height).toBeLessThanOrEqual(layout.footerTop)
      expect(layout.documentHeight - layout.footerBottom).toBeLessThanOrEqual(24)
      expect(layout.horizontalOverflow).toBe(false)
      const stage = await page.locator('.morphing-background__stage').boundingBox()
      expect(stage!.x).toBeGreaterThanOrEqual(0)
      expect(stage!.x + stage!.width).toBeLessThanOrEqual(viewport.width)
      expect(Math.abs(stage!.x + stage!.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1)
    })

    test('Spotto media preview is compact with the caption strip inside its frame', async ({ page }) => {
      await page.goto('/projects')
      await page.getByRole('option', { name: 'Spotto' }).click()
      await page.getByRole('tab', { name: 'Media' }).click()
      const stage = await page.locator('.project-media__stage').boundingBox()
      const frame = page.locator('.project-media__current--youtube')
      const frameBox = await frame.boundingBox()
      const playerBox = await frame.locator('.project-media__youtube').boundingBox()
      await expect(frame.locator('.project-media__frame-caption')).toHaveText('Spotto Pitch Video')
      expect(frameBox!.width).toBeLessThanOrEqual(stage!.width * 0.8)
      expect(frameBox!.y + frameBox!.height).toBeLessThanOrEqual(stage!.y + stage!.height + 1)
      expect(Math.abs(playerBox!.width / playerBox!.height - 16 / 9)).toBeLessThan(0.03)
      await expect(page.getByRole('button', { name: 'Next media' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Maximise media' })).toBeVisible()
      await expect(page.locator('.project-media__thumbnail')).toHaveCount(5)
    })
  })
}
