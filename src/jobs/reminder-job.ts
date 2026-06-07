import { eventBus } from '@/core/events/event-bus'
import { eventQueries } from '@/features/events/queries'
import { financeQueries } from '@/features/finance/queries'

export const reminderJob = {
  async execute() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // 1. Reminder Agenda (Event yang akan mulai besok)
    const upcomingEvents = await eventQueries.getUpcomingEventsForReminder(tomorrow)

    for (const evt of upcomingEvents) {
      eventBus.emit('agenda.reminder.sent', { eventId: evt.id, title: evt.title })
    }

    // 2. Reminder Approval Pending (Finance Request yang masih PENDING)
    const pendingFinances = await financeQueries.getPendingRequests()

    for (const req of pendingFinances) {
      eventBus.emit('finance.reminder.sent', { requestId: req.id, amount: req.amount.toString() })
    }

    // 3. LPJ Overdue Checker (Event COMPLETED > 7 days ago tapi belum ada Report)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const overdueEvents = await eventQueries.getOverdueEventsWithoutReport(sevenDaysAgo)

    for (const evt of overdueEvents) {
      eventBus.emit('lpj.overdue', { eventId: evt.id, title: evt.title })
    }

    return {
      remindedEvents: upcomingEvents.length,
      remindedFinances: pendingFinances.length,
      overdueLpj: overdueEvents.length
    }
  }
}
