import { prisma } from '@/core/database/prisma'

export const reportQueries = {
  async getReports(departmentId?: string, skip = 0, take = 10) {
    return prisma.report.findMany({
      where: departmentId ? {
        event: {
          program: {
            departmentId
          }
        }
      } : undefined,
      skip,
      take,
      include: { event: { include: { program: true } } },
      orderBy: { id: 'desc' }
    })
  },

  async getReportById(id: string) {
    return prisma.report.findUnique({
      where: { id },
      include: { event: { include: { program: true } } }
    })
  }
}
