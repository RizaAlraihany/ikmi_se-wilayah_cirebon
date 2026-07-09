import { AuditAction, NotificationType } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { logger } from '@/core/monitoring/logger'
import { noopPushProvider } from '@/core/notifications'
import { notificationService } from '@/features/notifications/services'
import { eventBus } from './event-bus'
import { EventName } from './event-types'

type Recipient = { id: string }

function uniqueIds(users: Array<Recipient | string>) {
  return Array.from(new Set(users.map((user) => (typeof user === 'string' ? user : user.id))))
}

async function usersByPermission(permissionId: string) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      role: {
        permissions: {
          some: { permissionId },
        },
      },
    },
    select: { id: true },
  })
}

async function usersByDepartment(term: string) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      department: {
        OR: [
          { code: term },
          { name: { contains: term } },
        ],
      },
    },
    select: { id: true },
  })
}

async function systemManagers() {
  const [superAdmins, managers] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, roleId: 'super_admin' },
      select: { id: true },
    }),
    usersByPermission('system.manage'),
  ])

  return uniqueIds([...superAdmins, ...managers])
}

async function auditAutomation(event: EventName, entityId: string, payload: unknown) {
  const systemUserId = (await systemManagers())[0]
  if (!systemUserId) return

  await prisma.auditLog.create({
    data: {
      action: AuditAction.CREATE,
      entity: 'WorkflowAutomation',
      entityId,
      userId: systemUserId,
      newData: JSON.stringify({ event, payload }),
    },
  })
}

async function triggerFutureAdapter(title: string, message: string, actionUrl: string) {
  await noopPushProvider.sendPush({
    recipient: 'notification-center',
    title,
    message,
    actionUrl,
  })
}

async function notifyUsers(input: {
  userIds: string[]
  type: NotificationType
  title: string
  message: string
  actionUrl: string
  event: EventName
  entityId: string
}) {
  const userIds = Array.from(new Set(input.userIds))
  if (userIds.length === 0) return { count: 0 }

  const result = await notificationService.createBulkNotifications({
    userIds,
    type: input.type,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
  })

  await auditAutomation(input.event, input.entityId, {
    userIds,
    type: input.type,
    title: input.title,
    actionUrl: input.actionUrl,
  })
  await triggerFutureAdapter(input.title, input.message, input.actionUrl)
  logger.automation(input.event, {
    entityId: input.entityId,
    notificationCount: userIds.length,
    type: input.type,
  })
  return result
}

