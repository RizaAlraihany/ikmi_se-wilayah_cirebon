/* eslint-disable @typescript-eslint/no-explicit-any */
import { authConfig } from '@/core/auth/auth.config'
import { authEdgeConfig } from '@/core/auth/auth.edge.config'
import { DASHBOARD_ROLE_IDS, isAuthenticatedDashboardUser } from '@/core/auth/roles'
import { prismaMock } from '../prisma-mock'
import bcrypt from 'bcryptjs'
import { authService } from '@/features/auth/services'
import {
  assertLoginRateLimit,
  resetSuccessfulLoginRateLimit,
} from '@/core/security/login-rate-limit'
import { RateLimitError } from '@/core/security/rate-limiter'

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}))

jest.mock('@/core/security/login-rate-limit', () => ({
  assertLoginRateLimit: jest.fn(),
  readClientIp: jest.fn(() => '203.0.113.20'),
  resetSuccessfulLoginRateLimit: jest.fn(),
}))

jest.mock('@/features/auth/services', () => ({
  authService: {
    logLoginEvent: jest.fn(),
    logFailedLoginEvent: jest.fn(),
  },
}))

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(assertLoginRateLimit).mockResolvedValue(undefined)
    jest.mocked(resetSuccessfulLoginRateLimit).mockResolvedValue(undefined)
    jest.mocked(authService.logLoginEvent).mockResolvedValue(undefined)
    jest.mocked(authService.logFailedLoginEvent).mockResolvedValue(undefined)
  })

  // next-auth Credentials provider is at index 0
  const credentialsProvider = authConfig.providers[0] as any

  it('should return null if email or password is not provided', async () => {
    const result1 = await credentialsProvider.authorize({ email: 'test@mail.com' })
    const result2 = await credentialsProvider.authorize({ password: 'password' })
    const result3 = await credentialsProvider.authorize(undefined)
    
    expect(result1).toBeNull()
    expect(result2).toBeNull()
    expect(result3).toBeNull()
  })

  it('should return null if user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    
    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' })
    expect(result).toBeNull()
    expect(bcrypt.compare).toHaveBeenCalledWith('password', expect.stringMatching(/^\$2a\$12\$/))
    expect(authService.logFailedLoginEvent).toHaveBeenCalledWith(null)
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@mail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        isActive: true,
        deletedAt: true,
        roleId: true,
        departmentId: true,
        positionId: true,
        sessionVersion: true,
      },
    })
  })

  it('should return null if user is inactive', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: '1', isActive: false, email: 'test@mail.com', passwordHash: 'hash', deletedAt: null
    } as unknown as any)
    
    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' })
    expect(result).toBeNull()
    expect(authService.logFailedLoginEvent).toHaveBeenCalledWith('1')
  })

  it('should return null if user is soft-deleted', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: '1', isActive: true, email: 'test@mail.com', passwordHash: 'hash', deletedAt: new Date()
    } as unknown as any)
    
    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' })
    expect(result).toBeNull()
    expect(authService.logFailedLoginEvent).toHaveBeenCalledWith('1')
  })

  it('should return null if password does not match', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: '1',
      isActive: true,
      email: 'test@mail.com',
      passwordHash: 'hash',
      deletedAt: null,
      roleId: 'admin_organization',
      departmentId: null,
      positionId: null,
      sessionVersion: 1,
    } as unknown as any)
    
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'wrongpassword' })
    expect(result).toBeNull()
    expect(authService.logFailedLoginEvent).toHaveBeenCalledWith('1')
  })

  it('should return user object if credentials are valid', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: '1', 
      name: 'Test User',
      email: 'test@mail.com', 
      passwordHash: 'hash',
      isActive: true, 
      deletedAt: null,
      roleId: 'admin_organization',
      departmentId: 'dept1',
      positionId: null,
      sessionVersion: 1,
    } as unknown as any)
    
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)

    const result = await credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' })
    
    expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash')
    expect(result).toEqual({
      id: '1',
      email: 'test@mail.com',
      name: 'Test User',
      roleId: 'admin_organization',
      departmentId: 'dept1',
      positionId: null,
      sessionVersion: 1,
    })
    expect(resetSuccessfulLoginRateLimit).toHaveBeenCalledWith('test@mail.com')
  })

  it('rejects an otherwise valid account without a dashboard role', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'member-1',
      name: 'Member',
      email: 'member@mail.com',
      passwordHash: 'hash',
      isActive: true,
      deletedAt: null,
      roleId: null,
      departmentId: null,
      positionId: null,
      sessionVersion: 1,
    } as unknown as any)

    const result = await credentialsProvider.authorize({ email: 'member@mail.com', password: 'password' })

    expect(result).toBeNull()
    expect(bcrypt.compare).toHaveBeenCalledWith('password', expect.stringMatching(/^\$2a\$12\$/))
    expect(authService.logFailedLoginEvent).toHaveBeenCalledWith('member-1')
  })

  it('uses only the three final PRD dashboard roles and secure session cookies', () => {
    expect(DASHBOARD_ROLE_IDS).toEqual(['super_admin', 'admin_organization', 'admin_komdigi'])
    expect(authConfig.session).toMatchObject({ strategy: 'jwt', maxAge: 8 * 60 * 60 })
    expect(authConfig.cookies?.sessionToken?.options).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
    })
    expect(authEdgeConfig.providers).toEqual([])
  })

  it('keeps the client session limited to non-sensitive identity fields', async () => {
    const result = await authConfig.callbacks?.session?.({
      session: { user: { name: 'Admin', email: 'admin@example.test' } },
      token: {
        id: 'admin-1',
        roleId: 'admin_komdigi',
        departmentId: null,
        positionId: null,
        sessionVersion: 4,
        passwordHash: 'must-not-leak',
      } as any,
    } as any)

    expect(result?.user).toMatchObject({
      id: 'admin-1',
      roleId: 'admin_komdigi',
      sessionVersion: 4,
    })
    expect(result?.user).not.toHaveProperty('passwordHash')
  })

  it('does not treat an empty auth object or legacy role as a logged-in dashboard user', () => {
    expect(isAuthenticatedDashboardUser(undefined)).toBe(false)
    expect(isAuthenticatedDashboardUser({ id: undefined, roleId: undefined })).toBe(false)
    expect(isAuthenticatedDashboardUser({ id: 'legacy-user', roleId: 'user' })).toBe(false)
    expect(isAuthenticatedDashboardUser({ id: 'admin-1', roleId: 'admin_organization' })).toBe(true)
  })

  it('enforces the login rate limit inside the credentials provider', async () => {
    jest.mocked(assertLoginRateLimit).mockRejectedValueOnce(new RateLimitError())

    await expect(
      credentialsProvider.authorize({ email: 'test@mail.com', password: 'password' }),
    ).rejects.toMatchObject({ type: 'CredentialsSignin', code: 'rate_limited' })

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
  })

  it('records successful sign-ins through the authentication event', async () => {
    await authConfig.events?.signIn?.({ user: { id: 'admin-1' } } as any)

    expect(authService.logLoginEvent).toHaveBeenCalledWith('admin-1')
  })
})

