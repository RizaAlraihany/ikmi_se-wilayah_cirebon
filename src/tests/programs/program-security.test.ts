import { ForbiddenError, ValidationError } from '@/core/errors/custom-errors'
import { requirePermissionForUser } from '@/core/authorization/guards'
import { programCreateSchema } from '@/features/programs/schemas'
import { programService } from '@/features/programs/services'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/authorization/guards', () => ({ requirePermissionForUser: jest.fn() }))

const requirePermissionForUserMock = jest.mocked(requirePermissionForUser)
const actor = {
  id: 'admin-organization-1',
  roleId: 'admin_organization',
  departmentId: null,
  positionId: null,
}

const validInput = {
  name: 'Program Literasi',
  organizationalUnitId: 'unit-1',
  periodId: 'period-1',
  description: 'Program literasi untuk anggota IKMI.',
  visibility: 'HIDDEN',
  campaignEnabled: true,
  featured: false,
  requiresRegistration: false,
}

describe('Program security and domain contract', () => {
  beforeEach(() => {
    requirePermissionForUserMock.mockResolvedValue(actor)
  })

  it('authorizes before looking up a Program mutation target', async () => {
    requirePermissionForUserMock.mockRejectedValueOnce(new ForbiddenError())

    await expect(programService.update('unknown-program', {}, actor.id)).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.program.findFirst).not.toHaveBeenCalled()
  })

  it('rejects an organizational unit from a different period', async () => {
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1', periodId: 'period-other' } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)

    await expect(programService.create(validInput, actor.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('keeps campaign eligibility independent from a removed Program type', () => {
    const result = programCreateSchema.parse(validInput)

    expect(result.campaignEnabled).toBe(true)
    expect(result).not.toHaveProperty('programType')
    expect(result).not.toHaveProperty('requiresCommittee')
  })

  it('creates a Program and audit record without legacy type or committee fields', async () => {
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1', periodId: 'period-1' } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)
    prismaMock.program.findMany.mockResolvedValueOnce([])
    prismaMock.program.create.mockResolvedValueOnce({ id: 'program-1', name: validInput.name } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await expect(programService.create(validInput, actor.id)).resolves.toEqual(expect.objectContaining({ id: 'program-1' }))

    const createData = prismaMock.program.create.mock.calls[0]?.[0].data
    expect(createData).toEqual(expect.objectContaining({
      name: validInput.name,
      visibility: 'HIDDEN',
      campaignEnabled: true,
      createdBy: actor.id,
    }))
    expect(createData).not.toHaveProperty('programType')
    expect(createData).not.toHaveProperty('requiresCommittee')
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'CREATE', entity: 'Program', userId: actor.id }),
    }))
  })

  it('archives instead of permanently deleting a Program', async () => {
    prismaMock.program.findFirst.mockResolvedValueOnce({ id: 'program-1', deletedAt: null } as never)
    prismaMock.program.update.mockResolvedValueOnce({ id: 'program-1' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-archive' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await programService.archive('program-1', actor.id)

    expect(prismaMock.program.update).toHaveBeenCalledWith({
      where: { id: 'program-1' },
      data: { deletedAt: expect.any(Date), updatedBy: actor.id },
    })
    expect(prismaMock.program.delete).not.toHaveBeenCalled()
  })
})
