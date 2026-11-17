import { expect, test } from '@playwright/test'

const phoneViewports = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 360, height: 800 },
]

const routes = ['/', '/projects', '/media', '/about', '/contact']

for (const viewport of phoneViewports) {
  test.describe(`morph background at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true })

    for (const theme of ['light', 'dark'] as const) {
      test(`${theme} theme stays centred and contained through route changes`, async ({ page }) => {
        await page.addInitScript((storedTheme) => localStorage.setItem('sanjevan-theme', storedTheme), theme)

        for (const route of routes) {
          await page.goto(route)
          await expect(page.locator('.morphing-background')).toBeVisible()
          await expect(page.locator('.morphing-background__masked')).toHaveCSS('clip-path', /^path\(/)
          const layout = await page.evaluate(() => {
            const stage = document.querySelector<HTMLElement>('.morphing-background__stage')
            const background = document.querySelector<HTMLElement>('.morphing-background')
            if (!stage || !background) throw new Error('Morphing background is missing')
            const bounds = stage.getBoundingClientRect()
            return {
              left: bounds.left,
              top: bounds.top,
              width: bounds.width,
              height: bounds.height,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight,
              horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
              backgroundOverflow: background.scrollHeight > background.clientHeight || background.scrollWidth > background.clientWidth,
              backgroundZIndex: getComputedStyle(background).zIndex,
              theme: document.documentElement.dataset.theme,
            }
          })

          expect(layout.left).toBeGreaterThanOrEqual(-1)
          expect(layout.left + layout.width).toBeLessThanOrEqual(layout.viewportWidth + 1)
          expect(layout.top).toBeGreaterThanOrEqual(-1)
          expect(layout.top + layout.height).toBeLessThanOrEqual(layout.viewportHeight + 1)
          expect(Math.abs(layout.left + layout.width / 2 - layout.viewportWidth / 2)).toBeLessThanOrEqual(1)
          expect(Math.abs(layout.top + layout.height / 2 - layout.viewportHeight / 2)).toBeLessThanOrEqual(2)
          expect(layout.horizontalOverflow).toBe(false)
          expect(layout.backgroundOverflow, `${route} background should not overflow`).toBe(false)
          expect(Number(layout.backgroundZIndex)).toBeLessThan(1)
          expect(layout.theme).toBe(theme)
        }
      })
    }
  })
}

for (const viewport of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
  test(`desktop/tablet morph background remains visible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    const layout = await page.locator('.morphing-background__stage').evaluate((stage) => {
      const rect = stage.getBoundingClientRect()
      const root = stage.parentElement?.getBoundingClientRect()
      return { width: rect.width, height: rect.height, rootWidth: root?.width, rootHeight: root?.height }
    })
    expect(layout.width).toBeGreaterThan(0)
    expect(layout.height).toBeGreaterThan(0)
    expect(layout.rootWidth).toBeGreaterThanOrEqual(viewport.width - 1)
    expect(layout.rootHeight).toBeGreaterThanOrEqual(viewport.height - 1)
    await expect(page.locator('.morphing-background__masked')).toHaveCSS('clip-path', /^path\(/)
  })
}
