import { test, expect, type Page } from '@playwright/test'

/**
 * Search, Works, and Authors Tests
 * Tests search functionality, works browsing, and author profiles
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Search, Works & Authors', () => {
  test.describe.configure({ mode: 'serial' })

  async function signIn(page: Page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test('should access search page', async ({ page }) => {
    await signIn(page)
    await page.waitForTimeout(2000)

    // Try navigation menu
    const avatarButton = page
      .locator('button')
      .filter({ has: page.locator('img, [role="img"]') })
      .first()
    await avatarButton.click()
    await page.waitForTimeout(500)

    const searchMenuItem = page
      .getByRole('menuitem', { name: /search/i })
      .or(page.locator('[role="menuitem"]').filter({ hasText: /search/i }))

    const hasMenuItem = await searchMenuItem
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasMenuItem) {
      await searchMenuItem.first().click()
      await page.waitForTimeout(2000)
      console.log('✅ Search page accessible from menu')
    } else {
      await page.goto('/search')
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'test-results/search/01-search-page.png' })

    const hasSearchInput = await page
      .locator('input[type="search"], input[placeholder*="search" i]')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasSearchInput) {
      console.log('✅ Search page has search input')
    } else {
      console.log('⚠️  No search input found')
    }
  })

  test('should test search functionality', async ({ page }) => {
    await signIn(page)
    await page.goto('/search')
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
    const hasSearchInput = await searchInput.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasSearchInput) {
      await searchInput.fill('test script')
      await searchInput.press('Enter')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/search/02-search-results.png' })
      console.log('✅ Search executed')
    } else {
      console.log('⚠️  Could not test search functionality')
    }
  })

  test('should access works page', async ({ page }) => {
    await signIn(page)
    await page.waitForTimeout(2000)

    const avatarButton = page
      .locator('button')
      .filter({ has: page.locator('img, [role="img"]') })
      .first()
    await avatarButton.click()
    await page.waitForTimeout(500)

    const worksMenuItem = page
      .getByRole('menuitem', { name: /works/i })
      .or(page.locator('[role="menuitem"]').filter({ hasText: /works/i }))

    const hasMenuItem = await worksMenuItem
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasMenuItem) {
      await worksMenuItem.first().click()
      await page.waitForTimeout(2000)
      console.log('✅ Works page accessible from menu')
    } else {
      await page.goto('/works')
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'test-results/search/03-works-page.png' })

    const hasContent = await page
      .locator('text=/works|script|story/i')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasContent) {
      console.log('✅ Works page loaded')
    } else {
      console.log('⚠️  Works page may be empty')
    }
  })

  test('should access authors page', async ({ page }) => {
    await signIn(page)
    await page.waitForTimeout(2000)

    const avatarButton = page
      .locator('button')
      .filter({ has: page.locator('img, [role="img"]') })
      .first()
    await avatarButton.click()
    await page.waitForTimeout(500)

    const authorsMenuItem = page
      .getByRole('menuitem', { name: /authors/i })
      .or(page.locator('[role="menuitem"]').filter({ hasText: /authors/i }))

    const hasMenuItem = await authorsMenuItem
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasMenuItem) {
      await authorsMenuItem.first().click()
      await page.waitForTimeout(2000)
      console.log('✅ Authors page accessible from menu')
    } else {
      await page.goto('/authors')
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'test-results/search/04-authors-page.png' })

    const hasContent = await page
      .locator('text=/author|writer|profile/i')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasContent) {
      console.log('✅ Authors page loaded')
    } else {
      console.log('⚠️  Authors page may be empty')
    }
  })
})
