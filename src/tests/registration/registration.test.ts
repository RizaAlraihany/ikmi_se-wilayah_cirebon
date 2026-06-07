import { registrationService } from '@/features/registration/services'
import { prismaMock } from '../prisma-mock'
import { eventBus } from '@/core/events/event-bus'
import { registrationRepository } from '@/features/registration/repositories'

jest.mock('@/features/registration/repositories', () => ({
  registrationRepository: {
    create: jest.fn(),
    findById: jest.fn()
  }
}))

describe('Registration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (cb) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb)
      }
      return cb(prismaMock)
    })
  })

  it('should submit registration and emit events', async () => {
    ;(registrationRepository.create as jest.Mock).mockResolvedValueOnce({
      id: 'reg-1',
      fullName: 'John Doe',
      campus: 'CIREBON',
      semester: '1',
      address: 'Test',
      reasons: 'Test',
      status: 'PENDING'
    })

    const result = await registrationService.submitRegistration({
      fullName: 'John Doe',
      campus: 'CIREBON',
      semester: '1',
      address: 'Test',
      reasons: 'Test'
    })

    expect(result.id).toBe('reg-1')
    expect(eventBus.emit).toHaveBeenCalledWith('registration.created', { registrationId: 'reg-1' })
    expect(eventBus.emit).toHaveBeenCalledWith('audit.log', expect.objectContaining({
      action: 'CREATE', entity: 'Registration'
    }))
  })

  it('should review registration and approve', async () => {
    ;(registrationRepository.findById as jest.Mock).mockResolvedValueOnce({
      id: 'reg-1', status: 'PENDING'
    })

    prismaMock.registration.update.mockResolvedValueOnce({ id: 'reg-1', status: 'APPROVED' } as unknown as { id: string; status: string })

    const result = await registrationService.reviewRegistration('reg-1', 'APPROVED', 'admin-1')

    expect(result.status).toBe('APPROVED')
    expect(prismaMock.registration.update).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: { status: 'APPROVED' }
    })
    expect(prismaMock.auditLog.create).toHaveBeenCalled()
    expect(eventBus.emit).toHaveBeenCalledWith('registration.approved', { registrationId: 'reg-1' })
  })

  it('should review registration and reject', async () => {
    ;(registrationRepository.findById as jest.Mock).mockResolvedValueOnce({
      id: 'reg-1', status: 'PENDING'
    })

    prismaMock.registration.update.mockResolvedValueOnce({ id: 'reg-1', status: 'REJECTED' } as unknown as { id: string; status: string })

    const result = await registrationService.reviewRegistration('reg-1', 'REJECTED', 'admin-1')

    expect(result.status).toBe('REJECTED')
    expect(eventBus.emit).toHaveBeenCalledWith('registration.rejected', { registrationId: 'reg-1' })
  })
})
