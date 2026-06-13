import { prisma } from '@/core/database/prisma'
import type { Prisma } from '@prisma/client'

export const documentArchiveQueries = {
  async getDocuments(category?: string, search?: string, skip = 0, take = 100) {
    const where: Prisma.DocumentArchiveWhereInput = { deletedAt: null }

    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    return prisma.documentArchive.findMany({
      where,
      skip,
      take,
      orderBy: { archivedAt: 'desc' },
    })
  },
}
