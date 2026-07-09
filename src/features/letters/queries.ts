import { prisma } from '@/core/database/prisma'
import { LetterType, Prisma } from '@prisma/client'

export const letterQueries = {
  async getLetters(type?: LetterType, search?: string, skip = 0, take = 100) {
    const where: Prisma.LetterWhereInput = { deletedAt: null }
    if (type) where.type = type
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { letterNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    return prisma.letter.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' }
    })
  },

  async getLatestLetterNumber(type: LetterType, year: number) {
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59)
    
    return prisma.letter.findFirst({
      where: {
        type,
        date: { gte: startOfYear, lte: endOfYear }
      },
      orderBy: { letterNumber: 'desc' },
      select: { letterNumber: true }
    })
  }
}
