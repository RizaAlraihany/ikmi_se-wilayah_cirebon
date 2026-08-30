import { prisma } from '@/core/database/prisma'
import { expandAgendaOccurrences } from '@/features/agendas/domain'
import {
  calendarDateKey,
  jakartaCalendarDate,
  jakartaDateParts,
  type CalendarEvent,
  type CalendarEventStatus,
} from './calendar-domain'

export type { CalendarEvent, CalendarEventStatus } from './calendar-domain'

function eventStatus(value: string | null | undefined): CalendarEventStatus {
  if (value === 'POSTPONED') return 'POSTPONED'
  if (value === 'CANCELLED') return 'CANCELLED'
  return 'NORMAL'
}

function expandProgramDays(
  program: {
    id: string
    name: string
    slug: string | null
    plannedStart: Date | null
    plannedEnd: Date | null
    location: string | null
    statusOverride: string | null
    department: { name: string } | null
  },
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  if (!program.plannedStart) return []
  const startParts = jakartaDateParts(program.plannedStart)
  const endParts = jakartaDateParts(program.plannedEnd ?? program.plannedStart)
  let cursor = jakartaCalendarDate(startParts.year, startParts.month, startParts.day)
  const finalDate = jakartaCalendarDate(endParts.year, endParts.month, endParts.day)
  const events: CalendarEvent[] = []

  while (cursor <= finalDate && events.length < 370) {
    if (cursor >= rangeStart && cursor <= rangeEnd) {
      const dateKey = calendarDateKey(cursor)
      events.push({
        id: `program:${program.id}:${dateKey}`,
        type: 'program',
        name: program.name,
        slug: program.slug,
        date: cursor,
        endDate: program.plannedEnd,
        location: program.location,
        unitName: program.department?.name ?? null,
        status: eventStatus(program.statusOverride),
      })
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return events
}

/** Fetches PUBLIC Program and Agenda occurrences for one bounded calendar range. */
export async function getPublicCalendarEvents(rangeStart: Date, rangeEnd: Date): Promise<CalendarEvent[]> {
  const [programs, agendas] = await Promise.all([
    prisma.program.findMany({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
        plannedStart: { not: null, lte: rangeEnd },
        AND: [{
          OR: [
            { plannedEnd: { gte: rangeStart } },
            { plannedEnd: null, plannedStart: { gte: rangeStart } },
          ],
        }],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        statusOverride: true,
        plannedStart: true,
        plannedEnd: true,
        location: true,
        department: { select: { name: true } },
      },
    }),
    prisma.agenda.findMany({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
        status: { notIn: ['ARCHIVED', 'DRAFT', 'COMPLETED'] },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        location: true,
        scheduleType: true,
        startDatetime: true,
        endDatetime: true,
        recurrenceRule: true,
        relativeOffset: true,
        organizationalUnit: { select: { name: true } },
        program: { select: { actualEnd: true } },
        relativeToProgram: { select: { actualEnd: true } },
      },
    }),
  ])

  const programEvents = programs.flatMap((program) => expandProgramDays(program, rangeStart, rangeEnd))
  const agendaEvents: CalendarEvent[] = agendas.flatMap((agenda) =>
    expandAgendaOccurrences(agenda, rangeStart, rangeEnd).map((occurrence) => ({
      id: `agenda:${agenda.id}:${occurrence.start.toISOString()}`,
      type: 'agenda' as const,
      name: agenda.name,
      slug: agenda.slug,
      date: occurrence.start,
      endDate: occurrence.end,
      location: agenda.location,
      unitName: agenda.organizationalUnit?.name ?? null,
      scheduleType: agenda.scheduleType,
      status: eventStatus(agenda.status),
    })),
  )

  return [...programEvents, ...agendaEvents].sort((left, right) => {
    const dateOrder = left.date.getTime() - right.date.getTime()
    return dateOrder || left.name.localeCompare(right.name, 'id-ID')
  })
}