export function registerEventHandlers() {
  logger.info('Registering global event handlers')

  eventBus.on('audit.log', async (payload) => {
    try {
      let finalUserId = payload.userId
      if (!finalUserId) {
        finalUserId = (await systemManagers())[0]
      }

      if (!finalUserId) {
        logger.warn('No system user found for audit log fallback. Skipping log.')
        return
      }

      const action = payload.action === 'UPDATE_STATUS' ? AuditAction.UPDATE : payload.action

      await prisma.auditLog.create({
        data: {
          action: action as AuditAction,
          entity: payload.entity,
          entityId: payload.entityId,
          oldData: payload.oldData,
          newData: payload.newData,
          userId: finalUserId,
        },
      })
    } catch (error) {
      logger.error(error, { event: 'audit.log' })
    }
  })

  eventBus.on('post.created', async (payload) => {
    await notifyUsers({
      userIds: [payload.authorId],
      type: NotificationType.POST,
      title: 'Draft artikel dibuat',
      message: 'Draft artikel baru berhasil dibuat dan siap dilengkapi.',
      actionUrl: `/dashboard/admin/cms/posts/${payload.postId}/edit`,
      event: 'post.created',
      entityId: payload.postId,
    })
  })

  eventBus.on('post.submitted', async (payload) => {
    const recipients = uniqueIds([
      ...(await usersByDepartment('KOMDIGI')),
      ...(await usersByPermission('post.publish')),
    ])

    await notifyUsers({
      userIds: recipients,
      type: NotificationType.POST,
      title: 'Artikel baru memerlukan review',
      message: 'Sebuah artikel baru telah diajukan dan menunggu review editor.',
      actionUrl: `/dashboard/admin/cms/posts/${payload.postId}`,
      event: 'post.submitted',
      entityId: payload.postId,
    })
  })

  eventBus.on('post.approved', async (payload) => {
    await notifyUsers({
      userIds: [payload.authorId],
      type: NotificationType.POST,
      title: 'Artikel disetujui',
      message: 'Artikel Anda telah disetujui dan siap dipublikasikan.',
      actionUrl: `/dashboard/admin/cms/posts/${payload.postId}`,
      event: 'post.approved',
      entityId: payload.postId,
    })
  })

  eventBus.on('post.published', async (payload) => {
    await notifyUsers({
      userIds: [payload.authorId, payload.publisherId],
      type: NotificationType.POST,
      title: 'Artikel dipublikasikan',
      message: 'Artikel telah dipublikasikan ke website publik.',
      actionUrl: `/blog`,
      event: 'post.published',
      entityId: payload.postId,
    })
  })

  eventBus.on('post.archived', async (payload) => {
    await notifyUsers({
      userIds: [payload.authorId, payload.userId],
      type: NotificationType.POST,
      title: 'Artikel diarsipkan',
      message: 'Artikel telah dipindahkan ke arsip CMS.',
      actionUrl: `/dashboard/admin/cms/posts/${payload.postId}`,
      event: 'post.archived',
      entityId: payload.postId,
    })
  })

  eventBus.on('registration.created', async (payload) => {
    const recipients = uniqueIds([
      ...(await usersByDepartment('Kaderisasi')),
      ...(await usersByPermission('registration.review')),
    ])

    await notifyUsers({
      userIds: recipients,
      type: NotificationType.REGISTRATION,
      title: 'Pendaftaran baru masuk',
      message: 'Terdapat pendaftaran anggota baru yang perlu ditinjau.',
      actionUrl: `/dashboard/admin/membership/registrations`,
      event: 'registration.created',
      entityId: payload.registrationId,
    })
  })

  eventBus.on('registration.approved', async (payload) => {
    await notifyUsers({
      userIds: await systemManagers(),
      type: NotificationType.REGISTRATION,
      title: 'Pendaftaran disetujui',
      message: 'Pendaftaran anggota telah disetujui dan siap diproses lanjutan.',
      actionUrl: `/dashboard/admin/membership/registrations`,
      event: 'registration.approved',
      entityId: payload.registrationId,
    })
  })

  eventBus.on('registration.rejected', async (payload) => {
    await notifyUsers({
      userIds: await systemManagers(),
      type: NotificationType.REGISTRATION,
      title: 'Pendaftaran ditolak',
      message: 'Pendaftaran anggota telah ditolak dalam proses review.',
      actionUrl: `/dashboard/admin/membership/registrations`,
      event: 'registration.rejected',
      entityId: payload.registrationId,
    })
  })

  eventBus.on('registration.reminder.pending', async (payload) => {
    const recipients = uniqueIds([
      ...(await usersByDepartment('Kaderisasi')),
      ...(await usersByPermission('registration.review')),
    ])

    await notifyUsers({
      userIds: recipients,
      type: NotificationType.REGISTRATION,
      title: 'Reminder verifikasi pendaftaran',
      message: 'Masih ada pendaftaran anggota yang menunggu verifikasi.',
      actionUrl: `/dashboard/admin/membership/registrations`,
      event: 'registration.reminder.pending',
      entityId: payload.registrationId,
    })
  })

  eventBus.on('member.activated', async (payload) => {
    await notifyUsers({
      userIds: [payload.userId],
      type: NotificationType.REGISTRATION,
      title: 'Anggota aktif dibuat',
      message: 'Calon anggota telah dipromosikan menjadi anggota aktif.',
      actionUrl: `/dashboard/admin/membership/members`,
      event: 'member.activated',
      entityId: payload.userId,
    })
  })

  eventBus.on('member.promoted.management', async (payload) => {
    await notifyUsers({
      userIds: [payload.userId],
      type: NotificationType.REGISTRATION,
      title: 'Status pengurus diperbarui',
      message: 'Anggota telah dipromosikan ke struktur kepengurusan.',
      actionUrl: `/dashboard/admin/membership/members`,
      event: 'member.promoted.management',
      entityId: payload.userId,
    })
  })

  eventBus.on('member.demisioner', async (payload) => {
    await notifyUsers({
      userIds: [payload.userId],
      type: NotificationType.REGISTRATION,
      title: 'Status demisioner diperbarui',
      message: 'Status anggota telah dipindahkan menjadi demisioner.',
      actionUrl: `/dashboard/admin/membership/members`,
      event: 'member.demisioner',
      entityId: payload.userId,
    })
  })

  eventBus.on('member.alumni', async (payload) => {
    await notifyUsers({
      userIds: [payload.userId],
      type: NotificationType.REGISTRATION,
      title: 'Status alumni diperbarui',
      message: 'Status anggota telah dipindahkan menjadi alumni.',
      actionUrl: `/dashboard/admin/membership/members`,
      event: 'member.alumni',
      entityId: payload.userId,
    })
  })

  eventBus.on('finance.requested', async (payload) => {
    await notifyUsers({
      userIds: uniqueIds([...(await usersByPermission('finance.view')), ...(await usersByPermission('finance.approve_tier1'))]),
      type: NotificationType.FINANCE,
      title: 'Pengajuan keuangan baru',
      message: 'Pengajuan keuangan baru menunggu pemeriksaan.',
      actionUrl: `/dashboard/admin/finance`,
      event: 'finance.requested',
      entityId: payload.id,
    })
  })

  eventBus.on('finance.approved', async (payload) => {
    await notifyUsers({
      userIds: uniqueIds([...(await usersByPermission('finance.view')), ...(await usersByPermission('finance.approve_tier2'))]),
      type: NotificationType.FINANCE,
      title: 'Pengajuan keuangan disetujui',
      message: `Pengajuan keuangan lolos approval ${payload.tier}.`,
      actionUrl: `/dashboard/admin/finance`,
      event: 'finance.approved',
      entityId: payload.id,
    })
  })

  eventBus.on('finance.approved.tier1', async (payload) => {
    await eventBus.emit('finance.approved', { id: payload.id, tier: 'TIER1' })
  })

  eventBus.on('finance.completed', async (payload) => {
    await eventBus.emit('finance.approved', { id: payload.id, tier: 'TIER2' })
  })

  eventBus.on('finance.rejected', async (payload) => {
    await notifyUsers({
      userIds: await usersByPermission('finance.view').then(uniqueIds),
      type: NotificationType.FINANCE,
      title: 'Pengajuan keuangan ditolak',
      message: 'Pengajuan keuangan telah ditolak oleh approver.',
      actionUrl: `/dashboard/admin/finance`,
      event: 'finance.rejected',
      entityId: payload.id,
    })
  })

  eventBus.on('lpj.submitted', async (payload) => {
    await notifyUsers({
      userIds: uniqueIds([...(await usersByPermission('lpj.view')), ...(await usersByPermission('lpj.verify_department'))]),
      type: NotificationType.LPJ,
      title: 'LPJ baru disubmit',
      message: 'LPJ baru menunggu verifikasi departemen.',
      actionUrl: `/dashboard/admin/lpj`,
      event: 'lpj.submitted',
      entityId: payload.id,
    })
  })

  eventBus.on('lpj.verified', async (payload) => {
    await notifyUsers({
      userIds: uniqueIds([...(await usersByPermission('lpj.view')), ...(await usersByPermission('lpj.verify'))]),
      type: NotificationType.LPJ,
      title: 'LPJ terverifikasi',
      message: `LPJ telah diverifikasi.`,
      actionUrl: `/dashboard/admin/lpj`,
      event: 'lpj.verified',
      entityId: payload.id,
    })
  })

  eventBus.on('lpj.rejected', async (payload) => {
    await notifyUsers({
      userIds: await usersByPermission('lpj.view').then(uniqueIds),
      type: NotificationType.LPJ,
      title: 'LPJ ditolak',
      message: 'LPJ telah ditolak dan perlu ditindaklanjuti.',
      actionUrl: `/dashboard/admin/lpj`,
      event: 'lpj.rejected',
      entityId: payload.id,
    })
  })

  eventBus.on('letter.created', async (payload) => {
    await notifyUsers({
      userIds: uniqueIds([...(await usersByPermission('letter.view')), ...(await systemManagers())]),
      type: NotificationType.SYSTEM,
      title: 'Surat baru dibuat',
      message: `Surat ${payload.type} baru telah dibuat di modul persuratan.`,
      actionUrl: `/dashboard/admin/letters`,
      event: 'letter.created',
      entityId: payload.id,
    })
  })

  eventBus.on('agenda.reminder.sent', async (payload) => {
    await notifyUsers({
      userIds: await systemManagers(),
      type: NotificationType.SYSTEM,
      title: 'Reminder agenda',
      message: payload.daysBefore
        ? `Agenda ${payload.title} akan dimulai dalam ${payload.daysBefore} hari.`
        : `Agenda ${payload.title} akan segera dimulai.`,
      actionUrl: `/dashboard/admin/programs/events`,
      event: 'agenda.reminder.sent',
      entityId: payload.eventId,
    })
  })

  eventBus.on('finance.reminder.sent', async (payload) => {
    await notifyUsers({
      userIds: uniqueIds([...(await usersByPermission('finance.view')), ...(await usersByPermission('finance.approve_tier1'))]),
      type: NotificationType.FINANCE,
      title: 'Reminder approval keuangan',
      message: `Pengajuan keuangan sebesar ${payload.amount} masih menunggu approval.`,
      actionUrl: `/dashboard/admin/finance`,
      event: 'finance.reminder.sent',
      entityId: payload.requestId,
    })
  })

  eventBus.on('lpj.overdue', async (payload) => {
    await notifyUsers({
      userIds: uniqueIds([...(await usersByPermission('lpj.view')), ...(await usersByPermission('lpj.create'))]),
      type: NotificationType.LPJ,
      title: 'Deadline LPJ terlewat',
      message: `LPJ untuk agenda ${payload.title} belum tersedia setelah agenda selesai.`,
      actionUrl: `/dashboard/admin/lpj`,
      event: 'lpj.overdue',
      entityId: payload.eventId,
    })
  })
}
