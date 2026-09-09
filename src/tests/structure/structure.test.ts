import { auth } from '@/core/auth/auth'
import { ForbiddenError, UnauthorizedError, ValidationError } from '@/core/errors/custom-errors'
import { assignStructureAction } from '@/features/structure/actions'
import { structureService } from '@/features/structure/services'
import { assignStructureSchema } from '@/features/structure/schemas'
import { publicStructureAssignmentSelect } from '@/features/public/public-data'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/cache/permission-cache', () => ({
  permissionCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('@/core/auth/auth', () => ({ auth: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const authMock = jest.mocked(auth)

const organizationActor: {
  id: string
  roleId: string
  departmentId: string | null
  positionId: string | null
  sessionVersion: number
  name: string
  email: string
} = {
  id: 'admin-org',
  roleId: 'admin_organization',
  departmentId: 'unit-1',
  positionId: null,
  sessionVersion: 1,
  name: 'Admin Organisasi',
  email: 'admin-org@example.test',
}

function allowStructureActor(actor = organizationActor) {
  prismaMock.user.findFirst.mockResolvedValue(actor as never)
  if (actor.roleId !== 'super_admin') {
    prismaMock.rolePermission.findUnique.mockResolvedValue({
      roleId: actor.roleId,
      permissionId: 'structure.manage',
    } as never)
  }
}

function allowActionActor(actor = organizationActor) {
  authMock.mockResolvedValue({ user: { id: actor.id, sessionVersion: actor.sessionVersion } } as never)
  allowStructureActor(actor)
}

function mockValidAssignmentPersistence(periodId = 'period-1', departmentId = 'unit-1') {
  prismaMock.period.findFirst.mockResolvedValueOnce({ id: periodId, name: 'Current' } as never)
  prismaMock.department.findFirst.mockResolvedValueOnce({ id: departmentId, periodId } as never)
  prismaMock.position.findFirst.mockResolvedValueOnce({ id: 'position-1', departmentId } as never)
  prismaMock.member.findFirst.mockResolvedValueOnce({ id: 'member-1', periodId } as never)
  prismaMock.structureAssignment.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
  prismaMock.structureAssignment.create.mockResolvedValueOnce({ id: 'assignment-1' } as never)
  prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' } as never)
}

describe('Structure organization domain', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)
  })

  it('requires exactly a typed person, unit, position, and bounded hierarchy order', () => {
    expect(assignStructureSchema.safeParse({ personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 1 }).success).toBe(true)
    expect(assignStructureSchema.safeParse({ personType: 'MEMBER', personId: '', departmentId: 'unit-1', positionId: 'position-1' }).success).toBe(false)
    expect(assignStructureSchema.safeParse({ personType: 'ACCOUNT', personId: 'user-1', departmentId: 'unit-1', positionId: 'position-1' }).success).toBe(false)
  })

  it('assigns an active Member without creating a dashboard User account', async () => {
    allowStructureActor()
    mockValidAssignmentPersistence()

    await structureService.assignUser('period-1', { personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 2 }, 'admin-org')
    expect(prismaMock.structureAssignment.create).toHaveBeenCalledWith({ data: { periodId: 'period-1', userId: null, memberId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 2 } })
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('rejects an inactive or unknown Member and keeps the public DTO free of PII', async () => {
    allowStructureActor()
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1', name: 'Current' } as never)
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1', periodId: 'period-1' } as never)
    prismaMock.position.findFirst.mockResolvedValueOnce({ id: 'position-1', departmentId: 'unit-2' } as never)
    prismaMock.member.findFirst.mockResolvedValueOnce(null)
    await expect(structureService.assignUser('period-1', { personType: 'MEMBER', personId: 'inactive', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 0 }, 'admin-org')).rejects.toBeInstanceOf(ValidationError)
    expect(JSON.stringify(publicStructureAssignmentSelect)).not.toMatch(/email|phone|whatsapp|address|campus|studyProgram|password/i)
  })

  it('denies an organization administrator assigning into another unit after loading the trusted target', async () => {
    allowStructureActor()
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-2', periodId: 'period-1' } as never)

    await expect(
      structureService.assignUser('period-1', {
        personType: 'MEMBER',
        personId: 'member-1',
        departmentId: 'unit-2',
        positionId: 'position-1',
        sortOrder: 0,
      }, organizationActor.id),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.position.findFirst).not.toHaveBeenCalled()
    expect(prismaMock.structureAssignment.create).not.toHaveBeenCalled()
  })

  it('allows Super Admin to assign across units', async () => {
    const superAdmin = { ...organizationActor, id: 'super-admin', roleId: 'super_admin', departmentId: null }
    allowStructureActor(superAdmin)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-2', periodId: 'period-1' } as never)
    prismaMock.position.findFirst.mockResolvedValueOnce({ id: 'position-1', departmentId: 'unit-2' } as never)
    prismaMock.member.findFirst.mockResolvedValueOnce({ id: 'member-1', periodId: 'period-1' } as never)
    prismaMock.structureAssignment.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    prismaMock.structureAssignment.create.mockResolvedValueOnce({ id: 'assignment-global' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-global' } as never)

    await expect(
      structureService.assignUser('period-1', {
        personType: 'MEMBER',
        personId: 'member-1',
        departmentId: 'unit-2',
        positionId: 'position-1',
        sortOrder: 0,
      }, superAdmin.id),
    ).resolves.toEqual({ id: 'assignment-global' })
  })

  it('denies Admin Komdigi even when a legacy structure permission is present', async () => {
    const komdigiActor = { ...organizationActor, id: 'admin-komdigi', roleId: 'admin_komdigi', departmentId: 'unit-1' }
    allowStructureActor(komdigiActor)

    await expect(
      structureService.assignUser('period-1', {
        personType: 'MEMBER',
        personId: 'member-1',
        departmentId: 'unit-1',
        positionId: 'position-1',
        sortOrder: 0,
      }, komdigiActor.id),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.period.findFirst).not.toHaveBeenCalled()
  })

  it('rejects an unauthenticated structure mutation before reading target data', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null)

    await expect(
      structureService.assignUser('period-1', {
        personType: 'MEMBER',
        personId: 'member-1',
        departmentId: 'unit-1',
        positionId: 'position-1',
        sortOrder: 0,
      }, 'missing-actor'),
    ).rejects.toBeInstanceOf(UnauthorizedError)
    expect(prismaMock.period.findFirst).not.toHaveBeenCalled()
  })

  it('denies archiving an assignment outside the organization administrator unit', async () => {
    allowStructureActor()
    prismaMock.structureAssignment.findFirst.mockResolvedValueOnce({
      id: 'assignment-other-unit',
      userId: 'user-1',
      memberId: null,
      departmentId: 'unit-2',
      positionId: 'position-1',
      periodId: 'period-1',
      period: { status: 'ACTIVE', deletedAt: null },
    } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1', name: 'Current' } as never)

    await expect(structureService.archiveAssignment('assignment-other-unit', organizationActor.id)).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.structureAssignment.update).not.toHaveBeenCalled()
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled()
  })

  it('allows an organization administrator to archive within its unit', async () => {
    allowStructureActor()
    prismaMock.structureAssignment.findFirst.mockResolvedValueOnce({
      id: 'assignment-own-unit',
      userId: null,
      memberId: 'member-1',
      departmentId: 'unit-1',
      positionId: 'position-1',
      periodId: 'period-1',
      period: { status: 'ACTIVE', deletedAt: null },
    } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1', name: 'Current' } as never)
    prismaMock.$transaction.mockResolvedValueOnce([] as never)

    await expect(structureService.archiveAssignment('assignment-own-unit', organizationActor.id)).resolves.toBeUndefined()
    expect(prismaMock.structureAssignment.update).toHaveBeenCalledWith({
      where: { id: 'assignment-own-unit' },
      data: { deletedAt: expect.any(Date) },
    })
    expect(prismaMock.auditLog.create).toHaveBeenCalled()
  })

  it('rejects a valid department paired with a position from another department', async () => {
    const unitAActor = { ...organizationActor, id: 'admin-unit-a', departmentId: 'unit-a' }
    allowStructureActor(unitAActor)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1', name: 'Current' } as never)
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-a', periodId: 'period-1' } as never)
    prismaMock.position.findFirst.mockResolvedValueOnce({ id: 'position-b', departmentId: 'unit-b' } as never)
    prismaMock.member.findFirst.mockResolvedValueOnce({ id: 'member-1', periodId: 'period-1' } as never)

    await expect(structureService.assignUser('period-1', {
      personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-a', positionId: 'position-b', sortOrder: 0,
    }, unitAActor.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.structureAssignment.create).not.toHaveBeenCalled()
  })

  it('rejects a missing or deleted position before loading the assignee or persisting', async () => {
    allowStructureActor()
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1', name: 'Current' } as never)
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1', periodId: 'period-1' } as never)
    prismaMock.position.findFirst.mockResolvedValueOnce(null)

    await expect(structureService.assignUser('period-1', {
      personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'deleted-position', sortOrder: 0,
    }, organizationActor.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.structureAssignment.create).not.toHaveBeenCalled()
  })

  it('rejects an older ACTIVE period even when its department and position are otherwise valid', async () => {
    allowStructureActor()
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-current', name: 'Current' } as never)

    await expect(structureService.assignUser('period-old', {
      personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 0,
    }, organizationActor.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.department.findFirst).not.toHaveBeenCalled()
    expect(prismaMock.structureAssignment.create).not.toHaveBeenCalled()
  })

  it('rejects an older ACTIVE assignment during archive, including for Super Admin', async () => {
    const superAdmin = { ...organizationActor, id: 'super-archive-old', roleId: 'super_admin', departmentId: null }
    allowStructureActor(superAdmin)
    prismaMock.structureAssignment.findFirst.mockResolvedValueOnce({
      id: 'assignment-old', userId: null, memberId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', periodId: 'period-old',
      period: { status: 'ACTIVE', deletedAt: null },
    } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-current', name: 'Current' } as never)

    await expect(structureService.archiveAssignment('assignment-old', superAdmin.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.structureAssignment.update).not.toHaveBeenCalled()
  })

  it('uses the real action guards for allowed, forbidden, unauthenticated, and stale sessions', async () => {
    allowActionActor()
    mockValidAssignmentPersistence()
    await expect(assignStructureAction('period-1', {
      personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 0,
    })).resolves.toMatchObject({ success: true })

    const komdigi = { ...organizationActor, id: 'komdigi-action', roleId: 'admin_komdigi' }
    allowActionActor(komdigi)
    prismaMock.rolePermission.findUnique.mockResolvedValue({ roleId: komdigi.roleId, permissionId: 'structure.manage' } as never)
    await expect(assignStructureAction('period-1', {
      personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 0,
    })).resolves.toMatchObject({ success: false })

    authMock.mockResolvedValueOnce(null as never)
    await expect(assignStructureAction('period-1', {
      personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 0,
    })).resolves.toMatchObject({ success: false })

    const stale = { ...organizationActor, id: 'stale-action', sessionVersion: 3 }
    authMock.mockResolvedValueOnce({ user: { id: stale.id, sessionVersion: 2 } } as never)
    prismaMock.user.findFirst.mockResolvedValue(stale as never)
    await expect(assignStructureAction('period-1', {
      personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 0,
    })).resolves.toMatchObject({ success: false })
  })
})
