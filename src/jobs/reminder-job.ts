import { eventBus } from '@/core/events/event-bus'
import { prisma } from '@/core/database/prisma'
import { eventQueries } from '@/features/events/queries'
import { logger } from '@/core/monitoring/logger'

const EVENT_REMINDER_DAYS = [30, 14, 7, 3, 1]

export const reminderJob = {
  async execute() {
    const now = new Date()
    let remindedEvents = 0

    // ─── 1. Kirim reminder agenda yang akan datang ─────────────────────────────
    for (const daysBefore of EVENT_REMINDER_DAYS) {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const upcomingEvents = await eventQueries.getUpcomingEventsForReminder(targetDate)

      for (const evt of upcomingEvents) {
        await eventBus.emit('agenda.reminder.sent', { eventId: evt.id, title: evt.title, daysBefore })
      }
      remindedEvents += upcomingEvents.length
    }

    // ─── 2. Reminder LPJ overdue ───────────────────────────────────────────────
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const overdueEvents = await eventQueries.getOverdueEventsWithoutReport(sevenDaysAgo)
    for (const evt of overdueEvents) {
      await eventBus.emit('lpj.overdue', { eventId: evt.id, title: evt.title })
    }

    // ─── 3. Reminder registrasi pending ───────────────────────────────────────
    const pendingRegistrations = await prisma.registration.findMany({
      where: { status: 'PENDING', deletedAt: null },
      select: { id: true },
    })
    for (const registration of pendingRegistrations) {
      await eventBus.emit('registration.reminder.pending', { registrationId: registration.id })
    }

    // ─── 4. Auto-complete: UPCOMING/ONGOING → COMPLETED jika endDate sudah lewat
    const { completedEvents, completedPrograms } = await autoCompleteExpired(now)

    // ─── 5. Auto-set: UPCOMING → ONGOING jika sudah melewati startDate ─────────
    const { ongoingEvents } = await autoSetOngoing(now)

    logger.automation('cron.auto-complete', {
      completedEvents,
      completedPrograms,
      ongoingEvents,
    })

    return {
      remindedEvents,
      remindedFinances: 0,
      overdueLpj: overdueEvents.length,
      remindedRegistrations: pendingRegistrations.length,
      autoCompleted: { events: completedEvents, programs: completedPrograms },
      autoOngoing: { events: ongoingEvents },
    }
  }
}

/**
 * Otomatis tandai Event sebagai COMPLETED jika endDate sudah terlewat.
 * Kemudian evaluasi Program: jika semua event-nya selesai, Program ikut COMPLETED.
 */
async function autoCompleteExpired(now: Date) {
  // Ambil semua event expired yang masih aktif
  const expiredEvents = await eventQueries.getExpiredActiveEvents(now)

  if (expiredEvents.length === 0) {
    return { completedEvents: 0, completedPrograms: 0 }
  }

  const expiredIds = expiredEvents.map((e) => e.id)

  // Update semua event expired ke COMPLETED dalam satu query
  await prisma.event.updateMany({
    where: { id: { in: expiredIds } },
    data: { status: 'COMPLETED' },
  })

  logger.automation('auto-complete.events', {
    count: expiredIds.length,
    ids: expiredIds,
  })

  // Kumpulkan programId unik yang perlu dievaluasi
  const programIds = [
    ...new Set(
      expiredEvents
        .map((e) => e.programId)
        .filter((id): id is string => id !== null)
    ),
  ]

  let completedPrograms = 0

  // Evaluasi tiap program: apakah semua event-nya sudah selesai?
  for (const programId of programIds) {
    const remainingActive = await prisma.event.count({
      where: {
        programId,
        deletedAt: null,
        status: { in: ['UPCOMING', 'ONGOING'] },
      },
    })

    if (remainingActive === 0) {
      // Tidak ada event aktif → Program selesai
      await prisma.program.updateMany({
        where: {
          id: programId,
          status: { in: ['PLANNED', 'ONGOING'] },
        },
        data: { status: 'COMPLETED' },
      })
      completedPrograms++

      logger.automation('auto-complete.program', { programId })
    }
  }

  return { completedEvents: expiredIds.length, completedPrograms }
}

/**
 * Otomatis tandai Event sebagai ONGOING jika startDate sudah terlewat
 * tapi endDate belum terlewat dan masih berstatus UPCOMING.
 * Juga update Program ke ONGOING jika sebelumnya masih PLANNED.
 */
async function autoSetOngoing(now: Date) {
  const eventsToSetOngoing = await eventQueries.getOngoingActiveEvents(now)

  if (eventsToSetOngoing.length === 0) {
    return { ongoingEvents: 0 }
  }

  const ongoingIds = eventsToSetOngoing.map((e) => e.id)

  await prisma.event.updateMany({
    where: { id: { in: ongoingIds } },
    data: { status: 'ONGOING' },
  })

  logger.automation('auto-set.ongoing.events', {
    count: ongoingIds.length,
    ids: ongoingIds,
  })

  // Update Program terkait ke ONGOING jika masih PLANNED
  const programIds = [
    ...new Set(
      eventsToSetOngoing
        .map((e) => e.programId)
        .filter((id): id is string => id !== null)
    ),
  ]

  if (programIds.length > 0) {
    await prisma.program.updateMany({
      where: {
        id: { in: programIds },
        status: 'PLANNED',
      },
      data: { status: 'ONGOING' },
    })
  }

  return { ongoingEvents: ongoingIds.length }
}
