/* eslint-disable @typescript-eslint/no-explicit-any */
import { financeService } from '@/features/finance/services'
import { prismaMock } from '../prisma-mock'
import { eventBus } from '@/core/events/event-bus'
import { can } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { financeRepository } from '@/features/finance/repository'
import { financeQueries } from '@/features/finance/queries'

jest.mock('@/core/authorization/rbac', () => ({
  can: jest.fn()
}))

jest.mock('@/features/finance/repository', () => ({
  financeRepository: {
    create: jest.fn()
  }
}))

jest.mock('@/features/finance/queries', () => ({
  financeQueries: {
    getRequestById: jest.fn()
  }
}))

describe('Finance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (cb) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb)
      }
      return cb(prismaMock)
    })
  })

  describe('createRequest', () => {
    it('should create request, audit log, and emit event', async () => {
      ;(financeRepository.create as jest.Mock).mockResolvedValueOnce({
        id: 'fin-1', amount: 5000, description: 'Test', proofUrl: 'http://', departmentId: 'dept1', status: 'PENDING'
      })

      const result = await financeService.createRequest({
        amount: 5000, description: 'Test', proofUrl: 'http://'
      }, 'user1', 'dept1')

      expect(result.id).toBe('fin-1')
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'CREATE', entity: 'FinanceRequest' })
      }))
      expect(eventBus.emit).toHaveBeenCalledWith('finance.requested', { id: 'fin-1' })
    })

    it('should throw Zod error for invalid input', async () => {
      await expect(financeService.createRequest({
        amount: -100, description: '', proofUrl: 'not-url'
      }, 'user1', 'dept1')).rejects.toThrow()
    })
  })

  describe('approveTier1', () => {
    it('should throw NotFoundError if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      await expect(financeService.approveTier1('fin-1', 'user1')).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if lacking tier1 permission', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user1', roleId: 'staff' } as any)
      ;(can as jest.Mock).mockResolvedValueOnce(false)
      
      await expect(financeService.approveTier1('fin-1', 'user1')).rejects.toThrow(ForbiddenError)
    })

    it('should throw ForbiddenError if user department does not match request department (Ownership Policy)', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user1', roleId: 'bendum', departmentId: 'dept1', positionId: null } as any)
      ;(can as jest.Mock).mockResolvedValueOnce(true)
      
      ;(financeQueries.getRequestById as jest.Mock).mockResolvedValueOnce({ id: 'fin-1', departmentId: 'dept2', status: 'PENDING' })

      await expect(financeService.approveTier1('fin-1', 'user1')).rejects.toThrow(/departemen tidak sesuai/)
    })

    it('should approve tier1 and emit event if valid', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user1', roleId: 'bendum', departmentId: 'dept1', positionId: null } as any)
      ;(can as jest.Mock).mockResolvedValueOnce(true)
      
      ;(financeQueries.getRequestById as jest.Mock).mockResolvedValueOnce({ id: 'fin-1', departmentId: 'dept1', status: 'PENDING' })

      prismaMock.financeRequest.update.mockResolvedValueOnce({ id: 'fin-1', status: 'APPROVED_TIER1' } as any)

      const result = await financeService.approveTier1('fin-1', 'user1')

      expect(prismaMock.financeRequest.update).toHaveBeenCalled()
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'APPROVE', newData: expect.stringContaining('APPROVED_TIER1') })
      }))
      expect(eventBus.emit).toHaveBeenCalledWith('finance.approved.tier1', { id: 'fin-1' })
      expect(result.status).toBe('APPROVED_TIER1')
    })
  })

  describe('rejectRequest', () => {
    it('should reject and emit event', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user1', roleId: 'super_admin' } as any)
      ;(can as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(true)
      
      ;(financeQueries.getRequestById as jest.Mock).mockResolvedValueOnce({ id: 'fin-1', status: 'PENDING', departmentId: 'dept1', positionId: null })
      prismaMock.financeRequest.update.mockResolvedValueOnce({ id: 'fin-1', status: 'REJECTED' } as any)

      const result = await financeService.rejectRequest('fin-1', 'user1')

      expect(prismaMock.financeRequest.update).toHaveBeenCalledWith({
        where: { id: 'fin-1' },
        data: { status: 'REJECTED' }
      })
      expect(eventBus.emit).toHaveBeenCalledWith('finance.rejected', { id: 'fin-1' })
      expect(result.status).toBe('REJECTED')
    })
  })
})

