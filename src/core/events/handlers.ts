import { eventBus } from './event-bus'
import { prisma } from '@/core/database/prisma'
import { AuditAction } from '@prisma/client'

type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>

export function registerEventHandlers() {
  console.log('Registering global event handlers...')

  eventBus.on('audit.log', async (payload) => {
    try {
      let finalUserId = payload.userId
      if (!finalUserId) {
        // Fallback for system-generated events without a specific user context
        const sysUser = await prisma.user.findFirst({
          where: { roleId: 'super_admin' },
          select: { id: true }
        })
        if (!sysUser) {
          console.warn('[EVENT WARN] No super_admin found for audit log fallback. Skipping log.')
          return
        }
        finalUserId = sysUser.id
      }

      await prisma.auditLog.create({
        data: {
          action: payload.action as AuditAction,
          entity: payload.entity,
          entityId: payload.entityId,
          oldData: payload.oldData,
          newData: payload.newData,
          userId: finalUserId,
        }
      })
    } catch (error) {
      console.error('[EVENT ERROR] Failed to process audit.log:', error)
    }
  })

  eventBus.on('post.submitted', async (payload) => {
    try {
      const komdigiUsers = await prisma.user.findMany({
        where: { department: { name: 'Komdigi' }, deletedAt: null }
      })
      
      const notifications = komdigiUsers.map((user: User) => ({
        type: 'POST' as const,
        title: 'Artikel Baru Memerlukan Review',
        message: `Sebuah artikel baru telah disubmit dan menunggu review. (Post ID: ${payload.postId})`,
        actionUrl: `/admin/posts/${payload.postId}`,
        userId: user.id
      }))

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications })
      }
      console.log(`[EVENT] post.submitted processed. Notified ${notifications.length} Komdigi members.`)
    } catch (error) {
      console.error('[EVENT ERROR] Failed to process post.submitted:', error)
    }
  })

  eventBus.on('registration.created', async (payload) => {
    try {
      const kaderisasiUsers = await prisma.user.findMany({
        where: { department: { name: 'Kaderisasi' }, deletedAt: null }
      })
      
      const notifications = kaderisasiUsers.map((user: User) => ({
        type: 'REGISTRATION' as const,
        title: 'Pendaftaran Baru Masuk',
        message: `Terdapat pendaftaran anggota baru yang perlu ditinjau. (Reg ID: ${payload.registrationId})`,
        actionUrl: `/admin/registrations/${payload.registrationId}`,
        userId: user.id
      }))

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications })
      }
      console.log(`[EVENT] registration.created processed. Notified ${notifications.length} Kaderisasi members.`)
    } catch (error) {
      console.error('[EVENT ERROR] Failed to process registration.created:', error)
    }
  })

  eventBus.on('registration.approved', async (payload) => {
    // Usually sent via email or WA. Here we log it as placeholder
    console.log(`[EVENT] registration.approved triggered for registration ${payload.registrationId}`)
  })

  eventBus.on('registration.rejected', async (payload) => {
    // Usually sent via email or WA. Here we log it as placeholder
    console.log(`[EVENT] registration.rejected triggered for registration ${payload.registrationId}`)
  })

  // Sprint 2 Events
  eventBus.on('finance.requested', async (payload) => {
    console.log(`[EVENT] finance.requested triggered for finance request ${payload.id}`)
  })

  eventBus.on('finance.approved.tier1', async (payload) => {
    console.log(`[EVENT] finance.approved.tier1 triggered for finance request ${payload.id}`)
  })

  eventBus.on('finance.completed', async (payload) => {
    console.log(`[EVENT] finance.completed triggered for finance request ${payload.id}`)
  })

  eventBus.on('finance.rejected', async (payload) => {
    console.log(`[EVENT] finance.rejected triggered for finance request ${payload.id}`)
  })

  eventBus.on('lpj.submitted', async (payload) => {
    console.log(`[EVENT] lpj.submitted triggered for report ${payload.id}`)
  })

  eventBus.on('lpj.verified.department', async (payload) => {
    console.log(`[EVENT] lpj.verified.department triggered for report ${payload.id}`)
  })

  eventBus.on('lpj.verified.bph', async (payload) => {
    console.log(`[EVENT] lpj.verified.bph triggered for report ${payload.id}`)
  })

  eventBus.on('lpj.rejected', async (payload) => {
    console.log(`[EVENT] lpj.rejected triggered for report ${payload.id}`)
  })
}
