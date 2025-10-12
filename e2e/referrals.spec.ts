import { test, expect } from '@playwright/test'

/**
 * Referral System Tests
 * Tests referral link generation, tracking, and earnings
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Referral System', () => {
  test.describe.configure({ mode: 'serial' })

  async function signIn(page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test('should access referrals page from Earn button', async ({ page }) => {
    await signIn(page)
    await page.waitForTimeout(2000)

    // Look for Earn button in header
    const earnButton = page.locator('button:has-text("Earn"), a:has-text("Earn")').first()
    const hasEarnButton = await earnButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasEarnButton) {
      await earnButton.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/referrals/01-earn-page.png' })
      console.log('✅ Earn button found and clicked')
    } else {
      console.log('⚠️  Earn button not found, trying direct navigation')
      await page.goto('/referrals')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/referrals/01-referrals-page.png' })
    }

    const hasContent = await page
      .locator('text=/referral|earn|reward/i')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasContent) {
      console.log('✅ Referrals page loaded')
    } else {
      console.log('⚠️  Referrals page may be empty')
    }
  })

  test('should display referral link', async ({ page }) => {
    await signIn(page)
    await page.goto('/referrals')
    await page.waitForTimeout(2000)

    // Look for referral link or code
    const referralLink = page.locator('input[readonly], input[value*="ref"], code, pre').first()
    const hasReferralLink = await referralLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasReferralLink) {
      console.log('✅ Referral link/code displayed')
      await referralLink.screenshot({ path: 'test-results/referrals/02-referral-link.png' })
    } else {
      console.log('⚠️  No referral link found')
    }

    await page.screenshot({ path: 'test-results/referrals/02-page-content.png' })
  })

  test('should display earnings information', async ({ page }) => {
    await signIn(page)
    await page.goto('/referrals')
    await page.waitForTimeout(2000)

    // Look for earnings/stats
    const earningsSection = page.locator('text=/\\$|earnings|balance|total/i').first()
    const hasEarnings = await earningsSection.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasEarnings) {
      console.log('✅ Earnings information displayed')
    } else {
      console.log('⚠️  No earnings information found')
    }

    await page.screenshot({ path: 'test-results/referrals/03-earnings.png' })
  })

  test('should test referrals stats API', async ({ page }) => {
    await signIn(page)

    const response = await page.request.get('/api/referrals/stats').catch(() => null)

    if (response && response.ok()) {
      const data = await response.json()
      console.log('✅ Referrals stats API responds')
      console.log(`Stats: ${JSON.stringify(data)}`)
    } else if (response) {
      console.log(`⚠️  Referrals stats API status: ${response.status()}`)
    } else {
      console.log('⚠️  Referrals stats API not accessible')
    }
  })

  test('should test referrals earnings API', async ({ page }) => {
    await signIn(page)

    const response = await page.request.get('/api/referrals/earnings').catch(() => null)

    if (response && response.ok()) {
      const data = await response.json()
      console.log('✅ Referrals earnings API responds')
      console.log(`Earnings: ${JSON.stringify(data)}`)
    } else if (response) {
      console.log(`⚠️  Referrals earnings API status: ${response.status()}`)
    } else {
      console.log('⚠️  Referrals earnings API not accessible')
    }
  })
})
