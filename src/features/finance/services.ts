import { prisma } from '@/core/database/prisma'
import { requirePermissionForUser } from '@/core/authorization/guards'
import { NotFoundError } from '@/core/errors/custom-errors'
import { financeRepository } from './repository'
import { financeTransactionCreateSchema, type FinanceTransactionCreateInput } from './schemas'

export const financeService = {
  async createTransaction(input: FinanceTransactionCreateInput, userId: string) {
    await requirePermissionForUser(userId, 'finance.create')
    const validated = financeTransactionCreateSchema.parse(input)
    const transaction = await financeRepository.create({
      ...validated,
      proofUrl: validated.proofUrl || null,
      proofPublicId: validated.proofPublicId || null,
      createdBy: userId,
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'FinanceTransaction',
        entityId: transaction.id,
        newData: JSON.stringify({ type: transaction.type, amount: transaction.amount }),
        userId,
      },
    })

    return transaction
  },

  async deleteTransaction(id: string, userId: string) {
    await requirePermissionForUser(userId, 'finance.create')
    const transaction = await financeRepository.findById(id)
    if (!transaction) throw new NotFoundError('Transaksi tidak ditemukan.')

    const deleted = await financeRepository.softDelete(id, userId)
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'FinanceTransaction',
        entityId: id,
        oldData: JSON.stringify({ type: transaction.type, amount: transaction.amount }),
        userId,
      },
    })

    return deleted
  },

  async getSummary() {
    return financeRepository.getSummary()
  },
}
