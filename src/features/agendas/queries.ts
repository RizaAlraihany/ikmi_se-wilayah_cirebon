import { requireAuth } from '@/core/authorization/guards'
import { can } from '@/core/authorization/rbac'
import { prisma } from '@/core/database/prisma'
import { UnauthorizedError } from '@/core/errors/custom-errors'
import type { Prisma } from '@prisma/client'

async function agendaScope() {
  try {
    const user = await requireAuth()
    return {
      user,
      isGlobal: (await can('system.manage', user)) || (await can('lpj.verify_bph', user)),
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) return null
    throw error
  }
}

function agendaWhere(scope: NonNullable<Awaited<ReturnType<typeof agendaScope>>>): Prisma.AgendaWhereInput {
  if (scope.isGlobal) return { deletedAt: null }
  return scope.user.departmentId
    ? { deletedAt: null, organizationalUnitId: scope.user.departmentId }
    : { id: '__no_agenda_scope__' }
}

const agendaListInclude = {
  organizationalUnit: { select: { id: true, name: true } },
  period: { select: { id: true, name: true, status: true } },
  program: { select: { id: true, name: true } },
  relativeToProgram: { select: { id: true, name: true, actualEnd: true } },
} satisfies Prisma.AgendaInclude

export const agendaQueries = {
  async getAgendas() {
    const scope = await agendaScope()
    if (!scope) return []
    return prisma.agenda.findMany({
      where: agendaWhere(scope),
      include: agendaListInclude,
      orderBy: [{ startDatetime: 'asc' }, { name: 'asc' }],
    })
  },

  async getAgendaById(id: string) {
    const scope = await agendaScope()
    if (!scope) return null
    return prisma.agenda.findFirst({
      where: { id, ...agendaWhere(scope) },
      include: {
        ...agendaListInclude,
        pic: { select: { id: true, fullName: true } },
      },
    })
  },

  async getFormOptions() {
    const scope = await agendaScope()
    if (!scope) return { units: [], periods: [], members: [], programs: [] }
    const unitWhere: Prisma.DepartmentWhereInput = scope.isGlobal
      ? { deletedAt: null, status: 'ACTIVE' }
      : { id: scope.user.departmentId ?? '__no_unit_scope__', deletedAt: null, status: 'ACTIVE' }
    const programWhere: Prisma.ProgramWhereInput = scope.isGlobal
      ? { deletedAt: null }
      : { deletedAt: null, departmentId: scope.user.departmentId ?? '__no_unit_scope__' }

    const [units, periods, members, programs] = await Promise.all([
      prisma.department.findMany({ where: unitWhere, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.period.findMany({ where: { deletedAt: null }, select: { id: true, name: true, status: true }, orderBy: { name: 'desc' } }),
      prisma.member.findMany({ where: { deletedAt: null }, select: { id: true, fullName: true, membershipStatus: true }, orderBy: { fullName: 'asc' } }),
      prisma.program.findMany({ where: programWhere, select: { id: true, name: true, actualEnd: true }, orderBy: { name: 'asc' } }),
    ])
    return { units, periods, members, programs }
  },
}
