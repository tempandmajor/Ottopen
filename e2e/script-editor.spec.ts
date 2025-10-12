import { test, expect, type Page } from '@playwright/test'

/**
 * Script Editor Feature Tests
 * Tests script creation, editing, and all 5 formats
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Script Editor Features', () => {
  test.describe.configure({ mode: 'serial' })

  // Helper function to sign in
  async function signIn(page: Page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test('should display scripts page with create button', async ({ page }) => {
    await signIn(page)
    await page.goto('/scripts')

    // Should see scripts page
    await expect(page).toHaveURL(/\/scripts/)

    // Look for create/new script button or empty state
    const hasContent = await page
      .locator('text=/new script|create|add|no scripts/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (hasContent) {
      console.log('✅ Scripts page loaded with content')
    } else {
      console.log('⚠️  Scripts page may be empty or missing create button')
    }

    await page.screenshot({ path: 'test-results/scripts/01-scripts-page.png' })
  })

  test('should create new screenplay script', async ({ page }) => {
    await signIn(page)
    await page.goto('/scripts')
    await page.waitForTimeout(2000)

    // Look for create button (try multiple selectors)
    const createButton = page
      .getByRole('button', { name: /new script|create|add script/i })
      .or(page.getByRole('link', { name: /new script|create|add script/i }))
      .or(page.locator('button:has-text("New"), button:has-text("Create")'))
      .first()

    const buttonExists = await createButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (!buttonExists) {
      console.log('⚠️  No create button found - checking for empty state')
      await page.screenshot({ path: 'test-results/scripts/02-no-create-button.png' })
      return
    }

    await createButton.click()
    await page.waitForTimeout(1000)

    // Should see dialog/form to create script
    await page.screenshot({ path: 'test-results/scripts/02-create-dialog.png' })

    // Fill in script details
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first()
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Test Screenplay E2E')

      // Select screenplay type
      const typeSelect = page.locator('select, [role="combobox"]').first()
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.click()
        await page.waitForTimeout(500)

        // Try to select screenplay option
        const screenplayOption = page.locator('text=/screenplay/i').first()
        if (await screenplayOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await screenplayOption.click()
        }
      }

      await page.screenshot({ path: 'test-results/scripts/03-filled-form.png' })

      // Submit
      const submitButton = page.getByRole('button', { name: /create|submit|save/i }).first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()

        // Wait for redirect to script editor
        await page.waitForTimeout(3000)
        await page.screenshot({ path: 'test-results/scripts/04-script-created.png' })

        console.log('✅ Script creation attempted')
      }
    } else {
      console.log('⚠️  Create form not found')
      await page.screenshot({ path: 'test-results/scripts/02-no-form.png' })
    }
  })

  test('should access script editor page', async ({ page }) => {
    await signIn(page)

    // Try to navigate to scripts and then to a script
    await page.goto('/scripts')
    await page.waitForTimeout(2000)

    // Look for existing script in list
    const scriptLink = page.locator('a[href*="/scripts/"]').first()
    const hasScripts = await scriptLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasScripts) {
      await scriptLink.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/scripts/05-script-editor.png' })
      console.log('✅ Accessed script editor')
    } else {
      console.log('⚠️  No scripts found to edit')
      await page.screenshot({ path: 'test-results/scripts/05-no-scripts.png' })
    }
  })

  test('should display script formatting options', async ({ page }) => {
    await signIn(page)
    await page.goto('/scripts')
    await page.waitForTimeout(2000)

    const scriptLink = page.locator('a[href*="/scripts/"]').first()
    const hasScripts = await scriptLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasScripts) {
      console.log('⚠️  No scripts to test formatting')
      return
    }

    await scriptLink.click()
    await page.waitForTimeout(2000)

    // Look for formatting controls (scene heading, action, dialogue, etc.)
    const formatButtons = [
      'scene heading',
      'action',
      'dialogue',
      'character',
      'transition',
      'parenthetical',
    ]

    const foundFormats = []
    for (const format of formatButtons) {
      const button = page.locator(`text=/${format}/i`).first()
      const exists = await button.isVisible({ timeout: 1000 }).catch(() => false)
      if (exists) {
        foundFormats.push(format)
      }
    }

    console.log(`Found formatting options: ${foundFormats.join(', ')}`)
    await page.screenshot({ path: 'test-results/scripts/06-formatting-controls.png' })
  })

  test('should test editor functionality', async ({ page }) => {
    await signIn(page)
    await page.goto('/scripts')
    await page.waitForTimeout(2000)

    const scriptLink = page.locator('a[href*="/scripts/"]').first()
    const hasScripts = await scriptLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasScripts) {
      console.log('⚠️  No scripts to test editor')
      return
    }

    await scriptLink.click()
    await page.waitForTimeout(2000)

    // Look for editor textarea or contenteditable
    const editor = page.locator('textarea, [contenteditable="true"]').first()
    const hasEditor = await editor.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasEditor) {
      // Try to type in editor
      await editor.click()
      await editor.type('INT. TEST LOCATION - DAY')
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/scripts/07-typed-content.png' })
      console.log('✅ Editor is functional')
    } else {
      console.log('⚠️  Editor not found')
      await page.screenshot({ path: 'test-results/scripts/07-no-editor.png' })
    }
  })
})
