import { ForbiddenError, ValidationError } from '@/core/errors/custom-errors'
import { requirePermissionForUser } from '@/core/authorization/guards'
import { can } from '@/core/authorization/rbac'
import { agendaService, agendaSlugFromName } from '@/features/agendas/services'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/authorization/guards', () => ({ requirePermissionForUser: jest.fn() }))
jest.mock('@/core/authorization/rbac', () => ({ can: jest.fn() }))

const requirePermissionForUserMock = jest.mocked(requirePermissionForUser)
const canMock = jest.mocked(can)
const actor = {
  id: 'admin-organization-1',
  name: 'Admin Organisasi',
  email: 'admin@example.test',
  roleId: 'admin_organization',
  departmentId: null,
  positionId: null,
  sessionVersion: 1,
}

const validInput = {
  name: 'Rapat Evaluasi',
  organizationalUnitId: 'unit-1',
  periodId: 'period-1',
  description: '',
  picId: '',
  programId: '',
  scheduleType: 'FIXED_DATE',
  startDatetime: '2026-08-20T09:00',
  endDatetime: '2026-08-20T11:00',
  recurrenceRule: '',
  relativeToProgramId: '',
  relativeOffset: '',
  conditionalNote: '',
  location: 'Sekretariat IKMI',
  visibility: 'HIDDEN',
  status: 'SCHEDULED',
  requiresRegistration: false,
  registrationType: null,
}

describe('Agenda security and storage invariants', () => {
  beforeEach(() => {
    requirePermissionForUserMock.mockResolvedValue(actor as never)
    canMock.mockResolvedValue(true)
  })

  it('creates a clean canonical slug base from the Agenda name', () => {
    expect(agendaSlugFromName('Sapa Rasa: Ruang Diskusi')).toBe('sapa-rasa-ruang-diskusi')
  })

  it('authorizes before parsing or looking up an Agenda mutation target', async () => {
    requirePermissionForUserMock.mockRejectedValueOnce(new ForbiddenError())

    await expect(agendaService.update('unknown-agenda', {}, actor.id)).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.agenda.findFirst).not.toHaveBeenCalled()
  })

  it('rejects an organizational unit from a different period', async () => {
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1', periodId: 'period-other' } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)

    await expect(agendaService.create(validInput, actor.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('stores Asia/Jakarta time and clears stale fields when schedule type changes', async () => {
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1', periodId: 'period-1' } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)
    prismaMock.agenda.create.mockResolvedValueOnce({ id: 'agenda-1', name: 'Rapat Kondisional' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await agendaService.create({
      ...validInput,
      name: 'Rapat Kondisional',
      scheduleType: 'CONDITIONAL',
      conditionalNote: 'Dilaksanakan setelah izin lokasi tersedia.',
    }, actor.id)

    expect(prismaMock.agenda.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scheduleType: 'CONDITIONAL',
        startDatetime: null,
        endDatetime: null,
        recurrenceRule: null,
        relativeToProgramId: null,
        relativeOffset: null,
        conditionalNote: 'Dilaksanakan setelah izin lokasi tersedia.',
        status: 'UNSCHEDULED',
      }),
    })
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'CREATE', entity: 'Agenda', userId: actor.id }),
    }))
  })

  it('stores datetime-local input as an Asia/Jakarta instant', async () => {
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1', periodId: 'period-1' } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)
    prismaMock.agenda.create.mockResolvedValueOnce({ id: 'agenda-2' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-2' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await agendaService.create(validInput, actor.id)

    const data = prismaMock.agenda.create.mock.calls[0]?.[0].data
    expect(data.startDatetime).toEqual(new Date('2026-08-20T02:00:00.000Z'))
    expect(data.endDatetime).toEqual(new Date('2026-08-20T04:00:00.000Z'))
  })

  it('archives with a soft delete and never permanently deletes an Agenda', async () => {
    prismaMock.agenda.findFirst.mockResolvedValueOnce({ id: 'agenda-1', organizationalUnitId: 'unit-1' } as never)
    prismaMock.agenda.update.mockResolvedValueOnce({ id: 'agenda-1' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-archive' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await agendaService.archive('agenda-1', actor.id)

    expect(prismaMock.agenda.update).toHaveBeenCalledWith({
      where: { id: 'agenda-1' },
      data: { status: 'ARCHIVED', deletedAt: expect.any(Date) },
    })
    expect(prismaMock.agenda.delete).not.toHaveBeenCalled()
  })
})
