import { prisma } from '@/core/database/prisma'
import { requirePermissionForUser, requireRoleForUser } from '@/core/authorization/guards'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import type { SessionUser } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { getCurrentStructurePeriod } from '@/features/public/public-structure'
import type { AssignStructureInput } from './schemas'

async function requireStructureActor(actorId: string) {
  const actor = await requireRoleForUser(actorId, ORGANIZATION_DASHBOARD_ROLE_IDS)
  return requirePermissionForUser(actor, 'structure.manage')
}

async function assertStructureUnitScope(actor: SessionUser, departmentId: string) {
  if (actor.roleId === 'super_admin') return
  if (actor.departmentId !== departmentId) {
    throw new ForbiddenError('Anda hanya dapat mengelola struktur unit organisasi Anda.')
  }
}

export const structureService = {
  async getActivePeriodAssignments() {
    const activePeriod = await getCurrentStructurePeriod()
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
    const actor = await requireStructureActor(adminId)
    const period = await getCurrentStructurePeriod()
    if (!period) throw new ValidationError('Periode aktif tidak ditemukan.')
    if (periodId !== period.id) throw new ValidationError('Penugasan hanya dapat dilakukan pada periode struktur saat ini.')

    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, periodId: period.id, status: 'ACTIVE', deletedAt: null },
      select: { id: true, periodId: true },
    })
    if (!department) throw new ValidationError('Unit organisasi tidak aktif atau bukan milik periode ini.')
    await assertStructureUnitScope(actor, department.id)

    const [position, assignee] = await Promise.all([
      prisma.position.findFirst({
        where: { id: data.positionId, departmentId: department.id, deletedAt: null },
        select: { id: true, departmentId: true },
      }),
      data.personType === 'MEMBER'
        ? prisma.member.findFirst({
            where: { id: data.personId, membershipStatus: 'ACTIVE_MEMBER', deletedAt: null },
            select: { id: true, periodId: true },
          })
        : prisma.user.findFirst({
            where: { id: data.personId, isActive: true, deletedAt: null },
            select: { id: true },
          }),
    ])
    if (!position) throw new ValidationError('Jabatan tidak sesuai dengan unit organisasi yang dipilih.')
    if (position.departmentId !== department.id) throw new ValidationError('Jabatan tidak sesuai dengan unit organisasi yang dipilih.')
    if (!assignee) throw new ValidationError('Pengurus tidak aktif atau tidak ditemukan.')
    if (data.personType === 'MEMBER' && 'periodId' in assignee && assignee.periodId && assignee.periodId !== period.id) {
      throw new ValidationError('Pengurus anggota tidak berada pada periode aktif.')
    }

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
          newData: JSON.stringify({ personType: data.personType, personId: data.personId, departmentId: department.id, positionId: position.id, periodId: period.id, sortOrder: data.sortOrder }),
        },
      })
      return created
    })
  },

  async archiveAssignment(assignmentId: string, adminId: string) {
    const actor = await requireStructureActor(adminId)
    const assignment = await prisma.structureAssignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      select: {
        id: true,
        userId: true,
        memberId: true,
        departmentId: true,
        positionId: true,
        periodId: true,
        period: { select: { status: true, deletedAt: true } },
      },
    })
    if (!assignment) throw new NotFoundError('Penugasan tidak ditemukan.')
    const currentPeriod = await getCurrentStructurePeriod()
    if (!currentPeriod || assignment.periodId !== currentPeriod.id) {
      throw new ValidationError('Penugasan bukan bagian dari periode struktur saat ini.')
    }
    if (assignment.period.status !== 'ACTIVE' || assignment.period.deletedAt) {
      throw new ValidationError('Penugasan periode arsip tidak dapat diubah.')
    }
    await assertStructureUnitScope(actor, assignment.departmentId)

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
