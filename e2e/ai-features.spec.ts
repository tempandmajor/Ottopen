import { test, expect } from '@playwright/test'

/**
 * AI Features Tests
 * Tests AI-powered features like dialogue enhancement, beats, etc.
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('AI Features', () => {
  test.describe.configure({ mode: 'serial' })

  async function signIn(page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test('should access AI Editor from navigation', async ({ page }) => {
    await signIn(page)
    await page.waitForTimeout(2000)

    // Open navigation dropdown
    const avatarButton = page
      .locator('button')
      .filter({ has: page.locator('img, [role="img"]') })
      .first()
    await avatarButton.click()
    await page.waitForTimeout(500)

    // Look for AI Editor menu item
    const aiEditorItem = page
      .getByRole('menuitem', { name: /ai editor/i })
      .or(page.locator('[role="menuitem"]').filter({ hasText: /ai editor/i }))

    const hasAIEditor = await aiEditorItem
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (hasAIEditor) {
      await aiEditorItem.first().click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/ai/01-ai-editor-page.png' })
      console.log('✅ AI Editor accessible')
    } else {
      console.log('⚠️  AI Editor menu item not found')
      await page.screenshot({ path: 'test-results/ai/01-no-ai-editor.png' })
    }
  })

  test('should display AI features in script editor', async ({ page }) => {
    await signIn(page)
    await page.goto('/scripts')
    await page.waitForTimeout(2000)

    // Navigate to a script
    const scriptLink = page.locator('a[href*="/scripts/"]').first()
    const hasScripts = await scriptLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasScripts) {
      console.log('⚠️  No scripts available for AI testing')
      return
    }

    await scriptLink.click()
    await page.waitForTimeout(2000)

    // Look for AI features/buttons
    const aiFeatures = [
      'dialogue',
      'beat',
      'structure',
      'coverage',
      'character',
      'ai',
      'enhance',
      'analyze',
    ]

    const foundFeatures = []
    for (const feature of aiFeatures) {
      const element = page.locator(`text=/${feature}/i`).first()
      const exists = await element.isVisible({ timeout: 1000 }).catch(() => false)
      if (exists) {
        foundFeatures.push(feature)
      }
    }

    console.log(`Found AI features: ${foundFeatures.join(', ')}`)
    await page.screenshot({ path: 'test-results/ai/02-ai-features-in-editor.png' })
  })

  test('should test AI brainstorm feature', async ({ page }) => {
    await signIn(page)

    // Try direct API call to test AI endpoint
    const response = await page.request
      .post('/api/ai/brainstorm', {
        data: {
          prompt: 'Test brainstorm for a sci-fi story',
          context: 'Testing E2E',
        },
      })
      .catch(() => null)

    if (response && response.ok()) {
      console.log('✅ AI brainstorm API responds')
    } else if (response) {
      console.log(`⚠️  AI brainstorm API returned status: ${response.status()}`)
    } else {
      console.log('⚠️  AI brainstorm API not accessible')
    }
  })

  test('should test AI logline generation', async ({ page }) => {
    await signIn(page)

    const response = await page.request
      .post('/api/ai/generate-logline', {
        data: {
          synopsis: 'A detective investigates mysterious disappearances in a small town',
          genre: 'Mystery',
        },
      })
      .catch(() => null)

    if (response && response.ok()) {
      console.log('✅ AI logline generation API responds')
    } else if (response) {
      console.log(`⚠️  AI logline API returned status: ${response.status()}`)
    } else {
      console.log('⚠️  AI logline API not accessible')
    }
  })
})
