import { eventBus } from '@/core/events/event-bus'
import { prisma } from '@/core/database/prisma'
import { eventQueries } from '@/features/events/queries'
import { logger } from '@/core/monitoring/logger'

const EVENT_REMINDER_DAYS = [30, 14, 7, 3, 1]

export const reminderJob = {
  async execute() {
    const now = new Date()
    let remindedEvents = 0

    for (const daysBefore of EVENT_REMINDER_DAYS) {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const upcomingEvents = await eventQueries.getUpcomingEventsForReminder(targetDate)

      for (const evt of upcomingEvents) {
        await eventBus.emit('agenda.reminder.sent', { eventId: evt.id, title: evt.title, daysBefore })
      }
      remindedEvents += upcomingEvents.length
    }

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const overdueEvents = await eventQueries.getOverdueEventsWithoutReport(sevenDaysAgo)
    for (const evt of overdueEvents) {
      await eventBus.emit('lpj.overdue', { eventId: evt.id, title: evt.title })
    }

    const pendingRegistrations = await prisma.registration.findMany({
      where: { status: 'NEW', deletedAt: null },
      select: { id: true },
    })
    for (const registration of pendingRegistrations) {
      await eventBus.emit('registration.reminder.pending', { registrationId: registration.id })
    }

    const scheduleState = await syncEventScheduleStates(now)

    logger.automation('cron.schedule-state', scheduleState)

    return {
      remindedEvents,
      remindedFinances: 0,
      overdueLpj: overdueEvents.length,
      remindedRegistrations: pendingRegistrations.length,
      scheduleState,
    }
  },
}

/**
 * Planned dates may update schedule state and request an admin review. They
 * never derive an actual execution status.
 */
export async function syncEventScheduleStates(now: Date) {
  const activeEventWhere = {
    deletedAt: null,
    status: { not: 'CANCELLED' as const },
  }

  const [upcoming, due, pastDue, statusConfirmations] = await Promise.all([
    prisma.event.updateMany({
      where: {
        ...activeEventWhere,
        startDate: { gt: now },
        scheduleState: { not: 'UPCOMING' },
      },
      data: { scheduleState: 'UPCOMING' },
    }),
    prisma.event.updateMany({
      where: {
        ...activeEventWhere,
        startDate: { lte: now },
        endDate: { gte: now },
        scheduleState: { not: 'DUE' },
      },
      data: { scheduleState: 'DUE' },
    }),
    prisma.event.updateMany({
      where: {
        ...activeEventWhere,
        endDate: { lt: now },
        scheduleState: { not: 'PAST_DUE' },
      },
      data: { scheduleState: 'PAST_DUE' },
    }),
    prisma.event.updateMany({
      where: {
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        endDate: { lt: now },
        statusConfirmationState: 'NOT_REQUIRED',
      },
      data: { statusConfirmationState: 'NEEDS_STATUS_CONFIRMATION' },
    }),
  ])

  return {
    upcoming: upcoming.count,
    due: due.count,
    pastDue: pastDue.count,
    statusConfirmationsNeeded: statusConfirmations.count,
  }
}