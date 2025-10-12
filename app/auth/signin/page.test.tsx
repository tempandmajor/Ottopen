import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignIn from './page'

jest.mock('@/src/contexts/auth-context', () => {
  return {
    useAuth: () => ({
      signIn: jest.fn().mockResolvedValue({ success: true }),
      user: null,
      loading: false,
    }),
  }
})

// Silence console.warn noise in tests
jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('SignIn page - honors 429 from rate-limit API', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      status: 429,
      json: async () => ({ retryAfter: 42 }),
      headers: new Map(),
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('prevents signIn call when rate-limit API returns 429', async () => {
    const { container } = render(<SignIn />)

    const email = screen.getByTestId('email-input') as HTMLInputElement
    const password = screen.getByTestId('password-input') as HTMLInputElement
    const button = screen.getByTestId('signin-button') as HTMLButtonElement

    fireEvent.change(email, { target: { value: 'RLUser@example.com' } })
    fireEvent.change(password, { target: { value: 'password123!' } })

    // Capture the mocked signIn from useAuth
    const { useAuth } = jest.requireMock('@/src/contexts/auth-context')
    const auth = useAuth()
    const signInMock = auth.signIn as jest.Mock

    fireEvent.click(button)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/rate-limit',
      expect.objectContaining({ method: 'POST' })
    ))

    // Ensure we did not call signIn due to 429
    expect(signInMock).not.toHaveBeenCalled()
  })
})
