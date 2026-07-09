import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

// Since Registration model doesn't have a deletedAt field (it's completely independent of BaseRepository logic)
// We will just create a simple repository wrapper for it.
export const registrationRepository = {
  async create(data: Prisma.Args<typeof prisma.registration, 'create'>['data']) {
    return prisma.registration.create({ data })
  },
  
  async updateStatus(id: string, status: 'PENDING' | 'PROCESSED') {
    return prisma.registration.update({
      where: { id },
      data: { status }
    })
  },
  
  async findById(id: string) {
    return prisma.registration.findUnique({ where: { id } })
  }
}
