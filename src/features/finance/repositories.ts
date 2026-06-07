import { prisma } from '@/core/database/prisma'
import { FinanceStatus } from '@prisma/client'

export const financeRepository = {
  async create(data: {
    amount: number
    description: string
    proofUrl: string
    departmentId: string
    status: FinanceStatus
  }) {
    return prisma.financeRequest.create({
      data,
    })
  },
}
