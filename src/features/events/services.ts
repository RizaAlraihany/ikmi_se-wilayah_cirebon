import { can, SessionUser } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { eventQueries } from './queries'
import { eventPolicies } from './policies'
import { eventCreateSchema, EventCreateInput, eventUpdateSchema, EventUpdateInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { EventStatus } from '@prisma/client'

export const eventService = {
  async createEvent(input: EventCreateInput, userId: string) {
    const validated = eventCreateSchema.parse(input)
    
    if (validated.startDate >= validated.endDate) {
      throw new ValidationError('Tanggal mulai harus sebelum tanggal selesai')
    }

    const program = await prisma.program.findUnique({ where: { id: validated.programId } })
    if (!program) throw new NotFoundError('Program tidak ditemukan')

    const userObj = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    const hasPermission = await can('event.create', userObj as SessionUser)
    const isOwner = eventPolicies.canManageEvent(userObj, program)
    const isGlobal = await can('system.manage', userObj as SessionUser)
    const canManageCalendar = await can('calendar.manage', userObj as SessionUser)
    
    if (!hasPermission || (!isOwner && !isGlobal && !canManageCalendar)) {
      throw new ForbiddenError('Tidak memiliki izin untuk membuat event di program ini')
    }

    const [event] = await prisma.$transaction([
      prisma.event.create({
        data: {
          ...validated,
          status: EventStatus.UPCOMING
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Event',
          entityId: 'NEW', 
          newData: JSON.stringify(validated),
          userId,
        }
      })
    ])

    await prisma.auditLog.updateMany({
      where: { entityId: 'NEW', entity: 'Event', userId },
      data: { entityId: event.id }
    })

    return event
  },

  async updateEvent(id: string, input: EventUpdateInput, userId: string) {
    const validated = eventUpdateSchema.parse(input)
    
    if (validated.startDate && validated.endDate && validated.startDate >= validated.endDate) {
      throw new ValidationError('Tanggal mulai harus sebelum tanggal selesai')
    }

    const event = await eventQueries.getEventById(id)
    if (!event) throw new NotFoundError('Event tidak ditemukan')

    const userObj = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    const hasPermission = await can('event.update', userObj as SessionUser)
    const isOwner = eventPolicies.canManageEvent(userObj, event.program)
    const isGlobal = await can('system.manage', userObj as SessionUser)
    const canManageCalendar = await can('calendar.manage', userObj as SessionUser)

    if (!hasPermission || (!isOwner && !isGlobal && !canManageCalendar)) {
      throw new ForbiddenError('Tidak memiliki izin untuk mengubah event ini')
    }

    if (event.status === EventStatus.COMPLETED && validated.status && validated.status !== EventStatus.COMPLETED) {
      throw new ValidationError('Agenda yang sudah completed tidak bisa diubah statusnya')
    }

    if (validated.status === EventStatus.CANCELLED) {
      const [updated] = await prisma.$transaction([
        prisma.event.update({
          where: { id },
          data: {
            status: EventStatus.CANCELLED,
            deletedAt: new Date(),
            updatedBy: userId,
          },
        }),
        prisma.auditLog.create({
          data: {
            action: 'DELETE',
            entity: 'Event',
            entityId: id,
            oldData: JSON.stringify(event),
            newData: JSON.stringify(validated),
            userId,
          },
        }),
      ])

      return updated
    }

    const [updated] = await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: validated
      }),
      prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Event',
          entityId: id,
          oldData: JSON.stringify(event),
          newData: JSON.stringify(validated),
          userId,
        }
      })
    ])

    return updated
  },

  async deleteEvent(id: string, userId: string) {
    const event = await eventQueries.getEventById(id)
    if (!event) throw new NotFoundError('Event tidak ditemukan')

    const userObj = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    const hasPermission = await can('event.delete', userObj as SessionUser)
    const isOwner = eventPolicies.canManageEvent(userObj, event.program)
    const isGlobal = await can('system.manage', userObj as SessionUser)
    const canManageCalendar = await can('calendar.manage', userObj as SessionUser)

    if (!hasPermission || (!isOwner && !isGlobal && !canManageCalendar)) {
      throw new ForbiddenError('Tidak memiliki izin untuk menghapus event ini')
    }

    await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Event',
          entityId: id,
          oldData: JSON.stringify(event),
          userId,
        }
      })
    ])

    return true
  }
}
