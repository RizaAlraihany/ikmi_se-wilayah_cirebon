'use server'

import { auth } from '@/core/auth/auth'
import { notificationService } from './services'
import { revalidatePath } from 'next/cache'
import { notificationPreferenceSchema } from './schemas'

export async function markNotificationReadAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await notificationService.markSingleRead(id, session.user.id)
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
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function markNotificationUnreadAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await notificationService.markSingleUnread(id, session.user.id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await notificationService.deleteNotification(id, session.user.id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    const parsed = notificationPreferenceSchema.parse({
      system: formData.get('system') === 'on',
      workflow: formData.get('workflow') === 'on',
      membership: formData.get('membership') === 'on',
      finance: formData.get('finance') === 'on',
      lpj: formData.get('lpj') === 'on',
      cms: formData.get('cms') === 'on',
      letters: formData.get('letters') === 'on',
    })

    await notificationService.updatePreferences(session.user.id, parsed)
    revalidatePath('/dashboard/admin/notifications')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
