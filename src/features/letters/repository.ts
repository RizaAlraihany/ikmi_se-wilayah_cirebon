import { prisma } from '@/core/database/prisma'
import { CreateLetterInput, UpdateLetterInput } from './schemas'

export const letterRepository = {
  async create(data: CreateLetterInput & { letterNumber: string }) {
    return prisma.letter.create({
      data: {
        letterNumber: data.letterNumber,
        type: data.type,
        subject: data.subject,
        fileUrl: data.fileUrl,
        date: data.date
      }
    })
  },

  async update(id: string, data: UpdateLetterInput) {
    return prisma.letter.update({
      where: { id },
      data
    })
  },
  
  async delete(id: string, userId?: string) {
    return prisma.letter.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    })
  }
}
