import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export const financeRepository = {
  async create(data: Prisma.FinanceTransactionUncheckedCreateInput) {
    return prisma.financeTransaction.create({ data })
  },

  async findById(id: string) {
    return prisma.financeTransaction.findUnique({ where: { id, deletedAt: null } })
  },

  async findMany(where?: Prisma.FinanceTransactionWhereInput, skip = 0, take = 20) {
    return prisma.financeTransaction.findMany({
      where: { deletedAt: null, ...where },
      orderBy: { date: 'desc' },
      skip,
      take,
    })
  },

  async count(where?: Prisma.FinanceTransactionWhereInput) {
    return prisma.financeTransaction.count({ where: { deletedAt: null, ...where } })
  },

  async update(id: string, data: Prisma.FinanceTransactionUpdateInput) {
    return prisma.financeTransaction.update({ where: { id }, data })
  },

  async softDelete(id: string, updatedBy: string) {
    return prisma.financeTransaction.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    })
  },

  async getSummary() {
    const [income, expense] = await Promise.all([
      prisma.financeTransaction.aggregate({
        where: { type: 'INCOME', deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.financeTransaction.aggregate({
        where: { type: 'EXPENSE', deletedAt: null },
        _sum: { amount: true },
      }),
    ])

    const totalIncome = Number(income._sum.amount ?? 0)
    const totalExpense = Number(expense._sum.amount ?? 0)

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    }
  },
}
