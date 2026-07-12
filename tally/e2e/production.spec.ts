import { test, expect } from '@playwright/test'

test.describe('Lumber Logic production flows', () => {
  test('starts with empty calculator worksheet', async ({ page, isMobile }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Load tally' })).toBeVisible()
    if (!isMobile) {
      await expect(page.getByText('Total board ft')).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: 'Save load' })).toBeVisible()
    }
  })

  test('navigates to saved loads and settings', async ({ page }) => {
    await page.goto('/loads')
    await expect(page.getByRole('heading', { name: 'Your tally book' })).toBeVisible()
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Company & quote settings' })).toBeVisible()
  })

  test('price book shows three-price columns', async ({ page }) => {
    await page.goto('/prices')
    await expect(page.getByText('Market reference, acquisition cost, and selling price')).toBeVisible()
  })

  test('blocks quote send without company setup', async ({ page }) => {
    await page.goto('/loads')
    const empty = page.getByText('No loads match your search.')
    if (await empty.isVisible()) {
      test.skip()
    }
    const sendBtn = page.getByRole('button', { name: 'Send' }).first()
    if (await sendBtn.isVisible()) {
      await sendBtn.click()
      await expect(page.getByRole('alert')).toBeVisible()
    }
  })

  test('direct routes work in PWA', async ({ page }) => {
    await page.goto('/prices')
    await expect(page).toHaveURL(/\/prices/)
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings/)
  })
})
