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

function scopedProgramWhere(_scope: NonNullable<Awaited<ReturnType<typeof currentScope>>>, departmentId?: string): Prisma.ProgramWhereInput {
  return { ...(departmentId ? { departmentId } : {}), deletedAt: null }
}

const programListInclude = {
  department: true,
  period: true,
  pic: { select: { id: true, fullName: true } },
  _count: { select: { agendas: true } },
} satisfies Prisma.ProgramInclude

export const programQueries = {
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
      prisma.department.findMany({ where: { deletedAt: null, status: 'ACTIVE' }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } }),
      prisma.period.findMany({ where: { deletedAt: null }, select: { id: true, name: true, status: true }, orderBy: { name: 'desc' } }),
      prisma.member.findMany({ where: { deletedAt: null }, select: { id: true, fullName: true, membershipStatus: true }, orderBy: { fullName: 'asc' } }),
      prisma.program.findMany({ where: scopedProgramWhere(scope), select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ])
    return { units, periods, members, programs }
  },
}
