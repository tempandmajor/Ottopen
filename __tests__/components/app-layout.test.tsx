import { render, screen } from '@testing-library/react'
import { AppLayout } from '@/src/components/app-layout'

const mockUseAuth = jest.fn()
const mockUseNavigationContext = jest.fn()
const mockUsePathname = jest.fn()

jest.mock('@/src/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock('@/src/hooks/useNavigationContext', () => ({
  useNavigationContext: () => mockUseNavigationContext(),
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

describe('AppLayout', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard')
    mockUseNavigationContext.mockReturnValue('app')
  })

  it('renders sidebar skeleton and reserves space while auth is loading', () => {
    mockUseAuth.mockReturnValue(createAuthValue({ loading: true }))

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('sidebar-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('app-layout-content')).toHaveClass('lg:ml-64')
  })

  it('renders full sidebar once user is authenticated', () => {
    mockUseAuth.mockReturnValue(
      createAuthValue({
        user: { id: '123', email: 'user@example.com', profile: { id: '123' } },
      })
    )

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.queryByTestId('sidebar-skeleton')).not.toBeInTheDocument()
    expect(screen.getByTestId('app-layout-content')).toHaveClass('lg:ml-64')
  })

  it('does not reserve space when unauthenticated state is settled', () => {
    mockUseAuth.mockReturnValue(createAuthValue())

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.queryByTestId('sidebar-skeleton')).not.toBeInTheDocument()
    expect(screen.getByTestId('app-layout-content')).not.toHaveClass('lg:ml-64')
  })
})
