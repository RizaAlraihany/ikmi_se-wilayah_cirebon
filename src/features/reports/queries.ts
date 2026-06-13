import { prisma } from '@/core/database/prisma'

export const reportQueries = {
  async getReports(status?: 'SUBMITTED' | 'VERIFIED' | 'REJECTED', skip = 0, take = 20) {
    return prisma.report.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      skip,
      take,
      include: {
        event: { include: { program: true } },
        lpjToken: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getReportById(id: string) {
    return prisma.report.findUnique({
      where: { id },
      include: {
        event: { include: { program: true } },
        lpjToken: true,
      },
    })
  },

  async getPendingCount() {
    return prisma.report.count({
      where: { status: 'SUBMITTED', deletedAt: null },
    })
  },
}
