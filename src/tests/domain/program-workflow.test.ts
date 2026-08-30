import { deriveProgramStatus, programStatusLabel } from '@/features/programs/domain'

describe('Program status domain', () => {
  const schedule = {
    plannedStart: new Date('2026-08-10T00:00:00+07:00'),
    plannedEnd: new Date('2026-08-12T23:59:59+07:00'),
    statusOverride: null,
  } as const

  it('derives unscheduled, upcoming, ongoing, and completed status from planned Jakarta dates', () => {
    expect(deriveProgramStatus({ ...schedule, plannedStart: null, plannedEnd: null }, new Date('2026-08-10T00:00:00+07:00'))).toBe('UNSCHEDULED')
    expect(deriveProgramStatus(schedule, new Date('2026-08-09T23:59:59+07:00'))).toBe('UPCOMING')
    expect(deriveProgramStatus({ ...schedule, plannedEnd: null }, new Date('2026-08-09T23:59:59+07:00'))).toBe('UPCOMING')
    expect(deriveProgramStatus({ ...schedule, plannedEnd: null }, new Date('2026-08-11T12:00:00+07:00'))).toBe('ONGOING')
    expect(deriveProgramStatus(schedule, new Date('2026-08-11T12:00:00+07:00'))).toBe('ONGOING')
    expect(deriveProgramStatus(schedule, new Date('2026-08-13T00:00:00+07:00'))).toBe('COMPLETED')
  })

  it('uses only the permitted manual overrides', () => {
    expect(deriveProgramStatus({ ...schedule, statusOverride: 'POSTPONED' }, new Date('2026-08-11T12:00:00+07:00'))).toBe('POSTPONED')
    expect(deriveProgramStatus({ ...schedule, statusOverride: 'CANCELLED' }, new Date('2026-08-11T12:00:00+07:00'))).toBe('CANCELLED')
    expect(programStatusLabel('UNSCHEDULED')).toBe('Belum dijadwalkan')
  })
})
