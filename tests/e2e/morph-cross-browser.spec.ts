import { type Browser, type Page } from '@playwright/test'
import { expect, test } from './fixtures'

type Sample = { x: number; y: number; inside: boolean }

const viewports = [
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'phone small', width: 375, height: 667 },
  { name: 'phone landscape', width: 844, height: 390 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
]

async function hideForeground(page: Page) {
  await page.addStyleTag({ content: '.site-content, .site-header, .site-footer { visibility: hidden !important; }' })
}

async function setVisibility(page: Page, visibility: 'hidden' | 'visible') {
  await page.evaluate((nextVisibility) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: nextVisibility })
    document.dispatchEvent(new Event('visibilitychange'))
  }, visibility)
}

/** Points just outside and inside every column's top and bottom edge, from the live clip path. */
async function edgeSamples(page: Page): Promise<Sample[]> {
  return page.evaluate(() => {
    const layer = document.querySelector<HTMLElement>('.morphing-background__masked')!
    const stage = document.querySelector<HTMLElement>('.morphing-background__stage')!.getBoundingClientRect()
    const scale = stage.width / layer.offsetWidth
    const numbers = (getComputedStyle(layer).clipPath.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
    const points: Array<[number, number]> = []
    for (let index = 0; index + 1 < numbers.length; index += 2) points.push([numbers[index], numbers[index + 1]])
    const half = points.length / 2
    const top = points.slice(0, half)
    const bottom = points.slice(half).reverse()
    const offset = Math.max(10, 5 / scale)
    const samples: Array<{ x: number; y: number; inside: boolean }> = []
    for (let index = 1; index < top.length; index += 2) {
      const [x0, y0] = top[index - 1]
      const [x1] = top[index]
      if (x1 - x0 < 30) continue
      const centre = (x0 + x1) / 2
      const bottomY = bottom[index][1]
      const toScreen = (x: number, y: number) => ({ x: stage.left + x * scale, y: stage.top + y * scale })
      for (const [y, inside] of [[y0 - offset, false], [y0 + offset * 2, true], [bottomY + offset, false], [bottomY - offset * 2, true]] as const) {
        const point = toScreen(centre, y)
        if (point.x < 1 || point.y < 1 || point.x > innerWidth - 2 || point.y > innerHeight - 2) continue
        samples.push({ ...point, inside })
      }
    }
    return samples
  })
}

async function classify(browser: Browser, screenshot: Buffer, samples: Sample[], canvas: [number, number, number]) {
  const page = await browser.newPage()
  const colours = await page.evaluate(async ({ data, samples }) => {
    const image = new Image()
    image.src = `data:image/png;base64,${data}`
    await image.decode()
    const element = document.createElement('canvas')
    element.width = image.width
    element.height = image.height
    const context = element.getContext('2d')!
    context.drawImage(image, 0, 0)
    return samples.map(({ x, y }) => Array.from(context.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3)))
  }, { data: screenshot.toString('base64'), samples })
  await page.close()
  return samples.map((sample, index) => {
    const [r, g, b] = colours[index]
    const isCanvas = Math.abs(r - canvas[0]) <= 14 && Math.abs(g - canvas[1]) <= 14 && Math.abs(b - canvas[2]) <= 14
    const isLime = g > b + 25 && g >= r - 10
    return { ...sample, rgb: [r, g, b], ok: sample.inside ? isLime : isCanvas }
  })
}

async function expectClippedToShape(page: Page, browser: Browser, label: string, canvas: [number, number, number]) {
  const samples = await edgeSamples(page)
  expect(samples.length, `${label}: edge samples`).toBeGreaterThan(8)
  const results = await classify(browser, await page.screenshot(), samples, canvas)
  const outsideFailures = results.filter((result) => !result.inside && !result.ok)
  const inside = results.filter((result) => result.inside)
  expect(outsideFailures, `${label}: lime must not appear outside the stepped shape`).toEqual([])
  expect(inside.filter((result) => result.ok).length, `${label}: inside the shape is lime`).toBeGreaterThanOrEqual(Math.ceil(inside.length * 0.85))
}

