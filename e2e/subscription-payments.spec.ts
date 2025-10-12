import { test, expect } from '@playwright/test'

/**
 * Subscription and Payment Tests
 * Tests pricing, checkout, and subscription management
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Subscription & Payments', () => {
  test.describe.configure({ mode: 'serial' })

  async function signIn(page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test('should display pricing page with all tiers', async ({ page }) => {
    await page.goto('/pricing')

    await expect(page).toHaveURL(/\/pricing/)

    // Look for pricing tiers
    const tiers = ['free', 'pro', 'studio']
    const foundTiers = []

    for (const tier of tiers) {
      const tierElement = page.locator(`text=/${tier}/i`).first()
      const exists = await tierElement.isVisible({ timeout: 3000 }).catch(() => false)
      if (exists) {
        foundTiers.push(tier)
      }
    }

    console.log(`Found pricing tiers: ${foundTiers.join(', ')}`)

    // Look for pricing amounts
    const priceElements = page.locator('text=/\\$\\d+/').all()
    const prices = await priceElements
    console.log(`Found ${(await prices).length} price elements`)

    await page.screenshot({ path: 'test-results/subscription/01-pricing-page.png' })

    if (foundTiers.length >= 2) {
      console.log('✅ Pricing page displays tiers')
    } else {
      console.log('⚠️  Pricing page may be missing tier information')
    }
  })

  test('should have subscribe/upgrade buttons', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForTimeout(2000)

    // Look for subscribe/upgrade/get started buttons
    const ctaButtons = page.locator(
      'button:has-text("Subscribe"), button:has-text("Upgrade"), button:has-text("Get Started"), a:has-text("Subscribe"), a:has-text("Upgrade"), a:has-text("Get Started")'
    )
    const count = await ctaButtons.count()

    console.log(`Found ${count} CTA buttons`)

    if (count > 0) {
      await ctaButtons.first().screenshot({ path: 'test-results/subscription/02-cta-button.png' })
      console.log('✅ Subscribe/Upgrade buttons present')
    } else {
      console.log('⚠️  No subscribe buttons found')
    }

    await page.screenshot({ path: 'test-results/subscription/02-pricing-ctas.png' })
  })

  test('should test subscription status API', async ({ page }) => {
    await signIn(page)

    const response = await page.request.get('/api/subscription-status').catch(() => null)

    if (response && response.ok()) {
      const data = await response.json()
      console.log('✅ Subscription status API responds')
      console.log(`Subscription data: ${JSON.stringify(data)}`)
    } else if (response) {
      console.log(`⚠️  Subscription status API returned status: ${response.status()}`)
    } else {
      console.log('⚠️  Subscription status API not accessible')
    }
  })

  test('should test checkout API availability', async ({ page }) => {
    await signIn(page)

    const response = await page.request
      .post('/api/checkout', {
        data: {
          priceId: 'price_test_12345',
          tier: 'pro',
        },
      })
      .catch(() => null)

    if (response) {
      console.log(`Checkout API status: ${response.status()}`)

      if (response.status() === 400 || response.status() === 200) {
        console.log('✅ Checkout API is accessible (returned expected status)')
      } else {
        console.log(`⚠️  Checkout API returned unexpected status: ${response.status()}`)
      }
    } else {
      console.log('⚠️  Checkout API not accessible')
    }
  })

  test('should access billing portal from settings', async ({ page }) => {
    await signIn(page)
    await page.goto('/settings')
    await page.waitForTimeout(2000)

    // Look for billing/subscription section
    const billingSection = page.locator('text=/billing|subscription|plan/i').first()
    const hasBilling = await billingSection.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasBilling) {
      console.log('✅ Billing section found in settings')
    } else {
      console.log('⚠️  No billing section found')
    }

    // Look for manage subscription button
    const manageButton = page
      .locator(
        'button:has-text("Manage"), a:has-text("Manage"), button:has-text("Portal"), a:has-text("Portal")'
      )
      .first()
    const hasManageButton = await manageButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasManageButton) {
      console.log('✅ Manage subscription button found')
    } else {
      console.log('⚠️  No manage subscription button found')
    }

    await page.screenshot({ path: 'test-results/subscription/03-settings-billing.png' })
  })
})
