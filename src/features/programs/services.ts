import { Prisma } from '@prisma/client'
import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermissionForUser } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import {
  programCreateSchema,
  programRelationshipSchema,
  programStatusOverrideSchema,
  programUpdateSchema,
} from './schemas'

async function requireProgramManager(actorId: string, permission: string) {
  const actor = await requirePermissionForUser(actorId, permission)
  if (!isSuperAdminRole(actor.roleId) && !isOrganizationAdminRole(actor.roleId)) {
    throw new ForbiddenError('Hanya Admin Organisasi yang dapat mengelola Program.')
  }
  return actor
}

async function ensureMemberExists(memberId: string | null | undefined) {
  if (!memberId) return
  const member = await prisma.member.findFirst({ where: { id: memberId, deletedAt: null }, select: { id: true } })
  if (!member) throw new ValidationError('PIC harus memilih anggota yang tersedia.')
}

async function validateProgramReferences(data: {
  organizationalUnitId?: string
  periodId?: string | null
  picId?: string | null
}) {
  const [unit, period] = await Promise.all([
    data.organizationalUnitId
      ? prisma.department.findFirst({ where: { id: data.organizationalUnitId, deletedAt: null, status: 'ACTIVE' }, select: { id: true, periodId: true } })
      : null,
    data.periodId
      ? prisma.period.findFirst({ where: { id: data.periodId, deletedAt: null }, select: { id: true } })
      : null,
    data.picId !== undefined ? ensureMemberExists(data.picId) : null,
  ])
  if (data.organizationalUnitId && !unit) throw new ValidationError('Unit organisasi aktif tidak ditemukan.')
  if (data.periodId && !period) throw new ValidationError('Periode tidak ditemukan.')
  if (unit?.periodId && data.periodId && unit.periodId !== data.periodId) {
    throw new ValidationError('Unit organisasi tidak berada pada periode yang dipilih.')
  }
}

function slugify(value: string) {
  const slug = value
    .toLocaleLowerCase('id-ID')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'program'
}

async function uniqueProgramSlug(name: string) {
  const baseSlug = slugify(name)
  const existing = await prisma.program.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true },
  })
  const used = new Set(existing.flatMap((program) => (program.slug ? [program.slug] : [])))
  if (!used.has(baseSlug)) return baseSlug

  let suffix = 2
  while (used.has(`${baseSlug}-${suffix}`)) suffix += 1
  return `${baseSlug}-${suffix}`
}

async function wouldCreateProgramRelationshipCycle(sourceProgramId: string, targetProgramId: string) {
  const visited = new Set<string>()
  const queue = [targetProgramId]

  while (queue.length) {
    const currentId = queue.shift()!
    if (currentId === sourceProgramId) return true
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const edges = await prisma.programRelationship.findMany({
      where: { sourceProgramId: currentId },
      select: { targetProgramId: true },
    })
    for (const edge of edges) {
      if (!visited.has(edge.targetProgramId)) queue.push(edge.targetProgramId)
    }
  }

  return false
}