async function expectStageContained(page: Page) {
  const layout = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.morphing-background__stage')!.getBoundingClientRect()
    const background = document.querySelector<HTMLElement>('.morphing-background')!
    return {
      stage: stage.toJSON(),
      viewport: { width: innerWidth, height: innerHeight },
      backgroundPosition: getComputedStyle(background).position,
      documentWidth: document.documentElement.scrollWidth,
    }
  })
  expect(layout.backgroundPosition).toBe('fixed')
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport.width)
  if (layout.stage.width <= layout.viewport.width) {
    expect(Math.abs(layout.stage.left + layout.stage.width / 2 - layout.viewport.width / 2)).toBeLessThanOrEqual(1.5)
  } else {
    expect(layout.stage.left).toBeLessThanOrEqual(0)
  }
  return layout
}

for (const viewport of viewports) {
  test.describe(`morph background, ${viewport.name} ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const theme of ['light', 'dark'] as const) {
      const canvas: [number, number, number] = theme === 'light' ? [0xe8, 0xe8, 0xe5] : [0x1b, 0x1d, 0x20]

      test(`${theme}: clipped to the stepped shape at rest and mid-morph`, async ({ page, browser }) => {
        await page.addInitScript((storedTheme) => localStorage.setItem('sanjevan-theme', storedTheme), theme)
        await page.goto('/')
        await hideForeground(page)
        await page.waitForTimeout(700)
        const layout = await expectStageContained(page)
        if (viewport.width <= 640 && viewport.height > viewport.width) {
          expect(layout.stage.left).toBeGreaterThanOrEqual(0)
          expect(layout.stage.left + layout.stage.width).toBeLessThanOrEqual(viewport.width)
        }
        await expectClippedToShape(page, browser, 'home at rest', canvas)

        for (const route of ['/projects', '/media', '/about', '/contact', '/']) {
          await page.evaluate((target) => {
            history.pushState({}, '', target)
            dispatchEvent(new PopStateEvent('popstate'))
          }, route)
          await page.waitForTimeout(140)
          await setVisibility(page, 'hidden')
          await expectClippedToShape(page, browser, `${route} mid-morph`, canvas)
          await setVisibility(page, 'visible')
          await page.waitForTimeout(650)
          await expectClippedToShape(page, browser, `${route} at rest`, canvas)
        }
      })
    }
  })
}

test.describe('morph background resilience', () => {
  test('stays contained through rotation and resize', async ({ page, browser }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await hideForeground(page)
    await page.waitForTimeout(600)
    for (const size of [{ width: 844, height: 390 }, { width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 360, height: 800 }]) {
      await page.setViewportSize(size)
      await page.waitForTimeout(700)
      await expectStageContained(page)
      await expectClippedToShape(page, browser, `${size.width}x${size.height}`, [0xe8, 0xe8, 0xe5])
    }
  })

  test('reduced motion renders the final shape without animating', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await hideForeground(page)
    await page.waitForTimeout(300)
    await page.evaluate(() => {
      history.pushState({}, '', '/projects')
      dispatchEvent(new PopStateEvent('popstate'))
    })
    const first = await page.locator('.morphing-background__masked').evaluate((layer) => getComputedStyle(layer).clipPath)
    await page.waitForTimeout(120)
    const second = await page.locator('.morphing-background__masked').evaluate((layer) => getComputedStyle(layer).clipPath)
    expect(second).toBe(first)
    await expectClippedToShape(page, browser, 'reduced motion', [0xe8, 0xe8, 0xe5])
    await context.close()
  })

  test('mobile scrolling leaves the background fixed and adds no document height', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForTimeout(500)
    const before = await page.locator('.morphing-background__stage').boundingBox()
    const heightWithBackground = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(200)
    const after = await page.locator('.morphing-background__stage').boundingBox()
    expect(after).toEqual(before)
    await page.addStyleTag({ content: '.morphing-background { display: none !important; }' })
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(heightWithBackground)
  })

  test('no animation frames run once the morph settles', async ({ page }) => {
    await page.addInitScript(() => {
      const testWindow = window as Window & { __frames?: number }
      testWindow.__frames = 0
      const native = window.requestAnimationFrame.bind(window)
      window.requestAnimationFrame = (callback) => {
        testWindow.__frames! += 1
        return native(callback)
      }
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.waitForTimeout(1500)
    const settled = await page.evaluate(() => (window as Window & { __frames?: number }).__frames ?? 0)
    await page.waitForTimeout(1500)
    expect(await page.evaluate(() => (window as Window & { __frames?: number }).__frames ?? 0)).toBe(settled)
  })
})
