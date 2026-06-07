import { prisma } from '@/core/database/prisma'
import { NotFoundError } from '@/core/errors/custom-errors'

export const notificationService = {
  async markSingleRead(id: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif) throw new NotFoundError('Notifikasi tidak ditemukan')
    if (notif.userId !== userId) throw new NotFoundError('Notifikasi tidak ditemukan')

    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    })
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    })
  }
}
