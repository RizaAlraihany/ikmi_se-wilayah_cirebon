import { cache } from '@/core/cache/cache'
import { notificationRepository } from './repository'
import { NotificationModule, NotificationStatus, notificationModuleToTypes } from './schemas'

export const notificationQueries = {
  async getUserNotifications(
    userId: string,
    skip = 0,
    take = 20,
    status: NotificationStatus = 'all',
    module: NotificationModule = 'all',
  ) {
    return notificationRepository.listForUser({
      userId,
      skip,
      take,
      status,
      types: notificationModuleToTypes[module],
    })
  },

  async getUnreadCount(userId: string) {
    const cacheKey = `notif_count:${userId}`
    const cached = await cache.get<number>(cacheKey)
    if (cached !== null) return cached

    const count = await notificationRepository.countUnread(userId)

    await cache.set(cacheKey, count, 60) // Cache for 60 seconds
    return count
  },
}
