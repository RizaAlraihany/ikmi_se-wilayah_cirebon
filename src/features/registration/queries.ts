import { prisma } from '@/core/database/prisma'
import { requireRegistrationReviewAccess } from './access'

export const registrationQueries = {
  async getPaginatedRegistrations(page: number = 1, limit: number = 10, search?: string) {
    await requireRegistrationReviewAccess()
    page = Number.isSafeInteger(page) && page > 0 ? page : 1
    limit = Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, 100) : 10
    const skip = (page - 1) * limit

    const where = search ? {
      deletedAt: null,
      OR: [
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { campus: { contains: search, mode: 'insensitive' as const } },
      ]
    } : { deletedAt: null }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.registration.count({ where })
    ])

    return {
      data: registrations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  async getAnalytics() {
    await requireRegistrationReviewAccess()

    const year = new Date().getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const registrations = await prisma.registration.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: startOfYear },
      },
      select: { createdAt: true },
    })

    return Array.from({ length: 12 }, (_, index) => ({
      month: new Date(year, index, 1).toLocaleDateString('id-ID', { month: 'short' }),
      count: registrations.filter((registration) => registration.createdAt.getMonth() === index).length,
    }))
  },
}
