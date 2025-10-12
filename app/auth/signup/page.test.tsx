import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignUp from './page'

jest.mock('@/src/contexts/auth-context', () => {
  return {
    useAuth: () => ({
      signUp: jest.fn().mockResolvedValue({ success: true }),
    }),
  }
})

jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('SignUp page - honors 429 from rate-limit API', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      status: 429,
      json: async () => ({ retryAfter: 30 }),
      headers: new Map(),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('prevents signUp call when rate-limit API returns 429', async () => {
    render(<SignUp />)

    // Step 1: fill required fields
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'rl@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } })

    // Move to next step (button labeled 'Next Step')
    fireEvent.click(screen.getByText(/Next Step/i))

    // Step 2: fill profile info
    fireEvent.change(screen.getByLabelText(/Display Name/i), { target: { value: 'Rate Limit User' } })
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'ratelimit_user' } })

    // Next step
    fireEvent.click(screen.getByText(/Next Step/i))

    // Step 3: preferences and consents
    fireEvent.mouseDown(screen.getByLabelText(/Account Type/i))
    // Assume default writer is selected; check consents
    fireEvent.click(screen.getByLabelText(/I agree to the Terms of Service/i))
    fireEvent.click(screen.getByLabelText(/Privacy Policy/i))

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Create Account/i })

    // Grab mocked signUp
    const { useAuth } = jest.requireMock('@/src/contexts/auth-context')
    const auth = useAuth()
    const signUpMock = auth.signUp as jest.Mock

    fireEvent.click(submitBtn)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/rate-limit',
      expect.objectContaining({ method: 'POST' })
    ))

    expect(signUpMock).not.toHaveBeenCalled()
  })
})
