import { eventBus } from '@/core/events/event-bus'
import { prisma } from '@/core/database/prisma'
import { eventQueries } from '@/features/events/queries'

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
      where: { status: 'PENDING', deletedAt: null },
      select: { id: true },
    })

    for (const registration of pendingRegistrations) {
      await eventBus.emit('registration.reminder.pending', { registrationId: registration.id })
    }

    return {
      remindedEvents,
      remindedFinances: 0,
      overdueLpj: overdueEvents.length,
      remindedRegistrations: pendingRegistrations.length,
    }
  }
}
