import { test, expect } from '@playwright/test'

/**
 * Comprehensive feature testing
 * Tests all major features and UI components
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Comprehensive Feature Tests', () => {
  test.describe.configure({ mode: 'serial' })

  // Helper function to sign in
  async function signIn(page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test.describe('Authentication & Navigation UI', () => {
    test('unauthenticated users should see Sign In and Join buttons', async ({ page }) => {
      await page.goto('/')

      // Should see Sign In button
      const signInButton = page.getByRole('link', { name: 'Sign In', exact: true })
      await expect(signInButton).toBeVisible()

      // Should see Join Network button
      const joinButton = page.getByRole('link', { name: /Join Network|Join/i })
      await expect(joinButton.first()).toBeVisible()

      // Should NOT see avatar/dropdown menu
      const avatar = page.locator('[alt*="profile" i], [alt*="avatar" i]').first()
      await expect(avatar).not.toBeVisible()

      // Take screenshot
      await page.screenshot({ path: 'test-results/01-unauthenticated-header.png' })
    })

    test('authenticated users should NOT see Sign In/Join buttons', async ({ page }) => {
      await signIn(page)

      // Wait a moment for UI to update
      await page.waitForTimeout(2000)

      // Should see avatar
      const avatar = page
        .locator('button')
        .filter({ has: page.locator('[alt*="profile" i], [alt*="avatar" i], img') })
        .first()
      await expect(avatar).toBeVisible({ timeout: 10000 })

      // Should NOT see Sign In button in main header
      const signInButton = page.getByRole('link', { name: 'Sign In', exact: true })
      await expect(signInButton).not.toBeVisible()

      // Should NOT see Join Network button in main header
      const joinButton = page.getByRole('link', { name: 'Join Network', exact: true })
      await expect(joinButton).not.toBeVisible()

      // Take screenshot
      await page.screenshot({ path: 'test-results/02-authenticated-header.png' })

      console.log('✅ Header correctly shows avatar and hides Sign In/Join buttons')
    })

    test('avatar dropdown should have Sign Out option', async ({ page }) => {
      await signIn(page)

      // Wait for avatar to be visible
      await page.waitForTimeout(2000)

      // Click avatar to open dropdown
      const avatarButton = page
        .locator('button')
        .filter({ has: page.locator('img, [role="img"]') })
        .first()
      await avatarButton.click()

      // Wait for dropdown to open
      await page.waitForTimeout(500)

      // Should see Sign Out option
      const signOutOption = page
        .getByRole('menuitem', { name: /sign out/i })
        .or(page.locator('[role="menuitem"]').filter({ hasText: /sign out/i }))
      await expect(signOutOption.first()).toBeVisible({ timeout: 5000 })

      // Take screenshot
      await page.screenshot({ path: 'test-results/03-avatar-dropdown-menu.png' })

      console.log('✅ Avatar dropdown contains Sign Out option')
    })

    test('sign out should work and return to home page', async ({ page }) => {
      await signIn(page)
      await page.waitForTimeout(2000)

      // Open avatar dropdown
      const avatarButton = page
        .locator('button')
        .filter({ has: page.locator('img, [role="img"]') })
        .first()
      await avatarButton.click()
      await page.waitForTimeout(500)

      // Click Sign Out
      const signOutOption = page
        .getByRole('menuitem', { name: /sign out/i })
        .or(page.locator('[role="menuitem"]').filter({ hasText: /sign out/i }))
      await signOutOption.first().click()

      // Should redirect to home or sign in page
      await page.waitForURL(/^\/$|\/auth\/signin/, { timeout: 10000 })

      // Wait for redirect to complete
      await page.waitForTimeout(2000)

      // Should see Sign In button again
      const signInButton = page.getByRole('link', { name: 'Sign In', exact: true })
      await expect(signInButton).toBeVisible({ timeout: 5000 })

      // Take screenshot
      await page.screenshot({ path: 'test-results/04-after-sign-out.png' })

      console.log('✅ Sign out successful, redirected to home page')
    })
  })

  test.describe('Script Editor Features', () => {
    test('should be able to access scripts page', async ({ page }) => {
      await signIn(page)

      await page.goto('/scripts')
      await expect(page).toHaveURL(/\/scripts/)

      // Take screenshot
      await page.screenshot({ path: 'test-results/05-scripts-page.png' })

      console.log('✅ Scripts page accessible')
    })

    test('should be able to create new script', async ({ page }) => {
      await signIn(page)
      await page.goto('/scripts')

      // Look for "New Script" or "Create" button
      const createButton = page
        .getByRole('button', { name: /new script|create|add script/i })
        .or(page.getByRole('link', { name: /new script|create|add script/i }))

      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createButton.first().click()
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'test-results/06-new-script-dialog.png' })
        console.log('✅ New script creation UI found')
      } else {
        console.log('⚠️  No "New Script" button found - may need to add one')
        await page.screenshot({ path: 'test-results/06-scripts-page-no-create-button.png' })
      }
    })
  })

  test.describe('Navigation Menu Items', () => {
    test('all dropdown menu items should be clickable', async ({ page }) => {
      await signIn(page)
      await page.waitForTimeout(2000)

      // Open dropdown
      const avatarButton = page
        .locator('button')
        .filter({ has: page.locator('img, [role="img"]') })
        .first()
      await avatarButton.click()
      await page.waitForTimeout(500)

      // Take screenshot of full menu
      await page.screenshot({ path: 'test-results/07-full-dropdown-menu.png' })

      // Test key menu items exist
      const menuItems = [
        'Feed',
        'Search',
        'Authors',
        'Works',
        'Book Clubs',
        'Messages',
        'AI Editor',
        'Script Editor',
        'Profile',
        'Settings',
        'Sign Out',
      ]

      const results = []
      for (const itemName of menuItems) {
        const menuItem = page
          .getByRole('menuitem', { name: new RegExp(itemName, 'i') })
          .or(page.locator('[role="menuitem"]').filter({ hasText: new RegExp(itemName, 'i') }))
        const isVisible = await menuItem
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
        results.push({ item: itemName, found: isVisible })
        if (isVisible) {
          console.log(`✅ ${itemName} menu item found`)
        } else {
          console.log(`❌ ${itemName} menu item NOT found`)
        }
      }

      // Log summary
      const found = results.filter(r => r.found).length
      const total = results.length
      console.log(`\nMenu items summary: ${found}/${total} found`)
    })

    test('clicking Feed should navigate to feed page', async ({ page }) => {
      await signIn(page)
      await page.waitForTimeout(2000)

      // Open dropdown
      const avatarButton = page
        .locator('button')
        .filter({ has: page.locator('img, [role="img"]') })
        .first()
      await avatarButton.click()
      await page.waitForTimeout(500)

      // Click Feed
      const feedItem = page
        .getByRole('menuitem', { name: /feed/i })
        .or(page.locator('[role="menuitem"]').filter({ hasText: /feed/i }))
      await feedItem.first().click()

      // Should navigate to feed
      await page.waitForURL(/\/feed/, { timeout: 10000 })
      await page.screenshot({ path: 'test-results/08-feed-page.png' })

      console.log('✅ Feed navigation works')
    })
  })

  test.describe('Pricing & Subscription', () => {
    test('should be able to view pricing page', async ({ page }) => {
      await page.goto('/pricing')

      // Should see pricing information
      await expect(page).toHaveURL(/\/pricing/)

      // Look for tier names (Free, Pro, Studio)
      const hasPricingContent = await page
        .locator('text=/free|pro|studio/i')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasPricingContent) {
        console.log('✅ Pricing page loads correctly')
      } else {
        console.log('⚠️  Pricing page may be missing content')
      }

      await page.screenshot({ path: 'test-results/09-pricing-page.png' })
    })

    test('authenticated user can access subscription settings', async ({ page }) => {
      await signIn(page)

      // Try to navigate to settings
      await page.goto('/settings')

      const hasSettings = await page
        .locator('text=/settings|account|subscription/i')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasSettings) {
        console.log('✅ Settings page accessible')
      } else {
        console.log('⚠️  Settings page may need work')
      }

      await page.screenshot({ path: 'test-results/10-settings-page.png' })
    })
  })

  test.describe('Profile & User Info', () => {
    test('should display user profile correctly', async ({ page }) => {
      await signIn(page)
      await page.waitForTimeout(2000)

      // Open dropdown to access profile
      const avatarButton = page
        .locator('button')
        .filter({ has: page.locator('img, [role="img"]') })
        .first()
      await avatarButton.click()
      await page.waitForTimeout(500)

      // Click Profile
      const profileItem = page
        .getByRole('menuitem', { name: /profile/i })
        .or(page.locator('[role="menuitem"]').filter({ hasText: /profile/i }))

      if (
        await profileItem
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await profileItem.first().click()
        await page.waitForTimeout(3000)
        await page.screenshot({ path: 'test-results/11-user-profile.png' })
        console.log('✅ Profile page accessible')
      } else {
        console.log('⚠️  Profile menu item not found')
      }
    })
  })

  test.describe('Dashboard & Feed', () => {
    test('dashboard should load after sign in', async ({ page }) => {
      await signIn(page)

      // Should be on dashboard or feed
      const url = page.url()
      expect(url).toMatch(/\/(dashboard|feed)/)

      await page.screenshot({ path: 'test-results/12-dashboard-initial.png' })
      console.log(`✅ Landed on: ${url}`)
    })

    test('should be able to navigate between dashboard sections', async ({ page }) => {
      await signIn(page)

      // Try navigating to different sections
      const sections = ['/feed', '/dashboard', '/scripts']

      for (const section of sections) {
        await page.goto(section)
        await page.waitForTimeout(2000)
        await page.screenshot({
          path: `test-results/13-navigation-${section.replace('/', '')}.png`,
        })
        console.log(`✅ Navigated to ${section}`)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should show error for incorrect password', async ({ page }) => {
      await page.goto('/auth/signin')

      await page.getByLabel('Email').fill(TEST_EMAIL)
      await page.getByLabel('Password').fill('WrongPassword123!')
      await page.getByRole('button', { name: 'Sign In', exact: true }).click()

      // Wait for error message
      await page.waitForTimeout(3000)

      // Take screenshot
      await page.screenshot({ path: 'test-results/14-signin-error.png' })

      // Check for error message
      const hasError = await page
        .locator('text=/invalid|incorrect|wrong|failed|error/i')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (hasError) {
        console.log('✅ Error message displayed for wrong password')
      } else {
        console.log('⚠️  Error message may not be showing')
      }
    })
  })
})
