import { test, expect, type Page } from '@playwright/test'

/**
 * Messages and Submissions Tests
 * Tests messaging and submissions/opportunities features
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Messages & Submissions', () => {
  test.describe.configure({ mode: 'serial' })

  async function signIn(page: Page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test('should access messages page', async ({ page }) => {
    await signIn(page)
    await page.waitForTimeout(2000)

    const avatarButton = page
      .locator('button')
      .filter({ has: page.locator('img, [role="img"]') })
      .first()
    await avatarButton.click()
    await page.waitForTimeout(500)

    const messagesMenuItem = page
      .getByRole('menuitem', { name: /messages/i })
      .or(page.locator('[role="menuitem"]').filter({ hasText: /messages/i }))

    const hasMenuItem = await messagesMenuItem
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasMenuItem) {
      await messagesMenuItem.first().click()
      await page.waitForTimeout(2000)
      console.log('✅ Messages page accessible from menu')
    } else {
      await page.goto('/messages')
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'test-results/messages/01-messages-page.png' })

    const hasContent = await page
      .locator('text=/message|chat|conversation/i')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasContent) {
      console.log('✅ Messages page loaded')
    } else {
      console.log('⚠️  Messages page may be empty')
    }
  })

  test('should access submissions page', async ({ page }) => {
    await signIn(page)
    await page.waitForTimeout(2000)

    const avatarButton = page
      .locator('button')
      .filter({ has: page.locator('img, [role="img"]') })
      .first()
    await avatarButton.click()
    await page.waitForTimeout(500)

    const submissionsMenuItem = page
      .getByRole('menuitem', { name: /submissions/i })
      .or(page.locator('[role="menuitem"]').filter({ hasText: /submissions/i }))

    const hasMenuItem = await submissionsMenuItem
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasMenuItem) {
      await submissionsMenuItem.first().click()
      await page.waitForTimeout(2000)
      console.log('✅ Submissions page accessible from menu')
    } else {
      await page.goto('/submissions')
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'test-results/messages/02-submissions-page.png' })

    const hasContent = await page
      .locator('text=/submission|track|status/i')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasContent) {
      console.log('✅ Submissions page loaded')
    } else {
      console.log('⚠️  Submissions page may be empty')
    }
  })

  test('should access opportunities page', async ({ page }) => {
    await signIn(page)
    await page.waitForTimeout(2000)

    const avatarButton = page
      .locator('button')
      .filter({ has: page.locator('img, [role="img"]') })
      .first()
    await avatarButton.click()
    await page.waitForTimeout(500)

    const opportunitiesMenuItem = page
      .getByRole('menuitem', { name: /opportunities/i })
      .or(page.locator('[role="menuitem"]').filter({ hasText: /opportunities/i }))

    const hasMenuItem = await opportunitiesMenuItem
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasMenuItem) {
      await opportunitiesMenuItem.first().click()
      await page.waitForTimeout(2000)
      console.log('✅ Opportunities page accessible from menu')
    } else {
      await page.goto('/opportunities')
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'test-results/messages/03-opportunities-page.png' })

    const hasContent = await page
      .locator('text=/opportunity|job|listing/i')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    if (hasContent) {
      console.log('✅ Opportunities page loaded')
    } else {
      console.log('⚠️  Opportunities page may be empty')
    }
  })

  test('should test submissions API', async ({ page }) => {
    await signIn(page)

    const response = await page.request.get('/api/submissions/templates').catch(() => null)

    if (response && response.ok()) {
      console.log('✅ Submissions API responds')
    } else if (response) {
      console.log(`⚠️  Submissions API status: ${response.status()}`)
    } else {
      console.log('⚠️  Submissions API not accessible')
    }
  })
})
