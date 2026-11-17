import { expect, test } from './fixtures'

test.describe('Contact form responses', () => {
  test('keeps form values and shows a friendly message for empty and malformed API responses', async ({ page }) => {
    let requestCount = 0
    await page.route('**/api/contact', async (route) => {
      requestCount += 1
      if (requestCount === 1) {
        await route.fulfill({ status: 502, contentType: 'text/html', body: '' })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{not json' })
      }
    })
    await page.goto('/contact')
    await page.locator('#contact-name').fill('Alex Example')
    await page.locator('#contact-email').fill('alex@example.com')
    await page.locator('#contact-message').fill('Please keep this message if sending fails.')

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await page.getByRole('button', { name: /SEND MESSAGE/ }).click()
      await expect(page.locator('.contact-form__status')).toHaveText('We could not send your message right now. Please try again in a moment.')
      await expect(page.locator('#contact-name')).toHaveValue('Alex Example')
      await expect(page.locator('#contact-email')).toHaveValue('alex@example.com')
      await expect(page.locator('#contact-message')).toHaveValue('Please keep this message if sending fails.')
    }
  })

  test('clears fields only after the API confirms success', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    }))
    await page.goto('/contact')
    await page.locator('#contact-name').fill('Alex Example')
    await page.locator('#contact-email').fill('alex@example.com')
    await page.locator('#contact-message').fill('A message that should clear after confirmation.')
    await page.getByRole('button', { name: /SEND MESSAGE/ }).click()
    await expect(page.locator('.contact-form__status')).toHaveText('MESSAGE SENT SUCCESSFULLY ✓')
    await expect(page.locator('#contact-name')).toHaveValue('')
    await expect(page.locator('#contact-email')).toHaveValue('')
    await expect(page.locator('#contact-message')).toHaveValue('')
  })
})

test('the homepage header has no Enter button and retains its Resume shortcut', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.enter-site-button')).toHaveCount(0)
  await expect(page.locator('.site-utilities .resume-shortcut')).toBeVisible()
})
