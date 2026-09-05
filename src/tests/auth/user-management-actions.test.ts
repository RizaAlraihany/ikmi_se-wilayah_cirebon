import { requireSuperAdmin } from '@/core/authorization/guards'
import { createUserAction, deleteUserAction, updateUserAction } from '@/features/users/actions'
import { userService } from '@/features/users/services'
import { ForbiddenError } from '@/core/errors/custom-errors'

jest.mock('@/core/authorization/guards', () => ({
  requireSuperAdmin: jest.fn(),
}))

jest.mock('@/features/users/services', () => ({
  userService: {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const requireSuperAdminMock = jest.mocked(requireSuperAdmin)

describe('user-management server-action boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects a non-super-admin before account creation', async () => {
    requireSuperAdminMock.mockRejectedValueOnce(new ForbiddenError('Super Admin only'))

    await expect(createUserAction({
      name: 'Org Admin',
      email: 'org@example.test',
      password: 'password',
      roleId: 'admin_organization',
      departmentId: 'org',
    })).resolves.toEqual({ error: 'Super Admin only' })
    expect(userService.createUser).not.toHaveBeenCalled()
  })

  it('allows a Super Admin to invoke account update and delete actions', async () => {
    requireSuperAdminMock.mockResolvedValue({
      id: 'super-1', roleId: 'super_admin', departmentId: null, positionId: null,
    })

    await expect(updateUserAction({ id: 'user-1', isActive: false })).resolves.toEqual({ success: true })
    await expect(deleteUserAction('user-2')).resolves.toEqual({ success: true })

    expect(userService.updateUser).toHaveBeenCalledWith({ id: 'user-1', isActive: false }, 'super-1')
    expect(userService.deleteUser).toHaveBeenCalledWith('user-2', 'super-1')
  })
})
