import { requirePermission } from '@/core/authorization/guards'
import { prismaMock } from '../prisma-mock'
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'node:util'

jest.mock('@/core/authorization/guards', () => ({
  requirePermission: jest.fn(),
}))

const requirePermissionMock = jest.mocked(requirePermission)
let updatePengurusAction: typeof import('@/features/management/actions').updatePengurusAction
let deletePengurusAction: typeof import('@/features/management/actions').deletePengurusAction

describe('organization management account boundary', () => {
  beforeAll(async () => {
    Object.assign(globalThis, {
      TextEncoder: NodeTextEncoder,
      TextDecoder: NodeTextDecoder,
      Request: class Request {},
      Response: class Response {},
      Headers: class Headers {},
    })
    ;({ updatePengurusAction, deletePengurusAction } = await import('@/features/management/actions'))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    requirePermissionMock.mockResolvedValue({
      id: 'org-1', roleId: 'admin_organization', departmentId: null, positionId: null,
    })
  })

  it('does not let an organization admin update a dashboard account', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'komdigi-1', roleId: 'admin_komdigi' } as never)

    await expect(updatePengurusAction('komdigi-1', { name: 'Changed Name' })).resolves.toEqual({
      error: 'Akun dashboard hanya dapat dikelola oleh Super Admin.',
    })
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('does not let an organization admin deactivate a dashboard account', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'super-1', roleId: 'super_admin', deletedAt: null,
    } as never)

    await expect(deletePengurusAction('super-1')).resolves.toEqual({
      error: 'Akun dashboard hanya dapat dikelola oleh Super Admin.',
    })
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })
})
