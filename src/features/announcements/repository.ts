import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export const announcementRepository = {
  async create(data: Prisma.AnnouncementUncheckedCreateInput) {
    return prisma.announcement.create({ data })
  },

  async findById(id: string) {
    return prisma.announcement.findUnique({ where: { id, deletedAt: null } })
  },

  async findMany(skip = 0, take = 20) {
    return prisma.announcement.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })
  },

  async count() {
    return prisma.announcement.count({ where: { deletedAt: null } })
  },

  async update(id: string, data: Prisma.AnnouncementUpdateInput) {
    return prisma.announcement.update({ where: { id }, data })
  },

  async softDelete(id: string, updatedBy: string) {
    return prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    })
  },

  async markWaBlasted(id: string) {
    return prisma.announcement.update({
      where: { id },
      data: { isWaBlasted: true, blastSentAt: new Date() },
    })
  },
}
