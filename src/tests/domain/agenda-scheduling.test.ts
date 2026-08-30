import {
  deriveAgendaStatus,
  expandAgendaOccurrences,
  formatJakartaDatetimeLocal,
  parseJakartaDatetime,
  parseSupportedRRule,
  type AgendaScheduleInput,
} from '@/features/agendas/domain'

const rangeStart = new Date('2026-08-01T00:00:00.000Z')
const rangeEnd = new Date('2026-09-01T00:00:00.000Z')

function agenda(overrides: Partial<AgendaScheduleInput> = {}): AgendaScheduleInput {
  return {
    id: 'agenda-1', name: 'Agenda', scheduleType: 'FIXED_DATE',
    startDatetime: new Date('2026-08-10T09:00:00.000Z'), endDatetime: null,
    recurrenceRule: null, relativeOffset: null, program: null, relativeToProgram: null,
    ...overrides,
  }
}

describe('agenda schedule domain', () => {
  it('expands only recurrence with an explicit known start and valid supported RRULE', () => {
    const recurring = agenda({ scheduleType: 'RECURRING', recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2' })
    expect(expandAgendaOccurrences(recurring, rangeStart, rangeEnd).map((item) => item.start.toISOString())).toEqual([
      '2026-08-10T09:00:00.000Z', '2026-08-24T09:00:00.000Z',
    ])
    expect(expandAgendaOccurrences(agenda({ scheduleType: 'RECURRING', startDatetime: null, recurrenceRule: 'FREQ=MONTHLY' }), rangeStart, rangeEnd)).toEqual([])
    expect(() => parseSupportedRRule('FREQ=YEARLY')).toThrow('RRULE')
  })

  it('expands every supported BYMONTHDAY value without drifting across short months', () => {
    const recurring = agenda({
      scheduleType: 'RECURRING',
      startDatetime: new Date('2026-08-01T02:00:00.000Z'),
      recurrenceRule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=5,20',
    })

    expect(expandAgendaOccurrences(recurring, rangeStart, rangeEnd).map((item) => item.start.toISOString())).toEqual([
      '2026-08-05T02:00:00.000Z',
      '2026-08-20T02:00:00.000Z',
    ])
    expect(() => parseSupportedRRule('FREQ=MONTHLY;BYMONTHDAY=5,99')).toThrow('BYMONTHDAY')
    expect(() => parseSupportedRRule('FREQ=MONTHLY;COUNT=3')).toThrow('belum didukung')
  })

  it('fast-forwards an old daily master without losing current occurrences', () => {
    const recurring = agenda({
      scheduleType: 'RECURRING',
      startDatetime: new Date('2020-01-01T00:00:00.000Z'),
      recurrenceRule: 'FREQ=DAILY;INTERVAL=1',
    })

    expect(expandAgendaOccurrences(recurring, rangeStart, rangeEnd)[0]?.start.toISOString()).toBe('2026-08-01T00:00:00.000Z')
  })

  it('parses and formats datetime-local values explicitly in Asia/Jakarta', () => {
    const value = parseJakartaDatetime('2026-08-10T09:30')
    expect(value.toISOString()).toBe('2026-08-10T02:30:00.000Z')
    expect(formatJakartaDatetimeLocal(value)).toBe('2026-08-10T09:30')
  })

  it('does not invent dates for conditional or relative agenda before program actual completion', () => {
    expect(expandAgendaOccurrences(agenda({ scheduleType: 'CONDITIONAL' }), rangeStart, rangeEnd)).toEqual([])
    const relative = agenda({ scheduleType: 'RELATIVE_TO_PROGRAM', relativeOffset: 7, relativeToProgram: { actualEnd: null } })
    expect(expandAgendaOccurrences(relative, rangeStart, rangeEnd)).toEqual([])
    relative.relativeToProgram = { actualEnd: new Date('2026-08-20T00:00:00.000Z') }
    expect(expandAgendaOccurrences(relative, rangeStart, rangeEnd)[0]?.start.toISOString()).toBe('2026-08-27T00:00:00.000Z')
  })

  it('honors a postponed manual override before derived schedule state', () => {
    expect(deriveAgendaStatus({
      status: 'POSTPONED',
      scheduleType: 'FIXED_DATE',
      startDatetime: new Date('2026-08-10T09:00:00.000Z'),
      endDatetime: new Date('2026-08-10T11:00:00.000Z'),
    }, new Date('2026-08-10T10:00:00.000Z'))).toBe('DITUNDA')
  })

  it('derives fixed Agenda state from time instead of a stored normal status', () => {
    expect(deriveAgendaStatus({
      status: 'SCHEDULED',
      scheduleType: 'FIXED_DATE',
      startDatetime: new Date('2026-08-10T09:00:00.000Z'),
      endDatetime: new Date('2026-08-10T11:00:00.000Z'),
    }, new Date('2026-08-10T12:00:00.000Z'))).toBe('SELESAI')
  })
})
