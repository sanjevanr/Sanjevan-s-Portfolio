import { expect, test, type Page } from '@playwright/test'

async function openPortfolios(page: Page) {
  await page.goto('/media')
  const photoShortcut = page.getByRole('button', { name: 'Photo', exact: true })
  if (await photoShortcut.count()) await photoShortcut.click()
  else await page.getByRole('option', { name: 'Photo', exact: true }).dblclick()
  await page.getByRole('option', { name: 'Portfolios', exact: true }).dblclick()
}

async function expectPdfCanvasHasArtwork(page: Page, pageNumber: number) {
  const canvas = page.locator(`.ibooks-page canvas[aria-label="Page ${pageNumber}"]`)
  await expect(canvas).toBeVisible({ timeout: 60_000 })
  await expect.poll(() => canvas.evaluate((node) => {
    const canvas = node as HTMLCanvasElement
    if (!canvas.width || !canvas.height) return false
    const context = canvas.getContext('2d')
    if (!context) return false
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data
    let variedSamples = 0
    const xStep = Math.max(1, Math.floor(canvas.width / 96))
    const yStep = Math.max(1, Math.floor(canvas.height / 96))
    for (let y = 0; y < canvas.height; y += yStep) {
      for (let x = 0; x < canvas.width; x += xStep) {
        const offset = (y * canvas.width + x) * 4
        if (data[offset] < 232 || data[offset + 1] < 232 || data[offset + 2] < 232) variedSamples += 1
      }
    }
    return variedSamples
  }), { timeout: 60_000 }).toBeGreaterThan(0)
}

