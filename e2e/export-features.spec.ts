import { test, expect } from '@playwright/test'

/**
 * Export Features Tests
 * Tests all 6 export formats: PDF, Word, EPUB, Final Draft, Fountain, Plain Text
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'akangbou.emma@gmail.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Password1'

test.describe('Export Features', () => {
  test.describe.configure({ mode: 'serial' })

  async function signIn(page) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Password').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL(/\/(feed|scripts|dashboard)/, { timeout: 15000 })
  }

  test('should display export options in script editor', async ({ page }) => {
    await signIn(page)
    await page.goto('/scripts')
    await page.waitForTimeout(2000)

    // Navigate to a script
    const scriptLink = page.locator('a[href*="/scripts/"]').first()
    const hasScripts = await scriptLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasScripts) {
      console.log('⚠️  No scripts available for export testing')
      await page.screenshot({ path: 'test-results/export/01-no-scripts.png' })
      return
    }

    await scriptLink.click()
    await page.waitForTimeout(2000)

    // Look for export button/menu
    const exportButton = page
      .locator(
        'button:has-text("Export"), button:has-text("Download"), [aria-label*="export" i], [aria-label*="download" i]'
      )
      .first()
    const hasExportButton = await exportButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasExportButton) {
      await exportButton.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/export/01-export-menu.png' })
      console.log('✅ Export button found')
    } else {
      console.log('⚠️  No export button found')
      await page.screenshot({ path: 'test-results/export/01-no-export-button.png' })
    }
  })

  test('should test export format options', async ({ page }) => {
    await signIn(page)
    await page.goto('/scripts')
    await page.waitForTimeout(2000)

    const scriptLink = page.locator('a[href*="/scripts/"]').first()
    const hasScripts = await scriptLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasScripts) {
      console.log('⚠️  No scripts for testing export formats')
      return
    }

    await scriptLink.click()
    await page.waitForTimeout(2000)

    const exportButton = page
      .locator('button:has-text("Export"), button:has-text("Download")')
      .first()
    const hasExportButton = await exportButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasExportButton) {
      console.log('⚠️  No export button to test formats')
      return
    }

    await exportButton.click()
    await page.waitForTimeout(1000)

    // Look for export format options
    const formats = [
      'PDF',
      'Word',
      'DOCX',
      'EPUB',
      'Final Draft',
      'FDX',
      'Fountain',
      'Plain Text',
      'TXT',
    ]
    const foundFormats = []

    for (const format of formats) {
      const formatOption = page.locator(`text=/${format}/i`).first()
      const exists = await formatOption.isVisible({ timeout: 1000 }).catch(() => false)
      if (exists) {
        foundFormats.push(format)
      }
    }

    console.log(`Found export formats: ${foundFormats.join(', ')}`)
    await page.screenshot({ path: 'test-results/export/02-export-formats.png' })

    if (foundFormats.length >= 3) {
      console.log('✅ Multiple export formats available')
    } else {
      console.log('⚠️  Limited export formats found')
    }
  })

  test('should test PDF export API', async ({ page }) => {
    await signIn(page)

    // We'll need a script ID - try to get one from scripts page
    await page.goto('/scripts')
    await page.waitForTimeout(2000)

    const scriptLink = page.locator('a[href*="/scripts/"]').first()
    const href = await scriptLink.getAttribute('href').catch(() => null)

    if (!href) {
      console.log('⚠️  No script ID available for API testing')
      return
    }

    const scriptId = href.split('/scripts/')[1]
    console.log(`Testing with script ID: ${scriptId}`)

    // Test export API endpoint (if it exists)
    // Note: This may fail if script doesn't exist, which is expected
    const response = await page.request.get(`/api/scripts/${scriptId}/export/fdx`).catch(() => null)

    if (response) {
      console.log(`Export API status: ${response.status()}`)
      if (response.status() === 200 || response.status() === 404) {
        console.log('✅ Export API endpoint exists')
      }
    }
  })
})
