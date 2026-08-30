'use server'

import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { revalidatePath } from 'next/cache'
import { safeActionError } from '@/core/errors/safe-action-error'
import { updatePengurusSchema, UpdatePengurusInput } from './schemas'

export async function updatePengurusAction(id: string, input: UpdatePengurusInput) {
  try {
    const actor = await requirePermission('user.update')
    const validated = updatePengurusSchema.parse(input)

    const current = await prisma.user.findUnique({ where: { id } })
    if (!current) return { error: 'Pengurus tidak ditemukan.' }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...validated,
        ...(validated.isActive !== undefined && validated.isActive !== current.isActive
          ? { sessionVersion: { increment: 1 } }
          : {}),
        updatedBy: actor.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        oldData: JSON.stringify({
          name: current.name,
          isActive: current.isActive,
          positionId: current.positionId,
          departmentId: current.departmentId,
        }),
        newData: JSON.stringify(validated),
        userId: actor.id,
      },
    })

    revalidatePath('/admin/management')
    revalidatePath(`/admin/management/${id}`)
    return { success: true, data: updated }
  } catch (error) {
    return { error: safeActionError(error, 'Data pengurus belum dapat diperbarui.', 'management.update') }
  }
}

export async function deletePengurusAction(id: string) {
  try {
    const actor = await requirePermission('user.delete')
    if (id === actor.id) return { error: 'Anda tidak dapat menonaktifkan akun sendiri.' }

    const current = await prisma.user.findUnique({
      where: { id },
      include: { role: true, department: true, position: true },
    })
    if (!current || current.deletedAt) return { error: 'Pengurus tidak ditemukan.' }

    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        departmentId: null,
        positionId: null,
        sessionVersion: { increment: 1 },
        updatedBy: actor.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        oldData: JSON.stringify({
          name: current.name,
          isActive: current.isActive,
          roleId: current.roleId,
          departmentId: current.departmentId,
          positionId: current.positionId,
        }),
        newData: JSON.stringify({
          isActive: false,
          departmentId: null,
          positionId: null,
        }),
        userId: actor.id,
      },
    })

    revalidatePath('/admin/management')
    revalidatePath(`/admin/management/${id}`)
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Role pengurus belum dapat diperbarui.', 'management.role_update') }
  }
}
