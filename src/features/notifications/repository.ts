import { prisma } from '@/core/database/prisma'
import { NotificationType, Prisma } from '@prisma/client'
import { NotificationStatus } from './schemas'

type ListUserNotificationsInput = {
  userId: string
  status?: NotificationStatus
  types?: NotificationType[]
  skip?: number
  take?: number
}

function statusWhere(status: NotificationStatus | undefined): Prisma.NotificationWhereInput {
  if (status === 'unread') return { readAt: null, deletedAt: null }
  if (status === 'read') return { readAt: { not: null }, deletedAt: null }
  if (status === 'archived') return { deletedAt: { not: null } }
  return { deletedAt: null }
}

export const notificationRepository = {
  create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data })
  },

  createMany(data: Prisma.NotificationCreateManyInput[]) {
    if (data.length === 0) return Promise.resolve({ count: 0 })
    return prisma.notification.createMany({ data })
  },

  findById(id: string) {
    return prisma.notification.findUnique({ where: { id } })
  },

  listForUser({ userId, status = 'all', types, skip = 0, take = 20 }: ListUserNotificationsInput) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...statusWhere(status),
      ...(types?.length ? { type: { in: types } } : {}),
    }

    return prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    })
  },

  countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, readAt: null, deletedAt: null },
    })
  },

  markRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), updatedBy: userId },
    })
  },

  markUnread(id: string, userId: string) {
    return prisma.notification.update({
      where: { id },
      data: { readAt: null, updatedBy: userId },
    })
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null, deletedAt: null },
      data: { readAt: new Date(), updatedBy: userId },
    })
  },

  softDelete(id: string, userId: string) {
    return prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    })
  },

  analytics() {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)

    return Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { readAt: null, deletedAt: null } }),
      prisma.notification.count({ where: { readAt: { not: null }, deletedAt: null } }),
      prisma.notification.groupBy({
        by: ['type'],
        _count: { id: true },
        orderBy: { type: 'asc' },
      }),
      prisma.user.findMany({
        where: {
          deletedAt: null,
          notifications: { some: {} },
        },
        select: {
          id: true,
          name: true,
          _count: { select: { notifications: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.notification.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: startOfYear } },
        _count: { id: true },
      }),
    ])
  },
}
