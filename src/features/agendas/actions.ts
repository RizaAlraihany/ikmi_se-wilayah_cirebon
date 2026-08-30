'use server'

import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'
import { requirePermission } from '@/core/authorization/guards'
import { AppError } from '@/core/errors/custom-errors'
import { logger } from '@/core/monitoring/logger'
import { agendaService } from './services'

function revalidateAgendaViews(id?: string) {
  revalidatePath('/admin/agendas')
  revalidatePath('/agenda')
  revalidatePath('/kalender')
  revalidatePath('/')
  if (id) revalidatePath(`/admin/agendas/${id}`)
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? fallback
  if (error instanceof AppError && error.statusCode < 500) return error.message
  logger.error('Agenda action failed', { error })
  return fallback
}

export async function createAgendaAction(input: unknown) {
  try {
    const actor = await requirePermission('calendar.manage')
    const agenda = await agendaService.create(input, actor.id)
    revalidateAgendaViews()
    return { success: true, data: agenda }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal membuat Agenda.') }
  }
}

export async function updateAgendaAction(id: string, input: unknown) {
  try {
    const actor = await requirePermission('calendar.manage')
    const agenda = await agendaService.update(id, input, actor.id)
    revalidateAgendaViews(id)
    return { success: true, data: agenda }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal memperbarui Agenda.') }
  }
}

export async function archiveAgendaAction(id: string) {
  try {
    const actor = await requirePermission('calendar.manage')
    await agendaService.archive(id, actor.id)
    revalidateAgendaViews()
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal mengarsipkan Agenda.') }
  }
}
