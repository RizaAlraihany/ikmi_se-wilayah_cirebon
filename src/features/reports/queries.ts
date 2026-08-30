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
      select: {
        id: true,
        title: true,
        status: true,
        submittedBy: true,
        verifiedBy: true,
        verifiedAt: true,
        verifyNotes: true,
        createdAt: true,
        updatedAt: true,
        event: { select: { id: true, title: true, startDate: true, location: true, program: { select: { id: true, name: true } } } },
        lpjToken: { select: { id: true, activityName: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getReportById(id: string) {
    return prisma.report.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        submittedBy: true,
        verifiedBy: true,
        verifiedAt: true,
        verifyNotes: true,
        createdAt: true,
        updatedAt: true,
        event: { select: { id: true, title: true, startDate: true, location: true, program: { select: { id: true, name: true } } } },
        lpjToken: { select: { id: true, activityName: true, status: true } },
      },
    })
  },

  async getPendingCount() {
    return prisma.report.count({
      where: { status: 'SUBMITTED', deletedAt: null },
    })
  },
}
