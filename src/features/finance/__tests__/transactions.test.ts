import { financeService } from '../services'
import { requirePermissionForUser } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { financeRepository } from '../repository'

jest.mock('@/core/database/prisma', () => ({
  prisma: {
    auditLog: { create: jest.fn() },
  },
}))

jest.mock('@/core/authorization/guards', () => ({
  requirePermissionForUser: jest.fn(),
}))

jest.mock('../repository', () => ({
  financeRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn(),
    getSummary: jest.fn(),
  },
}))

describe('Finance Service', () => {
  const permittedUser = { id: 'user-1', roleId: 'role-1', departmentId: null, positionId: null }
  const input = {
    type: 'EXPENSE' as const,
    amount: 150000,
    description: 'Konsumsi rapat',
    category: 'Operasional',
    date: new Date('2026-08-08T00:00:00.000Z'),
    proofUrl: '',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a validated transaction after checking permission and writes an audit entry', async () => {
    jest.mocked(requirePermissionForUser).mockResolvedValue(permittedUser)
    jest.mocked(financeRepository.create).mockResolvedValue({
      id: 'transaction-1',
      type: 'EXPENSE',
      amount: 150000,
    } as never)
    jest.mocked(prisma.auditLog.create).mockResolvedValue({} as never)

    const result = await financeService.createTransaction(input, 'user-1')

    expect(requirePermissionForUser).toHaveBeenCalledWith('user-1', 'finance.create')
    expect(financeRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      createdBy: 'user-1',
      proofUrl: null,
      proofPublicId: null,
    }))
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'CREATE',
        entity: 'FinanceTransaction',
        entityId: 'transaction-1',
        userId: 'user-1',
      }),
    }))
    expect(result.id).toBe('transaction-1')
  })

  it('refuses to delete a transaction that cannot be found', async () => {
    jest.mocked(requirePermissionForUser).mockResolvedValue(permittedUser)
    jest.mocked(financeRepository.findById).mockResolvedValue(null)

    await expect(financeService.deleteTransaction('missing', 'user-1')).rejects.toThrow('Transaksi tidak ditemukan.')
    expect(financeRepository.softDelete).not.toHaveBeenCalled()
  })
})
