import { prisma } from '@/core/database/prisma'
import { NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import type { AssignStructureInput } from './schemas'

export const structureService = {
  async getActivePeriodAssignments() {
    const activePeriod = await prisma.period.findFirst({ where: { status: 'ACTIVE', deletedAt: null }, select: { id: true } })
    if (!activePeriod) return []

    return prisma.structureAssignment.findMany({
      where: { periodId: activePeriod.id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } },
        member: { select: { id: true, fullName: true, photoUrl: true } },
        department: true,
        position: true,
      },
      orderBy: [{ department: { sortOrder: 'asc' } }, { department: { name: 'asc' } }, { position: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    })
  },

  async assignUser(periodId: string, data: AssignStructureInput, adminId: string) {
    const [period, department, position, assignee] = await Promise.all([
      prisma.period.findFirst({ where: { id: periodId, status: 'ACTIVE', deletedAt: null }, select: { id: true } }),
      prisma.department.findFirst({ where: { id: data.departmentId, periodId, status: 'ACTIVE', deletedAt: null }, select: { id: true } }),
      prisma.position.findFirst({ where: { id: data.positionId, departmentId: data.departmentId, deletedAt: null }, select: { id: true } }),
      data.personType === 'MEMBER'
        ? prisma.member.findFirst({ where: { id: data.personId, membershipStatus: 'ACTIVE_MEMBER', deletedAt: null }, select: { id: true } })
        : prisma.user.findFirst({ where: { id: data.personId, isActive: true, deletedAt: null }, select: { id: true } }),
    ])
    if (!period) throw new ValidationError('Periode aktif tidak ditemukan.')
    if (!department) throw new ValidationError('Unit organisasi tidak aktif atau bukan milik periode ini.')
    if (!position) throw new ValidationError('Jabatan tidak sesuai dengan unit organisasi yang dipilih.')
    if (!assignee) throw new ValidationError('Pengurus tidak aktif atau tidak ditemukan.')

    const [existingPersonAssignment, occupiedPosition] = await Promise.all([
      prisma.structureAssignment.findFirst({ where: { periodId, positionId: data.positionId, deletedAt: null, ...(data.personType === 'MEMBER' ? { memberId: data.personId } : { userId: data.personId }) }, select: { id: true } }),
      prisma.structureAssignment.findFirst({ where: { periodId, positionId: data.positionId, deletedAt: null }, select: { id: true } }),
    ])
    if (existingPersonAssignment) throw new ValidationError('Pengurus ini sudah ditugaskan pada jabatan tersebut di periode aktif.')
    if (occupiedPosition) throw new ValidationError('Jabatan ini sudah memiliki pengurus pada periode aktif.')

    return prisma.$transaction(async (tx) => {
      const created = await tx.structureAssignment.create({
        data: { periodId, userId: data.personType === 'USER' ? data.personId : null, memberId: data.personType === 'MEMBER' ? data.personId : null, departmentId: data.departmentId, positionId: data.positionId, sortOrder: data.sortOrder },
      })
      await tx.auditLog.create({
        data: {
          action: 'CREATE', entity: 'StructureAssignment', entityId: created.id, userId: adminId,
          newData: JSON.stringify({ personType: data.personType, personId: data.personId, departmentId: data.departmentId, positionId: data.positionId, periodId, sortOrder: data.sortOrder }),
        },
      })
      return created
    })
  },

  async archiveAssignment(assignmentId: string, adminId: string) {
    const assignment = await prisma.structureAssignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: { period: { select: { status: true } } },
    })
    if (!assignment) throw new NotFoundError('Penugasan tidak ditemukan.')
    if (assignment.period.status !== 'ACTIVE') throw new ValidationError('Penugasan periode arsip tidak dapat diubah.')

    await prisma.$transaction([
      prisma.structureAssignment.update({ where: { id: assignmentId }, data: { deletedAt: new Date() } }),
      prisma.auditLog.create({
        data: {
          action: 'ARCHIVE', entity: 'StructureAssignment', entityId: assignmentId, userId: adminId,
          oldData: JSON.stringify({ userId: assignment.userId, memberId: assignment.memberId, departmentId: assignment.departmentId, positionId: assignment.positionId, periodId: assignment.periodId }),
        },
      }),
    ])
  },
}
