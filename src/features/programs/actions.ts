'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'
import { auth } from '@/core/auth/auth'
import { can } from '@/core/authorization/rbac'
import type { SessionUser } from '@/core/authorization/rbac'

async function isDepartmentOwner(user: SessionUser, departmentId: string) {
  const isGlobal = await can('system.manage', user) || await can('lpj.verify_bph', user)
  return isGlobal || user.departmentId === departmentId
}

function getSessionUser(user: { id?: string; roleId: string; departmentId: string | null; positionId: string | null }): SessionUser {
  if (!user.id) {
    throw new Error('Unauthorized')
  }
  return {
    id: user.id,
    roleId: user.roleId,
    departmentId: user.departmentId,
    positionId: user.positionId,
  }
}

export async function createProgramAction(data: { name: string; departmentId: string; budgetPlan: number; description: string }) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)

    const hasAccess = await can('program.create', user)
    if (!hasAccess) throw new Error('Forbidden: Cannot create program')

    const isOwner = await isDepartmentOwner(user, data.departmentId)
    if (!isOwner) {
      throw new Error('Forbidden: Cannot create program for other department')
    }

    const program = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const p = await tx.program.create({
        data: {
          name: data.name,
          departmentId: data.departmentId,
          budgetPlan: data.budgetPlan,
          description: data.description,
          status: 'PLANNED',
          createdBy: user.id
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Program',
          entityId: p.id,
          userId: user.id,
          newData: JSON.stringify(p)
        }
      })

      return p
    })

    revalidatePath('/dashboard/programs')
    return { success: true, data: program }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updateProgramAction(id: string, data: { name?: string; budgetPlan?: number; description?: string; status?: 'PLANNED' | 'ONGOING' | 'COMPLETED' }) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)

    const hasAccess = await can('program.update', user)
    if (!hasAccess) throw new Error('Forbidden: Cannot update program')

    const existing = await prisma.program.findUnique({ where: { id } })
    if (!existing) throw new Error('Program not found')

    const isOwner = await isDepartmentOwner(user, existing.departmentId)
    if (!isOwner) {
      throw new Error('Forbidden: Cannot update program for other department')
    }

    const program = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const p = await tx.program.update({
        where: { id },
        data: { ...data, updatedBy: user.id }
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Program',
          entityId: p.id,
          userId: user.id,
          oldData: JSON.stringify(existing),
          newData: JSON.stringify(p)
        }
      })

      return p
    })

    revalidatePath('/dashboard/programs')
    revalidatePath(`/dashboard/programs/${id}`)
    return { success: true, data: program }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteProgramAction(id: string) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)

    const hasAccess = await can('program.delete', user)
    if (!hasAccess) throw new Error('Forbidden: Cannot delete program')

    const existing = await prisma.program.findUnique({ where: { id } })
    if (!existing) throw new Error('Program not found')

    const isOwner = await isDepartmentOwner(user, existing.departmentId)
    if (!isOwner) {
      throw new Error('Forbidden: Cannot delete program for other department')
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.program.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: user.id }
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Program',
          entityId: id,
          userId: user.id,
          oldData: JSON.stringify(existing),
          newData: JSON.stringify({ deletedAt: new Date() })
        }
      })
    })

    revalidatePath('/dashboard/programs')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Activity Actions
export async function createActivityAction(data: { programId: string; name: string; description?: string }) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)

    const hasAccess = await can('program.update', user)
    if (!hasAccess) throw new Error('Forbidden: Cannot manage activities')

    const existing = await prisma.program.findUnique({ where: { id: data.programId } })
    if (!existing) throw new Error('Program not found')

    const isOwner = await isDepartmentOwner(user, existing.departmentId)
    if (!isOwner) {
      throw new Error('Forbidden: Cannot manage activities for other department')
    }

    const activity = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const a = await tx.activity.create({
        data: {
          programId: data.programId,
          name: data.name,
          description: data.description,
          status: 'PLANNED',
          createdBy: user.id
        }
      })

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Activity',
          entityId: a.id,
          userId: user.id,
          newData: JSON.stringify(a)
        }
      })

      return a
    })

    revalidatePath(`/dashboard/programs/${data.programId}`)
    return { success: true, data: activity }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updateActivityAction(id: string, data: { name?: string; description?: string; status?: 'PLANNED' | 'ONGOING' | 'COMPLETED' }) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)

    const hasAccess = await can('program.update', user)
    if (!hasAccess) throw new Error('Forbidden: Cannot manage activities')

    const existing = await prisma.activity.findUnique({ where: { id }, include: { program: true } })
    if (!existing) throw new Error('Activity not found')

    const isOwner = await isDepartmentOwner(user, existing.program.departmentId)
    if (!isOwner) {
      throw new Error('Forbidden: Cannot manage activities for other department')
    }

    const activity = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const a = await tx.activity.update({
        where: { id },
        data: { ...data, updatedBy: user.id }
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Activity',
          entityId: a.id,
          userId: user.id,
          oldData: JSON.stringify(existing),
          newData: JSON.stringify(a)
        }
      })

      return a
    })

    revalidatePath(`/dashboard/programs/${existing.programId}`)
    return { success: true, data: activity }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteActivityAction(id: string) {
  try {
    const session = await auth()
    if (!session || !session.user) throw new Error('Unauthorized')
    const user = getSessionUser(session.user)

    const hasAccess = await can('program.update', user)
    if (!hasAccess) throw new Error('Forbidden: Cannot manage activities')

    const existing = await prisma.activity.findUnique({ where: { id }, include: { program: true } })
    if (!existing) throw new Error('Activity not found')

    const isOwner = await isDepartmentOwner(user, existing.program.departmentId)
    if (!isOwner) {
      throw new Error('Forbidden: Cannot manage activities for other department')
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.activity.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: user.id }
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Activity',
          entityId: id,
          userId: user.id,
          oldData: JSON.stringify(existing),
          newData: JSON.stringify({ deletedAt: new Date() })
        }
      })
    })

    revalidatePath(`/dashboard/programs/${existing.programId}`)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
