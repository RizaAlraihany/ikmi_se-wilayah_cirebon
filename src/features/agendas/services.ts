import { requirePermissionForUser, requireRoleForUser } from '@/core/authorization/guards'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { type SessionUser } from '@/core/authorization/rbac'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { agendaSchema, type AgendaInput } from './schemas'

async function requireAgendaActor(actorId: string) {
  const actor = await requireRoleForUser(actorId, ORGANIZATION_DASHBOARD_ROLE_IDS)
  return requirePermissionForUser(actor, 'calendar.manage')
}

async function assertAgendaUnitScope(actor: SessionUser, organizationalUnitId: string) {
  // Agenda ownership follows the canonical role boundary. Legacy broad
  // permissions must not turn an organization administrator into a
  // cross-unit actor; only Super Admin is global.
  const isGlobal = actor.roleId === 'super_admin'
  if (!isGlobal && actor.departmentId !== organizationalUnitId) {
    throw new ForbiddenError('Anda hanya dapat mengelola Agenda unit organisasi Anda.')
  }
}

async function validateReferences(data: AgendaInput) {
  const [unit, period, pic, program, relativeProgram] = await Promise.all([
    prisma.department.findFirst({
      where: { id: data.organizationalUnitId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, periodId: true },
    }),
    prisma.period.findFirst({ where: { id: data.periodId, deletedAt: null }, select: { id: true } }),
    data.picId
      ? prisma.member.findFirst({ where: { id: data.picId, deletedAt: null }, select: { id: true, periodId: true } })
      : null,
    data.programId
      ? prisma.program.findFirst({ where: { id: data.programId, deletedAt: null }, select: { id: true, periodId: true } })
      : null,
    data.relativeToProgramId
      ? prisma.program.findFirst({ where: { id: data.relativeToProgramId, deletedAt: null }, select: { id: true, periodId: true, actualEnd: true } })
      : null,
  ])

  if (!unit) throw new ValidationError('Unit organisasi aktif tidak ditemukan.')
  if (!period) throw new ValidationError('Periode tidak ditemukan.')
  if (unit.periodId && unit.periodId !== data.periodId) {
    throw new ValidationError('Unit organisasi tidak berada pada periode yang dipilih.')
  }
  if (data.picId && !pic) throw new ValidationError('PIC anggota tidak ditemukan.')
  if (pic?.periodId && pic.periodId !== data.periodId) {
    throw new ValidationError('PIC tidak berada pada periode yang dipilih.')
  }
  if (data.programId && !program) throw new ValidationError('Program terkait tidak ditemukan.')
  if (program?.periodId && program.periodId !== data.periodId) {
    throw new ValidationError('Program terkait tidak berada pada periode yang dipilih.')
  }
  if (data.relativeToProgramId && !relativeProgram) throw new ValidationError('Program pemicu tidak ditemukan.')
  if (relativeProgram?.periodId && relativeProgram.periodId !== data.periodId) {
    throw new ValidationError('Program pemicu tidak berada pada periode yang dipilih.')
  }

  return { relativeProgram }
}

function normalizedStatus(data: AgendaInput, relativeProgram: { actualEnd: Date | null } | null) {
  if (data.status === 'DRAFT' || data.status === 'POSTPONED' || data.status === 'CANCELLED') return data.status
  if (data.scheduleType === 'CONDITIONAL') return 'UNSCHEDULED' as const
  if (data.scheduleType === 'RELATIVE_TO_PROGRAM' || data.scheduleType === 'DEPENDENT_ON_PROGRAM') {
    return relativeProgram?.actualEnd ? 'SCHEDULED' as const : 'UNSCHEDULED' as const
  }
  return data.startDatetime ? 'SCHEDULED' as const : 'UNSCHEDULED' as const
}

