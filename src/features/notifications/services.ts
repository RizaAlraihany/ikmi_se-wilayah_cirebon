import { NotFoundError } from '@/core/errors/custom-errors'
import { cache } from '@/core/cache/cache'
import { notificationRepository } from './repository'
import {
  BulkNotificationInput,
  CreateNotificationInput,
  NotificationPreferenceInput,
  bulkNotificationSchema,
  createNotificationSchema,
  notificationPreferenceSchema,
} from './schemas'

export const notificationService = {
  async createNotification(input: CreateNotificationInput) {
    const validated = createNotificationSchema.parse(input)
    const notification = await notificationRepository.create({
      userId: validated.userId,
      type: validated.type,
      title: validated.title,
      message: validated.message,
      actionUrl: validated.actionUrl,
      createdBy: validated.createdBy,
    })

    await cache.del(`notif_count:${validated.userId}`)
    return notification
  },

  async createBulkNotifications(input: BulkNotificationInput) {
    const validated = bulkNotificationSchema.parse(input)
    const result = await notificationRepository.createMany(
      validated.userIds.map((userId) => ({
        userId,
        type: validated.type,
        title: validated.title,
        message: validated.message,
        actionUrl: validated.actionUrl,
        createdBy: validated.createdBy,
      })),
    )

    await Promise.all(validated.userIds.map((userId) => cache.del(`notif_count:${userId}`)))
    return result
  },

  async markSingleRead(id: string, userId: string) {
    const notif = await notificationRepository.findById(id)
    if (!notif) throw new NotFoundError('Notifikasi tidak ditemukan')
    if (notif.userId !== userId) throw new NotFoundError('Notifikasi tidak ditemukan')

    const updated = await notificationRepository.markRead(id, userId)
    await cache.del(`notif_count:${userId}`)
    return updated
  },

  async markSingleUnread(id: string, userId: string) {
    const notif = await notificationRepository.findById(id)
    if (!notif) throw new NotFoundError('Notifikasi tidak ditemukan')
    if (notif.userId !== userId) throw new NotFoundError('Notifikasi tidak ditemukan')

    const updated = await notificationRepository.markUnread(id, userId)
    await cache.del(`notif_count:${userId}`)
    return updated
  },

  async markAllRead(userId: string) {
    const result = await notificationRepository.markAllRead(userId)
    await cache.del(`notif_count:${userId}`)
    return result
  },

  async deleteNotification(id: string, userId: string) {
    const notif = await notificationRepository.findById(id)
    if (!notif) throw new NotFoundError('Notifikasi tidak ditemukan')
    if (notif.userId !== userId) throw new NotFoundError('Notifikasi tidak ditemukan')

    const deleted = await notificationRepository.softDelete(id, userId)
    await cache.del(`notif_count:${userId}`)
    return deleted
  },

  async getPreferences(_userId: string): Promise<NotificationPreferenceInput> {
    void _userId
    return notificationPreferenceSchema.parse({})
  },

  async updatePreferences(_userId: string, input: NotificationPreferenceInput) {
    return notificationPreferenceSchema.parse(input)
  },
}
