'use server'

import { auth } from '@/core/auth/auth'
import { notificationService } from './services'
import { revalidatePath } from 'next/cache'
import { cache } from '@/core/cache/cache'

export async function markNotificationReadAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await notificationService.markSingleRead(id, session.user.id)
    await cache.del(`notif_count:${session.user.id}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await notificationService.markAllRead(session.user.id)
    await cache.del(`notif_count:${session.user.id}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
