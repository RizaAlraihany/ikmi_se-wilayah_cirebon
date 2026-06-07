import { prisma } from '@/core/database/prisma'
import { LetterType } from '@prisma/client'

export const letterQueries = {
  async getLetters(type?: LetterType, skip = 0, take = 100) {
    return prisma.letter.findMany({
      where: type ? { type } : undefined,
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
