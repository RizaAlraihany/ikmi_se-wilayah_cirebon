import { auth, signIn, signOut } from '@/core/auth/auth'
import { loginAction, logoutAction } from '@/features/auth/actions'
import { authService } from '@/features/auth/services'
import { CredentialsSignin } from 'next-auth'
import { redirect } from 'next/navigation'

jest.mock('@/core/auth/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/features/auth/services', () => ({
  authService: {
    logLoginEventByEmail: jest.fn(),
    logLogoutEvent: jest.fn(),
  },
}))

jest.mock('next/headers', () => ({ headers: jest.fn() }))
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))
jest.mock('@/core/security/login-rate-limit', () => ({
  assertLoginRateLimit: jest.fn(),
  readClientIp: jest.fn(),
  resetSuccessfulLoginRateLimit: jest.fn(),
}))

describe('logout action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('records the authenticated logout before ending the session', async () => {
    jest.mocked(auth).mockResolvedValue({ user: { id: 'admin-1' } } as never)

    await logoutAction()

    expect(authService.logLogoutEvent).toHaveBeenCalledWith('admin-1')
    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/login' })
  })

  it('still ends an anonymous or expired session', async () => {
    jest.mocked(auth).mockResolvedValue(null as never)

    await logoutAction()

    expect(authService.logLogoutEvent).not.toHaveBeenCalled()
    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/login' })
  })

  it('still ends the session when logout audit logging fails', async () => {
    jest.mocked(auth).mockResolvedValue({ user: { id: 'admin-1' } } as never)
    jest.mocked(authService.logLogoutEvent).mockRejectedValueOnce(
      new Error('database unavailable'),
    )

    await logoutAction()

    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/login' })
  })
})

describe('login action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the same generic response for invalid credentials', async () => {
    jest.mocked(signIn).mockRejectedValueOnce(new CredentialsSignin())

    await expect(
      loginAction({ email: 'unknown@example.test', password: 'wrong-password' }),
    ).resolves.toEqual({ error: 'Email atau password salah.' })
  })

  it('returns a safe throttling message when the provider rate limit is reached', async () => {
    class RateLimitedCredentials extends CredentialsSignin {
      code = 'rate_limited'
    }
    jest.mocked(signIn).mockRejectedValueOnce(new RateLimitedCredentials())

    await expect(
      loginAction({ email: 'admin@example.test', password: 'wrong-password' }),
    ).resolves.toEqual({ error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' })
  })

  it('uses the fixed dashboard destination instead of accepting an external callback', async () => {
    await loginAction({
      email: 'admin@example.test',
      password: 'correct-password',
      callbackUrl: 'https://evil.example',
    } as never)

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'admin@example.test',
      password: 'correct-password',
      redirect: false,
    })
    expect(redirect).toHaveBeenCalledWith('/admin')
  })
})
