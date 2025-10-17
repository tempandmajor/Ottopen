import { render, screen } from '@testing-library/react'
import { Navigation } from '@/src/components/navigation'

const mockUseAuth = jest.fn()
const mockUsePathname = jest.fn()

jest.mock('@/src/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

const createAuthValue = (overrides: Partial<ReturnType<typeof createBaseAuthValue>> = {}) => ({
  ...createBaseAuthValue(),
  ...overrides,
})

function createBaseAuthValue() {
  return {
    user: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    refreshUser: jest.fn(),
  }
}

describe('Navigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('hides guest actions while authentication state is loading', () => {
    mockUseAuth.mockReturnValue(createAuthValue({ loading: true }))

    render(<Navigation />)

    expect(screen.queryByText(/Sign In/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Join Network/i)).not.toBeInTheDocument()
  })

  it('shows guest actions when unauthenticated and not loading', () => {
    mockUseAuth.mockReturnValue(createAuthValue())

    render(<Navigation />)

    expect(screen.getByText(/Sign In/i)).toBeInTheDocument()
    expect(screen.getByText(/Join Network/i)).toBeInTheDocument()
  })

  it('shows account dropdown when authenticated', () => {
    mockUseAuth.mockReturnValue(
      createAuthValue({
        user: {
          id: '123',
          email: 'user@example.com',
          profile: { display_name: 'User Example', id: '123' },
        },
      })
    )

    render(<Navigation />)

    expect(screen.getByTestId('user-avatar-button')).toBeInTheDocument()
    expect(screen.queryByText(/Sign In/i)).not.toBeInTheDocument()
  })
})
