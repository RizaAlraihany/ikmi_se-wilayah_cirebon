import { ValidationError } from '@/core/errors/custom-errors'
import { structureService } from '@/features/structure/services'
import { assignStructureSchema } from '@/features/structure/schemas'
import { publicStructureAssignmentSelect } from '@/features/public/public-data'
import { prismaMock } from '../prisma-mock'

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
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1' } as never)
    prismaMock.position.findFirst.mockResolvedValueOnce({ id: 'position-1' } as never)
    prismaMock.member.findFirst.mockResolvedValueOnce({ id: 'member-1' } as never)
    prismaMock.structureAssignment.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    prismaMock.structureAssignment.create.mockResolvedValueOnce({ id: 'assignment-1' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' } as never)

    await structureService.assignUser('period-1', { personType: 'MEMBER', personId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 2 }, 'admin-org')
    expect(prismaMock.structureAssignment.create).toHaveBeenCalledWith({ data: { periodId: 'period-1', userId: null, memberId: 'member-1', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 2 } })
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('rejects an inactive or unknown Member and keeps the public DTO free of PII', async () => {
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1' } as never)
    prismaMock.position.findFirst.mockResolvedValueOnce({ id: 'position-1' } as never)
    prismaMock.member.findFirst.mockResolvedValueOnce(null)
    await expect(structureService.assignUser('period-1', { personType: 'MEMBER', personId: 'inactive', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 0 }, 'admin-org')).rejects.toBeInstanceOf(ValidationError)
    expect(JSON.stringify(publicStructureAssignmentSelect)).not.toMatch(/email|phone|whatsapp|address|campus|studyProgram|password/i)
  })
})
