import { prisma } from '@/core/database/prisma'
import { requireRegistrationReviewAccess } from './access'

export const registrationQueries = {
  async getPaginatedRegistrations(page: number = 1, limit: number = 10, search?: string) {
    await requireRegistrationReviewAccess()
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
  }
}
