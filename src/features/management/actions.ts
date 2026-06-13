'use server'

import { auth } from '@/core/auth/auth'
import { prisma } from '@/core/database/prisma'
import { revalidatePath } from 'next/cache'
import { updatePengurusSchema, UpdatePengurusInput } from './schemas'

export async function updatePengurusAction(id: string, input: UpdatePengurusInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak atau sesi habis.' }

    const validated = updatePengurusSchema.parse(input)

    const current = await prisma.user.findUnique({ where: { id } })
    if (!current) return { error: 'Pengurus tidak ditemukan.' }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...validated,
        updatedBy: session.user.id,
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
        userId: session.user.id,
      },
    })

    revalidatePath('/admin/management')
    revalidatePath(`/admin/management/${id}`)
    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deletePengurusAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak atau sesi habis.' }

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
        updatedBy: session.user.id,
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
        userId: session.user.id,
      },
    })

    revalidatePath('/admin/management')
    revalidatePath(`/admin/management/${id}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
