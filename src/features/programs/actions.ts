'use server'

import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'
import { requirePermission } from '@/core/authorization/guards'
import { AppError } from '@/core/errors/custom-errors'
import { logger } from '@/core/monitoring/logger'
import { programService } from './services'

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? fallback
  if (error instanceof AppError && error.statusCode < 500) return error.message
  logger.error('Program action failed', { error })
  return fallback
}

export async function createProgramAction(data: unknown) {
  try {
    const actor = await requirePermission('program.create')
    const program = await programService.create(data, actor.id)
    revalidatePath('/admin/programs')
    return { success: true, data: program }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal membuat program.') }
  }
}

export async function updateProgramAction(id: string, data: unknown) {
  try {
    const actor = await requirePermission('program.update')
    const program = await programService.update(id, data, actor.id)
    revalidatePath('/admin/programs')
    revalidatePath(`/admin/programs/${id}`)
    return { success: true, data: program }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal memperbarui program.') }
  }
}

export async function updateProgramStatusOverrideAction(id: string, data: unknown) {
  try {
    const actor = await requirePermission('program.update')
    const program = await programService.setStatusOverride(id, data, actor.id)
    revalidatePath('/admin/programs')
    revalidatePath(`/admin/programs/${id}`)
    return { success: true, data: program }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal mengubah status program.') }
  }
}

export async function archiveProgramAction(id: string) {
  try {
    const actor = await requirePermission('program.delete')
    await programService.archive(id, actor.id)
    revalidatePath('/admin/programs')
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal mengarsipkan program.') }
  }
}

export async function linkProgramRelationshipAction(sourceProgramId: string, data: unknown) {
  try {
    const actor = await requirePermission('program.update')
    await programService.linkRelationship(sourceProgramId, data, actor.id)
    revalidatePath(`/admin/programs/${sourceProgramId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal menghubungkan program.') }
  }
}
