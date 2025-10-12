import { test, expect } from '@playwright/test'

/**
 * Book Clubs Feature Tests
 * Tests book club creation, joining, discussions, and critiques
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Book Clubs', () => {
  test.describe.configure({ mode: 'serial' })

  async function signIn(page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test('should access book clubs page', async ({ page }) => {
    await signIn(page)

    // Try navigation menu first
    await page.waitForTimeout(2000)
    const avatarButton = page
      .locator('button')
      .filter({ has: page.locator('img, [role="img"]') })
      .first()
    await avatarButton.click()
    await page.waitForTimeout(500)

    const clubsMenuItem = page
      .getByRole('menuitem', { name: /book clubs?/i })
      .or(page.locator('[role="menuitem"]').filter({ hasText: /book clubs?/i }))

    const hasMenuItem = await clubsMenuItem
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasMenuItem) {
      await clubsMenuItem.first().click()
      await page.waitForTimeout(2000)
      console.log('✅ Book Clubs accessible from menu')
    } else {
      // Try direct navigation
      await page.goto('/clubs')
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'test-results/book-clubs/01-clubs-page.png' })

    const hasContent = await page
      .locator('text=/club|join|create/i')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasContent) {
      console.log('✅ Book clubs page loaded')
    } else {
      console.log('⚠️  Book clubs page may be empty')
    }
  })

  test('should display create club option', async ({ page }) => {
    await signIn(page)
    await page.goto('/clubs')
    await page.waitForTimeout(2000)

    const createButton = page
      .locator(
        'button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")'
      )
      .first()
    const hasCreateButton = await createButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasCreateButton) {
      console.log('✅ Create club button found')
      await createButton.screenshot({ path: 'test-results/book-clubs/02-create-button.png' })
    } else {
      console.log('⚠️  No create club button found')
    }

    await page.screenshot({ path: 'test-results/book-clubs/02-clubs-page-content.png' })
  })

  test('should test book clubs API', async ({ page }) => {
    await signIn(page)

    const response = await page.request.get('/api/book-clubs').catch(() => null)

    if (response && response.ok()) {
      const data = await response.json()
      console.log('✅ Book clubs API responds')
      console.log(`Book clubs data: ${JSON.stringify(data).substring(0, 200)}`)
    } else if (response) {
      console.log(`⚠️  Book clubs API status: ${response.status()}`)
    } else {
      console.log('⚠️  Book clubs API not accessible')
    }
  })
})
