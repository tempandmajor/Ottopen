import { test, expect } from '@playwright/test'

test.describe('Subscription & Billing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Replace with actual test user credentials when ready
    // For now, these tests will navigate but not complete checkout
    await page.goto('/')
  })

  test('should display pricing page', async ({ page }) => {
    await page.goto('/pricing')

    // Check for subscription tiers
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
    await expect(page.getByText('Studio')).toBeVisible()

    // Check for pricing amounts
    await expect(page.getByText('$20')).toBeVisible() // Pro
    await expect(page.getByText('$50')).toBeVisible() // Studio
  })

  test('should show subscription features', async ({ page }) => {
    await page.goto('/pricing')

    // Free tier features
    await expect(page.getByText(/1 active script/i)).toBeVisible()
    await expect(page.getByText(/10 AI requests/i)).toBeVisible()

    // Pro tier features
    await expect(page.getByText(/Unlimited scripts/i)).toBeVisible()
    await expect(page.getByText(/100 AI requests/i)).toBeVisible()

    // Studio tier features
    await expect(page.getByText(/Unlimited AI/i)).toBeVisible()
  })

  test('should navigate to checkout when upgrade button clicked', async ({ page }) => {
    await page.goto('/pricing')

    // Click Pro plan button (assuming user is signed in)
    const upgradeButtons = page.getByRole('button', { name: /Upgrade|Subscribe|Get Started/i })
    const firstButton = upgradeButtons.first()

    if (await firstButton.isVisible()) {
      await firstButton.click()
      // Should redirect to sign-in or checkout
      await page.waitForURL(/\/(auth\/signin|checkout|api\/checkout)/)
    }
  })

  test('should display billing portal link for subscribed users', async ({ page }) => {
    // TODO: This requires authenticated test user with subscription
    // For now, just verify the route exists
    const response = await page.request.post('/api/create-portal-session')
    expect(response.status()).toBeLessThan(500) // Should not be server error
  })
})
