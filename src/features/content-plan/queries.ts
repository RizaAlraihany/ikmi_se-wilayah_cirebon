import { prisma } from '@/core/database/prisma'
import { ContentPlanStatus } from '@prisma/client'

export const contentPlanQueries = {
  async getPlans(month?: string) {
    const parsedMonth = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date()
    const start = new Date(parsedMonth.getFullYear(), parsedMonth.getMonth(), 1)
    const end = new Date(parsedMonth.getFullYear(), parsedMonth.getMonth() + 1, 1)

    return prisma.contentPlan.findMany({
      where: {
        deletedAt: null,
        publishDate: {
          gte: start,
          lt: end,
        },
      },
      include: {
        author: {
          include: {
            department: true,
          },
        },
      },
      orderBy: { publishDate: 'asc' },
    })
  },

  async getPlanById(id: string) {
    return prisma.contentPlan.findFirst({
      where: { id, deletedAt: null },
      include: { author: true },
    })
  },

  async getStatusCounts() {
    return prisma.contentPlan.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    })
  },

  statuses: [ContentPlanStatus.PLANNED, ContentPlanStatus.IN_PROGRESS, ContentPlanStatus.READY, ContentPlanStatus.PUBLISHED],
}
