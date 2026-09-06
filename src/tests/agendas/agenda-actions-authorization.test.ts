import { createAgendaAction } from '@/features/agendas/actions'
import { requirePermission, requireRoleForUser } from '@/core/authorization/guards'
import { agendaService } from '@/features/agendas/services'
import { ForbiddenError, UnauthorizedError } from '@/core/errors/custom-errors'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

jest.mock('@/core/authorization/guards', () => ({
  requirePermission: jest.fn(),
  requireRoleForUser: jest.fn(),
}))

jest.mock('@/features/agendas/services', () => ({
  agendaService: { create: jest.fn() },
}))

const requirePermissionMock = jest.mocked(requirePermission)
const requireRoleForUserMock = jest.mocked(requireRoleForUser)
const createMock = jest.mocked(agendaService.create)

const input = { name: 'Agenda baru' }

describe('Agenda mutation action authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requirePermissionMock.mockResolvedValue({ id: 'actor-1', roleId: 'admin_organization', departmentId: null, positionId: null })
    requireRoleForUserMock.mockResolvedValue({ id: 'actor-1', roleId: 'admin_organization', departmentId: null, positionId: null })
    createMock.mockResolvedValue({ id: 'agenda-1' } as never)
  })

  it.each([
    ['admin_organization', true],
    ['super_admin', true],
  ])('allows %s through the centralized Organization guard', async (roleId, allowed) => {
    requirePermissionMock.mockResolvedValue({ id: `${roleId}-1`, roleId, departmentId: null, positionId: null })
    requireRoleForUserMock.mockResolvedValue({ id: `${roleId}-1`, roleId, departmentId: null, positionId: null })

    const result = await createAgendaAction(input)

    expect(result.success).toBe(allowed)
    expect(createMock).toHaveBeenCalledWith(input, `${roleId}-1`)
  })

  it('rejects Admin Komdigi even when the legacy calendar permission is granted', async () => {
    requirePermissionMock.mockResolvedValue({ id: 'komdigi-1', roleId: 'admin_komdigi', departmentId: null, positionId: null })
    requireRoleForUserMock.mockRejectedValue(new ForbiddenError('Role Anda tidak dapat menjalankan aksi ini.'))

    const result = await createAgendaAction(input)

    expect(result).toEqual({ success: false, error: 'Role Anda tidak dapat menjalankan aksi ini.' })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated and stale-session callers before the mutation service', async () => {
    requirePermissionMock.mockRejectedValueOnce(new UnauthorizedError('Sesi tidak ditemukan atau telah berakhir.'))
    await expect(createAgendaAction(input)).resolves.toEqual({ success: false, error: 'Sesi tidak ditemukan atau telah berakhir.' })

    requirePermissionMock.mockRejectedValueOnce(new UnauthorizedError('Sesi tidak lagi valid.'))
    await expect(createAgendaAction(input)).resolves.toEqual({ success: false, error: 'Sesi tidak lagi valid.' })
    expect(createMock).not.toHaveBeenCalled()
  })
})
