import { prisma } from '@/core/database/prisma'

export const financeQueries = {
  async getRequests(departmentId?: string, skip = 0, take = 10) {
    return prisma.financeRequest.findMany({
      where: departmentId ? { departmentId } : undefined,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: { department: true }
    })
  },

  async getRequestById(id: string) {
    return prisma.financeRequest.findUnique({
      where: { id },
      include: { department: true },
    })
  },

  async getPendingRequests() {
    return prisma.financeRequest.findMany({
      where: { status: 'PENDING' }
    })
  }
}
