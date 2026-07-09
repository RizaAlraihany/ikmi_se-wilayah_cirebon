'use server'

import { auth } from '@/core/auth/auth'
import { eventService } from './services'
import { EventCreateInput, EventUpdateInput } from './schemas'
import { revalidatePath } from 'next/cache'

export async function createEventAction(data: EventCreateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    const event = await eventService.createEvent(data, session.user.id)
    revalidatePath('/admin/events')
    revalidatePath('/dashboard/events')
    return { success: true, event }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function updateEventAction(id: string, data: EventUpdateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    const event = await eventService.updateEvent(id, data, session.user.id)
    revalidatePath('/admin/events')
    revalidatePath(`/admin/events/${id}`)
    revalidatePath('/dashboard/events')
    return { success: true, event }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deleteEventAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await eventService.deleteEvent(id, session.user.id)
    revalidatePath('/admin/events')
    revalidatePath('/dashboard/events')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
