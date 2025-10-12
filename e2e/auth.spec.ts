import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/Ottopen/)
    await expect(page.getByText('Ottopen')).toBeVisible()
  })

  test('should navigate to sign-in page', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('should show validation errors on empty sign-in submit', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toHaveAttribute('required')
  })

  test('should navigate to sign-up page', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible()
    await expect(page.getByLabel('Email Address')).toBeVisible()
  })

  test('should show password strength indicator', async ({ page }) => {
    await page.goto('/auth/signup')
    const passwordInput = page.getByLabel('Password', { exact: true })

    await passwordInput.fill('weak')
    await expect(page.getByText(/Weak|Fair/i)).toBeVisible()

    await passwordInput.fill('StrongP@ss123!')
    await expect(page.getByText(/Strong|Good/i)).toBeVisible()
  })

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/auth/signup')

    await page.getByLabel('Password', { exact: true }).fill('Test1234!')
    await page.getByLabel('Confirm Password').fill('Different1234!')

    await expect(page.getByText(/Passwords do not match/i)).toBeVisible()
  })

  test('should complete multi-step signup form', async ({ page }) => {
    await page.goto('/auth/signup')

    // Step 1: Email & Password
    await page.getByLabel('Email Address').fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('Test1234!')
    await page.getByLabel('Confirm Password').fill('Test1234!')

    const nextButton = page.getByRole('button', { name: /Next Step/i })
    await nextButton.click()

    // Step 2: Profile Info
    await expect(page.getByRole('heading', { name: 'Build Your Profile' })).toBeVisible()
  })

  test('should show rate limiting after multiple failed attempts', async ({ page }) => {
    await page.goto('/auth/signin')

    const emailInput = page.getByLabel('Email')
    const passwordInput = page.getByLabel('Password')
    const signInButton = page.getByRole('button', { name: 'Sign In' })

    // Attempt 5 failed logins
    for (let i = 0; i < 5; i++) {
      await emailInput.fill('wrong@example.com')
      await passwordInput.fill('wrongpassword')
      await signInButton.click()
      await page.waitForTimeout(500)
    }

    // Should show rate limit message
    await expect(page.getByText(/Too many attempts/i)).toBeVisible()
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.getByRole('link', { name: 'Forgot password?' }).click()

    await expect(page.getByRole('heading', { name: /Forgot Password/i })).toBeVisible()
  })
})
