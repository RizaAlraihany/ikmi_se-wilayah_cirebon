import { prisma } from '@/core/database/prisma'
import { eventBus } from '@/core/events'
import { notificationService } from '@/features/notifications/services'
import { notificationQueries } from '@/features/notifications/queries'

async function main() {
  const [superAdmin, kadep] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'rc.superadmin@ikmi.ac.id' } }),
    prisma.user.findUnique({ where: { email: 'rc.kadep@ikmi.ac.id' } }),
  ])

  if (!superAdmin || !kadep) {
    throw new Error('RC users are not seeded.')
  }

  const before = {
    notifications: await prisma.notification.count(),
    auditLogs: await prisma.auditLog.count(),
  }

  const stamp = Date.now().toString()

  await eventBus.emit('registration.approved', { registrationId: `rc3-registration-${stamp}` })
  await eventBus.emit('member.activated', { userId: kadep.id, registrationId: `rc3-registration-${stamp}` })
  await eventBus.emit('finance.approved.tier1', { id: `rc3-finance-${stamp}` })
  await eventBus.emit('lpj.verified.department', { id: `rc3-lpj-${stamp}` })
  await eventBus.emit('post.published', {
    postId: `rc3-post-${stamp}`,
    authorId: kadep.id,
    publisherId: superAdmin.id,
  })
  await eventBus.emit('letter.created', { id: `rc3-letter-${stamp}`, type: 'OUT', createdBy: superAdmin.id })

  const latestNotification = await prisma.notification.findFirst({
    where: { userId: superAdmin.id, readAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (latestNotification) {
    await notificationService.markSingleRead(latestNotification.id, superAdmin.id)
  }

  const workflows = await notificationQueries.getWorkflowMonitoring()

  const after = {
    notifications: await prisma.notification.count(),
    auditLogs: await prisma.auditLog.count(),
    readNotifications: await prisma.notification.count({ where: { readAt: { not: null } } }),
  }

  console.log(JSON.stringify({
    before,
    after,
    deltas: {
      notifications: after.notifications - before.notifications,
      auditLogs: after.auditLogs - before.auditLogs,
    },
    markReadExecuted: Boolean(latestNotification),
    workflows,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
