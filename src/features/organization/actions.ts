'use server'

import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { revalidatePath } from 'next/cache'
import {
  organizationalPositionSchema,
  organizationalUnitSchema,
  periodSchema,
  type OrganizationalPositionInput,
  type OrganizationalUnitInput,
  type PeriodInput,
} from './schemas'
import { safeActionError } from '@/core/errors/safe-action-error'

function revalidateOrganizationViews() {
  revalidatePath('/admin/organization')
  revalidatePath('/admin/management')
  revalidatePath('/admin/programs')
  revalidatePath('/admin/agendas')
}

export async function createPeriodAction(input: PeriodInput) {
  try {
    const actor = await requirePermission('organization.update')
    const data = periodSchema.parse(input)

    const period = await prisma.$transaction(async (tx) => {
      if (data.status === 'ACTIVE') {
        await tx.period.updateMany({
          where: { status: 'ACTIVE', deletedAt: null },
          data: { status: 'ARCHIVED' },
        })
      }

      const created = await tx.period.create({ data })
      await tx.auditLog.create({
        data: { action: 'CREATE', entity: 'Period', entityId: created.id, userId: actor.id, newData: JSON.stringify(data) },
      })
      return created
    })

    revalidateOrganizationViews()
    return { success: true, data: period }
  } catch (error) {
    return { error: safeActionError(error, 'Periode belum dapat dibuat.', 'organization.period_create') }
  }
}

export async function updatePeriodAction(id: string, input: PeriodInput) {
  try {
    const actor = await requirePermission('organization.update')
    const data = periodSchema.parse(input)
    const current = await prisma.period.findFirst({ where: { id, deletedAt: null } })
    if (!current) return { error: 'Periode tidak ditemukan.' }

    const period = await prisma.$transaction(async (tx) => {
      if (data.status === 'ACTIVE') {
        await tx.period.updateMany({
          where: { id: { not: id }, status: 'ACTIVE', deletedAt: null },
          data: { status: 'ARCHIVED' },
        })
      }

      const updated = await tx.period.update({ where: { id }, data })
      await tx.auditLog.create({
        data: { action: 'UPDATE', entity: 'Period', entityId: id, userId: actor.id, oldData: JSON.stringify(current), newData: JSON.stringify(data) },
      })
      return updated
    })

    revalidateOrganizationViews()
    return { success: true, data: period }
  } catch (error) {
    return { error: safeActionError(error, 'Periode belum dapat diperbarui.', 'organization.period_update') }
  }
}

export async function createOrganizationalUnitAction(input: OrganizationalUnitInput) {
  try {
    const actor = await requirePermission('organization.update')
    const data = organizationalUnitSchema.parse(input)
    const duplicate = await prisma.department.findFirst({ where: { code: data.code, deletedAt: null }, select: { id: true } })
    if (duplicate) return { error: 'Kode unit organisasi sudah digunakan.' }

    const unit = await prisma.$transaction(async (tx) => {
      const created = await tx.department.create({ data: { ...data, createdBy: actor.id } })
      await tx.auditLog.create({
        data: { action: 'CREATE', entity: 'OrganizationalUnit', entityId: created.id, userId: actor.id, newData: JSON.stringify(data) },
      })
      return created
    })

    revalidateOrganizationViews()
    return { success: true, data: unit }
  } catch (error) {
    return { error: safeActionError(error, 'Unit organisasi belum dapat dibuat.', 'organization.unit_create') }
  }
}

export async function updateOrganizationalUnitAction(id: string, input: OrganizationalUnitInput) {
  try {
    const actor = await requirePermission('organization.update')
    const data = organizationalUnitSchema.parse(input)
    const current = await prisma.department.findFirst({ where: { id, deletedAt: null } })
    if (!current) return { error: 'Unit organisasi tidak ditemukan.' }

    const duplicate = await prisma.department.findFirst({
      where: { id: { not: id }, code: data.code, deletedAt: null },
      select: { id: true },
    })
    if (duplicate) return { error: 'Kode unit organisasi sudah digunakan.' }

    const unit = await prisma.$transaction(async (tx) => {
      const updated = await tx.department.update({ where: { id }, data: { ...data, updatedBy: actor.id } })
      await tx.auditLog.create({
        data: { action: 'UPDATE', entity: 'OrganizationalUnit', entityId: id, userId: actor.id, oldData: JSON.stringify(current), newData: JSON.stringify(data) },
      })
      return updated
    })

    revalidateOrganizationViews()
    return { success: true, data: unit }
  } catch (error) {
    return { error: safeActionError(error, 'Unit organisasi belum dapat diperbarui.', 'organization.unit_update') }
  }
}

export async function createOrganizationalPositionAction(input: OrganizationalPositionInput) {
  try {
    const actor = await requirePermission('organization.update')
    const data = organizationalPositionSchema.parse(input)
    const position = await prisma.$transaction(async (tx) => {
      const created = await tx.position.create({ data: { ...data, createdBy: actor.id } })
      await tx.auditLog.create({
        data: { action: 'CREATE', entity: 'Position', entityId: created.id, userId: actor.id, newData: JSON.stringify(data) },
      })
      return created
    })
    revalidateOrganizationViews()
    return { success: true, data: position }
  } catch (error) {
    return { error: safeActionError(error, 'Jabatan belum dapat dibuat.', 'organization.position_create') }
  }
}

export async function archiveOrganizationalPositionAction(id: string) {
  try {
    const actor = await requirePermission('organization.update')
    const position = await prisma.position.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { users: { where: { deletedAt: null, isActive: true } } } } },
    })
    if (!position) return { error: 'Jabatan tidak ditemukan.' }
    if (position._count.users > 0) return { error: 'Jabatan masih digunakan pengurus aktif dan tidak dapat diarsipkan.' }

    await prisma.$transaction([
      prisma.position.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: actor.id } }),
      prisma.auditLog.create({ data: { action: 'ARCHIVE', entity: 'Position', entityId: id, userId: actor.id, oldData: JSON.stringify(position) } }),
    ])
    revalidateOrganizationViews()
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Jabatan belum dapat diarsipkan.', 'organization.position_archive') }
  }
}