export const programService = {
  async create(input: unknown, actorId: string) {
    const actor = await requireProgramManager(actorId, 'program.create')
    const data = programCreateSchema.parse(input)
    await validateProgramReferences(data)
    const slug = await uniqueProgramSlug(data.name)

    return prisma.$transaction(async (tx) => {
      const created = await tx.program.create({
        data: {
          name: data.name,
          slug,
          fullName: data.fullName,
          description: data.description,
          objective: data.objective,
          targetAudience: data.targetAudience,
          method: data.method,
          output: data.output,
          departmentId: data.organizationalUnitId,
          periodId: data.periodId,
          picId: data.picId,
          plannedStart: data.plannedStart,
          plannedEnd: data.plannedEnd,
          location: data.location,
          status: 'DRAFT',
          statusOverride: null,
          budgetPlan: data.plannedBudget === null ? null : new Prisma.Decimal(data.plannedBudget),
          plannedBudget: data.plannedBudget === null ? null : new Prisma.Decimal(data.plannedBudget),
          verificationStatus: 'DRAFT_DATA',
          visibility: data.visibility,
          campaignEnabled: data.campaignEnabled,
          featured: data.featured,
          isFeatured: data.featured,
          requiresRegistration: data.requiresRegistration,
          registrationType: data.requiresRegistration ? data.registrationType : null,
          createdBy: actor.id,
        },
      })
      await tx.auditLog.create({
        data: { action: 'CREATE', entity: 'Program', entityId: created.id, userId: actor.id, newData: JSON.stringify(data) },
      })
      return created
    })
  },

  async update(id: string, input: unknown, actorId: string) {
    const actor = await requireProgramManager(actorId, 'program.update')
    const data = programUpdateSchema.parse(input)
    const current = await prisma.program.findFirst({ where: { id, deletedAt: null } })
    if (!current) throw new NotFoundError('Program tidak ditemukan.')

    await validateProgramReferences({
      organizationalUnitId: data.organizationalUnitId ?? current.departmentId,
      periodId: data.periodId === undefined ? current.periodId : data.periodId,
      picId: data.picId,
    })

    const plannedStart = data.plannedStart === undefined ? current.plannedStart : data.plannedStart
    const plannedEnd = data.plannedEnd === undefined ? current.plannedEnd : data.plannedEnd
    if ((plannedStart === null) !== (plannedEnd === null)) {
      throw new ValidationError('Tanggal mulai dan selesai harus diisi bersamaan.')
    }
    if (plannedStart && plannedEnd && plannedStart > plannedEnd) {
      throw new ValidationError('Tanggal rencana selesai harus setelah tanggal mulai.')
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.program.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.objective !== undefined ? { objective: data.objective } : {}),
          ...(data.targetAudience !== undefined ? { targetAudience: data.targetAudience } : {}),
          ...(data.method !== undefined ? { method: data.method } : {}),
          ...(data.output !== undefined ? { output: data.output } : {}),
          ...(data.organizationalUnitId !== undefined ? { departmentId: data.organizationalUnitId } : {}),
          ...(data.periodId !== undefined ? { periodId: data.periodId } : {}),
          ...(data.picId !== undefined ? { picId: data.picId } : {}),
          ...(data.plannedStart !== undefined ? { plannedStart: data.plannedStart } : {}),
          ...(data.plannedEnd !== undefined ? { plannedEnd: data.plannedEnd } : {}),
          ...(data.location !== undefined ? { location: data.location } : {}),
          ...(data.plannedBudget !== undefined ? {
            plannedBudget: data.plannedBudget === null ? null : new Prisma.Decimal(data.plannedBudget),
            budgetPlan: data.plannedBudget === null ? null : new Prisma.Decimal(data.plannedBudget),
          } : {}),
          ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
          ...(data.campaignEnabled !== undefined ? { campaignEnabled: data.campaignEnabled } : {}),
          ...(data.featured !== undefined ? { featured: data.featured, isFeatured: data.featured } : {}),
          ...(data.requiresRegistration !== undefined ? {
            requiresRegistration: data.requiresRegistration,
            ...(data.requiresRegistration ? {} : { registrationType: null }),
          } : {}),
          ...(data.registrationType !== undefined && data.requiresRegistration !== false ? { registrationType: data.registrationType } : {}),
          updatedBy: actor.id,
        },
      })
      await tx.auditLog.create({
        data: { action: 'UPDATE', entity: 'Program', entityId: id, userId: actor.id, oldData: JSON.stringify(current), newData: JSON.stringify(data) },
      })
      return updated
    })
  },

  async setStatusOverride(id: string, input: unknown, actorId: string) {
    const actor = await requireProgramManager(actorId, 'program.update')
    const data = programStatusOverrideSchema.parse(input)
    const current = await prisma.program.findFirst({ where: { id, deletedAt: null } })
    if (!current) throw new NotFoundError('Program tidak ditemukan.')

    return prisma.$transaction(async (tx) => {
      const updated = await tx.program.update({
        where: { id },
        data: { statusOverride: data.statusOverride, updatedBy: actor.id },
      })
      await tx.auditLog.create({
        data: { action: 'UPDATE', entity: 'Program', entityId: id, userId: actor.id, oldData: JSON.stringify({ statusOverride: current.statusOverride }), newData: JSON.stringify(data) },
      })
      return updated
    })
  },

  async archive(id: string, actorId: string) {
    const actor = await requireProgramManager(actorId, 'program.delete')
    const current = await prisma.program.findFirst({ where: { id, deletedAt: null } })
    if (!current) throw new NotFoundError('Program tidak ditemukan.')

    await prisma.$transaction(async (tx) => {
      await tx.program.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: actor.id } })
      await tx.auditLog.create({
        data: { action: 'ARCHIVE', entity: 'Program', entityId: id, userId: actor.id, oldData: JSON.stringify(current) },
      })
    })
  },

  async linkRelationship(sourceProgramId: string, input: unknown, actorId: string) {
    const actor = await requireProgramManager(actorId, 'program.update')
    const data = programRelationshipSchema.parse(input)
    if (sourceProgramId === data.targetProgramId) throw new ValidationError('Program tidak dapat dihubungkan dengan dirinya sendiri.')
    const [source, target] = await Promise.all([
      prisma.program.findFirst({ where: { id: sourceProgramId, deletedAt: null } }),
      prisma.program.findFirst({ where: { id: data.targetProgramId, deletedAt: null }, select: { id: true } }),
    ])
    if (!source || !target) throw new NotFoundError('Program terkait tidak ditemukan.')
    if (await wouldCreateProgramRelationshipCycle(sourceProgramId, data.targetProgramId)) {
      throw new ValidationError('Hubungan ini membentuk siklus program dan tidak dapat disimpan.')
    }

    return prisma.$transaction(async (tx) => {
      const relationship = await tx.programRelationship.upsert({
        where: { sourceProgramId_targetProgramId_relationshipType: { sourceProgramId, targetProgramId: data.targetProgramId, relationshipType: data.relationshipType } },
        update: { note: data.note },
        create: { sourceProgramId, targetProgramId: data.targetProgramId, relationshipType: data.relationshipType, note: data.note },
      })
      await tx.auditLog.create({
        data: { action: 'UPDATE', entity: 'ProgramRelationship', entityId: relationship.id, userId: actor.id, newData: JSON.stringify(data) },
      })
      return relationship
    })
  },
}
