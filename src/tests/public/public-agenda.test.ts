import {
  getCompletedPublicAgendaOccurrences,
  getPublicAgendaOccurrences,
  publicAgendaSelect,
} from '@/features/public/public-agenda'
import { publicPlainText } from '@/features/public/public-text'
import { prismaMock } from '../prisma-mock'

describe('public Agenda data', () => {
  it('uses an explicit public allow-list and keeps manual overrides visible', async () => {
    prismaMock.agenda.findMany.mockResolvedValueOnce([{
      id: 'agenda-1',
      name: 'Agenda Ditunda',
      description: '<p>Informasi aman</p>',
      location: 'Sekretariat',
      status: 'POSTPONED',
      scheduleType: 'FIXED_DATE',
      startDatetime: new Date('2026-08-10T02:00:00.000Z'),
      endDatetime: new Date('2026-08-10T04:00:00.000Z'),
      recurrenceRule: null,
      relativeOffset: null,
      organizationalUnit: { name: 'Sekretariat' },
      program: null,
      relativeToProgram: null,
    }] as never)

    const result = await getPublicAgendaOccurrences(new Date('2026-08-01T00:00:00.000Z'))

    expect(prismaMock.agenda.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
        status: { notIn: ['ARCHIVED', 'DRAFT', 'COMPLETED'] },
      },
      select: publicAgendaSelect,
    }))
    expect(JSON.stringify(publicAgendaSelect)).not.toMatch(/pic|registration|created|updated|email|phone/i)
    expect(result[0]).toEqual(expect.objectContaining({ agendaId: 'agenda-1', status: 'POSTPONED' }))
  })

  it('converts unsafe legacy markup to inert public text', () => {
    expect(publicPlainText('<p>Agenda aman</p><script>alert(1)</script><style>body{display:none}</style>')).toBe('Agenda aman')
  })

  it('keeps a fixed multi-day Agenda visible while it is still running', async () => {
    prismaMock.agenda.findMany.mockResolvedValueOnce([{
      id: 'agenda-running',
      name: 'Agenda Berjalan',
      description: null,
      location: null,
      status: 'SCHEDULED',
      scheduleType: 'FIXED_DATE',
      startDatetime: new Date('2026-08-09T00:00:00.000Z'),
      endDatetime: new Date('2026-08-12T00:00:00.000Z'),
      recurrenceRule: null,
      relativeOffset: null,
      organizationalUnit: null,
      program: null,
      relativeToProgram: null,
    }] as never)

    const result = await getPublicAgendaOccurrences(new Date('2026-08-11T00:00:00.000Z'))

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(expect.objectContaining({ agendaId: 'agenda-running' }))
  })

  it('loads only past public occurrences for the completed activity view', async () => {
    prismaMock.agenda.findMany.mockResolvedValueOnce([{
      id: 'agenda-completed',
      name: 'Agenda Selesai',
      description: null,
      location: null,
      status: 'COMPLETED',
      scheduleType: 'FIXED_DATE',
      startDatetime: new Date('2026-07-01T02:00:00.000Z'),
      endDatetime: new Date('2026-07-01T04:00:00.000Z'),
      recurrenceRule: null,
      relativeOffset: null,
      organizationalUnit: null,
      program: null,
      relativeToProgram: null,
    }] as never)

    const result = await getCompletedPublicAgendaOccurrences(new Date('2026-08-11T00:00:00.000Z'))

    expect(prismaMock.agenda.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
        status: { notIn: ['ARCHIVED', 'DRAFT'] },
      },
      select: publicAgendaSelect,
    }))
    expect(result.map((item) => item.agendaId)).toEqual(['agenda-completed'])
  })
})
