/* eslint-disable @typescript-eslint/no-explicit-any */
import { registrationService } from '@/features/registration/services'
import { prismaMock } from '../prisma-mock'
import { eventBus } from '@/core/events/event-bus'
import { registrationRepository } from '@/features/registration/repository'

jest.mock('@/features/registration/repository', () => ({
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
      campus: 'CIREBON', major: 'Teknik', whatsapp: '0812',
      semester: '1',
      address: 'Test',
      reasons: 'Test',
      status: 'PENDING'
    })

    const result = await registrationService.submitRegistration({
      fullName: 'John Doe',
      campus: 'CIREBON', major: 'Teknik', whatsapp: '0812',
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

  it('should mark registration as PROCESSED', async () => {
    ;(registrationRepository.findById as jest.Mock).mockResolvedValueOnce({
      id: 'reg-1', status: 'PENDING'
    })

    prismaMock.registration.update.mockResolvedValueOnce({ id: 'reg-1', status: 'PROCESSED' } as any)

    const result = await registrationService.markProcessed('reg-1', 'admin-1')

    expect(result.status).toBe('PROCESSED')
    expect(prismaMock.registration.update).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: { status: 'PROCESSED' }
    })
    expect(prismaMock.auditLog.create).toHaveBeenCalled()
  })
})
