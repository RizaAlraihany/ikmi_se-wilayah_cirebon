import { prisma } from '@/core/database/prisma'
import { cache } from '@/core/cache/cache'

export const notificationQueries = {
  async getUserNotifications(userId: string, skip = 0, take = 20) {
    return prisma.notification.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    })
  },
  
  async getUnreadCount(userId: string) {
    const cacheKey = `notif_count:${userId}`
    const cached = await cache.get<number>(cacheKey)
    if (cached !== null) return cached

    const count = await prisma.notification.count({
      where: { userId, readAt: null }
    })

    await cache.set(cacheKey, count, 60) // Cache for 60 seconds
    return count
  }
}
