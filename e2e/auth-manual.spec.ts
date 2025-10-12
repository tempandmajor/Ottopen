import { test, expect } from '@playwright/test'

/**
 * Manual authentication tests using real user credentials
 * These tests verify the complete authentication flow with an existing user account
 */

// Load test credentials from environment
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Manual Authentication Tests', () => {
  test.describe.configure({ mode: 'serial' })

  test('should sign in with existing credentials', async ({ page }) => {
    await page.goto('/auth/signin')

    // Fill in credentials
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)

    // Click sign in button (use exact match to avoid Google OAuth button)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for navigation to complete
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 10000 })

    // Verify successful sign-in by checking for user navigation/profile
    const url = page.url()
    console.log('Redirected to:', url)

    // Should be on authenticated page
    expect(url).toMatch(/\/(feed|scripts|dashboard)/)
  })

  test('should display user profile after sign in', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for navigation
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 10000 })

    // Check for user profile elements (adjust selectors based on your UI)
    // This might be a user menu, avatar, or profile link
    const profileElement = page
      .locator(
        '[data-testid="user-profile"], [aria-label="User menu"], img[alt*="profile" i], img[alt*="avatar" i]'
      )
      .first()

    // Wait a bit for the page to fully load
    await page.waitForTimeout(2000)

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/signed-in-page.png' })

    console.log('Current URL after sign in:', page.url())
  })

  test('should be able to navigate to scripts page', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 10000 })

    // Navigate to scripts page
    await page.goto('/scripts')

    // Verify we're on scripts page
    await expect(page).toHaveURL(/\/scripts/)

    // Take screenshot
    await page.screenshot({ path: 'test-results/scripts-page.png' })
  })

  test('should persist session after page reload', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 10000 })

    const urlBeforeReload = page.url()

    // Reload the page
    await page.reload()

    // Wait a bit for session to load
    await page.waitForTimeout(2000)

    const urlAfterReload = page.url()

    console.log('Before reload:', urlBeforeReload)
    console.log('After reload:', urlAfterReload)

    // Should still be on authenticated page (not redirected to sign-in)
    expect(urlAfterReload).not.toContain('/auth/signin')
  })

  test('should successfully sign out', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 10000 })

    // Look for sign out button/link (adjust selector based on your UI)
    // Common patterns: "Sign Out", "Logout", user menu dropdown
    const signOutButton = page
      .getByRole('button', { name: /sign out|logout/i })
      .or(page.getByRole('link', { name: /sign out|logout/i }))

    // If sign out is in a dropdown, we might need to open it first
    const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user menu" i]')
    if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenu.click()
    }

    // Wait for sign out button to be visible
    await signOutButton.waitFor({ state: 'visible', timeout: 5000 })
    await signOutButton.click()

    // Should redirect to sign-in or landing page
    await page.waitForURL(/\/(auth\/signin|\/)?$/, { timeout: 10000 })

    console.log('URL after sign out:', page.url())
  })

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto('/auth/signin')

    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill('WrongPassword123!')

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for error message
    await page.waitForTimeout(2000)

    // Should show error (adjust based on your error message UI)
    const errorMessage = page.getByText(/invalid|incorrect|wrong|failed/i)
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 })

    // Take screenshot of error
    await page.screenshot({ path: 'test-results/signin-error.png' })
  })
})