test.describe('Media photography portfolios', () => {
  test('Finder folders and Capsules empty state are navigable', async ({ page }) => {
    await page.goto('/media')
    await page.getByRole('button', { name: 'Photo', exact: true }).click()
    await expect(page.getByRole('option', { name: 'Portfolios', exact: true })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Capsules', exact: true })).toBeVisible()
    await page.getByRole('option', { name: 'Capsules', exact: true }).dblclick()
    await expect(page.getByText('This folder is empty')).toBeVisible()
    await expect(page.getByText('Future photo collections will appear here.')).toBeVisible()
    await page.getByRole('button', { name: 'Video', exact: true }).click()
    await expect(page.getByRole('option')).toHaveCount(7)
  })

  test('Selected Works renders, turns pages, zooms, downloads and returns to Finder', async ({ page }) => {
    test.setTimeout(120_000)
    await openPortfolios(page)
    const covers = page.locator('.finder-book img')
    await expect(covers).toHaveCount(2)
    await expect.poll(async () => covers.evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
    await page.getByRole('option', { name: 'Selected Works', exact: true }).dblclick()
    await expect(page.getByRole('dialog', { name: 'Reading Selected Works' })).toBeVisible()
    await expect(page.locator('.ibooks-reader__loading')).toHaveCount(0)
    await expect(page.getByText(/Opening Selected Works/)).toBeHidden()
    const reader = page.getByRole('dialog', { name: 'Reading Selected Works' })
    const titleCenter = async () => reader.locator('.ibooks-toolbar__title').evaluate((title) => {
      const titleBounds = title.getBoundingClientRect()
      const readerBounds = title.closest('.ibooks-reader')!.getBoundingClientRect()
      return Math.abs((titleBounds.left + titleBounds.right) / 2 - (readerBounds.left + readerBounds.right) / 2)
    })
    await expect.poll(titleCenter).toBeLessThan(1)
    await expectPdfCanvasHasArtwork(page, 1)
    await expect.poll(titleCenter).toBeLessThan(1)
    await expect(page.getByRole('button', { name: 'Fit page' })).toBeVisible()
    const widthBeforeFit = await page.locator('.ibooks-page canvas').first().evaluate((canvas) => canvas.getBoundingClientRect().width)
    await page.getByRole('button', { name: 'Fit width' }).click()
    await expect.poll(() => page.locator('.ibooks-page canvas').first().evaluate((canvas) => canvas.getBoundingClientRect().width)).toBeGreaterThan(widthBeforeFit)
    await page.getByRole('button', { name: 'Fit page' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Download PDF' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('Sanjevan-Rajasegar-Selected-Works.pdf')

    const originalWidth = await page.locator('.ibooks-page canvas').first().evaluate((canvas) => canvas.getBoundingClientRect().width)
    await page.getByRole('button', { name: 'Next page' }).click()
    await expectPdfCanvasHasArtwork(page, 2)
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect.poll(() => page.locator('.ibooks-page canvas').first().evaluate((canvas) => canvas.getBoundingClientRect().width)).toBeGreaterThan(originalWidth)
    await page.getByRole('button', { name: 'Fit width' }).click()
    await page.getByRole('button', { name: 'Zoom in' }).click()
    for (let index = 0; index < 11; index += 1) await page.getByRole('button', { name: 'Zoom in' }).click()
    const stage = page.locator('.ibooks-stage')
    await expect.poll(() => stage.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true)
    const pageBounds = await page.locator('.ibooks-page canvas').first().boundingBox()
    if (!pageBounds) throw new Error('The page canvas is not available for panning.')
    await page.mouse.move(pageBounds.x + pageBounds.width / 2, pageBounds.y + pageBounds.height / 2)
    await page.mouse.down()
    await page.mouse.move(pageBounds.x + pageBounds.width / 2 - 140, pageBounds.y + pageBounds.height / 2, { steps: 8 })
    await page.mouse.up()
    await expect.poll(() => stage.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect.poll(() => stage.evaluate((node) => node.scrollLeft)).toBe(0)
    await page.getByLabel('Go to page').fill('4')
    await page.getByLabel('Go to page').press('Enter')
    await expect(page.locator('.ibooks-page canvas[aria-label="Page 4"]')).toBeVisible()

    await page.getByRole('button', { name: 'Back to Finder' }).click()
    await expect(page.getByRole('dialog', { name: 'Reading Selected Works' })).toBeHidden()
    await expect(page.getByRole('option', { name: 'Selected Works' })).toHaveAttribute('aria-selected', 'true')
  })

  test('THE JAPANESE EVERYMAN opens from the supplied local PDF and downloads with its descriptive filename', async ({ page }) => {
    test.setTimeout(120_000)
    await openPortfolios(page)
    const pdfResponses: string[] = []
    page.on('response', (response) => {
      if (response.url().includes('/portfolios/the-japanese-everyman.pdf')) {
        void response.allHeaders().then((headers) => pdfResponses.push(`${response.status()} ${headers['content-range'] ?? 'full response'}`))
      }
    })
    const firstPageStartedAt = Date.now()
    await page.getByRole('option', { name: 'THE JAPANESE EVERYMAN', exact: true }).dblclick()
    await expect(page.getByRole('dialog', { name: 'Reading THE JAPANESE EVERYMAN' })).toBeVisible()
    await expectPdfCanvasHasArtwork(page, 1)
    const firstPageMs = Date.now() - firstPageStartedAt
    console.info(`[portfolio performance] THE JAPANESE EVERYMAN first visible page: ${firstPageMs}ms`)
    console.info(`[portfolio performance] PDF responses: ${pdfResponses.join(', ')}`)
    expect(firstPageMs).toBeLessThan(15_000)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Download PDF' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('Sanjevan-Rajasegar-The-Japanese-Everyman.pdf')
    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(page.locator('.ibooks-page canvas[aria-label="Page 2"]')).toBeVisible()
    await expect(page.locator('.ibooks-page canvas[aria-label="Page 3"]')).toBeVisible()
    await expectPdfCanvasHasArtwork(page, 3)
  })

  test('rapidly closes and switches between the locally hosted portfolios without stale pages', async ({ page }) => {
    test.setTimeout(120_000)
    await openPortfolios(page)
    for (const [name, firstPage] of [['Selected Works', 1], ['THE JAPANESE EVERYMAN', 1]] as const) {
      await page.getByRole('option', { name, exact: true }).dblclick()
      await expect(page.getByRole('dialog', { name: `Reading ${name}` })).toBeVisible()
      await expectPdfCanvasHasArtwork(page, firstPage)
      await page.getByRole('button', { name: 'Back to Finder' }).click()
      await expect(page.getByRole('dialog', { name: `Reading ${name}` })).toBeHidden()
    }
  })

  test.describe('phone reader', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

    test('Touch opens folders and books with a single tap and shows one page at a time', async ({ page }) => {
    await page.goto('/media')
    await page.getByRole('option', { name: 'Photo', exact: true }).tap()
    await page.getByRole('option', { name: 'Portfolios', exact: true }).tap()
    await page.getByRole('option', { name: 'Selected Works', exact: true }).tap()
    await expect(page.getByRole('dialog', { name: 'Reading Selected Works' })).toBeVisible()
    const reader = page.getByRole('dialog', { name: 'Reading Selected Works' })
    await expect(reader.getByRole('button', { name: 'Fit page' })).toBeHidden()
    await expect(reader.getByRole('button', { name: 'Fit width' })).toBeHidden()
    await expect(reader.getByRole('button', { name: 'Reset zoom' })).toBeVisible()
    await expect(reader.locator('.ibooks-control--fullscreen')).toHaveCount(0)
    await reader.locator('.ibooks-toolbar__more > summary').click()
    await expect(reader.locator('.ibooks-toolbar__menu a')).toHaveCount(1)
    await expect(reader.locator('.ibooks-toolbar__menu a[download]')).toBeVisible()
    const headerAlignment = await reader.locator('.ibooks-control--back').evaluate((back) => {
      const title = document.querySelector('.ibooks-toolbar__title')!.getBoundingClientRect()
      const backBounds = back.getBoundingClientRect()
      const controls = document.querySelector('.ibooks-toolbar__controls')!.getBoundingClientRect()
      return {
        titleCentered: Math.abs((title.left + title.right) / 2 - (document.querySelector('.ibooks-reader')!.getBoundingClientRect().width / 2)) < 1,
        backSharesControlsRow: Math.abs((backBounds.top + backBounds.bottom) / 2 - (controls.top + controls.bottom) / 2) < 1,
      }
    })
    expect(headerAlignment.titleCentered).toBe(true)
    expect(headerAlignment.backSharesControlsRow).toBe(true)
    await expectPdfCanvasHasArtwork(page, 1)
    await expect(page.locator('.ibooks-page canvas[aria-label="Page 2"]')).toHaveCount(0)
    await expect(page.locator('.site--media .media-player-window')).toBeHidden()
    })

    test('THE JAPANESE EVERYMAN uses the centered mobile titlebar and shared controls row', async ({ page }) => {
      await page.goto('/media')
      await page.getByRole('option', { name: 'Photo', exact: true }).tap()
      await page.getByRole('option', { name: 'Portfolios', exact: true }).tap()
      await page.getByRole('option', { name: 'THE JAPANESE EVERYMAN', exact: true }).tap()
      const reader = page.getByRole('dialog', { name: 'Reading THE JAPANESE EVERYMAN' })
      await expect(reader).toBeVisible()
      await expectPdfCanvasHasArtwork(page, 1)
      const alignment = await reader.evaluate((dialog) => {
        const bounds = (node: Element) => node.getBoundingClientRect()
        const title = bounds(dialog.querySelector('.ibooks-toolbar__title')!)
        const readerBounds = bounds(dialog)
        const controls = bounds(dialog.querySelector('.ibooks-toolbar__controls')!)
        const back = bounds(dialog.querySelector('.ibooks-control--back')!)
        return {
          title: Math.abs((title.left + title.right) / 2 - (readerBounds.left + readerBounds.right) / 2),
          back: Math.abs((back.top + back.bottom) / 2 - (controls.top + controls.bottom) / 2),
        }
      })
      expect(alignment.title).toBeLessThan(1)
      expect(alignment.back).toBeLessThan(1)
    })
  })
})

for (const viewport of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
  test.describe(`iPad reader ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    test('uses a single portrait page or a facing-page spread as space allows', async ({ page }) => {
      test.setTimeout(120_000)
      await openPortfolios(page)
      await page.getByRole('option', { name: 'THE JAPANESE EVERYMAN', exact: true }).dblclick()
      await expect(page.getByRole('dialog', { name: 'Reading THE JAPANESE EVERYMAN' }).getByRole('button', { name: 'Fit page' })).toBeHidden()
      await expect(page.getByRole('dialog', { name: 'Reading THE JAPANESE EVERYMAN' }).getByRole('button', { name: 'Fit width' })).toBeHidden()
      await expect(page.locator('.ibooks-reader__loading')).toHaveCount(0)
      await expectPdfCanvasHasArtwork(page, 1)
      await page.getByRole('button', { name: 'Next page' }).click()
      await expect(page.locator('.ibooks-page canvas[aria-label="Page 2"]')).toBeVisible()
      if (viewport.width <= 820) {
        await page.getByRole('button', { name: 'Next page' }).click()
        await expectPdfCanvasHasArtwork(page, 3)
        await expect(page.locator('.ibooks-page canvas[aria-label="Page 4"]')).toHaveCount(0)
      } else {
        await expectPdfCanvasHasArtwork(page, 3)
        await expect(page.locator('.ibooks-page canvas[aria-label="Page 4"]')).toHaveCount(0)
        await expect(page.locator('.ibooks-page-area')).toHaveClass(/ibooks-pages--spread/)
        const spineOverlay = await page.locator('.ibooks-page-area').evaluate((area) => getComputedStyle(area, '::before').content)
        expect(spineOverlay).toBe('none')
        await page.getByRole('button', { name: 'Next page' }).click()
        await expect(page.locator('.ibooks-page canvas[aria-label="Page 5"]')).toBeVisible()
      }
    })
  })
}

for (const viewport of [
  { width: 320, height: 568 }, { width: 375, height: 667 }, { width: 393, height: 852 },
  { width: 430, height: 932 }, { width: 667, height: 375 }, { width: 820, height: 1180 },
  { width: 1180, height: 820 }, { width: 1366, height: 768 }, { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test.describe(`reader toolbar ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    test('keeps the title stable, controls responsive and default page inside the viewport', async ({ page }) => {
      await openPortfolios(page)
      await page.getByRole('option', { name: 'Selected Works', exact: true }).dblclick()
      const reader = page.getByRole('dialog', { name: 'Reading Selected Works' })
      await expect(reader).toBeVisible()
      await expectPdfCanvasHasArtwork(page, 1)
      const isTabletOrSmaller = viewport.width <= 1180
      const isPhone = viewport.width <= 520
      if (isTabletOrSmaller) {
        await expect(reader.getByRole('button', { name: 'Fit page' })).toBeHidden()
        await expect(reader.getByRole('button', { name: 'Fit width' })).toBeHidden()
      } else {
        await expect(reader.getByRole('button', { name: 'Fit page' })).toBeVisible()
        await expect(reader.getByRole('button', { name: 'Fit width' })).toBeVisible()
      }
      await expect(reader.locator('.ibooks-control--fullscreen')).toHaveCount(0)
      await expect(reader.locator('.ibooks-toolbar__controls a[download]')).toHaveCount(1)
      if (isPhone) {
        await expect(reader.locator('.ibooks-toolbar__more > summary')).toBeVisible()
      } else {
        await expect(reader.locator('.ibooks-toolbar__more')).toBeHidden()
        await expect(reader.getByRole('link', { name: 'Download PDF' })).toBeVisible()
      }
      const layout = await page.evaluate(() => {
        const reader = document.querySelector('.ibooks-reader')!
        const stage = document.querySelector('.ibooks-stage')!
        const canvas = stage.querySelector('canvas')!
        const back = document.querySelector('.ibooks-control--back')!
        const title = document.querySelector('.ibooks-toolbar__title')!
        const controls = document.querySelector('.ibooks-toolbar__controls')!
        const bounds = (node: Element) => node.getBoundingClientRect()
        return {
          pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
          toolbarOverflow: bounds(reader).width < bounds(back).right || bounds(reader).width < bounds(title).right,
          controlsOverflow: (document.querySelector('.ibooks-toolbar__controls') as HTMLElement).scrollWidth > (document.querySelector('.ibooks-toolbar__controls') as HTMLElement).clientWidth,
          titleCenterDifference: Math.abs((bounds(title).left + bounds(title).right) / 2 - (bounds(reader).left + bounds(reader).right) / 2),
          backSharesControlsRow: Math.abs((bounds(back).top + bounds(back).bottom) / 2 - (bounds(controls).top + bounds(controls).bottom) / 2),
          controlsBelowTitlebar: bounds(controls).top >= bounds(title).bottom - 1,
          pageWithinStageAtFit: bounds(canvas).width <= bounds(stage).width,
          visibleControlsWithinReader: [...document.querySelectorAll<HTMLElement>('.ibooks-toolbar__controls .ibooks-control')]
            .filter((control) => control.getClientRects().length > 0)
            .every((control) => {
              const controlBounds = bounds(control)
              return controlBounds.left >= bounds(reader).left && controlBounds.right <= bounds(reader).right
            }),
          firstControlIsFinder: document.querySelector('.ibooks-toolbar__controls .ibooks-control')?.classList.contains('ibooks-control--back') ?? false,
          controlRowAlignment: (() => {
            const centers = [...document.querySelectorAll<HTMLElement>('.ibooks-toolbar__controls .ibooks-control')]
              .filter((control) => control.getClientRects().length > 0)
              .map((control) => (bounds(control).top + bounds(control).bottom) / 2)
            return Math.max(...centers) - Math.min(...centers)
          })(),
          controlCenters: [...document.querySelectorAll<HTMLElement>('.ibooks-toolbar__controls .ibooks-control')]
            .filter((control) => control.getClientRects().length > 0)
            .map((control) => ({ className: control.className, top: bounds(control).top, bottom: bounds(control).bottom })),
        }
      })
      expect(layout.pageOverflow).toBe(false)
      expect(layout.toolbarOverflow).toBe(false)
      expect(layout.controlsOverflow).toBe(false)
      expect(layout.titleCenterDifference).toBeLessThan(1)
      expect(layout.backSharesControlsRow).toBeLessThan(1)
      expect(layout.controlsBelowTitlebar).toBe(true)
      expect(layout.pageWithinStageAtFit).toBe(true)
      expect(layout.visibleControlsWithinReader).toBe(true)
      expect(layout.firstControlIsFinder).toBe(true)
      expect(layout.controlRowAlignment, JSON.stringify(layout.controlCenters)).toBeLessThan(1)
    })
  })
}
