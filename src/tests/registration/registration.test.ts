/* eslint-disable @typescript-eslint/no-explicit-any */
import { registrationService } from '@/features/registration/services'
import { canTransitionRegistration } from '@/features/registration/domain'
import { prismaMock } from '../prisma-mock'
import { eventBus } from '@/core/events/event-bus'
import { requirePermissionForUser } from '@/core/authorization/guards'


jest.mock('@/core/authorization/guards', () => ({
  requirePermissionForUser: jest.fn(),
}))

describe('Registration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(requirePermissionForUser).mockResolvedValue({
      id: 'admin-1',
      roleId: 'admin_organization',
      departmentId: 'organization',
      positionId: null,
    })
    prismaMock.$transaction.mockImplementation(async (cb) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb)
      }
      return cb(prismaMock)
    })
  })

  it('should submit registration and emit events', async () => {
    prismaMock.registration.findMany.mockResolvedValueOnce([])
    prismaMock.registration.create.mockResolvedValueOnce({
      id: 'reg-1',
      registrationNumber: 'REG-2026-0001',
      fullName: 'John Doe',
      campus: 'CIREBON', major: 'Teknik', whatsapp: '0812',
      semester: '1',
      address: 'Test',
      reasons: 'Test',
      status: 'NEW'
    } as any)

    const result = await registrationService.submitRegistration({
      fullName: 'John Doe',
      email: 'john@example.test',
      campus: 'CIREBON', major: 'Teknik', whatsapp: '0812',
      semester: '1',
      entryYear: 2026,
      district: 'Kesambi',
      village: 'Karyamulya',
      address: 'Test',
      reasons: 'Test',
      consent: true
    })

    expect(result.id).toBe('reg-1')
    expect(eventBus.emit).toHaveBeenCalledWith('registration.created', { registrationId: 'reg-1' })
    expect(eventBus.emit).toHaveBeenCalledWith('audit.log', expect.objectContaining({
      action: 'CREATE', entity: 'Registration'
    }))
  })

  it('should update registration status', async () => {
    prismaMock.registration.findFirst.mockResolvedValueOnce({
      id: 'reg-1', status: 'PASSED', registrationNumber: 'REG-2026-0001', fullName: 'John Doe', email: 'john@example.test', campus: 'CIREBON', major: 'Teknik', semester: '1', entryYear: 2026, district: 'Kesambi', village: 'Karyamulya', address: 'Test', whatsapp: '0812', reasons: 'Test', deletedAt: null,
    } as any)

    prismaMock.registration.update.mockResolvedValueOnce({ id: 'reg-1', status: 'ACTIVE_MEMBER', registrationNumber: 'REG-2026-0001', fullName: 'John Doe', email: 'john@example.test', campus: 'CIREBON', major: 'Teknik', semester: '1', entryYear: 2026, district: 'Kesambi', village: 'Karyamulya', whatsapp: '0812' } as any)

    const result = await registrationService.updateStatus('reg-1', 'ACTIVE_MEMBER', 'admin-1')

    expect(result.status).toBe('ACTIVE_MEMBER')
    expect(requirePermissionForUser).toHaveBeenCalledWith('admin-1', 'registration.review')
    expect(prismaMock.registration.update).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: { status: 'ACTIVE_MEMBER', updatedBy: 'admin-1' }
    })
    expect(prismaMock.auditLog.create).toHaveBeenCalled()
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('enforces the verification to PRABUMI to active member state machine', () => {
    expect(canTransitionRegistration('NEW', 'VERIFIED')).toBe(false)
    expect(canTransitionRegistration('NEEDS_VERIFICATION', 'VERIFIED')).toBe(true)
    expect(canTransitionRegistration('VERIFIED', 'PRABUMI_PARTICIPANT')).toBe(true)
    expect(canTransitionRegistration('PRABUMI_PARTICIPANT', 'PASSED')).toBe(true)
    expect(canTransitionRegistration('PASSED', 'ACTIVE_MEMBER')).toBe(true)
    expect(canTransitionRegistration('REJECTED', 'ACTIVE_MEMBER')).toBe(false)
  })
})
