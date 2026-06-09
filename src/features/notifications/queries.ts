import { prisma } from '@/core/database/prisma'
import { cache } from '@/core/cache/cache'
import { NotificationType } from '@prisma/client'
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

  async getAnalytics() {
    const [
      total,
      unread,
      read,
      byModule,
      byUser,
      monthlyRaw,
    ] = await notificationRepository.analytics()

    const currentYear = new Date().getFullYear()
    const monthly = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(currentYear, index, 1).toLocaleDateString('id-ID', { month: 'short' }),
      count: monthlyRaw
        .filter((item) => item.createdAt.getMonth() === index)
        .reduce((sum, item) => sum + item._count.id, 0),
    }))

    const deliveryRate = total === 0 ? 0 : Math.round(((read + unread) / total) * 100)
    const responseRate = total === 0 ? 0 : Math.round((read / total) * 100)

    return {
      total,
      unread,
      read,
      deliveryRate,
      responseRate,
      byModule: byModule.map((item: { type: NotificationType; _count: { id: number } }) => ({
        module: item.type,
        count: item._count.id,
      })),
      byUser: byUser.map((user) => ({
        id: user.id,
        name: user.name,
        count: user._count.notifications,
      })),
      monthly,
    }
  },

  async getWorkflowMonitoring() {
    const [
      pendingRegistrations,
      approvedRegistrations,
      pendingFinance,
      tierOneFinance,
      completedFinance,
      rejectedFinance,
      submittedLpj,
      departmentVerifiedLpj,
      bphVerifiedLpj,
      rejectedLpj,
      draftPosts,
      reviewPosts,
      approvedPosts,
      publishedPosts,
    ] = await Promise.all([
      prisma.registration.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.registration.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.financeRequest.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.financeRequest.count({ where: { status: 'APPROVED_TIER1', deletedAt: null } }),
      prisma.financeRequest.count({ where: { status: 'COMPLETED', deletedAt: null } }),
      prisma.financeRequest.count({ where: { status: 'REJECTED', deletedAt: null } }),
      prisma.report.count({ where: { status: 'SUBMITTED', deletedAt: null } }),
      prisma.report.count({ where: { status: 'VERIFIED_DEPARTMENT', deletedAt: null } }),
      prisma.report.count({ where: { status: 'VERIFIED_BPH', deletedAt: null } }),
      prisma.report.count({ where: { status: 'REJECTED', deletedAt: null } }),
      prisma.post.count({ where: { status: 'DRAFT', deletedAt: null } }),
      prisma.post.count({ where: { status: 'PENDING_REVIEW', deletedAt: null } }),
      prisma.post.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.post.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    ])

    return [
      { module: 'Membership', pending: pendingRegistrations, inProgress: approvedRegistrations, completed: approvedRegistrations, failed: 0 },
      { module: 'Finance', pending: pendingFinance, inProgress: tierOneFinance, completed: completedFinance, failed: rejectedFinance },
      { module: 'LPJ', pending: submittedLpj, inProgress: departmentVerifiedLpj, completed: bphVerifiedLpj, failed: rejectedLpj },
      { module: 'CMS', pending: draftPosts, inProgress: reviewPosts + approvedPosts, completed: publishedPosts, failed: 0 },
    ]
  },
}