function storageData(data: AgendaInput, relativeProgram: { actualEnd: Date | null } | null) {
  const fixed = data.scheduleType === 'FIXED_DATE'
  const recurring = data.scheduleType === 'RECURRING'
  const conditional = data.scheduleType === 'CONDITIONAL'
  const relative = data.scheduleType === 'RELATIVE_TO_PROGRAM' || data.scheduleType === 'DEPENDENT_ON_PROGRAM'

  return {
    name: data.name,
    organizationalUnitId: data.organizationalUnitId,
    periodId: data.periodId,
    description: data.description,
    picId: data.picId,
    programId: data.programId,
    scheduleType: data.scheduleType,
    startDatetime: fixed || recurring ? data.startDatetime : null,
    endDatetime: fixed || recurring ? data.endDatetime : null,
    recurrenceRule: recurring ? data.recurrenceRule : null,
    relativeToProgramId: relative ? data.relativeToProgramId : null,
    relativeOffset: relative ? (data.relativeOffset ?? 0) : null,
    conditionalNote: conditional ? data.conditionalNote : null,
    location: data.location,
    visibility: data.visibility,
    status: normalizedStatus(data, relativeProgram),
    requiresRegistration: data.requiresRegistration,
    registrationType: data.requiresRegistration ? data.registrationType : null,
  }
}

export function agendaSlugFromName(value: string) {
  const slug = value
    .toLocaleLowerCase('id-ID')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'agenda'
}

async function uniqueAgendaSlug(name: string) {
  const baseSlug = agendaSlugFromName(name)
  const existing = await prisma.agenda.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true },
  }) ?? []
  const used = new Set(existing.map((agenda) => agenda.slug))
  if (!used.has(baseSlug)) return baseSlug

  let suffix = 2
  while (used.has(`${baseSlug}-${suffix}`)) suffix += 1
  return `${baseSlug}-${suffix}`
}

export const agendaService = {
  async create(input: unknown, actorId: string) {
    const actor = await requireAgendaActor(actorId)
    const data = agendaSchema.parse(input)
    await assertAgendaUnitScope(actor, data.organizationalUnitId)
    const references = await validateReferences(data)
    const stored = storageData(data, references.relativeProgram)
    const slug = await uniqueAgendaSlug(data.name)

    return prisma.$transaction(async (tx) => {
      const agenda = await tx.agenda.create({ data: { ...stored, slug } })
      await tx.auditLog.create({
        data: { action: 'CREATE', entity: 'Agenda', entityId: agenda.id, userId: actor.id, newData: JSON.stringify(stored) },
      })
      return agenda
    })
  },

  async update(id: string, input: unknown, actorId: string) {
    const actor = await requireAgendaActor(actorId)
    const data = agendaSchema.parse(input)
    const current = await prisma.agenda.findFirst({ where: { id, deletedAt: null } })
    if (!current) throw new NotFoundError('Agenda tidak ditemukan.')

    await assertAgendaUnitScope(actor, current.organizationalUnitId ?? data.organizationalUnitId)
    if (data.organizationalUnitId !== current.organizationalUnitId) {
      await assertAgendaUnitScope(actor, data.organizationalUnitId)
    }
    const references = await validateReferences(data)
    const stored = storageData(data, references.relativeProgram)

    return prisma.$transaction(async (tx) => {
      const agenda = await tx.agenda.update({ where: { id }, data: stored })
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Agenda',
          entityId: id,
          userId: actor.id,
          oldData: JSON.stringify(current),
          newData: JSON.stringify(stored),
        },
      })
      return agenda
    })
  },

  async archive(id: string, actorId: string) {
    const actor = await requireAgendaActor(actorId)
    const current = await prisma.agenda.findFirst({ where: { id, deletedAt: null } })
    if (!current) throw new NotFoundError('Agenda tidak ditemukan.')
    await assertAgendaUnitScope(actor, current.organizationalUnitId ?? '')

    await prisma.$transaction(async (tx) => {
      await tx.agenda.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: new Date() } })
      await tx.auditLog.create({
        data: { action: 'ARCHIVE', entity: 'Agenda', entityId: id, userId: actor.id, oldData: JSON.stringify(current) },
      })
    })
  },
}
