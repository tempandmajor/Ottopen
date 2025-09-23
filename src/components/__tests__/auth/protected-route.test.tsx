import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute, PublicOnlyRoute } from '../../auth/protected-route'
import { useAuth } from '../../../contexts/auth-context'

// Mock the hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('../../../contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const mockPush = jest.fn()

beforeEach(() => {
  (mockUseRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })
  mockPush.mockClear()
})

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      forgotPassword: jest.fn(),
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should redirect when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      forgotPassword: jest.fn(),
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('should render children when user is authenticated', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      email_confirmed_at: '2023-01-01',
      last_sign_in_at: '2023-01-01',
      app_metadata: {},
      user_metadata: {},
      identities: [],
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      forgotPassword: jest.fn(),
    })

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should redirect to custom URL when specified', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      forgotPassword: jest.fn(),
    })

    render(
      <ProtectedRoute redirectTo="/custom-login">
        <TestComponent />
      </ProtectedRoute>
    )

    expect(mockPush).toHaveBeenCalledWith('/custom-login')
  })
})

describe('PublicOnlyRoute', () => {
  const TestComponent = () => <div>Public Content</div>

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      forgotPassword: jest.fn(),
    })

    render(
      <PublicOnlyRoute>
        <TestComponent />
      </PublicOnlyRoute>
    )

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should redirect when user is authenticated', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      email_confirmed_at: '2023-01-01',
      last_sign_in_at: '2023-01-01',
      app_metadata: {},
      user_metadata: {},
      identities: [],
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      forgotPassword: jest.fn(),
    })

    render(
      <PublicOnlyRoute>
        <TestComponent />
      </PublicOnlyRoute>
    )

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should render children when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      forgotPassword: jest.fn(),
    })

    render(
      <PublicOnlyRoute>
        <TestComponent />
      </PublicOnlyRoute>
    )

    expect(screen.getByText('Public Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})