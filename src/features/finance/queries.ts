import { prisma } from '@/core/database/prisma'
import { financeRepository } from './repository'

export const financeQueries = {
  async getTransactions(
    type?: 'INCOME' | 'EXPENSE',
    skip = 0,
    take = 20,
  ) {
    return financeRepository.findMany(
      type ? { type } : undefined,
      skip,
      take,
    )
  },

  async getTransactionById(id: string) {
    return financeRepository.findById(id)
  },

  async getSummary() {
    return financeRepository.getSummary()
  },

  async getMonthlySummary(year: number) {
    const months = Array.from({ length: 12 }, (_, i) => i)

    return Promise.all(
      months.map(async (monthIndex) => {
        const start = new Date(year, monthIndex, 1)
        const end = new Date(year, monthIndex + 1, 0, 23, 59, 59)

        const [income, expense] = await Promise.all([
          prisma.financeTransaction.aggregate({
            where: { type: 'INCOME', deletedAt: null, date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          prisma.financeTransaction.aggregate({
            where: { type: 'EXPENSE', deletedAt: null, date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
        ])

        return {
          month: start.toLocaleDateString('id-ID', { month: 'short' }),
          income: Number(income._sum.amount ?? 0),
          expense: Number(expense._sum.amount ?? 0),
        }
      })
    )
  },

  async getRecentTransactions(take = 5) {
    return financeRepository.findMany(undefined, 0, take)
  },
}
