import { ForbiddenError } from '@/core/errors/custom-errors'
import { agendaService } from '@/features/agendas/services'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/cache/permission-cache', () => ({
  permissionCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  },
}))

const baseInput = {
  name: 'Agenda lintas unit',
  organizationalUnitId: 'unit-1',
  periodId: 'period-1',
  description: '',
  picId: '',
  programId: '',
  scheduleType: 'FIXED_DATE',
  startDatetime: '2026-09-10T09:00',
  endDatetime: '2026-09-10T11:00',
  recurrenceRule: '',
  relativeToProgramId: '',
  relativeOffset: '',
  conditionalNote: '',
  location: 'Sekretariat IKMI',
  visibility: 'PUBLIC',
  status: 'SCHEDULED',
  requiresRegistration: false,
  registrationType: null,
}

function actor(roleId: string, departmentId: string | null, suffix: string) {
  return {
    id: `${roleId}-${suffix}`,
    name: 'Test Actor',
    email: `${roleId}-${suffix}@example.test`,
    roleId,
    departmentId,
    positionId: null,
    sessionVersion: 1,
  }
}

function allowCalendarPermissionForOrganizationRole() {
  prismaMock.rolePermission.findUnique.mockResolvedValue({
    roleId: 'admin_organization',
    permissionId: 'calendar.manage',
  } as never)
}

function mockTransaction() {
  prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
    if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
    return callback(prismaMock)
  }) as never)
}

describe('Agenda service organizational unit scope', () => {
  beforeEach(async () => {
    allowCalendarPermissionForOrganizationRole()
  })

  it('allows an organization administrator to create within its own unit', async () => {
    const user = actor('admin_organization', 'unit-1', 'create')
    prismaMock.user.findFirst.mockResolvedValue(user as never)
    prismaMock.department.findFirst.mockResolvedValue({ id: 'unit-1', periodId: 'period-1' } as never)
    prismaMock.period.findFirst.mockResolvedValue({ id: 'period-1' } as never)
    prismaMock.agenda.findMany.mockResolvedValue([] as never)
    prismaMock.agenda.create.mockResolvedValue({ id: 'agenda-own-unit' } as never)
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-own-unit' } as never)
    mockTransaction()

    await expect(agendaService.create(baseInput, user.id)).resolves.toEqual({ id: 'agenda-own-unit' })
    expect(prismaMock.agenda.create).toHaveBeenCalled()
  })

  it('denies an organization administrator creating in another unit even with broad legacy permissions', async () => {
    const user = actor('admin_organization', 'unit-1', 'create-outside')
    prismaMock.user.findFirst.mockResolvedValue(user as never)
    prismaMock.rolePermission.findUnique.mockResolvedValue({
      roleId: 'admin_organization',
      permissionId: 'system.manage',
    } as never)

    await expect(agendaService.create({ ...baseInput, organizationalUnitId: 'unit-2' }, user.id))
      .rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.department.findFirst).not.toHaveBeenCalled()
    expect(prismaMock.agenda.create).not.toHaveBeenCalled()
  })

  it('denies out-of-unit update and archive after loading the trusted target unit', async () => {
    const user = actor('admin_organization', 'unit-1', 'mutate-outside')
    prismaMock.user.findFirst.mockResolvedValue(user as never)
    prismaMock.agenda.findFirst.mockResolvedValue({
      id: 'agenda-other-unit',
      organizationalUnitId: 'unit-2',
      name: 'Agenda lain',
    } as never)

    await expect(agendaService.update('agenda-other-unit', baseInput, user.id))
      .rejects.toBeInstanceOf(ForbiddenError)
    await expect(agendaService.archive('agenda-other-unit', user.id))
      .rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('allows Super Admin to mutate across organizational units', async () => {
    const user = actor('super_admin', 'unit-1', 'global')
    prismaMock.user.findFirst.mockResolvedValue(user as never)
    prismaMock.department.findFirst.mockResolvedValue({ id: 'unit-2', periodId: 'period-1' } as never)
    prismaMock.period.findFirst.mockResolvedValue({ id: 'period-1' } as never)
    prismaMock.agenda.findMany.mockResolvedValue([] as never)
    prismaMock.agenda.create.mockResolvedValue({ id: 'agenda-global' } as never)
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-global' } as never)
    mockTransaction()

    await expect(agendaService.create({ ...baseInput, organizationalUnitId: 'unit-2' }, user.id))
      .resolves.toEqual({ id: 'agenda-global' })
  })
})
