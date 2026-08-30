import {
  buildCalendarGrid,
  calendarDateKey,
  calendarMonthRange,
  calendarMonthUrl,
  groupEventsByDate,
  normalizeCalendarMonth,
  normalizeSelectedCalendarDate,
} from '@/features/public/calendar-domain'
import { getPublicCalendarEvents } from '@/features/public/public-calendar'
import { prismaMock } from '../prisma-mock'

describe('public calendar domain and privacy', () => {
  it('normalizes hostile query values and keeps selected dates inside the viewed month', () => {
    const now = new Date('2026-08-11T02:00:00.000Z')
    expect(normalizeCalendarMonth('not-a-year', '99', now)).toEqual({ year: 2026, month: 7 })
    expect(normalizeCalendarMonth('2027', '0', now)).toEqual({ year: 2027, month: 0 })
    expect(normalizeSelectedCalendarDate('invalid', 2026, 7, '2026-08-11')).toBe('2026-08-11')
    expect(normalizeSelectedCalendarDate('2026-07-31', 2026, 7, '2026-08-11')).toBe('2026-08-11')
    expect(normalizeSelectedCalendarDate(undefined, 2026, 6, '2026-08-11')).toBe('2026-07-01')
  })

  it('builds a Monday-first Jakarta grid and exact Jakarta month range', () => {
    const days = buildCalendarGrid(2026, 7)
    expect(days.length % 7).toBe(0)
    expect(calendarDateKey(days[0]!)).toBe('2026-07-27')
    expect(calendarDateKey(days.at(-1)!)).toBe('2026-09-06')

    const [start, end] = calendarMonthRange(2026, 7)
    expect(start.toISOString()).toBe('2026-07-31T17:00:00.000Z')
    expect(end.toISOString()).toBe('2026-08-31T16:59:59.999Z')
  })

  it('keeps the active filter and selects the first day when navigating months', () => {
    expect(calendarMonthUrl(2026, 0, -1, 'agenda')).toBe('/kalender?year=2025&month=11&date=2025-12-01&type=agenda')
    expect(calendarMonthUrl(2026, 11, 1, 'all')).toBe('/kalender?year=2027&month=0&date=2027-01-01')
  })

  it('combines only PUBLIC Program and Agenda records, including visible overrides', async () => {
    prismaMock.program.findMany.mockResolvedValueOnce([{
      id: 'program-1',
      name: 'Program Tiga Hari',
      slug: 'program-tiga-hari',
      statusOverride: 'POSTPONED',
      plannedStart: new Date('2026-08-10T02:00:00.000Z'),
      plannedEnd: new Date('2026-08-12T04:00:00.000Z'),
      location: 'Indramayu',
      department: { name: 'PSDA' },
    }] as never)
    prismaMock.agenda.findMany.mockResolvedValueOnce([{
      id: 'agenda-1',
      name: 'Agenda Dibatalkan',
      status: 'CANCELLED',
      location: 'Sekretariat',
      scheduleType: 'FIXED_DATE',
      startDatetime: new Date('2026-08-10T03:00:00.000Z'),
      endDatetime: null,
      recurrenceRule: null,
      relativeOffset: null,
      organizationalUnit: { name: 'Sekretariat' },
      program: null,
      relativeToProgram: null,
    }] as never)

    const events = await getPublicCalendarEvents(...calendarMonthRange(2026, 7))
    const grouped = groupEventsByDate(events)

    expect(prismaMock.program.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ visibility: 'PUBLIC', deletedAt: null }),
    }))
    expect(prismaMock.agenda.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: null, visibility: 'PUBLIC', status: { notIn: ['ARCHIVED', 'DRAFT', 'COMPLETED'] } },
    }))
    expect(events.filter((event) => event.type === 'program')).toHaveLength(3)
    expect(events.find((event) => event.type === 'program')?.status).toBe('POSTPONED')
    expect(events.find((event) => event.type === 'agenda')?.status).toBe('CANCELLED')
    expect(grouped.get('2026-08-10')).toHaveLength(2)

    const programQuery = prismaMock.program.findMany.mock.calls[0]?.[0]
    const agendaQuery = prismaMock.agenda.findMany.mock.calls[0]?.[0]
    expect(JSON.stringify(programQuery?.select)).not.toMatch(/budget|pic|registration|created|updated/i)
    expect(JSON.stringify(agendaQuery?.select)).not.toMatch(/pic|registration|created|updated|email|phone/i)
  })
})
