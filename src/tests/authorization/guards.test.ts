import { auth } from '@/core/auth/auth'
import {
  requireAnyPermission,
  requireAuth,
  requireDashboardRouteAccess,
  requirePermission,
  requireSuperAdmin,
} from '@/core/authorization/guards'
import { can } from '@/core/authorization/rbac'
import { ForbiddenError, UnauthorizedError } from '@/core/errors/custom-errors'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/auth/auth', () => ({ auth: jest.fn() }))
jest.mock('@/core/authorization/rbac', () => ({ can: jest.fn() }))

const authMock = auth as jest.Mock
const canMock = can as jest.Mock
const activeUser = {
  id: 'user-1',
  roleId: 'admin_organization',
  departmentId: 'dept-1',
  positionId: null,
  sessionVersion: 1,
}

describe('authorization guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: activeUser.id } })
    prismaMock.user.findFirst.mockResolvedValue(activeUser as never)
  })

  it('rejects an unauthenticated request before reading a user record', async () => {
    authMock.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toBeInstanceOf(UnauthorizedError)
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled()
  })

  it('rejects a stale session for an inactive or deleted account', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejects a session after a password, role, or account security update', async () => {
    authMock.mockResolvedValue({ user: { id: activeUser.id, sessionVersion: 0 } })

    await expect(requireAuth()).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('does not allow a non-dashboard member role into dashboard routes', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ ...activeUser, roleId: null } as never)

    await expect(requireDashboardRouteAccess('/admin')).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('enforces a permission against the fresh database user', async () => {
    canMock.mockResolvedValue(false)

    await expect(requirePermission('user.update')).rejects.toBeInstanceOf(ForbiddenError)
    expect(canMock).toHaveBeenCalledWith('user.update', activeUser)
  })

  it('allows a request when any accepted permission is present', async () => {
    canMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    await expect(requireAnyPermission(['post.submit', 'post.publish'])).resolves.toEqual(activeUser)
    expect(canMock).toHaveBeenNthCalledWith(1, 'post.submit', activeUser)
    expect(canMock).toHaveBeenNthCalledWith(2, 'post.publish', activeUser)
  })

  it('uses the route map for known dashboard paths and denies unknown paths', async () => {
    canMock.mockResolvedValue(true)

    await expect(requireDashboardRouteAccess('/admin/management')).resolves.toEqual(activeUser)
    expect(canMock).toHaveBeenCalledWith('user.view', activeUser)
    await expect(requireDashboardRouteAccess('/admin/not-yet-mapped')).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('does not let a legacy user.view grant bypass the Super Admin route boundary', async () => {
    canMock.mockResolvedValue(true)

    await expect(requireDashboardRouteAccess('/admin/users')).rejects.toBeInstanceOf(ForbiddenError)
    expect(canMock).not.toHaveBeenCalled()
  })

  it('keeps Admin Organisasi and Admin Komdigi in their respective direct URL workspaces', async () => {
    canMock.mockResolvedValue(true)

    await expect(requireDashboardRouteAccess('/admin/cms/posts')).rejects.toBeInstanceOf(ForbiddenError)
    expect(canMock).not.toHaveBeenCalled()

    jest.clearAllMocks()
    const komdigiUser = { ...activeUser, roleId: 'admin_komdigi' }
    authMock.mockResolvedValue({ user: { id: komdigiUser.id } })
    prismaMock.user.findFirst.mockResolvedValue(komdigiUser as never)
    canMock.mockResolvedValue(true)

    await expect(requireDashboardRouteAccess('/admin/programs')).rejects.toBeInstanceOf(ForbiddenError)
    expect(canMock).not.toHaveBeenCalled()
    await expect(requireDashboardRouteAccess('/admin/cms/posts')).resolves.toEqual(komdigiUser)
    expect(canMock).toHaveBeenCalledWith('post.view', komdigiUser)
  })

  it('keeps account management explicitly Super Admin only', async () => {
    canMock.mockResolvedValue(true)

    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(ForbiddenError)
    expect(canMock).not.toHaveBeenCalled()

    jest.clearAllMocks()
    const superAdmin = { ...activeUser, roleId: 'super_admin' }
    authMock.mockResolvedValue({ user: { id: superAdmin.id } })
    prismaMock.user.findFirst.mockResolvedValue(superAdmin as never)

    await expect(requireSuperAdmin()).resolves.toEqual(superAdmin)
  })
})
