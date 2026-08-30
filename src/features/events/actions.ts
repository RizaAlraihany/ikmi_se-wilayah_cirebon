'use server'

import { requirePermission } from '@/core/authorization/guards'
import { eventService } from './services'
import { EventCreateInput, EventUpdateInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { safeActionError } from '@/core/errors/safe-action-error'

export async function createEventAction(data: EventCreateInput) {
  try {
    const actor = await requirePermission('event.create')
    const event = await eventService.createEvent(data, actor.id)
    revalidatePath('/admin/events')
    revalidatePath('/dashboard/events')
    return { success: true, event }
  } catch (error) {
    return { error: safeActionError(error, 'Event belum dapat dibuat.', 'event.create') }
  }
}

export async function updateEventAction(id: string, data: EventUpdateInput) {
  try {
    const actor = await requirePermission('event.update')
    const event = await eventService.updateEvent(id, data, actor.id)
    revalidatePath('/admin/events')
    revalidatePath(`/admin/events/${id}`)
    revalidatePath('/dashboard/events')
    return { success: true, event }
  } catch (error) {
    return { error: safeActionError(error, 'Event belum dapat diperbarui.', 'event.update') }
  }
}

export async function deleteEventAction(id: string) {
  try {
    const actor = await requirePermission('event.delete')
    await eventService.deleteEvent(id, actor.id)
    revalidatePath('/admin/events')
    revalidatePath('/dashboard/events')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Event belum dapat dihapus.', 'event.delete') }
  }
}
