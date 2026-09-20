import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requireAuth } from '@/core/authorization/guards'
import { UnauthorizedError } from '@/core/errors/custom-errors'
import { prisma } from '@/core/database/prisma'
import type { Prisma } from '@prisma/client'

async function currentScope() {
  try {
    const user = await requireAuth()
    if (!isSuperAdminRole(user.roleId) && !isOrganizationAdminRole(user.roleId)) return null
    return { user }
  } catch (error) {
    if (error instanceof UnauthorizedError) return null
    throw error
  }
}

function scopedProgramWhere(scope: NonNullable<Awaited<ReturnType<typeof currentScope>>>, departmentId?: string): Prisma.ProgramWhereInput {
  const scopedDepartmentId = isSuperAdminRole(scope.user.roleId)
    ? departmentId
    : scope.user.departmentId ?? '__no_program_scope__'
  return { ...(scopedDepartmentId ? { departmentId: scopedDepartmentId } : {}), deletedAt: null }
}

const programListInclude = {
  department: true,
  period: true,
  pic: { select: { id: true, fullName: true } },
  _count: { select: { agendas: true } },
} satisfies Prisma.ProgramInclude

export const programQueries = {
  async getProgramWorkspace(requestedPeriodId?: string) {
    const scope = await currentScope()
    if (!scope) return { programs: [], periods: [], activePeriodId: null, selectedPeriodId: null }

    const periods = await prisma.period.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, status: true },
      orderBy: [{ status: 'asc' }, { name: 'desc' }],
    })
    const activePeriodId = periods.find((period) => period.status === 'ACTIVE')?.id ?? null
    const selectedPeriodId = periods.some((period) => period.id === requestedPeriodId)
      ? requestedPeriodId!
      : activePeriodId

    const programs = await prisma.program.findMany({
      where: { ...scopedProgramWhere(scope), ...(selectedPeriodId ? { periodId: selectedPeriodId } : {}) },
      include: programListInclude,
      orderBy: [{ plannedStart: 'asc' }, { name: 'asc' }],
    })

    return { programs, periods, activePeriodId, selectedPeriodId }
  },

  async getPrograms(departmentId?: string) {
    const scope = await currentScope()
    if (!scope) return []
    return prisma.program.findMany({
      where: scopedProgramWhere(scope, departmentId),
      include: programListInclude,
      orderBy: [{ period: { name: 'desc' } }, { createdAt: 'desc' }],
    })
  },

  async getProgramsForCalendar() {
    const scope = await currentScope()
    if (!scope) return []
    return prisma.program.findMany({
      where: scopedProgramWhere(scope),
      include: { department: true, period: true },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    })
  },

  async getProgramById(id: string) {
    const scope = await currentScope()
    if (!scope) return null
    return prisma.program.findFirst({
      where: { id, ...scopedProgramWhere(scope) },
      include: {
        department: true,
        period: true,
        pic: { select: { id: true, fullName: true, membershipStatus: true } },
        relationshipSources: { include: { targetProgram: { select: { id: true, name: true, slug: true, statusOverride: true, plannedStart: true, plannedEnd: true } } } },
        relationshipTargets: { include: { sourceProgram: { select: { id: true, name: true, slug: true, statusOverride: true, plannedStart: true, plannedEnd: true } } } },
      },
    })
  },

  async getProgramFormOptions() {
    const scope = await currentScope()
    if (!scope) return { units: [], periods: [], members: [], programs: [] }
    const [units, periods, members, programs] = await Promise.all([
      prisma.department.findMany({ where: isSuperAdminRole(scope.user.roleId) ? { deletedAt: null, status: 'ACTIVE' } : { id: scope.user.departmentId ?? '__no_unit_scope__', deletedAt: null, status: 'ACTIVE' }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } }),
      prisma.period.findMany({ where: { deletedAt: null, status: 'ACTIVE' }, select: { id: true, name: true, status: true }, orderBy: { name: 'desc' } }),
      prisma.member.findMany({ where: { deletedAt: null }, select: { id: true, fullName: true, membershipStatus: true }, orderBy: { fullName: 'asc' } }),
      prisma.program.findMany({ where: scopedProgramWhere(scope), select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ])
    return { units, periods, members, programs }
  },
}
