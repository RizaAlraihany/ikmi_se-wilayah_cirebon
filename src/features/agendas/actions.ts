'use server'

import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'
import { requirePermission, requireRoleForUser } from '@/core/authorization/guards'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { AppError } from '@/core/errors/custom-errors'
import { logger } from '@/core/monitoring/logger'
import { agendaService } from './services'

function revalidateAgendaViews(id?: string) {
  revalidatePath('/admin/agendas')
  revalidatePath('/kegiatan')
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

async function requireAgendaMutationActor() {
  const actor = await requirePermission('calendar.manage')
  return requireRoleForUser(actor, ORGANIZATION_DASHBOARD_ROLE_IDS)
}

export async function createAgendaAction(input: unknown) {
  try {
    const actor = await requireAgendaMutationActor()
    const agenda = await agendaService.create(input, actor.id)
    revalidateAgendaViews()
    return { success: true, data: agenda }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal membuat Agenda.') }
  }
}

export async function updateAgendaAction(id: string, input: unknown) {
  try {
    const actor = await requireAgendaMutationActor()
    const agenda = await agendaService.update(id, input, actor.id)
    revalidateAgendaViews(id)
    return { success: true, data: agenda }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal memperbarui Agenda.') }
  }
}

export async function archiveAgendaAction(id: string) {
  try {
    const actor = await requireAgendaMutationActor()
    await agendaService.archive(id, actor.id)
    revalidateAgendaViews()
    return { success: true }
  } catch (error) {
    return { success: false, error: errorMessage(error, 'Gagal mengarsipkan Agenda.') }
  }
}
